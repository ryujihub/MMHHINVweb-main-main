import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../components/DashboardNew.vue';
import Login from '../views/Login.vue';
import ProductCatalog from '../components/ProductCatalog.vue';
import OrderProcessing from '../components/OrderProcessing.vue';
import OrderManagement from '../components/OrderManagement.vue';
import SalesReports from '../components/SalesReports.vue';
import InventoryReports from '../components/InventoryReports.vue';
import GuideManual from '../components/GuideManual.vue';
import { auth } from '../firebase/config';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/catalog',
    name: 'ProductCatalog',
    component: ProductCatalog,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders/new',
    name: 'OrderProcessing',
    component: OrderProcessing,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'OrderManagement',
    component: OrderManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/reports/sales',
    name: 'SalesReports',
    component: SalesReports,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/reports/inventory',
    name: 'InventoryReports',
    component: InventoryReports,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/guide-manual',
    name: 'GuideManual',
    component: GuideManual,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Wait for Firebase Auth to initialize before checking auth state
let isAuthReady = false;
const waitForAuth = new Promise(resolve => {
  const unsubscribe = auth.onAuthStateChanged(user => {
    isAuthReady = true;
    unsubscribe();
    resolve(user);
  });
});

router.beforeEach(async (to, from, next) => {
  if (!isAuthReady) {
    await waitForAuth;
  }
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
