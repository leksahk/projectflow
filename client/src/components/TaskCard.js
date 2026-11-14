export default function TaskCard({ task, onMove, onDelete, onEdit }) {
  const { title, assignee, deadline, status } = task;
  const overdue = deadline && status !== 'done' && new Date(deadline) < new Date();
  return (
    <div className="task" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}>
      <strong>{title}</strong>
      <div className="task-meta">
        {assignee && <span>{assignee}</span>}
        {deadline && <span className={overdue ? 'due overdue' : 'due'}>до {deadline}</span>}
      </div>
      <div className="task-actions">
        <button className="btn-link" aria-label="Перенести назад" disabled={status === 'todo'} onClick={() => onMove(task, -1)}>←</button>
        <button className="btn-link" aria-label="Перенести далі" disabled={status === 'done'} onClick={() => onMove(task, 1)}>→</button>
        <button className="btn-link" onClick={() => onEdit(task)}>Змінити</button>
        <button className="btn-link task-del" onClick={() => onDelete(task)}>Видалити</button>
      </div>
    </div>
  );
}
