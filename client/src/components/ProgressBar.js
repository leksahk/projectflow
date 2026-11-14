export default function ProgressBar({ todo = 0, doing = 0, done = 0 }) {
  const total = todo + doing + done;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="pbar" title={`Готово ${done} з ${total}`}>
      <div className="progress-track">
        {total > 0 && (
          <>
            <i className="seg seg-done" style={{ flex: done }} />
            <i className="seg seg-doing" style={{ flex: doing }} />
            <i className="seg seg-todo" style={{ flex: todo }} />
          </>
        )}
      </div>
      <span className="progress-pct">{total ? pct + '%' : 'без задач'}</span>
    </div>
  );
}
