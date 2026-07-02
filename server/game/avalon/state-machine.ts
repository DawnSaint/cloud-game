import type { AvalonGameState, GameResults } from '../../../shared/types/games/avalon/state'
import type { TAvalonEvent, TAvalonEventResult } from '../../../shared/types/games/avalon/events'
import type { TVoteOption } from '../../../shared/types/games/avalon/vote'
import type { TMissionResult, MissionWithResult } from '../../../shared/types/games/avalon/mission'
import type { HistoryMission, HistoryVote } from '../../../shared/types/games/avalon/history'
import type { Player } from '../../../shared/types/games/avalon/player'

/** Consecutive rejected votes needed to trigger the `rejectedVote` ending. */
export const REJECT_LIMIT = 5
/** Successful missions required for the good side to win. */
export const WINS_REQUIRED = 3

/**
 * Errors raised by the state-machine helpers. The dispatcher in
 * `engine.handleEvent` catches these and converts them to the
 * `{ error: code }` half of `TAvalonEventResult`.
 */
export class InvalidGameStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidGameStateError'
  }
}

/** Build the `selectTeam` runtime for the first leader (called from `createGame`). */
export function initializeRoundRuntime(
  state: AvalonGameState,
  initialLeaderId: string,
): AvalonGameState {
  return withFlags({
    ...state,
    stage: 'selectTeam',
    leaderID: initialLeaderId,
    currentTeam: [],
    currentVotes: {},
    currentActions: {},
  })
}

/** Player immediately after the current leader in seating order (wraps). */
export function nextLeaderId(state: AvalonGameState): string {
  const ids = state.players.map(p => p.id)
  const idx = ids.indexOf(state.leaderID)
  if (idx === -1) {
    throw new InvalidGameStateError(`leader not in player list: ${state.leaderID}`)
  }
  return ids[(idx + 1) % ids.length]!
}

/** Rebuild `players[].features` so it mirrors the runtime fields. */
function withFlags(state: AvalonGameState): AvalonGameState {
  const features = computeFeatures(state)
  return {
    ...state,
    players: state.players.map(p => ({
      ...p,
      features: { ...features[p.id] },
    })),
  }
}

function computeFeatures(state: AvalonGameState): Record<string, Player['features']> {
  const selected = new Set(state.currentTeam)
  const waiting = waitingPlayerIds(state)
  const out: Record<string, Player['features']> = {}
  for (const p of state.players) {
    out[p.id] = {
      isLeader: p.id === state.leaderID,
      isSelected: selected.has(p.id),
      isSent: state.stage === 'onMission' && selected.has(p.id),
      waitForAction: waiting.has(p.id),
    }
  }
  return out
}

function waitingPlayerIds(state: AvalonGameState): Set<string> {
  if (state.stage === 'selectTeam') {
    return new Set([state.leaderID])
  }
  if (state.stage === 'votingForTeam') {
    return new Set(state.players.map(p => p.id).filter(id => !(id in state.currentVotes)))
  }
  if (state.stage === 'onMission') {
    return new Set(state.currentTeam.filter(id => !(id in state.currentActions)))
  }
  return new Set()
}

/** ---------- Event helpers ---------- */

/**
 * Toggle a player's membership in the current team. Only the current leader
 * may invoke; the targeted player must exist. Returns an immutable new state.
 */
export function applySelectPlayer(
  state: AvalonGameState,
  actorId: string,
  playerId: string,
): TAvalonEventResult {
  if (state.stage !== 'selectTeam') {
    return { error: `selectPlayer only valid in selectTeam (current: ${state.stage})` }
  }
  if (state.leaderID !== actorId) {
    return { error: 'only the leader may select players' }
  }
  if (!state.players.some(p => p.id === playerId)) {
    return { error: `unknown player: ${playerId}` }
  }
  const team = state.currentTeam.includes(playerId)
    ? state.currentTeam.filter(id => id !== playerId)
    : [...state.currentTeam, playerId]
  return { state: withFlags({ ...state, currentTeam: team }) }
}

/**
 * Leader submits the current team for voting. Requires the team to exactly
 * match the mission's required size; transitions to `votingForTeam`.
 */
