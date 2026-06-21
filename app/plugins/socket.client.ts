import { socket } from '~/composables/useSocket'

export default defineNuxtPlugin(() => {
  socket.connect()
})
