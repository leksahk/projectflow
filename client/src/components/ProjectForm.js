import { useState } from 'react';
import { STATUS } from '../api';

export default function ProjectForm({ initial, onSubmit, onCancel }) {
  const [v, setV] = useState(initial);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}>
      <label>Назва<input value={v.title} onChange={set('title')} required maxLength={100} /></label>
      <label>Опис<textarea value={v.description || ''} onChange={set('description')} rows={3} /></label>
      <label>Статус
        <select value={v.status} onChange={set('status')}>
          {Object.entries(STATUS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </label>
      <label>Дедлайн<input type="date" value={v.deadline || ''} onChange={set('deadline')} /></label>
      <div className="actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Скасувати</button>
        <button className="btn" type="submit">{v.id ? 'Зберегти зміни' : 'Створити проєкт'}</button>
      </div>
    </form>
  );
}
