import { createApp } from 'vue';
import vRemixicon from 'v-remixicon';
import App from './App.vue';
import icons from './icons';
import injectAppStyles from '../../injectAppStyles';

const customCSS = `
  #app {
    font-family: 'Inter var';
    line-height: 1.5;
  }
  .content {
    width: 250px;
  }
`;

export default function () {
  const rootElement = document.createElement('div');
  rootElement.attachShadow({ mode: 'open' });
  rootElement.setAttribute('id', 'automa-recording');
  rootElement.classList.add('automa-element-selector');
  document.body.appendChild(rootElement);

  return injectAppStyles(rootElement.shadowRoot, customCSS).then(() => {
    const appRoot = document.createElement('div');
    appRoot.setAttribute('id', 'app');
    rootElement.shadowRoot.appendChild(appRoot);

    const app = createApp(App).use(vRemixicon, icons);
    app.mount(appRoot);

    return app;
  });
}
