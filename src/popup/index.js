import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from '../store';
import compsUi from '../lib/compsUi';
import vueI18n from '../lib/vueI18n';
import vRemixicon, { icons } from '../lib/vRemixicon';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';

createApp(App)
  .use(router)
  .use(store)
  .use(compsUi)
  .use(vueI18n)
  .use(vRemixicon, icons)
  .mount('#app');

if (module.hot) module.hot.accept();
