import { createHead } from '@vueuse/head';
import { createApp } from 'vue';
import '../assets/css/flow.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';
import '../assets/css/tailwind.css';
import compsUi from '../lib/compsUi';
import pinia from '../lib/pinia';
import vRemixicon, { icons } from '../lib/vRemixicon';
import vueToastification from '../lib/vue-toastification';
import vueI18n from '../lib/vueI18n';
import App from './App.vue';
import router from './router';

const head = createHead();

createApp(App)
  .use(head)
  .use(router)
  .use(compsUi)
  .use(pinia)
  .use(vueI18n)
  .use(vueToastification)
  .use(vRemixicon, icons)
  .mount('#app');

// Vite HMR is automatic; remove legacy webpack HMR code
