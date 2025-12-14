export interface RegisterInput {
  email: string
  password: string
  handle: string
  firstName: string
  lastName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface PublicUser {
  id: string
  email: string
  handle: string
  firstName: string
  lastName: string
}

export interface TokenPayload {
  sub: string
  email: string
  handle: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: PublicUser
  tokens: AuthTokens
}
