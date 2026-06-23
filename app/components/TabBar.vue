<template>
  <div class="tab-bar">
    <div
      v-for="tab in tabs"
      :key="tab.key"
      class="tab-bar-item"
      :class="{ active: activeTab === tab.key }"
      @click="handleTabClick(tab.key)"
    >
      <span class="tab-bar-text">{{ tab.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const tabs = [
  { key: 'index', label: '主页', path: '/' },
  { key: 'wiki', label: '规则', path: '/wiki' },
  { key: 'profile', label: '我的', path: '/profile' },
];

const activeTab = computed(() => {
  const match = tabs.find((t) => t.path === route.path);
  return match?.key || 'index';
});

const handleTabClick = (key: string) => {
  const tab = tabs.find((t) => t.key === key);
  if (tab) {
    router.push(tab.path);
  }
};
</script>

<style scoped lang="scss">
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  background-color: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.6;
  }
}

.tab-bar-text {
  font-size: 14px;
  color: #666666;
  font-weight: 500;
  transition: color 0.2s;

  .active & {
    color: #82b1ff;
  }
}
</style>
