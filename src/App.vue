<template>
  <div class="app">
    <!-- Navigation Header -->
    <header class="main-header">
      <div class="header-container">
        <div class="logo-section">
          <router-link to="/" class="logo-link">
            <img src="/mmh-logo.png" alt="Metro Manila Hills" class="logo-image" @error="handleImageError" />
            <div class="logo-text">
              <h1>Metro Manila Hills</h1>
              <span class="logo-subtitle">Construction Supply and Trading</span>
            </div>
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <nav class="main-nav" :class="{ 'nav-open': showMobileMenu }">
          <router-link to="/" class="nav-link" exact-active-class="active">Home</router-link>
          <router-link to="/about" class="nav-link" active-class="active">About</router-link>
          <router-link to="/products" class="nav-link" active-class="active">Products</router-link>
          <router-link to="/contact" class="nav-link" active-class="active">Contact</router-link>
        </nav>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <i :class="showMobileMenu ? 'fas fa-times' : 'fas fa-bars'"></i>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <router-view></router-view>
    </main>

    <!-- Footer -->
    <footer class="main-footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>Metro Manila Hills</h3>
            <p class="footer-subtitle">Construction Supply and Trading</p>
            <p>Your trusted partner for quality construction materials and hardware supplies.</p>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><router-link to="/">Home</router-link></li>
              <li><router-link to="/about">About Us</router-link></li>
              <li><router-link to="/products">Products</router-link></li>
              <li><router-link to="/contact">Contact</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Contact Info</h4>
            <ul class="footer-contact">
              <li><i class="fas fa-map-marker-alt"></i> Metro Manila Hills, Montalban, Rizal, Philippines</li>
              <li><i class="fas fa-phone"></i> [Your Phone Number]</li>
              <li><i class="fas fa-envelope"></i> nolimolina1987@gmail.com</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} Metro Manila Hills Construction Supply and Trading. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const showMobileMenu = ref(false)
    const logoLoaded = ref(true)

    const currentYear = computed(() => new Date().getFullYear())

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
    }

    const handleImageError = () => {
      logoLoaded.value = false
    }

    // Close mobile menu when clicking outside
    onMounted(() => {
      document.addEventListener('click', (e) => {
        const nav = document.querySelector('.main-nav')
        const toggle = document.querySelector('.mobile-menu-toggle')
        if (nav && toggle && !nav.contains(e.target) && !toggle.contains(e.target)) {
          showMobileMenu.value = false
        }
      })

      // Close mobile menu on route change
      router.afterEach(() => {
        showMobileMenu.value = false
      })
    })

    return {
      showMobileMenu,
      logoLoaded,
      currentYear,
      toggleMobileMenu,
      handleImageError
    }
  }
}
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary-color: #0f172a;
  --primary-dark: #020617;
  --primary-light: #1e293b;
  --secondary-color: #64748b;
  --accent-color: #0ea5e9;
  --accent-dark: #0284c7;
  --accent-light: #38bdf8;
  --accent-gradient: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  --background-primary: #ffffff;
  --background-secondary: #f8fafc;
  --background-tertiary: #f1f5f9;
  --surface-primary: #ffffff;
  --surface-elevated: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-muted: #94a3b8;
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--background-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.main-header {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--border-primary);
  animation: slideDown 0.5s ease-out;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-section {
  flex: 1;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease;
}

.logo-link:hover {
  transform: scale(1.05);
}

.logo-image {
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: var(--shadow-md);
}

.logo-image:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

@keyframes logoPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

.logo-text h1 {
  font-size: 1.625rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.main-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-link {
  padding: 10px 20px;
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  letter-spacing: 0.2px;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: var(--accent-gradient);
  border-radius: 2px 2px 0 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
}

.nav-link:hover {
  color: var(--accent-color);
  background: rgba(14, 165, 233, 0.08);
  transform: translateY(-1px);
}

.nav-link:hover::before {
  width: 70%;
}

.nav-link.active {
  color: var(--accent-color);
  background: rgba(14, 165, 233, 0.12);
  font-weight: 700;
}

.nav-link.active::before {
  width: 70%;
  background: var(--accent-color);
}

@keyframes activePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-primary);
  cursor: pointer;
  padding: 8px;
  transition: transform 0.3s ease, color 0.3s ease;
  border-radius: 8px;
}

.mobile-menu-toggle:hover {
  transform: scale(1.1);
  color: var(--accent-color);
  background: var(--background-secondary);
}

.mobile-menu-toggle:active {
  transform: scale(0.95);
}

/* Main Content */
.main-content {
  flex: 1;
  width: 100%;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Footer */
.main-footer {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  padding: 80px 40px 32px;
  margin-top: 100px;
  animation: fadeInUp 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.main-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.footer-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.footer-section h4 {
  font-size: 1.125rem;
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
  padding-left: 0;
}

.footer-links a::before {
  content: '→';
  position: absolute;
  left: -20px;
  opacity: 0;
  transition: all 0.3s ease;
}

.footer-links a:hover {
  color: white;
  transform: translateX(5px);
  padding-left: 20px;
}

.footer-links a:hover::before {
  opacity: 1;
  left: 0;
}

.footer-contact {
  list-style: none;
}

.footer-contact li {
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-contact i {
  width: 20px;
  color: var(--accent-light);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-container {
    padding: 12px 16px;
  }

  .logo-text h1 {
    font-size: 1.25rem;
  }

  .logo-subtitle {
    font-size: 0.75rem;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .main-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface-primary);
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .main-nav.nav-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .main-nav.nav-open .nav-link {
    animation: slideInRight 0.3s ease-out backwards;
  }

  .main-nav.nav-open .nav-link:nth-child(1) { animation-delay: 0.1s; }
  .main-nav.nav-open .nav-link:nth-child(2) { animation-delay: 0.2s; }
  .main-nav.nav-open .nav-link:nth-child(3) { animation-delay: 0.3s; }
  .main-nav.nav-open .nav-link:nth-child(4) { animation-delay: 0.4s; }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .nav-link {
    width: 100%;
    text-align: left;
    padding: 16px;
  }

  .main-footer {
    padding: 40px 16px 24px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
