# granny-last-word

A multiplayer word-battle game with:
- `frontend`: React + Vite + Phaser client
- `backend`: Express + Socket.IO API/game server
- `shared`: shared TypeScript types

## Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm 10+
- PostgreSQL 14+ (local or hosted)

## 1) Install dependencies

From repo root:

```bash
npm install
```

## 2) Configure environment variables

### Backend

Copy `backend/.env.example` to `backend/.env` and fill values:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=granny_last_word
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/
# Optional for production:
# VITE_SOCKET_URL=https://api.example.com
```

## 3) Set up the database

Create your database, then run:

- `backend/src/modules/db/sql/schema.sql` (create tables)

Optional reset script:
- `backend/src/modules/db/sql/drop_tables.sql`

## 4) Run in development

From repo root:

```bash
npm run dev
```

This starts:
- backend on `http://localhost:3000`
- frontend on `http://localhost:5173`

## 5) Build checks

Run before opening a PR:

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

## Common troubleshooting

- **Cannot connect to API/socket**: ensure `VITE_API_URL` matches backend `PORT`.
- **DB connection errors**: verify `backend/.env` and database exists.
- **Auth/session not persisting**: run frontend through Vite dev server (`npm run dev --prefix frontend`) so proxy/cookies work correctly.