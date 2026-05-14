<template>
  <div class="app">
    <!-- Mobile backdrop -->
    <div v-if="showSidebar && isMobile" class="mobile-backdrop" @click="toggleSidebar"></div>

    <!-- Main App Content -->
    <div class="app-wrapper" :class="{ 'sidebar-hidden': !showSidebar }">
      <nav class="sidebar" :class="{ 'show-sidebar': showSidebar }">
        <div class="sidebar-header">
          <div class="logo-container">
            <div class="sidebar-logo">
              <img src="/mmh-logo.png" alt="MMH Hardware" class="logo-image" @error="handleImageError" @load="logoLoaded = true" />
              <div class="logo-fallback" v-if="!logoLoaded">
                <i class="fas fa-hammer"></i>
                <i class="fas fa-wrench"></i>
              </div>
            </div>
            <div class="logo-text">
              <h1>MMH Hardware</h1>
              <span class="logo-subtitle">Inventory System</span>
            </div>
          </div>
        </div>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link" exact>
            <i class="fas fa-chart-line"></i>
            Dashboard
          </router-link>
          <router-link to="/catalog" class="nav-link">
            <i class="fas fa-boxes"></i>
            Products
          </router-link>
          <div class="nav-item has-submenu">
            <a href="#" class="nav-link" @click.prevent="toggleOrderProcessingSubMenu">
              <i class="fas fa-cogs"></i> <!-- Icon for Order Processing -->
              Order Processing
              <i class="fas fa-chevron-down submenu-arrow" :class="{ 'rotate': showOrderProcessingSubMenu }"></i>
            </a>
            <div v-if="showOrderProcessingSubMenu" class="submenu">
              <router-link to="/orders/new" class="nav-link sub-link">
                <i class="fas fa-cart-plus"></i>
                New Order
              </router-link>
              <router-link to="/orders" class="nav-link sub-link">
                <i class="fas fa-clipboard-list"></i>
                Orders
              </router-link>
            </div>
          </div>
          <div v-if="userRole === 'admin'" class="nav-item has-submenu">
            <a href="#" class="nav-link" @click.prevent="toggleReportsSubMenu">
              <i class="fas fa-chart-bar"></i> <!-- Icon for Reports -->
              Reports
              <i class="fas fa-chevron-down submenu-arrow" :class="{ 'rotate': showReportsSubMenu }"></i>
            </a>
            <div v-if="showReportsSubMenu" class="submenu">
              <router-link to="/reports/sales" class="nav-link sub-link">
                <i class="fas fa-chart-line"></i>
                Sales Report
              </router-link>
              <router-link to="/reports/inventory" class="nav-link sub-link">
                <i class="fas fa-boxes"></i>
                Inventory Report
              </router-link>
            </div>
          </div>
          <router-link v-if="userRole === 'admin'" to="/settings" class="nav-link">
            <i class="fas fa-cog"></i>
            Settings
          </router-link>
        </div>
        
        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <div class="footer-divider"></div>
          <div class="copyright-text">
            <p>&copy; {{ currentYear }} MMH Hardware</p>
            <p class="rights-text">All Rights Reserved</p>
          </div>
        </div>
      </nav>

      <main class="main-content">
        <header class="top-bar">
          <button class="menu-toggle" @click="toggleSidebar">
            <i :class="showSidebar ? 'fas fa-times' : 'fas fa-bars'"></i>
          </button>
          
          <!-- Top Bar Logo (Mobile) -->
          <div class="top-bar-logo" v-if="isMobile">
            <img src="/mmh-logo.png" alt="MMH Hardware" class="top-logo-image" />
            <span class="top-logo-text">MMH Hardware</span>
          </div>
          
          <div class="user-menu">
            <div class="user-profile" @click.stop="toggleUserMenu">
              <div class="avatar">
                {{ username ? username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U') }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ username || user?.email || 'User' }}</span>
                <span class="user-role">{{ userRole || 'Guest' }}</span>
              </div>
              <i class="fas fa-chevron-down" :class="{ 'rotate': showUserMenu }"></i>
            </div>

            <!-- User Menu Dropdown -->
            <div v-show="showUserMenu" class="user-dropdown" :class="{ show: showUserMenu }">
              <div class="dropdown-header">
                <div class="avatar-large">
                  {{ username ? username[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U') }}
                </div>
                <div class="user-info">
                  <p class="user-email">{{ username || user?.email || 'Guest User' }}</p>
                  <p class="user-role">{{ userRole || 'No Role Assigned' }}</p>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-menu-items">
                <router-link to="/guide-manual" class="menu-item">
                  <i class="fas fa-book"></i>
                  Guide Manual
                </router-link>
              </div>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { auth, db } from './firebase/config'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useToast } from 'vue-toastification'
import { useSettingsStore } from './stores/settingsStore'
import { doc, getDoc } from 'firebase/firestore' // Removed collection, query, where, onSnapshot
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const searchQuery = ref('')
    const username = ref('')
    const userAvatar = ref('')
    const showUserMenu = ref(false)
    const showSidebar = ref(window.innerWidth > 768) // Hide sidebar on mobile by default
    const showOrderProcessingSubMenu = ref(false) // New state for Order Processing submenu
    const showReportsSubMenu = ref(false) // New state for Reports submenu
    const logoLoaded = ref(true) // Track logo loading state

    // Use store properties with toRefs to maintain reactivity
    const { user, userRole } = toRefs(authStore)

    // Computed property for mobile detection
    const isMobile = computed(() => window.innerWidth <= 768)
    
    // Current year for copyright
    const currentYear = computed(() => new Date().getFullYear())

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
      // Removed: showNotifications.value = false
    }

    // Removed: toggleNotifications method

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    const toggleOrderProcessingSubMenu = () => {
      showOrderProcessingSubMenu.value = !showOrderProcessingSubMenu.value
    }

    const toggleReportsSubMenu = () => {
      showReportsSubMenu.value = !showReportsSubMenu.value
    }

    const handleLogout = async () => {
      console.log('Logout initiated...');
      const toast = useToast();
      showUserMenu.value = false; // Close menu immediately
      
      try {
        await signOut(auth);
        console.log('Firebase signOut successful');
        
        // Use a small delay to ensure Firebase state propagates
        setTimeout(() => {
          router.push('/login');
          toast.success('Logged out successfully');
        }, 100);
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed: ' + error.message);
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    }

    const handleImageError = () => {
      logoLoaded.value = false
    }

    onMounted(() => {
      // Initialize stores
      authStore.initializeAuth()

      // Initialize settings store
      const settingsStore = useSettingsStore()
      settingsStore.initializeSettings()
      
      // Listen for auth state changes
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            username.value = userData.username || firebaseUser.displayName || 'User';
            authStore.setUserRole(userData.role); // Use the action to update user role in store
          } else {
            username.value = firebaseUser.displayName || 'User';
            authStore.setUserRole('staff'); // Default role if user doc not found
          }
          userAvatar.value = firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username.value) + '&background=random';
          
          // Removed: Fetch notifications
        } else {
          username.value = '';
          userAvatar.value = '';
          authStore.setUserRole('staff'); // Reset to default role
        }
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        const userProfile = document.querySelector('.user-profile')
        const userDropdown = document.querySelector('.user-dropdown')
        
        if (userProfile && !userProfile.contains(e.target) && 
            userDropdown && !userDropdown.contains(e.target)) {
          showUserMenu.value = false
        }
      })
    })

    // Removed: fetchUserData function

    return {
      searchQuery,
      // Removed: unreadNotifications,
      username,
      userAvatar,
      userRole,
      user,
      // Removed: notifications,
      showUserMenu,
      // Removed: showNotifications,
      showSidebar,
      showOrderProcessingSubMenu,
      showReportsSubMenu,
      isMobile,
      currentYear,
      toggleUserMenu,
      // Removed: toggleNotifications,
      toggleSidebar,
      toggleOrderProcessingSubMenu,
      toggleReportsSubMenu,
      handleLogout,
      formatTime,
      logoLoaded,
      handleImageError
    }
  }
}
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  /* Enhanced Premium Theme - Deep Indigo & Slate */
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: #818cf8;
  --secondary-color: #64748b;
  --accent-color: #06b6d4;
  --accent-hover: #0891b2;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;

  /* Surfaces & Backgrounds */
  --background-primary: #f8fafc;
  --background-secondary: #f1f5f9;
  --surface-primary: #ffffff;
  --surface-secondary: rgba(255, 255, 255, 0.8);
  --surface-glass: rgba(255, 255, 255, 0.7);
  
  /* Text Colors */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-inverse: #ffffff;

  /* Borders & Shadows */
  --border-light: rgba(226, 232, 240, 0.8);
  --border-medium: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-premium: 0 10px 30px -5px rgba(79, 70, 229, 0.15);

  /* Radius & Spacing */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--background-primary);
  color: var(--text-primary);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* Glassmorphism Utility */
