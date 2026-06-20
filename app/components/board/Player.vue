<template>
  <div class="player" :class="playerClasses" @tap="handlePlayerClick">
    <!-- 玩家框架 -->
    <div class="player-frame">
      <!-- 玩家边框装饰 -->
      <img class="player-frame-image" src="/static/images/core/player-frame.webp" mode="aspectFit" />

      <!-- 玩家头像/图标 -->
      <div class="player-avatar">
        <span class="avatar-text">{{ getInitial(playerName) }}</span>
      </div>

      <!-- 领袖标识 -->
      <img v-if="isLeader" class="player-crown" src="/static/images/core/crown.webp" mode="aspectFit" />

      <!-- 选中标识 -->
      <div v-if="isSelected" class="selected-indicator"></div>

      <!-- 玩家名称 -->
      <div class="player-name-container">{{ displayName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '~/stores/main';
import type { RoomPlayer } from '~/types';

interface Props {
  player: RoomPlayer | any; // any 用于游戏中的玩家状态
  displayIndex?: boolean;
  isSelected?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  displayIndex: false,
  isSelected: false,
  clickable: false,
});

const emit = defineEmits<{
  playerClick: [id: string];
}>();

const store = useMainStore();

// 计算属性
const playerName = computed(() => {
  const userState = store.users[props.player.id];
  if (userState && 'profile' in userState && userState.profile) {
    return userState.profile.name;
  }
  // 异步加载用户信息
  store.getUserPublicProfile(props.player.id);
  return '加载中...';
});

const displayName = computed(() => {
  let name = playerName.value;
  if (props.displayIndex && 'index' in props.player) {
    name = `${props.player.index}. ${name}`;
  }
  return name;
});

const isLeader = computed(() => {
  if ('isLeader' in props.player) {
    return props.player.isLeader;
  }
  if ('features' in props.player) {
    return props.player.features.isLeader;
  }
  return false;
});

const playerClasses = computed(() => {
  const classes: Record<string, boolean> = {
    'is-leader': isLeader.value,
    'is-selected': props.isSelected,
    'is-clickable': props.clickable,
  };

  // 游戏中的特殊状态
  if ('features' in props.player) {
    const features = props.player.features;
    classes['is-sent'] = features.isSent || false;
    classes['wait-action'] = features.waitForAction || false;
  }

  return classes;
});

// 获取首字母
const getInitial = (name: string): string => {
  if (!name || name === '加载中...') return '?';
  return name.charAt(0).toUpperCase();
};

// 处理点击
const handlePlayerClick = () => {
  if (props.clickable) {
    emit('playerClick', props.player.id);
  }
};
</script>

<style scoped lang="scss">
.player {
  position: relative;
  width: 60px;
  height: 60px;
  pointer-events: auto;
}

.player-frame {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-frame-image {
  position: absolute;
  width: 60px;
  height: 60px;
  z-index: 1;
  pointer-events: none;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: $secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid $text-white;
  @include shadow-elevated;
  transition: all $transition-normal;
  z-index: 2;
}

.avatar-text {
  font-size: 20px;
  font-weight: bold;
  color: $text-white;
}

.player-crown {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  z-index: 10;
  filter: drop-shadow(0 1px 4px rgba(255, 215, 0, 0.6));
}

.selected-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid $player-selected;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.player-name-container {
  position: absolute;
  bottom: -16px;
  white-space: nowrap;
  max-width: 80px;
  font-size: $font-xs;
  color: $text-white;
  z-index: 1;
}

.name-frame-image {
  position: absolute;
  width: 100%;
  height: 100%;
}

// 状态样式
.is-leader .player-avatar {
  border-color: $player-leader;
  box-shadow: 0 0 10px rgba($player-leader, 0.5);
}

.is-selected .player-avatar {
  border-color: $player-selected;
}

.is-sent .player-avatar {
  border-color: $player-sent;
  box-shadow: 0 0 10px rgba($player-sent, 0.5);
}

.wait-action .player-avatar {
  animation: waiting-pulse 1s infinite;
}

@keyframes waiting-pulse {
  0%,
  100% {
    box-shadow: 0 0 10px rgba($player-wait, 0.5);
  }
  50% {
    box-shadow: 0 0 15px rgba($player-wait, 0.8);
  }
}

.is-clickable {
  .player-avatar {
    cursor: pointer;
  }

  &:active .player-avatar {
    transform: scale(0.95);
  }
}
</style>
