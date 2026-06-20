<template>
  <div class="game-result-display" :class="`winner-${result.winner}`">
    <div class="result-header">
      <span class="result-title">游戏结束</span>
      <div class="winner-content">
        <img class="winner-icon" :src="winnerIcon" mode="aspectFit" />
        <span class="winner-text">{{ winnerText }} 胜利!</span>
      </div>
      <span v-if="result.reason" class="reason-text">{{ reasonText }}</span>
    </div>

    <div class="roles-reveal">
      <span class="reveal-title">角色公开</span>
      <div class="roles-list">
        <RoleRevealCard v-for="player in players" :key="player.id" :player="player" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisualGameState, GameResults } from '~/types';
import RoleRevealCard from './RoleRevealCard.vue';

interface Props {
  game: VisualGameState;
}

const props = defineProps<Props>();

const result = computed((): GameResults => {
  return props.game.result || { winner: 'good' as const, reason: 'goodTeamMissions' as const };
});

const winnerText = computed(() => {
  return result.value.winner === 'good' ? '善良方' : '邪恶方';
});

const winnerIcon = computed(() => {
  return result.value.winner === 'good'
    ? '/static/images/core/blue_team_no_background.webp'
    : '/static/images/core/red_team_no_background.webp';
});

const reasonText = computed(() => {
  const reasonMap: Record<string, string> = {
    merlinAssassinated: '梅林被刺杀',
    missionsFailed: '任务失败次数过多',
    missionsSucceeded: '任务成功次数过多',
    votesFailed: '投票失败5次',
    loverAssassinated: '情侣被刺杀',
  };
  return reasonMap[result.value.reason || ''] || result.value.reason;
});

const players = computed(() => {
  return props.game.players;
});
</script>

<style scoped lang="scss">
.game-result-display {
  min-height: 100vh;
  padding: $spacing-xl $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: background-color $transition-normal;
}

.game-result-display.winner-good {
  background-color: rgba($loyalty-good, 0.05);
}

.game-result-display.winner-evil {
  background-color: rgba($loyalty-evil, 0.05);
}

.result-header {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.result-title {
  display: block;
  font-size: $font-xxl;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.winner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  margin-bottom: $spacing-sm;
}

.winner-icon {
  width: 40px;
  height: 40px;
}

.winner-text {
  font-size: $font-xl;
  font-weight: bold;
}

.winner-good .winner-text {
  color: $loyalty-good;
}

.winner-evil .winner-text {
  color: $loyalty-evil;
}

.reason-text {
  display: block;
  font-size: $font-md;
  color: $text-secondary;
}

.roles-reveal {
  width: 100%;
  max-width: 350px;
}

.reveal-title {
  display: block;
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-lg;
  text-align: center;
}

.roles-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
</style>
