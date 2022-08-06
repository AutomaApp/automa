import { createApp } from 'vue';
import App from './App.vue';
import compsUi from '../lib/compsUi';
import vRemixicon, { icons } from '../lib/vRemixicon';
import '../assets/css/tailwind.css';
import '../assets/css/fonts.css';
import '../assets/css/flow.css';

createApp(App).use(compsUi).use(vRemixicon, icons).mount('#app');

if (module.hot) module.hot.accept();
