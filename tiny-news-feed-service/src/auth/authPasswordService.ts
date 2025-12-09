import bcrypt from 'bcrypt'
import { appEnv } from '../utils/env'

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, appEnv.auth.passwordSaltRounds)
}

export const verifyPassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash)
}
