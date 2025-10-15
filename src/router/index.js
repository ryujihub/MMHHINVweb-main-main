import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../components/DashboardNew.vue';
import Login from '../views/Login.vue';
import ProductCatalog from '../components/ProductCatalog.vue';
import OrderProcessing from '../components/OrderProcessing.vue';
import OrderManagement from '../components/OrderManagement.vue';
import SalesReports from '../components/SalesReports.vue';
import InventoryReports from '../components/InventoryReports.vue';
import GuideManual from '../components/GuideManual.vue';
import { auth } from '../supabase/supabaseClient';
import { useAuthStore } from '../stores/authStore'; // Import the auth store

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
  const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
    isAuthReady = true;
    subscription.unsubscribe();
    resolve(session ? session.user : null);
  });
});

router.beforeEach(async (to, from, next) => {
  console.log('Router beforeEach triggered. Navigating to:', to.path);
  if (!isAuthReady) {
    console.log('Waiting for auth to be ready...');
    await waitForAuth;
    console.log('Auth is now ready.');
  }

  const authStore = useAuthStore(); // Get the auth store instance
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = authStore.isAuthenticated; // Use the reactive isAuthenticated from the store

  console.log('Requires Auth:', requiresAuth, 'Is Authenticated:', isAuthenticated);

  if (requiresAuth && !isAuthenticated) {
    console.log('Redirecting to /login: Requires auth but not authenticated.');
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    console.log('Redirecting to /: Authenticated user trying to access /login.');
    next('/');
  } else {
    console.log('Proceeding with navigation to:', to.path);
    next();
  }
});

export default router;
