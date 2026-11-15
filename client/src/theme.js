// Тема: збережений вибір користувача або налаштування системи
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function saved() {
  try { return localStorage.getItem('theme'); } catch { return null; }
}

export function currentTheme() {
  return saved() || (mq.matches ? 'dark' : 'light');
}

export function applyTheme(theme = currentTheme()) {
  document.documentElement.setAttribute('data-bs-theme', theme);
}

export function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', next); } catch { /* сховище недоступне */ }
  applyTheme(next);
  return next;
}
