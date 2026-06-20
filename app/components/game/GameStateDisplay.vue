<template>
  <div class="game-state-display">
    <div class="stage-info">
      <span class="stage-text">{{ stageText }}</span>
      <span v-if="showVoteRound" class="vote-round">投票轮 {{ voteRound }}/5</span>
    </div>

    <div v-if="showMissionInfo" class="mission-info">
      <span class="mission-text">任务 {{ currentMission }}/5</span>
      <span class="mission-detail">需要 {{ requiredPlayers }} 名玩家</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisualGameState } from '~/types';

interface Props {
  state: VisualGameState;
}

const props = defineProps<Props>();

// 游戏阶段文本映射
const stageTextMap: Record<string, string> = {
  initialization: '游戏初始化中',
  selectTeam: '领袖选择队伍',
  votingForTeam: '投票决定派遣',
  onMission: '执行任务中',
  assassinate: '刺客行动',
  checkLoyalty: '湖中女神检查',
  revealLoyalty: '公开忠诚度',
  giveExcalibur: '传递圣剑',
  useExcalibur: '使用圣剑',
  end: '游戏结束',
};

const stageText = computed(() => {
  return stageTextMap[props.state.stage] || props.state.stage;
});

const showVoteRound = computed(() => {
  return props.state.stage === 'selectTeam' || props.state.stage === 'votingForTeam';
});

const voteRound = computed(() => {
  return props.state.vote + 1;
});

const currentMission = computed(() => {
  return props.state.mission + 1;
});

const showMissionInfo = computed(() => {
  return (
    props.state.stage === 'selectTeam' || props.state.stage === 'votingForTeam' || props.state.stage === 'onMission'
  );
});

const requiredPlayers = computed(() => {
  const missions = props.state.settings.missions;
  if (missions && missions[props.state.mission]) {
    return missions[props.state.mission]!.players;
  }
  return 0;
});
</script>

<style scoped lang="scss">
.game-state-display {
  padding: $spacing-lg $spacing-md;
  background-color: transparent;
  text-align: center;
}

.stage-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.stage-text {
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
}

.vote-round {
  font-size: $font-sm;
  color: $text-secondary;
}

.mission-info {
  margin-top: $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.mission-text {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 500;
}

.mission-detail {
  font-size: $font-sm;
  color: $text-secondary;
}
</style>
