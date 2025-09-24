<template>
  <div class="order-processing">
    <div class="page-header">
      <h1>New Order</h1>
      <p class="subtitle">Create and process new orders</p>
    </div>

    <div class="order-container">
      <!-- Product Selection -->
      <section class="product-selection">
        <div class="toolbar">
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search products by name or category..."
              @input="filterProducts"
            />
          </div>

          <div class="category-filter">
            <select v-model="categoryFilter" @change="filterProducts" class="category-select">
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category">{{ category }}</option>
            </select>
          </div>
        </div>

        <div class="products-grid">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            :class="{ 'out-of-stock': product.currentStock === 0 }"
            @add-to-cart="addToCart"
          />
        </div>
      </section>

      <!-- Order Cart -->
      <aside class="order-cart">
        <div class="cart-header">
          <h2>Order Cart</h2>
          <div class="cart-actions">
            <button @click="clearCart" class="clear-btn" v-if="cart.length">Clear</button>
            <button class="details-btn" @click="showCustomerForm = !showCustomerForm">Customer Details</button>
          </div>
        </div>

        <div class="cart-items" v-if="cart.length">
          <div v-for="item in cart" :key="item.id" class="cart-item">
            <div class="item-left">
              <div class="item-thumb">📦</div>
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <div class="item-details">₱{{ formatPrice(item.price) }}</div>
              </div>
            </div>

            <div class="item-right">
              <div class="qty-controls">
                <button @click="updateCartQuantity(item, -1)">-</button>
                <span class="qty">{{ item.quantity }}</span>
                <button @click="updateCartQuantity(item, 1)">+</button>
              </div>
              <div class="item-total">₱{{ formatPrice(item.price * item.quantity) }}</div>
              <button @click="removeFromCart(item)" class="remove-btn">×</button>
            </div>
          </div>

          <div class="cart-summary">
            <div class="summary-line subtotal">
              <span>Subtotal</span>
              <span>₱{{ formatPrice(cartSubtotal) }}</span>
            </div>
            <div class="summary-line">
              <span>Delivery Fee</span>
              <span>₱{{ formatPrice(deliveryFee) }}</span>
            </div>
            <div class="summary-line total">
              <span>Total</span>
              <span>₱{{ formatPrice(cartTotal) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
        </div>

        <transition name="slide">
          <form v-if="showCustomerForm" @submit.prevent="processOrder" class="customer-form">
            <h3>Customer Details</h3>

            <div class="form-group">
              <label>Name</label>
              <input type="text" v-model="customerDetails.name" required placeholder="Customer name" />
            </div>

            <div class="form-group two-col">
              <div>
                <label>Phone</label>
                <input type="tel" v-model="customerDetails.phone" required placeholder="Contact number" />
              </div>
              <div>
                <label>Delivery Option</label>
                <select v-model="customerDetails.deliveryOption" required>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Address</label>
              <textarea v-model="customerDetails.address" required placeholder="Delivery address"></textarea>
            </div>

            <div class="form-group">
              <label>Payment Method</label>
              <select v-model="customerDetails.paymentMethod" required>
                <option value="cash">Cash on Delivery</option>
                <option value="gcash">GCash</option>
                <option value="counter">Pay at Counter</option>
              </select>
            </div>

            <button type="submit" class="submit-btn">Process Order</button>
          </form>
        </transition>
      </aside>
    </div>

    <div class="mobile-bar" v-if="cart.length">
      <div class="mobile-total">Total: ₱{{ formatPrice(cartTotal) }}</div>
      <button class="process-btn" @click="showCustomerForm = true">Checkout</button>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue'
import ProductCard from './ProductCard.vue'
import { useInventoryStore } from '../stores/inventoryStore'
import { collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuthStore } from '../stores/authStore'

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()

// Local state
const searchQuery = ref('')
const categoryFilter = ref('')
const cart = ref([])
const showCustomerForm = ref(false)
const customerDetails = ref({
  name: '',
  phone: '',
  address: '',
  deliveryOption: 'delivery',
  paymentMethod: 'cash'
})

// Constants
const deliveryFee = computed(() => 
  customerDetails.value.deliveryOption === 'delivery' ? 150 : 0
)

// Computed properties
const categories = computed(() => inventoryStore.categories)

const filteredProducts = computed(() => {
  let products = inventoryStore.inventory.map(p => ({
    ...p,
    orderQuantity: 1
  }))

  if (categoryFilter.value) {
    products = products.filter(p => p.category === categoryFilter.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query)
    )
  }

  return products
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const cartTotal = computed(() => cartSubtotal.value + deliveryFee.value)

// Methods
const formatPrice = (price) => {
  return price.toLocaleString('en-PH')
}

const addToCart = (product) => {
  const quantity = product.quantity || 1
  const existingItem = cart.value.find(item => item.id === product.id)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity
    })
  }

  // Reset order quantity
  product.orderQuantity = 1
}

