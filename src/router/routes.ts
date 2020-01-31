import { RouteConfig } from 'vue-router'

const routes: RouteConfig[] = [
  {
    path: '/',
    component: () => import('layouts/AppShell.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
      { path: 'for/you/:id', component: () => import('pages/Auth.vue') }
    ],
  },
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue'),
  });
}

export default routes;
