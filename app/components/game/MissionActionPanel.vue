<template>
  <div class="mission-action-panel">
    <div class="panel-header">
      <span class="header-title">执行任务</span>
      <span class="header-subtitle">请选择你的行动</span>
    </div>

    <div v-if="!hasActed" class="action-buttons">
      <button class="action-btn success" @click="handleAction('success')">
        <span>成功</span>
      </button>
      <button v-if="canFail" class="action-btn fail" @click="handleAction('fail')">
        <span>失败</span>
      </button>
    </div>

    <div v-else class="acted-indicator">
      <span>已提交，等待其他玩家...</span>
    </div>

    <div v-if="!canFail" class="info-hint">
      <span>善良方只能选择成功</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisualGameState, TMissionResult } from '~/types';

interface Props {
  game: VisualGameState;
  currentPlayerId: string;
}

interface Emits {
  (e: 'action', result: TMissionResult): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 获取当前玩家
const currentPlayer = computed(() => {
  return props.game.players.find((p) => p.id === props.currentPlayerId);
});

// 检查是否可以投失败
const canFail = computed(() => {
  if (!currentPlayer.value) return false;
  return currentPlayer.value.validMissionsResult?.includes('fail');
});

// 检查是否已经行动
const hasActed = computed(() => {
  if (!currentPlayer.value) return false;
  return !currentPlayer.value.features.waitForAction;
});

const handleAction = (result: TMissionResult) => {
  emit('action', result);
};
</script>

<style scoped lang="scss">
.mission-action-panel {
  padding: $spacing-lg $spacing-md;
  background-color: transparent;
}

.panel-header {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.header-title {
  display: block;
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.header-subtitle {
  display: block;
  font-size: $font-md;
  color: $text-secondary;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  margin-bottom: $spacing-lg;
}

.action-btn {
  flex: 1;
  max-width: 100px;
  padding: 10px;
  background-color: transparent;
  border-radius: 0;
  font-size: $font-lg;
  font-weight: 600;
  border: none;
  transition: opacity $transition-normal;
}

.action-btn:active {
  opacity: 0.6;
}

.action-btn::after {
  border: none;
}

.action-btn.success {
  color: $loyalty-good;
}

.action-btn.fail {
  color: $loyalty-evil;
}

.acted-indicator {
  text-align: center;
  padding: $spacing-lg;
  color: $text-secondary;
  font-size: $font-md;
}

.info-hint {
  text-align: center;
  margin-top: $spacing-md;
  padding: $spacing-sm;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: $radius-small;
}

.info-hint text {
  font-size: $font-sm;
  color: $text-secondary;
}
</style>
