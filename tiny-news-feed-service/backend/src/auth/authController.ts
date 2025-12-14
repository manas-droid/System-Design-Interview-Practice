import { Request, Response } from 'express'
import { loginUser, refreshSession, registerUser } from './authService'
import { AuthError, AuthErrorCode } from './authErrors'
import { RegisterInput, LoginInput, AuthResult } from './authTypes'
import { appEnv } from '../utils/env'

const refreshCookieOptions = {
  httpOnly: true,
  secure: appEnv.nodeEnv !== 'development',
  sameSite: 'lax' as const,
  maxAge: appEnv.jwt.refreshCookieMaxAgeMs,
  path: appEnv.cookies.refreshTokenPath,
}

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(appEnv.cookies.refreshTokenName, token, refreshCookieOptions)
}

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(appEnv.cookies.refreshTokenName, {
    path: appEnv.cookies.refreshTokenPath,
  })
}

const sendAuthPayload = (res: Response, tokensResult: AuthResult, status = 200) => {
  setRefreshCookie(res, tokensResult.tokens.refreshToken)
  res.status(status).json({
    user: tokensResult.user,
    accessToken: tokensResult.tokens.accessToken,
    expiresIn: appEnv.jwt.accessTtl,
  })
}

const extractCookies = (req: Request) => (req as Request & { cookies?: Record<string, string> }).cookies ?? {}

const validateRegisterInput = (payload: any): payload is RegisterInput => {
  const requiredFields: Array<keyof RegisterInput> = ['email', 'password', 'handle', 'firstName', 'lastName']
  return requiredFields.every((field) => typeof payload?.[field] === 'string' && payload[field].trim().length > 0)
}

const validateLoginInput = (payload: any): payload is LoginInput => {
  return typeof payload?.email === 'string' && typeof payload?.password === 'string'
}

const handleError = (error: unknown, res: Response) => {
  if (error instanceof AuthError) {
    return res.status(error.status).json({ code: error.code })
  }

  console.error('Unexpected auth error', error)
  return res.status(500).json({ code: 'UNKNOWN_ERROR' })
}

export const registerHandler = async (req: Request, res: Response) => {
  if (!validateRegisterInput(req.body)) {
    return res.status(400).json({ code: 'INVALID_PAYLOAD' })
  }

  try {
    const result = await registerUser(req.body)
    return sendAuthPayload(res, result, 201)
  } catch (error) {
    return handleError(error, res)
  }
}

export const loginHandler = async (req: Request, res: Response) => {
  if (!validateLoginInput(req.body)) {
    return res.status(400).json({ code: 'INVALID_PAYLOAD' })
  }

  try {
    const result = await loginUser(req.body)
    return sendAuthPayload(res, result)
  } catch (error) {
    return handleError(error, res)
  }
}

export const refreshHandler = async (req: Request, res: Response) => {
  console.log("Refresh Handler");
  const cookies = extractCookies(req)
  const refreshToken = cookies[appEnv.cookies.refreshTokenName]
  console.log();
  if (!refreshToken) {
    return res.status(401).json({ code: AuthErrorCode.MissingRefreshToken })
  }

  try {
    const result = await refreshSession(refreshToken)
    return sendAuthPayload(res, result)
  } catch (error) {
    return handleError(error, res)
  }
}

export const logoutHandler = async (_req: Request, res: Response) => {
  clearRefreshCookie(res)
  return res.status(204).send()
}
