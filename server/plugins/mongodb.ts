import { definePlugin } from 'nitro'
import { connectMongoDB } from '../db'

export default definePlugin(() => {
  connectMongoDB().catch(() => {
    console.warn('[MongoDB] initial connection failed; will retry on first query')
  })
})
