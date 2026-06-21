# Cloud Game 更新日志

> 版本历史。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

---

## [0.0.3] - 后端框架搭建

### 新增

- 集成 Socket.IO Server 至 Nitro plugin（独立端口 3200），前后端实时通信就绪
- 前端 `useSocket.ts` 从原生 WebSocket 迁移至 `socket.io-client`，保持原有 API 不变
- 服务端 JWT 工具（`server/utils/auth.ts`）：签名与验证
- 服务端 Socket.IO 单例工具（`server/utils/socket.ts`）：全局 IO 实例管理
- Nuxt 插件 `socket.client.ts`：确保 Socket 连接在 Pinia 初始化之后建立

### 变更

- 新增依赖：`socket.io`, `socket.io-client`, `bcryptjs`, `jsonwebtoken`
- `nuxt.config.ts` 新增 Nitro 配置（禁用原生 WebSocket，使用 Socket.IO）

### 修复

- 修复 Socket.IO 热重载时 EADDRINUSE 端口冲突
- 修复 Socket connect 事件在 Pinia 初始化前触发导致的 getActivePinia 错误

---

## [0.0.1] - 初始版本

### 新增

- 基于 Nuxt 5 (nightly) + Nitro 3 + Vue 3 搭建 SSR 项目骨架
- 通过 git subtree 引入上游 Avalon 仓库（Razdva122/avalon）至 `_reference/` 作为只读参考
- 基础项目文档（AGENTS.md, architecture.md, roadmap.md）
