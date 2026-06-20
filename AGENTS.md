# AGENTS.md - Cloud Game 项目上下文

本文件为 AI 编码助手提供项目上下文。

## 项目概述

Cloud Game 是一个云游戏平台，前期以 Avalon Online（桌游"抵抗组织：阿瓦隆"在线版）为首款游戏，后续可扩展接入更多云游戏。

**技术栈**：Nuxt 5 (nightly) SSR + Nitro Server + Vue 3 + TypeScript

**重要说明**：`_reference/` 目录通过 git subtree 引入了上游开源 Avalon 仓库（[Razdva122/avalon](https://github.com/Razdva122/avalon)）的完整代码，**仅供阅读参考，禁止修改**。开发时从中理解协议、类型定义和游戏逻辑，然后在新项目中重新实现。

## 项目结构

```
cloud-game/
  _reference/        # 上游代码（只读参考，禁止修改）
    packages/
      backend/       # Node.js + Express + Socket.io + MongoDB
      types/         # 共享 TypeScript 类型
      ui/            # Vue 3 + Vuetify 3 前端
  app/               # Nuxt app 入口
    pages/           # 文件路由
    components/      # Vue 组件
    composables/     # 组合式函数
    layouts/         # 布局
    middleware/      # 中间件
    plugins/         # 插件
  server/            # Nitro server（API routes, WebSocket, 游戏逻辑）
    api/             # REST API
    game/            # 游戏逻辑
    db/              # 数据库层
    utils/           # 服务端工具
  docs/              # 项目文档
  nuxt.config.ts
  package.json
```

## _reference 目录使用规范

- **只读**：任何情况下不得修改 `_reference/` 中的文件
- **参考用途**：理解 Socket 事件协议、类型定义、游戏逻辑、数据库模型
- **同步上游更新**：

```bash
git subtree pull --prefix=_reference upstream master --squash
```

- 上游 remote 已配置为 `upstream`（`git@github.com:Razdva122/avalon.git`）

## 上游关键参考索引

| 需要了解的内容 | 参考路径 |
|---|---|
| Socket 事件协议 | `_reference/packages/types/api/sockets.ts` |
| 游戏角色类型 | `_reference/packages/types/game/roles.ts` |
| 游戏状态类型 | `_reference/packages/types/game/` |
| 房间类型 | `_reference/packages/types/room/` |
| 用户类型 | `_reference/packages/types/user/` |
| 游戏核心逻辑 | `_reference/packages/backend/src/core/` |
| 数据库模型 | `_reference/packages/backend/src/db/models/` |
| Addon 系统 | `_reference/packages/backend/src/core/game/addons/` |

## 技术栈

| 层级 | 选型 | 备注 |
|------|------|------|
| 框架 | Nuxt 5 (nightly) | SSR，文件路由，auto-import |
| 服务端 | Nitro | API routes, middleware, WebSocket |
| 前端 | Vue 3.5+ (Composition API) | `<script setup>` |
| 类型 | TypeScript | 严格模式 |
| 样式 | 待定 | |
| 状态管理 | 待定 | Pinia 或 Nuxt 内置 useState |
| 实时通信 | 待定 | WebSocket 或 SSE |
| 数据库 | 待定 | |

## 代码规范

- **语言**: 全面使用 TypeScript
- **类型**: 类型前缀 `T`（如 `TRoomInfo`）；有方法的对象用 interface
- **命名**: 变量/函数用 camelCase，类/类型用 PascalCase，常量用 UPPER_CASE，文件名用 kebab-case
- **提交格式**: 见下方「Commit Message 格式规约」
- **Vue**: 新组件使用 Composition API + `<script setup>`

### Commit Message 格式规约

```
<type>(version): <summary>

Feat:
- English bullet 1
- English bullet 2

Fix:
- English bullet

Feat:
- 中文 bullet 1
- 中文 bullet 2

Fix:
- 中文 bullet

```

- **type**：`feat` / `fix` / `refactor` / `docs` / `test` / `chore`
- **version**：当前项目版本（`v<major>.<minor>.<patch>`），同一版本的多个 commit 共用同一 scope
- **summary**：1 句概括性的英文，描述"这次 commit 干了什么"

**Body**

按改动类型分组，每组用 `<Type>:` 开头；英文 bullet 在前，中文 bullet 复述在后。依赖变更（`Cargo.toml` / `package.json`）单独用 `依赖变更：` section 收口，如果没有则可以跳过此项。

### 版本发布

用户说"升级版本"或类似意图时，自动执行：

```bash
npm version <level> -f -m <commit message>
```

- `<level>` 为 `patch` / `minor` / `major`，由用户指定或根据改动范围判断
- 完成后提醒用户 `git push --follow-tags` 推送 commit 和 tag

## 开发环境

### 本地启动

```bash
npm install
npm run dev            # http://localhost:3000
```
