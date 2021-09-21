import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Workflows from './pages/Workflows.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
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
    name: 'workflows-details',
    path: '/workflows/:id',
    component: WorkflowDetails,
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
