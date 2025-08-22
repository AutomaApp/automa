import { createApp } from 'vue';
import '../assets/css/flow.css';
import '../assets/css/fonts.css';
import '../assets/css/tailwind.css';
import compsUi from '../lib/compsUi';
import vRemixicon, { icons } from '../lib/vRemixicon';
import App from './App.vue';

createApp(App).use(compsUi).use(vRemixicon, icons).mount('#app');

// Vite HMR is automatic; remove legacy webpack HMR hook
