<template>
  <v-menu :eager="true">
    <template v-slot:activator="{ props }">
      <v-btn color="text-primary" size="large" variant="plain" v-bind="props">
        <template v-slot:append>
          <span class="material-icons"> menu </span>
        </template>
        {{ $t('menu.menu') }}
      </v-btn>
    </template>
    <nav>
      <router-link to="/" class="menu-item">
        <span class="material-icons">home</span>
        <span class="menu-text">{{ $t('menu.home') }}</span>
      </router-link>
      <router-link @click="$emit('profileClick')" :to="{ name: 'profile' }" class="menu-item">
        <span class="material-icons">person</span>
        <span class="menu-text">{{ $t('menu.profile') }}</span>
      </router-link>
      <router-link :to="{ name: 'wiki' }" class="menu-item">
        <span class="material-icons">menu_book</span>
        <span class="menu-text">{{ $t('menu.wiki') }}</span>
      </router-link>
      <router-link :to="{ name: 'stats' }" class="menu-item">
        <span class="material-icons">analytics</span>
        <span class="menu-text">{{ $t('menu.stats') }}</span>
      </router-link>
      <router-link :to="{ name: 'leaderboard' }" class="menu-item">
        <span class="material-icons">workspace_premium</span>
        <span class="menu-text">{{ $t('menu.leaderboard') }}</span>
      </router-link>
      <router-link :to="{ name: 'global_achievements' }" class="menu-item">
        <span class="material-icons">emoji_events</span>
        <span class="menu-text">{{ $t('menu.achievements') }}</span>
      </router-link>
      <router-link :to="{ name: 'about' }" class="menu-item">
        <span class="material-icons">info</span>
        <span class="menu-text">{{ $t('menu.about') }}</span>
      </router-link>
    </nav>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>

<style scoped lang="scss">
nav {
  background-color: rgba(var(--v-theme-bg-header), 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  font-size: 18px;
  display: flex;
  align-items: stretch;
  flex-direction: column;
  overflow: hidden;
  min-width: 200px;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  text-decoration: none;
  color: rgb(var(--v-theme-text-primary));
  transition: all 0.2s ease;
  position: relative;
  opacity: 0;
  transform: translateX(10px);
  animation: slideIn 0.25s ease forwards;

  .material-icons {
    font-size: 22px;
    opacity: 0.8;
    transition: opacity 0.2s ease;
  }

  .menu-text {
    flex: 1;
  }

  &:hover {
    background-color: rgba(var(--v-theme-text-primary), 0.08);

    .material-icons {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &.router-link-exact-active {
    color: rgb(var(--v-theme-info));
    background-color: rgba(var(--v-theme-info), 0.1);

    .material-icons {
      opacity: 1;
    }

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: rgb(var(--v-theme-info));
      border-radius: 0 4px 4px 0;
    }
  }

  // Stagger animation for each menu item
  @for $i from 1 through 7 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.04}s;
    }
  }
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
