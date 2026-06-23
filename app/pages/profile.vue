<template>
  <div v-if="store.profile" class="profile-page">
    <div class="profile-container">
      <span v-if="currentView !== 'profile'" class="back-button" @click="handleBack">&lsaquo;</span>

      <!-- 个人资料视图 -->
      <div v-if="currentView === 'profile'">
        <!-- 头部信息 -->
        <div class="profile-header">
          <div class="profile-info">
            <span class="profile-name">{{ store.profile.name }}</span>

            <!-- 统计信息 -->
            <div v-if="statsLoading" class="profile-stats">
              <span class="stats-loading">加载中...</span>
            </div>
            <div v-else class="profile-stats">
              <div class="stat-item">
                <span class="stat-label">评分</span>
                <span class="stat-value">{{ displayRating }}</span>
              </div>
              <div class="stat-divider"/>
              <div class="stat-item">
                <span class="stat-label">胜率</span>
                <span class="stat-value" :class="winrateClass">{{ displayWinrate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能菜单 -->
        <div class="menu-section">
          <div class="menu-list">
            <div class="menu-item" @click="handleViewHistory">
              <span class="menu-label">历史战绩</span>
              <span class="menu-arrow">&rsaquo;</span>
            </div>
            <div class="menu-item" @click="handleViewAchievements">
              <span class="menu-label">查看成就</span>
              <span class="menu-arrow">&rsaquo;</span>
            </div>
            <div class="menu-item menu-item--danger" @click="handleLogout">
              <span class="menu-label">退出登录</span>
              <span class="menu-arrow">&rsaquo;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 历史战绩视图 -->
      <HistoryView v-else-if="currentView === 'history'" />

      <!-- 成就视图 -->
      <AchievementsView v-else-if="currentView === 'achievements'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import HistoryView from '~/components/profile/HistoryView.vue';
import AchievementsView from '~/components/profile/AchievementsView.vue';

definePageMeta({
  middleware: () => {
    const store = useMainStore();
    if (!store.isLoggedIn) {
      return navigateTo({ path: '/auth', query: { redirect: '/profile' } });
    }
  },
});

const store = useMainStore();
const router = useRouter();

type ViewType = 'profile' | 'history' | 'achievements';
const currentView = ref<ViewType>('profile');

const statsLoading = ref(true);
const trueSkillRating = ref<number | null>(null);
const winrate = ref<number | null>(null);

const fetchTrueSkillRating = async () => {
  if (!store.profile) return;

  try {
    const result = await socket.emitWithAck('getTrueSkillRating', store.profile.id);
    if (result.success && result.rating?.mu) {
      trueSkillRating.value = Math.round(result.rating.mu);
    }
  } catch (error) {
    console.error('Failed to fetch TrueSkill rating:', error);
  }
};

const fetchWinrate = async () => {
  if (!store.profile) return;

  try {
    const games = await socket.emitWithAck('getPlayerGames', store.profile.id);

    if (Array.isArray(games) && games.length > 0) {
      let wins = 0;
      let total = 0;

      for (const game of games) {
        if (game.result?.winner) {
          total++;
          const player = game.players.find((p: any) => p.id === store.profile?.id);
          if (player) {
            const role = player.role.toLowerCase();
            const evilRoles = ['minion', 'morgana', 'mordred', 'oberon', 'evil_lancelot'];
            const playerLoyalty = evilRoles.includes(role) ? 'evil' : 'good';

            if (game.result.winner === playerLoyalty) {
              wins++;
            }
          }
        }
      }

      if (total > 0) {
        winrate.value = (wins / total) * 100;
      }
    }
  } catch (error) {
    console.error('Failed to fetch winrate:', error);
  }
};

const displayRating = computed(() => {
  return trueSkillRating.value !== null ? trueSkillRating.value : '---';
});

const displayWinrate = computed(() => {
  return winrate.value !== null ? `${winrate.value.toFixed(2)}%` : '---';
});

const winrateClass = computed(() => {
  if (winrate.value === null) return '';
  if (winrate.value < 40) return 'winrate-low';
  if (winrate.value < 50) return 'winrate-medium';
  return 'winrate-high';
});

const initStats = async () => {
  statsLoading.value = true;
  await Promise.all([fetchTrueSkillRating(), fetchWinrate()]);
  statsLoading.value = false;
};

onMounted(() => {
  if (store.profile) {
    initStats();
  }
});

const handleViewAchievements = () => {
  currentView.value = 'achievements';
};

const handleViewHistory = () => {
  currentView.value = 'history';
};

const handleBack = () => {
  currentView.value = 'profile';
};

const handleLogout = () => {
  store.logout();
  router.replace({ path: '/auth' });
};
</script>

<style scoped lang="scss">
.profile-page {
  box-sizing: border-box;
  padding: $spacing-header $spacing-lg calc(80px + env(safe-area-inset-bottom, 0px));
}

.back-button {
  position: fixed;
  top: $spacing-xxxl;
  left: $spacing-xl;
  font-size: $font-xxl;
  color: $text-secondary;

  &:active {
    opacity: 0.5;
  }
}

.profile-container {
  max-width: 350px;
  margin: 0 auto;
}

.profile-header {
  background: transparent;
  border-radius: 0;
  padding: 30px 20px;
  margin-bottom: $spacing-lg;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.profile-name {
  color: $text-primary;
  font-size: $font-xxl;
  font-weight: bold;
  text-align: center;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  margin-top: $spacing-sm;
}

.stats-loading {
  font-size: $font-md;
  color: $text-disabled;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.stat-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-value {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
}

.stat-divider {
  width: 1px;
  height: 25px;
  background-color: rgba(0, 0, 0, 0.1);
}

.winrate-low {
  color: $error;
}

.winrate-medium {
  color: #ff9800;
}

.winrate-high {
  color: $success;
}

.menu-section {
  margin-top: $spacing-xl;
}

.menu-list {
  display: flex;
  flex-direction: column;
  background: transparent;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: $spacing-lg $spacing-md;
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color $transition-normal;
  cursor: pointer;

  &:active {
    background-color: rgba(0, 0, 0, 0.02);
  }

  &--danger .menu-label {
    color: $error;
  }
}

.menu-label {
  flex: 1;
  font-size: $font-lg;
  color: $text-primary;
  font-weight: 500;
}

.menu-arrow {
  font-size: $font-xxl;
  color: $text-secondary;
  margin-left: $spacing-sm;
}
</style>
