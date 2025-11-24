import { useEffect, useMemo, useState } from 'react';
import { AuthCredentials } from '../auth';
import { ChatMessage, getSocket, SERVER_URL } from '../socket';
import { ChatList } from './chat/ChatList';
import { ConversationPane } from './chat/ConversationPane';
import { UserSearch } from './chat/UserSearch';
import { RoomSummary, UserSummary } from './chat/types';

type ChatDashboardProps = {
  auth: AuthCredentials;
};

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

const sanitizeId = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const normalizeUser = (raw: any): UserSummary => {
  const id = sanitizeId(raw?.id ?? raw?.userId ?? raw?.user_id ?? raw?.email ?? crypto.randomUUID());
  const name =
    typeof raw?.userName === 'string'
      ? raw.userName
      : typeof raw?.name === 'string'
        ? raw.name
        : typeof raw?.email === 'string'
          ? raw.email
          : 'Unknown user';

  return {
    id,
    name,
    email: typeof raw?.email === 'string' ? raw.email : undefined,
    roomId: typeof raw?.roomId === 'string' ? raw.roomId : typeof raw?.room_id === 'string' ? raw.room_id : undefined
  };
};

const deriveRoomTitle = (participants: UserSummary[], currentUserId: string): string => {
  const others = participants.filter((participant) => participant.id !== currentUserId);
  return others.length > 0 ? others.map((participant) => participant.name).join(', ') : 'Conversation';
};

const normalizeRoom = (raw: any, currentUserId: string): RoomSummary => {
  const rawParticipants = Array.isArray(raw?.participants)
    ? raw.participants
    : Array.isArray(raw?.users)
      ? raw.users
      : [];
  const participants = rawParticipants.map((participant: unknown) => normalizeUser(participant));
  const id = sanitizeId(raw?.id ?? raw?.roomId ?? raw?.room_id ?? raw?.conversationId ?? crypto.randomUUID());
  const title =
    (typeof raw?.title === 'string' && raw.title) ||
    (typeof raw?.name === 'string' && raw.name) ||
    deriveRoomTitle(participants, currentUserId);

  const lastMessage = raw?.lastMessage ?? raw?.last_message;
  const lastMessagePreview =
    typeof lastMessage === 'string'
      ? lastMessage
      : lastMessage && typeof lastMessage === 'object'
        ? (lastMessage.content as string)
        : undefined;

  return {
    id,
    title: title || 'Conversation',
    participants,
    lastMessagePreview
  };
};

const normalizeMessage = (raw: any, roomId: string): ChatMessage => ({
  id: sanitizeId(raw?.id ?? raw?._id ?? crypto.randomUUID()),
  sender:
    typeof raw?.sender === 'string'
      ? raw.sender
      : typeof raw?.from === 'string'
        ? raw.from
        : typeof raw?.author === 'string'
          ? raw.author
          : 'Unknown sender',
  content: typeof raw?.content === 'string' ? raw.content : typeof raw?.message === 'string' ? raw.message : '',
  timestamp:
    typeof raw?.timestamp === 'string'
      ? raw.timestamp
      : typeof raw?.createdAt === 'string'
        ? raw.createdAt
        : new Date().toISOString(),
  roomId
});

