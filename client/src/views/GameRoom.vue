<template>
  <div class="game-room-container">
    <div class="room-header">
      <h1>{{ room?.name || '房间' }}</h1>
      <button @click="handleLeaveRoom" class="btn-leave">离开房间</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="game-content">
      <!-- 玩家列表 -->
      <div class="players-section">
        <h2>玩家列表 ({{ room?.players.length }}/{{ room?.maxPlayers }})</h2>
        <div class="players-list">
          <div
            v-for="player in room?.players"
            :key="player.userId"
            class="player-card"
            :class="{
              host: player.isHost,
              ready: player.isReady,
              current: player.userId === currentUserId
            }"
          >
            <div class="player-name">
              {{ player.username }}
              <span v-if="player.isHost" class="badge">房主</span>
              <span v-if="player.userId === currentUserId" class="badge">我</span>
            </div>
            <div class="player-status">
              {{ player.isReady ? '已准备' : '未准备' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 游戏信息和控制 -->
      <div class="game-section">
        <h2>游戏状态: {{ gameStatusText }}</h2>

        <div v-if="room?.status === 'waiting'" class="waiting-controls">
          <button
            v-if="!isHost"
            @click="handleToggleReady"
            class="btn-primary btn-large"
            :class="{ ready: isCurrentPlayerReady }"
          >
            {{ isCurrentPlayerReady ? '取消准备' : '准备' }}
          </button>

          <button
            v-if="isHost"
            @click="handleStartGame"
            class="btn-primary btn-large"
            :disabled="!canStartGame"
          >
            开始游戏
          </button>

          <p v-if="isHost && !canStartGame" class="hint">
            需要 {{ minPlayers }}-{{ room?.maxPlayers }} 名玩家且所有玩家准备后才能开始
          </p>
        </div>

        <!-- 游戏中的信息展示 -->
        <div v-if="room?.status === 'playing'" class="game-info">
          <div class="info-card">
            <h3>游戏信息</h3>
            <p>游戏阶段: {{ gameState?.phase || '未知' }}</p>
            <p>当前回合: {{ gameState?.currentRound || 0 }}/5</p>
            <p v-if="gameState?.currentLeader">
              当前队长: {{ getPlayerName(gameState.currentLeader) }}
            </p>
          </div>

          <div class="info-card">
            <h3>任务结果</h3>
            <div class="mission-results">
              <span
                v-for="(result, index) in 5"
                :key="index"
                class="mission-dot"
                :class="{
                  success: gameState?.missionResults?.[index] === true,
                  fail: gameState?.missionResults?.[index] === false
                }"
              >
                {{ index + 1 }}
              </span>
            </div>
          </div>

          <button @click="loadGameState" class="btn-secondary">刷新游戏状态</button>
        </div>

        <!-- 消息列表 -->
        <div class="messages-section">
          <h3>消息记录</h3>
          <div class="messages-list" ref="messagesList">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message"
              :class="msg.type"
            >
              {{ msg.text }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import socketService from '../services/socket'
import { roomApi } from '../services/api'
import type { Room, GameState } from '../types'
import { useRouter } from 'vue-router'
const props = defineProps<{
  roomId: string
}>()


const router = useRouter()
const room = ref<Room | null>(null)
const gameState = ref<GameState | null>(null)
const error = ref('')
const messages = ref<Array<{ text: string; type: string }>>([])
const messagesList = ref<HTMLElement>()

const currentUserId = localStorage.getItem('userId') || ''
// const currentUsername = localStorage.getItem('username') || ''
const minPlayers = 5

const isHost = computed(() => {
  return currentUserId == room.value?.host
})

const isCurrentPlayerReady = computed(() => {
  return room.value?.players.find(p => p.userId === currentUserId)?.isReady || false
})

const canStartGame = computed(() => {
  if (!room.value) return false
  const playerCount = room.value.players.length
  const allReady = room.value.players.every(p => p.isHost || p.isReady)
  return playerCount >= minPlayers && playerCount <= room.value.maxPlayers && allReady
})

const gameStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    waiting: '等待中',
    playing: '游戏中',
    finished: '已结束'
  }
  return statusMap[room.value?.status || ''] || '未知'
})

const getPlayerName = (userId: string) => {
  return room.value?.players.find(p => p.userId === userId)?.username || '未知'
}

