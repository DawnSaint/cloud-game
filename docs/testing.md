# Cloud Game 自动化测试方案



## 1. 目标与原则

1. **回归保护优先** —— 测试作为业务代码改动的快速反馈机制(秒级),
   不以覆盖率数字为考核指标。
2. **从纯函数到 UI** —— 价值密度最高的逻辑(游戏引擎、状态机、表单验证)
   全部与 DOM 解耦,优先用最便宜的工具覆盖。
3. **服务端游戏引擎重点保护** —— 游戏核心逻辑(角色分配、回合管理、
   胜负判定)是项目最复杂、最易出错的部分,必须有高密度测试覆盖。
4. **Socket 边界一律 mock** —— 测试不在真实 WebSocket 连接里跑,
   通过 stub 把 `useSocket` 隔在 store / 业务逻辑之外。
5. **渐进、可中断** —— 任意阶段停下都不会让工程"半残";每阶段后
   都能继续做功能,只是少了那一层网。
6. **和 Roadmap 同步** —— 后续新加的服务端逻辑、游戏阶段、角色
   按本文档的分阶段方式持续接入,不让"历史包袱"越积越大。



## 2. 选型

| 层 | 工具 | 理由 |
|---|---|---|
| 单测 / 集成 | **Vitest** | Vite 原生,TypeScript + ESM 一把梭,极快 |
| 组件 | **@vue/test-utils** | Vue 3 官方,搭配 `jsdom` 环境 |
| 覆盖率 | **@vitest/coverage-v8** | 看个大概,不卡阈值 |
| 类型检查 | **vue-tsc** | 已引入,CI 中作为编译门 |
| 端到端 | **Playwright** | 后期需要时再引入 |

> **不选 Jest** —— 配 ESM + Vite alias 麻烦,生态差距在 Vite 项目里基本消失。



## 3. 分阶段路线图



### 阶段 0 — 基础设施(已完成)

**动作**:
- [x] 安装 `vitest` `vue-tsc`
- [x] 新增 `vitest.config.ts`(`~/` alias)
- [x] `package.json` 加 `test` / `test:watch` / `typecheck` 三个脚本
- [x] `tests/validators.test.ts` 作为首批示例(14 条 case)



### 阶段 1 — 前端纯函数与工具(当前)

**目标**:覆盖 `app/utils/` 和 `app/composables/` 中的纯逻辑。

**动作**:
- [ ] `tests/utils/validators.test.ts` — 已有,持续补充
- [ ] `tests/utils/roleImages.test.ts`
  - [ ] `getRoleImage()` 返回正确的 CDN URL
  - [ ] `getImage()` 拼接路径正确
  - [ ] `getRoleName()` 对已知角色返回中文名
  - [ ] `getRoleName()` 对未知角色返回"未知角色"
- [ ] `tests/utils/const.test.ts`
  - [ ] `socketURL` 在 dev / production 环境切换正确
- [ ] `tests/composables/useUI.test.ts`
  - [ ] `showToast` 设置 visible/title/icon,到期自动隐藏
  - [ ] `showModal` / `closeModal` 的 Promise resolve 行为
  - [ ] `showLoading` / `hideLoading` 状态切换
  - [ ] `showActionSheet` / `closeActionSheet` 返回 tapIndex

**验收**:
- [ ] 所有纯函数和 composable 都有 ≥ 3 条 case
- [ ] `npm run test` 秒级通过



### 阶段 2 — Pinia Store(配合用户系统开发)

**目标**:为 `app/stores/main.ts` 的核心 action 写单元测试。

**动作**:
- [ ] `tests/stores/main.test.ts`
  - [ ] `getStorageData` / `setStorageData` 辅助函数(localStorage mock)
  - [ ] `updateUserProfile` 更新 store + 持久化到 localStorage
  - [ ] `updateUserSettings` 按 key 更新 + 持久化
  - [ ] `clearUserProfile` 清空 profile + 清除 localStorage
  - [ ] `updateAlertCounter` 计数递增 + 持久化
  - [ ] `login` / `registerUser` mock socket.emitWithAck 返回值
  - [ ] `updateConnectState` / `updateHideSpoilers` 简单状态切换
- [ ] Socket mock 层:在 `tests/setup.ts` 中 mock `useSocket`
  的 `emit` / `emitWithAck` / `on` / `off`

