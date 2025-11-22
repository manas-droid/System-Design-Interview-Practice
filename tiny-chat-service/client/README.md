# Tiny Chat Client

React + TypeScript + Vite template for the tiny chat service client. Includes a Socket.IO client that emits and listens to `chat:message` events.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and adjust `VITE_SOCKET_URL` to your server URL (defaults to `http://localhost:3000`).
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Production build

```bash
npm run build
npm run preview
```
