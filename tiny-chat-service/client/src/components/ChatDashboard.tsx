import { useEffect, useMemo, useRef, useState } from 'react';
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

const normalizeMessage = (raw: any, roomId: string): ChatMessage => {
  const owner = raw?.messageOwner ?? raw?.owner ?? raw?.message_owner;
  const ownerName =
    typeof owner?.userName === 'string'
      ? owner.userName
      : typeof owner?.name === 'string'
        ? owner.name
        : undefined;
  const ownerIdCandidate = owner?.userId ?? owner?.id ?? owner?.user_id;

  const timestampSource = raw?.timestamp ?? raw?.createdAt ?? raw?.created_at;
  const timestamp =
    typeof timestampSource === 'string'
      ? timestampSource
      : timestampSource instanceof Date
        ? timestampSource.toISOString()
        : new Date().toISOString();

  const candidateId =
    raw?.id ??
    raw?._id ??
    raw?.messageId ??
    raw?.message_id ??
    (ownerIdCandidate && timestamp ? `${ownerIdCandidate}-${timestamp}` : null);
  const normalizedId = sanitizeId(candidateId);

  return {
    id: normalizedId || crypto.randomUUID(),
    sender:
      ownerName ??
      (typeof raw?.sender === 'string'
        ? raw.sender
        : typeof raw?.from === 'string'
          ? raw.from
          : typeof raw?.author === 'string'
            ? raw.author
            : 'Unknown sender'),
    content: typeof raw?.content === 'string' ? raw.content : typeof raw?.message === 'string' ? raw.message : '',
    timestamp,
    receiver:
      typeof raw?.receiver === 'string'
        ? raw.receiver
        : typeof raw?.to === 'string'
          ? raw.to
          : typeof raw?.targetUserId === 'string'
            ? raw.targetUserId
            : ownerIdCandidate
              ? String(ownerIdCandidate)
              : '',
    roomId
  };
};

const getConversationPartnerId = (room: RoomSummary | null, currentUserId: string): string | null => {
  if (!room) {
    return null;
  }
  if (!Array.isArray(room.participants) || room.participants.length === 0) {
    return null;
  }

  const counterpart = room.participants.find((participant) => participant.id !== currentUserId);
  if (counterpart?.id) {
    return counterpart.id;
  }

  const fallbackParticipant = room.participants[0];
  return fallbackParticipant?.id ?? null;
};

