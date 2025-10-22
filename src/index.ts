/**
 * @file SaoKit - 一个适用于 Node.js 和浏览器的现代化 WebSocket 库。
 * @description 本库为原生 WebSocket API 提供了一个简单而强大的封装，提供了诸如自动重连、心跳检测和基于 Promise 的连接等功能。
 */

// 导入类型定义
import type { SaoKitOptions, SaoKitEventType, SaoKitEventListener } from './types';

// 重新导出类型定义，以保持向后兼容性
export type { SaoKitOptions, SaoKitEventType, SaoKitEventListener };

/**
 * @class SaoKit
 * @description SaoKit WebSocket 客户端的主类。它管理 WebSocket 连接、事件处理和其他高级功能。
 */
export class SaoKit {
  // 底层的 WebSocket 实例。如果未连接，则为 null。
  private ws: WebSocket | null = null;
  // WebSocket 服务器的 URL。
  private url: string;
  // 合并后的、必需的实例选项。
  private options: Required<SaoKitOptions>;
  // 用于为每种事件类型存储事件监听器的 Map。
  private listeners: Map<SaoKitEventType, SaoKitEventListener[]> = new Map();
  // 当前的重连尝试次数。
  private reconnectAttempts = 0;
  // 心跳间隔的计时器 ID。
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  // 一个标志，用于指示连接是否由用户手动关闭。
  private isManualClose = false;

  /**
   * @constructor
   * @param {string} url - 要连接的 WebSocket 服务器 URL。
   * @param {SaoKitOptions} [options] - 连接选项。
   */
  constructor(url: string, options?: SaoKitOptions) {
    // 存储服务器 URL。
    this.url = url;
    // 将默认选项与用户提供的选项合并。
    // `Required` 类型确保所有选项都有值。
    this.options = {
      autoReconnect: true,          // 默认为 true，开启自动重连。
      reconnectInterval: 5000,      // 默认重连间隔为 5 秒。
      maxReconnectAttempts: 0,      // 默认无限次重连尝试。
      heartbeat: false,             // 默认禁用心跳。
      heartbeatInterval: 30000,     // 默认心跳间隔为 30 秒。
      heartbeatMessage: 'ping',     // 默认心跳消息。
      timeout: 5000,                // 默认连接超时为 5 秒。
      ...options,                   // 使用用户选项覆盖默认值。
    };
    
    // 初始化事件监听器 Map。
    this.initEventListeners();
  }

  /**
   * @private
   * @method initEventListeners
   * @description 初始化用于为每种事件类型保存监听器数组的 Map。
   */
  private initEventListeners(): void {
    // 定义所有可能的事件类型。
    const eventTypes: SaoKitEventType[] = ['open', 'close', 'error', 'message', 'reconnect'];
    // 为每种事件类型创建一个空的监听器数组。
    eventTypes.forEach(type => {
      this.listeners.set(type, []);
    });
  }

