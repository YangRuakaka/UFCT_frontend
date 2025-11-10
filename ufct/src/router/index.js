/**
 * 应用路由配置
 */

import { createRouter, createWebHistory } from 'vue-router';
import CitationNetwork from '../views/CitationNetwork.vue';
import AuthorCollaboration from '../views/AuthorCollaboration.vue';

const routes = [
  {
    path: '/',
    redirect: '/citation-network'
  },
  {
    path: '/citation-network',
    name: 'CitationNetwork',
    component: CitationNetwork
  },
  {
    path: '/author-collaboration',
    name: 'AuthorCollaboration',
    component: AuthorCollaboration
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
