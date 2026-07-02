# Cloud Game 架构文档

> 技术架构、设计决策与开发规范。

---

## 技术栈

| 层级 | 选型 | 备注 |
|------|------|------|
| 框架 | Nuxt 5 (nightly) | SSR，文件路由，auto-import |
| 服务端 | Nitro 3 | API routes, middleware, WebSocket, h3 |
| 前端 | Vue 3 | Nuxt 内置 |
| 构建 | Vite 8 | Nuxt 内置 |
| 类型 | TypeScript | 严格模式 |
| 样式 | SCSS | Vite 预处理器 + 全局主题变量注入 |
| 状态管理 | Pinia | |
| 实时通信 | Socket.IO | `socket.io-client`（前端）+ Socket.IO Server（Nitro plugin），独立端口 3200 |
| 测试 | Vitest | 单元测试 + 集成测试 |
| 类型检查 | vue-tsc | `--noEmit` 模式 |
| 代码规范 | @nuxt/eslint | Flat config，AI 开发风格统一 |
| 数据库 | MongoDB | 连接串通过 `.env` 管理 |
| ODM | Mongoose | Schema 校验 + TypeScript 类型推断，替代上游的 Typegoose |
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
    components/      # Vue 组件
      common/        # 通用组件（玩家列表、房主控制等）
      games/         # 游戏专属组件
        avalon/      # Avalon 游戏面板、操作界面等
    composables/     # 组合式函数（useGame, useSocket 等）
    layouts/         # 布局（default, game 等）
    middleware/      # 路由中间件（认证等）
    plugins/         # Nuxt 插件

  server/            # Nitro 服务端
    api/             # REST API（/api/rooms, /api/user 等）
    game/            # 游戏逻辑
      registry.ts    # 游戏注册表（gameType → GameEngine）
      rooms.ts       # 通用房间服务（v0.1.4 内存状态 + 生命周期）
      rooms/         # 房间 Socket 事件绑定
        handlers.ts  # 房间 Socket 事件注册（v0.1.4）
      avalon/        # Avalon 引擎（engine, roles, missions, addons）
    db/              # 数据库层（Models, Queries）
      models/        # Mongoose Models（User, Room）
    plugins/         # Nitro 插件（Socket.IO 初始化等）
    utils/           # 服务端工具函数（JWT、Socket 单例等）

  shared/            # 前后端共享类型与常量
    types/
      common/        # 通用类型（room, user, api 等）
      games/         # 游戏专属类型
        avalon/      # Avalon（角色、状态、配置等）

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

### 4. 多游戏架构：通用层 + 游戏层分离

**原因**：
- 项目定位为云游戏平台，未来需接入多款游戏，不能只服务 Avalon
- 通用层（认证、房间、大厅）与游戏层（引擎、类型、UI）解耦，接入新游戏时通用层零改动
- 移动端优先：通用组件做好即可，游戏组件按需懒加载，首屏不加载所有游戏 UI

#### 架构分层

```
┌─────────────────────────────────────────┐
│              Common Layer               │
│  用户认证、房间 CRUD、大厅、玩家管理     │
├─────────────────────────────────────────┤
│           Game Registry                 │
│  gameType → GameEngine 映射 & 路由分发  │
├────────────┬────────────────────────────┤
│  Avalon    │  Future Game B  │  ...     │
│  Engine    │  Engine         │          │
│  Types     │  Types          │          │
│  UI        │  UI             │          │
└────────────┴────────────────────────────┘
```

#### 游戏注册表（Game Registry）

服务端 `server/game/registry.ts` 维护 gameType → GameEngine 映射（`registerGame` / `getGameEngine` / `getAvailableGameTypes`）。`TGameEngine` 接口按版本分阶段实现：

- `gameType: TGameType` — 游戏标识（v0.1.6 ✅）
- `minPlayers / maxPlayers` — 人数范围（v0.1.6 ✅）
- `createGame(roomId, players, config): TGameCreateResult` — 初始化游戏，返回权威 `AvalonGameState` + 首夜可见性 map（v0.1.6 ✅）
- `validateConfig(config): boolean` — 校验游戏配置（待补：当前由 `createGame` 内部抛 `InvalidGameConfigError`）
- `handleEvent(state, event, actorId): TAvalonEventResult` — 游戏事件统一入口（v0.1.7 ✅，回合状态机已落地）
- `getVisualState(state, inputs): AvalonGameState` — 按玩家视角裁剪状态（v0.1.7 ✅，运行时脱敏 + end 揭示）

