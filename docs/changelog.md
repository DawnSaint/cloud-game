# Cloud Game 更新日志

> 版本历史。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

---

## [Unreleased]

### 新增

- 创建 `shared/types/` 共享类型目录，从上游 `@avalon/types` 移植核心领域模型为纯 TypeScript interface/type
  - 游戏类型：角色、玩家、任务、投票、状态、选项、设置
  - 房间类型：房间状态联合类型、房间列表信息
  - 用户类型：资料、认证令牌
  - 统计类型：胜率统计
  - Socket 事件协议：精简版 ClientToServer/ServerToClient 事件定义
  - 历史类型：投票、任务、刺杀历史记录
  - 运行时常量：角色重要性排序

### 变更

- `app/types/index.ts` 改为从 `#shared/types` re-export，保留应用级类型（语言、用户设置、警告）
- `GameOptionsRoles` 角色配置从 `boolean` 改为 `number`（角色数量），与上游一致
- 移除 `GameOptionsAddons`、`GameOptionsFeatures`（扩展玩法暂不实现）
- `vitest.config.ts` 新增 `#shared` 路径别名

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
