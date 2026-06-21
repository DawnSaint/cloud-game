<template>
  <div class="room">
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-container">
      <div class="error-box">
        <span class="error-title">{{ getErrorText(errorMessage.error) }}</span>
        <button class="back-btn" @click="handleBackToLobby">返回大厅</button>
      </div>
    </div>

    <!-- 正常房间视图 -->
    <div v-else class="room-content">
      <!-- 游戏棋盘区域 -->
      <div v-if="roomState" class="board-area">
        <!-- 游戏棋盘 -->

        <Board
          :players="roomState.stage === 'started' ? gamePlayers : roomState.players"
          :room-stage="roomState.stage"
          :display-player-index="roomState.stage === 'started'"
          :game-result="gameResult"
          :selected-players="selectedPlayers"
          :can-select-player="canSelectPlayer"
          @player-click="handlePlayerClick"
        >
          <template #host-panel>
            <div v-if="isRoomLeader" class="board-actions">
              <button
                v-if="roomState.stage === 'created' || roomState.stage === 'locked'"
                class="host-btn"
                @click="handleStartGame"
              >
                <span class="host-text">开始游戏</span>
              </button>
            </div>
          </template>
        </Board>

        <!-- 游戏组件区域（游戏进行中） -->
        <div v-if="roomState.stage === 'started' && gameState" class="game-components">
          <!-- 游戏状态显示 -->
          <GameStateDisplay :state="gameState" />

          <!-- 任务棋盘 -->
          <MissionBoard :missions="gameState.missionState" />

          <!-- 动态游戏面板 -->
          <!-- 游戏结束面板 -->
          <GameResultDisplay v-if="currentPanelType === 'result'" :game="gameState" />

          <!-- 选择队伍面板 -->
          <TeamSelectionPanel
            v-else-if="currentPanelType === 'teamSelection'"
            :game="gameState"
            :selected-players="selectedPlayers"
            @send-team="handleSendTeam"
          />

          <!-- 投票面板 -->
          <VotingPanel
            v-else-if="currentPanelType === 'voting'"
            :game="gameState"
            :current-player-id="store.profile?.id || ''"
            @vote="handleVote"
          />

          <!-- 任务执行面板 -->
          <MissionActionPanel
            v-else-if="currentPanelType === 'missionAction'"
            :game="gameState"
            :current-player-id="store.profile?.id || ''"
            @action="handleMissionAction"
          />

          <!-- 等待指示器 -->
          <ActionWaitingIndicator :players="gameState.players" />
        </div>

        <!-- 游戏配置（在等待阶段显示） -->
        <div
          v-if="(roomState.stage === 'created' || roomState.stage === 'locked') && hasGameOptions"
          class="options-section"
        >
          <span class="section-title">游戏配置</span>
          <div class="options-grid">
            <span v-if="roomState.options.roles.merlin" class="option-badge">梅林</span>
            <span v-if="roomState.options.roles.percival" class="option-badge">派西维尔</span>
            <span v-if="roomState.options.roles.morgana" class="option-badge">莫甘娜</span>
            <span v-if="roomState.options.roles.mordred" class="option-badge">莫德雷德</span>
            <span v-if="roomState.options.roles.oberon" class="option-badge">奥伯伦</span>
            <span v-if="roomState.options.addons.lady_of_lake" class="option-badge">湖中女神</span>
            <span v-if="roomState.options.addons.excalibur" class="option-badge">圣剑</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="glass-btn" @click="handleLeaveRoom">
            <span class="glass-btn-text">离开房间</span>
          </button>
          <button class="glass-btn">
            <span class="glass-btn-text">分享邀请</span>
          </button>
        </div>
      </div>

      <!-- 游戏设置弹窗 -->
      <GameSettings
        v-if="roomState"
        :visible="showGameSettings"
        :room-uuid="roomUuid"
        :options="roomState.options"
        @close="showGameSettings = false"
      />

      <!-- 加载中 -->
      <div v-else class="loading-container">
        <span class="loading-text">加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] });

