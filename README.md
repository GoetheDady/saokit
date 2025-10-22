# SaoKit

一个轻量级、高性能的 WebSocket 客户端库，提供自动重连、心跳检测和事件管理功能。

## 特性

- 🚀 轻量级，零依赖
- 🔄 自动重连机制
- 💓 内置心跳检测
- 📡 事件驱动架构
- 🛡️ TypeScript 支持
- 📦 支持多种模块格式 (ES Module, CommonJS, UMD)

## 安装

```bash
npm install saokit
# 或
pnpm add saokit
# 或
yarn add saokit
```

## 🚀 快速开始

以下是一个在浏览器或 Node.js 环境中使用 SaoKit 的基本示例：

```javascript
import { createSaoKit } from 'saokit';

// 使用工厂函数创建 SaoKit 实例
const socket = createSaoKit('ws://localhost:8080', {
  autoReconnect: true,       // 开启自动重连
  reconnectInterval: 5000,   // 重连间隔 5 秒
  heartbeat: true,           // 开启心跳
  heartbeatInterval: 30000,  // 30 秒心跳
});

// 监听连接成功事件
socket.on('open', () => {
  console.log('WebSocket 连接已建立');
  socket.send('Hello, SaoKit!');
});

// 监听接收消息事件
socket.on('message', (event) => {
  console.log('收到消息:', event.data);
});

// 监听连接关闭事件
socket.on('close', (event) => {
  console.log('WebSocket 连接已关闭', event.code, event.reason);
});

// 监听错误事件
socket.on('error', (event) => {
  console.error('WebSocket 发生错误:', event);
});

// 监听重连事件
socket.on('reconnect', (event) => {
  console.log(`正在尝试第 ${event.attempts} 次重连...`);
});

// 异步建立连接
async function main() {
  try {
    await socket.connect();
    console.log('连接成功');
  } catch (err) {
    console.error('连接失败:', err);
  }
}

main();
```

## 💡 在框架中使用

SaoKit 可以轻松集成到现代前端框架中，如 React 和 Vue。

### React 使用示例

在 React 中，推荐将 SaoKit 实例封装在自定义 Hook 中，以便在组件间共享和管理连接状态。

```jsx
// hooks/useSaoKit.js
import { useState, useEffect, useRef } from 'react';
import { createSaoKit } from 'saokit';

const useSaoKit = (url, options) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // 创建 SaoKit 实例
    const socket = createSaoKit(url, options);
    socketRef.current = socket;

    // 定义事件监听
    socket.on('open', () => {
      console.log('React Hook: 连接成功');
      setIsConnected(true);
    });

    socket.on('close', () => {
      console.log('React Hook: 连接关闭');
      setIsConnected(false);
    });

    socket.on('message', (event) => {
      console.log('React Hook: 收到消息', event.data);
      setMessages(prevMessages => [...prevMessages, event.data]);
    });

    socket.on('error', (error) => {
      console.error('React Hook: 发生错误', error);
    });

    // 建立连接
    socket.connect();

    // 组件卸载时关闭连接
    return () => {
      socket.close();
    };
  }, [url, options]);

  // 发送消息的辅助函数
  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.isConnected) {
      socketRef.current.send(message);
    } else {
      console.error('无法发送消息，WebSocket 未连接');
    }
  };

  return { messages, isConnected, sendMessage };
};

export default useSaoKit;

// 在你的组件中使用
// MyComponent.jsx
import React from 'react';
import useSaoKit from './hooks/useSaoKit';

const MyComponent = () => {
  const { messages, isConnected, sendMessage } = useSaoKit('ws://localhost:8080');

  return (
    <div>
      <h1>SaoKit in React</h1>
      <p>连接状态: {isConnected ? '已连接' : '已断开'}</p>
      <button onClick={() => sendMessage('Hello from React!')}>发送消息</button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Vue 使用示例

在 Vue 3 中，可以利用 Composition API 创建一个可组合函数来封装 SaoKit 的逻辑。

```javascript
//composables/useSaoKit.js
import { ref, onMounted, onUnmounted, readonly } from 'vue';
import { createSaoKit } from 'saokit';

