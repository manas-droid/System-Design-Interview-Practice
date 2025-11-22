import { FormEvent, useState } from 'react';
import { AuthCredentials } from '../auth';
import { SERVER_URL } from '../socket';

type LoginProps = {
  onSuccess: (credentials: AuthCredentials) => void;
};

export function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Email is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/auth/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Unable to log in with that email');
      }

      const credentials = (await response.json()) as AuthCredentials;
      onSuccess(credentials);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login">
      <form className="login__form" onSubmit={handleSubmit}>
        <h1 className="login__title">Sign in to Tiny Chat</h1>
        <label className="login__label">
          Email
          <input
            type="email"
            className="login__input"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {errorMessage ? <p className="login__error">{errorMessage}</p> : null}
        <button className="login__button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
