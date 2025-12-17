<template>
  <div class="home-page">
    <!-- Hero Banner Section -->
    <section class="hero-banner">
      <div class="hero-overlay"></div>
      <div class="hero-content-wrapper">
        <div class="hero-content">
          <div class="hero-badge">Welcome to</div>
          <h1 class="hero-title">Metro Manila Hills</h1>
          <h2 class="hero-subtitle">Construction Supply and Trading</h2>
          <p class="hero-description">
            Your one-stop destination for premium construction materials, hardware supplies, and building solutions. 
            Quality products, competitive prices, exceptional service.
          </p>
          <div class="hero-buttons">
            <router-link to="/products" class="btn btn-primary">
              <span>Shop Now</span>
              <i class="fas fa-arrow-right"></i>
            </router-link>
            <router-link to="/about" class="btn btn-outline">Learn More</router-link>
          </div>
        </div>
      </div>
      <div class="hero-features">
        <div class="feature-item">
          <i class="fas fa-shipping-fast"></i>
          <span>Free Delivery</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-shield-alt"></i>
          <span>Quality Guaranteed</span>
        </div>
        <div class="feature-item">
          <i class="fas fa-headset"></i>
          <span>24/7 Support</span>
        </div>
      </div>
    </section>

    <!-- Category Banners Section -->
    <section class="category-banners">
      <div class="container">
        <div class="banners-grid">
          <div class="category-banner" v-for="category in featuredCategories" :key="category.id">
            <div class="banner-image">
              <i :class="category.icon"></i>
            </div>
            <div class="banner-content">
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
              <router-link to="/products" class="banner-link">
                Shop {{ category.name }} <i class="fas fa-arrow-right"></i>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="featured-products" v-if="featuredProducts.length > 0">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Featured Products</h2>
          <p class="section-subtitle">Best selling items from our collection</p>
        </div>
        <div class="products-grid">
          <div 
            v-for="product in featuredProducts.slice(0, 8)" 
            :key="product.id"
            class="product-card"
          >
            <div class="product-image-wrapper">
              <div class="product-image">
                <img 
                  :src="product.image || '/placeholder-product.png'" 
                  :alt="product.name"
                  @error="handleImageError"
                />
                <div class="product-overlay">
                  <button class="quick-view-btn">
                    <i class="fas fa-eye"></i> Quick View
                  </button>
                </div>
              </div>
              <div v-if="product.currentStock === 0" class="product-badge out-of-stock">
                Out of Stock
              </div>
              <div v-else-if="product.currentStock <= 10" class="product-badge low-stock">
                Limited Stock
              </div>
            </div>
            <div class="product-info">
              <div class="product-category">{{ product.category }}</div>
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">₱{{ formatPrice(product.price) }}</div>
              <div class="product-stock" :class="getStockClass(product.currentStock)">
                <i :class="getStockIcon(product.currentStock)"></i>
                <span>{{ getStockText(product.currentStock) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="section-footer">
          <router-link to="/products" class="btn btn-secondary">View All Products</router-link>
        </div>
      </div>
    </section>

    <!-- Why Choose Us Section -->
    <section class="why-choose-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Why Choose Metro Manila Hills</h2>
          <p class="section-subtitle">Your trusted partner in construction</p>
        </div>
        <div class="features-grid">
          <div class="feature-box">
            <div class="feature-icon">
              <i class="fas fa-award"></i>
            </div>
            <h3>Premium Quality</h3>
            <p>We source only the finest materials from trusted suppliers, ensuring durability and reliability for every project.</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">
              <i class="fas fa-truck-fast"></i>
            </div>
            <h3>Fast Delivery</h3>
            <p>Quick and reliable delivery service to get your materials to your construction site when you need them.</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">
              <i class="fas fa-tags"></i>
            </div>
            <h3>Best Prices</h3>
            <p>Competitive pricing without compromising on quality. Get the best value for your construction budget.</p>
          </div>
          <div class="feature-box">
            <div class="feature-icon">
              <i class="fas fa-user-tie"></i>
            </div>
            <h3>Expert Advice</h3>
            <p>Our experienced team provides professional guidance to help you choose the right products for your project.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-banner">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Start Your Project?</h2>
          <p>Get in touch with us today for expert advice and competitive quotes</p>
          <div class="cta-buttons">
            <router-link to="/contact" class="btn btn-white">Contact Us</router-link>
            <router-link to="/products" class="btn btn-outline-white">Browse Products</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../stores/inventoryStore'
import { collection, query, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default {
  name: 'Home',
  setup() {
    const inventoryStore = useInventoryStore()
    const featuredProducts = ref([])
    const loading = ref(true)

    const featuredCategories = [
      {
        id: 1,
        name: 'Hand Tools',
        icon: 'fas fa-hammer',
        description: 'Essential tools for every project'
      },
      {
        id: 2,
        name: 'Power Tools',
        icon: 'fas fa-tools',
        description: 'Professional equipment'
      },
      {
        id: 3,
        name: 'Building Materials',
        icon: 'fas fa-cube',
        description: 'Quality construction supplies'
      },
      {
        id: 4,
        name: 'Paint & Supplies',
        icon: 'fas fa-paint-brush',
        description: 'Complete painting solutions'
      }
    ]

    onMounted(() => {
      // Initialize inventory store
      inventoryStore.initializeInventoryListener()

      // Fetch featured products (products with stock > 0, limit to 8)
      const productsQuery = query(
        collection(db, 'inventory'),
        orderBy('currentStock', 'desc'),
        limit(20)
      )

      const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
        featuredProducts.value = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(p => p.currentStock > 0)
          .slice(0, 8)
        loading.value = false
      }, (error) => {
        console.error('Error fetching products:', error)
        loading.value = false
      })

      // Also check store inventory
      if (inventoryStore.inventory && inventoryStore.inventory.length > 0) {
        featuredProducts.value = inventoryStore.inventory
          .filter(p => p.currentStock > 0)
          .slice(0, 8)
        loading.value = false
      }
    })

    const formatPrice = (price) => {
      if (!price) return '0.00'
      return parseFloat(price).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const getStockClass = (stock) => {
      if (stock === 0) return 'out-of-stock'
      if (stock <= 10) return 'low-stock'
      return 'in-stock'
    }

    const getStockIcon = (stock) => {
      if (stock === 0) return 'fas fa-times-circle'
      if (stock <= 10) return 'fas fa-exclamation-circle'
      return 'fas fa-check-circle'
    }

    const getStockText = (stock) => {
      if (stock === 0) return 'Out of Stock'
      if (stock <= 10) return `Only ${stock} left`
      return 'In Stock'
    }

    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyNUMzNSAyNSAyNSAzNSAyNSAzNUMyNSA0MCAzMCA0MCA0MCA0MEM1MCA0MCA1MCAzNSA1MCAyNUM0MCAyNSAzMCAyNSAyNSAyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0NSIgcj0iNCIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
    }

    return {
      featuredProducts,
      featuredCategories,
      formatPrice,
      getStockClass,
      getStockIcon,
      getStockText,
      handleImageError
    }
  }
}
</script>

<style scoped>
.home-page {
  width: 100%;
  overflow-x: hidden;
}

/* Hero Banner Section */
.hero-banner {
  position: relative;
  min-height: 600px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100px 40px 80px;
  overflow: hidden;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(14, 165, 233, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  opacity: 0.3;
}

.hero-content-wrapper {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.hero-content {
  text-align: center;
  color: white;
  animation: fadeInUp 0.8s ease-out;
}

.hero-badge {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(14, 165, 233, 0.2);
  border: 1px solid rgba(14, 165, 233, 0.4);
  border-radius: 30px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #38bdf8;
  margin-bottom: 24px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hero-title {
  font-size: 4.5rem;
  font-weight: 900;
  margin-bottom: 16px;
  line-height: 1.1;
  letter-spacing: -2px;
  color: white;
}

.hero-subtitle {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #38bdf8;
  letter-spacing: -0.5px;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.8;
  margin-bottom: 40px;
  color: #cbd5e1;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.5);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.hero-features {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 40px;
  justify-content: center;
  margin-top: 60px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-weight: 500;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-item i {
  font-size: 1.25rem;
  color: #38bdf8;
}

/* Category Banners */
.category-banners {
  padding: 80px 40px;
  background: #ffffff;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.banners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.category-banner {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  padding: 40px;
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.4s ease;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.category-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.1), transparent);
  transition: left 0.5s ease;
}

.category-banner:hover::before {
  left: 100%;
}

.category-banner:hover {
  transform: translateY(-8px);
  border-color: #0ea5e9;
  box-shadow: 0 12px 40px rgba(14, 165, 233, 0.2);
}

.banner-image {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
}

.banner-image i {
  font-size: 2.5rem;
  color: white;
}

.banner-content {
  flex: 1;
}

.banner-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.banner-content p {
  color: #64748b;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.banner-link {
  color: #0ea5e9;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.banner-link:hover {
  gap: 12px;
  color: #0284c7;
}

/* Featured Products Section */
.featured-products {
  padding: 100px 40px;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.section-subtitle {
  font-size: 1.25rem;
  color: #64748b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  animation: fadeInUp 0.5s ease-out backwards;
}

.product-card:nth-child(1) { animation-delay: 0.05s; }
.product-card:nth-child(2) { animation-delay: 0.1s; }
.product-card:nth-child(3) { animation-delay: 0.15s; }
.product-card:nth-child(4) { animation-delay: 0.2s; }
.product-card:nth-child(5) { animation-delay: 0.25s; }
.product-card:nth-child(6) { animation-delay: 0.3s; }
.product-card:nth-child(7) { animation-delay: 0.35s; }
.product-card:nth-child(8) { animation-delay: 0.4s; }

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  border-color: #0ea5e9;
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 250px;
  background: #f8fafc;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.1);
}

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.quick-view-btn {
  background: white;
  color: #0f172a;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.quick-view-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  z-index: 2;
}

.product-badge.out-of-stock {
  background: #ef4444;
  color: white;
}

.product-badge.low-stock {
  background: #f59e0b;
  color: white;
}

.product-info {
  padding: 24px;
}

.product-category {
  font-size: 0.75rem;
  color: #0ea5e9;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.product-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0ea5e9;
  margin-bottom: 12px;
}

.product-stock {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.product-stock.in-stock {
  color: #059669;
}

.product-stock.low-stock {
  color: #f59e0b;
}

.product-stock.out-of-stock {
  color: #ef4444;
}

.section-footer {
  text-align: center;
}

.btn-secondary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  padding: 16px 40px;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.5);
}

/* Why Choose Section */
.why-choose-section {
  padding: 100px 40px;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.feature-box {
  text-align: center;
  padding: 40px 32px;
}

.feature-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
  transition: all 0.4s ease;
}

.feature-box:hover .feature-icon {
  transform: translateY(-8px) scale(1.1);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.4);
}

.feature-icon i {
  font-size: 2.5rem;
  color: white;
}

.feature-box h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.feature-box p {
  color: #64748b;
  line-height: 1.7;
  font-size: 1rem;
}

/* CTA Banner */
.cta-banner {
  padding: 100px 40px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.cta-content p {
  font-size: 1.25rem;
  margin-bottom: 40px;
  opacity: 0.95;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-white {
  background: white;
  color: #0284c7;
  padding: 16px 32px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.btn-white:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.btn-outline-white {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-outline-white:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
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

/* Responsive */
@media (max-width: 1024px) {
  .hero-title {
    font-size: 3.5rem;
  }
  
  .section-title {
    font-size: 2.5rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-banner {
    padding: 80px 20px 60px;
    min-height: 500px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-features {
    flex-direction: column;
    gap: 16px;
    margin-top: 40px;
  }

  .category-banners {
    padding: 60px 20px;
  }

  .banners-grid {
    grid-template-columns: 1fr;
  }

  .category-banner {
    flex-direction: column;
    text-align: center;
  }

  .featured-products,
  .why-choose-section,
  .cta-banner {
    padding: 60px 20px;
  }

  .section-title {
    font-size: 2rem;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .cta-content h2 {
    font-size: 2rem;
  }
}
</style>