.glass-effect {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Layout Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Premium Card Style */
.premium-card {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-premium);
  border: 1px solid var(--border-light);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* Loading animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.spinner {
  animation: spin 1s linear infinite;
}

.app {
  display: flex;
  position: relative;
  overflow-x: hidden;
}

  .app-wrapper {
    display: flex;
    position: relative;
    min-height: 100vh;
    flex: 1;
  }

  .sidebar {
    width: 280px;
    min-width: 280px;
    background: #0f172a;
    color: var(--text-inverse);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-xl);
    transition: all 0.3s ease;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    overflow-y: auto;
  }

  .sidebar.sidebar-hidden {
    transform: translateX(-100%);
  }
  
  .app-wrapper.sidebar-hidden .main-content {
    margin-left: 0;
  }

.sidebar-header {
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.sidebar-logo:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a9d5f, #ff8c00);
  border-radius: 8px;
  position: relative;
}

.logo-fallback i {
  color: white;
  font-size: 12px;
  position: absolute;
}

.logo-fallback i:first-child {
  top: 8px;
  left: 8px;
  transform: rotate(-45deg);
}

.logo-fallback i:last-child {
  bottom: 8px;
  right: 8px;
  transform: rotate(45deg);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-text h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
  margin: 0;
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 14px;
  transition: all var(--transition-normal);
  font-weight: 500;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: var(--accent-color);
  transform: scaleY(0);
  transition: transform var(--transition-normal);
  border-radius: 0 2px 2px 0;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(6px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-link:hover::before {
  transform: scaleY(1);
}

.nav-link.router-link-active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.nav-link.router-link-active::before {
  transform: scaleY(1);
  background: rgba(255, 255, 255, 0.9);
}

.nav-item.has-submenu {
  position: relative;
}

.nav-item .nav-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.submenu-arrow {
  transition: transform 0.3s ease;
}

.submenu-arrow.rotate {
  transform: rotate(180deg);
}

.submenu {
  display: flex;
  flex-direction: column;
  padding-left: 20px; /* Indent sub-menu items */
  margin-top: 5px;
  gap: 5px;
}

.sub-link {
  padding: 8px 16px; /* Adjust padding for sub-links */
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.05); /* Slightly different background for sub-links */
}

.sub-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sub-link.router-link-active {
  background: #2980b9; /* Darker blue for active sub-link */
  box-shadow: none;
}

.nav-link i {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: inherit;
}

/* Sidebar Footer */
.sidebar-footer {
  margin-top: auto;
  padding-top: var(--space-6);
}

.footer-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: var(--space-4);
}