const addMessage = (text: string, type: string = 'info') => {
  messages.value.push({ text, type })
  nextTick(() => {
    if (messagesList.value) {
      messagesList.value.scrollTop = messagesList.value.scrollHeight
    }
  })
}

const loadRoomInfo = async () => {
  try {
    room.value = await roomApi.getRoomDetail(props.roomId)
  } catch (err: any) {
    error.value = err.message || '加载房间信息失败'
  }
}

const loadGameState = () => {
  socketService.getGameState(props.roomId, currentUserId)
}

const handleToggleReady = () => {
  socketService.toggleReady(props.roomId, currentUserId)
}

const handleStartGame = () => {
  if (!canStartGame.value) return
  socketService.startGame(props.roomId, currentUserId)
}

const handleLeaveRoom = () => {
  socketService.leaveRoom(props.roomId, currentUserId)
  router.push('/room-list')
}

// Socket 事件监听
const setupSocketListeners = () => {
  socketService.on('joined_room', (data: any) => {
    room.value = data
  })


  socketService.on('room_updated', (data: any) => {
    room.value = data
  })

  socketService.on('role_assigned', (data: any) => {
    addMessage(`你的角色是: ${data.role}`, 'important')
    if (data.vision && data.vision.length > 0) {
      addMessage(`你可以看到: ${data.vision.join(', ')}`, 'important')
    }
  })

  socketService.on('game_started', (data: any) => {
    addMessage('游戏开始!', 'success')
    if (data.gameState) {
      gameState.value = data.gameState
    }
  })

  socketService.on('team_proposed', (data: any) => {
    const leaderName = getPlayerName(data.leaderId)
    addMessage(`${leaderName} 提议了一个队伍`, 'info')
  })

  socketService.on('vote_progress', (data: any) => {
    addMessage(`投票进度: ${data.voted}/${data.total}`, 'info')
  })

  socketService.on('team_vote_result', (data: any) => {
    const result = data.approved ? '通过' : '拒绝'
    addMessage(`队伍投票结果: ${result}`, data.approved ? 'success' : 'warning')
  })

  socketService.on('mission_result', (data: any) => {
    const result = data.success ? '成功' : '失败'
    addMessage(`任务 ${data.round} ${result}!`, data.success ? 'success' : 'error')
    if (data.gameState) {
      gameState.value = data.gameState
    }
  })

  socketService.on('assassinate_result', (data: any) => {
    addMessage(data.message, data.success ? 'error' : 'success')
  })

  socketService.on('game_over', (data: any) => {
    addMessage(`游戏结束! ${data.winner === 'good' ? '好人' : '坏人'}获胜`, 'important')
    addMessage(data.reason, 'info')
  })

  socketService.on('error', (data: any) => {
    const errorMsg = data.message || data.error || '发生错误'
    error.value = errorMsg
    addMessage(errorMsg, 'error')
  })
}

onMounted(async () => {
  await loadRoomInfo()

  // 连接 Socket
  socketService.connect()
  setupSocketListeners()

  addMessage('已连接到房间', 'success')
})

onUnmounted(() => {
  socketService.leaveRoom(props.roomId, currentUserId)
  socketService.offAll()
})
</script>

<style scoped>
.game-room-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-leave {
  padding: 0.75rem 1.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-leave:hover {
  background: #c0392b;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
}

.game-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

.players-section,
.game-section {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.player-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 5px;
  border: 2px solid transparent;
}

.player-card.current {
  border-color: #667eea;
  background: #e7eaff;
}

.player-card.ready {
  background: #d4edda;
}

.player-name {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

.waiting-controls {
  margin: 2rem 0;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-primary.ready {
  background: #27ae60;
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.hint {
  color: #666;
  font-size: 0.9rem;
  text-align: center;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-card {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 5px;
}

.info-card h3 {
  margin-top: 0;
}

.mission-results {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.mission-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.mission-dot.success {
  background: #27ae60;
  color: white;
}

.mission-dot.fail {
  background: #e74c3c;
  color: white;
}

.messages-section {
  margin-top: 2rem;
}

.messages-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 1rem;
  background: #f8f9fa;
}

.message {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 3px;
  line-height: 1.4;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}

.message.warning {
  background: #fff3cd;
  color: #856404;
}

.message.important {
  background: #d1ecf1;
  color: #0c5460;
  font-weight: bold;
}

.message.info {
  background: #e7eaff;
  color: #333;
}

@media (max-width: 768px) {
  .game-content {
    grid-template-columns: 1fr;
  }
}
</style>
