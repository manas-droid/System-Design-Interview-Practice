# Tiny Chat Client

React + TypeScript + Vite template for the tiny chat service client. Includes a Socket.IO client that emits and listens to chat events plus an email-only login screen.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and adjust `VITE_SOCKET_URL` to your server URL (defaults to `http://localhost:8081`).
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Login flow

1. When the app loads you'll see a login screen asking for an email.
2. Submitting an email triggers a `POST` request to `${VITE_SOCKET_URL}/api/auth/email`.
3. Whatever JSON credentials the backend returns get stored in `localStorage` under `tiny-chat-auth`.
4. After a successful response the app redirects to the chat dashboard and uses the saved email as the sender name.

## Production build

```bash
npm run build
npm run preview
```
