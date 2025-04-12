const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        name: 'HomePage',
        meta: { public: true },
      },
      { path: 'profile', component: () => import('pages/ProfilePage/index.vue') },
      {
        path: 'map',
        name: 'MapPage',
        component: () => import('pages/RestaurantMap/index.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('pages/LoginPage/index.vue'),
    name: 'LoginPage',
    meta: {
      public: true,
    },
  },
  {
    path: '/register',
    component: () => import('pages/RegisterPage/index.vue'),
    name: 'RegisterPage',
    meta: {
      public: true,
    },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