**验收**:
- [ ] Store 的所有 public action 都有测试
- [ ] Socket 调用全部 mock,不依赖真实连接



### 阶段 3 — 服务端游戏引擎(核心,配合阶段一 Roadmap)

**目标**:游戏引擎是项目最复杂的逻辑,必须高密度测试。

**对应 Roadmap**:阶段一(Avalon Online 核心玩法)

**动作**:
- [ ] `tests/game/roles.test.ts` — 角色分配
  - [ ] 各人数对应的角色组合正确
  - [ ] 善恶阵营人数比例正确
  - [ ] 随机分配不产生重复角色
- [ ] `tests/game/turn.test.ts` — 回合管理
  - [ ] 队长轮换顺序正确
  - [ ] 投票通过后进入任务阶段
  - [ ] 投票连续拒绝达到上限 → 邪恶方胜利
- [ ] `tests/game/mission.test.ts` — 任务执行
  - [ ] 好人出成功、坏人可出失败
  - [ ] 失败票数 ≥ 阈值 → 任务失败
  - [ ] 各人数对应的任务人数和失败阈值
- [ ] `tests/game/assassination.test.ts` — 刺杀阶段
  - [ ] 刺杀梅林 → 邪恶方翻盘
  - [ ] 刺杀非梅林 → 好人方胜利
- [ ] `tests/game/gameEngine.test.ts` — 完整流程集成测试
  - [ ] 5 人局完整流程(创建 → 分配 → 5 回合内结束)
  - [ ] 边界情况:连续 5 次投票拒绝
  - [ ] 边界情况:3 次任务成功立即结束

**验收**:
- [ ] 游戏引擎的每个公开方法都有测试
- [ ] 至少 3 条完整流程集成测试
- [ ] 新增角色时必须同步添加该角色的测试



### 阶段 4 — Socket 通信层(配合实时通信开发)

**目标**:验证 `SocketService` 的连接管理、消息分发、ACK 机制。

**动作**:
- [ ] `tests/composables/useSocket.test.ts`
  - [ ] `emit` 正确序列化消息并发送
  - [ ] `emitWithAck` 发送 ackId,收到响应后 resolve
  - [ ] `emitWithAck` 超时 30s 后 resolve null
  - [ ] `on` / `off` 注册和移除监听器
  - [ ] `handleMessage` 正确分发到对应事件
  - [ ] 断线重连:指数退避、最大次数限制
  - [ ] 消息队列:断线期间缓存消息,重连后 flush
  - [ ] `updateAuthToken` 清除 ACK 回调并重连
- [ ] Mock `WebSocket` 全局对象(使用 `vitest` 的 `vi.stubGlobal`)

**验收**:
- [ ] SocketService 的所有 public 方法都有测试
- [ ] 重连逻辑的边界情况全部覆盖



### 阶段 5 — Vue 组件(持续,按需补)

**目标**:组件按"用户可见 + 有交互逻辑"的标准挑,不全覆盖。

**前置**:安装 `@vue/test-utils` `jsdom`,vitest.config.ts 添加
`environment: 'jsdom'`。

**优先级**(从高到低):
1. `VotingPanel.vue` —— 投票交互,状态变化
2. `TeamSelectionPanel.vue` —— 选人逻辑,人数限制
3. `MissionActionPanel.vue` —— 任务出牌,善恶分支
4. `GameSettings.vue` —— 设置双向绑定
5. `NicknameAvatarForm.vue` —— 表单验证联动

**推荐写法**:`@vue/test-utils` 的 `mount` + 必要时的浅渲染
`shallowMount`。逻辑较重的(如投票)用真实 mount,
纯展示的(如 `LobbyLogo`)用 shallow。

**反模式提示**:
- **不要**测样式 / class 名
- **不要**测私有细节(组件内部 ref 名)
- **要**测用户行为("我点了投票按钮,store 收到赞成信号"而不是
  "按钮的第 3 个 ref 被改成 true")

**验收**:
- [ ] 每个交互组件至少 3 条 case
- [ ] 聚焦"输入 → 输出"行为断言,不测内部实现



### 阶段 6 — E2E(需要时启动)

**目标**:端到端覆盖高价值用户路径。

