import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Index from '../../src/views/Index.vue';
import Admin from '../../src/views/Admin.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Index },
    { path: '/admin', component: Admin },
  ],
});

createApp({}).use(router).mount('#app');