import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import type { TRoomState, ISocketError, VisualGameState, TVoteOption, TMissionResult } from '~/types';
import Board from '~/components/board/Board.vue';
import GameSettings from '~/components/room/GameSettings.vue';
// 游戏组件
import GameStateDisplay from '~/components/game/GameStateDisplay.vue';
import MissionBoard from '~/components/game/MissionBoard.vue';
import TeamSelectionPanel from '~/components/game/TeamSelectionPanel.vue';
import VotingPanel from '~/components/game/VotingPanel.vue';
import MissionActionPanel from '~/components/game/MissionActionPanel.vue';
import GameResultDisplay from '~/components/game/GameResultDisplay.vue';
import ActionWaitingIndicator from '~/components/game/ActionWaitingIndicator.vue';
import { showToast, showModal, showActionSheet } from '~/composables/useUI';

const store = useMainStore();
const router = useRouter();
const route = useRoute();
const roomUuid = ref<string>('');
const roomState = ref<TRoomState | null>(null);
const errorMessage = ref<ISocketError | null>(null);
const showGameSettings = ref<boolean>(false);
const selectedPlayers = ref<string[]>([]); // 用于selectTeam阶段选择的玩家

// 计算属性
const isRoomLeader = computed(() => {
  if (!roomState.value || !store.profile) return false;
  return roomState.value.leaderID === store.profile.id;
});

const hasGameOptions = computed(() => {
  if (!roomState.value) return false;
  const { roles, addons } = roomState.value.options;
  return [...Object.values(roles), ...Object.values(addons)].some((el) => Boolean(el));
});

const gameResult = computed(() => {
  if (roomState.value?.stage === 'started' && roomState.value.game?.result) {
    return roomState.value.game.result.winner;
  }
  return undefined;
});

const gamePlayers = computed(() => {
  if (roomState.value?.stage === 'started' && roomState.value.game?.players) {
    return roomState.value.game.players;
  }
  return [];
});

const gameState = computed((): VisualGameState | null => {
  if (roomState.value?.stage === 'started' && roomState.value.game) {
    return roomState.value.game;
  }
  return null;
});

// 是否可以选择玩家
const canSelectPlayer = computed(() => {
  // 房主在等待阶段可以踢人（点击玩家）
  if (isRoomLeader.value && (roomState.value?.stage === 'created' || roomState.value?.stage === 'locked')) {
    return true;
  }

  // 游戏中的selectTeam阶段，领袖可以选择
  if (roomState.value?.stage === 'started' && gameState.value?.stage === 'selectTeam') {
    const currentPlayer = gameState.value.players.find((p) => p.id === store.profile?.id);
    return currentPlayer?.features.isLeader || false;
  }

  // 刺杀阶段，刺客可以选择玩家
  if (roomState.value?.stage === 'started' && gameState.value?.stage === 'assassinate') {
    const currentPlayer = gameState.value.players.find((p) => p.id === store.profile?.id);
    return currentPlayer?.features.waitForAction || false;
  }

  return false;
});

// 根据游戏阶段返回当前应该显示的面板类型
const currentPanelType = computed(() => {
  if (!gameState.value || !store.profile) return null;

  const stage = gameState.value.stage;
  const currentPlayer = gameState.value.players.find((p) => p.id === store.profile?.id);

  // 游戏结束
  if (stage === 'end') {
    return 'result';
  }

  // 只有需要行动的玩家才显示面板
  if (!currentPlayer?.features.waitForAction) {
    return null;
  }

  // 根据阶段返回对应面板类型
  switch (stage) {
    case 'selectTeam':
      // 只有领袖才显示选择队伍面板
      if (currentPlayer.features.isLeader) {
        return 'teamSelection';
      }
      return null;

    case 'votingForTeam':
      return 'voting';

    case 'onMission':
      // 只有在任务中的玩家才显示
      if (currentPlayer.features.isSent) {
        return 'missionAction';
      }
      return null;

    default:
      return null;
  }
});

// 初始化房间
const initRoom = async (uuid: string) => {
  try {
    const state = await socket.emitWithAck<TRoomState | ISocketError>('joinRoom', uuid);

    if ('error' in state) {
      errorMessage.value = state;
    } else {
      roomState.value = state;
    }
  } catch (e) {
    console.error('Failed to join room:', e);
    errorMessage.value = { error: 'connection_failed' };
  }
};

// Initialize from route query (replaces onLoad)
const uuid = route.query.uuid as string | undefined;
if (uuid) {
  roomUuid.value = uuid;
  initRoom(uuid);
}

// Socket 事件处理
const handleRoomUpdated = (state: TRoomState) => {
  if (state.roomID === roomUuid.value) {
    roomState.value = state;
  }
};

