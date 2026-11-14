import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, STATUS } from '../api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';

const COLUMNS = [['todo', 'До виконання'], ['doing', 'У роботі'], ['done', 'Готово']];
const ORDER = COLUMNS.map((c) => c[0]);
const EMPTY = { title: '', assignee: '', deadline: '' };

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => api.get('/projects/' + id)
    .then((d) => { setProject(d.project); setTasks(d.tasks); })
    .catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { api.get('/members?projectId=' + id).then(setMembers).catch(() => {}); }, [id]);

  const run = (fn) => fn().then(load).catch((e) => setError(e.message));
  const addTask = (e) => { e.preventDefault(); run(() => api.post(`/projects/${id}/tasks`, form)).then(() => setForm(null)); };
  const moveTask = (t, dir) => run(() => api.put('/tasks/' + t.id, { status: ORDER[ORDER.indexOf(t.status) + dir] }));
  const removeTask = (t) => run(() => api.del('/tasks/' + t.id));
  const changeStatus = (e) => run(() => api.put('/projects/' + id, { ...project, status: e.target.value }));

  if (error) return <><Link to="/projects">← До проєктів</Link><p className="error">{error}</p></>;
  if (!project) return <p className="muted">Завантаження…</p>;

  const counts = { todo: 0, doing: 0, done: 0 };
  tasks.forEach((t) => counts[t.status]++);

  return (
    <>
      <Link to="/projects" className="back">← До проєктів</Link>
      <div className="page-head">
        <h1>{project.title}</h1>
        <select className="status-select" value={project.status} onChange={changeStatus} aria-label="Статус проєкту">
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {project.description && <p className="muted">{project.description}</p>}
      <div className="detail-bar">
        <StatusBadge status={project.status} />
        <span className="due">{project.deadline ? `Дедлайн: ${project.deadline}` : 'Без дедлайну'}</span>
        <ProgressBar {...counts} />
      </div>

      <div className="page-head">
        <h2>Задачі</h2>
        <button className="btn" onClick={() => setForm(EMPTY)}>Нова задача</button>
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
              {list.map((t) => <TaskCard key={t.id} task={t} onMove={moveTask} onDelete={removeTask} />)}
            </section>
          );
        })}
      </div>

      {form && (
        <Modal title="Нова задача" onClose={() => setForm(null)}>
          <form className="form" onSubmit={addTask}>
            <label>Назва<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={100} /></label>
            <label>Виконавець<input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Оберіть із команди або введіть" list="team-list" />
              <datalist id="team-list">{members.map((m) => <option key={m.id} value={m.name} />)}</datalist></label>
            <label>Термін<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Скасувати</button>
              <button className="btn" type="submit">Додати задачу</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
