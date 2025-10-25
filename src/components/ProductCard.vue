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
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-3);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
  cursor: pointer;
  min-height: 160px;
  max-width: 160px;
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.03) 0%, rgba(14, 165, 233, 0.03) 100%);
  opacity: 0;
  transition: opacity var(--transition-normal);
  border-radius: var(--radius-lg);
}

.product-image {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--background-secondary) 0%, var(--surface-tertiary) 100%);
  transition: all var(--transition-normal);
  position: relative;
}

.product-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
  border-radius: var(--radius-md);
}

.product-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-6px) scale(1.02);
  border-color: var(--primary-light);
}

.product-card:hover::before {
  opacity: 1;
}

.product-card:hover .product-image {
  transform: scale(1.08);
  box-shadow: var(--shadow-md);
}

.product-card:hover .product-image img {
  transform: scale(1.15);
}

.product-card.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.product-info {
  text-align: center;
}

.product-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.product-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-color);
  margin-top: 0.25rem;
}

.product-stock {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Mobile POS-style responsive adjustments */
@media (max-width: 768px) {
  .product-card {
    padding: 0.6rem;
    min-height: 130px;
    max-width: 120px;
    gap: 0.4rem;
    border-radius: 6px;
  }

  .product-image {
    height: 60px;
    border-radius: 4px;
  }

  .product-name {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 600;
  }

  .product-price {
    font-size: 0.9rem;
    margin-top: 0.2rem;
    font-weight: 700;
  }

  .product-stock {
    font-size: 0.7rem;
    padding: 2px 4px;
    border-radius: 3px;
  }
}

@media (max-width: 480px) {
  .product-card {
    padding: 0.5rem;
    min-height: 120px;
    max-width: 110px;
    gap: 0.3rem;
    border-radius: 6px;
  }

  .product-image {
    height: 55px;
    border-radius: 4px;
  }

  .product-name {
    font-size: 0.75rem;
    line-height: 1.1;
    font-weight: 600;
  }

  .product-price {
    font-size: 0.8rem;
    margin-top: 0.15rem;
    font-weight: 700;
  }

  .product-stock {
    font-size: 0.65rem;
    padding: 1px 3px;
    border-radius: 3px;
  }
}
</style>
