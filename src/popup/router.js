import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Recording from './pages/Recording.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/recording',
    name: 'recording',
    component: Recording,
  },
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
