import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import 'stats.js';

import 'tailwindcss/tailwind.css';
import router from './router';

createApp(App).use(router).mount('#app');
