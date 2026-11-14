import { useEffect, useState } from 'react';
import { api, STATUS } from '../api';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';

const EMPTY = { title: '', description: '', status: 'planning', deadline: '' };

export default function Projects() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('new');
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/projects').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const visible = items
    .filter((p) => status === 'all' || p.status === status)
    .filter((p) => p.title.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === 'deadline') return (a.deadline || '9999').localeCompare(b.deadline || '9999');
      if (sort === 'name') return a.title.localeCompare(b.title, 'uk');
      return 0; // server already returns newest first
    });

  const save = async (values) => {
    try {
      if (values.id) await api.put('/projects/' + values.id, values);
      else await api.post('/projects', values);
      setForm(null); load();
    } catch (err) { setError(err.message); }
  };
  const remove = async () => {
    try { await api.del('/projects/' + toDelete.id); setToDelete(null); load(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <div className="page-head">
        <h1>Проєкти</h1>
        <button className="btn btn-primary" onClick={() => setForm(EMPTY)}>Новий проєкт</button>
      </div>
      <div className="toolbar">
        <input className="form-control" placeholder="Пошук за назвою" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Усі статуси</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Спочатку нові</option>
          <option value="deadline">За дедлайном</option>
          <option value="name">За назвою</option>
        </select>
      </div>
      {error && <p className="alert alert-danger py-2 mb-0">{error}</p>}
      {visible.length === 0 && <p className="muted">Проєктів не знайдено. Створіть перший кнопкою «Новий проєкт».</p>}
      <div className="item row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
        {visible.map((p) => (
          <div className="col" key={p.id}>
            <ProjectCard project={p} onDelete={setToDelete} onEdit={setForm} />
          </div>
        ))}
      </div>

      {form && (
        <Modal title={form.id ? 'Редагувати проєкт' : 'Новий проєкт'} onClose={() => setForm(null)}>
          <ProjectForm initial={form} onSubmit={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
      {toDelete && (
        <Modal title="Видалити проєкт?" onClose={() => setToDelete(null)}>
          <p>«{toDelete.title}» і всі його задачі буде видалено назавжди.</p>
          <div className="actions">
            <button className="btn btn-outline-secondary" onClick={() => setToDelete(null)}>Скасувати</button>
            <button className="btn btn-danger" onClick={remove}>Видалити проєкт</button>
          </div>
        </Modal>
      )}
    </>
  );
}
