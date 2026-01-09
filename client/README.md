# 云桌游客户端 - 阿瓦隆

这是一个简易的 Vue3 + TypeScript 前端项目，用于测试云桌游（阿瓦隆）后端的基本功能。

## 技术栈

- Vue 3.4
- TypeScript 5.3
- Vite 5.1
- Socket.io Client 4.7
- Axios 1.6

## 功能特性

- 用户登录（简单用户名登录）
- 房间列表查看和刷新
- 创建游戏房间
- 加入游戏房间
- 实时游戏通信（Socket.io）
- 准备状态切换
- 开始游戏
- 游戏状态显示
- 实时消息推送

## 快速开始

### 前置条件

- Node.js >= 14.x
- 后端服务已启动（默认 http://localhost:3000）

### 安装依赖

```bash
cd cloud_game_client
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:5173` 启动。

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
cloud_game_client/
├── src/
│   ├── components/         # Vue 组件
│   │   ├── LoginView.vue   # 登录页面
│   │   ├── RoomList.vue    # 房间列表
│   │   └── GameRoom.vue    # 游戏房间
│   ├── services/           # 服务层
│   │   ├── api.ts          # HTTP API 服务
│   │   └── socket.ts       # Socket.io 服务
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.vue             # 根组件
│   ├── main.ts             # 应用入口
│   └── vite-env.d.ts       # Vite 类型声明
├── index.html              # HTML 模板
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目配置

```

## 使用说明

### 1. 登录

- 输入任意用户名即可登录
- 用户信息会保存在 localStorage 中

### 2. 房间管理

- 查看所有可用房间
- 点击"创建房间"按钮创建新房间
- 点击等待中的房间卡片加入房间
- 正在游戏中或已结束的房间无法加入

### 3. 游戏房间

- 查看房间内所有玩家
- 非房主玩家点击"准备"按钮
- 房主在所有人准备后可以"开始游戏"
- 游戏需要 5-10 名玩家
- 实时接收游戏消息和状态更新

## API 接口

项目使用 Vite 的代理功能将 `/api` 请求转发到后端服务器：

- `POST /api/auth/login` - 用户登录
- `GET /api/rooms` - 获取房间列表
- `GET /api/rooms/:id` - 获取房间详情
- `POST /api/rooms` - 创建房间

## Socket.io 事件

### 客户端发送

- `join_room` - 加入房间
- `leave_room` - 离开房间
- `toggle_ready` - 切换准备状态
- `start_game` - 开始游戏
- `propose_team` - 提议组队
- `vote_team` - 投票队伍
- `vote_mission` - 任务投票
- `assassinate` - 刺杀
- `get_game_state` - 获取游戏状态

### 服务器发送

- `joined_room` - 加入房间成功
- `room_updated` - 房间状态更新
- `role_assigned` - 角色分配
- `game_started` - 游戏开始
- `team_proposed` - 队伍提议
- `vote_progress` - 投票进度
- `team_vote_result` - 队伍投票结果
- `mission_result` - 任务结果
- `assassinate_result` - 刺杀结果
- `game_over` - 游戏结束
- `error` - 错误消息

## 开发说明

### 修改后端地址

编辑 [vite.config.ts](vite.config.ts) 中的 proxy 配置：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-url:port',
      changeOrigin: true
    }
  }
}
```

同时修改 [src/services/socket.ts](src/services/socket.ts) 中的 Socket 连接地址：

```typescript
connect(url: string = 'http://your-backend-url:port')
```

## 测试流程

1. 启动后端服务
2. 启动前端开发服务器
3. 打开多个浏览器标签页模拟多个玩家
4. 每个标签页使用不同的用户名登录
5. 创建房间并让其他玩家加入
6. 所有玩家准备后开始游戏
7. 观察实时消息和游戏状态更新

## 许可证

MIT