.copyright-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  line-height: 1.4;
}

.copyright-text p {
  margin: 0;
  padding: 2px 0;
}

.rights-text {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 50%, #e2e8f0 100%);
  position: relative;
  margin-left: 280px;
  transition: margin-left var(--transition-normal);
}

.main-content::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.top-bar {
  background: rgba(255, 255, 255, 0.8);
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 90;
  height: 70px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-medium);
}

/* Top Bar Logo (Mobile) */
.top-bar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
  margin: 0 20px;
}

.top-logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 6px;
}

.top-logo-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.25px;
}

  .menu-toggle {
    display: none;
    background: none;
    border: none;
    color: #2c3e50;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    margin-right: 15px;
  }

.user-menu {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  margin-left: auto;
}

.notifications-btn {
  position: relative;
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.notifications-btn:hover {
  background-color: #f5f6fa;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  background: var(--background-secondary);
  border: 1px solid var(--border-medium);
}

.user-profile:hover {
  background: white;
  border-color: var(--primary-light);
  box-shadow: var(--shadow-sm);
}

.user-profile i {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  transition: transform 0.3s;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: white !important;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-premium);
  min-width: 280px;
  z-index: 1000;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 1px solid var(--border-medium);
}

.user-dropdown.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.dropdown-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dropdown-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 20px;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.dropdown-header .user-info {
  flex: 1;
}

