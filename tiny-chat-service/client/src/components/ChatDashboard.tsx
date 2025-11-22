import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AuthCredentials } from '../auth';
import { ChatMessage, getSocket, SERVER_URL } from '../socket';

type ChatDashboardProps = {
  auth: AuthCredentials;
};

export function ChatDashboard({ auth }: ChatDashboardProps) {
  const socket = useMemo(() => getSocket(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    setConnectionStatus('connecting');
    socket.emit('join_room', '1');
    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('receive_message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.close();
    };
  }, [socket]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingMessage.trim()) {
      return;
    }

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: auth.email,
      content: pendingMessage.trim(),
      timestamp: new Date().toISOString(),
      roomId: '1'
    };

    const response = await fetch(`${SERVER_URL}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMessage)
    });

    if (!response.ok) {
      console.error('Failed to send message');
    }

    setMessages((prev) => [...prev, newMessage]);
    setPendingMessage('');
  };

  return (
    <main className="app">
      <header className="app__header">
        <h1>Tiny Chat</h1>
        <span className={`status status--${connectionStatus}`}>{connectionStatus}</span>
      </header>

      <section className="messages">
        {messages.length === 0 ? (
          <p className="messages__placeholder">No messages yet. Start the conversation!</p>
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
      </section>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          className="composer__input"
          placeholder="Send a message..."
          value={pendingMessage}
          onChange={(event) => setPendingMessage(event.target.value)}
          disabled={connectionStatus !== 'connected'}
        />
        <button className="composer__button" type="submit" disabled={!pendingMessage.trim() || connectionStatus !== 'connected'}>
          Send
        </button>
      </form>
    </main>
  );
}