const participantsKey = (participants: UserSummary[]): string =>
  participants
    .map((participant) => participant.id)
    .filter(Boolean)
    .sort()
    .join(':');

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

  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const receivedMessageIds = useRef<Set<string>>(new Set());

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
    };
  }, [socket]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    socket.emit('identify_user', userId);
  }, [socket, userId]);

  useEffect(() => {
    joinedRoomsRef.current = new Set();
  }, [userId]);

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
      receivedMessageIds.current = new Set();
      return;
    }

    if (activeRoom.isVirtual) {
      setMessages([]);
      receivedMessageIds.current = new Set();
      return;
    }

    let ignore = false;
    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError(null);
      try {
        const response = await fetch(`${SERVER_URL}/api/messages/${activeRoom.id}`);
        if (!response.ok) {
          throw new Error('Unable to load messages');
        }
        const payload = await response.json();
        const records = Array.isArray(payload) ? payload : Array.isArray(payload?.messages) ? payload.messages : [];
        if (!ignore) {
          const normalizedMessages = records.map((record: unknown) => normalizeMessage(record, activeRoom.id));
          receivedMessageIds.current = new Set(normalizedMessages.map((message:any) => message.id));
          setMessages(normalizedMessages);
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
    if (!activeRoom || activeRoom.isVirtual) {
      return;
    }
    socket.emit('join_room', activeRoom.id);
  }, [socket, activeRoom]);

  useEffect(() => {
    rooms.forEach((room) => {
      if (!room || room.isVirtual || !room.id || joinedRoomsRef.current.has(room.id)) {
        return;
      }
      socket.emit('join_room', room.id);
      joinedRoomsRef.current.add(room.id);
    });
  }, [rooms, socket]);

  useEffect(() => {
    const handleIncoming = (incoming: any) => {
      if (!incoming?.roomId) {
        return;
      }

      if (incoming?.id) {
        if (receivedMessageIds.current.has(incoming.id)) {
          return;
        }
        receivedMessageIds.current.add(incoming.id);
      }

      const normalized = normalizeMessage(incoming, incoming.roomId);
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === normalized.roomId ? { ...room, lastMessagePreview: normalized.content } : room
        )
      );
      setMessages((prev) => {
        if (!activeRoom || normalized.roomId !== activeRoom.id) {
          return prev;
        }
        return [...prev, normalized];
      });
    };

    socket.on('message.created', handleIncoming);
    return () => {
      socket.off('message.created', handleIncoming);
    };
  }, [socket, activeRoom]);

  useEffect(() => {
    const handleRoomCreated = (payload: any) => {
      if (!payload?.room) {
        return;
      }

      const normalizedRoom: RoomSummary = { ...normalizeRoom(payload.room, userId), isVirtual: false };
      const incomingMessageRaw = payload?.message;
      const targetParticipantsKey = participantsKey(normalizedRoom.participants);
      const normalizedMessage = incomingMessageRaw
        ? normalizeMessage(incomingMessageRaw, normalizedRoom.id)
        : null;

      if (normalizedMessage?.id) {
        receivedMessageIds.current.add(normalizedMessage.id);
      }

      setRooms((prevRooms) => {
        let updated = false;
        const nextRooms = prevRooms.map((room) => {
          const shareIdentity =
            room.id === normalizedRoom.id ||
            (room.isVirtual && participantsKey(room.participants) === targetParticipantsKey);

          if (shareIdentity) {
            updated = true;
            return {
              ...room,
              ...normalizedRoom,
              id: normalizedRoom.id,
              isVirtual: false,
              lastMessagePreview:
                normalizedMessage?.content ?? normalizedRoom.lastMessagePreview ?? room.lastMessagePreview
            };
          }
          return room;
        });

        if (!updated) {
          return [
            {
              ...normalizedRoom,
              lastMessagePreview: normalizedMessage?.content ?? normalizedRoom.lastMessagePreview
            },
            ...nextRooms
          ];
        }

        return nextRooms;
      });

      setActiveRoom((current) => {
        if (!current) {
          return current;
        }
        const currentKey = participantsKey(current.participants);
        if (current.id === normalizedRoom.id || (current.isVirtual && currentKey === targetParticipantsKey)) {
          return { ...current, ...normalizedRoom, id: normalizedRoom.id, isVirtual: false };
        }
        return current;
      });

      if (!joinedRoomsRef.current.has(normalizedRoom.id)) {
        socket.emit('join_room', normalizedRoom.id);
        joinedRoomsRef.current.add(normalizedRoom.id);
      }

      if (
        normalizedMessage &&
        activeRoom &&
        (activeRoom.id === normalizedRoom.id ||
          (activeRoom.isVirtual && participantsKey(activeRoom.participants) === targetParticipantsKey))
      ) {
        setMessages((prev) => [...prev, normalizedMessage]);
      }
    };

    socket.on('room.created', handleRoomCreated);
    return () => {
      socket.off('room.created', handleRoomCreated);
    };
  }, [socket, userId, activeRoom]);

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
    const receiverId = getConversationPartnerId(activeRoom, userId);
    if (!receiverId) {
      setMessagesError('Unable to determine the recipient for this conversation.');
      return;
    }

    const previousRoomId = activeRoom.id;
    const wasVirtualRoom = Boolean(activeRoom.isVirtual);

    const outgoing: ChatMessage = {
      id: crypto.randomUUID(),
      sender: displayName,
      content: trimmed,
      timestamp: new Date().toISOString(),
      receiver: receiverId,
      roomId: previousRoomId
    };

    setPendingMessage('');
    setMessages((prev) => [...prev, outgoing]);
    setRooms((prevRooms) =>
      prevRooms.map((room) => (room.id === previousRoomId ? { ...room, lastMessagePreview: trimmed } : room))
    );
    setIsSending(true);
    setMessagesError(null);

    try {
      const payload = {
        sender: userId,
        receiver: receiverId,
        content: trimmed,
        roomId: wasVirtualRoom ? null : previousRoomId
      };

      const response = await fetch(`${SERVER_URL}/api/dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Unable to send message');
      }

      let delivery: any = null;
      try {
        delivery = await response.json();
      } catch (error) {
        delivery = null;
      }

      const deliveryMessageRaw = delivery?.message;
      const deliveryRoomRaw = delivery?.room;
      const normalizedDeliveryMessage = deliveryMessageRaw
        ? normalizeMessage(deliveryMessageRaw, deliveryMessageRaw.roomId ?? previousRoomId)
        : null;

      if (normalizedDeliveryMessage?.id) {
        receivedMessageIds.current.add(normalizedDeliveryMessage.id);
      }

      const resolvedRoomId =
        normalizedDeliveryMessage?.roomId ??
        (deliveryMessageRaw && deliveryMessageRaw.roomId !== undefined && deliveryMessageRaw.roomId !== null
          ? String(deliveryMessageRaw.roomId)
          : previousRoomId);

      if (normalizedDeliveryMessage) {
        setMessages((prev) => {
          const hasActual = prev.some((message) => message.id === normalizedDeliveryMessage.id);
          if (hasActual) {
            return prev;
          }
          const hasTemp = prev.some((message) => message.id === outgoing.id);
          if (hasTemp) {
            return prev.map((message) =>
              message.id === outgoing.id ? normalizedDeliveryMessage : message
            );
          }
          return [...prev, normalizedDeliveryMessage];
        });
      }

      if (resolvedRoomId && resolvedRoomId !== previousRoomId) {
        setMessages((prev) =>
          prev.map((message) =>
            message.roomId === previousRoomId ? { ...message, roomId: resolvedRoomId } : message
          )
        );
      }

      const previewContent = normalizedDeliveryMessage?.content ?? trimmed;

      if (deliveryRoomRaw) {
        const normalizedRoom = { ...normalizeRoom(deliveryRoomRaw, userId), isVirtual: false };
        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            if (room.id === previousRoomId || room.id === normalizedRoom.id) {
              return {
                ...room,
                ...normalizedRoom,
                id: normalizedRoom.id,
                isVirtual: false,
                lastMessagePreview: previewContent
              };
            }
            return room;
          })
        );
        setActiveRoom((current) =>
          current && (current.id === previousRoomId || current.id === normalizedRoom.id)
            ? { ...current, ...normalizedRoom, id: normalizedRoom.id, isVirtual: false }
            : current
        );
      } else if (wasVirtualRoom || previousRoomId !== resolvedRoomId) {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === previousRoomId
              ? { ...room, id: resolvedRoomId, isVirtual: false, lastMessagePreview: previewContent }
              : room
          )
        );
        setActiveRoom((current) =>
          current && current.id === previousRoomId ? { ...current, id: resolvedRoomId, isVirtual: false } : current
        );
      } else if (previewContent) {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === previousRoomId ? { ...room, lastMessagePreview: previewContent } : room
          )
        );
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
