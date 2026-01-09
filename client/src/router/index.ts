import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import GameRoom from '../views/GameRoom.vue'
import RoomList from '../views/RoomList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LoginView
    },
    {
      path: '/room-list',
      name: 'room-list',
      component: RoomList
    },
    {
      path: '/room/:roomId',
      name: 'game-room',
      component: GameRoom,
      props: true
    }
  ]
})

export default router
