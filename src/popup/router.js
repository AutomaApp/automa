import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Workflow from './pages/Workflow.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/workflow/:id',
    name: 'workflow',
    component: Workflow,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