export function ChatDashboard({ auth }: ChatDashboardProps) {
  const socket = useMemo(() => getSocket(), []);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(socket.connected ? 'connected' : 'connecting');
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [usersError, setUsersError] = useState<string | null>(null);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const userId = useMemo(() => {
    const id = auth.userId ?? auth.id;
    return typeof id === 'number' ? String(id) : (id as string) ?? '';
  }, [auth]);
  const displayName = (auth.userName as string) ?? auth.email;

  useEffect(() => {
    const handleConnect = () => setConnectionStatus('connected');
    const handleDisconnect = () => setConnectionStatus('disconnected');

    if (!socket.connected) {
      setConnectionStatus('connecting');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.close();
    };
  }, [socket]);

  useEffect(() => {
    let ignore = false;
    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setUsersError(null);
      try {
        const response = await fetch(`${SERVER_URL}/api/users`);
        if (!response.ok) {
          throw new Error('Unable to load users');
        }
        const payload = await response.json();
        const data = Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : [];
        if (!ignore) {
          setUsers(data.map((raw: unknown) => normalizeUser(raw)));
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : 'Unable to load users';
          setUsersError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let ignore = false;
    const loadRooms = async () => {
      setIsLoadingRooms(true);
      setRoomsError(null);
      try {
        const response = await fetch(`${SERVER_URL}/api/rooms?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('Unable to load chats');
        }
        const payload = await response.json();
        const roomEntries = Array.isArray(payload?.rooms) ? payload.rooms : Array.isArray(payload) ? payload : [];
        if (!ignore) {
          const normalized = roomEntries.map((room: unknown) => normalizeRoom(room, userId));
          setRooms(normalized);
          setActiveRoom((current) => current ?? normalized[0] ?? null);
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : 'Unable to load chats';
          setRoomsError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingRooms(false);
        }
      }
    };

    loadRooms();

    return () => {
      ignore = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!activeRoom || !userId) {
      setMessages([]);
      return;
    }

    if (activeRoom.isVirtual) {
      setMessages([]);
      return;
    }

    let ignore = false;
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError(null);
      try {
        const response = await fetch(`${SERVER_URL}/api/rooms/${activeRoom.id}?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('Unable to load messages');
        }
        const payload = await response.json();
        const records = Array.isArray(payload?.messages) ? payload.messages : Array.isArray(payload) ? payload : [];
        if (!ignore) {
          setMessages(records.map((record: unknown) => normalizeMessage(record, activeRoom.id)));
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : 'Unable to load messages';
          setMessagesError(message);
        }
      } finally {
        if (!ignore) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [activeRoom, userId]);

  useEffect(() => {
    if (!activeRoom) {
      return;
    }
    socket.emit('join_room', activeRoom.id);
  }, [socket, activeRoom]);

  useEffect(() => {
    const handleIncoming = (incoming: ChatMessage) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === incoming.roomId ? { ...room, lastMessagePreview: incoming.content } : room
        )
      );
      setMessages((prev) => {
        if (!activeRoom || incoming.roomId !== activeRoom.id) {
          return prev;
        }
        return [...prev, incoming];
      });
    };

    socket.on('receive_message', handleIncoming);
    return () => {
      socket.off('receive_message', handleIncoming);
    };
  }, [socket, activeRoom]);

  const handleRoomSelect = (room: RoomSummary) => {
    if (activeRoom?.id === room.id) {
      return;
    }
    setActiveRoom(room);
  };

  const handleUserSelect = (user: UserSummary) => {
    if (user.roomId) {
      const room = rooms.find((existingRoom) => existingRoom.id === user.roomId);
      if (room) {
        setActiveRoom(room);
        return;
      }
    }

    const relatedRoom = rooms.find((room) => room.participants.some((participant) => participant.id === user.id));
    if (relatedRoom) {
      setActiveRoom(relatedRoom);
      return;
    }

    const derivedId = user.roomId ?? (userId ? [userId, user.id].sort().join('-') : user.id);
    const placeholderRoom: RoomSummary = {
      id: derivedId,
      title: user.name,
      participants: [
        { id: userId || 'me', name: displayName || 'You' },
        { id: user.id, name: user.name, email: user.email }
      ],
      isVirtual: !user.roomId
    };

    setRooms((prev) => {
      const exists = prev.some((room) => room.id === placeholderRoom.id);
      return exists ? prev : [placeholderRoom, ...prev];
    });
    setActiveRoom(placeholderRoom);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!activeRoom || !pendingMessage.trim()) {
      return;
    }
    const trimmed = pendingMessage.trim();
    const outgoing: ChatMessage = {
      id: crypto.randomUUID(),
      sender: displayName,
      content: trimmed,
      timestamp: new Date().toISOString(),
      roomId: activeRoom.id
    };

    setPendingMessage('');
    setMessages((prev) => [...prev, outgoing]);
    setRooms((prevRooms) =>
      prevRooms.map((room) => (room.id === activeRoom.id ? { ...room, lastMessagePreview: trimmed } : room))
    );
    setIsSending(true);
    setMessagesError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outgoing)
      });
      if (!response.ok) {
        throw new Error('Unable to send message');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send message';
      setMessagesError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="chat-shell">
      <UserSearch users={users} isLoading={isLoadingUsers} onSelect={handleUserSelect} error={usersError} />
      <section className="chat-workspace">
        <ChatList
          rooms={rooms}
          selectedRoomId={activeRoom?.id ?? null}
          onSelect={handleRoomSelect}
          isLoading={isLoadingRooms}
          error={roomsError}
        />
        <ConversationPane
          room={activeRoom}
          connectionStatus={connectionStatus}
          messages={messages}
          pendingMessage={pendingMessage}
          onMessageChange={setPendingMessage}
          onSend={handleSendMessage}
          isSending={isSending}
          isLoading={isLoadingMessages}
          error={messagesError}
        />
      </section>
    </main>
  );
}
