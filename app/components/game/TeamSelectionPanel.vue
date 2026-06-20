<template>
  <div class="team-selection-panel">
    <div class="panel-header">
      <span class="header-title">选择队伍成员</span>
      <span class="header-subtitle">需要选择 {{ requiredPlayers }} 名玩家</span>
    </div>

    <div class="selection-status">
      <span class="status-text"> 已选择: {{ selectedCount }}/{{ requiredPlayers }} </span>
    </div>

    <div class="action-buttons">
      <button class="send-btn" :class="{ disabled: !canSend }" :disabled="!canSend" @click="handleSendTeam">
        {{ canSend ? '派遣队伍' : '请选择队员' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisualGameState } from '~/types';

interface Props {
  game: VisualGameState;
  selectedPlayers: string[];
}

interface Emits {
  (e: 'send-team'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const requiredPlayers = computed(() => {
  const missions = props.game.settings.missions;
  if (missions && missions[props.game.mission]) {
    return missions[props.game.mission]!.players;
  }
  return 0;
});

const selectedCount = computed(() => {
  return props.selectedPlayers.length;
});

const canSend = computed(() => {
  return selectedCount.value === requiredPlayers.value;
});

const handleSendTeam = () => {
  if (canSend.value) {
    emit('send-team');
  }
};
</script>

<style scoped lang="scss">
.team-selection-panel {
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

.selection-status {
  text-align: center;
  margin-bottom: $spacing-lg;
}

.status-text {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.send-btn {
  width: auto;
  padding: 10px 30px;
  background-color: transparent;
  color: $text-primary;
  border-radius: 0;
  font-size: $font-lg;
  font-weight: 600;
  border: none;
  transition: opacity $transition-normal;
}

.send-btn:active {
  opacity: 0.6;
}

.send-btn::after {
  border: none;
}

.send-btn.disabled {
  opacity: 0.4;
}
</style>
