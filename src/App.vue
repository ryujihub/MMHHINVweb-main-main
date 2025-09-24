<template>
  <div class="app">
    <!-- Main App Content -->
    <div class="app-wrapper" :class="{ 'sidebar-hidden': !showSidebar }">
      <nav class="sidebar" :class="{ 'show-sidebar': showSidebar }">
        <div class="sidebar-header">
          <h1>MMH Hardware</h1>
          <p class="subtitle">Management System</p>
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
          <router-link to="/orders/new" class="nav-link">
            <i class="fas fa-cart-plus"></i>
            New Order
          </router-link>
          <router-link to="/orders" class="nav-link">
            <i class="fas fa-clipboard-list"></i>
            Orders
          </router-link>
          <router-link to="/reports" class="nav-link">
            <i class="fas fa-chart-bar"></i>
            Reports
          </router-link>
        </div>
      </nav>

      <main class="main-content">
        <header class="top-bar">
          <button class="menu-toggle" @click="toggleSidebar">
            <i :class="showSidebar ? 'fas fa-times' : 'fas fa-bars'"></i>
          </button>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search products, orders, reports..." 
              v-model="searchQuery"
            >
          </div>
          
          <div class="user-menu">
            <button class="notifications-btn" @click="toggleNotifications">
              <i class="fas fa-bell"></i>
              <span v-if="unreadNotifications" class="notification-badge">
                {{ unreadNotifications }}
              </span>
            </button>
            
            <div class="user-profile" @click.stop="toggleUserMenu">
              <div class="avatar">
                {{ user?.email ? user.email[0].toUpperCase() : 'U' }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ user?.email || 'User' }}</span>
                <span class="user-role">{{ userRole || 'Guest' }}</span>
              </div>
              <i class="fas fa-chevron-down" :class="{ 'rotate': showUserMenu }"></i>
            </div>

            <!-- User Menu Dropdown -->
            <div v-if="showUserMenu" class="user-dropdown" :class="{ show: showUserMenu }">
          <div class="dropdown-header">
            <div class="avatar-large">
              {{ user?.email ? user.email[0].toUpperCase() : 'U' }}
            </div>
            <div class="user-info">
              <p class="user-email">{{ user?.email || 'Guest User' }}</p>
              <p class="user-role">{{ userRole || 'No Role Assigned' }}</p>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-menu-items">
            <a href="#" class="menu-item">
              <i class="fas fa-user"></i>
              Profile
            </a>
            <a href="#" class="menu-item">
              <i class="fas fa-cog"></i>
              Settings
            </a>
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

        <!-- Notifications Dropdown -->
        <div v-if="showNotifications" class="notifications-dropdown" :class="{ show: showNotifications }">
          <div v-if="notifications.length === 0" class="no-notifications">
            No new notifications
          </div>
          <div v-else class="notifications-list">
            <div v-for="notification in notifications" 
                 :key="notification.id" 
                 class="notification-item"
                 :class="{ unread: !notification.read }">
              <div class="notification-content">
                <p class="notification-text">{{ notification.message }}</p>
                <span class="notification-time">{{ notification.timestamp }}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import { auth, db } from './firebase/config'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const searchQuery = ref('')
    const unreadNotifications = ref(0)
    const username = ref('')
    const userAvatar = ref('')
    const showUserMenu = ref(false)
    const showNotifications = ref(false)
    const showSidebar = ref(true) // New state for sidebar visibility
    const notifications = ref([])

    // Use store properties with toRefs to maintain reactivity
    const { user, userRole } = toRefs(authStore)

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
      showNotifications.value = false // Close notifications when user menu is toggled
    }

    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      showUserMenu.value = false // Close user menu when notifications are toggled
    }

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    const handleLogout = async () => {
      try {
        await signOut(auth)
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatDistanceToNow(date, { addSuffix: true })
    }

    onMounted(() => {
      // Initialize auth store
      authStore.initializeAuth()
      
      // Listen for auth state changes
      onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          username.value = firebaseUser.displayName || 'User'
          userAvatar.value = firebaseUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username.value) + '&background=random'
          
          // Fetch user role and notifications
          fetchUserData(firebaseUser.uid)
        } else {
          username.value = ''
          userAvatar.value = ''
        }
      })

      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        const userProfile = document.querySelector('.user-profile')
        const notificationsBtn = document.querySelector('.notifications-btn')
        
        if (userProfile && !userProfile.contains(e.target)) {
          showUserMenu.value = false
        }
        
        if (notificationsBtn && !notificationsBtn.contains(e.target)) {
          showNotifications.value = false
        }
      })
    })

    const fetchUserData = async (userId) => {
      try {
        // Listen for notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          where('read', '==', false)
        )
        
        onSnapshot(notificationsQuery, (snapshot) => {
          notifications.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          unreadNotifications.value = notifications.value.length
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    return {
      searchQuery,
      unreadNotifications,
      username,
      userAvatar,
      userRole,
      user,
      notifications,
      showUserMenu,
      showNotifications,
      showSidebar,
      toggleUserMenu,
      toggleNotifications,
      toggleSidebar,
      handleLogout,
      formatTime
    }
  }
}
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f6fa;
  color: #2c3e50;
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
  flex: 1; /* Ensure app-wrapper takes full width */
}

