<template>
  <div class="product-card" @click="addToCart">
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
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.3rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
  min-height: 80px;
  max-width: 120px;
}

.product-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
  border-color: #3b82f6;
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
  color: #2563eb;
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
    padding: 0.4rem;
    min-height: 70px;
    max-width: 100px;
    gap: 0.2rem;
  }

  .product-name {
    font-size: 0.7rem;
    line-height: 1.1;
  }

  .product-price {
    font-size: 0.8rem;
    margin-top: 0.15rem;
  }

  .product-stock {
    font-size: 0.6rem;
    padding: 1px 3px;
  }
}

@media (max-width: 480px) {
  .product-card {
    padding: 0.35rem;
    min-height: 60px;
    max-width: 90px;
    gap: 0.15rem;
  }

  .product-name {
    font-size: 0.65rem;
    line-height: 1;
  }

  .product-price {
    font-size: 0.75rem;
    margin-top: 0.1rem;
  }

  .product-stock {
    font-size: 0.55rem;
    padding: 0.5px 2px;
  }
}
</style>
