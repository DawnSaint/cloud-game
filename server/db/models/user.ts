import { model, Schema } from 'mongoose'
import type { UserProfile } from '../../../shared/types/user'

const userSchema = new Schema<UserProfile>(
  {
    id: { type: String, required: true, unique: true, index: true },
    login: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true, default: '' },
    password: { type: String, required: true },
    registrationDate: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const UserModel = model<UserProfile>('User', userSchema)
export type TUserDoc = UserProfile
