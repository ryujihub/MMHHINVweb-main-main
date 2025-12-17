<template>
  <div class="products-page">
    <div class="container">
      <!-- Header -->
      <section class="products-header">
        <h1>Our Products & Services</h1>
        <p class="subtitle">Browse our comprehensive range of construction supplies and hardware</p>
      </section>

      <!-- Search and Filter Section -->
      <section class="search-section">
        <div class="search-wrapper">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search products by name, code, or category..."
              @input="filterProducts"
            />
          </div>
          <div class="category-filter">
            <i class="fas fa-filter"></i>
            <select v-model="selectedCategory" @change="filterProducts">
              <option value="">All Categories</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading products...</p>
      </div>

      <!-- Products Grid -->
      <section v-else class="products-section">
        <div v-if="filteredProducts.length > 0">
          <div class="products-stats">
            <p>Showing <strong>{{ filteredProducts.length }}</strong> product{{ filteredProducts.length !== 1 ? 's' : '' }}</p>
          </div>
          <div class="products-grid">
            <div
              v-for="product in filteredProducts"
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
                <div v-else-if="product.currentStock > 0 && product.currentStock <= 10" class="product-badge low-stock">
                  Limited Stock
                </div>
              </div>
              <div class="product-info">
                <div class="product-category">{{ product.category }}</div>
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-code">Code: {{ product.productCode }}</div>
                <div class="product-price">₱{{ formatPrice(product.price) }}</div>
                <div class="product-stock" :class="getStockClass(product.currentStock)">
                  <i :class="getStockIcon(product.currentStock)"></i>
                  <span>{{ getStockText(product.currentStock) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div v-else class="no-results">
          <i class="fas fa-search"></i>
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      </section>

      <!-- Categories Overview -->
      <section v-if="!loading && availableCategories.length > 0" class="categories-overview">
        <h2 class="section-title">Browse by Category</h2>
        <div class="categories-grid">
          <div
            v-for="category in availableCategories"
            :key="category"
            class="category-card"
            @click="selectCategory(category)"
          >
            <i :class="getCategoryIcon(category)"></i>
            <h3>{{ category }}</h3>
            <p>{{ getCategoryCount(category) }} product{{ getCategoryCount(category) !== 1 ? 's' : '' }}</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="products-cta">
        <h2>Can't find what you're looking for?</h2>
        <p>Contact us and we'll help you find the right products for your project</p>
        <router-link to="/contact" class="btn btn-white">Contact Us Today</router-link>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '../stores/inventoryStore'
import { collection, query, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'

export default {
  name: 'Products',
  setup() {
    const inventoryStore = useInventoryStore()
    const searchQuery = ref('')
    const selectedCategory = ref('')
    const loading = ref(true)
    const products = ref([])

    // Initialize inventory listener
    onMounted(() => {
      // Initialize the inventory store listener
      inventoryStore.initializeInventoryListener()
      
      // Also set up a direct listener for the products page
      const inventoryQuery = query(collection(db, 'inventory'))
      
      const unsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
        products.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        loading.value = false
      }, (error) => {
        console.error('Error fetching products:', error)
        loading.value = false
      })

      // Use store inventory if available
      if (inventoryStore.inventory && inventoryStore.inventory.length > 0) {
        products.value = inventoryStore.inventory
        loading.value = false
      }
    })

    // Get available categories from products
    const availableCategories = computed(() => {
      const categories = new Set()
      products.value.forEach(product => {
        if (product.category) {
          categories.add(product.category)
        }
      })
      return Array.from(categories).sort()
    })

    // Filtered products
    const filteredProducts = computed(() => {
      let filtered = products.value

      // Filter by category
      if (selectedCategory.value) {
        filtered = filtered.filter(p => p.category === selectedCategory.value)
      }

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(p =>
          p.name?.toLowerCase().includes(query) ||
          p.productCode?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
        )
      }

      return filtered
    })

    // Methods
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
      return `${stock} in stock`
    }

    const getCategoryIcon = (category) => {
      const categoryIcons = {
        'Hand Tools': 'fas fa-hammer',
        'Power Tools': 'fas fa-cog',
        'Building Materials': 'fas fa-cube',
        'Paint & Supplies': 'fas fa-paint-brush',
        'Electrical Supplies': 'fas fa-plug',
        'Plumbing Materials': 'fas fa-faucet',
        'Hardware & Fasteners': 'fas fa-screw',
        'Safety Equipment': 'fas fa-hard-hat'
      }
      return categoryIcons[category] || 'fas fa-box'
    }

    const getCategoryCount = (category) => {
      return products.value.filter(p => p.category === category).length
    }

    const selectCategory = (category) => {
      selectedCategory.value = category
      // Scroll to products section
      setTimeout(() => {
        const productsSection = document.querySelector('.products-section')
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }

    const filterProducts = () => {
      // Triggered by input/change events
    }

    const handleImageError = (event) => {
      // Set placeholder image on error
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyNUMzNSAyNSAyNSAzNSAyNSAzNUMyNSA0MCAzMCA0MCA0MCA0MEM1MCA0MCA1MCAzNSA1MCAyNUM0MCAyNSAzMCAyNSAyNSAyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0NSIgcj0iNCIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'
    }

    return {
      searchQuery,
      selectedCategory,
      loading,
      products,
      availableCategories,
      filteredProducts,
      formatPrice,
      getStockClass,
      getStockIcon,
      getStockText,
      getCategoryIcon,
      getCategoryCount,
      selectCategory,
      filterProducts,
      handleImageError
    }
  }
}
</script>

<style scoped>
.products-page {
  padding: 80px 40px;
  background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%);
  min-height: calc(100vh - 76px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.products-header {
  text-align: center;
  margin-bottom: 40px;
}

.products-header h1 {
  font-size: 3.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 1.25rem;
  color: #64748b;
  max-width: 700px;
  margin: 0 auto;
}

/* Search Section */
.search-section {
  margin-bottom: 50px;
}

.search-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 16px;
  color: #64748b;
  z-index: 1;
}

.search-box input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideInLeft 0.5s ease-out;
}

