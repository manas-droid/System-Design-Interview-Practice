export type User = {
  id: string;
  email: string;
  handle: string;
  firstName: string;
  lastName: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  expiresIn: string;
};
