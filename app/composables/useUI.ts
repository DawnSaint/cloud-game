import { reactive } from 'vue';

interface ToastState {
  visible: boolean;
  title: string;
  icon: 'success' | 'none' | 'error';
  duration: number;
  timer: ReturnType<typeof setTimeout> | null;
}

interface ModalState {
  visible: boolean;
  title: string;
  content: string;
  showCancel: boolean;
  confirmText: string;
  cancelText: string;
  confirmColor: string;
  resolve: ((value: { confirm: boolean }) => void) | null;
}

interface LoadingState {
  visible: boolean;
  title: string;
  mask: boolean;
}

interface ActionSheetState {
  visible: boolean;
  itemList: string[];
  itemColor: string;
  resolve: ((value: { tapIndex: number }) => void) | null;
}

interface UIState {
  toast: ToastState;
  modal: ModalState;
  loading: LoadingState;
  actionSheet: ActionSheetState;
}

export const uiState = reactive<UIState>({
  toast: {
    visible: false,
    title: '',
    icon: 'none',
    duration: 2000,
    timer: null,
  },
  modal: {
    visible: false,
    title: '',
    content: '',
    showCancel: true,
    confirmText: '确定',
    cancelText: '取消',
    confirmColor: '',
    resolve: null,
  },
  loading: {
    visible: false,
    title: '',
    mask: true,
  },
  actionSheet: {
    visible: false,
    itemList: [],
    itemColor: '',
    resolve: null,
  },
});

export function showToast(options: { title: string; icon?: 'success' | 'none' | 'error'; duration?: number }) {
  if (uiState.toast.timer) {
    clearTimeout(uiState.toast.timer);
  }

  uiState.toast.title = options.title;
  uiState.toast.icon = options.icon || 'none';
  uiState.toast.duration = options.duration || 2000;
  uiState.toast.visible = true;

  uiState.toast.timer = setTimeout(() => {
    uiState.toast.visible = false;
  }, uiState.toast.duration);
}

export function showModal(options: {
  title?: string;
  content?: string;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}): Promise<{ confirm: boolean }> {
  return new Promise((resolve) => {
    uiState.modal.title = options.title || '';
    uiState.modal.content = options.content || '';
    uiState.modal.showCancel = options.showCancel !== false;
    uiState.modal.confirmText = options.confirmText || '确定';
    uiState.modal.cancelText = options.cancelText || '取消';
    uiState.modal.confirmColor = options.confirmColor || '';
    uiState.modal.resolve = resolve;
    uiState.modal.visible = true;
  });
}

export function closeModal(confirmed: boolean) {
  uiState.modal.visible = false;
  if (uiState.modal.resolve) {
    uiState.modal.resolve({ confirm: confirmed });
    uiState.modal.resolve = null;
  }
}

export function showLoading(options?: { title?: string; mask?: boolean }) {
  uiState.loading.title = options?.title || '';
  uiState.loading.mask = options?.mask !== false;
  uiState.loading.visible = true;
}

export function hideLoading() {
  uiState.loading.visible = false;
}

export function showActionSheet(options: { itemList: string[]; itemColor?: string }): Promise<{ tapIndex: number }> {
  return new Promise((resolve) => {
    uiState.actionSheet.itemList = options.itemList;
    uiState.actionSheet.itemColor = options.itemColor || '';
    uiState.actionSheet.resolve = resolve;
    uiState.actionSheet.visible = true;
  });
}

export function closeActionSheet(tapIndex?: number) {
  uiState.actionSheet.visible = false;
  if (uiState.actionSheet.resolve) {
    uiState.actionSheet.resolve({ tapIndex: tapIndex ?? -1 });
    uiState.actionSheet.resolve = null;
  }
}
