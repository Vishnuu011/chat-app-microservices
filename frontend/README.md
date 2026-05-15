# Chat App Frontend (Vite + React + TypeScript)

This project was migrated from Create React App to Vite.

## Key Changes from CRA

- Entry point: `src/main.tsx` (was `src/index.tsx`)
- `index.html` is now at the **root** of the project (not inside `public/`)
- Environment variables use `VITE_` prefix instead of `REACT_APP_`
  - `REACT_APP_USER_SERVICE` → `VITE_USER_SERVICE`
  - `REACT_APP_CHAT_SERVICE` → `VITE_CHAT_SERVICE`
  - `REACT_APP_CALL_SERVICE` → `VITE_CALL_SERVICE`
  - `REACT_APP_CHAT_SOCKET` → `VITE_CHAT_SOCKET`
  - `REACT_APP_CALL_SOCKET` → `VITE_CALL_SOCKET`
- Access env vars with `import.meta.env.VITE_*` instead of `process.env.REACT_APP_*`

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start development server (port 3000)
- `npm run build` — Build for production
- `npm run preview` — Preview production build

## Environment Variables

Copy `.env` and update values as needed:

```env
VITE_USER_SERVICE=http://localhost:8000
VITE_CHAT_SERVICE=http://localhost:8002
VITE_CALL_SERVICE=http://localhost:8003
VITE_CHAT_SOCKET=http://localhost:8002
VITE_CALL_SOCKET=http://localhost:8003
```
