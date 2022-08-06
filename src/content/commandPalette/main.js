import { createApp } from 'vue';
import vRemixicon from 'v-remixicon';
import App from './App.vue';
import compsUi from './compsUi';
import icons from './icons';

const additionalStyle = `.list-item-active svg { visibility: visible }`;

export default function (rootElement) {
  const appRoot = document.createElement('div');
  appRoot.setAttribute('id', 'app');

  const style = document.createElement('style');
  style.textContent = additionalStyle;

  rootElement.shadowRoot.appendChild(style);
  rootElement.shadowRoot.appendChild(appRoot);

  createApp(App)
    .use(compsUi)
    .use(vRemixicon, icons)
    .provide('rootElement', rootElement)
    .mount(appRoot);
}
