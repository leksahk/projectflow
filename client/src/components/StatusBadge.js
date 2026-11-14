import { STATUS } from '../api';

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS[status] || status}</span>;
}
