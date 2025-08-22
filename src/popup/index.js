import { createApp } from 'vue';
import '../assets/css/flow.css';
import '../assets/css/fonts.css';
import '../assets/css/tailwind.css';
import compsUi from '../lib/compsUi';
import pinia from '../lib/pinia';
import vRemixicon, { icons } from '../lib/vRemixicon';
import vueI18n from '../lib/vueI18n';
import App from './App.vue';
import router from './router';

createApp(App)
  .use(router)
  .use(compsUi)
  .use(vueI18n)
  .use(pinia)
  .use(vRemixicon, icons)
  .mount('#app');

// Vite handles HMR automatically; remove legacy webpack HMR code
