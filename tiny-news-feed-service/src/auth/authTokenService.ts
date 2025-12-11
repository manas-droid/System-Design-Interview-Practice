import jwt from 'jsonwebtoken'
import { appEnv } from '../utils/env'
import { TokenPayload, AuthTokens, PublicUser } from './authTypes'
import { AuthError, AuthErrorCode } from './authErrors'

const buildPayload = (user: PublicUser): TokenPayload => ({
  sub: user.id,
  email: user.email,
  handle: user.handle,
})

export const issueAuthTokens = (user: PublicUser): AuthTokens => {
  const payload = buildPayload(user)

  const accessToken = jwt.sign(payload, appEnv.jwt.accessSecret, {
    expiresIn: appEnv.jwt.accessTtl,
  })

  const refreshToken = jwt.sign(payload, appEnv.jwt.refreshSecret, {
    expiresIn: appEnv.jwt.refreshTtl,
  })

  return { accessToken, refreshToken }
}

const decodeToken = (token: string, secret: string, errorCode: AuthErrorCode): TokenPayload => {
  try {
    const payload = jwt.verify(token, secret)
    if (typeof payload === 'string' || !payload || typeof (payload as Record<string, unknown>).sub !== 'string') {
      throw new Error('Invalid payload shape')
    }

    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? '',
      handle: (payload.handle as string) ?? '',
    }
  } catch (error) {
    throw new AuthError(errorCode, 401)
  }
}

export const decodeRefreshToken = (token: string): TokenPayload =>
  decodeToken(token, appEnv.jwt.refreshSecret, AuthErrorCode.InvalidRefreshToken)

export const decodeAccessToken = (token: string): TokenPayload =>
  decodeToken(token, appEnv.jwt.accessSecret, AuthErrorCode.InvalidAccessToken)
