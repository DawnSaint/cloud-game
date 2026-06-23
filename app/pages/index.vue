<template>
  <div class="lobby">
    <!-- 主标题 -->
    <LobbyLogo />

    <!-- 创建房间按钮 -->
    <button class="create-room-btn" :disabled="isCreating" @click="createRoom">
      {{ isCreating ? '创建中...' : '创建房间' }}
    </button>

    <!-- 房间列表 -->
    <div v-if="roomsList && roomsList.length" class="rooms-list">
      <div v-for="(game, index) in roomsList" :key="game.uuid" class="game-item" @click="handleRoomClick(game.uuid)">
        <div class="game-index">{{ index + 1 }}.</div>
        <div class="game-container">
          <div class="game-left">
            <div class="game-name">
              <span v-if="game.result?.winner" :class="`${game.result.winner}-loyalty-icon`"/>
              <span class="host-name">{{ roomsListHosts[index] || '加载中...' }}</span>
            </div>
            <div v-if="hasOptions(game.config)" class="options-preview">
              <span class="option-text">配置: </span>
              <span v-if="game.config?.roles?.merlin" class="option-badge">梅林 </span>
              <span v-if="game.config?.roles?.percival" class="option-badge">派西维尔 </span>
              <span v-if="game.config?.roles?.morgana" class="option-badge">莫甘娜 </span>
              <span v-if="game.config?.roles?.mordred" class="option-badge">莫德雷德 </span>
            </div>
          </div>
          <div class="game-right">
            <div class="game-right-content">
              <div class="players-amount">
                {{ game.state === 'created' ? `${game.players}/10` : `${game.players} 玩家` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import LobbyLogo from '~/components/LobbyLogo.vue';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import type { TRoomsList, TGameConfig } from '~/types';
import { showToast, showModal } from '~/composables/useUI';

const store = useMainStore();
const router = useRouter();
const roomsList = ref<TRoomsList>([]);
const isCreating = ref(false);

// 获取房间主持人名称列表
const roomsListHosts = computed(() => {
  return (roomsList.value || []).map((room) => {
    const userState = store.users[room.hostID];
    if (userState && 'profile' in userState) {
      return userState.profile.name;
    }
    // 异步加载用户信息
    store.getUserPublicProfile(room.hostID);
    return '加载中...';
  });
});

// 初始化数据
const initState = async () => {
  try {
    const data = await socket.emitWithAck<TRoomsList>('getRoomsList');
    roomsList.value = data || [];
  } catch (e) {
    console.error('Failed to get rooms list:', e);
  }
};

// 创建房间
const createRoom = async () => {
  if (isCreating.value) {
    return;
  }
  if (!store.profile) {
    showModal({
      title: '提示',
      content: '请先登录后再创建房间',
      showCancel: false,
    });
    router.push({ path: '/auth', query: { redirect: '/' } });
    return;
  }

  performCreateRoom();
};

// 执行创建房间
const performCreateRoom = async () => {
  if (isCreating.value) {
    return;
  }

  isCreating.value = true;

  try {
    const uuid = await socket.emitWithAck<string>('createRoom');
    router.push({ name: 'room', query: { uuid } });
  } catch (e) {
    console.error('Failed to create room:', e);
    showToast({
      title: '创建房间失败',
      icon: 'none',
      duration: 2000,
    });
    isCreating.value = false;
  }
};

// 进入房间
const handleRoomClick = (uuid: string) => {
  router.push({ name: 'room', query: { uuid } });
};

// 检查是否有配置选项
const hasOptions = (options?: TGameConfig) => {
  return Object.values(options?.roles ?? {}).some((el) => Boolean(el));
};

// 房间列表更新监听
const handleRoomsListUpdated = (list: TRoomsList) => {
  roomsList.value = list;
};

onMounted(() => {
  initState();

  // 监听事件
  socket.on('roomsListUpdated', handleRoomsListUpdated);
});

onUnmounted(() => {
  // 移除监听
  socket.off('roomsListUpdated', handleRoomsListUpdated);
});
</script>

<style scoped lang="scss">
.lobby {
  box-sizing: border-box;
  padding: $spacing-header $spacing-lg calc(80px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  align-items: center;
}

.create-room-btn {
  margin-top: 36vh;
  width: 100%;
  max-width: 360px;
  padding: $spacing-lg $spacing-xxl;
  min-height: 52px;
  color: $text-white;
  background: linear-gradient(135deg, $primary 0%, $accent 100%);
  font-size: $font-xl;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: none;
  border-radius: $radius-xlarge;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba($primary, 0.25);
  transition:
    transform $transition-fast,
    box-shadow $transition-fast,
    opacity $transition-fast;

  &:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba($primary, 0.3);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.75;
    animation: pulse 1.4s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 0.55; }
}

.rooms-list {
  width: 100%;
  margin-top: $spacing-xxl;
}

.game-item {
  background-color: transparent;
  border-radius: 0;
  padding: $spacing-lg 0;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: opacity $transition-normal;
}

.game-item:active {
  opacity: 0.6;
}

.game-index {
  font-size: $font-xl;
  font-weight: bold;
  margin-right: 10px;
  color: $text-secondary;
  min-width: 30px;
}

.game-container {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-left {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-name {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.host-name {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
}

.options-preview {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-xs;
}

.option-text {
  font-size: $font-xs;
  color: $text-secondary;
}

.option-badge {
  font-size: $font-xs;
  color: $primary;
  background-color: $loyalty-good-bg;
  padding: 2px 6px;
  border-radius: $radius-small;
}

.game-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.game-right-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.status-chip {
  padding: $spacing-xs 8px;
  border-radius: $radius-small;
  font-size: $font-xs;
  font-weight: 500;
}

.looking-for-players {
  background-color: $success;
  color: $text-white;
}

.players-amount {
  font-size: $font-md;
  color: $text-secondary;
  font-weight: 500;
}

// 忠诚度图标样式
.good-loyalty-icon,
.evil-loyalty-icon {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: $spacing-xs;
}

.good-loyalty-icon {
  background-color: $loyalty-good;
}

.evil-loyalty-icon {
  background-color: $loyalty-evil;
}
</style>