.search-box input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  transform: scale(1.02);
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.category-filter {
  min-width: 220px;
  position: relative;
  display: flex;
  align-items: center;
}

.category-filter i {
  position: absolute;
  left: 16px;
  color: #64748b;
  z-index: 1;
  pointer-events: none;
}

.category-filter select {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
}

.category-filter select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
}

.loading-state i {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #3b82f6;
}

/* Products Section */
.products-stats {
  margin-bottom: 24px;
  color: #64748b;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  animation: fadeInUp 0.5s ease-out backwards;
  position: relative;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.product-card:hover::before {
  opacity: 1;
}

.product-card:nth-child(1) { animation-delay: 0.05s; }
.product-card:nth-child(2) { animation-delay: 0.1s; }
.product-card:nth-child(3) { animation-delay: 0.15s; }
.product-card:nth-child(4) { animation-delay: 0.2s; }
.product-card:nth-child(5) { animation-delay: 0.25s; }
.product-card:nth-child(6) { animation-delay: 0.3s; }
.product-card:nth-child(n+7) { animation-delay: 0.35s; }

.product-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
  border-color: #0ea5e9;
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

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 280px;
  background: #f8fafc;
  overflow: hidden;
}

.product-image {
  position: relative;
  width: 100%;
  height: 100%;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover .product-image img {
  transform: scale(1.15);
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
  font-size: 0.95rem;
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
  animation: badgePulse 2s ease-in-out infinite;
  z-index: 2;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
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
  padding: 28px 24px;
}

.product-category {
  font-size: 0.75rem;
  color: #3b82f6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  line-height: 1.4;
}

.product-code {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 12px;
}

.product-price {
  font-size: 1.75rem;
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

/* No Results */
.no-results {
  text-align: center;
  padding: 80px 20px;
  color: #64748b;
}

.no-results i {
  font-size: 4rem;
  margin-bottom: 24px;
  color: #cbd5e1;
}

.no-results h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: #1e293b;
}

/* Categories Overview */
.categories-overview {
  margin-bottom: 60px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #1e293b;
  margin-bottom: 40px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.category-card {
  background: white;
  padding: 32px 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border: 2px solid transparent;
  animation: fadeInUp 0.5s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.6s ease;
  transform: scale(0);
}

.category-card:hover::before {
  opacity: 1;
  transform: scale(1);
}

.category-card:nth-child(1) { animation-delay: 0.1s; }
.category-card:nth-child(2) { animation-delay: 0.2s; }
.category-card:nth-child(3) { animation-delay: 0.3s; }
.category-card:nth-child(4) { animation-delay: 0.4s; }

.category-card:hover {
  transform: translateY(-10px) scale(1.05);
  border-color: #3b82f6;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
}

.category-card i {
  font-size: 2.5rem;
  color: #3b82f6;
  margin-bottom: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
}

.category-card:hover i {
  transform: scale(1.3) rotate(15deg);
  color: #2563eb;
}

.category-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.category-card p {
  color: #64748b;
  font-size: 0.875rem;
}

/* CTA Section */
.products-cta {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  padding: 80px 40px;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(14, 165, 233, 0.3);
}

.products-cta h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.products-cta p {
  font-size: 1.25rem;
  margin-bottom: 32px;
  opacity: 0.9;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-white {
  background: white;
  color: #3b82f6;
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .products-page {
    padding: 40px 16px;
  }

  .products-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .search-section {
    flex-direction: column;
  }

  .search-box,
  .category-filter {
    min-width: 100%;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 2rem;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .products-cta h2 {
    font-size: 2rem;
  }
}
</style>
