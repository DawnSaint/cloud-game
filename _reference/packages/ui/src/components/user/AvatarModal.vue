<template>
  <BaseModal v-model="overlay" :error="error" :additionalError="additionalError" :width="476" @close="closeModal">
    <template #header>
      <h1 class="modal-header">{{ $t('avatars.modalHeader') }}</h1>
    </template>
    <div class="avatars-container">
      <AvatarPreview
        v-for="avatar in state"
        :key="avatar.id"
        :isSelected="avatar.id === selectedAvatar"
        :hasError="avatar.id === errorAvatarId"
        :avatar="avatar"
        :selectAvatar="selectAvatar"
      />
    </div>
  </BaseModal>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/user/BaseModal.vue';
import { socket } from '@/api/socket';
import { IAvatarInfo } from '@avalon/types';
import Avatar from '@/components/user/Avatar.vue';
import AvatarPreview from '@/components/user/AvatarPreview.vue';
import { useStore } from '@/store';

export default defineComponent({
  components: {
    BaseModal,
    Avatar,
    AvatarPreview,
  },
  setup() {
    const overlay = ref<boolean>(false);
    const error = ref<string>('');
    const additionalError = ref<string>('additionalError');
    const errorAvatarId = ref<string | null>(null);
    const state = ref<IAvatarInfo[]>([]);
    const store = useStore();
    const { t } = useI18n();

    const selectedAvatar = computed(() => {
      return store.state.profile?.avatar;
    });

    const initState = async () => {
      const avatars = await socket.emitWithAck('getUserAvatars');

      const sortedAvatars = [...avatars].sort((a, b) => {
        if (a.available && !b.available) return -1;
        if (!a.available && b.available) return 1;
        return 0;
      });

      state.value = sortedAvatars;
    };

    onMounted(() => {
      initState();
    });

    const closeModal = () => {
      overlay.value = false;
    };

    const displayModal = () => {
      overlay.value = true;
    };

    const selectAvatar = async (avatar: IAvatarInfo) => {
      if (!avatar.available) {
        error.value = 'avatarNotAvailable';
        additionalError.value = t('avatars.' + avatar.id + 'Hint');
        errorAvatarId.value = avatar.id;
        return;
      }

      const result = await store.dispatch('updateUserAvatar', { avatarID: avatar.id });

      if (result !== true) {
        error.value = result.error;
        additionalError.value = '';
        errorAvatarId.value = avatar.id;
      } else {
        error.value = '';
        additionalError.value = '';
        errorAvatarId.value = null;
      }
    };

    return {
      state,
      overlay,
      error,
      errorAvatarId,
      closeModal,
      selectedAvatar,
      additionalError,
      selectAvatar,
      displayModal,
    };
  },
});
</script>

<style scoped lang="scss">
.form {
  display: flex;
  flex-direction: column;
}

.avatars-container {
  display: grid;
  grid-template-columns: repeat(4, 100px);
  gap: 12px;
}

.modal-header {
  text-align: center;
  font-size: 20px;
  margin-bottom: 8px;
}

@media (max-width: 520px) {
  .avatars-container {
    grid-template-columns: repeat(3, 100px);
  }
}
</style>
