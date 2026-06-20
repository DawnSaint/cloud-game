<template>
  <div
    class="achievement-card"
    :class="{
      'achievement-card--completed': achievement.completed,
    }"
  >
    <div class="achievement-content">
      <span class="achievement-name">{{ achievementName }}</span>
      <span class="achievement-description">{{ achievementDescription }}</span>

      <!-- 进度条 -->
      <div v-if="shouldShowProgress" class="achievement-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"/>
        </div>
        <span class="progress-text">
          {{ achievement.progress.currentValue }} / {{ achievement.progress.maxValue }}
        </span>
      </div>

      <!-- 详细进度（角色进度） -->
      <div v-if="showRolesProgress" class="detailed-progress">
        <span class="detailed-title">角色进度:</span>
        <div class="detailed-grid">
          <div
            v-for="role in rolesMetadata"
            :key="role"
            class="detailed-item"
            :class="{ completed: achievement.state?.[role] }"
          >
            <span class="detail-icon">{{ achievement.state?.[role] ? '√' : '×' }}</span>
            <span class="detail-label">{{ getRoleName(role) }}</span>
          </div>
        </div>
      </div>

      <!-- 详细进度（玩家数量进度） -->
      <div v-if="showPlayerCountsProgress" class="detailed-progress">
        <span class="detailed-title">人数进度:</span>
        <div class="detailed-grid">
          <div
            v-for="count in playerCountsMetadata"
            :key="count"
            class="detailed-item"
            :class="{ completed: achievement.state?.[count] }"
          >
            <span class="detail-icon">{{ achievement.state?.[count] ? '√' : '×' }}</span>
            <span class="detail-label">{{ count }}人</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 完成标识 -->
    <div v-if="achievement.completed" class="completed-badge">
      <span class="badge-text">√</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '~/stores/main';

interface Props {
  achievement: {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    progress: {
      currentValue: number;
      maxValue: number;
    };
    metadata?: {
      roles?: string[];
      playerCounts?: number[];
    };
    state?: Record<string, boolean>;
  };
}

const props = defineProps<Props>();

const store = useMainStore();

// 角色名称映射
const ROLE_NAMES: Record<string, string> = {
  servant: '忠臣',
  merlin: '梅林',
  percival: '派西维尔',
  mordred: '莫德雷德',
  morgana: '莫甘娜',
  oberon: '奥伯伦',
  minion: '爪牙',
};

// 计算属性
const achievementName = computed(() => {
  return props.achievement.name;
});

const achievementDescription = computed(() => {
  return props.achievement.description;
});

const shouldShowProgress = computed(() => {
  return !props.achievement.completed && props.achievement.progress.maxValue > 0;
});

const progressPercentage = computed(() => {
  if (props.achievement.progress.maxValue === 0) return 0;
  return Math.min(
    100,
    Math.round((props.achievement.progress.currentValue / props.achievement.progress.maxValue) * 100),
  );
});

const rolesMetadata = computed(() => {
  return props.achievement.metadata?.roles || [];
});

const playerCountsMetadata = computed(() => {
  return props.achievement.metadata?.playerCounts || [];
});

const showRolesProgress = computed(() => {
  return rolesMetadata.value.length > 0 && props.achievement.state && !props.achievement.completed;
});

const showPlayerCountsProgress = computed(() => {
  return playerCountsMetadata.value.length > 0 && props.achievement.state && !props.achievement.completed;
});

const getRoleName = (role: string): string => {
  return ROLE_NAMES[role] || role;
};
</script>

<style scoped lang="scss">
.achievement-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  background-color: $bg-card;
  border-radius: $radius-large;
  @include shadow-card;
  position: relative;
  transition: all $transition-normal;

  &--completed {
    border-left: 2px solid $success;
  }
}

.icon-text {
  font-size: 20px;
}

.achievement-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.achievement-name {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
}

.achievement-description {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: 1.5;
}

.achievement-progress {
  margin-top: $spacing-sm;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: $radius-small;
  overflow: hidden;
  margin-bottom: $spacing-xs;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary 0%, $primary-light-15 100%);
  transition: width $transition-normal;
}

.progress-text {
  font-size: $font-xs;
  color: $text-secondary;
}

.detailed-progress {
  margin-top: $spacing-md;
}

.detailed-title {
  display: block;
  font-size: $font-sm;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: $spacing-sm;
}

.detailed-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-xs;
}

.detailed-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: $radius-small;

  &.completed {
    background-color: rgba($success, 0.1);

    .detail-icon {
      color: $success;
    }
  }
}

.detail-icon {
  font-size: $font-sm;
  color: $error;
}

.detail-label {
  font-size: $font-xs;
  color: $text-secondary;
}

.completed-badge {
  position: absolute;
  top: $spacing-sm;
  right: $spacing-sm;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: $success;
  display: flex;
  align-items: center;
  justify-content: center;
  @include shadow-elevated;
}

.badge-text {
  color: $text-white;
  font-size: $font-md;
  font-weight: bold;
}
</style>
