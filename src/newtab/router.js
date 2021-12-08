import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Workflows from './pages/Workflows.vue';
import WorkflowDetails from './pages/workflows/[id].vue';
import Collections from './pages/Collections.vue';
import CollectionsDetails from './pages/collections/[id].vue';
import Logs from './pages/Logs.vue';
import LogsDetails from './pages/logs/[id].vue';
import Settings from './pages/Settings.vue';

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
    name: 'collections',
    path: '/collections',
    component: Collections,
  },
  {
    name: 'collections-details',
    path: '/collections/:id',
    component: CollectionsDetails,
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
  {
    name: 'settings',
    path: '/settings',
    component: Settings,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
