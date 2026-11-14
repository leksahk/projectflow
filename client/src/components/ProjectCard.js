import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

export default function ProjectCard({ project, onDelete, onEdit }) {
  const { title, description, status, deadline, counts } = project;
  const overdue = deadline && status !== 'done' && new Date(deadline) < new Date();
  return (
    <article className={`project project-${status} h-100`}>
      <div className="project-top">
        <h3><Link to={`/projects/${project.id}`}>{title}</Link></h3>
        <StatusBadge status={status} />
      </div>
      {description && <p className="muted">{description}</p>}
      <ProgressBar {...counts} />
      <div className="project-foot">
        <span className={overdue ? 'due overdue' : 'due'}>
          {deadline ? `Дедлайн: ${deadline}` : 'Без дедлайну'}
        </span>
        <span className="foot-actions">
          <button className="btn btn-link btn-sm p-0" onClick={() => onEdit(project)}>Редагувати</button>
          <button className="btn btn-link btn-sm p-0" onClick={() => onDelete(project)}>Видалити</button>
        </span>
      </div>
    </article>
  );
}
