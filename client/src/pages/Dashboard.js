import { useEffect, useState } from 'react';
import { api } from '../api';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/stats').then(setS).catch((e) => setError(e.message)); }, []);

  if (error) return <p className="alert alert-danger py-2 mb-0">{error}</p>;
  if (!s) return <p className="muted">Завантаження…</p>;

  const tiles = [
    ['Проєктів', s.projects], ['У роботі', s.active], ['Задач виконано', `${s.tasks.done}/${s.tasks.total}`],
    ['Протерміновано', s.overdue],
  ];
  return (
    <>
      <h1>Дашборд</h1>
      <div className="tiles">
        {tiles.map(([label, value]) => (
          <div key={label} className={'tile' + (label === 'Протерміновано' && value > 0 ? ' tile-alert' : '')}>
            <b>{value}</b><span>{label}</span>
          </div>
        ))}
      </div>
      <h2>Найближчі дедлайни</h2>
      {s.upcoming.length === 0 && <p className="muted">Немає проєктів із дедлайном. Додайте їх у розділі «Проєкти».</p>}
      <div className="rows">
        {s.upcoming.map((p) => (
          <div className="item" key={p.id}>
            <strong>{p.title}</strong>
            <StatusBadge status={p.status} />
            <ProgressBar {...p.counts} />
            <span className="due">{p.deadline}</span>
          </div>
        ))}
      </div>
    </>
  );
}
