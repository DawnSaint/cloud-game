<template>
  <NuxtPage class="app-page" />
  <TabBar v-if="showTabBar" />
  <UIOverlay />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMainStore } from '~/stores/main'
import TabBar from '~/components/TabBar.vue'
import UIOverlay from '~/components/UIOverlay.vue'

const route = useRoute()
const store = useMainStore()

const hiddenTabBarRoutes = new Set(['auth'])
const showTabBar = computed(() => !hiddenTabBarRoutes.has(String(route.name)))

onMounted(() => {
  if (store.profile) {
    console.log('User logged in:', store.profile.name)
  }
})

onUnmounted(() => {
  console.log('App Unmounted')
})
</script>

<style lang="scss">
@font-face {
  font-family: 'Overt';
  src: url('/static/Overt.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: $bg;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
}

#__nuxt {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.app-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
