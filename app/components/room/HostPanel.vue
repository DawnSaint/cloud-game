<template>
  <div class="host-panel">
    <!-- 房主操作弹窗 -->
    <div v-if="visible" class="panel-overlay" @tap="handleOverlayTap">
      <div class="panel-content" @tap.stop>
        <div class="panel-header">
          <span class="panel-title">选项</span>
          <div class="close-btn" @tap="handleClose">
            <span class="close-icon">✕</span>
          </div>
        </div>

        <div class="panel-body">
          <!-- 游戏前的操作 -->
          <div v-if="roomStage !== 'started'" class="action-section">
            <!-- <button class="action-btn" @tap="handleLockRoom">
              {{ roomStage === 'created' ? '锁定房间' : '解锁房间' }}
            </button> -->

            <!-- <button class="action-btn" @tap="handleGameSettings">
              游戏设置
            </button> -->
          </div>

          <!-- 游戏中的操作 -->
          <div v-else class="action-section">
            <div class="hint-text">
              <span>注意：这些操作会影响正在进行的游戏</span>
            </div>

            <button class="action-btn warning" @tap="handleEndGame">结束游戏</button>

            <button class="action-btn warning" @tap="handleRestartGame">结束并重启</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { socket } from '~/composables/useSocket';
import { showToast, showModal } from '~/composables/useUI';

interface Props {
  roomUuid: string;
  roomStage: 'created' | 'locked' | 'started';
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  openSettings: [];
}>();

// 处理遮罩层点击
const handleOverlayTap = () => {
  emit('close');
};

// 关闭面板
const handleClose = () => {
  emit('close');
};

// 锁定/解锁房间
const handleLockRoom = () => {
  socket.emit('lockRoom', props.roomUuid);
  emit('close');
  showToast({
    title: props.roomStage === 'created' ? '房间已锁定' : '房间已解锁',
    icon: 'success',
    duration: 1500,
  });
};

// 游戏设置
const handleGameSettings = () => {
  emit('close');
  emit('openSettings');
};

// 结束游戏
const handleEndGame = async () => {
  const res = await showModal({
    title: '确认结束',
    content: '确定要结束当前游戏吗？',
    confirmColor: '#ff3b30',
  });
  if (res.confirm) {
    socket.emit('endGame', props.roomUuid);
    emit('close');
    showToast({
      title: '游戏已结束',
      icon: 'success',
      duration: 1500,
    });
  }
};

// 结束并重启游戏
const handleRestartGame = async () => {
  const res = await showModal({
    title: '确认重启',
    content: '确定要结束当前游戏并重新开始吗？',
    confirmColor: '#ff9500',
  });
  if (res.confirm) {
    socket.emit('endAndRestartGame', props.roomUuid);
    emit('close');
    showToast({
      title: '正在重启游戏',
      icon: 'none',
      duration: 1500,
    });
  }
};
</script>

<style scoped lang="scss">
.host-panel {
  position: relative;
}

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.panel-content {
  width: 100%;
  max-height: 80vh;
  background-color: $bg;
  border-radius: 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.panel-header {
  position: relative;
  padding: 20px 15px 10px;
  border-bottom: 1px solid $border-color;
}

.panel-title {
  font-size: $font-xl;
  font-weight: bold;
  color: $text-primary;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: $font-xl;
  color: $text-secondary;
}

.panel-body {
  padding: 15px;
  max-height: 60vh;
  overflow-y: auto;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.hint-text {
  padding: $spacing-md;
  background-color: color.adjust($warning, $lightness: 40%);
  border-radius: $radius-medium;
  margin-bottom: 5px;
}

.hint-text text {
  font-size: $font-sm;
  color: color.adjust($warning, $lightness: -30%);
}

.action-btn {
  width: 100%;
  height: 44px;
  line-height: 44px;
  background-color: transparent;
  color: $text-primary;
  border-radius: 0;
  font-size: $font-lg;
  border: none;
  text-align: center;
  font-weight: 600;
  transition: opacity $transition-normal;
}

.action-btn::after {
  border: none;
}

.action-btn.primary {
  background: transparent;
  color: $text-primary;
  font-weight: 600;
}

.action-btn.warning {
  background-color: transparent;
  color: $text-primary;
}

.action-btn:active {
  opacity: 0.6;
}
</style>