const increment = (product) => {
  if (!product.orderQuantity) product.orderQuantity = 1
  if (product.orderQuantity < product.currentStock) product.orderQuantity++
}

const decrement = (product) => {
  if (!product.orderQuantity) product.orderQuantity = 1
  if (product.orderQuantity > 1) product.orderQuantity--
}

const updateCartQuantity = (item, delta) => {
  const idx = cart.value.findIndex(i => i.id === item.id)
  if (idx === -1) return
  const newQty = cart.value[idx].quantity + delta
  if (newQty <= 0) {
    cart.value.splice(idx, 1)
  } else {
    cart.value[idx].quantity = newQty
  }
}

const removeFromCart = (item) => {
  const index = cart.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    cart.value.splice(index, 1)
  }
}

const clearCart = () => {
  cart.value = []
  customerDetails.value = {
    name: '',
    phone: '',
    address: '',
    deliveryOption: 'delivery',
    paymentMethod: 'cash'
  }
}

const processOrder = async () => {
  try {
    const orderData = {
      items: cart.value,
      customer: customerDetails.value,
      subtotal: cartSubtotal.value,
      deliveryFee: deliveryFee.value,
      total: cartTotal.value,
      status: 'pending',
      createdAt: new Date(),
      createdBy: authStore.user?.uid || 'anonymous',
      processed: false
    }

  // Save order to Firestore
  const orderRef = await addDoc(collection(db, 'orders'), orderData)

  // Update inventory stock (pass order id for idempotency)
  await inventoryStore.processOrder(orderRef.id, cart.value)

  // Clear the cart after successful order
  cart.value = []

  // Show success message
  alert(`Order #${orderRef.id} has been created successfully!`)

    // Option to print receipt
    if (confirm('Would you like to print the order slip?')) {
      printOrderSlip(orderRef.id, orderData)
    }
  } catch (error) {
    console.error('Error processing order:', error)
    alert('Failed to process order. Please try again.')
  }
}

const printOrderSlip = (orderId, orderData) => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      alert('Please allow pop-ups for this site to print order slips.')
      return
    }

    // Generate receipt HTML
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${orderId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .customer {
            margin-bottom: 20px;
          }
          .item { 
            margin: 5px 0; 
            display: flex;
            justify-content: space-between;
          }
          .total { 
            margin-top: 20px; 
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .summary-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          @media print {
            body { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MMH Hardware</h1>
          <h2>Order Slip #${orderId}</h2>
          <p>${new Date().toLocaleString()}</p>
        </div>
        
        <div class="customer">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${orderData.customer.name}</p>
          <p><strong>Phone:</strong> ${orderData.customer.phone}</p>
          <p><strong>Address:</strong> ${orderData.customer.address}</p>
          <p><strong>Delivery:</strong> ${orderData.customer.deliveryOption}</p>
          <p><strong>Payment:</strong> ${orderData.customer.paymentMethod}</p>
        </div>

        <div class="items">
          <h3>Order Items:</h3>
          ${orderData.items.map(item => `
            <div class="item">
              <span>${item.name} (${item.quantity} × ₱${formatPrice(item.price)})</span>
              <span>₱${formatPrice(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>

        <div class="total">
          <div class="summary-line">
            <span>Subtotal:</span>
            <span>₱${formatPrice(orderData.subtotal)}</span>
          </div>
          <div class="summary-line">
            <span>Delivery Fee:</span>
            <span>₱${formatPrice(orderData.deliveryFee)}</span>
          </div>
          <div class="summary-line">
            <span><strong>Total:</strong></span>
            <span><strong>₱${formatPrice(orderData.total)}</strong></span>
          </div>
        </div>
      </body>
      </html>
    `

    // Write to the new window and print
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    
    // Ensure document is ready before printing
    printWindow.onload = () => {
      printWindow.print()
    }
    
    // Fallback for immediate print
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.print()
      }
    }, 500)
    
  } catch (error) {
    console.error('Error printing order slip:', error)
    alert('Error printing order slip. Please try again or save the order details manually.')
  }
}
</script>

<style scoped>
.order-processing {
  padding: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h1 {
  margin: 0 0 0.25rem 0;
}

.order-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
}

.product-selection {
  background: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 18px rgba(20, 20, 40, 0.04);
}

.toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
}

