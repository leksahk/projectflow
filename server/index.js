const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const PROJECT_STATUSES = ['planning', 'active', 'done'];
const TASK_STATUSES = ['todo', 'doing', 'done'];

async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const d = await admin.auth().verifyIdToken(token);
    req.user = { uid: d.uid, email: d.email };
    next();
  } catch {
    res.status(401).json({ error: 'Потрібно увійти в акаунт' });
  }
}

function clean(body, statuses) {
  const title = String(body.title || '').trim();
  if (!title || title.length > 100) return { error: 'Назва обовʼязкова (до 100 символів)' };
  const status = body.status || statuses[0];
  if (!statuses.includes(status)) return { error: 'Недопустимий статус' };
  const deadline = body.deadline || '';
  if (deadline && isNaN(Date.parse(deadline))) return { error: 'Некоректна дата' };
  return { data: { title, status, deadline, description: String(body.description || '').slice(0, 500) } };
}

async function loadWithCounts(uid) {
  const [ps, ts] = await Promise.all([
    db.collection('projects').where('ownerId', '==', uid).get(),
    db.collection('tasks').where('ownerId', '==', uid).get(),
  ]);
  const counts = {};
  ts.docs.forEach((t) => {
    const { projectId, status } = t.data();
    counts[projectId] = counts[projectId] || { todo: 0, doing: 0, done: 0 };
    counts[projectId][status]++;
  });
  const projects = ps.docs
    .map((d) => ({ id: d.id, ...d.data(), counts: counts[d.id] || { todo: 0, doing: 0, done: 0 } }))
    .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  return { projects, tasks: ts.docs.map((d) => ({ id: d.id, ...d.data() })) };
}

app.get('/api/projects', auth, async (req, res) => {
  try { res.json((await loadWithCounts(req.user.uid)).projects); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects', auth, async (req, res) => {
  const { data, error } = clean(req.body, PROJECT_STATUSES);
  if (error) return res.status(400).json({ error });
  const ref = await db.collection('projects').add({
    ...data, ownerId: req.user.uid, ownerEmail: req.user.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  res.status(201).json({ id: ref.id, ...data });
});

app.put('/api/projects/:id', auth, async (req, res) => {
  const ref = db.collection('projects').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const { data, error } = clean(req.body, PROJECT_STATUSES);
  if (error) return res.status(400).json({ error });
  await ref.update(data);
  res.json({ id: ref.id, ...data });
});

app.delete('/api/projects/:id', auth, async (req, res) => {
  const ref = db.collection('projects').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const tasks = await db.collection('tasks').where('projectId', '==', ref.id).get();
  const batch = db.batch();
  tasks.docs.forEach((t) => batch.delete(t.ref));
  (await db.collection('members').where('projectId', '==', ref.id).get()).docs.forEach((m) => batch.delete(m.ref));
  batch.delete(ref);
  await batch.commit();
  res.status(204).end();
});

app.get('/api/stats', auth, async (req, res) => {
  try {
    const { projects, tasks } = await loadWithCounts(req.user.uid);
    const today = new Date().toISOString().slice(0, 10);
    const open = projects.filter((p) => p.status !== 'done');
    const upcoming = open.filter((p) => p.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
    const t = { total: tasks.length, todo: 0, doing: 0, done: 0 };
    tasks.forEach((x) => t[x.status]++);
    res.json({
      projects: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      overdue: open.filter((p) => p.deadline && p.deadline < today).length,
      tasks: t, upcoming,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function ownedProject(uid, id) {
  const doc = await db.collection('projects').doc(id).get();
  return doc.exists && doc.data().ownerId === uid ? doc : null;
}

app.get('/api/projects/:id', auth, async (req, res) => {
  const doc = await ownedProject(req.user.uid, req.params.id);
  if (!doc) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const ts = await db.collection('tasks').where('projectId', '==', doc.id).get();
  const tasks = ts.docs.map((t) => ({ id: t.id, ...t.data() })).sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
  res.json({ project: { id: doc.id, ...doc.data() }, tasks });
});

app.post('/api/projects/:id/tasks', auth, async (req, res) => {
  if (!(await ownedProject(req.user.uid, req.params.id))) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const { data, error } = clean(req.body, TASK_STATUSES);
  if (error) return res.status(400).json({ error });
  data.assignee = String(req.body.assignee || '').trim().slice(0, 60);
  const ref = await db.collection('tasks').add({ ...data, projectId: req.params.id, ownerId: req.user.uid });
  res.status(201).json({ id: ref.id, ...data, projectId: req.params.id });
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  const ref = db.collection('tasks').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Задачу не знайдено' });
  const { data, error } = clean({ ...doc.data(), ...req.body }, TASK_STATUSES);
  if (error) return res.status(400).json({ error });
  data.assignee = String(req.body.assignee ?? doc.data().assignee ?? '').trim().slice(0, 60);
  await ref.update(data);
  res.json({ id: ref.id, ...data });
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  const ref = db.collection('tasks').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Задачу не знайдено' });
  await ref.delete();
  res.status(204).end();
});

const ROLES = ['manager', 'developer', 'designer', 'tester', 'other'];

app.get('/api/members', auth, async (req, res) => {
  let q = db.collection('members').where('ownerId', '==', req.user.uid);
  if (req.query.projectId) q = q.where('projectId', '==', String(req.query.projectId));
  const snap = await q.get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name, 'uk')));
});

app.post('/api/members', auth, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const { role, projectId } = req.body;
  if (!name || name.length > 60) return res.status(400).json({ error: 'Імʼя обовʼязкове (до 60 символів)' });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Некоректний email' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Недопустима роль' });
  const customRole = role === 'other' ? String(req.body.customRole || '').trim() : '';
  if (role === 'other' && (!customRole || customRole.length > 40)) return res.status(400).json({ error: 'Вкажіть свою роль (до 40 символів)' });
  if (!(await ownedProject(req.user.uid, String(projectId || '')))) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const data = { name, email, role, customRole, projectId, ownerId: req.user.uid };
  const ref = await db.collection('members').add(data);
  res.status(201).json({ id: ref.id, ...data });
});

app.put('/api/members/:id', auth, async (req, res) => {
  const ref = db.collection('members').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Учасника не знайдено' });
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const role = req.body.role;
  const projectId = req.body.projectId || doc.data().projectId;
  if (!name || name.length > 60) return res.status(400).json({ error: 'Імʼя обовʼязкове (до 60 символів)' });
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Некоректний email' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Недопустима роль' });
  const customRole = role === 'other' ? String(req.body.customRole || '').trim() : '';
  if (role === 'other' && (!customRole || customRole.length > 40)) return res.status(400).json({ error: 'Вкажіть свою роль (до 40 символів)' });
  if (!(await ownedProject(req.user.uid, String(projectId)))) return res.status(404).json({ error: 'Проєкт не знайдено' });
  const data = { name, email, role, customRole, projectId };
  await ref.update(data);
  res.json({ id: ref.id, ...data });
});

app.delete('/api/members/:id', auth, async (req, res) => {
  const ref = db.collection('members').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().ownerId !== req.user.uid) return res.status(404).json({ error: 'Учасника не знайдено' });
  await ref.delete();
  res.status(204).end();
});

const buildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(buildPath));
app.use((req, res) => res.sendFile(path.join(buildPath, 'index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));