.dropdown-header .user-email {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.dropdown-header .user-role {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.dropdown-divider {
  height: 1px;
  background: #edf2f7;
  margin: 8px 0;
}

.dropdown-menu-items {
  padding: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  margin: 0 12px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  position: relative;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 24px;
  background: var(--accent-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: width var(--transition-fast);
}

.menu-item:hover {
  background: var(--surface-hover);
  color: var(--accent-color);
  padding-left: 24px;
}

.menu-item:hover::before {
  width: 4px;
}

.menu-item:hover i {
  color: var(--accent-color);
  transform: scale(1.1);
}

.menu-item i {
  font-size: var(--font-size-base);
  width: 20px;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 24px);
  position: relative;
  margin: 8px 12px 12px;
  padding: 12px 18px;
  border: none;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
  color: var(--error-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast);
  text-align: left;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
}

.logout-btn::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 24px;
  background: var(--error-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  transition: width var(--transition-fast);
}

.logout-btn:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
  color: var(--error-color);
  padding-left: 24px;
  border-color: var(--error-color);
  transform: translateX(2px);
}

.logout-btn:hover::before {
  width: 4px;
}

.logout-btn:hover i {
  color: var(--error-color);
  transform: scale(1.1);
}

.logout-btn i {
  font-size: var(--font-size-base);
  width: 20px;
  transition: all var(--transition-fast);
}

.dropdown-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  color: #2c3e50;
  transition: all 0.3s;
  font-size: 14px;
}

.dropdown-item:hover {
  background: #f5f6fa;
  color: #3498db;
}

.dropdown-item i {
  width: 20px;
  color: #666;
  font-size: 16px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  font-size: var(--font-size-lg);
  box-shadow: var(--shadow-md);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-normal);
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
  color: #2c3e50;
}

.user-role {
  font-size: 12px;
  color: #7f8c8d;
}

