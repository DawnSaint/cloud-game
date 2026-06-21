<template>
  <NuxtPage class="app-page" />
  <TabBar />
  <UIOverlay />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useMainStore } from '~/stores/main'
import TabBar from '~/components/TabBar.vue'
import UIOverlay from '~/components/UIOverlay.vue'

const store = useMainStore()

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
body,
#__nuxt {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: $bg;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
    'Helvetica Neue', sans-serif;
}

.app-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 60px); // Adjust for TabBar height
  overflow: auto;
}
</style>
