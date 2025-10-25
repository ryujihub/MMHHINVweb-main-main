<template>
  <div class="product-catalog">
    <div class="catalog-header">
      <h1>Product Catalog</h1>
      <div class="search-filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search products..."
            @input="filterProducts"
          >
        </div>
        <div class="category-filter">
          <select v-model="selectedCategory" @change="filterProducts">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="products-grid">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id" 
        class="product-card"
        :class="{ 'low-stock': product.currentStock <= LOW_STOCK_THRESHOLD }"
      >
        <div class="product-image">
          <img :src="product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSAyNUMzNSAyNSAyNSAzNSAyNSAzNUMyNSA0MCAzMCA0MCA0MCA0MEM1MCA0MCA1MCAzNSA1MCAyNUM0MCAyNSAzMCAyNSAyNSAyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0NSIgcj0iNCIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4K'" :alt="product.name" />
        </div>
        <div class="product-header">
          <h3>{{ product.name }}</h3>
          <span class="category-badge">{{ product.category }}</span>
        </div>
        
        <div class="product-details">
          <div class="price">₱{{ formatPrice(product.price) }}</div>
          <div class="stock-status" 
               :class="{ 
                 'warning': product.currentStock <= LOW_STOCK_THRESHOLD,
                 'out': product.currentStock === 0 
               }"
          >
            <i class="fas" :class="getStockIcon(product.currentStock)"></i>
            {{ getStockStatus(product.currentStock) }}
          </div>
        </div>

        <div class="product-meta">
          <div class="meta-item">
            <i class="fas fa-box"></i>
            <span>{{ product.currentStock }} in stock</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-tag"></i>
            <span>Product Code: {{ product.productCode }}</span>
          </div>
        </div>

        <!-- Low Stock Warning -->
        <div v-if="product.currentStock <= LOW_STOCK_THRESHOLD && product.currentStock > 0" 
             class="stock-warning">
          <i class="fas fa-exclamation-triangle"></i>
          Low Stock Alert
        </div>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="filteredProducts.length === 0" class="no-results">
      <i class="fas fa-search"></i>
      <p>No products found matching your search criteria</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '../stores/inventoryStore'

const inventoryStore = useInventoryStore()

// Local state
const searchQuery = ref('')
const selectedCategory = ref('')

// Constants from store
const { LOW_STOCK_THRESHOLD } = inventoryStore
const categories = computed(() => inventoryStore.categories)

// Computed properties
const filteredProducts = computed(() => {
  let products = inventoryStore.inventory

  if (selectedCategory.value) {
    products = products.filter(p => p.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.productCode.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    )
  }

  return products
})

// Methods
const formatPrice = (price) => {
  return price.toLocaleString('en-PH')
}

const getStockStatus = (stock) => {
  if (stock === 0) return 'Out of Stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'Low Stock'
  return 'In Stock'
}

const getStockIcon = (stock) => {
  if (stock === 0) return 'fa-times-circle'
  if (stock <= LOW_STOCK_THRESHOLD) return 'fa-exclamation-circle'
  return 'fa-check-circle'
}

const filterProducts = () => {
  // This function exists to handle any side effects of filtering
  // Currently using computed properties, but might need for future updates
}
</script>

<style scoped>
.product-catalog {
  padding: var(--space-8);
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--background-primary);
  min-height: 100vh;
}

.catalog-header {
  margin-bottom: 2rem;
}

.search-filters {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.category-filter select {
  padding: 0.75rem 2rem 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background-color: white;
  font-size: 1rem;
  cursor: pointer;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Force 4 columns */
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-image {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.5rem;
  background: #f8fafc;
  margin-bottom: 1rem;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.product-card.low-stock {
  border: 1px solid #f59e0b;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.product-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.category-badge {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-color);
}

.stock-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #10b981;
}

.stock-status.warning {
  color: #f59e0b;
}

.stock-status.out {
  color: #ef4444;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stock-warning {
  position: absolute;
  top: 0;
  right: 0;
  background: #f59e0b;
  color: white;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border-bottom-left-radius: 0.5rem;
}

.no-results {
  text-align: center;
  padding: 4rem 0;
  color: #6b7280;
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

@media (max-width: 1024px) {
  .product-catalog {
    padding: 1.5rem;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .product-card {
    padding: 1.25rem;
  }

  .product-image {
    height: 100px;
  }
}

@media (max-width: 768px) {
  .product-catalog {
    padding: 1.25rem;
  }

  .search-filters {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-box input,
  .category-filter select {
    padding: 0.6rem 0.75rem 0.6rem 2.5rem;
    font-size: 0.9rem;
  }

  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .product-card {
    padding: 1rem;
    border-radius: 6px;
  }

  .product-image {
    height: 90px;
    border-radius: 4px;
  }

  .product-header h3 {
    font-size: 1rem;
  }

  .price {
    font-size: 1.1rem;
  }

  .stock-status {
    font-size: 0.8rem;
  }

  .meta-item {
    font-size: 0.8rem;
  }
}

@media (max-width: 640px) {
  .product-catalog {
    padding: 1rem;
  }

  .catalog-header h1 {
    font-size: 1.5rem;
  }

  .products-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .product-card {
    padding: 0.75rem;
    border-radius: 6px;
  }

  .product-image {
    height: 80px;
    border-radius: 4px;
  }

  .product-header h3 {
    font-size: 0.95rem;
  }

  .category-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }

  .price {
    font-size: 1rem;
  }

  .stock-status {
    font-size: 0.75rem;
  }

  .meta-item {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .product-catalog {
    padding: 0.75rem;
  }

  .catalog-header h1 {
    font-size: 1.25rem;
  }

  .search-box input,
  .category-filter select {
    padding: 0.5rem 0.6rem 0.5rem 2.2rem;
    font-size: 0.85rem;
  }

  .search-box i {
    left: 0.75rem;
  }

  .products-grid {
    gap: 0.6rem;
  }

  .product-card {
    padding: 0.6rem;
    border-radius: 4px;
  }

  .product-image {
    height: 70px;
    border-radius: 4px;
  }

  .product-header h3 {
    font-size: 0.85rem;
  }

  .category-badge {
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
  }

  .price {
    font-size: 0.9rem;
  }

  .stock-status {
    font-size: 0.7rem;
  }

  .meta-item {
    font-size: 0.7rem;
  }
}
</style>
