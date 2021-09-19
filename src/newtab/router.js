import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Workflows from './pages/Workflows.vue';
import Logs from './pages/Logs.vue';

const routes = [
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    name: 'workflows',
    path: '/workflows',
    component: Workflows,
  },
  {
    name: 'logs',
    path: '/logs',
    component: Logs,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
