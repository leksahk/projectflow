import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

export default function ProjectCard({ project, onDelete }) {
  const { title, description, status, deadline, counts } = project;
  const overdue = deadline && status !== 'done' && new Date(deadline) < new Date();
  return (
    <article className={`project project-${status}`}>
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
        <button className="btn-link" onClick={() => onDelete(project)}>Видалити</button>
      </div>
    </article>
  );
}