.search-bar input,
.search-bar select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #e6e9ef;
  border-radius: 8px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.order-cart { background:white; border-radius:12px; padding:1rem; box-shadow:0 6px 18px rgba(20,20,40,0.04); position:sticky; top:1rem }

.cart-header { display:flex; justify-content:space-between; align-items:center }
.cart-actions { display:flex; gap:0.5rem }
.clear-btn { border:1px solid #ef4444; color:#ef4444; background:white; padding:0.4rem 0.65rem; border-radius:8px }
.details-btn { background:#f3f4f6; border:none; padding:0.4rem 0.65rem; border-radius:8px }

.cart-item { display:flex; justify-content:space-between; gap:0.5rem; padding:0.6rem 0; border-bottom:1px solid #f1f5f9 }
.item-left { display:flex; gap:0.6rem; align-items:center }
.item-thumb { font-size:1.2rem }
.item-info h4 { margin:0; font-size:0.95rem }
.item-details { color:#6b7280; font-size:0.85rem }

.item-right { display:flex; align-items:center; gap:0.6rem }
.qty-controls { display:flex; align-items:center; gap:0.35rem }
.qty-controls button { padding:0.2rem 0.45rem; border-radius:8px; border:1px solid #e6e9ef; background:white }
.qty { min-width:26px; text-align:center }
.item-total { font-weight:600 }
.remove-btn { background:none; border:none; color:#ef4444; font-size:1.05rem }

.cart-summary { margin-top:0.8rem; padding-top:0.8rem; border-top:1px solid #f1f5f9 }
.summary-line { display:flex; justify-content:space-between; color:#6b7280; margin-bottom:0.45rem }
.summary-line.total { font-size:1.05rem; color:#111827; font-weight:700 }

.customer-form { margin-top:0.8rem }
.form-group { margin-bottom:0.65rem }
.form-group label { display:block; font-size:0.85rem; color:#374151; margin-bottom:0.25rem }
.form-group input, .form-group select, .form-group textarea { width:100%; padding:0.5rem; border:1px solid #e6e9ef; border-radius:8px }
.form-group.two-col { display:flex; gap:0.5rem }
.submit-btn { width:100%; padding:0.7rem; background:#0b63ff; color:white; border:none; border-radius:8px; margin-top:0.5rem }

.mobile-bar { display:none }

@media (max-width: 1024px) {
  .order-container { grid-template-columns: 1fr }
  .order-cart { position: static }
}

@media (max-width: 640px) {
  .products-grid { grid-template-columns: 1fr }
  .toolbar { flex-direction:column; align-items:stretch }
  .mobile-bar { display:flex; position:fixed; bottom:12px; left:12px; right:12px; gap:0.6rem; background:#ffffff; padding:0.6rem; border-radius:10px; box-shadow:0 8px 26px rgba(20,20,40,0.12); align-items:center; justify-content:space-between }
  .process-btn { background:#0b63ff; color:white; padding:0.5rem 0.8rem; border-radius:8px; border:none }
}

.slide-enter-active, .slide-leave-active { transition: all 220ms ease }
.slide-enter-from { transform: translateY(-6px); opacity:0 }
.slide-enter-to { transform: translateY(0); opacity:1 }
.slide-leave-from { opacity:1 }
.slide-leave-to { opacity:0; transform: translateY(-6px) }
</style>
