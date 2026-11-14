import { useEffect, useState } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';

const LEVEL = { low: 'Низький', medium: 'Середній', high: 'Високий' };
const TS = { todo: 'До виконання', doing: 'У роботі', done: 'Готово' };

function exportCsv(project, tasks) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [['Задача', 'Виконавець', 'Термін', 'Статус'], ...tasks.map((t) => [t.title, t.assignee, t.deadline, TS[t.status]])];
  const csv = '\ufeff' + lines.map((r) => r.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'report-' + project.title.replace(/[^\p{L}\p{N}]+/gu, '-') + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics').then((d) => { setData(d); if (d.projects[0]) setSel(d.projects[0].id); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (sel) api.get('/projects/' + sel).then(setReport).catch((e) => setError(e.message));
  }, [sel]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Завантаження…</p>;
  const maxOpen = Math.max(1, ...data.workload.map((w) => w.open));
  const w = data.weights;

  return (
    <>
      <h1>Аналітика й звіти</h1>

      <h2>Індекс ризику проєктів</h2>
      <p className="muted small">
        R = 100 · ({w.overdue}·O + {w.unfinished}·U + {w.time}·T), де O — частка прострочених задач, U — частка
        незавершених, T — часовий тиск дедлайну. До 30 — низький ризик, від 60 — високий.
      </p>
      {data.projects.length === 0 && <p className="muted">Створіть проєкт, щоб побачити аналітику.</p>}
      <div className="rows">
        {data.projects.map((p) => (
          <div className="row risk-row" key={p.id}>
            <strong>{p.title}</strong>
            <StatusBadge status={p.status} />
            <span className={`badge risk-${p.level}`}>Ризик {p.risk}: {LEVEL[p.level]}</span>
            <span className="due">
              {p.deadline ? (p.daysLeft < 0 ? `минуло ${-p.daysLeft} дн.` : `${p.daysLeft} дн. до дедлайну`) : 'без дедлайну'}
              {p.overdue > 0 && ` · прострочено задач: ${p.overdue}`}
            </span>
          </div>
        ))}
      </div>

      <h2>Навантаження на виконавців</h2>
      <div className="rows">
        {data.workload.map((x) => (
          <div className="row load-row" key={x.name}>
            <strong>{x.name}</strong>
            <div className="load-bar"><i style={{ width: (x.open / maxOpen) * 100 + '%' }} /></div>
            <span>відкрито: <b>{x.open}</b></span>
            <span className={x.overdue ? 'overdue' : 'due'}>прострочено: {x.overdue}</span>
            <span className="due">виконано: {x.done}</span>
          </div>
        ))}
      </div>

      <div className="page-head no-print">
        <h2>Звіт по проєкту</h2>
        <div className="head-actions">
          <select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Проєкт для звіту">
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => window.print()} disabled={!report}>Друкувати</button>
          <button className="btn" onClick={() => exportCsv(report.project, report.tasks)} disabled={!report}>Завантажити CSV</button>
        </div>
      </div>
      {report && (
        <div className="report">
          <h3>{report.project.title}</h3>
          <p className="muted small">
            Звіт від {new Date().toLocaleDateString('uk-UA')} · дедлайн: {report.project.deadline || 'не вказано'}
          </p>
          <ProgressBar
            todo={report.tasks.filter((t) => t.status === 'todo').length}
            doing={report.tasks.filter((t) => t.status === 'doing').length}
            done={report.tasks.filter((t) => t.status === 'done').length}
          />
          <table className="table">
            <thead><tr><th>Задача</th><th>Виконавець</th><th>Термін</th><th>Статус</th></tr></thead>
            <tbody>
              {report.tasks.map((t) => (
                <tr key={t.id}><td>{t.title}</td><td>{t.assignee || '—'}</td><td>{t.deadline || '—'}</td><td>{TS[t.status]}</td></tr>
              ))}
              {report.tasks.length === 0 && <tr><td colSpan={4} className="muted">У проєкті ще немає задач</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
