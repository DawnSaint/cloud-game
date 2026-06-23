# Cloud Game 更新日志

> 版本历史。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

---

## [0.1.5]

### 新增

- 独立登录/注册页 `app/pages/auth.vue`：从 `profile.vue` 拆出完整认证表单（登录/注册切换、下划线输入框、白色按钮、开发态快捷登录）；登录后自动跳转 `route.query.redirect` 或首页

### 变更

- `app/components/TabBar.vue`：液态玻璃悬浮工具栏重设计（iOS 26 Liquid Glass 风格）。底部全宽白底固定条改为左右留白 12px、底部 10px+`safe-area-inset-bottom` 的圆角悬浮胶囊（`border-radius: 28px`）；25% 白色透明底 + `backdrop-filter: blur(30px) saturate(180%)` + 双层外阴影 + `inset` 顶部高光 + 半透明细线边框，让背景（房间渐变 / 主页列表）在工具栏下方透出来、消除视觉割裂；激活态由文字色变蓝改为内嵌白色半透明药丸（`background: rgba(255,255,255,0.28)`）+ 字重 500→600，未激活文字改为带白描边阴影的 65% 深灰以保证在任意背景上可读；点击反馈改为 `transform: scale(0.94)`，所有过渡统一为 350ms
- `app/app.vue`：`.app-page` 从 `height: calc(100% - 60px) + overflow: auto` 改为 `height: 100% + overflow-x: hidden; overflow-y: auto`；根容器（html / body / `#__nuxt`）统一 `overflow: hidden`，让滚动收敛在 `.app-page` 内，避免悬浮 TabBar 的 box-shadow 溢出引发文档级双滚动条；TabBar 改为条件渲染，根据 `route.name` 计算 `showTabBar`（`hiddenTabBarRoutes = new Set(['auth'])`），支持页面级隐藏工具栏（Nuxt 5 nightly 对 `definePageMeta({ meta: { ... } })` 自定义字段构建时不会完整合入 `route.meta`，改走路由名更可靠）
- `app/pages/index.vue`：大厅样式重做 —— `.lobby` 改为 flex 居中布局；创建按钮加 `:disabled="isCreating"` 绑定、JS 层在 `createRoom` 入口新增 `if (isCreating) return` 防重复点击；按钮样式改为 `$primary → $accent` 渐变 + 12px 圆角 + 柔和阴影 + `scale(0.98)` 按压反馈 + 禁用态脉冲动画（`@keyframes pulse`）；底部 padding 改为 `calc(80px + env(safe-area-inset-bottom))` 避让悬浮 TabBar；未登录时创建房间重定向到 `/auth?redirect=/`
- `app/pages/wiki.vue`、`app/pages/profile.vue`：底部 padding 统一加上 `calc(80px + env(safe-area-inset-bottom))`，避免最后一条内容被悬浮 TabBar 遮挡
- `app/pages/profile.vue`：移除登录/注册表单（迁移至 `app/pages/auth.vue`），仅保留已登录视图（个人资料、统计、菜单）；未登录时通过 `definePageMeta` 页面级 middleware 在渲染前拦截重定向至 `/auth?redirect=/profile`；退出登录后跳转 `/auth`
- `app/pages/auth.vue`：`LobbyLogo` 从 `.auth-container` 内移出为 `.auth-page` 的直接子元素，与主页 / 规则页保持一致的顶部定位（依赖根容器 `$spacing-header` 内边距）；`.auth-container` 仅包裹登录/注册表单，采用 flex 分层布局（`.auth-spacer` 锁住顶部空间、`.form-tabs` 固定位置、`.form-body` 在 tab 下方剩余空间内排布字段）
- `app/middleware/auth.ts`：未认证重定向目标从 `/profile` 改为 `/auth`
- `app/pages/room.vue`：房间销毁后的跳转从 `router.push({ name: 'profile' })` 改为 `router.push({ name: 'index' })`，匹配新增的 `auth` 页面结构
- `tests/middleware/auth.test.ts`：未认证跳转断言从 `/profile` 同步更新为 `/auth`

### 修复