`server/plugins/games.ts` 在服务端启动时导入各游戏包触发注册副作用。接入新游戏只需实现 `TGameEngine` 接口并在游戏包 `index.ts` 中 `registerGame`。

#### Avalon 引擎骨架（v0.1.6）

`server/game/avalon/` 实现 v0.1.6 的初始化表面：

- `roles.ts` — 角色数据表（忠诚 + 可见性），替代上游 `Character` 类层级；v0.1.6 仅 5 核心角色，其余占位并在 `assignRoles` 中拒绝
- `presets.ts` — 5–10 人预设（任务规模 + 阵营名额）
- `role-assignment.ts` — 纯函数 `assignRoles`（人数校验 → 消费特殊角色 → 阵营补位 → Fisher-Yates 洗牌）+ `computeVisibility`（首夜可见性）
- `engine.ts` — `avalonEngine.createGame` 产出 `stage: 'initialization'` 的权威状态（真实角色，服务端保密）+ visibility map

权威 `AvalonGameState.players[].role` 为真实角色（保密）；按玩家视角的裁剪依赖后续 `getVisualState`。

#### Avalon 回合状态机（v0.1.7）

`server/game/avalon/state-machine.ts` 在 v0.1.6 的初始化基础上补齐回合流转，规则对齐 Roadmap 中「核心玩法」三条胜利条件：

- **状态字段**：`AvalonGameState` 新增四个运行时字段 `leaderID` / `currentTeam` / `currentVotes` / `currentActions`，作为服务端权威当前回合状态；`PlayerFeatures` 由引擎镜像（`isLeader` / `isSelected` / `isSent` / `waitForAction`）便于 UI 渲染
- **阶段流转**：`createGame` 结束后立即进入 `selectTeam`，按回合走 `selectTeam → votingForTeam → onMission → selectTeam` 循环；拒绝投票或任务完成都会把 `leaderID` 轮换到下一位（座位顺序首尾相接）
- **事件入口**：`avalonEngine.handleEvent` 接收 `TAvalonEvent`（`selectPlayer` / `submitTeam` / `castVote` / `missionAction`）+ `actorId`，返回 `{ state }` 或 `{ error }`；`applyEvent` 内部委托给 `applySelectPlayer` / `applySubmitTeam` / `applyCastVote` / `applyMissionAction` 四个纯函数，便于测试
- **胜负判定**：
  - 任务结果按 `missionState[i].failsRequired` 阈值计算，`fails >= failsRequired` 即判负
  - 累计 3 次 success → `stage: 'end'`、`reason: 'goodTeamMissions'`、`winner: 'good'`
  - 累计 3 次 fail → `stage: 'end'`、`reason: 'evilTeamMissions'`、`winner: 'evil'`
  - 单个任务内连续 5 次 reject（`state.vote` 累加到 5）→ `stage: 'end'`、`reason: 'rejectedVote'`、`winner: 'evil'`；任务成功进入下一关时 `vote` 重置为 0
- **历史记录**：每次投票 / 任务结束分别 push 一条 `HistoryVote` / `HistoryMission` 到 `state.history`，与上游 `THistoryResults` 联合类型兼容；后续 UI 直接消费，无需再走服务端二次查询
- **角色揭示**：`getVisualState(state, { playerId, visibility })` 在非 end 阶段按首夜可见性 map 切片；`stage === 'end'` 时全员揭示。状态机本身与 visibility 解耦 —— 状态机只产权威状态，广播前的脱敏交给 dispatcher / 客户端


#### 房间数据层（v0.1.4）

通用房间系统是游戏无关的，所有游戏复用同一套服务。设计要点：