export function applySubmitTeam(
  state: AvalonGameState,
  actorId: string,
): TAvalonEventResult {
  if (state.stage !== 'selectTeam') {
    return { error: `submitTeam only valid in selectTeam (current: ${state.stage})` }
  }
  if (state.leaderID !== actorId) {
    return { error: 'only the leader may submit the team' }
  }
  const required = requiredMissionSize(state)
  if (state.currentTeam.length !== required) {
    return { error: `team size ${state.currentTeam.length} does not match mission ${required}` }
  }
  return { state: withFlags({ ...state, stage: 'votingForTeam', currentVotes: {} }) }
}

/**
 * Record one player's vote. Stays in `votingForTeam` until everyone votes.
 * Once complete: approve → `onMission`; reject → count against `REJECT_LIMIT`,
 * then either end the game or rotate the leader and start a new pick.
 */
export function applyCastVote(
  state: AvalonGameState,
  actorId: string,
  option: TVoteOption,
): TAvalonEventResult {
  if (state.stage !== 'votingForTeam') {
    return { error: `castVote only valid in votingForTeam (current: ${state.stage})` }
  }
  if (!state.players.some(p => p.id === actorId)) {
    return { error: `unknown player: ${actorId}` }
  }
  if (actorId in state.currentVotes) {
    return { error: `player ${actorId} has already voted` }
  }
  const newVotes = { ...state.currentVotes, [actorId]: option }
  if (Object.keys(newVotes).length < state.players.length) {
    return { state: withFlags({ ...state, currentVotes: newVotes }) }
  }

  const tally = tallyVotes(newVotes)
  const voteEntry = buildVoteEntry(state, tally.result, newVotes)
  const history = [...state.history, voteEntry]

  if (tally.result === 'approve') {
    return { state: enterMission(withFlags({ ...state, history, currentVotes: {} })) }
  }

  // Rejected
  const newVoteCount = state.vote + 1
  if (newVoteCount >= REJECT_LIMIT) {
    return { state: endGame(withFlags({ ...state, history, currentVotes: {}, vote: newVoteCount }), 'rejectedVote') }
  }
  const next = nextLeaderId(state)
  return {
    state: withFlags({
      ...state,
      stage: 'selectTeam',
      vote: newVoteCount,
      history,
      leaderID: next,
      currentTeam: [],
      currentVotes: {},
    }),
  }
}

/**
 * Record a mission member's success/fail card. Stays in `onMission` until
 * the whole team has acted; on completion, computes the mission outcome,
 * appends to history, checks win conditions, and either ends the game or
 * advances to the next mission.
 */
export function applyMissionAction(
  state: AvalonGameState,
  actorId: string,
  result: TMissionResult,
): TAvalonEventResult {
  if (state.stage !== 'onMission') {
    return { error: `missionAction only valid in onMission (current: ${state.stage})` }
  }
  if (!state.currentTeam.includes(actorId)) {
    return { error: `player ${actorId} is not on the current mission team` }
  }
  if (actorId in state.currentActions) {
    return { error: `player ${actorId} has already acted on this mission` }
  }
  const newActions = { ...state.currentActions, [actorId]: result }
  if (Object.keys(newActions).length < state.currentTeam.length) {
    return { state: withFlags({ ...state, currentActions: newActions }) }
  }

  const mission = state.missionState[state.mission]!
  const failsRequired = mission.failsRequired
  const fails = Object.values(newActions).filter(r => r === 'fail').length
  const missionResult: TMissionResult = fails >= failsRequired ? 'fail' : 'success'
  const nextMissionState: MissionWithResult[] = state.missionState.map((m, i) =>
    i === state.mission ? { ...m, result: missionResult, fails } : m,
  )

  const missionEntry = buildMissionEntry(state, newActions, fails, missionResult)
  const history = [...state.history, missionEntry]

  const wins = countWins(nextMissionState)
  if (missionResult === 'success' && wins.success >= WINS_REQUIRED) {
    return { state: endGame(withFlags({ ...state, missionState: nextMissionState, history, currentActions: {} }), 'goodTeamMissions') }
  }
  if (missionResult === 'fail' && wins.fail >= WINS_REQUIRED) {
    return { state: endGame(withFlags({ ...state, missionState: nextMissionState, history, currentActions: {} }), 'evilTeamMissions') }
  }
  // Continue — advance to next mission.
  if (state.mission >= state.missionState.length - 1) {
    // No more missions scheduled; this shouldn't happen if win counts are right.
    return { state: endGame(withFlags({ ...state, missionState: nextMissionState, history, currentActions: {} }), 'manualy') }
  }
  const next = nextLeaderId(state)
  return {
    state: withFlags({
      ...state,
      stage: 'selectTeam',
      missionState: nextMissionState,
      vote: 0,
      history,
      leaderID: next,
      currentTeam: [],
      currentVotes: {},
      currentActions: {},
      mission: state.mission + 1,
    }),
  }
}