export function useSaoKit(url, options) {
  const messages = ref([]);
  const isConnected = ref(false);
  let socket = null;

  onMounted(() => {
    // 创建 SaoKit 实例
    socket = createSaoKit(url, options);

    // 定义事件监听
    socket.on('open', () => {
      console.log('Vue Composable: 连接成功');
      isConnected.value = true;
    });

    socket.on('close', () => {
      console.log('Vue Composable: 连接关闭');
      isConnected.value = false;
    });

    socket.on('message', (event) => {
      console.log('Vue Composable: 收到消息', event.data);
      messages.value.push(event.data);
    });

    socket.on('error', (error) => {
      console.error('Vue Composable: 发生错误', error);
    });

    // 建立连接
    socket.connect();
  });

  onUnmounted(() => {
    if (socket) {
      socket.close();
    }
  });

  // 发送消息的辅助函数
  const sendMessage = (message) => {
    if (socket && socket.isConnected) {
      socket.send(message);
    } else {
      console.error('无法发送消息，WebSocket 未连接');
    }
  };

  return {
    messages: readonly(messages),
    isConnected: readonly(isConnected),
    sendMessage,
  };
}


// 在你的组件中使用
// MyComponent.vue
<template>
  <div>
    <h1>SaoKit in Vue</h1>
    <p>连接状态: {{ isConnected ? '已连接' : '已断开' }}</p>
    <button @click="sendMessage('Hello from Vue!')">发送消息</button>
    <ul>
      <li v-for="(msg, index) in messages" :key="index">{{ msg }}</li>
    </ul>
  </div>
</template>

<script setup>
import { useSaoKit } from './composables/useSaoKit';

const { messages, isConnected, sendMessage } = useSaoKit('ws://localhost:8080');
</script>
```

## 📖 API 文档

### `createSaoKit(url, [options])`

创建一个新的 SaoKit 实例。

- `url` (string): WebSocket 服务器的 URL。
- `options` (object, 可选): 连接选项。
  - `autoReconnect` (boolean, 默认: `true`): 是否启用自动重连。
  - `reconnectInterval` (number, 默认: `5000`): 重连间隔（毫秒）。
  - `maxReconnectAttempts` (number, 默认: `0`): 最大重连尝试次数（0 表示无限次）。
  - `heartbeat` (boolean, 默认: `false`): 是否启用心跳。
  - `heartbeatInterval` (number, 默认: `30000`): 心跳间隔（毫秒）。
  - `heartbeatMessage` (string | Function, 默认: `'ping'`): 心跳消息。
  - `timeout` (number, 默认: `5000`): 连接超时时间（毫秒）。

### 方法

- `connect(): Promise<void>`: 建立 WebSocket 连接。
- `send(data: string | ArrayBuffer | Blob): void`: 发送数据。
- `close(code?: number, reason?: string): void`: 关闭连接。
- `on(event: SaoKitEventType, listener: SaoKitEventListener): void`: 添加事件监听器。
- `remove(event: SaoKitEventType, listener: SaoKitEventListener): void`: 移除事件监听器。

### 事件

- `open`: 连接成功建立时触发。
- `close`: 连接关闭时触发。
- `error`: 发生错误时触发。
- `message`: 收到消息时触发。
- `reconnect`: 尝试重连时触发，附带重连次数。

### 属性

- `readyState`: 当前连接状态（`0`: CONNECTING, `1`: OPEN, `2`: CLOSING, `3`: CLOSED）。
- `isConnected`: 当前是否已连接（布尔值）。

## 🛠️ 开发

- **构建**: `pnpm run build`
- **开发模式**: `pnpm run dev`
- **测试**: `pnpm run test`
- **代码检查**: `pnpm run lint`

## 🤝 贡献

欢迎提交问题、功能请求和代码贡献！

## 📄 许可证

本项目基于 [MIT](LICENSE) 许可证。