<template>
  <div>
    <div class="avatar-item" :class="{ 'avatar-error-highlight': hasError }" @click="selectAvatar(avatar)">
      <Avatar :class="avatarClasses" :avatarID="avatar.id" />
      <div
        ref="icon"
        class="icon"
        :class="avatar.available ? 'icon-check' : 'icon-lock'"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <span class="material-icons"> {{ avatar.available ? 'check_circle_outline' : 'lock_outline' }} </span>
      </div>
      <div
        v-if="isHovered"
        class="floating"
        :class="!avatar.available ? 'not-availiable' : ''"
        ref="floating"
        :style="floatingStyles"
      >
        {{ avatar.available && avatar.info ? avatar.info : $t('avatars.' + avatar.id + 'Hint') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, toRef } from 'vue';
import Avatar from '@/components/user/Avatar.vue';
import { IAvatarInfo } from '@avalon/types';
import { useFloating, offset, flip, shift } from '@floating-ui/vue';

export default defineComponent({
  components: {
    Avatar,
  },
  props: {
    avatar: {
      type: Object as () => IAvatarInfo,
      required: true,
    },
    selectAvatar: {
      type: Function,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    hasError: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const icon = ref<HTMLElement | null>(null);
    const floating = ref<HTMLElement | null>(null);
    const isHovered = ref(false);

    const { floatingStyles } = useFloating(icon, floating, {
      placement: 'right',
      middleware: [offset(10), flip(), shift()],
    });

    const avatarClasses = computed(() => {
      const classes = ['avatar-preview'];

      if (props.isSelected) {
        classes.push('avatar-selected');
      }

      if (!props.avatar.available) {
        classes.push('avatar-not-available');
      }

      return classes;
    });

    const hasError = toRef(props, 'hasError');

    return {
      floatingStyles,
      icon,
      floating,
      isHovered,
      avatarClasses,
      selectAvatar: props.selectAvatar,
      avatar: props.avatar,
      hasError,
    };
  },
});
</script>

<style scoped lang="scss">
.avatar-preview {
  background-color: gray;
  width: 100px;
  height: 100px;
}

.avatar-selected {
  border: 4px solid rgb(var(--v-theme-info));
}

.avatar-not-available {
  filter: grayscale(1);
}

.avatar-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;

  &.avatar-error-highlight {
    animation: pulse-error 1.5s ease-in-out infinite;
  }
}

@keyframes pulse-error {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgb(var(--v-theme-error));
  }
  50% {
    box-shadow:
      0 0 0 5px rgb(var(--v-theme-error)),
      0 0 15px rgba(var(--v-theme-error), 0.6);
  }
}

.icon {
  cursor: help;
  position: absolute;
  left: 2px;
  bottom: 2px;
}

.icon-lock {
  color: white;
}

.icon-check {
  color: rgb(var(--v-theme-success));
}

.icon-lock .material-icons,
.icon-check .material-icons {
  font-size: 30px;
}

.floating {
  z-index: 100;
  font-size: 12px;
  background-color: rgb(var(--v-theme-surface));
  padding: 4px 8px;
  border-radius: 4px;
  border: 2px solid rgb(var(--v-theme-success));
  box-shadow: 0 2px 4px rgba(var(--v-theme-text-primary), 0.4);
  position: fixed;
  max-width: 200px;
  word-wrap: break-word;
}

.not-availiable {
  border: 2px solid rgb(var(--v-theme-info));
}
</style>