.content {
  padding: 30px;
  flex: 1;
}

  /* Responsive adjustments */

  /* Tablet and smaller screens */
  @media (max-width: 1024px) {
    .sidebar {
      width: 200px;
      min-width: 200px;
      padding: 20px;
    }

    .sidebar-logo {
      width: 40px;
      height: 40px;
    }

    .logo-text h1 {
      font-size: 1.25rem;
    }

    .logo-subtitle {
      font-size: 0.7rem;
    }

    .nav-link {
      padding: 10px 14px;
      font-size: 0.95rem;
    }

    .top-bar {
      padding: 12px 24px;
    }

    
    .user-menu {
      gap: 15px;
    }

    .user-profile {
      padding: 6px 10px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      font-size: 16px;
    }

    .user-name {
      font-size: 13px;
    }

    .user-role {
      font-size: 11px;
    }
  }

  /* Mobile screens */
  @media (max-width: 768px) {
    .app {
      overflow-x: hidden;
    }

    .app-wrapper {
      position: relative;
    }

    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 280px;
      transform: translateX(-100%);
      transition: transform 0.3s ease-in-out;
      z-index: 1000;
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
    }

    .sidebar.show-sidebar {
      transform: translateX(0);
    }

    /* Mobile logo styles */
    .logo-container {
      gap: 12px;
    }

    .sidebar-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }

    .logo-text h1 {
      font-size: 1.125rem;
    }

    .logo-subtitle {
      font-size: 0.65rem;
    }

    .menu-toggle {
      display: block !important;
    }

    .top-bar {
      padding: 12px 16px;
      flex-wrap: wrap;
      justify-content: flex-start;
      gap: 12px;
      height: auto;
      min-height: 60px;
      position: relative;
      z-index: 95;
    }

    .user-menu {
      order: 1;
      margin-left: 0;
      gap: 8px;
    }

    .user-profile {
      gap: 8px;
      padding: 6px 10px;
    }

    .avatar {
      width: 32px;
      height: 32px;
      font-size: 14px;
    }

    .user-name {
      font-size: 13px;
    }

    .user-role {
      font-size: 11px;
    }

    .notifications-btn {
      order: 2;
      margin-left: auto;
    }

    .main-content {
      width: 100% !important;
      margin-left: 0 !important;
      min-height: calc(100vh - 60px);
    }

    .content {
      padding: 16px;
    }

    .user-dropdown {
      right: 8px;
      left: 8px;
      width: auto;
      max-width: none;
      margin: 0;
      min-width: 200px;
      position: absolute;
      top: 100%;
      margin-top: 4px;
    }

    .dropdown-header {
      padding: 16px;
      gap: 12px;
    }

    .avatar-large {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    .dropdown-header .user-email {
      font-size: 14px;
    }

    .dropdown-header .user-role {
      font-size: 11px;
    }

    .menu-item,
    .logout-btn {
      padding: 12px 16px;
      font-size: 14px;
      gap: 12px;
    }

    .menu-item i,
    .logout-btn i {
      font-size: 16px;
      width: 20px;
    }

    .notifications-dropdown {
      right: 8px;
      left: 8px;
      width: auto;
      max-width: none;
      margin: 0;
    }

    /* Hide submenu arrows on mobile for cleaner look */
    .submenu-arrow {
      display: none;
    }

    /* Stack submenu items vertically */
    .submenu {
      position: static;
      box-shadow: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-top: 8px;
    }

    .sub-link {
      padding: 12px 20px;
      margin: 0;
      border-radius: 8px;
    }
  }

  /* Smaller mobile screens */
  @media (max-width: 480px) {
    .top-bar {
      padding: 8px 15px;
    }

    .menu-toggle {
      font-size: 20px;
      margin-right: 10px;
    }



    .user-profile {
      gap: 4px;
      padding: 6px;
      min-width: 40px;
      justify-content: center;
    }

    .avatar {
      width: 32px;
      height: 32px;
      font-size: 16px; /* Slightly larger for better visibility */
    }

    .user-name,
    .user-role {
      display: none; /* Hide text to save space - POS style */
    }

    .user-profile i {
      font-size: 12px;
      margin-left: 2px;
    }

    .notifications-btn {
      font-size: 16px;
      padding: 6px;
    }

    .notification-badge {
      font-size: 10px;
      padding: 1px 4px;
      min-width: 16px;
      top: -3px;
      right: -3px;
    }

    .dropdown-header {
      padding: 15px;
      gap: 10px;
    }

    .avatar-large {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .dropdown-header .user-email {
      font-size: 14px;
    }

    .dropdown-header .user-role {
      font-size: 12px;
    }

    .menu-item,
    .logout-btn {
      padding: 8px 12px;
      font-size: 13px;
    }

    .menu-item i,
    .logout-btn i {
      font-size: 14px;
    }

    /* Extra compact dropdown for small mobile screens */
    .user-dropdown {
      min-width: 180px;
      border-radius: 8px;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      z-index: 9999;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .dropdown-header {
      padding: 12px;
      gap: 8px;
    }

    .avatar-large {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }

    .dropdown-header .user-email {
      font-size: 13px;
    }

    .dropdown-header .user-role {
      font-size: 10px;
    }

    .dropdown-menu-items {
      padding: 4px;
    }

    .menu-item,
    .logout-btn {
      padding: 10px 12px;
      font-size: 13px;
      gap: 8px;
      margin: 0 4px;
    }

    .menu-item i,
    .logout-btn i {
      font-size: 14px;
      width: 18px;
    }
  }

/* Mobile backdrop */
.mobile-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
</style>
