import { FormEvent } from 'react';
import { ChatMessage } from '../../socket';
import { RoomSummary } from './types';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

type ConversationPaneProps = {
  room: RoomSummary | null;
  connectionStatus: ConnectionStatus;
  messages: ChatMessage[];
  pendingMessage: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  isLoading: boolean;
  error?: string | null;
};

export function ConversationPane({
  room,
  connectionStatus,
  messages,
  pendingMessage,
  onMessageChange,
  onSend,
  isSending,
  isLoading,
  error
}: ConversationPaneProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend();
  };

  if (!room) {
    return (
      <section className="conversation conversation--empty">
        <p>Select a chat to start messaging</p>
      </section>
    );
  }

  return (
    <section className="conversation">
      <header className="conversation__header">
        <div>
          <h2 className="conversation__title">{room.title}</h2>
          <p className="conversation__subtitle">{room.participants.map((participant) => participant.name).join(', ')}</p>
        </div>
        <span className={`status status--${connectionStatus}`}>{connectionStatus}</span>
      </header>
      {error ? <p className="conversation__error">{error}</p> : null}
      <div className="conversation__messages">
        {isLoading ? (
          <p className="messages__placeholder">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="messages__placeholder">No messages yet. Say hi!</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="message">
              <div className="message__meta">
                <span className="message__sender">{message.sender}</span>
                <time className="message__time">{new Date(message.timestamp).toLocaleTimeString()}</time>
              </div>
              <p className="message__text">{message.content}</p>
            </article>
          ))
        )}
      </div>
      <form className="composer" onSubmit={handleSubmit}>
        <input
          className="composer__input"
          placeholder="Write a message…"
          value={pendingMessage}
          onChange={(event) => onMessageChange(event.target.value)}
          disabled={connectionStatus !== 'connected' || isSending}
        />
        <button
          className="composer__button"
          type="submit"
          disabled={!pendingMessage.trim() || connectionStatus !== 'connected' || isSending}
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </section>
  );
}
