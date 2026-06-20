<template>
  <div class="nickname-form">
    <button class="avatar-button" @click="onChooseAvatar">
      <img v-if="avatarUrl" :src="avatarUrl" class="avatar-preview" mode="aspectFill" />
      <span v-else class="avatar-placeholder">点击选择头像</span>
    </button>

    <!-- 昵称输入 -->
    <input
      v-model="nickname"
      type="nickname"
      class="nickname-input"
      placeholder="请输入昵称"
      maxlength="20"
      @confirm="handleConfirm"
    />

    <!-- 确认按钮 -->
    <button
      class="confirm-btn"
      :class="{ disabled: !canConfirm }"
      @click="handleConfirm"
      :disabled="!canConfirm || loading"
    >
      {{ loading ? '登录中...' : '完成' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Props
interface Props {
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// Emits
interface Emits {
  (e: 'confirm', data: { nickname: string; avatarUrl?: string }): void;
}

const emit = defineEmits<Emits>();

// 状态
const nickname = ref('');
const avatarUrl = ref('');

// 头像选择回调
const onChooseAvatar = (e: any) => {
  const { avatarUrl: url } = e.detail;
  avatarUrl.value = url;
};

// 检查是否可以提交
const canConfirm = computed(() => {
  return nickname.value.trim().length > 0;
});

// 确认提交
const handleConfirm = () => {
  if (!canConfirm.value || props.loading) {
    return;
  }

  emit('confirm', {
    nickname: nickname.value.trim(),
    avatarUrl: avatarUrl.value || undefined,
  });
};

// 重置表单
const reset = () => {
  nickname.value = '';
  avatarUrl.value = '';
};

// 暴露方法给父组件
defineExpose({
  reset,
});
</script>

<style scoped lang="scss">
.nickname-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xl;
  padding-top: $spacing-xxxl;
}

.form-title text {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
}

.avatar-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  overflow: hidden;
  padding: 0;
  transition: all $transition-normal;

  &:active {
    opacity: 0.7;
  }
}

.avatar-button::after {
  border: none;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-placeholder {
  font-size: $font-sm;
  color: $text-disabled;
  text-align: center;
}

.nickname-input {
  padding: $spacing-md $spacing-lg;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-medium;
  font-size: $font-lg;
  color: $text-primary;
  transition: border-color $transition-normal;

  &:focus {
    border-color: $primary;
  }
}

.confirm-btn {
  width: calc(100% - 2 * $spacing-xxxl);
  font-size: $font-xl;
  font-weight: 600;
  margin: $spacing-lg $spacing-xxxl;
  transition: opacity $transition-normal;

  &:active {
    opacity: 0.6;
  }
}
</style>
