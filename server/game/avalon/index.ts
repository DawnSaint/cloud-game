import { registerGame } from '../registry'
import { avalonEngine } from './engine'

export * from './roles'
export * from './presets'
export * from './role-assignment'
export * from './engine'
export * from './state-machine'

// Register Avalon as an available game. Triggered on import — `server/plugins/games.ts`
// imports this module at server startup so the registry is populated in production.
registerGame('avalon', avalonEngine)
