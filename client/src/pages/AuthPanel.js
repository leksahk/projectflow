import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthPanel() {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fn = register ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await fn(auth, email, password);
    } catch (err) {
      setError('Не вдалося ' + (register ? 'зареєструватись' : 'увійти') + ': перевірте email і пароль (від 6 символів).');
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="logo">ProjectFlow</div>
        <h1>{register ? 'Створіть акаунт' : 'Вхід'}</h1>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">{register ? 'Зареєструватись' : 'Увійти'}</button>
        <button type="button" className="btn-link" onClick={() => setRegister(!register)}>
          {register ? 'Вже є акаунт? Увійти' : 'Немає акаунта? Зареєструватись'}
        </button>
      </form>
    </div>
  );
}
