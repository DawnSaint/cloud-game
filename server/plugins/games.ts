import { definePlugin } from 'nitro'
import '../game/avalon' // side-effect: registers the Avalon engine into the Game Registry
import { getAvailableGameTypes } from '../game/registry'

export default definePlugin(() => {
  console.log(`[Game Registry] registered games: ${getAvailableGameTypes().join(', ') || '(none)'}`)
})
