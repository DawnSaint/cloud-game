<template>
  <div
    class="game-card"
    :class="{
      'game-card--victory': isPlayerWin,
      'game-card--defeat': !isPlayerWin,
    }"
    @tap="handleCardClick"
  >
    <!-- 胜负标识 -->
    <div class="game-result">
      <img class="result-icon" :src="resultIcon" mode="aspectFit" >
      <span class="result-text">{{ isPlayerWin ? '胜利' : '失败' }}</span>
    </div>

    <!-- 游戏信息 -->
    <div class="game-info">
      <div class="info-row">
        <span class="info-label">游戏ID:</span>
        <span class="info-value">{{ shortGameId }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">玩家角色:</span>
        <span class="info-value">{{ playerRoleName }}</span>
      </div>

      <div class="info-row">
        <span class="info-label">玩家数量:</span>
        <span class="info-value">{{ game.players.length }}人</span>
      </div>

      <div class="info-row">
        <span class="info-label">任务进度:</span>
        <span class="info-value">第{{ game.mission }}轮</span>
      </div>

      <div class="info-row">
        <span class="info-label">结束原因:</span>
        <span class="info-value">{{ endReasonText }}</span>
      </div>
    </div>

    <!-- 阵营标识 -->
    <div class="camp-badge">
      <img class="camp-icon" :src="campIcon" mode="aspectFit" >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '~/stores/main';
import { getRoleImage, getRoleName } from '~/utils/roleImages';
import { showToast } from '~/composables/useUI';

interface Props {
  game: {
    uuid: string;
    stage: string;
    result?: {
      winner?: 'good' | 'evil';
      reason: string;
    };
    players: Array<{
      id: string;
      index: number;
      role: string;
      features: {
        isLeader?: boolean;
      };
    }>;
    mission: number;
    vote: number;
  };
}

const props = defineProps<Props>();
const store = useMainStore();

// 结束原因映射
const END_REASON_MAP: Record<string, string> = {
  evilTeamMissions: '邪恶方完成任务',
  goodTeamMissions: '正义方完成任务',
  missMerlin: '未刺中梅林',
  killMerlin: '刺中梅林',
  missGuinevere: '未刺中圭妮薇尔',
  killGuinevere: '刺中圭妮薇尔',
  missLovers: '未杀死情侣',
  killLovers: '杀死情侣',
  missCleric: '未杀死教士',
  killCleric: '杀死教士',
  rejectedVote: '投票被拒绝',
};

// 计算属性
const currentPlayer = computed(() => {
  return props.game.players.find((p) => p.id === store.profile?.id);
});

const playerRole = computed(() => {
  return currentPlayer.value?.role || '';
});

const playerRoleName = computed(() => {
  if (!playerRole.value) return '未知';
  return getRoleName(playerRole.value as any) || playerRole.value;
});

const playerLoyalty = computed(() => {
  const role = playerRole.value.toLowerCase();
  const evilRoles = ['minion', 'morgana', 'mordred', 'oberon', 'evil_lancelot'];
  return evilRoles.includes(role) ? 'evil' : 'good';
});

const isPlayerWin = computed(() => {
  return props.game.result?.winner === playerLoyalty.value;
});

const shortGameId = computed(() => {
  return props.game.uuid.substring(0, 8);
});

const endReasonText = computed(() => {
  if (!props.game.result?.reason) return '未知';
  return END_REASON_MAP[props.game.result.reason] || props.game.result.reason;
});

const resultIcon = computed(() => {
  return isPlayerWin.value
    ? '/static/images/core/blue_team_no_background.webp'
    : '/static/images/core/red_team_no_background.webp';
});

const campIcon = computed(() => {
  return playerLoyalty.value === 'good'
    ? '/static/images/core/blue_team_no_background.webp'
    : '/static/images/core/red_team_no_background.webp';
});

// 点击卡片查看详情
const handleCardClick = () => {
  // 可以导航到游戏详情页面
  showToast({
    title: '功能开发中',
    icon: 'none',
  });
};
</script>

<style scoped lang="scss">
.game-card {
  position: relative;
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: $bg-card;
  border-radius: $radius-large;
  @include shadow-card;
  transition: all $transition-normal;
  border-left: 3px solid transparent;

  &--victory {
    border-left-color: $loyalty-good;
  }

  &--defeat {
    border-left-color: $loyalty-evil;
  }

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.game-result {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm;
}

.result-icon {
  width: 30px;
  height: 30px;
}

.result-text {
  font-size: $font-sm;
  font-weight: bold;
  color: $text-primary;
}

.game-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.info-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.info-label {
  font-size: $font-xs;
  color: $text-secondary;
  min-width: 60px;
}

.info-value {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 500;
}

.camp-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  opacity: 0.3;
}

.camp-icon {
  width: 25px;
  height: 25px;
}
</style>
