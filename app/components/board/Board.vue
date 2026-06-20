<template>
  <div class="board-container" :style="boardScale">
    <!-- 游戏背景圆盘 -->
    <div class="game-board" :class="boardClasses">
      <!-- 中心内容区域 -->

      <span v-if="roomStage === 'created' || roomStage === 'locked'" class="waiting-text"
        >等待玩家加入 {{ players.length }}/10</span
      >
      <slot name="host-panel"></slot>
    </div>

    <!-- 玩家圆形布局 -->
    <div v-for="(player, index) in players" :key="player.id" class="player-position" :style="getPlayerPosition(index)">
      <div class="player-wrapper" :style="getPlayerRotation(index)">
        <Player
          :player="player"
          :display-index="displayPlayerIndex"
          :is-selected="isPlayerSelected(player.id)"
          :clickable="canSelectPlayer"
          @player-click="handlePlayerClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Player from './Player.vue';
import type { RoomPlayer } from '~/types';

interface Props {
  players: RoomPlayer[] | any[];
  roomStage?: 'created' | 'locked' | 'started';
  displayPlayerIndex?: boolean;
  selectedPlayers?: string[];
  canSelectPlayer?: boolean;
  gameResult?: 'good' | 'evil';
}

const props = withDefaults(defineProps<Props>(), {
  roomStage: 'created',
  displayPlayerIndex: false,
  selectedPlayers: () => [],
  canSelectPlayer: false,
});

const emit = defineEmits<{
  playerClick: [playerId: string];
}>();

// 计算玩家位置（圆形布局）
const getPlayerPosition = (index: number) => {
  const playerCount = props.players.length;
  const angle = (360 / playerCount) * index;
  const radius = 300; // 半径，单位 px

  // 计算 x, y 坐标
  const radian = (angle - 90) * (Math.PI / 180);
  const x = Number((radius * Math.cos(radian)).toFixed(2));
  const y = Number((radius * Math.sin(radian)).toFixed(2));

  return {
    transform: `translate(${x}px, ${y}px)`,
    transition: 'transform 0.5s ease',
  };
};

// 计算玩家旋转（使玩家名称始终朝外）
const getPlayerRotation = (index: number) => {
  const playerCount = props.players.length;
  const angle = (360 / playerCount) * index;

  return {
    transform: `rotate(${-angle}deg)`,
    transition: 'transform 0.5s ease',
  };
};

// 棋盘样式类
const boardClasses = computed(() => {
  return {
    'game-end-good': props.gameResult === 'good',
    'game-end-evil': props.gameResult === 'evil',
  };
});

// 棋盘缩放（根据屏幕大小自适应）
const boardScale = computed(() => {
  // 这里可以根据实际需求调整缩放比例
  return {
    transform: 'scale(1)',
  };
});

// 判断玩家是否被选中
const isPlayerSelected = (playerId: string): boolean => {
  return props.selectedPlayers.includes(playerId);
};

// 处理玩家点击
const handlePlayerClick = (playerId: string) => {
  emit('playerClick', playerId);
};
</script>

<style scoped lang="scss">
.board-container {
  position: relative;
  width: 350px;
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-board {
  width: 100%;
  height: 100%;
  background-image: url('https://storage.yandexcloud.net/avalon-game/images/core/board.webp');
  background-size: 100%;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all $transition-slow;
}

// 游戏结束效果
.game-end-good {
  background: $game-end-good;
  @include game-end-shadow($game-end-good);
  animation: victory-pulse 2s infinite;
}

.game-end-evil {
  background: $game-end-evil;
  @include game-end-shadow($game-end-evil);
  animation: victory-pulse 2s infinite;
}

@keyframes victory-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.waiting-text {
  font-size: $font-lg;
  color: $text-white;
  font-weight: bold;
  opacity: 0.9;
}

.game-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-text {
  font-size: $font-xl;
  color: $text-white;
  font-weight: bold;
  opacity: 0.9;
}

// 玩家位置容器
.player-position {
  position: absolute;
  pointer-events: none;
}

.player-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}
</style>
