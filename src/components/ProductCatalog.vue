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
  padding: 2.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.catalog-header {
  margin-bottom: 2.5rem;
}

.catalog-header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.search-filters {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
}

.search-box input {
  width: 100%;
  padding: 0.875rem 1.25rem 0.875rem 3rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.search-box input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

.category-filter select {
  padding: 0.875rem 2.5rem 0.875rem 1.25rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  background: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.product-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-medium);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-premium);
  border-color: var(--primary-light);
}

.product-image {
  width: 100%;
  height: 160px;
  background: var(--background-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  padding: 1rem;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.product-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.category-badge {
  background: var(--primary-light);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.25rem;
}

.price {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-color);
}

.stock-status {
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.stock-status.in-stock { color: var(--success-color); }
.stock-status.warning { color: var(--warning-color); }
.stock-status.out { color: var(--error-color); }

.product-meta {
  border-top: 1px solid var(--border-medium);
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.meta-item i {
  color: var(--primary-light);
  width: 14px;
}

.stock-warning {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--warning-color);
  color: white;
  padding: 0.4rem 0.8rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
}

/* Tablet */
@media (max-width: 1024px) {
  .product-catalog { padding: 1.5rem; }
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
}

/* Phone */
@media (max-width: 768px) {
  .product-catalog { padding: 1rem; }
  .catalog-header h1 { font-size: 1.5rem; margin-bottom: 1rem; }
  .search-filters { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .search-box input { font-size: 16px; /* prevents iOS zoom */ }
  .category-filter select { font-size: 16px; width: 100%; }
  .products-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
  .product-card { padding: 1.25rem; }
  .product-image { height: 130px; }
  .product-header h3 { font-size: 1rem; }
  .price { font-size: 1.25rem; }
}

/* Small phone */
@media (max-width: 480px) {
  .product-catalog { padding: 0.75rem; }
  .catalog-header h1 { font-size: 1.25rem; }
  .search-box input {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    font-size: 16px;
  }
  .category-filter select {
    padding: 0.75rem 1rem;
    font-size: 16px;
  }
  .products-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  .product-card { padding: 1rem; }
  .product-image { height: 120px; }
  .product-header { flex-direction: column; gap: 0.5rem; }
  .product-header h3 { font-size: 0.95rem; }
  .category-badge { font-size: 0.65rem; }
  .price { font-size: 1.1rem; }
  .meta-item { font-size: 0.8rem; }
  .stock-status { font-size: 0.8rem; }
}

/* Very small phone */
@media (max-width: 360px) {
  .product-catalog { padding: 0.5rem; }
  .catalog-header h1 { font-size: 1.1rem; }
  .product-card { padding: 0.75rem; }
  .product-image { height: 100px; padding: 0.5rem; }
  .price { font-size: 1rem; }
  .meta-item { font-size: 0.75rem; }
}
</style>
