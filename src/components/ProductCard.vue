<template>
  <div class="product-card" @click="addToCart">
    <div class="product-image">
      <img :src="product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAxNUM0Mi4xNSAxNSAzMCAyNS41IDMwIDM4QzMwIDI1LjUgMTcuODUgMTUgMzAgMTVaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzUiIHI9IjMiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+Cg=='" :alt="product.name" />
    </div>
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <div class="product-price">₱{{ product.price }}</div>
    </div>
    <div class="product-stock">{{ product.currentStock }} in stock</div>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  methods: {
    addToCart() {
      if (this.product.currentStock > 0) {
        this.$emit('add-to-cart', {
          ...this.product,
          quantity: 1
        })
      }
    }
  }
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-medium);
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 140px;
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background: var(--background-secondary);
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.product-card:hover .product-image img {
  transform: scale(1.08);
}

.product-card:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.product-card.out-of-stock {
  opacity: 0.45;
  cursor: not-allowed;
}

.product-info {
  text-align: center;
}

.product-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.2rem;
}

.product-stock {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  text-align: center;
  background: var(--background-secondary);
  padding: 0.15rem 0.4rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

/* Tablet */
@media (max-width: 768px) {
  .product-card {
    padding: 0.6rem;
    min-height: 120px;
    gap: 0.35rem;
    min-width: 0; /* allow grid to control width */
  }
  .product-image { height: 55px; }
  .product-name { font-size: 0.75rem; }
  .product-price { font-size: 0.85rem; }
  .product-stock { font-size: 0.65rem; }
}

/* Small phone */
@media (max-width: 480px) {
  .product-card {
    padding: 0.5rem;
    min-height: 100px;
    gap: 0.3rem;
  }
  .product-image { height: 48px; }
  .product-name { font-size: 0.7rem; }
  .product-price { font-size: 0.8rem; }
  .product-stock { font-size: 0.6rem; padding: 0.1rem 0.3rem; }
}
</style>
