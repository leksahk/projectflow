# ProjectFlow — веб-система управління проєктами

Стек: React 19, React Router, Node.js + Express, Firebase (Auth + Firestore).

## Встановлення і запуск
1. `npm run install-all`
2. `client/.env` — за зразком `client/.env.example`
3. `server/serviceAccountKey.json` — ключ із Firebase Console (Project settings → Service accounts)
4. `npm run build`, потім `npm start` → http://localhost:5000

Режим розробки: `npm run dev:server` і `npm run dev:client` у двох терміналах.

## Розгортання на Render (Web Service)
- Build Command: `npm run install-all && npm run build`
- Start Command: `npm start`
- Environment: усі `REACT_APP_FIREBASE_*` (потрібні під час збірки) і `FIREBASE_SERVICE_ACCOUNT` (весь вміст JSON-ключа одним значенням)
- У Firebase Console → Authentication → Settings → Authorized domains додайте домен Render.
