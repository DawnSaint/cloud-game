# 桌游平台后端 - 阿瓦隆

基于 Koa.js + MongoDB + Socket.io 的桌游平台后端，支持阿瓦隆（Avalon）游戏。

## 功能特性

- 简单用户名登录（无需密码）
- 房间创建和管理
- 实时游戏通信（Socket.io）
- 完整的阿瓦隆游戏逻辑
  - 5-10 人标准版
  - 角色系统（梅林、派西维尔、莫甘娜、刺客等）
  - 5 轮任务流程
  - 特殊角色能力
  - 刺客刺杀环节

## 技术栈

- **后端框架**: Koa.js 2.x
- **数据库**: MongoDB + Mongoose
- **实时通信**: Socket.io
- **日志**: Winston

## 快速开始

### 前置要求

- Node.js >= 14.x
- MongoDB >= 4.x

### 安装

```bash
cd /data/workspace_lijun/cloud_game
npm install
```

### 配置

编辑 `.env` 文件：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cloud_game
NODE_ENV=development
```

### 启动

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API 文档

### HTTP 接口

#### 1. 用户登录

**POST** `/api/auth/login`

请求体：
```json
{
  "username": "player1"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "userId": "60d5ec49f1b2c8a4d8e9f123",
    "username": "player1",
    "createdAt": "2024-01-07T10:00:00.000Z"
  }
}
```

#### 2. 创建房间

**POST** `/api/rooms`

Headers: `x-user-id: <userId>`

请求体：
```json
{
  "name": "我的房间",
  "maxPlayers": 10
}
```

#### 3. 获取房间列表

**GET** `/api/rooms`

#### 4. 获取房间详情

**GET** `/api/rooms/:id`

### Socket.io 事件

#### 客户端发送事件

1. **join_room** - 加入房间
```javascript
socket.emit('join_room', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456',
  username: 'player1'
});
```

2. **leave_room** - 离开房间
```javascript
socket.emit('leave_room', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456'
});
```

3. **toggle_ready** - 切换准备状态
```javascript
socket.emit('toggle_ready', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456'
});
```

4. **start_game** - 开始游戏（房主）
```javascript
socket.emit('start_game', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456'
});
```

5. **propose_team** - 队长提议组队
```javascript
socket.emit('propose_team', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456',
  teamUserIds: ['userId1', 'userId2', 'userId3']
});
```

6. **vote_team** - 投票队伍提议
```javascript
socket.emit('vote_team', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456',
  approve: true
});
```

7. **vote_mission** - 任务投票
```javascript
socket.emit('vote_mission', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456',
  success: true  // 好人必须投 true，坏人可以投 false
});
```

8. **assassinate** - 刺客刺杀
```javascript
socket.emit('assassinate', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456',  // 刺客的 userId
  targetUserId: '60d5ec49f1b2c8a4d8e9f789'
});
```

9. **get_game_state** - 获取游戏状态
```javascript
socket.emit('get_game_state', {
  roomId: '60d5ec49f1b2c8a4d8e9f123',
  userId: '60d5ec49f1b2c8a4d8e9f456'
});
```

#### 服务器发送事件

1. **joined_room** - 加入房间成功
2. **room_updated** - 房间状态更新
3. **role_assigned** - 角色分配（私有消息）
4. **game_started** - 游戏开始
5. **team_proposed** - 队伍提议
6. **vote_progress** - 投票进度
7. **team_vote_result** - 队伍投票结果
8. **mission_result** - 任务结果
9. **assassinate_result** - 刺杀结果
10. **game_over** - 游戏结束
11. **error** - 错误消息

## 游戏流程

### 阿瓦隆游戏规则

1. **角色分配**
   - 系统随机分配角色
   - 每个玩家收到自己的角色和视野信息

2. **任务阶段**（共 5 轮）
   - 当前队长提议组队
   - 所有人投票是否同意该队伍
   - 如果通过，队伍成员执行任务投票
   - 根据失败票数判定任务成功或失败
   - 轮换队长，进入下一轮

3. **游戏结束**
   - 好人赢得 3 轮任务：进入刺客阶段
   - 坏人赢得 3 轮任务：坏人获胜
   - 5 次提议都被拒绝：坏人获胜

4. **刺客阶段**
   - 刺客尝试刺杀梅林
   - 刺中：坏人获胜
   - 未刺中：好人获胜

### 角色配置

| 玩家数 | 好人 | 坏人 | 角色配置 |
|-------|------|------|---------|
| 5 | 3 | 2 | 梅林、派西维尔、忠臣×2、莫甘娜、刺客 |
| 6 | 4 | 2 | 梅林、派西维尔、忠臣×2、莫甘娜、刺客 |
| 7 | 4 | 3 | 梅林、派西维尔、忠臣×2、莫甘娜、刺客、奥伯伦 |
| 8 | 5 | 3 | 梅林、派西维尔、忠臣×3、莫甘娜、刺客、爪牙 |
| 9 | 6 | 3 | 梅林、派西维尔、忠臣×4、莫甘娜、刺客、莫德雷德 |
| 10 | 6 | 4 | 梅林、派西维尔、忠臣×4、莫甘娜、刺客、莫德雷德、奥伯伦 |

### 任务队伍人数

| 玩家数 | 第1轮 | 第2轮 | 第3轮 | 第4轮 | 第5轮 |
|-------|------|------|------|------|------|
| 5 | 2 | 3 | 2 | 3 | 3 |
| 6 | 2 | 3 | 4 | 3 | 4 |
| 7 | 2 | 3 | 3 | 4* | 4 |
| 8-10 | 3 | 4 | 4 | 5* | 5 |

*标记的任务需要 2 张失败票才算失败

## 项目结构

```
cloud_game/
├── src/
│   ├── config/          # 配置文件
│   ├── models/          # 数据模型
│   ├── controllers/     # 控制器
│   ├── services/        # 业务逻辑层
│   ├── games/avalon/    # 阿瓦隆游戏逻辑
│   ├── socket/          # Socket.io 处理
│   ├── routes/          # HTTP 路由
│   ├── middleware/      # 中间件
│   └── utils/           # 工具函数
├── app.js               # 应用入口
├── package.json
└── .env                 # 环境变量
```

## 开发说明

### 添加新游戏

1. 在 `src/games/` 下创建新游戏目录
2. 实现游戏逻辑类（参考 `AvalonGame.js`）
3. 在 `gameHandler.js` 中添加游戏事件处理
4. 更新 Room 模型的 `gameType` 枚举

### 日志

日志文件存储在项目根目录：
- `error.log` - 错误日志
- `combined.log` - 所有日志

## 许可证

MIT