/** ---------- Transitions ---------- */

function enterMission(state: AvalonGameState): AvalonGameState {
  return withFlags({ ...state, stage: 'onMission', currentActions: {} })
}

function endGame(state: AvalonGameState, reason: GameResults['reason']): AvalonGameState {
  const winner = reason === 'goodTeamMissions' ? 'good'
    : reason === 'evilTeamMissions' || reason === 'rejectedVote' ? 'evil'
      : undefined
  return withFlags({
    ...state,
    stage: 'end',
    result: { winner, reason },
    currentTeam: [],
    currentVotes: {},
    currentActions: {},
  })
}

/** ---------- History entries ---------- */

function buildVoteEntry(
  state: AvalonGameState,
  result: TVoteOption,
  votes: Record<string, TVoteOption>,
): HistoryVote {
  return {
    type: 'vote',
    anonymous: false,
    index: state.vote,
    result,
    leaderID: state.leaderID,
    team: state.currentTeam.map(id => ({ id })),
    forced: false,
    votes: state.players.map(p => ({
      playerID: p.id,
      onMission: state.currentTeam.includes(p.id),
      value: votes[p.id] ?? 'reject',
    })),
  }
}

function buildMissionEntry(
  state: AvalonGameState,
  actions: Record<string, TMissionResult>,
  fails: number,
  result: TMissionResult,
): HistoryMission {
  const settings = state.missionState[state.mission]!
  return {
    type: 'mission',
    hidden: false,
    index: state.mission,
    settings: { players: settings.players, failsRequired: settings.failsRequired },
    leaderID: state.leaderID,
    actions: state.currentTeam.map(id => ({ playerID: id, value: actions[id]! })),
    result,
    fails,
  }
}

/** ---------- Helpers ---------- */

function requiredMissionSize(state: AvalonGameState): number {
  const settings = state.missionState[state.mission]
  if (!settings) throw new InvalidGameStateError(`missing mission settings at ${state.mission}`)
  return settings.players
}

function tallyVotes(votes: Record<string, TVoteOption>): { approve: number, reject: number, result: TVoteOption } {
  let approve = 0
  let reject = 0
  for (const v of Object.values(votes)) {
    if (v === 'approve') approve++
    else reject++
  }
  return { approve, reject, result: approve > reject ? 'approve' : 'reject' }
}

function countWins(missionState: MissionWithResult[]): { success: number, fail: number } {
  let success = 0
  let fail = 0
  for (const m of missionState) {
    if (m.result === 'success') success++
    else if (m.result === 'fail') fail++
  }
  return { success, fail }
}

/** ---------- Event dispatcher ---------- */

/**
 * Apply any v0.1.7 Avalon event. Each branch validates the current stage
 * and actor eligibility before delegating to the pure helper above.
 */
export function applyEvent(
  state: AvalonGameState,
  event: TAvalonEvent,
  actorId: string,
): TAvalonEventResult {
  switch (event.type) {
    case 'selectPlayer':
      return applySelectPlayer(state, actorId, event.playerId)
    case 'submitTeam':
      return applySubmitTeam(state, actorId)
    case 'castVote':
      return applyCastVote(state, actorId, event.option)
    case 'missionAction':
      return applyMissionAction(state, actorId, event.result)
  }
}
