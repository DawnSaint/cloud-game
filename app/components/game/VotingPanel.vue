<template>
  <div class="voting-panel">
    <div class="panel-header">
      <span class="header-title">投票决定派遣</span>
      <span class="header-subtitle">投票轮 {{ voteRound }}/5</span>
    </div>

    <div class="proposed-team">
      <span class="team-label">提议的队伍:</span>
      <div class="team-members">
        <span v-for="(player, index) in proposedTeamNames" :key="index" class="member-name">
          {{ player }}
        </span>
      </div>
    </div>

    <div v-if="!hasVoted" class="vote-buttons">
      <button class="vote-btn approve" @click="handleVote('approve')">
        <span>赞成</span>
      </button>
      <button class="vote-btn reject" @click="handleVote('reject')">
        <span>反对</span>
      </button>
    </div>

    <div v-else class="voted-indicator">
      <span>已投票，等待其他玩家...</span>
    </div>

    <div v-if="showVoteResult" class="vote-result">
      <span class="result-title">投票结果:</span>
      <div class="result-stats">
        <span class="stat approve">赞成: {{ approveCount }}</span>
        <span class="stat reject">反对: {{ rejectCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VisualGameState, TVoteOption } from '~/types';

interface Props {
  game: VisualGameState;
  currentPlayerId: string;
}

interface Emits {
  (e: 'vote', option: TVoteOption): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const voteRound = computed(() => {
  return props.game.vote + 1;
});

// 获取提议队伍的玩家名称
const proposedTeamNames = computed(() => {
  const selectedPlayers = props.game.players.filter((p) => p.features.isSent);
  return selectedPlayers.map((p) => p.name);
});

// 检查当前玩家是否已投票
const hasVoted = computed(() => {
  const currentPlayer = props.game.players.find((p) => p.id === props.currentPlayerId);
  return currentPlayer ? !currentPlayer.features.waitForAction : false;
});

// 检查是否显示投票结果（所有人都投票完成）
const showVoteResult = computed(() => {
  const allVoted = props.game.players.every((p) => !p.features.waitForAction);
  return allVoted && props.game.history.length > 0;
});

// 计算赞成和反对的数量
const approveCount = computed(() => {
  if (!showVoteResult.value) return 0;

  // 从历史记录中获取最近的投票记录
  const voteHistory = props.game.history.filter((h) => h.type === 'vote');
  if (voteHistory.length === 0) return 0;

  const latestVote = voteHistory[voteHistory.length - 1];
  if (latestVote && 'votes' in latestVote) {
    return (latestVote.votes as any[]).filter((v: any) => v.value === 'approve').length;
  }
  return 0;
});

const rejectCount = computed(() => {
  if (!showVoteResult.value) return 0;

  const voteHistory = props.game.history.filter((h) => h.type === 'vote');
  if (voteHistory.length === 0) return 0;

  const latestVote = voteHistory[voteHistory.length - 1];
  if (latestVote && 'votes' in latestVote) {
    return (latestVote.votes as any[]).filter((v: any) => v.value === 'reject').length;
  }
  return 0;
});

const handleVote = (option: TVoteOption) => {
  emit('vote', option);
};
</script>

<style scoped lang="scss">
.voting-panel {
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
  font-size: $font-sm;
  color: $text-secondary;
}

.proposed-team {
  margin-bottom: $spacing-lg;
  text-align: center;
}

.team-label {
  display: block;
  font-size: $font-md;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
}

.team-members {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $spacing-sm;
}

.member-name {
  padding: $spacing-xs $spacing-sm;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: $radius-small;
  font-size: $font-sm;
  color: $text-primary;
}

.vote-buttons {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  margin-bottom: $spacing-lg;
}

.vote-btn {
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

.vote-btn:active {
  opacity: 0.6;
}

.vote-btn::after {
  border: none;
}

.vote-btn.approve {
  color: $loyalty-good;
}

.vote-btn.reject {
  color: $loyalty-evil;
}

.voted-indicator {
  text-align: center;
  padding: $spacing-lg;
  color: $text-secondary;
  font-size: $font-md;
}

.vote-result {
  margin-top: $spacing-lg;
  text-align: center;
}

.result-title {
  display: block;
  font-size: $font-md;
  color: $text-primary;
  margin-bottom: $spacing-sm;
  font-weight: 500;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
}

.stat {
  font-size: $font-md;
  font-weight: 500;
}

.stat.approve {
  color: $loyalty-good;
}

.stat.reject {
  color: $loyalty-evil;
}
</style>
