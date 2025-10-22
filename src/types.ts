/**
 * @file SaoKit 类型定义
 * @description 包含 SaoKit 库的所有类型定义和接口。
 */

/**
 * @interface SaoKitOptions
 * @description 定义 SaoKit 实例的配置选项。
 */
export interface SaoKitOptions {
  /**
   * @property {boolean} [autoReconnect=true] - 是否在连接丢失时自动重连。
   */
  autoReconnect?: boolean;

  /**
   * @property {number} [reconnectInterval=5000] - 两次重连尝试之间的间隔时间（毫秒）。
   */
  reconnectInterval?: number;

  /**
   * @property {number} [maxReconnectAttempts=0] - 最大重连尝试次数。0 表示无限次尝试。
   */
  maxReconnectAttempts?: number;

  /**
   * @property {boolean} [heartbeat=false] - 是否启用心跳机制以保持连接活跃。
   */
  heartbeat?: boolean;

  /**
   * @property {number} [heartbeatInterval=30000] - 发送心跳消息的间隔时间（毫秒）。
   */
  heartbeatInterval?: number;

  /**
   * @property {string | (() => any)} [heartbeatMessage='ping'] - 作为心跳发送的消息。可以是一个字符串，也可以是一个返回消息的函数。
   */
  heartbeatMessage?: string | (() => any);

  /**
   * @property {number} [timeout=5000] - 连接超时时间（毫秒）。
   */
  timeout?: number;
}

/**
 * @type {SaoKitEventType}
 * @description 定义 SaoKit 实例可以触发的事件类型。
 */
export type SaoKitEventType = 'open' | 'close' | 'error' | 'message' | 'reconnect';

/**
 * @type {SaoKitEventListener}
 * @description 定义事件监听器的函数签名。
 */
export type SaoKitEventListener = (event?: any) => void;