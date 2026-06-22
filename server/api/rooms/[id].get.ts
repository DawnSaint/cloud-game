import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getRoom } from '../../game/rooms'
import { getAuthPayload } from '../../utils/auth'
import type { TRoomState } from '../../../shared/types/common/room'

export default defineEventHandler((event): TRoomState => {
  if (!getAuthPayload(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing room id' })
  }
  const state = getRoom(id)
  if (!state) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found' })
  }
  return state
})
