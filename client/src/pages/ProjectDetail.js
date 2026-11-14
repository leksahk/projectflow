import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, STATUS } from '../api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';

const COLUMNS = [['todo', 'До виконання'], ['doing', 'У роботі'], ['done', 'Готово']];
const ORDER = COLUMNS.map((c) => c[0]);
const EMPTY = { title: '', assignee: '', deadline: '' };

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(null);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => api.get('/projects/' + id)
    .then((d) => { setProject(d.project); setTasks(d.tasks); })
    .catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { api.get('/members?projectId=' + id).then(setMembers).catch(() => {}); }, [id]);

  const run = (fn) => fn().then(load).catch((e) => setError(e.message));
  const saveTask = (v) => run(() => (v.id ? api.put('/tasks/' + v.id, v) : api.post(`/projects/${id}/tasks`, v))).then(() => setForm(null));
  const saveProject = (v) => run(() => api.put('/projects/' + id, v)).then(() => setEditing(false));
  const moveTask = (t, dir) => run(() => api.put('/tasks/' + t.id, { status: ORDER[ORDER.indexOf(t.status) + dir] }));
  const removeTask = (t) => run(() => api.del('/tasks/' + t.id));
  const changeStatus = (e) => run(() => api.put('/projects/' + id, { ...project, status: e.target.value }));

  if (error) return <><Link to="/projects">← До проєктів</Link><p className="alert alert-danger py-2 mb-0">{error}</p></>;
  if (!project) return <p className="muted">Завантаження…</p>;

  const counts = { todo: 0, doing: 0, done: 0 };
  tasks.forEach((t) => counts[t.status]++);

  return (
    <>
      <Link to="/projects" className="back">← До проєктів</Link>
      <div className="page-head">
        <h1>{project.title}</h1>
        <div className="head-actions">
          <button className="btn btn-outline-secondary" onClick={() => setEditing(true)}>Редагувати проєкт</button>
          <select className="form-select status-select" value={project.status} onChange={changeStatus} aria-label="Статус проєкту">
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        </div>
      </div>
      {project.description && <p className="muted">{project.description}</p>}
      <div className="detail-bar">
        <StatusBadge status={project.status} />
        <span className="due">{project.deadline ? `Дедлайн: ${project.deadline}` : 'Без дедлайну'}</span>
        <ProgressBar {...counts} />
      </div>

      <div className="page-head">
        <h2>Задачі</h2>
        <button className="btn btn-primary" onClick={() => setForm(EMPTY)}>Нова задача</button>
      </div>
      <div className="board">
        {COLUMNS.map(([key, label]) => {
          const list = tasks.filter((t) => t.status === key);
          return (
            <section key={key} className={`column column-${key}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const t = tasks.find((x) => x.id === e.dataTransfer.getData('text/plain'));
                if (t && t.status !== key) run(() => api.put('/tasks/' + t.id, { status: key }));
              }}>
              <h3>{label} <span className="count">{list.length}</span></h3>
              {list.length === 0 && <p className="muted small">Порожньо</p>}
              {list.map((t) => <TaskCard key={t.id} task={t} onMove={moveTask} onDelete={removeTask} onEdit={setForm} />)}
            </section>
          );
        })}
      </div>

      {form && (
        <Modal title={form.id ? 'Редагувати задачу' : 'Нова задача'} onClose={() => setForm(null)}>
          <TaskForm initial={form} members={members} onSubmit={saveTask} onCancel={() => setForm(null)} />
        </Modal>
      )}
      {editing && (
        <Modal title="Редагувати проєкт" onClose={() => setEditing(false)}>
          <ProjectForm initial={project} onSubmit={saveProject} onCancel={() => setEditing(false)} />
        </Modal>
      )}
    </>
  );
}
