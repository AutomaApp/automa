import { createApp } from 'vue';
import App from './App.vue';
import '../assets/css/tailwind.css';

createApp(App).mount('#app');

if (module.hot) module.hot.accept();