**触发条件**:
- 阶段二/三完成后,手动回归成本明显上升
- 多房间、断线重连等跨状态流出现

**动作**:
- [ ] 安装 `@playwright/test`
- [ ] 写 `e2e/` 目录,首批 3 个流程:
  - [ ] 创建房间 → 加入玩家 → 开始游戏 → 完成一局
  - [ ] 断线 → 重连 → 恢复游戏状态
  - [ ] 注册 → 登录 → 修改资料 → 登出

**注意**:E2E 跑得慢、不稳定、易过期,**只在前面阶段做完、
手动回归明显吃力时**再开。



## 4. Socket 与外部依赖隔离层



**原则**:业务代码只调 Socket 的"语义",不关心实现。
测试用 `vi.mock` 把 `useSocket` 全替成 stub。

**Mock 清单**(阶段 2 起固定):
- `~/composables/useSocket` → `socket.emit` / `socket.emitWithAck`
  / `socket.on` / `socket.off`
- `~/composables/useUI` → `showToast` / `showModal`(组件测试时)

**新增外部调用的规约**:
- Socket 调用集中在 `composables/useSocket.ts`,不要散落在组件里
- Store 是 Socket 和业务逻辑之间的桥梁,测试只 mock Socket 即可
- 未来如有 HTTP API 调用,在 `server/api/` 下封装,测试只 mock 封装层



## 5. 目录与命名规范

```
cloud-game/
├── tests/                          # 测试根目录
│   ├── setup.ts                    # 全局 mock、测试期 hook
│   ├── utils/
│   │   ├── validators.test.ts      # 已完成
│   │   ├── roleImages.test.ts
│   │   └── const.test.ts
│   ├── composables/
│   │   ├── useSocket.test.ts
│   │   └── useUI.test.ts
│   ├── stores/
│   │   └── main.test.ts
│   ├── game/                       # 服务端游戏引擎测试(阶段 3)
│   │   ├── roles.test.ts
│   │   ├── turn.test.ts
│   │   ├── mission.test.ts
│   │   ├── assassination.test.ts
│   │   └── gameEngine.test.ts
│   └── components/                 # Vue 组件测试(阶段 5)
│       ├── VotingPanel.test.ts
│       └── TeamSelectionPanel.test.ts
├── e2e/                            # E2E 测试(阶段 6,按需启动)
└── vitest.config.ts
```

约定:
- 单测按被测模块的目录结构组织在 `tests/` 下,后缀 `.test.ts`
- 一个源文件一个对应测试文件,除非是阶段 6 那种端到端流程
- 描述用 `it('连续 5 次投票拒绝时邪恶方获胜', ...)` 这种
  "行为 + 期望"句式,不要 `it('test vote')` 这种空标题



## 6. CI 集成

**阶段 0 可接入**:
- GitHub Actions 新增 `.github/workflows/test.yml`
- 触发:`push` 到 master、`PR` 打开 / 更新
- 步骤:checkout → setup-node → `npm install` →
  `npm run typecheck` → `npm test`
- 不挂覆盖率阈值,只挂"测试通过 + 类型检查通过"门

**后续升级**:
- 阶段 2 之后:`npm run test:coverage` 上传 codecov(可选)
- 阶段 6 之后:E2E job 拆独立 workflow,只对 `master` 分支触发



## 7. 维护约定

1. **新加业务逻辑默认带测试** —— 改 `validators.ts` / 游戏引擎这种
   核心文件时,PR 必须包含对应 `*.test.ts` 的改动。
2. **Bug 修复先写一个失败用例** —— 任何 bug 的修复 PR 第一条
   commit 应该是"加一个会失败的测试",第二条才是"修代码让它绿"。
   这是阶段 2 之后项目的隐性约定。
3. **失败用例优先于新功能测试** —— 看到 `package.json` 升级
   Nuxt / Pinia / Vitest 时,先跑一遍 `npm test`,红了再决定
   要不要升级。
4. **不追求 100% 覆盖** —— 纯展示组件、SCSS 主题文件这类
   绕过。覆盖率的目的是"看哪块完全没被测过",不是"刷到 100%"。
5. **新增角色 / 游戏阶段时必须同步测试** —— 游戏引擎每新增一个
   角色或一个阶段(如 Lady of the Lake),必须在对应测试文件中
   补充 case,不允许"先上后补"。
