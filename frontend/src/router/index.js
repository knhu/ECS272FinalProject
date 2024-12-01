import { createRouter, createWebHistory } from 'vue-router';
import StreamGraphView from '../views/StreamGraphView.vue';

const routes = [
  {
    path: '/',
    name: 'StreamGraph',
    component: StreamGraphView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
