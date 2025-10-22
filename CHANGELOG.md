# 更新日志

本文档记录了 SaoKit 项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 添加了 GitHub Actions 自动化 CI/CD 流程
- 新增版本发布相关的 npm 脚本
- 创建了完整的自动化发布工作流

### 变更
- 更新了 GitHub 仓库地址为 `https://github.com/GoetheDady/saokit`

## [0.1.0] - 2024-10-22

### 新增
- 🎉 首次发布 SaoKit WebSocket 库
- ✨ 自动重连功能：在连接意外断开时自动尝试重新连接
- 💓 心跳检测：定期发送心跳消息防止连接被中断
- 🔄 Promise 化连接：`connect()` 方法返回 Promise，支持 async/await
- 📡 丰富的事件系统：支持 `open`、`close`、`error`、`message`、`reconnect` 事件
- 🌐 跨平台支持：同时支持 Node.js 和浏览器环境
- 📝 完整的 TypeScript 类型定义
- 🪶 轻量级设计：无多余依赖，易于集成
- 🏭 工厂函数：提供 `createSaoKit()` 工厂函数创建实例
- 🔧 灵活配置：支持自定义重连间隔、心跳间隔等参数

### 技术特性
- 使用 TypeScript 开发，提供完整类型支持
- 采用 Rollup 构建，支持 ES Module、CommonJS、UMD 多种格式
- 使用 Jest 进行单元测试，测试覆盖率完整
- 支持现代前端框架（React、Vue）集成
- 模块化架构设计，类型定义独立文件管理

### 构建和工具
- 支持 ES2020+ 语法特性
- 生成 Source Map 便于调试
- 自动化代码检查（ESLint）
- 完整的开发和构建脚本

---

## 版本说明

- **新增 (Added)**: 新功能
- **变更 (Changed)**: 对现有功能的变更
- **弃用 (Deprecated)**: 即将移除的功能
- **移除 (Removed)**: 已移除的功能
- **修复 (Fixed)**: 任何 bug 修复
- **安全 (Security)**: 安全相关的修复

## 发布流程

1. **补丁版本** (0.1.0 → 0.1.1): `pnpm run release:patch`
2. **次要版本** (0.1.0 → 0.2.0): `pnpm run release:minor`  
3. **主要版本** (0.1.0 → 1.0.0): `pnpm run release:major`

每次发布都会自动：
- 运行测试和代码检查
- 更新版本号
- 创建 git tag
- 推送到 GitHub
- 触发 GitHub Actions 自动发布到 npm