.sidebar {
  width: 240px; /* Reduced width for more main content space */
  min-width: 240px;
  background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: sticky;
  left: 0;
  top: 0;
  z-index: 100;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

.sidebar.hide-on-mobile {
  transform: translateX(-100%);
  position: absolute;
}

.sidebar-header {
  padding-bottom: 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.sidebar-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: white;
  letter-spacing: -0.5px;
}

.sidebar-header .subtitle {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-top: 6px;
  letter-spacing: 0.5px;
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
  padding: 12px 16px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 1rem;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-link.router-link-active {
  background: #3498db;
  color: white;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
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

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8fafc;
  position: relative;
}

.top-bar {
  background: white;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 90;
  height: 72px;
}

.menu-toggle {
  display: none; /* Hidden by default, shown on mobile */
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  margin-right: 15px;
}

.search-bar {
  position: relative;
  width: 300px;
}

.search-bar input {
  width: 100%;
  padding: 8px 35px 8px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
}

.search-bar i {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
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
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.3s;
  position: relative;
}

.user-profile:hover {
  background: #f5f6fa;
}

.user-profile i {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s;
}

.user-profile i.rotate {
  transform: rotate(180deg);
}

.user-profile:hover {
  background: #f5f6fa;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 280px;
  margin-top: 8px;
  padding: 0;
  z-index: 1000;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  overflow: hidden;
}

.user-dropdown.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.dropdown-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(to right, #3498db, #2980b9);
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
  padding: 10px 16px;
  margin: 0 8px;
  color: #4a5568;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.menu-item:hover {
  background: #f7fafc;
  color: #3498db;
}

.menu-item i {
  font-size: 16px;
  width: 20px;
  color: #a0aec0;
}

.menu-item:hover i {
  color: #3498db;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 16px);
  margin: 4px 8px 8px;
  padding: 10px 16px;
  border: none;
  background: none;
  color: #e53e3e;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-align: left;
  border-radius: 6px;
}

.logout-btn:hover {
  background: #fff5f5;
}

.logout-btn i {
  font-size: 16px;
  width: 20px;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
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

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  min-width: 220px;
  z-index: 1000;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.user-dropdown.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

.notifications-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  min-width: 300px;
  max-width: 400px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
}

.notifications-list {
  padding: 10px;
}

.notification-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background: #f8f9fa;
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: #7f8c8d;
}

.no-notifications {
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .app-wrapper {
    flex-direction: column;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 250px;
    transform: translateX(-100%);
    transition: transform 0.3s ease-in-out;
    z-index: 1000;
  }

  .sidebar.show-sidebar {
    transform: translateX(0);
  }

  .menu-toggle {
    display: block;
  }

  .top-bar {
    padding: 10px 20px;
    flex-direction: row;
    justify-content: flex-start;
    gap: 15px;
  }

  .search-bar {
    flex-grow: 1;
    width: auto;
  }

  .user-menu {
    width: auto;
    margin-left: auto;
  }

  .notifications-btn {
    margin-left: 0;
  }

  .content {
    padding: 15px;
  }
}
</style>
