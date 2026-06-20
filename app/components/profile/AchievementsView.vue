<template>
  <div class="achievements-view">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 成就内容 -->
    <template v-else>
      <!-- 成就总览 -->
      <div class="achievement-summary">
        <div class="summary-header">
          <span class="summary-title">成就进度</span>
        </div>
        <div class="summary-content">
          <div class="summary-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: completionPercentage + '%' }"/>
            </div>
          </div>
          <div class="summary-stats">
            <span class="stats-text"> 已完成 {{ completedCount }} / {{ totalCount }} 个成就 </span>
            <span class="stats-percentage">{{ completionPercentage }}%</span>
          </div>
        </div>
      </div>

      <!-- 公开成就 -->
      <div class="achievement-section">
        <span class="section-title">公开成就</span>
        <div class="achievement-list">
          <AchievementCard v-for="achievement in openAchievements" :key="achievement.id" :achievement="achievement" />
        </div>
      </div>

      <!-- 隐藏成就 -->
      <div v-if="hiddenAchievements.length > 0" class="achievement-section">
        <span class="section-title">隐藏成就</span>
        <div class="achievement-list">
          <AchievementCard
            v-for="achievement in hiddenAchievements"
            :key="achievement.id"
            :achievement="achievement"
            :is-hidden="true"
          />
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
  type: 'open' | 'hidden';
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
}

const store = useMainStore();
const loading = ref(true);
const achievements = ref<Achievement[]>([]);

// 分类成就
const openAchievements = computed(() => {
  return achievements.value.filter((a) => a.type === 'open');
});

const hiddenAchievements = computed(() => {
  return achievements.value.filter((a) => a.type === 'hidden');
});

// 统计数据
const totalCount = computed(() => achievements.value.length);
const completedCount = computed(() => achievements.value.filter((a) => a.completed).length);
const completionPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((completedCount.value / totalCount.value) * 100);
});

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

      // 保存成就列表到 store
      store.setAchievements(allAchievements);

      // 合并成就数据
      achievements.value = allAchievements.map((achievement: any) => {
        const userAchievement = userAchievements.find((ua: any) => ua.achievementID === achievement.id);

        return {
          ...achievement,
          type: achievement.type || 'open',
          completed: userAchievement?.completed || false,
          progress: {
            currentValue: userAchievement?.currentProgress || 0,
            maxValue: achievement.requirement,
          },
          state: userAchievement?.state || {},
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

onMounted(() => {
  fetchAchievements();
});
</script>

<style scoped lang="scss">
.achievements-view {
  min-height: 60vh;
  padding: $spacing-lg 0;
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

.achievement-summary {
  background-color: $bg-card;
  border-radius: $radius-large;
  padding: $spacing-lg;
  margin-bottom: $spacing-xl;
  @include shadow-card;
}

.summary-header {
  margin-bottom: $spacing-md;
}

.summary-title {
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.summary-progress {
  width: 100%;
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
}

.summary-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-text {
  font-size: $font-md;
  color: $text-secondary;
}

.stats-percentage {
  font-size: $font-xl;
  font-weight: bold;
  color: $primary;
}

.achievement-section {
  margin-bottom: $spacing-xl;
}

.section-title {
  display: block;
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
</style>
