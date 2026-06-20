<template>
  <div v-if="visible" class="settings-overlay" @tap="handleClose">
    <div class="settings-content" @tap.stop>
      <div class="settings-header">
        <span class="settings-title">游戏设置</span>
        <div class="close-btn" @tap="handleClose">
          <span class="close-icon">✕</span>
        </div>
      </div>

      <div>
        <!-- 角色设置 -->
        <div class="settings-section">
          <div class="section-header">
            <span class="section-title">角色配置</span>
            <span class="section-hint">选择游戏中包含的角色</span>
          </div>

          <div class="options-grid">
            <!-- 好人阵营 -->
            <div class="option-group">
              <span class="group-title">正义阵营</span>
              <div
                v-for="role in goodRoles"
                :key="role.key"
                class="option-item"
                :class="{ active: localOptions.roles[role.key] }"
                @tap="toggleRole(role.key)"
              >
                <span class="option-name">{{ role.name }}</span>
              </div>
            </div>

            <!-- 坏人阵营 -->
            <div class="option-group">
              <span class="group-title">邪恶阵营</span>
              <div
                v-for="role in evilRoles"
                :key="role.key"
                class="option-item"
                :class="{ active: localOptions.roles[role.key] }"
                @tap="toggleRole(role.key)"
              >
                <span class="option-name">{{ role.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button class="footer-btn cancel" @tap="handleClose">取消</button>
        <button class="footer-btn confirm" @tap="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { socket } from '~/composables/useSocket';
import type { GameOptions, GameOptionsRoles, GameOptionsAddons } from '~/types';
import { showToast } from '~/composables/useUI';

interface Props {
  visible: boolean;
  roomUuid: string;
  options: GameOptions;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

// 本地选项副本
const localOptions = ref<GameOptions>({
  roles: { ...props.options.roles },
  addons: { ...props.options.addons },
  features: { ...props.options.features },
});

// 监听 props 变化，更新本地副本
watch(
  () => props.options,
  (newOptions) => {
    localOptions.value = {
      roles: { ...newOptions.roles },
      addons: { ...newOptions.addons },
      features: { ...newOptions.features },
    };
  },
  { deep: true },
);

// 角色配置
interface RoleOption {
  key: keyof GameOptionsRoles;
  name: string;
}

const goodRoles: RoleOption[] = [
  { key: 'merlin', name: '梅林' },
  { key: 'percival', name: '派西维尔' },
  { key: 'guinevere', name: '桂妮薇儿' },
  { key: 'cleric', name: '牧师' },
  { key: 'revealer', name: '揭示者' },
];

const evilRoles: RoleOption[] = [
  { key: 'morgana', name: '莫甘娜' },
  { key: 'mordred', name: '莫德雷德' },
  { key: 'oberon', name: '奥伯伦' },
  { key: 'witch', name: '女巫' },
  { key: 'brute', name: '蛮族' },
  { key: 'lunatic', name: '疯子' },
];

// 扩展配置
const addons = [
  {
    key: 'lady_of_lake',
    name: '湖中女神',
    desc: '可以查看其他玩家的阵营',
  },
  {
    key: 'excalibur',
    name: '圣剑',
    desc: '领袖可以使用圣剑强制任务成功',
  },
  {
    key: 'lady_of_sea',
    name: '海之女神',
    desc: '湖中女神的变体版本',
  },
  {
    key: 'plot_cards',
    name: '阴谋卡牌',
    desc: '增加特殊能力卡牌',
  },
];

// 切换角色
const toggleRole = (roleKey: keyof GameOptionsRoles) => {
  localOptions.value.roles[roleKey] = !localOptions.value.roles[roleKey];
};

// 关闭
const handleClose = () => {
  emit('close');
};

// 保存设置
const handleSave = () => {
  socket.emit('updateOptions', props.roomUuid, localOptions.value);
  showToast({
    title: '设置已保存',
    icon: 'success',
    duration: 1500,
  });
  emit('close');
};
</script>

<style scoped lang="scss">
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1001;
  animation: fadeIn 0.3s ease;
}

.settings-content {
  width: 100%;
  max-height: 90vh;
  background-color: $bg;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.settings-header {
  position: relative;
  padding: 20px 15px 10px;
  border-bottom: 1px solid $border-color;
  flex-shrink: 0;
}

.settings-title {
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
  border-radius: 50%;
  background-color: $border-light;
}

.close-icon {
  font-size: $font-xl;
  color: $text-secondary;
}

.settings-body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 20px;
}

.section-header {
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-xs;
}

.section-hint {
  font-size: $font-sm;
  color: $text-disabled;
  display: block;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 13px;
  font-weight: bold;
  color: #666;
  margin-bottom: 3px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background-color: $btn-secondary;
  border-radius: $radius-medium;
  border: 1px solid transparent;
  transition: all $transition-normal;
}

.option-item.active {
  background-color: $loyalty-good-bg;
  border-color: $primary;
}

.option-icon {
  font-size: $font-xl;
}

.option-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.addon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: $btn-secondary;
  border-radius: $radius-medium;
  border: 1px solid transparent;
  transition: all $transition-normal;
}

.addon-item.active {
  background-color: $loyalty-good-bg;
  border-color: $primary;
}

.addon-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.addon-icon {
  font-size: 20px;
}

.addon-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.addon-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.addon-desc {
  font-size: 11px;
  color: #999;
}

.addon-toggle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: $btn-disabled;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-normal;
}

.addon-item.active .addon-toggle {
  background-color: $primary;
}

.addon-toggle text {
  font-size: $font-md;
  color: $text-white;
  font-weight: bold;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f8f8f8;
  border-radius: 6px;
}

.feature-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.feature-desc {
  font-size: 11px;
  color: #999;
}

.feature-toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background-color: $btn-disabled;
  position: relative;
  transition: all $transition-normal;
}

.feature-toggle.active {
  background-color: $primary;
}

.toggle-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
}

.feature-toggle.active .toggle-dot {
  left: 22px;
}

.settings-footer {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1px solid $border-color;
  flex-shrink: 0;
}

.footer-btn {
  flex: 1;
  height: 44px;
  line-height: 44px;
  border-radius: 0;
  font-size: $font-lg;
  border: none;
  background-color: transparent;
  color: $text-primary;
  font-weight: 600;
  transition: opacity $transition-normal;
}

.footer-btn:active {
  opacity: 0.6;
}

.footer-btn::after {
  border: none;
}

.footer-btn.cancel {
  background-color: transparent;
  color: $text-secondary;
}

.footer-btn.confirm {
  background: transparent;
  color: $text-primary;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
