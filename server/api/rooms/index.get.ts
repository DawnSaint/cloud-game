import { createError, defineEventHandler } from 'h3'
import { listRooms } from '../../game/rooms'
import { getAuthPayload } from '../../utils/auth'
import type { TRoomsList } from '../../../shared/types/common/room-list'

export default defineEventHandler((event): TRoomsList => {
  if (!getAuthPayload(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return listRooms()
})
