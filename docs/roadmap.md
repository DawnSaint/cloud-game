# Cloud Game 项目路线图

> 云游戏平台开发规划，以多游戏架构为基座，Avalon Online 为首款验证游戏。移动端优先。

---

## v0.1.0 — 多游戏类型重构

将现有 Avalon 耦合类型重构为通用 + 游戏分层，为后续开发扫清架构障碍。

- [x] 新建 `shared/types/common/` — 通用房间类型（TRoomState 增加 gameType）、用户类型迁移
- [x] 新建 `shared/types/games/avalon/` — 现有 `game/` 类型整体迁入，GameOptions → AvalonGameConfig
- [x] Socket 事件类型分层 — 通用事件接口 + 游戏事件接口，ClientToServerEvents 拆分
- [x] Room Model 增加 `gameType` 字段 — 迁移 `options` → `config`，保持向后兼容
- [x] TRoomInfo 更新 — 房间列表项增加 gameType，options 改为 gameConfig
- [x] 清理旧类型路径 — `shared/types/room/`、`shared/types/game/` 物理目录已移除，根 barrel 作为唯一公共入口

---

## v0.1.1 — 服务端认证核心

补齐服务端认证链路，让客户端注册/登录/会话管理跑通。

- [x] 用户数据服务层 — `server/db/user.ts`（bcrypt 哈希、注册、登录、凭据更新）
- [x] Socket.IO 认证中间件 — 连接时验证 JWT，绑定 userId 到 socket，无效 token 触发 renewJWT
- [x] Socket 认证事件处理器 — registerUser、login、getMyProfile、updateUser* 全套服务端实现
- [x] Socket 事件类型补全 — `CommonClientToServerEvents` 增加 auth 事件类型定义
- [x] 前端登出功能 — Pinia store logout action + profile.vue 退出登录按钮
- [x] 用户服务单元测试 — `tests/db/user.test.ts` 覆盖注册、登录、凭据更新核心路径

---

## v0.2.0 — 用户认证

实现注册/登录/会话管理，为房间系统提供用户身份基础。

- [x] 注册 API — `POST /api/auth/register`（昵称、邮箱、密码）
- [x] 登录 API — `POST /api/auth/login`（邮箱 + 密码 → JWT）
- [x] 用户资料 API — `GET /api/user/profile`，`PUT /api/user/profile`
- [x] Socket.IO 认证中间件 — 连接时验证 JWT，绑定 userId 到 socket
- [ ] 前端登录/注册页面 — 完善 `profile.vue` 表单交互，移动端适配
- [x] 认证状态管理 — Pinia store 持久化 token，路由守卫（未登录跳转）

---

## v0.3.0 — 通用房间系统

实现与游戏无关的房间管理和大厅，打通前后端核心链路。

- [ ] 房间 REST API — `GET /api/rooms`（列表）、`GET /api/rooms/:id`（详情）
- [ ] 通用房间 Socket 事件 — createRoom(gameType)、joinRoom、leaveRoom、kickPlayer、lockRoom
- [ ] 房间状态广播 — roomUpdated 事件推送完整房间状态，玩家加入/离开/踢出实时同步
- [ ] 大厅房间列表 — 在线房间列表、实时刷新、移动端列表 UI
- [ ] 创建房间流程 — 选择游戏类型 → 创建 → 跳转房间页
- [ ] 房间内通用 UI — 玩家列表、房主控制（踢人/锁房）、加入/离开按钮
- [ ] 房间生命周期管理 — 所有人离开自动销毁、房主离开转移权限

---

## v0.4.0 — Avalon 游戏引擎

实现 Avalon 服务端游戏引擎核心，支持角色分配和完整回合流转。

- [ ] Game Registry 框架 — TGameEngine 接口、游戏注册表、事件路由分发
- [ ] Avalon 引擎骨架 — 游戏初始化、角色分配（梅林/忠臣/爪牙/莫甘娜/派西维尔）
- [ ] 回合状态机 — initialization → selectTeam → votingForTeam → onMission → 循环/结束
- [ ] 游戏启动流程 — startGame → 角色分配 → 首夜信息 → 第一轮 selectTeam
- [ ] 前端游戏面板加载 — 按 gameType 动态加载 Avalon 组件
- [ ] 角色揭示 — 首夜角色展示、梅林/派西维尔信息展示

---

## v0.5.0 — Avalon 核心玩法

实现完整回合制玩法，Avalon 可玩。

- [ ] 组队选择 — 队长轮流提名队伍成员，前端 TeamSelectionPanel 对接
- [ ] 队伍投票 — 赞成/反对，连续 5 次拒绝邪恶方获胜
- [ ] 任务执行 — 成功/失败判定（邪恶方可选失败），需要失败的任务数判定
- [ ] 刺杀阶段 — 刺客选择刺杀目标，刺杀梅林则邪恶方获胜
- [ ] 胜负判定 — 任务失败数 / 刺杀梅林 / 连续投票拒绝三种结束条件
- [ ] 游戏结束 — 身份揭示动画、结果展示、回到房间

---

## v0.6.0 — Avalon 体验完善

补齐游戏体验，提升可玩性和稳定性。

- [ ] 更多角色 — 奥伯伦、莫德雷德、布里安娜等可选角色
- [ ] 游戏设置面板 — 角色配置开关、人数限制、预设方案
- [ ] 断线重连 — Socket.IO 重连 + 服务端状态恢复（重新推送当前游戏状态）
- [ ] 游戏历史 — 对局结果持久化到 MongoDB，前端历史页面展示
- [ ] 移动端 UI 打磨 — 触摸反馈、过渡动画、手势操作优化

---

## v0.7.0 — 测试与质量保证

全面测试覆盖，修复已知问题，为首版发布做质量关卡。

- [ ] 游戏引擎单元测试 — 角色分配、回合流转、胜负判定全覆盖
- [ ] Socket 事件集成测试 — 房间生命周期、游戏流程端到端
- [ ] 前端组件测试 — 关键交互路径
- [ ] 类型检查 — `vue-tsc --noEmit` 零错误
- [ ] 已知 Bug 修复与边界情况
- [ ] 性能优化 — 首屏加载、Socket 消息频率

---

## 后续扩展

- [ ] 成就系统
- [ ] 排行榜（按游戏、按角色、按时间维度）
- [ ] 快速匹配 / 大厅推荐
- [ ] 接入第二款游戏（验证多游戏架构）
- [ ] 好友系统

---

## 暂不实现

以下功能在当前阶段不纳入开发计划：

- 聊天系统
- 扩展玩法（Lady of the Lake / Lady of the Sea / Excalibur / Plot Cards）
- 行动计时器
- 国际化
- 旁观模式
