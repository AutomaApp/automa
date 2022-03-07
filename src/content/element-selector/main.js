import { createApp } from 'vue';
import vRemixicon from 'v-remixicon';
import App from './App.vue';
import compsUi from './comps-ui';
import icons from './icons';
import vueI18n from './vue-i18n';
import '@/assets/css/tailwind.css';

export default function (rootElement) {
  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app');

  rootElement.shadowRoot.appendChild(appRoot);

  createApp(App)
    .provide('rootElement', rootElement)
    .use(vueI18n)
    .use(vRemixicon, icons)
    .use(compsUi)
    .mount(appRoot);
}
