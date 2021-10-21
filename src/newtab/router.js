import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Workflows from './pages/Workflows.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
import Logs from './pages/Logs.vue';
import LogsDetails from './pages/logs/[id].vue';

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
  {
    name: 'logs-details',
    path: '/logs/:id',
    component: LogsDetails,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
