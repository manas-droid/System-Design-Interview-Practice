import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChatMessage, getSocket, SERVER_URL } from './socket';

const usernameFromPrompt = (): string => {
  const stored = sessionStorage.getItem('tiny-chat-username');
  if (stored) return stored;
  const fallback = `guest-${Math.floor(Math.random() * 10_000)}`;
  sessionStorage.setItem('tiny-chat-username', fallback);
  return fallback;
};

function App() {
  const socket = useMemo(() => getSocket(), []);
  const [username] = useState(usernameFromPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    socket.emit('join_room', '1');
    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on("receive_message", (data:any)=>{ console.log(data); })


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
      sender: username,
      content: pendingMessage.trim(),
      timestamp: new Date().toISOString(),
      roomId : '1'
    };

    const response = await fetch(`${SERVER_URL}/api/message`, {
      method: 'POST',
      headers : {
        'Content-Type' : "application/json"

      },
      body : JSON.stringify(newMessage)
    })

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

export default App;