- 大厅房间列表渲染崩溃：`app/pages/index.vue` 模板误读 `game.options`（`TRoomInfo` 字段实际为 `config`），导致访问 `options.roles` 时抛 `TypeError: Cannot read properties of undefined (reading 'roles')`；同步将 `hasOptions` 参数类型从 `GameOptions` 改为 `TGameConfig`，并对 `config?.roles` 加可选链守卫
- 房间页纵向滚动条：`app/pages/room.vue` 的 `.room` 从 `min-height: 100vh` 改为 `height: 100%`，加 `overflow: hidden`。100vh 永远高于父容器 `.app-page` 导致必出滚动条；改为与父容器等高，配合 `.action-buttons` 底部 `calc(80px + safe-area)` 避让悬浮 TabBar
- `app/pages/profile.vue` 未登录时切到「我的」Tab 触发渲染崩溃（`TypeError: Cannot read properties of null (reading 'name')`，并级联报 `Cannot destructure property 'type' of 'vnode'` / `parentNode`）：原 `setup` 内的 `router.replace` 不能阻止当次渲染；改为 `definePageMeta` 页面级 middleware 在渲染前拦截重定向，并对模板根加 `v-if="store.profile"` 双保险
- `app/pages/auth.vue`：登录/注册模式切换时整个表单上下跳动 —— 原 `.auth-container` 用 `justify-content: center` 居中整块表单，注册多一个确认密码字段导致整块（含 tab 标题）重新居中；改为 flex 分层布局：`.auth-spacer`（`flex: 0 0 22%`）锁住顶部空间、`.form-tabs`（`flex: 0 0 auto`）固定位置、`.form-body` 仅在 tab 下方剩余空间内排布字段

---

## [0.1.4]

### 新增

- 通用房间数据层 `server/game/rooms.ts`：内存房间存储（`Map<uuid, TRoomState>`），生命周期服务函数（createRoom/joinRoom/leaveRoom/lockRoom/kickPlayer），Socket.IO 广播辅助（roomUpdated + roomsListUpdated），socket↔room 反向索引（断线清理），房主转移与空房间自动销毁
- 房间 Socket 事件处理器 `server/game/rooms/handlers.ts`：接入 `server/plugins/socket.io.ts`，为已认证 socket 绑定 6 个通用房间事件（createRoom/joinRoom/leaveRoom/lockRoom/kickPlayer/getRoomsList），未认证请求通过 `serverError` 拒绝
- 房间 REST API：`GET /api/rooms`（列表，要求 JWT）、`GET /api/rooms/:id`（详情，要求 JWT），未认证返回 401、房间不存在返回 404
- 共享错误类型扩展 `shared/types/api/errors.ts`：新增 `errorLocked` / `errorAlreadyInRoom` / `errorNotInRoom` / `errorNotLeader` 四种房间错误码以及 `RoomError` 联合类型
- 服务端 REST 鉴权助手 `server/utils/auth.ts` 新增 `getAuthPayload(event)`：从 `Authorization: Bearer <token>` 头或 `auth-token` cookie 提取并验证 JWT
- 房间服务单元测试 `tests/game/rooms.test.ts`（17 用例）：覆盖 createRoom/joinRoom/leaveRoom/lockRoom/kickPlayer 全部路径与错误码，包括房主转移、空房间销毁、socket 反向索引
- 房间 REST 测试 `tests/api/rooms.test.ts`（6 用例）：覆盖列表与详情的鉴权（401）、空列表、404、完整状态返回

### 变更

- `server/plugins/socket.io.ts`：认证成功后 `socket.data.userId` 缓存 userId，并加入 `lobby` 通道（用于 `roomsListUpdated` 广播）；`disconnect` 事件触发 `forceLeaveRoom`（通过 `rooms.getSocketRoomId` 查反向索引，避免内存中残留已断线玩家）
- `app/pages/room.vue`：
  - `initRoom` 加 `null` 守卫（`emitWithAck` 超时返回 `null` 时 `typeof null === 'object'` 会让 `'error' in null` 抛错）
  - `getErrorText` 错误码映射改为 `errorNotFound` / `errorLocked` / `errorAlreadyInRoom` / `errorNotInRoom` / `errorNotLeader`，匹配新错误类型

### 修复

- Socket 断开后玩家残留导致房间无法正常销毁的隐患：原 `disconnect` handler 仅打日志；改为根据 `socket.data.userId` 与 `socketRoom` 反向索引调用 `leaveRoom`，让房主转移 / 空房销毁逻辑正常触发

### 已知限制

- `createRoom` 事件未携带 `gameType` 参数（`CommonClientToServerEvents.createRoom` 签名仍为 `() => uuid`），服务端硬编码 `avalon`。待接入第二款游戏时升级事件类型
- 房间状态仅存内存（`Map<uuid, TRoomState>`），服务重启后所有房间丢失。持久化推迟到 v0.4.x 游戏历史阶段
- `app/pages/room.vue` 仍按旧字段名 `options` 读取 `TRoomState.config`（v0.0.6 已重命名），UI 字段迁移推迟到 v0.1.5

---

## [0.1.3]

### 变更

- 开发态认证流程优化：移除原先自动以「开发测试用户」登录的假 token 机制（其依赖的 `devMPLogin` 服务端事件从未实现，静默失败），dev 启动即进入未登录态、展示真实注册/登录表单
- 新增开发态快捷登录：`Pinia store` 的 `devQuickLogin` action，通过真实 `register`/`login` 链路登录固定测试账号 `dev`/`devpassword`（不存在则自动注册）；登录页表单底部展示「以测试账号登录」按钮（仅 dev 可见）

