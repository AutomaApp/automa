import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from '../store';
import compsUi from '../lib/comps-ui';
import vueI18n from '../lib/vue-i18n';
import vRemixicon, { icons } from '../lib/v-remixicon';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/style.css';

createApp(App)
  .use(router)
  .use(store)
  .use(compsUi)
  .use(vueI18n)
  .use(vRemixicon, icons)
  .mount('#app');

if (module.hot) module.hot.accept();
