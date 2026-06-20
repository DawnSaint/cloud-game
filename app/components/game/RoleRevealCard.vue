<template>
  <div class="role-reveal-card" :class="`loyalty-${player.loyalty}`">
    <div class="player-avatar">
      <span class="avatar-initial">{{ playerInitial }}</span>
    </div>

    <div class="player-info">
      <span class="player-name">{{ player.name }}</span>
      <span class="player-role">{{ roleText }}</span>
    </div>

    <div class="loyalty-badge" :class="`badge-${player.loyalty}`">
      <img class="loyalty-icon" :src="loyaltyIcon" mode="aspectFit" />
      <span>{{ loyaltyText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '~/types';

interface Props {
  player: Player;
}

const props = defineProps<Props>();

const playerInitial = computed(() => {
  return props.player.name?.charAt(0).toUpperCase() ?? '';
});

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    servant: '仆人',
    merlin: '梅林',
    percival: '派西维尔',
    minion: '爪牙',
    morgana: '莫甘娜',
    mordred: '莫德雷德',
    oberon: '奥伯伦',
    merlinPure: '纯洁梅林',
    guinevere: '桂妮薇儿',
    tristan: '特里斯坦',
    isolde: '伊索尔德',
    lancelot: '兰斯洛特',
    lancelots: '兰斯洛特们',
    brute: '野蛮人',
    lunatic: '疯子',
    trickster: '骗子',
  };
  return roleMap[props.player.role] || props.player.role;
});

const loyaltyText = computed(() => {
  return props.player.loyalty === 'good' ? '善良' : '邪恶';
});

const loyaltyIcon = computed(() => {
  return props.player.loyalty === 'good'
    ? '/static/images/core/blue_team_no_background.webp'
    : '/static/images/core/red_team_no_background.webp';
});
</script>

<style scoped lang="scss">
.role-reveal-card {
  display: flex;
  align-items: center;
  padding: $spacing-lg;
  background-color: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-medium;
  transition: all $transition-normal;
}

.role-reveal-card.loyalty-good {
  border-color: rgba($loyalty-good, 0.3);
  background-color: rgba($loyalty-good, 0.05);
}

.role-reveal-card.loyalty-evil {
  border-color: rgba($loyalty-evil, 0.3);
  background-color: rgba($loyalty-evil, 0.05);
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: $spacing-md;
  flex-shrink: 0;
}

.avatar-initial {
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.player-name {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
}

.player-role {
  font-size: $font-md;
  color: $text-secondary;
}

.loyalty-badge {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-small;
  font-size: $font-sm;
  font-weight: 500;
}

.loyalty-icon {
  width: 16px;
  height: 16px;
}

.loyalty-badge.badge-good {
  background-color: $loyalty-good;
  color: #fff;
}

.loyalty-badge.badge-evil {
  background-color: $loyalty-evil;
  color: #fff;
}
</style>
