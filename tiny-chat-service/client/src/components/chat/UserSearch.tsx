import { useMemo, useState } from 'react';
import { UserSummary } from './types';

type UserSearchProps = {
  users: UserSummary[];
  isLoading: boolean;
  onSelect: (user: UserSummary) => void;
  error?: string | null;
};

export function UserSearch({ users, isLoading, onSelect, error }: UserSearchProps) {
  const [query, setQuery] = useState('');

  const visibleUsers = useMemo(() => {
    if (!query.trim()) {
      return users.slice(0, 8);
    }
    const lowered = query.toLowerCase();
    return users
      .filter((user) => user.name.toLowerCase().includes(lowered) || user.email?.toLowerCase().includes(lowered))
      .slice(0, 8);
  }, [query, users]);

  return (
    <section className="chat-search">
      <label className="chat-search__label" htmlFor="chat-search">
        <input
          id="chat-search"
          className="chat-search__input"
          placeholder="Search people to start chatting..."
          value={query}
          disabled={isLoading}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {error ? <p className="chat-search__error">{error}</p> : null}
      <div className="chat-search__results">
        {isLoading ? (
          <p className="chat-search__placeholder">Loading people…</p>
        ) : visibleUsers.length === 0 ? (
          <p className="chat-search__placeholder">{query ? 'No matches found' : 'No users available'}</p>
        ) : (
          visibleUsers.map((user) => (
            <button key={user.id} className="chat-search__result" onClick={() => onSelect(user)} type="button">
              <span className="chat-search__result-name">{user.name}</span>
              {user.email ? <span className="chat-search__result-email">{user.email}</span> : null}
            </button>
          ))
        )}
      </div>
    </section>
  );
}
