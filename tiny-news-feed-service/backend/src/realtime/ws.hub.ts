import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { decodeAccessToken } from "../auth/authTokenService";

type SocketEvent<T = unknown> = {
  event: string;
  payload: T;
};

const userSockets = new Map<string, Set<WebSocket>>();
let wss: WebSocketServer | null = null;

export const WS_EVENTS = {
  POST_NEW: "post:new",
  FEED_REFRESH_NEEDED: "feed:refresh-needed",
} as const;

export function startWebsocketServer(server: Server) {
  if (wss) return;

  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url ?? "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "Missing token");
        return;
      }

      const payload = decodeAccessToken(token);
      const userId = payload.sub;

      addSocket(userId, ws);

      ws.on("close", () => removeSocket(userId, ws));
      ws.on("error", () => removeSocket(userId, ws));
    } catch (err) {
      console.error("WS connection failed", err);
      ws.close(1008, "Unauthorized");
    }
  });
}

export function emitToUser<T>(userId: string, event: string, payload: T) {
  const sockets = userSockets.get(userId);
  if (!sockets?.size) return;

  const message = JSON.stringify(buildMessage(event, payload));
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
      } catch (err) {
        console.error(`WS send failed for user ${userId}`, err);
      }
    }
  }
}

export async function emitToUsersChunked<T>(
  userIds: string[],
  event: string,
  payload: T,
  chunkSize = 500
) {
  if (!userIds.length) return;
  const message = JSON.stringify(buildMessage(event, payload));

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    for (const userId of chunk) {
      const sockets = userSockets.get(userId);
      if (!sockets?.size) continue;
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(message);
          } catch (err) {
            console.error(`WS send failed for user ${userId}`, err);
          }
        }
      }
    }
    await new Promise((resolve) => setImmediate(resolve));
  }
}

function buildMessage<T>(event: string, payload: T): SocketEvent<T> {
  return { event, payload };
}

function addSocket(userId: string, ws: WebSocket) {
  const sockets = userSockets.get(userId) ?? new Set<WebSocket>();
  sockets.add(ws);
  userSockets.set(userId, sockets);
}

function removeSocket(userId: string, ws: WebSocket) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(ws);
  if (!sockets.size) {
    userSockets.delete(userId);
  }
}
