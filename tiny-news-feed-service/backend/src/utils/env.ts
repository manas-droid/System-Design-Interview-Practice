import type { SignOptions } from 'jsonwebtoken'
import dotenv from 'dotenv'

type JwtExpiresIn = SignOptions['expiresIn']

type ServerEnv = {
  port: number
}

type DbEnv = {
  host?: string
  name?: string
  username?: string
  password?: string
  port: number
  schema?: string
}

type AuthEnv = {
  passwordSaltRounds: number
}

type JwtEnv = {
  accessSecret: string
  refreshSecret: string
  accessTtl: JwtExpiresIn
  refreshTtl: JwtExpiresIn
  refreshCookieMaxAgeMs: number
}

type CookiesEnv = {
  refreshTokenName: string
  refreshTokenPath: string
}

export type AppEnv = {
  nodeEnv: string
  server: ServerEnv
  db: DbEnv
  auth: AuthEnv
  jwt: JwtEnv
  cookies: CookiesEnv
}

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev'
dotenv.config({ path: envFile })

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const durationToMs = (value: string | undefined, fallbackMs: number) => {
  if (!value) {
    return fallbackMs
  }

  const match = value.trim().match(/^(\d+)([smhd])$/i)
  if (!match) {
    return fallbackMs
  }

  const amount = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return amount * (unitMap[unit] ?? 1000)
}

const DEFAULT_REFRESH_TTL = '7d'
const DEFAULT_REFRESH_MS = durationToMs(DEFAULT_REFRESH_TTL, 7 * 24 * 60 * 60 * 1000)

export const appEnv: AppEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  server: {
    port: parseNumber(process.env.PORT, 3000),
  },
  db: {
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_USER_PASS,
    port: parseNumber(process.env.DB_PORT, 5432),
    schema: process.env.DB_SCHEMA,
  },
  auth: {
    passwordSaltRounds: parseNumber(process.env.PASSWORD_SALT_ROUNDS, 12),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessTtl: (process.env.JWT_ACCESS_TTL ?? '15m') as JwtExpiresIn,
    refreshTtl: (process.env.JWT_REFRESH_TTL ?? DEFAULT_REFRESH_TTL) as JwtExpiresIn,
    refreshCookieMaxAgeMs: durationToMs(process.env.JWT_REFRESH_TTL ?? DEFAULT_REFRESH_TTL, DEFAULT_REFRESH_MS),
  },
  cookies: {
    refreshTokenName: process.env.REFRESH_COOKIE_NAME ?? 'newsfeed_refresh_token',
    refreshTokenPath: '/api/auth/refresh',
  },
}
