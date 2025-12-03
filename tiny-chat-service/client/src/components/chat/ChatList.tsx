import { RoomSummary } from './types';

type ChatListProps = {
  rooms: RoomSummary[];
  selectedRoomId: string | null;
  onSelect: (room: RoomSummary) => void;
  isLoading: boolean;
  error?: string | null;
};

export function ChatList({ rooms, selectedRoomId, onSelect, isLoading, error }: ChatListProps) {
  return (
    <aside className="chat-list">
      <header className="chat-list__header">
        <h2>Chats</h2>
      </header>
      {error ? <p className="chat-list__error">{error}</p> : null}
      <div className="chat-list__items">
        {isLoading ? (
          <p className="chat-list__placeholder">Loading chats…</p>
        ) : rooms.length === 0 ? (
          <p className="chat-list__placeholder">No chats yet</p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              className={`chat-list__item ${selectedRoomId === room.id ? 'chat-list__item--active' : ''}`}
              onClick={() => onSelect(room)}
            >
              <span className="chat-list__title">{room.title}</span>
              {room.lastMessagePreview ? (
                <span className="chat-list__preview">{room.lastMessagePreview}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
