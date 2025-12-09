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

export const decodeRefreshToken = (token: string): TokenPayload => {
  try {
    const payload = jwt.verify(token, appEnv.jwt.refreshSecret)
    if (typeof payload === 'string') {
      throw new Error('Invalid payload shape')
    }

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      handle: payload.handle as string,
    }
  } catch (error) {
    throw new AuthError(AuthErrorCode.InvalidRefreshToken, 401)
  }
}
