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
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
  aspect-ratio: 1 / 1;
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
</style>
