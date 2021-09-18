import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
