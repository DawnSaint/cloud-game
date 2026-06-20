<template>
  <div class="achievements-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <span class="loading-text">加载中...</span>
    </div>

    <template v-else>
      <!-- 成就概览 -->
      <div class="summary-card">
        <div class="summary-header">
          <div class="summary-info">
            <span class="summary-title">我的成就</span>
            <span class="summary-subtitle">已完成: {{ completedCount }} / {{ totalCount }}</span>
          </div>
          <div class="progress-circle">
            <span class="progress-text">{{ completionPercentage }}%</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: completionPercentage + '%' }"/>
        </div>
      </div>

      <!-- 全部成就 -->
      <div class="achievements-section">
        <span class="section-title">全部成就</span>
        <div class="achievements-list">
          <AchievementCard v-for="achievement in achievements" :key="achievement.id" :achievement="achievement" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import AchievementCard from '~/components/achievements/AchievementCard.vue';
import { showToast } from '~/composables/useUI';

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  metadata?: Record<string, unknown>;
}

interface UserAchievement {
  achievementID: string;
  currentProgress: number;
  completed: boolean;
  state?: Record<string, unknown>;
}

interface AchievementData {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  progress: {
    currentValue: number;
    maxValue: number;
  };
  metadata?: Record<string, unknown>;
  state?: Record<string, boolean>;
}

const store = useMainStore();
const loading = ref(true);
const achievements = ref<AchievementData[]>([]);

// 获取成就数据
const fetchAchievements = async () => {
  if (!store.profile) return;

  try {
    loading.value = true;

    const [achievementsResponse, userAchievementsResponse] = await Promise.all([
      socket.emitWithAck('getAllAchievements'),
      socket.emitWithAck('getUserAchievements', store.profile.id),
    ]);

    if (achievementsResponse?.success && userAchievementsResponse?.success) {
      const allAchievements = achievementsResponse.achievements || [];
      const userAchievements = userAchievementsResponse.userAchievements || [];

      // 保存成就列表到 store，供全局使用（如 socket 事件）
      store.setAchievements(allAchievements);

      achievements.value = allAchievements.map((achievement: Achievement) => {
        const userAchievement = userAchievements.find((ua: UserAchievement) => ua.achievementID === achievement.id);

        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          completed: userAchievement?.completed || false,
          progress: {
            currentValue: userAchievement?.currentProgress || 0,
            maxValue: achievement.requirement,
          },
          metadata: achievement.metadata,
          state: (userAchievement?.state as Record<string, boolean>) || {},
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    showToast({
      title: '获取成就失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

// 计算属性
const completedCount = computed(() => {
  return achievements.value.filter((a) => a.completed).length;
});

const totalCount = computed(() => {
  return achievements.value.length;
});

const completionPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((completedCount.value / totalCount.value) * 100);
});

onMounted(() => {
  fetchAchievements();
});
</script>

<style scoped lang="scss">
.achievements-page {
  min-height: 100vh;
  background-color: $bg-page;
  padding: $spacing-lg $spacing-lg 70px;
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

.summary-card {
  background-color: $bg-card;
  padding: $spacing-xl;
  border-radius: $radius-large;
  margin-bottom: $spacing-xl;
  @include shadow-card;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
}

.summary-info {
  flex: 1;
}

.summary-title {
  display: block;
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.summary-subtitle {
  display: block;
  font-size: $font-md;
  color: $text-secondary;
}

.progress-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, $primary 0%, $primary-light-20 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  @include shadow-elevated;
}

.progress-text {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-white;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: $radius-small;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $primary 0%, $primary-light-15 100%);
  transition: width $transition-normal;
  border-radius: $radius-small;
}

.achievements-section {
  margin-bottom: $spacing-xl;
}

.section-title {
  display: block;
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
</style>