- `profile.vue` 登录/注册表单交互完善：接入既有 `validators.ts`（`required`/`min6`/`login`/`spacesForbidden`）做字段级校验，blur 触发、出错后输入实时重校，输入框下方内联错误提示
- 密码最低位数从 8 位降为 6 位：`validators.ts` 新增 `min6` 校验器，登录/注册表单密码字段改用 `min6`（保留 `min8` 供后续改密等场景复用）
- 注册重复键错误细化：`server/db/user.ts` 的 `registerUser` 不再把任意 `E11000` 笼统映射为 `loginAlreadyExist`，仅当冲突字段确为 `login` 时返回该错误，其他唯一键冲突（如旧 `email_1` 索引非 sparse 导致多个无 email 用户被判重）向上抛出真实错误，避免误导用户为"用户名已注册"
- 新增运维脚本 `scripts/fix-email-index.mjs`：将历史遗留的 `users.email_1` 索引重建为 `unique + sparse`，让多个无 email 用户共存。需在升级到该版本前手动执行一次（`node scripts/fix-email-index.mjs`）
- 密码可见性切换按钮（睁眼/闭眼 SVG，`aria-pressed` 状态反馈）
- 注册新增"确认密码"字段，前端校验两次一致（服务端不接收）
- 服务端错误码翻译：新增 `app/utils/login.ts` 的 `authErrorMessage`，将 `loginAlreadyExist`/`loginNotExist`/`wrongPassword` 等码映射为中文，可定位的错误同时挂到对应输入框（如"用户名不存在"→用户名框、"密码错误"→密码框）
- 输入框字号提至 16px，避免 iOS 聚焦自动放大
- 可访问性：每个输入框配 `sr-only` label、`aria-invalid`/`aria-describedby`、`autocomplete`（`username`/`current-password`/`new-password`）
- 提交按钮在表单未校验通过时禁用；注册成功后保留用户名预填到登录态

---

## [0.1.2]

### 新增

- 认证路由守卫 `app/middleware/auth.ts`：未登录用户访问受保护页面（房间、历史战绩、成就）时自动跳转到登录页，登录成功后回跳原路径
- Pinia store 新增 `token` getter：便捷获取当前用户 JWT token
- 受保护页面（`room.vue`、`history.vue`、`achievements.vue`）通过 `definePageMeta({ middleware: ['auth'] })` 接入路由守卫
- `profile.vue` 登录成功后支持 `redirect` 查询参数回跳
- 认证状态单元测试 `tests/stores/auth.test.ts`：覆盖 `isLoggedIn`、`token` getter、`logout` 清除、localStorage 持久化
- 路由守卫单元测试 `tests/middleware/auth.test.ts`：覆盖未登录跳转、已登录放行、redirect 参数传递

---

## [0.1.1]

### 新增

- 用户数据服务层 `server/db/user.ts`：注册（bcrypt 12 轮哈希）、登录（email/login 双通道）、凭据更新（需验证当前密码）、公开/私有资料查询
- Socket.IO 认证中间件：连接时从 `socket.handshake.auth.token` 提取并验证 JWT，绑定 userId 到 socket 个人房间，无效 token 触发 `renewJWT` 事件
- Socket 认证事件处理器：`registerUser`、`login`（公开）、`getMyProfile`、`updateUserName`、`updateUserEmail`、`updateUserLogin`、`updateUserPassword`（需认证）
- `CommonClientToServerEvents` 增加 7 个 auth 事件类型定义（注册、登录、资料查询、凭据更新）
- Pinia store `logout` action：清除本地 profile 并断开 socket 重连
- Profile 页退出登录按钮（红色高亮样式）
- 用户服务单元测试 `tests/db/user.test.ts`：覆盖注册成功/重复、登录成功/失败（email 和 login）、凭据更新、公开资料查询

### 变更

- `server/plugins/socket.io.ts`：从空壳升级为完整连接处理器（JWT 验证 + 分层事件注册）
- `docs/roadmap.md`：新增 v0.1.1 里程碑，v0.2.0 已实现项标记为完成

---

## [0.1.0]

### 新增

- Socket 事件协议分层（`shared/types/api/`）
  - `common-events.ts`：跨游戏通用事件接口（`CommonServerToClientEvents` / `CommonClientToServerEvents`），覆盖房间管理、在线计数、统计查询、用户资料等通用通道
  - `avalon-events.ts`：Avalon 游戏专属事件接口（`AvalonServerToClientEvents` / `AvalonClientToServerEvents`），覆盖组队、投票、任务、刺杀等玩法通道
  - 最终 `ClientToServerEvents` / `ServerToClientEvents` 通过 interface 合并组合而成；同步导出 `CommonServer` / `CommonSocket` / `CommonServerSocket` 基类型，方便接入第二款游戏时直接复用通用层

