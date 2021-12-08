import { createApp } from 'vue';
import vRemixicon from 'v-remixicon';
import App from './App.vue';
import compsUi from './comps-ui';
import icons from './icons';
import vueI18n from './vue-i18n';
import '@/assets/css/tailwind.css';

const rootElement = document.querySelector('div.automa-element-selector');
const appRoot = rootElement.shadowRoot.querySelector('#app');

createApp(App)
  .provide('rootElement', rootElement)
  .use(vueI18n)
  .use(vRemixicon, icons)
  .use(compsUi)
  .mount(appRoot);