- **内存状态**：`server/game/rooms.ts` 维护 `Map<uuid, TRoomState>`，进程内即全部真相。状态包括 `stage: 'created' | 'locked' | 'started'`、`gameType`、`leaderID`、`players[]`、`config` 等。持久化推迟到 v0.4.x（游戏历史阶段）。
- **生命周期状态机**：
  - `createRoom(creatorId)` → creator 为 leader/唯一玩家，stage=`created`，广播 `roomUpdated` + `roomsListUpdated`
  - `joinRoom(roomId, userId)` → 校验 stage≠`locked` 且未在玩家列表中；成功则 push player 并广播
  - `leaveRoom(roomId, userId)` → 普通玩家直接移除；房主离开且房间非空时转移 leader 给 `players[0]`，并重新设置所有 `isLeader` 标志；房主离开且房间为空时 `rooms.delete(uuid)`、广播 `destroyRoom` + `roomsListUpdated`
  - `lockRoom(roomId, requesterId)` → 仅 leader 可调用，stage 在 `created` 与 `locked` 之间切换
  - `kickPlayer(roomId, requesterId, targetId)` → 仅 leader 可调用，移除目标玩家；不允许 self-kick
- **Socket.IO 广播拓扑**：
  - `lobby` 通道：所有已认证 socket 加入，接收 `roomsListUpdated`（大厅列表的实时刷新）
  - 房间号通道（`roomId`）：仅该房间的玩家 socket 加入，接收 `roomUpdated` / `destroyRoom`
  - 每次房间状态变更同时广播 `roomUpdated` 到房间号通道、`roomsListUpdated` 到 `lobby` 通道
- **鉴权桥**：`socket.data.userId` 在 `server/plugins/socket.io.ts` 的 JWT 验证后缓存，房间 handlers 通过 `requireUserId(socket)` 读取；缺失则 `socket.emit('serverError', 'unauthorized')` 后拒绝
- **断线清理**：`server/game/rooms/handlers.ts` 的 `joinRoom` 在成功后将 `socketId → roomId` 写入反向索引；`disconnect` 事件在 `server/plugins/socket.io.ts` 中查反向索引并调用 `leaveRoom`，让房主转移与空房销毁逻辑正常触发，避免内存残留
- **REST 端点**：`GET /api/rooms`（列表）、`GET /api/rooms/:id`（详情），均要求 JWT（通过 `server/utils/auth.ts: getAuthPayload` 从 `Authorization: Bearer` 头或 `auth-token` cookie 提取）

#### 类型系统分层

- **通用层**（`shared/types/common/`）：`TGameType` 枚举、`TRoomState`（含 gameType）、`TGameConfig` 联合类型
- **游戏层**（`shared/types/games/<gameType>/`）：游戏专属类型，如 `shared/types/games/avalon/` 承载角色、任务、状态等

#### Socket 事件分层

- **通用事件**：createRoom(gameType)、joinRoom、leaveRoom、kickPlayer、lockRoom 等房间管理事件，所有游戏共享
- **游戏事件**：startGame、gameAction(uuid, action, payload) — 服务端根据房间的 gameType 路由到对应引擎的 handleEvent

#### 前端组件分层

- **通用组件**（`app/components/common/`）：玩家列表、房主控制等，所有游戏共用
- **游戏组件**（`app/components/games/<gameType>/`）：游戏面板、操作界面等，按 gameType 动态加载

房间页面通过 `<component :is="gameComponent" />` 根据当前房间的 gameType 渲染对应游戏 UI。

#### Room Model

```typescript
interface TRoomDoc {
  roomID: string
  gameType: string               // 'avalon' | ...
  stage: 'created' | 'locked' | 'started'
  leaderID: string
  players: RoomPlayer[]
  config: Record<string, unknown> // 按 gameType 走不同 schema
  game?: Record<string, unknown>  // 游戏运行时状态
}
```

---

## 与上游项目的关系

| 上游模块 | 本项目对应 | 说明 |
|---|---|---|
| `packages/backend` | `server/game/` + `server/db/` | 游戏逻辑和数据库层重写 |
| `packages/types` | `shared/types/` | 已从上游移植为纯 interface/type，与 Mongoose Schema 解耦 |
| `packages/ui` | `app/` | 前端完全重写 |

上游是 Express + Socket.IO + MongoDB + Typegoose 的架构，本项目基于 Nuxt/Nitro 重新设计，不保证 API 兼容。

---

## 已知技术债务

（项目初期，暂无）

