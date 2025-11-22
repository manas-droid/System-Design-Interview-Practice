export type AuthCredentials = {
  email: string;
  token?: string;
  [key: string]: unknown;
};

const AUTH_STORAGE_KEY = 'tiny-chat-auth';

export const loadStoredCredentials = (): AuthCredentials | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthCredentials) : null;
  } catch (error) {
    console.warn('Failed to parse stored credentials', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const persistCredentials = (credentials: AuthCredentials): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(credentials));
};