const handleGameUpdated = (game: any) => {
  if (game.uuid === roomUuid.value && roomState.value?.stage === 'started') {
    // 更新游戏状态
    if (roomState.value.stage === 'started') {
      roomState.value.game = game;
    }
  }
};

const handleRestartGame = (uuid: string) => {
  // 重新进入房间
  router.replace({ name: 'room', query: { uuid } });
};

const handleDestroyRoom = (gameUUID: string) => {
  if (gameUUID === roomUuid.value) {
    showToast({
      title: '房间已关闭',
      icon: 'none',
      duration: 2000,
    });
    setTimeout(() => {
      router.push({ name: 'profile' });
    }, 2000);
  }
};

// 注册Socket监听
onMounted(() => {
  socket.on('roomUpdated', handleRoomUpdated);
  socket.on('gameUpdated', handleGameUpdated);
  socket.on('restartGame', handleRestartGame);
  socket.on('destroyRoom', handleDestroyRoom);
});

// 清理Socket监听
onUnmounted(() => {
  socket.off('roomUpdated', handleRoomUpdated);
  socket.off('gameUpdated', handleGameUpdated);
  socket.off('restartGame', handleRestartGame);
  socket.off('destroyRoom', handleDestroyRoom);
});

// Cleanup when leaving the room (replaces onUnload)
onBeforeUnmount(() => {
  if (roomUuid.value && store.profile?.id) {
    // 如果游戏未开始，调用 leaveGame 从玩家列表中移除
    if (roomState.value && (roomState.value.stage === 'created' || roomState.value.stage === 'locked')) {
      socket.emit('leaveGame', roomUuid.value);
    }
    socket.emit('leaveRoom', roomUuid.value);
  }
});

// 开始游戏
const handleStartGame = () => {
  if (!roomState.value) {
    return;
  }

  if (roomState.value.players.length < 5) {
    showModal({
      title: '人数不足',
      content: '游戏至少需要5名玩家才能开始',
      showCancel: false,
      confirmText: '我知道了',
    });
    return;
  }

  socket.emit('startGame', roomUuid.value);
};

// 返回大厅
const handleBackToLobby = () => {
  if (roomUuid.value && store.profile?.id) {
    // 如果游戏未开始，调用 leaveGame 从玩家列表中移除
    if (roomState.value && (roomState.value.stage === 'created' || roomState.value.stage === 'locked')) {
      socket.emit('leaveGame', roomUuid.value);
    }
    socket.emit('leaveRoom', roomUuid.value);
  }
  router.push({ name: 'index' });
};

// 离开房间
const handleLeaveRoom = async () => {
  const res = await showModal({
    title: '确认离开',
    content: '确定要离开房间吗？',
  });
  if (res.confirm) {
    handleBackToLobby();
  }
};

// 处理玩家点击
const handlePlayerClick = async (playerId: string) => {
  // 游戏中的选择队伍阶段
  if (roomState.value?.stage === 'started' && gameState.value?.stage === 'selectTeam') {
    const currentPlayer = gameState.value.players.find((p) => p.id === store.profile?.id);

    // 只有领袖可以选择
    if (currentPlayer?.features.isLeader) {
      // 切换玩家选中状态
      const index = selectedPlayers.value.indexOf(playerId);
      if (index > -1) {
        selectedPlayers.value.splice(index, 1);
      } else {
        selectedPlayers.value.push(playerId);
      }
    }
    return;
  }

  // 刺杀阶段：点击玩家直接刺杀
  if (roomState.value?.stage === 'started' && gameState.value?.stage === 'assassinate') {
    const currentPlayer = gameState.value.players.find((p) => p.id === store.profile?.id);

    // 只有刺客可以刺杀
    if (currentPlayer?.features.waitForAction) {
      // 不能刺杀自己
      if (playerId === store.profile?.id) {
        showToast({
          title: '不能选择自己',
          icon: 'none',
          duration: 1500,
        });
        return;
      }

      // 确认刺杀
      const userState = store.users[playerId];
      const targetName = userState && 'profile' in userState ? userState.profile.name : '该玩家';

      const res = await showModal({
        title: '确认刺杀',
        content: `确定要刺杀 ${targetName} 吗？`,
        confirmColor: '#ff3b30',
      });
      if (res.confirm && roomUuid.value) {
        // 先选择玩家，再执行刺杀
        socket.emit('selectPlayer', roomUuid.value, playerId);
        // 默认刺杀梅林
        socket.emit('assassinate', roomUuid.value, 'merlin');
      }
    }
    return;
  }

  // 如果是房主且在等待阶段，显示踢人选项
  if (
    isRoomLeader.value &&
    roomState.value &&
    (roomState.value.stage === 'created' || roomState.value.stage === 'locked')
  ) {
    // 不能踢自己
    if (playerId === store.profile?.id) {
      return;
    }

    // 获取玩家名称
    const userState = store.users[playerId];
    const playerName = userState && 'profile' in userState ? userState.profile.name : '该玩家';

    const res = await showActionSheet({
      itemList: [`踢出 ${playerName}`],
      itemColor: '#ff3b30',
    });
    if (res.tapIndex === 0) {
      handleKickPlayer(playerId);
    }
  }
};

