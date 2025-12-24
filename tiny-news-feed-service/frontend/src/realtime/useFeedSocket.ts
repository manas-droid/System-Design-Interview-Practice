import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import type { PostDetailResponse } from "../utils/feed.service";

type RefreshNoticePayload = {
  postId: string;
  authorId: string;
  createdAt: string;
};

type Handlers = {
  onOwnPost: (post: PostDetailResponse) => void;
  onRefreshNotice: (payload: RefreshNoticePayload) => void;
};

type IncomingMessage =
  | { event: "post:new"; payload: PostDetailResponse }
  | { event: "feed:refresh-needed"; payload: RefreshNoticePayload }
  | { event: string; payload: unknown };

const WS_URL = "ws://localhost:3000/ws";

export function useFeedSocket(handlers: Handlers) {
  const { getAccessToken } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socket = new WebSocket(`${WS_URL}?token=${token}`);

    socket.onmessage = (messageEvent) => {
      try {
        const parsed: IncomingMessage = JSON.parse(messageEvent.data);
        if (parsed.event === "post:new") {
          handlersRef.current.onOwnPost(parsed.payload as PostDetailResponse);
        } else if (parsed.event === "feed:refresh-needed") {
          handlersRef.current.onRefreshNotice(parsed.payload as RefreshNoticePayload);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("Websocket error", err);
    };

    return () => {
      socket.close();
    };
  }, [getAccessToken]);
}
