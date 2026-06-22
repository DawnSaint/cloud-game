import bcrypt from 'bcryptjs'
import { UserModel } from './models/user'
import { signJWT } from '../utils/auth'
import type { UserProfile, UserForUI, PublicUserProfile, UserWithToken } from '../../shared/types/user'
import type { IRegisterError, ILoginError, IUpdateEmailError, IUpdateLoginError, IUpdatePasswordError } from '../../shared/types/api/errors'

const HASH_ROUNDS = 12

function toUserForUI(user: UserProfile): UserForUI {
  const result: UserForUI = {
    id: user.id,
    name: user.name,
    login: user.login,
    avatar: user.avatar,
  }
  if (user.email) {
    result.email = user.email
  }
  return result
}

function toUserWithToken(user: UserForUI): UserWithToken {
  return {
    ...user,
    token: signJWT({ userId: user.id }),
  }
}

function isDuplicateKeyError(err: unknown): err is Error & { code: number; keyPattern?: Record<string, number>; keyValue?: Record<string, unknown> } {
  return err instanceof Error && 'code' in err && (err as Error & { code: number }).code === 11000
}

function duplicateField(err: Error & { keyPattern?: Record<string, number>; keyValue?: Record<string, unknown> }): string | undefined {
  if (err.keyPattern) return Object.keys(err.keyPattern)[0]
  if (err.keyValue) return Object.keys(err.keyValue)[0]
  return undefined
}

export async function registerUser(
  user: { id: string; login: string; password: string },
): Promise<UserWithToken | IRegisterError> {
  const passHash = await bcrypt.hash(user.password, HASH_ROUNDS)

  const doc = new UserModel({
    id: user.id,
    login: user.login,
    name: user.login,
    avatar: 'servant',
    password: passHash,
    registrationDate: new Date().toISOString(),
  })

  try {
    await doc.save()
  }
  catch (err) {
    if (isDuplicateKeyError(err)) {
      const field = duplicateField(err)
      // 仅 login 字段冲突时报"用户名已注册"；其他唯一索引冲突（典型：旧 email 索引非 sparse、多个无 email 用户被判重）按真实错误抛出，避免误导。
      if (field === 'login') return { error: 'loginAlreadyExist' }
      throw err
    }
    throw err
  }

  const userForUI: UserForUI = {
    id: user.id,
    name: user.login,
    login: user.login,
    avatar: 'servant',
  }

  return toUserWithToken(userForUI)
}

export async function login(
  loginOrEmail: string,
  password: string,
): Promise<UserWithToken | ILoginError> {
  const isLogin = /^[a-zA-Z0-9_.-]+$/.test(loginOrEmail)
  const query = isLogin ? { login: loginOrEmail } : { email: loginOrEmail }

  const user = await UserModel.findOne(query)
  if (!user) {
    return { error: isLogin ? 'loginNotExist' : 'emailNotExist' }
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return { error: 'wrongPassword' }
  }

  return toUserWithToken(toUserForUI(user))
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  return UserModel.findOne({ id })
}

export async function getUserProfile(id: string): Promise<UserForUI | null> {
  const user = await getUserById(id)
  if (!user) return null
  return toUserForUI(user)
}

export async function getPublicUserProfile(id: string): Promise<PublicUserProfile | null> {
  const user = await getUserById(id)
  if (!user) return null
  return { id: user.id, name: user.name, avatar: user.avatar }
}

export async function updateUserName(id: string, name: string): Promise<void> {
  await UserModel.findOneAndUpdate({ id }, { $set: { name } })
}

type CredentialType = 'email' | 'login' | 'password'
type CredentialResult<T extends CredentialType> =
  T extends 'email' ? (true | IUpdateEmailError) :
  T extends 'login' ? (true | IUpdateLoginError) :
  (true | IUpdatePasswordError)

export async function updateCredentials<T extends CredentialType>(
  id: string,
  password: string,
  type: T,
  value: string,
): Promise<CredentialResult<T>> {
  const user = await getUserById(id)
  if (!user) {
    return { error: 'wrongPassword' } as CredentialResult<T>
  }

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    return { error: 'wrongPassword' } as CredentialResult<T>
  }

  if (type === 'email' || type === 'login') {
    try {
      const update = type === 'email' ? { email: value } : { login: value }
      await UserModel.findOneAndUpdate({ id }, update, { runValidators: true })
    }
    catch (err) {
      if (isDuplicateKeyError(err)) {
        return (type === 'email'
          ? { error: 'emailAlreadyExist' }
          : { error: 'loginAlreadyExist' }) as CredentialResult<T>
      }
      throw err
    }
  }
  else {
    const passHash = await bcrypt.hash(value, HASH_ROUNDS)
    await UserModel.findOneAndUpdate({ id }, { password: passHash })
  }

  return true as CredentialResult<T>
}