### 变更

- `shared/types/api/socket-events.ts` 职责收敛为"组合入口 + 别名导出"，事件定义分散至对应分层文件
- `shared/types/room/`、`shared/types/game/` 物理目录已移除（上一版本已迁入 `common/` 与 `games/avalon/`），`shared/types/index.ts` 根 barrel 作为唯一公共入口，旧路径彻底废弃

---

## [0.0.6]

### 新增

- 新建 `shared/types/games/avalon/` — Avalon 游戏类型的规范目录（roles、player、mission、vote、options、settings、state、addons、history）
- 新建 `shared/types/common/` — 多游戏通用类型层
  - `game.ts`：`TGameType` 枚举、`TGameConfig` 联合类型（按游戏类型区分配置 schema）
  - `room.ts`：`TRoomState` 增加 `gameType` 字段，`options` 改为 `config: TGameConfig`
  - `room-list.ts`：`TRoomInfo` 增加 `gameType`，`options` 改为 `config`
- `shared/types/games/avalon/options.ts` 新增 `AvalonGameConfig` 类型（`GameOptions` 作为兼容别名保留）
- `shared/types/games/avalon/state.ts` 新增 `AvalonGameState` 类型（`VisualGameState` 作为兼容别名保留）

### 变更

- 游戏类型从 `shared/types/game/` 迁移至 `shared/types/games/avalon/`，旧目录已移除
- 房间类型从 `shared/types/room/` 迁移至 `shared/types/common/room.ts`，旧目录已移除
- `server/db/models/Room.ts`：新增 `gameType` 字段（默认 `'avalon'`），`options` 重命名为 `config`
- `shared/types/index.ts`：导出路径更新至 `games/avalon/` 和 `common/`，新增 `TGameType`、`TGameConfig`、`AvalonGameConfig`、`AvalonGameState` 导出
- 架构设计：确定多游戏平台架构方案（通用层 + Game Registry + 游戏层分离），详见 `docs/architecture.md`
- 路线图重构：从单游戏线性规划重构为多游戏迭代计划（v0.1.0 ~ v0.7.0），按小版本粒度划分

---

## [0.0.5]

### 新增

- 引入 `mongoose` 作为 ODM，连接 MongoDB Atlas 集群（连接串通过 `.env` 中的 `MONGODB_URI` 管理）
- 新增 `server/db/index.ts`：连接单例与 `connectMongoDB()` / `getMongoConnection()` 工具
- 新增 `server/db/models/`：首批 Mongoose Models
  - `User`：对应 `shared/types/user` 的 `UserProfile`（login/email/id 唯一索引）
  - `Room`：对应 `shared/types/room` 的 `StartedRoomState`（roomID 唯一索引，options/game/vote 为 Mixed）
- 新增 `server/plugins/mongodb.ts`：Nitro 启动时触发 MongoDB 连接（fire-and-forget）
- 新增 `.env.example`：模板化环境变量示例（MONGODB_URI / JWT_SECRET）

### 变更

- `AGENTS.md` 技术栈表新增 Mongoose 行、项目结构补充 `server/db/models/` 子目录
- `docs/architecture.md` 同步更新技术栈与目录结构
- `docs/roadmap.md` v0.1.0 勾选：MongoDB 本地开发连接、服务端数据库层基础 Model

### 依赖变更

- 新增依赖：`mongoose`

---

## [0.0.4]

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

## [0.0.2] - 开发工具链

### 新增

- 新增开发工具链：Vitest 测试框架、vue-tsc 类型检查、@nuxt/eslint 代码规范
- 新增 npm scripts：`test` / `test:watch` / `typecheck` / `lint` / `lint:fix`
- 新增测试方案文档（`docs/testing.md`）
- 新增 `eslint.config.mjs`、`vitest.config.ts`、`tests/setup.ts`
- 新增工具函数单元测试（`tests/utils/validators.test.ts`）

### 变更

- `AGENTS.md` 新增测试规范、文档同步规范，更新技术栈表
- 架构文档和路线图文档更新技术栈表格
- 路线图从"阶段"重构为"版本号"里程碑
- 主题文件（`theme.scss`）预计算色值变体，替代 Sass `color.adjust()` 避免运行时依赖
- 组件批量 ESLint 自动修复（自闭合标签、属性顺序）

---

## [0.0.1] - 初始版本

### 新增

- 基于 Nuxt 5 (nightly) + Nitro 3 + Vue 3 搭建 SSR 项目骨架
- 通过 git subtree 引入上游 Avalon 仓库（Razdva122/avalon）至 `_reference/` 作为只读参考
- 基础项目文档（AGENTS.md, architecture.md, roadmap.md）
