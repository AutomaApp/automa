import { createApp } from 'vue';
import { createPinia } from 'pinia';
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

createApp(App)
  .use(router)
  .use(store)
  .use(compsUi)
  .use(vueI18n)
  .use(createPinia())
  .use(vueToastification)
  .use(vRemixicon, icons)
  .mount('#app');

if (module.hot) module.hot.accept();
