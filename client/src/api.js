import { auth } from './firebase';

async function call(path, method = 'GET', body) {
  const token = await auth.currentUser.getIdToken();
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) throw new Error((data && data.error) || 'Помилка сервера');
  return data;
}

export const api = {
  get: (p) => call(p),
  post: (p, b) => call(p, 'POST', b),
  put: (p, b) => call(p, 'PUT', b),
  del: (p) => call(p, 'DELETE'),
};

export const ROLES = { manager: 'Менеджер', developer: 'Розробник', designer: 'Дизайнер', tester: 'Тестувальник', other: 'Інший' };
export const STATUS = { planning: 'Планування', active: 'У роботі', done: 'Завершено' };
