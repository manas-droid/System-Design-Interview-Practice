export enum AuthErrorCode {
  EmailTaken = 'EMAIL_TAKEN',
  HandleTaken = 'HANDLE_TAKEN',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  InvalidRefreshToken = 'INVALID_REFRESH_TOKEN',
  InvalidAccessToken = 'INVALID_ACCESS_TOKEN',
  MissingRefreshToken = 'MISSING_REFRESH_TOKEN',
  UserNotFound = 'USER_NOT_FOUND'
}

export class AuthError extends Error {
  status: number

  constructor(public code: AuthErrorCode, status = 400, message?: string) {
    super(message ?? code)
    this.code = code
    this.status = status
  }
}
