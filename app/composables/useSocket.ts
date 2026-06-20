import { socketURL, userProfilePath } from '~/utils/const';
import type { Dictionary } from '~/types';

type SocketCallback = (data: any) => void;
type AckCallback = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private messageQueue: string[] = [];
  private listeners: Map<string, SocketCallback[]> = new Map();
  private ackCallbacks: Map<number, AckCallback> = new Map();
  private ackId: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private auth: Dictionary<string | undefined> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private getAuthToken(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
      const userProfileInStorage = localStorage.getItem(userProfilePath);
      if (userProfileInStorage) {
        const profile = JSON.parse(userProfileInStorage);
        return profile?.token;
      }
    } catch (e) {
      console.error('Failed to get auth token:', e);
    }
    return undefined;
  }

  connect() {
    this.auth.token = this.getAuthToken();

    const url = `${socketURL}?token=${this.auth.token || ''}`;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connect');
        this.flushMessageQueue();
      };

      this.socket.onmessage = (res) => {
        try {
          const message = JSON.parse(res.data as string);
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket closed');
        this.connected = false;
        this.emit('disconnect');
        this.handleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        this.connected = false;
        this.emit('disconnect');
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      this.handleReconnect();
    }

    return this;
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(message: any) {
    const { event, data, ackId } = message;

    if (ackId !== undefined && this.ackCallbacks.has(ackId)) {
      const callback = this.ackCallbacks.get(ackId);
      if (callback) {
        callback(data);
        this.ackCallbacks.delete(ackId);
      }
      return;
    }

    if (event) {
      this.emit(event, data);
    }
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendRaw(message);
      }
    }
  }

  private sendRaw(message: string) {
    if (!this.connected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.socket.send(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  emit(event: string, ...args: any[]) {
    if (event === 'connect' || event === 'disconnect') {
      const listeners = this.listeners.get(event) || [];
      listeners.forEach((callback) => callback(args[0]));
      return;
    }

    const message = JSON.stringify({
      event,
      data: args,
    });
    this.sendRaw(message);
  }

  emitWithAck<T = any>(event: string, ...args: any[]): Promise<T> {
    return new Promise((resolve) => {
      const ackId = this.ackId++;
      this.ackCallbacks.set(ackId, resolve);

      const message = JSON.stringify({
        event,
        data: args,
        ackId,
      });
      this.sendRaw(message);

      setTimeout(() => {
        if (this.ackCallbacks.has(ackId)) {
          this.ackCallbacks.delete(ackId);
          resolve(null as any);
        }
      }, 30000);
    });
  }

  on(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: SocketCallback) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    return this;
  }

  updateAuthToken() {
    this.auth.token = this.getAuthToken();
    this.ackCallbacks.clear();
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 100);
  }
}

export const socket = new SocketService();
