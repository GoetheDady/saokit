/**
 * SaoKit 基本使用示例
 * 演示如何使用 SaoKit WebSocket 库
 */

// 如果在 Node.js 环境中，需要先安装 ws 包作为 WebSocket 实现
// npm install ws
// const WebSocket = require('ws');
// global.WebSocket = WebSocket;

// 导入 SaoKit（在实际使用中）
// import { SaoKit } from 'saokit';
// 或者使用默认导出
// import createSaoKit from 'saokit';

// 示例：创建 WebSocket 连接
function basicExample() {
  // 创建 SaoKit 实例
  const socket = new SaoKit('ws://localhost:8080', {
    autoReconnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  });

  // 监听连接打开事件
  socket.on('open', (event) => {
    console.log('WebSocket 连接已建立');
    
    // 发送消息
    socket.send('Hello, SaoKit!');
    socket.send(JSON.stringify({ type: 'greeting', message: 'Hello from client' }));
  });

  // 监听消息接收事件
  socket.on('message', (event) => {
    console.log('收到消息:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      console.log('解析后的消息:', data);
    } catch (e) {
      console.log('非 JSON 消息:', event.data);
    }
  });

  // 监听连接关闭事件
  socket.on('close', (event) => {
    console.log('WebSocket 连接已关闭', event.code, event.reason);
  });

  // 监听错误事件
  socket.on('error', (event) => {
    console.error('WebSocket 错误:', event);
  });

  // 监听重连事件
  socket.on('reconnect', (event) => {
    console.log(`重连成功，尝试次数: ${event.attempts}`);
  });

  // 建立连接
  socket.connect()
    .then(() => {
      console.log('连接建立成功');
    })
    .catch((error) => {
      console.error('连接失败:', error);
    });

  // 5 秒后关闭连接（示例）
  setTimeout(() => {
    socket.close();
  }, 5000);

  return socket;
}

// 示例：使用默认导出函数
function factoryExample() {
  // 使用工厂函数创建实例
  const socket = createSaoKit('ws://localhost:8080');
  
  socket.on('open', () => {
    console.log('使用工厂函数创建的连接已建立');
  });
  
  return socket.connect();
}

// 导出示例函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { basicExample, factoryExample };
}