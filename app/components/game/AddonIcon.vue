<template>
  <div class="addon-icon-wrapper">
    <div class="addon-icon" :class="`icon-${addonType}`">
      <img v-if="iconSrc" :src="iconSrc" class="addon-image" mode="aspectFit" />
    </div>
    <span v-if="showLabel" class="addon-label">{{ addonLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  addonType: 'ladyOfLake' | 'ladyOfSea' | 'excalibur' | 'plotCards';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  size: 'medium',
});

const iconSrc = computed(() => {
  const iconMap: Record<string, string> = {
    ladyOfLake: '/static/images/features/lady_of_lake.webp',
    ladyOfSea: '/static/images/features/lady_of_sea.webp',
    excalibur: '/static/images/features/excalibur.webp',
    plotCards: '/static/images/features/plot_cards.webp',
  };
  return iconMap[props.addonType];
});

const addonLabel = computed(() => {
  const labelMap: Record<string, string> = {
    ladyOfLake: '湖中女神',
    ladyOfSea: '海之女神',
    excalibur: '圣剑',
    plotCards: '剧情卡',
  };
  return labelMap[props.addonType];
});
</script>

<style scoped lang="scss">
.addon-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
}

.addon-icon {
  width: 40px;
  height: 40px;
  border-radius: $radius-medium;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.addon-image {
  width: 100%;
  height: 100%;
}

.addon-label {
  font-size: $font-xs;
  color: $text-secondary;
  text-align: center;
}
</style>
