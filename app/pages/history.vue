<template>
  <div class="history-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 无数据 -->
    <div v-else-if="games.length === 0" class="empty-container">
      <span class="empty-text">暂无游戏记录</span>
    </div>

    <!-- 游戏列表 -->
    <template v-else>
      <div class="page-header">
        <span class="page-title">历史战绩</span>
        <span class="page-subtitle">共 {{ games.length }} 场游戏</span>
      </div>

      <div class="games-list">
        <GameHistoryCard v-for="game in games" :key="game.uuid" :game="game" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMainStore } from '~/stores/main';
import { socket } from '~/composables/useSocket';
import GameHistoryCard from '~/components/history/GameHistoryCard.vue';
import { showToast } from '~/composables/useUI';

interface GameResult {
  winner?: 'good' | 'evil';
  reason: string;
}

interface Player {
  id: string;
  index: number;
  role: string;
  features: {
    isLeader?: boolean;
  };
}

interface GameHistory {
  uuid: string;
  stage: string;
  result?: GameResult;
  players: Player[];
  mission: number;
  vote: number;
}

const store = useMainStore();
const loading = ref(true);
const games = ref<GameHistory[]>([]);

// 获取游戏历史
const fetchGameHistory = async () => {
  if (!store.profile) return;

  try {
    loading.value = true;

    const result = await socket.emitWithAck('getPlayerGames', store.profile.id);

    if (Array.isArray(result)) {
      games.value = result;
    }
  } catch (error) {
    console.error('Failed to fetch game history:', error);
    showToast({
      title: '获取战绩失败',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchGameHistory();
});
</script>

<style scoped lang="scss">
.history-page {
  min-height: 100vh;
  padding: $spacing-lg $spacing-lg 70px;
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-text,
.empty-text {
  font-size: $font-lg;
  color: $text-disabled;
}

.page-header {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.page-title {
  display: block;
  font-size: $font-xxl;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.page-subtitle {
  display: block;
  font-size: $font-md;
  color: $text-secondary;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
</style>
