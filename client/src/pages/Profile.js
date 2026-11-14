import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../api';
import ProgressBar from '../components/ProgressBar';

export default function Profile({ user }) {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/stats').then(setS).catch(() => {}); }, []);
  const since = user.metadata && user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('uk-UA') : '—';

  return (
    <>
      <h1>Профіль</h1>
      <div className="tile profile">
        <b className="avatar">{(user.email || '?')[0].toUpperCase()}</b>
        <strong>{user.email}</strong>
        <span className="muted">Зареєстровано: {since}</span>
        {s && <><span className="muted">Проєктів: {s.projects}, протермінованих: {s.overdue}</span>
        <ProgressBar todo={s.tasks.todo} doing={s.tasks.doing} done={s.tasks.done} /></>}
        <button className="btn btn-ghost" onClick={() => signOut(auth)}>Вийти з акаунта</button>
      </div>
    </>
  );
}
