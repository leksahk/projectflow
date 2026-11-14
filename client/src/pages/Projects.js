import { useEffect, useState } from 'react';
import { api, STATUS } from '../api';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';

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

  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/projects', form); setForm(null); load(); }
    catch (err) { setError(err.message); }
  };
  const remove = async () => {
    try { await api.del('/projects/' + toDelete.id); setToDelete(null); load(); }
    catch (err) { setError(err.message); }
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="page-head">
        <h1>Проєкти</h1>
        <button className="btn" onClick={() => setForm(EMPTY)}>Новий проєкт</button>
      </div>
      <div className="toolbar">
        <input placeholder="Пошук за назвою" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Усі статуси</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Спочатку нові</option>
          <option value="deadline">За дедлайном</option>
          <option value="name">За назвою</option>
        </select>
      </div>
      {error && <p className="error">{error}</p>}
      {visible.length === 0 && <p className="muted">Проєктів не знайдено. Створіть перший кнопкою «Новий проєкт».</p>}
      <div className="grid">
        {visible.map((p) => <ProjectCard key={p.id} project={p} onDelete={setToDelete} />)}
      </div>

      {form && (
        <Modal title="Новий проєкт" onClose={() => setForm(null)}>
          <form onSubmit={save} className="form">
            <label>Назва<input value={form.title} onChange={set('title')} required maxLength={100} /></label>
            <label>Опис<textarea value={form.description} onChange={set('description')} rows={3} /></label>
            <label>Статус
              <select value={form.status} onChange={set('status')}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Дедлайн<input type="date" value={form.deadline} onChange={set('deadline')} /></label>
            <div className="actions">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Скасувати</button>
              <button className="btn" type="submit">Створити проєкт</button>
            </div>
          </form>
        </Modal>
      )}
      {toDelete && (
        <Modal title="Видалити проєкт?" onClose={() => setToDelete(null)}>
          <p>«{toDelete.title}» і всі його задачі буде видалено назавжди.</p>
          <div className="actions">
            <button className="btn-ghost" onClick={() => setToDelete(null)}>Скасувати</button>
            <button className="btn btn-danger" onClick={remove}>Видалити проєкт</button>
          </div>
        </Modal>
      )}
    </>
  );
}
