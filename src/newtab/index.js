import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from '../store';
import compsUi from '../lib/comps-ui';
import vRemixicon from '../lib/v-remixicon';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';

createApp(App)
  .use(router)
  .use(store)
  .use(compsUi)
  .use(vRemixicon)
  .mount('#app');

if (module.hot) module.hot.accept();
