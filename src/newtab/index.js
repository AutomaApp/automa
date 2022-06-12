import { createApp } from 'vue';
import inspector from 'vue-inspector-agnostic';
import { createHead } from '@vueuse/head';
import App from './App.vue';
import router from './router';
import store from '../store';
import compsUi from '../lib/compsUi';
import vueI18n from '../lib/vueI18n';
import vRemixicon, { icons } from '../lib/vRemixicon';
import vueToastification from '../lib/vue-toastification';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';

const head = createHead();

createApp(App)
  .use(router)
  .use(head)
  .use(store)
  .use(compsUi)
  .use(vueI18n)
  .use(vueToastification)
  .use(vRemixicon, icons)
  .use(inspector)
  .mount('#app');

if (module.hot) module.hot.accept();
