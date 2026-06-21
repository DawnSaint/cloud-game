import { model, Schema } from 'mongoose'

export interface TRoomDoc {
  roomID: string
  stage: 'created' | 'locked' | 'started'
  leaderID: string
  createAt: string
  startAt?: string
  players: Array<{ id: string, isLeader: boolean }>
  options: Record<string, unknown>
  game?: Record<string, unknown>
  vote?: Record<string, unknown>
}

const roomPlayerSchema = new Schema(
  {
    id: { type: String, required: true },
    isLeader: { type: Boolean, required: true, default: false },
  },
  { _id: false, versionKey: false },
)

const roomSchema = new Schema<TRoomDoc>(
  {
    roomID: { type: String, required: true, unique: true, index: true },
    stage: {
      type: String,
      required: true,
      enum: ['created', 'locked', 'started'],
      default: 'created',
    },
    leaderID: { type: String, required: true },
    createAt: { type: String, required: true },
    startAt: { type: String },
    players: { type: [roomPlayerSchema], default: [] },
    options: { type: Schema.Types.Mixed, required: true },
    game: { type: Schema.Types.Mixed },
    vote: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const RoomModel = model<TRoomDoc>('Room', roomSchema)
