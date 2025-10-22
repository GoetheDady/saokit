/**
 * SaoKit WebSocket 库测试文件
 * 测试核心功能和 API
 */

import { SaoKit, createSaoKit } from '../src/index';

// Mock WebSocket for testing
class MockWebSocket {
  static instances: MockWebSocket[] = [];

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string | ArrayBuffer | Blob): void {
    if (this.readyState === MockWebSocket.OPEN) {
      console.log('Mock send:', data);
    } else {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING;
    this.simulateClose(code, reason);
  }

  // 模拟方法
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen({ type: 'open' });
    }
  }

  simulateClose(code = 1000, reason = 'Normal closure'): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ type: 'close', code, reason });
    }
  }

  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage({ type: 'message', data });
    }
  }

  simulateError(error: any): void {
    if (this.onerror) {
      this.onerror({ type: 'error', error });
    }
  }
}

// 设置全局 WebSocket mock
(global as any).WebSocket = MockWebSocket;

describe('SaoKit WebSocket Library', () => {
  let socket: SaoKit;
  const testUrl = 'ws://localhost:8080';

  beforeEach(() => {
    MockWebSocket.instances = [];
    // 使用 jest.useFakeTimers 来控制 setTimeout 和 setInterval
    jest.useFakeTimers();
    socket = new SaoKit(testUrl, {
      reconnectInterval: 1000, // 设置一个较短的重连间隔以便测试
    });
  });

  afterEach(() => {
    if (socket) {
      socket.close();
    }
    // 清理 timers
    jest.useRealTimers();
  });

  describe('构造函数和初始化', () => {
    test('应该正确创建 SaoKit 实例', () => {
      expect(socket).toBeInstanceOf(SaoKit);
      expect(socket.readyState).toBe(MockWebSocket.CLOSED);
      expect(socket.isConnected).toBe(false);
    });
  });

  describe('连接管理', () => {
    test('应该能够建立连接', async () => {
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;
      expect(socket.isConnected).toBe(true);
    });

    test('应该能够关闭连接', async () => {
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;
      expect(socket.isConnected).toBe(true);

      const closeSpy = jest.spyOn(mockWs, 'close');
      socket.close(1000, 'Manually closed');

      expect(closeSpy).toHaveBeenCalledWith(1000, 'Manually closed');
      expect(socket.readyState).toBe(MockWebSocket.CLOSED);
      expect(socket.isConnected).toBe(false);
    });
  });

  describe('消息发送', () => {
    test('应该能够发送字符串消息', async () => {
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;

      const sendSpy = jest.spyOn(mockWs, 'send');
      socket.send('test message');

      expect(sendSpy).toHaveBeenCalledWith('test message');
    });

    test('应该在未连接时抛出错误', () => {
      expect(() => socket.send('test')).toThrow('WebSocket 连接未建立或已关闭');
    });
  });

  describe('事件监听', () => {
    test('应该能够添加和触发 open 事件', async () => {
      const openHandler = jest.fn();
      socket.on('open', openHandler);
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;
      expect(openHandler).toHaveBeenCalledWith(expect.objectContaining({ type: 'open' }));
    });

    test('应该能够触发 close 事件', async () => {
      const closeHandler = jest.fn();
      socket.on('close', closeHandler);
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;
      mockWs.simulateClose(1006, 'Abnormal closure');
      expect(closeHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 1006 }));
    });

    test('应该能够触发 error 事件', async () => {
      const errorHandler = jest.fn();
      socket.on('error', errorHandler);
      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      const error = new Error('Test Error');
      mockWs.simulateError(error);

      await expect(connectPromise).rejects.toThrow('WebSocket connection error');
      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ error }));
    });

    test('应该能够移除事件监听器', async () => {
      const openHandler = jest.fn();
      socket.on('open', openHandler);
      socket.remove('open', openHandler);

      const connectPromise = socket.connect();
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      await connectPromise;

      expect(openHandler).not.toHaveBeenCalled();
    });
  });

  describe('自动重连', () => {
    test('当连接意外断开时应该自动重连', async () => {
      const reconnectHandler = jest.fn();
      socket.on('reconnect', reconnectHandler);

      socket.connect().catch(e => console.error(e));
      let mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();
      expect(socket.isConnected).toBe(true);

      // 模拟连接意外断开
      mockWs.simulateClose(1006, 'Abnormal closure');
      expect(socket.isConnected).toBe(false);

      // 快进时间，触发重连
      jest.advanceTimersByTime(1000);

      expect(reconnectHandler).toHaveBeenCalled();
      expect(MockWebSocket.instances.length).toBe(2); // 应该创建了新的 WebSocket 实例

      // 模拟重连成功
      mockWs = MockWebSocket.instances[1];
      mockWs.simulateOpen();
      expect(socket.isConnected).toBe(true);
    });
  });

  describe('心跳检测', () => {
    test('应该按时发送心跳包', () => {
      const heartbeatSocket = new SaoKit(testUrl, {
        heartbeat: true,
        heartbeatInterval: 500,
        heartbeatMessage: 'ping',
      });

      const sendSpy = jest.spyOn(MockWebSocket.prototype, 'send');

      heartbeatSocket.connect().catch(e => console.error(e));
      const mockWs = MockWebSocket.instances[0];
      mockWs.simulateOpen();

      // 快进时间，触发心跳
      jest.advanceTimersByTime(500);
      expect(sendSpy).toHaveBeenCalledWith('ping');

      jest.advanceTimersByTime(500);
      expect(sendSpy).toHaveBeenCalledTimes(2);
      
      sendSpy.mockRestore();
    });
  });
});

describe('工厂函数', () => {
  test('应该能够使用默认导出创建实例', () => {
    const socket = createSaoKit('ws://localhost:8080');
    expect(socket).toBeInstanceOf(SaoKit);
  });
});