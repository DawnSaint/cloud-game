# Cloud Game 架构文档

> 技术架构、设计决策与开发规范。

---

## 技术栈

| 层级 | 选型 | 备注 |
|------|------|------|
| 框架 | Nuxt 5 (nightly) | SSR，文件路由，auto-import |
| 服务端 | Nitro 3 | API routes, middleware, WebSocket, h3 |
| 前端 | Vue 3.5+ (Composition API) | `<script setup>` |
| 构建 | Vite 8 | Nuxt 内置，开发环境秒级热更新 |
| 类型 | TypeScript | 严格模式 |
| 样式 | SCSS | Vite 预处理器 + 全局主题变量注入 |
| 状态管理 | Pinia | 配合 Nuxt 插件 |
| 实时通信 | Socket.IO | `socket.io-client`（前端）+ Socket.IO Server（Nitro plugin），独立端口 3200 |
| 测试 | Vitest | 单元测试 + 集成测试 |
| 类型检查 | vue-tsc | `--noEmit` 模式 |
| 代码规范 | @nuxt/eslint | Flat config，AI 开发风格统一 |
| 数据库 | MongoDB | 沿用上游方案 |
| 部署 | 待定 | Node.js / Vercel / Docker |

---

## 目录结构

```
cloud-game/
  _reference/        # 上游 Avalon 代码（只读参考）
    packages/
      backend/       # 原后端：Game, Roles, GameManager, Addons, DB
      types/         # 原类型定义：api/, game/, room/, user/, stats/
      ui/            # 原前端：Vue 3 + Vuetify 3 + Vuex 4

  app/               # Nuxt 前端
    pages/           # 文件路由（首页、游戏大厅、房间、Wiki 等）
    components/      # Vue 组件（按功能域分子目录）
    composables/     # 组合式函数（useGame, useSocket 等）
    layouts/         # 布局（default, game 等）
    middleware/      # 路由中间件（认证等）
    plugins/         # Nuxt 插件

  server/            # Nitro 服务端
    api/             # REST API（/api/rooms, /api/user 等）
    game/            # 游戏逻辑（Game engine, Roles, Addons）
    db/              # 数据库层（Models, Queries）
    plugins/         # Nitro 插件（Socket.IO 初始化等）
    utils/           # 服务端工具函数（JWT、Socket 单例等）

  docs/              # 项目文档
  nuxt.config.ts     # Nuxt 配置
  package.json
```

---

## 核心设计决策

### 1. Nuxt 5 SSR 而非 SPA

**原因**：
- SSR 首屏加载快，适合游戏大厅等公共页面
- Nitro server 可以直接承载游戏逻辑，省去独立 backend 服务
- 文件路由和 auto-import 减少样板代码
- 后期扩展多游戏时，SSR + 动态路由更灵活

### 2. 上游代码作为只读参考

**原因**：
- 上游 Avalon（Razdva122/avalon）是成熟的生产项目（v57.2.1）
- 通过 `_reference/` 理解其协议、类型、游戏逻辑，然后在新项目中重新实现
- 不直接依赖上游代码，避免被其架构约束（monorepo + socket.io + MongoDB）
- 通过 git subtree 保持同步，随时可查看上游更新

### 3. 游戏逻辑与服务端一体化

**原因**：
- Nitro server 运行在 Node.js 环境，可直接运行游戏引擎
- 无需维护独立的 backend 进程，简化部署
- 前后端共享 TypeScript 类型，无需跨包同步

---

## 与上游项目的关系

| 上游模块 | 本项目对应 | 说明 |
|---|---|---|
| `packages/backend` | `server/game/` + `server/db/` | 游戏逻辑和数据库层重写 |
| `packages/types` | 项目内 `types/` 或内联 | 类型定义，按需从上游参考移植 |
| `packages/ui` | `app/` | 前端完全重写 |

上游是 Express + Socket.IO + MongoDB + Typegoose 的架构，本项目基于 Nuxt/Nitro 重新设计，不保证 API 兼容。

---

## 已知技术债务

（项目初期，暂无）
