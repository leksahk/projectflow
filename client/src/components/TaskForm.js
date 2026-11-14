import { useState } from 'react';

export default function TaskForm({ initial, members = [], onSubmit, onCancel }) {
  const [v, setV] = useState(initial);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}>
      <label>Назва<input className="form-control" value={v.title} onChange={set('title')} required maxLength={100} /></label>
      <label>Виконавець
        <input className="form-control" value={v.assignee || ''} onChange={set('assignee')} placeholder="Оберіть із команди або введіть" list="team-list" />
        <datalist id="team-list">{members.map((m) => <option key={m.id} value={m.name} />)}</datalist>
      </label>
      <label>Термін<input className="form-control" type="date" value={v.deadline || ''} onChange={set('deadline')} /></label>
      <div className="actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Скасувати</button>
        <button className="btn btn-primary" type="submit">{v.id ? 'Зберегти зміни' : 'Додати задачу'}</button>
      </div>
    </form>
  );
}
