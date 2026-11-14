import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import AuthPanel from './pages/AuthPanel';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Team from './pages/Team';
import Profile from './pages/Profile';
import './styles.css';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = ще перевіряємо сесію
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return <p className="muted center">Завантаження…</p>;
  if (!user) return <AuthPanel />;

  return (
    <HashRouter>
      <div className="shell">
        <aside className="side">
          <div className="logo">ProjectFlow</div>
          <nav>
            <NavLink to="/" end>Дашборд</NavLink>
            <NavLink to="/projects">Проєкти</NavLink>
            <NavLink to="/team">Команда</NavLink>
            <NavLink to="/profile">Профіль</NavLink>
          </nav>
          <div className="side-user">
            <span>{user.email}</span>
            <button className="btn-link" onClick={() => signOut(auth)}>Вийти</button>
          </div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/team" element={<Team />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
