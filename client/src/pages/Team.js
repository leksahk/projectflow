import { useEffect, useState } from 'react';
import { api, ROLES } from '../api';
import Modal from '../components/Modal';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  const load = () => Promise.all([api.get('/members'), api.get('/projects')])
    .then(([m, p]) => { setMembers(m); setProjects(p); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const titleOf = (id) => (projects.find((p) => p.id === id) || {}).title || '—';
  const visible = members.filter((m) => filter === 'all' || m.projectId === filter);
  const byRole = Object.keys(ROLES).map((r) => [r, visible.filter((m) => m.role === r).length]);

  const save = (e) => {
    e.preventDefault();
    api.post('/members', form).then(() => { setForm(null); load(); }).catch((er) => setError(er.message));
  };
  const remove = (m) => api.del('/members/' + m.id).then(load).catch((er) => setError(er.message));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Команда</h1>
        <button className="btn" disabled={projects.length === 0} onClick={() => setForm({ name: '', email: '', role: 'developer', projectId: projects[0].id })}>Додати учасника</button>
      </div>
      {projects.length === 0 && <p className="muted">Спочатку створіть проєкт у розділі «Проєкти».</p>}
      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Усі проєкти</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {byRole.map(([r, n]) => <span key={r} className="badge">{ROLES[r]}: {n}</span>)}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="rows">
        {visible.map((m) => (
          <div className="row member" key={m.id}>
            <strong>{m.name}</strong>
            <span className="badge">{ROLES[m.role]}</span>
            <span className="muted">{titleOf(m.projectId)}{m.email ? ' · ' + m.email : ''}</span>
            <button className="btn-link task-del" onClick={() => remove(m)}>Видалити</button>
          </div>
        ))}
      </div>
      {form && (
        <Modal title="Новий учасник" onClose={() => setForm(null)}>
          <form className="form" onSubmit={save}>
            <label>Імʼя<input value={form.name} onChange={set('name')} required maxLength={60} /></label>
            <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
            <label>Роль<select value={form.role} onChange={set('role')}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Проєкт<select value={form.projectId} onChange={set('projectId')}>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Скасувати</button>
              <button className="btn" type="submit">Додати учасника</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
