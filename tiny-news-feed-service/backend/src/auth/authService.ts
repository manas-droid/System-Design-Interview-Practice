import PostgreSQLDatasource from '../utils/database'
import { User } from '../schemas/User'
import { hashPassword, verifyPassword } from './authPasswordService'
import { issueAuthTokens, decodeRefreshToken } from './authTokenService'
import { AuthError, AuthErrorCode } from './authErrors'
import { AuthResult, LoginInput, RegisterInput, PublicUser } from './authTypes'

const getUserRepository = () => PostgreSQLDatasource.getRepository(User)

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  handle: user.handle,
  firstName: user.firstName,
  lastName: user.lastName,
})

const buildAuthResult = (user: PublicUser): AuthResult => ({
  user,
  tokens: issueAuthTokens(user),
})

export const registerUser = async (input: RegisterInput): Promise<AuthResult> => {
  const repository = getUserRepository()

  const existingByEmail = await repository.findOne({ where: { email: input.email } })
  if (existingByEmail) {
    throw new AuthError(AuthErrorCode.EmailTaken, 409)
  }

  const existingByHandle = await repository.findOne({ where: { handle: input.handle } })
  if (existingByHandle) {
    throw new AuthError(AuthErrorCode.HandleTaken, 409)
  }

  const user = repository.create({
    email: input.email,
    handle: input.handle,
    firstName: input.firstName,
    lastName: input.lastName,
    passwordHash: await hashPassword(input.password),
  })

  const savedUser = await repository.save(user)
  return buildAuthResult(toPublicUser(savedUser))
}

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const repository = getUserRepository()
  const user = await repository.findOne({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      handle: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
    },
  })

  if (!user) {
    throw new AuthError(AuthErrorCode.InvalidCredentials, 401)
  }

  const passwordsMatch = await verifyPassword(input.password, user.passwordHash)

  if (!passwordsMatch) {
    throw new AuthError(AuthErrorCode.InvalidCredentials, 401)
  }

  const safeUser: PublicUser = {
    id: user.id,
    email: user.email,
    handle: user.handle,
    firstName: user.firstName,
    lastName: user.lastName,
  }

  return buildAuthResult(safeUser)
}

export const refreshSession = async (refreshToken: string): Promise<AuthResult> => {
  const payload = decodeRefreshToken(refreshToken)
  const repository = getUserRepository()
  const user = await repository.findOne({ where: { id: payload.sub } })

  if (!user) {
    throw new AuthError(AuthErrorCode.UserNotFound, 404)
  }

  return buildAuthResult(toPublicUser(user))
}
