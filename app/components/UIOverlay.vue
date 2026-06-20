<template>
  <!-- Toast -->
  <Teleport to="body">
    <div v-if="uiState.toast.visible" class="toast-overlay">
      <div class="toast-box">
        <span v-if="uiState.toast.icon === 'success'" class="toast-icon toast-icon-success">&#10003;</span>
        <span v-else-if="uiState.toast.icon === 'error'" class="toast-icon toast-icon-error">&#10007;</span>
        <span class="toast-title">{{ uiState.toast.title }}</span>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="uiState.modal.visible" class="modal-overlay" @click.self="closeModal(false)">
      <div class="modal-box">
        <div v-if="uiState.modal.title" class="modal-title">{{ uiState.modal.title }}</div>
        <div v-if="uiState.modal.content" class="modal-content">{{ uiState.modal.content }}</div>
        <div class="modal-buttons">
          <button v-if="uiState.modal.showCancel" class="modal-btn modal-btn-cancel" @click="closeModal(false)">
            {{ uiState.modal.cancelText }}
          </button>
          <button
            class="modal-btn modal-btn-confirm"
            :style="uiState.modal.confirmColor ? { color: uiState.modal.confirmColor } : {}"
            @click="closeModal(true)"
          >
            {{ uiState.modal.confirmText }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="uiState.loading.visible" class="loading-overlay" :class="{ 'loading-mask': uiState.loading.mask }">
      <div class="loading-box">
        <div class="loading-spinner"/>
        <span v-if="uiState.loading.title" class="loading-title">{{ uiState.loading.title }}</span>
      </div>
    </div>

    <!-- ActionSheet -->
    <div v-if="uiState.actionSheet.visible" class="actionsheet-overlay" @click.self="closeActionSheet()">
      <div class="actionsheet-box">
        <div
          v-for="(item, index) in uiState.actionSheet.itemList"
          :key="index"
          class="actionsheet-item"
          :style="uiState.actionSheet.itemColor ? { color: uiState.actionSheet.itemColor } : {}"
          @click="closeActionSheet(index)"
        >
          {{ item }}
        </div>
        <div class="actionsheet-cancel" @click="closeActionSheet()">取消</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { uiState, closeModal, closeActionSheet } from '~/composables/useUI';
</script>

<style scoped lang="scss">
/* Toast */
.toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  pointer-events: none;
}

.toast-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
}

.toast-icon-success {
  color: #4caf50;
}

.toast-icon-error {
  color: #ff3b30;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9998;
}

.modal-box {
  width: 300px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-title {
  padding: 20px 20px 8px;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.modal-content {
  padding: 8px 20px 20px;
  font-size: 14px;
  text-align: center;
  color: #666;
  line-height: 1.5;
}

.modal-buttons {
  display: flex;
  border-top: 1px solid #eee;
}

.modal-btn {
  flex: 1;
  padding: 14px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;

  &:active {
    background: #f5f5f5;
  }
}

.modal-btn-cancel {
  color: #999;
  border-right: 1px solid #eee;
}

.modal-btn-confirm {
  color: #82b1ff;
  font-weight: 600;
}

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9997;
}

.loading-mask {
  background: rgba(255, 255, 255, 0.8);
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 32px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 8px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-title {
  color: #fff;
  font-size: 14px;
}

/* ActionSheet */
.actionsheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9996;
}

.actionsheet-box {
  width: 100%;
  max-width: 500px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actionsheet-item {
  padding: 16px;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  font-size: 18px;
  color: #333;
  cursor: pointer;

  &:active {
    background: #eee;
  }
}

.actionsheet-cancel {
  padding: 16px;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #999;
  cursor: pointer;

  &:active {
    background: #eee;
  }
}
</style>
