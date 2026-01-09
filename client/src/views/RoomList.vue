<template>
  <div class="room-list-container">
    <div class="header">
      <h1>大厅</h1>
      <div class="user-info">
        <span>欢迎, {{ username }}</span>
        <button @click="logout" class="btn-logout">退出</button>
      </div>
    </div>

    <div class="actions">
      <button @click="showCreateRoom = true" class="btn-primary">创建房间</button>
      <button @click="loadRooms" class="btn-secondary">刷新列表</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="rooms.length === 0" class="empty">暂无房间，创建一个吧</div>
    <div v-else class="room-grid">
      <div
        v-for="room in rooms"
        :key="room._id"
        class="room-card"
        :class="{ disabled: room.status !== 'waiting' }"
        @click="joinRoom(room._id)"
      >
        <h3>{{ room.name }}</h3>
        <div class="room-info">
          <span>玩家: {{ room.players.length }}/{{ room.maxPlayers }}</span>
          <span class="status" :class="room.status">
            {{ statusText(room.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <div v-if="showCreateRoom" class="modal" @click.self="showCreateRoom = false">
      <div class="modal-content">
        <h2>创建房间</h2>
        <form @submit.prevent="handleCreateRoom">
          <div class="form-group">
            <label>房间名称</label>
            <input v-model="newRoomName" type="text" required maxlength="50" />
          </div>
          <div class="form-group">
            <label>最大人数 (5-10)</label>
            <input v-model.number="newRoomMaxPlayers" type="number" min="5" max="10" required />
          </div>
          <div class="modal-actions">
            <button type="submit" class="btn-primary" :disabled="creating">
              {{ creating ? '创建中...' : '创建' }}
            </button>
            <button type="button" @click="showCreateRoom = false" class="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { roomApi } from '../services/api'
import type { Room } from '../types'
import { useRouter } from 'vue-router'

const router = useRouter()

const emit = defineEmits<{
  (e: 'join-room', roomId: string): void
}>()

const username = ref(localStorage.getItem('username') || '')
const rooms = ref<Room[]>([])
const loading = ref(false)
const error = ref('')
const showCreateRoom = ref(false)
const newRoomName = ref('')
const newRoomMaxPlayers = ref(10)
const creating = ref(false)

const logout = () => {
  localStorage.removeItem('username')
  router.push('/')
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    waiting: '等待中',
    playing: '游戏中',
    finished: '已结束'
  }
  return map[status] || status
}

const loadRooms = async () => {
  loading.value = true
  error.value = ''
  try {
    rooms.value = await roomApi.getRooms()
  } catch (err: any) {
    error.value = err.message || '加载房间列表失败'
  } finally {
    loading.value = false
  }
}

const handleCreateRoom = async () => {
  if (!newRoomName.value.trim()) {
    return
  }

  creating.value = true
  try {
    const room = await roomApi.createRoom(newRoomName.value.trim(), newRoomMaxPlayers.value)
    // showCreateRoom.value = false
    // newRoomName.value = ''
    // newRoomMaxPlayers.value = 10
    router.push(`/room/${room._id}`)
  } catch (err: any) {
    alert(err.message || '创建房间失败')
  } finally {
    creating.value = false
  }
}

const joinRoom = async (roomId: string) => {
  const room = rooms.value.find(r => r._id === roomId)
  if (room && room.status === 'waiting') {
    await roomApi.joinRoom(roomId)
    router.push(`/room/${roomId}`)
  }
}

onMounted(() => {
  loadRooms()
})
</script>

<style scoped>
.room-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
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

.btn-logout {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c0392b;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.room-card:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.room-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.room-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.waiting {
  background: #d4edda;
  color: #155724;
}

.status.playing {
  background: #fff3cd;
  color: #856404;
}

.status.finished {
  background: #f8d7da;
  color: #721c24;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 5px;
  font-size: 1rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions button {
  flex: 1;
}
</style>