  /**
   * @public
   * @method connect
   * @description 建立到 WebSocket 服务器的连接。
   * @returns {Promise<void>} 一个在连接成功打开时解析的 Promise，或者在发生错误或超时时拒绝。
   */
  public async connect(): Promise<void> {
    // 返回一个新的 Promise 来处理异步连接过程。
    return new Promise((resolve, reject) => {
      try {
        // 创建一个新的原生 WebSocket 实例。
        this.ws = new WebSocket(this.url);
        // 为这次新的连接尝试重置手动关闭标志。
        this.isManualClose = false;

        // 为连接尝试设置一个超时。
        const timeout = setTimeout(() => {
          // 如果在超时期限后连接仍处于 CONNECTING 状态...
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            // ...关闭 WebSocket...
            this.ws.close();
            // ...并用超时错误拒绝该 Promise。
            reject(new Error('连接超时'));
          }
        }, this.options.timeout);

        // 定义 'open' 事件的处理程序。
        this.ws.onopen = (event) => {
          // 连接已打开，因此清除连接超时。
          clearTimeout(timeout);
          // 在成功连接后重置重连尝试计数器。
          this.reconnectAttempts = 0;
          // 如果启用了心跳机制，则启动它。
          this.startHeartbeat();
          // 向所有注册的监听器触发 'open' 事件。
          this.emit('open', event);
          // 解析 Promise 以表示连接成功。
          resolve();
        };

        // 定义 'message' 事件的处理程序。
        this.ws.onmessage = (event) => {
          // 当收到消息时，带着消息数据触发 'message' 事件。
          this.emit('message', event);
        };

        // 定义 'close' 事件的处理程序。
        this.ws.onclose = (event) => {
          // 连接已关闭，因此清除连接超时。
          clearTimeout(timeout);
          // 停止心跳机制。
          this.stopHeartbeat();
          // 向所有注册的监听器触发 'close' 事件。
          this.emit('close', event);
          
          // 检查关闭是否是意外的，以及是否启用了自动重连。
          if (!this.isManualClose && this.options.autoReconnect) {
            // 如果是，则尝试重连。
            this.attemptReconnect();
          }
        };

        // 定义 'error' 事件的处理程序。
        this.ws.onerror = (event) => {
          // 发生错误，因此清除连接超时。
          clearTimeout(timeout);
          // 向所有注册的监听器触发 'error' 事件。
          this.emit('error', event);
          // 创建一个标准的 Error 对象来拒绝 Promise。
          const error = new Error('WebSocket connection error');
          // 将原始事件附加到错误对象上以获取更多上下文。
          (error as any).event = event;
          // 用创建的错误拒绝 Promise。
          reject(error);
        };

      } catch (error) {
        // 如果创建 WebSocket 实例失败，立即拒绝 Promise。
        reject(error);
      }
    });
  }

  /**
   * @public
   * @method send
   * @description 通过 WebSocket 连接发送数据。
   * @param {string | ArrayBuffer | Blob} data - 要发送的数据。
   */
  public send(data: string | ArrayBuffer | Blob): void {
    // 检查 WebSocket 是否已连接并准备好发送数据。
    if (this.ws?.readyState === WebSocket.OPEN) {
      // 如果是，则发送数据。
      this.ws.send(data);
    } else {
      // 如果不是，则抛出错误以通知用户。
      throw new Error('WebSocket 连接未建立或已关闭');
    }
  }

  /**
   * @public
   * @method close
   * @description 优雅地关闭 WebSocket 连接。
   * @param {number} [code] - WebSocket 关闭状态码。
   * @param {string} [reason] - 解释为什么连接被关闭的字符串。
   */
  public close(code?: number, reason?: string): void {
    // 设置标志以表明这是手动关闭。
    this.isManualClose = true;
    // 停止心跳机制。
    this.stopHeartbeat();
    // 如果 WebSocket 实例存在...
    if (this.ws) {
      // ...使用提供的代码和原因调用其 close 方法。
      this.ws.close(code, reason);
    }
  }

  /**
   * @public
   * @method on
   * @description 为给定的事件类型注册一个事件监听器。
   * @param {SaoKitEventType} event - 要监听的事件类型。
   * @param {SaoKitEventListener} listener - 事件触发时要调用的函数。
   */
  public on(event: SaoKitEventType, listener: SaoKitEventListener): void {
    // 获取指定事件的监听器数组。
    const listeners = this.listeners.get(event);
    // 如果此事件存在一个数组...
    if (listeners) {
      // ...将新的监听器添加到数组中。
      listeners.push(listener);
    }
  }

  /**
   * @public
   * @method remove
   * @description 移除一个先前注册的事件监听器。
   * @param {SaoKitEventType} event - 监听器所属的事件类型。
   * @param {SaoKitEventListener} listener - 要移除的监听器函数。
   */
  public remove(event: SaoKitEventType, listener: SaoKitEventListener): void {
    // 获取指定事件的监听器数组。
    const listeners = this.listeners.get(event);
    // 如果数组存在...
    if (listeners) {
      // ...找到要移除的监听器的索引。
      const index = listeners.indexOf(listener);
      // 如果找到了监听器...
      if (index > -1) {
        // ...将其从数组中移除。
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * @private
   * @method emit
   * @description 为给定的事件类型调用所有注册的监听器。
   * @param {SaoKitEventType} event - 要触发的事件类型。
   * @param {any} [data] - 要传递给事件监听器的数据。
   */
  private emit(event: SaoKitEventType, data?: any): void {
    // 获取指定事件的监听器数组。
    const listeners = this.listeners.get(event);
    // 如果监听器存在...
    if (listeners) {
      // ...遍历它们并用提供的数据调用每一个。
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * @private
   * @method attemptReconnect
   * @description 根据配置的重连策略尝试重新连接到服务器。
   */
  private attemptReconnect(): void {
    // 检查是否允许重连（无限次尝试或当前尝试次数小于最大值）。
    if (this.options.maxReconnectAttempts === 0 || this.reconnectAttempts < this.options.maxReconnectAttempts) {
      // 增加尝试计数器。
      this.reconnectAttempts++;
      // 触发 'reconnect' 事件以通知用户有关尝试的信息。
      this.emit('reconnect', { attempts: this.reconnectAttempts });
      
      // 在指定的间隔后安排下一次重连尝试。
      setTimeout(async () => {
        try {
          // 再次尝试连接。
          await this.connect();
        } catch (error) {
          // 如果连接尝试失败，将从 `onclose` 处理程序再次调用此方法，从而有效地安排下一次尝试。
        }
      }, this.options.reconnectInterval);
    }
  }

  /**
   * @private
   * @method startHeartbeat
   * @description 开始以固定间隔发送心跳消息。
   */
  private startHeartbeat(): void {
    // 仅当间隔大于 0 时才开始心跳。
    if (this.options.heartbeatInterval > 0) {
      // 设置一个间隔计时器。
      this.heartbeatTimer = setInterval(() => {
        // 在每个间隔，检查 WebSocket 是否打开。
        if (this.ws?.readyState === WebSocket.OPEN) {
          // 准备要发送的消息。
          let message: string | ArrayBuffer | Blob;
          // 如果心跳消息是一个函数，则调用它以获取动态消息。
          if (typeof this.options.heartbeatMessage === 'function') {
            message = this.options.heartbeatMessage();
          } else if (this.options.heartbeatMessage) {
            // 否则，使用静态消息字符串。
            message = this.options.heartbeatMessage;
          } else {
            // 作为备用，创建一个默认的 JSON ping 消息。
            message = JSON.stringify({ type: 'ping', timestamp: Date.now() });
          }
          // 发送心跳消息。
          this.send(message);
        }
      }, this.options.heartbeatInterval);
    }
  }

  /**
   * @private
   * @method stopHeartbeat
   * @description 停止心跳机制。
   */
  private stopHeartbeat(): void {
    // 如果心跳计时器处于活动状态...
    if (this.heartbeatTimer) {
      // ...清除间隔。
      clearInterval(this.heartbeatTimer);
      // ...并重置计时器变量。
      this.heartbeatTimer = null;
    }
  }

  /**
   * @public
   * @property {number} readyState
   * @description 获取 WebSocket 连接的当前状态。
   * @returns {number} WebSocket 的 readyState，如果未初始化，则为 CLOSED。
   */
  public get readyState(): number {
    // 返回 ws 实例的 readyState，如果 ws 为 null，则返回 WebSocket.CLOSED。
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * @public
   * @property {boolean} isConnected
   * @description 检查 WebSocket 连接当前是否打开。
   * @returns {boolean} 如果连接打开，则为 true，否则为 false。
   */
  public get isConnected(): boolean {
    // 仅当 readyState 正好是 WebSocket.OPEN 时返回 true。
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * @function createSaoKit
 * @description 一个用于创建新 SaoKit 实例的工厂函数。
 * @param {string} url - WebSocket 服务器 URL。
 * @param {SaoKitOptions} [options] - 连接选项。
 * @returns {SaoKit} SaoKit 类的一个新实例。
 */
export const createSaoKit = (url: string, options?: SaoKitOptions): SaoKit => {
  // 只需创建并返回一个新的 SaoKit 实例。
  return new SaoKit(url, options);
};

/**
 * @constant {string} version
 * @description SaoKit 库的当前版本。
 */
export const version = '0.1.0';