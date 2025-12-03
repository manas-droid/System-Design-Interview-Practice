import { io, Socket } from 'socket.io-client';

export type ChatMessage = {
  roomId: string;
  sender: string;
  content: string;
  receiver:string;
  timestamp: string;
  id: string;
};

export const SERVER_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8081';

let socket: Socket | null = null;

export const getSocket = (): Socket => {

  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

  }

  return socket;
};