// 踢出玩家
const handleKickPlayer = async (playerId: string) => {
  const res = await showModal({
    title: '确认踢出',
    content: '确定要踢出该玩家吗？',
    confirmColor: '#ff3b30',
  });
  if (res.confirm) {
    socket.emit('kickPlayer', roomUuid.value, playerId);
    showToast({
      title: '已踢出玩家',
      icon: 'success',
      duration: 1500,
    });
  }
};

// 获取错误文本
const getErrorText = (error: string): string => {
  const errorMap: Record<string, string> = {
    room_not_found: '房间不存在',
    room_is_full: '房间已满',
    connection_failed: '连接失败',
    not_authorized: '未授权',
  };
  return errorMap[error] || '未知错误';
};

// ============ 游戏事件处理函数 ============

// 发送队伍
const handleSendTeam = () => {
  if (!roomUuid.value || selectedPlayers.value.length === 0) return;

  socket.emit('sentSelectedPlayers', roomUuid.value, selectedPlayers.value);
  selectedPlayers.value = []; // 清空选择
};

// 投票
const handleVote = (option: TVoteOption) => {
  if (!roomUuid.value) return;

  socket.emit('vote', roomUuid.value, option);
};

// 任务执行
const handleMissionAction = (result: TMissionResult) => {
  if (!roomUuid.value) return;

  socket.emit('mission', roomUuid.value, result);
};
</script>

<style scoped lang="scss">
.room {
  padding-top: $spacing-header;
  min-height: 100vh;
  box-sizing: border-box;
  background: linear-gradient(135deg, #355f96 0%, #34495e 35%, #533483 60%, #8b1a1a 100%);
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.error-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px;
  border-radius: $radius-xlarge;
}

.error-title {
  font-size: $font-xl;
  color: $error;
  margin-bottom: 20px;
  font-weight: bold;
}

.room-content {
  padding: 20px 10px 20px;
}

.board-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding-bottom: 20px;
}

.board-wrapper {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.game-components {
  background-color: transparent;
  padding: $spacing-md 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.options-section {
  background-color: $bg-card;
  padding: $spacing-lg;
  border-radius: $radius-large;
  @include shadow-card;
  margin: 0 10px;
}

.section-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
  display: block;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.option-badge {
  font-size: $font-sm;
  color: $primary;
  background-color: $loyalty-good-bg;
  padding: 4px 8px;
  border-radius: $radius-small;
}

.board-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  align-items: center;
  margin-top: $spacing-md;
}

.host-btn {
  padding: 0;
  margin: 0;
  height: 44px;
  min-width: 100px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: $radius-large;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
  transition: all $transition-normal;
  line-height: 44px;
}

.host-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(1px);
}

.host-btn::after {
  border: none;
}

.host-text {
  font-size: $font-md;
  color: $text-white;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.back-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  border-radius: 0;
  font-size: $font-lg;
  border: none;
  background-color: transparent;
  color: $text-primary;
  font-weight: bold;
  transition: opacity $transition-normal;
}

.back-btn:active {
  opacity: 0.6;
}

.back-btn::after {
  border: none;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-text {
  font-size: $font-lg;
  color: $text-disabled;
}

.action-buttons {
  display: flex;
  gap: 12px;
  padding: 20px 10px;
  justify-content: center;
}

.glass-btn {
  flex: 1;
  max-width: 150px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: $radius-large;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
  transition: all $transition-normal;
  padding: 0;
  margin: 0;
  line-height: 44px;
}

.glass-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(1px);
}

.glass-btn::after {
  border: none;
}

.glass-btn-text {
  font-size: $font-md;
  color: $text-white;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
