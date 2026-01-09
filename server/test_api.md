# API 测试示例

## 使用 curl 测试

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 用户登录

```bash
# 登录用户 1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player1"}'

# 保存返回的 userId 用于后续请求
export USER_ID_1="<返回的userId>"

# 登录更多用户（至少需要 5 个用户测试游戏）
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player2"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player3"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player4"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "player5"}'
```

### 3. 创建房间

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID_1" \
  -d '{"name": "测试房间", "maxPlayers": 10}'

# 保存返回的 roomId
export ROOM_ID="<返回的roomId>"
```

### 4. 获取房间列表

```bash
curl http://localhost:3000/api/rooms
```

### 5. 获取房间详情

```bash
curl http://localhost:3000/api/rooms/$ROOM_ID
```

## 使用 Socket.io 客户端测试

### 安装 socket.io-client

```bash
npm install -g socket.io-client
```

### JavaScript 测试脚本

创建 `test_socket.js`：

```javascript
const io = require('socket.io-client');

// 连接到服务器
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');

  // 加入房间
  socket.emit('join_room', {
    roomId: 'YOUR_ROOM_ID',
    userId: 'YOUR_USER_ID',
    username: 'player1'
  });
});

// 监听加入房间成功
socket.on('joined_room', (data) => {
  console.log('Joined room:', data);
});

// 监听房间更新
socket.on('room_updated', (data) => {
  console.log('Room updated:', data);
});

// 监听角色分配
socket.on('role_assigned', (data) => {
  console.log('Your role:', data);
});

// 监听游戏开始
socket.on('game_started', (data) => {
  console.log('Game started:', data);
});

// 监听队伍提议
socket.on('team_proposed', (data) => {
  console.log('Team proposed:', data);
});

// 监听投票结果
socket.on('team_vote_result', (data) => {
  console.log('Team vote result:', data);
});

// 监听任务结果
socket.on('mission_result', (data) => {
  console.log('Mission result:', data);
});

// 监听刺杀结果
socket.on('assassinate_result', (data) => {
  console.log('Assassinate result:', data);
});

// 监听游戏结束
socket.on('game_over', (data) => {
  console.log('Game over:', data);
});

// 监听错误
socket.on('error', (data) => {
  console.error('Error:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

运行测试：

```bash
node test_socket.js
```

## 完整游戏流程测试

### 1. 准备阶段

1. 创建 5-10 个用户账号
2. 创建一个房间
3. 所有用户加入房间
4. 房主开始游戏

### 2. 游戏阶段

#### 第一轮任务

1. 系统分配角色，每个玩家收到角色信息
2. 第一个队长提议组队（2-3人，取决于玩家总数）
3. 所有玩家投票是否同意该队伍
4. 如果通过，队伍成员进行任务投票
5. 系统广播任务结果

#### 后续轮次

重复上述流程，直到：
- 好人赢得 3 轮任务（进入刺客阶段）
- 坏人赢得 3 轮任务（游戏结束，坏人获胜）
- 5 次提议都被拒绝（游戏结束，坏人获胜）

#### 刺客阶段

1. 刺客选择一个玩家刺杀
2. 系统判定是否刺中梅林
3. 公布游戏结果和所有角色

## Socket.io 事件流程示例

```javascript
// 房主开始游戏
socket.emit('start_game', {
  roomId: 'ROOM_ID',
  userId: 'HOST_USER_ID'
});

// 队长提议组队（假设需要 3 人）
socket.emit('propose_team', {
  roomId: 'ROOM_ID',
  userId: 'LEADER_USER_ID',
  teamUserIds: ['USER_ID_1', 'USER_ID_2', 'USER_ID_3']
});

// 所有玩家投票
socket.emit('vote_team', {
  roomId: 'ROOM_ID',
  userId: 'PLAYER_USER_ID',
  approve: true  // or false
});

// 队伍成员进行任务投票
socket.emit('vote_mission', {
  roomId: 'ROOM_ID',
  userId: 'TEAM_MEMBER_USER_ID',
  success: true  // 好人必须投 true，坏人可以选择 false
});

// 刺客刺杀（游戏结束阶段）
socket.emit('assassinate', {
  roomId: 'ROOM_ID',
  userId: 'ASSASSIN_USER_ID',
  targetUserId: 'TARGET_USER_ID'
});
```

## 常见问题

### 1. MongoDB 连接失败

确保 MongoDB 服务正在运行：

```bash
# 启动 MongoDB
sudo systemctl start mongod

# 或使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. 端口被占用

修改 `.env` 文件中的 `PORT` 配置。

### 3. Socket.io 连接失败

检查 CORS 配置，确保客户端域名在允许列表中。
