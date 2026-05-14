<template>
  <div class="order-processing">
    <div class="page-header">
      <div class="header-content">
        <h1>New Order</h1>
        <p class="subtitle">Create and process new orders</p>
      </div>
      <div class="check-in-status" v-if="authStore.user">
        <div class="status-indicator" :class="{ 'checked-in': isCheckedIn, 'checked-out': !isCheckedIn }">
          <i :class="isCheckedIn ? 'fas fa-user-check' : 'fas fa-user-clock'"></i>
          <span>{{ isCheckedIn ? 'Checked In' : 'Checked Out' }}</span>
        </div>
        <div v-if="!isCheckedIn" class="check-in-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>You must check in to process orders</span>
        </div>
      </div>
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
            <div class="category-select-wrapper">
              <i class="fas fa-th-large"></i>
              <select v-model="categoryFilter" @change="filterProducts" class="category-select">
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category">{{ category }}</option>
              </select>
              <i class="fas fa-chevron-down select-arrow"></i>
            </div>
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
          <div class="cart-title">
            <h2>Order Cart</h2>
            <span class="cart-count" v-if="cart.length">{{ cart.length }} item{{ cart.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="cart-actions">
            <button @click="clearCart" class="clear-btn" v-if="cart.length">
              <i class="fas fa-trash"></i>
              Clear
            </button>
            <button class="details-btn" @click="showCustomerForm = !showCustomerForm">
              <i class="fas fa-user"></i>
              Customer Details
            </button>
          </div>
        </div>

        <!-- Cart Content Container -->
        <div class="cart-content">
          <!-- Cart Items Section -->
          <div class="cart-items-section">
            <div class="cart-items" v-if="cart.length">
              <div v-for="item in cart" :key="item.id" class="cart-item">
                <div class="item-left">
                  <div class="item-thumb">
                    <img :src="item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMEMyNi4wNzUgMTAgMjAgMTYuNzUgMjAgMjVDMjAgMTYuNzUgMTMuOTI1IDEwIDIwIDEwWiIgZmlsbD0iIzlDQTNBRiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjI1IiByPSIyIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo='" :alt="item.name" />
                  </div>
                  <div class="item-info">
                    <h4>{{ item.name }}</h4>
                    <div class="item-details">₱{{ formatPrice(item.price) }} each</div>
                  </div>
                </div>

                <div class="item-center">
                  <div class="qty-controls">
                    <button @click="updateCartQuantity(item, -1)" class="qty-btn">-</button>
                    <span class="qty">{{ item.quantity }}</span>
                    <button @click="updateCartQuantity(item, 1)" class="qty-btn">+</button>
                  </div>
                </div>

                <div class="item-right">
                  <div class="item-total">₱{{ formatPrice(item.price * item.quantity) }}</div>
                  <button @click="removeFromCart(item)" class="remove-btn">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-cart">
              <div class="empty-cart-icon">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <h3>Your cart is empty</h3>
              <p>Add some products to get started</p>
            </div>
          </div>

          <!-- Cart Summary & Checkout -->
          <div class="cart-checkout-section" v-if="cart.length">
            <div class="cart-summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal ({{ cart.length }} items)</span>
                <span>₱{{ formatPrice(cartSubtotal) }}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Fee</span>
                <span>₱{{ formatPrice(deliveryFee) }}</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Total</span>
                <span>₱{{ formatPrice(cartTotal) }}</span>
              </div>
            </div>

            <div class="checkout-section">
              <button
                v-if="!showCustomerForm"
                @click="showCustomerForm = true"
                class="proceed-btn"
              >
                <i class="fas fa-arrow-right"></i>
                Proceed to Checkout
              </button>

              <transition name="slide">
                <form v-if="showCustomerForm" @submit.prevent="processOrder" class="customer-form">
                  <h3>Customer Information</h3>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Customer Name</label>
                      <input type="text" v-model="customerDetails.name" required placeholder="Enter customer name" />
                    </div>
                  </div>

                  <div class="form-row two-col">
                    <div class="form-group">
                      <label>Phone Number</label>
                      <input type="tel" v-model="customerDetails.phone" required placeholder="Contact number" />
                    </div>
                    <div class="form-group">
                      <label>Payment Method</label>
                      <select v-model="customerDetails.paymentMethod" required>
                        <option value="counter">Pay at Counter</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Delivery Option</label>
                      <div class="delivery-options">
                        <label class="delivery-option">
                          <input type="radio" v-model="customerDetails.deliveryOption" value="delivery" />
                          <span>Delivery</span>
                        </label>
                        <label class="delivery-option">
                          <input type="radio" v-model="customerDetails.deliveryOption" value="pickup" />
                          <span>Pickup</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="form-row" v-if="customerDetails.deliveryOption === 'delivery'">
                    <div class="form-group">
                      <label>Delivery Address</label>
                      <textarea v-model="customerDetails.address" required placeholder="Enter delivery address"></textarea>
                    </div>
                  </div>

                  <div class="form-actions">
                    <button type="button" @click="showCustomerForm = false" class="cancel-btn">
                      <i class="fas fa-arrow-left"></i>
                      Back to Cart
                    </button>
                    <button type="submit" class="submit-btn" :disabled="!isCheckedIn">
                      <i class="fas fa-check"></i>
                      {{ isCheckedIn ? 'Process Order' : 'Check In Required' }}
                    </button>
                  </div>
                </form>
              </transition>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Confirm Modal for Print -->
    <ConfirmModal
      v-model:show="showPrintConfirm"
      title="Print Order Slip"
      message="Would you like to print the order slip?"
      confirm-text="Yes, Print"
      cancel-text="No, Thanks"
      @confirm="handlePrintConfirm"
    />
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import ProductCard from './ProductCard.vue'
import ConfirmModal from './ConfirmModal.vue'
import { useInventoryStore } from '../stores/inventoryStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useCheckInOutStore } from '../stores/checkInOutStore'
import { collection, addDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useAuthStore } from '../stores/authStore'
import { useToast } from 'vue-toastification'

const inventoryStore = useInventoryStore()
const settingsStore = useSettingsStore()
const checkInOutStore = useCheckInOutStore()
const authStore = useAuthStore()
const toast = useToast()

// Local state
const searchQuery = ref('')
const categoryFilter = ref('')
const cart = ref([])
const showCustomerForm = ref(false)
const showPrintConfirm = ref(false)
const customerDetails = ref({
  name: '',
  phone: '',
  address: '',
  deliveryOption: 'delivery',
  paymentMethod: 'cash'
})
const pendingOrderData = ref(null)

// Constants
const deliveryFee = computed(() => {
  if (customerDetails.value.deliveryOption === 'pickup') {
    return settingsStore.currentPickupFee
  }
  return settingsStore.currentDeliveryFee
})

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

  if (searchQuery.value && searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query))
    )
  }

  return products
})

const cartSubtotal = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const cartTotal = computed(() => cartSubtotal.value + deliveryFee.value)

// Check-in status
const isCheckedIn = computed(() => checkInOutStore.isCheckedIn)
const canAccessOrderProcess = computed(() => checkInOutStore.canAccessOrderProcess)

// Methods
const formatPrice = (price) => {
  return price.toLocaleString('en-PH')
}

const filterProducts = () => {
  // This function is called on search input
  // The actual filtering is handled by the computed property filteredProducts
  // No additional logic needed as computed property reacts to searchQuery changes
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
      quantity: quantity,
      image: product.image
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
  // Check if user is checked in
  if (!isCheckedIn.value) {
    toast.error('You must check in before processing orders. Please check in from the dashboard.')
    return
  }

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
      assignedTo: authStore.user?.uid || 'anonymous',
      processed: false
    }

    // Save order to Firestore
    const orderRef = await addDoc(collection(db, 'orders'), orderData)

    // Update inventory stock (pass order id for idempotency)
    await inventoryStore.processOrder(orderRef.id, cart.value)

    // Clear the cart after successful order
    cart.value = []

    // Show success message
    toast.success(`Order #${orderRef.id} has been created successfully!`)

    // Store order data for potential printing
    pendingOrderData.value = { id: orderRef.id, ...orderData }

    // Show print confirmation modal
    showPrintConfirm.value = true
  } catch (error) {
    console.error('Error processing order:', error)
    toast.error('Failed to process order. Please try again.')
  }
}

const printOrderSlip = (orderId, orderData) => {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (!printWindow) {
      toast.error('Please allow pop-ups for this site to print order slips.')
      return
    }

    // Generate professional receipt HTML
    const receiptHTML = generateReceiptHTML(orderId, orderData)

    // Write to the new window and print
    printWindow.document.write(receiptHTML)
    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }

  } catch (error) {
    console.error('Error printing order slip:', error)
    toast.error('Error printing order slip. Please try again or save the order details manually.')
  }
}

const generateReceiptHTML = (orderId, orderData) => {
  const currentDate = new Date().toLocaleString()
  const orderDate = orderData.createdAt ? new Date(orderData.createdAt).toLocaleString() : currentDate
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Order #${orderId.slice(-6)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .company-info {
          font-size: 10px;
          margin-bottom: 3px;
        }
        
        .receipt-title {
          font-size: 14px;
          font-weight: bold;
          margin-top: 10px;
        }
        
        .order-info {
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .customer-section {
          margin-bottom: 15px;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 5px;
          text-transform: uppercase;
        }
        
        .items-section {
          margin-bottom: 15px;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          padding: 2px 0;
        }
        
        .item-name {
          flex: 1;
          margin-right: 10px;
        }
        
        .item-qty {
          margin-right: 10px;
          min-width: 30px;
          text-align: center;
        }
        
        .item-price {
          min-width: 60px;
          text-align: right;
        }
        
        .totals-section {
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 15px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        
        .final-total {
          border-top: 1px solid #000;
          padding-top: 5px;
          margin-top: 5px;
          font-weight: bold;
          font-size: 14px;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          background: #fef3c7;
          color: #92400e;
        }
        
        @media print {
          body { padding: 0; }
          .receipt-header { page-break-inside: avoid; }
          .totals-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div class="company-name">${settingsStore.settings.companyInfo?.name || 'METRO MANILA HILLS HARDWARE'}</div>
        <div class="company-info">${settingsStore.settings.companyInfo?.description || 'Hardware & Construction Supplies'}</div>
        <div class="company-info">📍 ${settingsStore.settings.companyInfo?.address || 'Metro Manila Hills, Philippines'}</div>
        <div class="company-info">📞 Contact: ${settingsStore.settings.companyInfo?.phone || '+63 XXX XXX XXXX'}</div>
        <div class="receipt-title">SALES RECEIPT</div>
      </div>
      
      <div class="order-info">
        <div class="info-row">
          <span>Receipt #:</span>
          <span>#${orderId.slice(-6)}</span>
        </div>
        <div class="info-row">
          <span>Date:</span>
          <span>${orderDate}</span>
        </div>
        <div class="info-row">
          <span>Printed:</span>
          <span>${currentDate}</span>
        </div>
        <div class="info-row">
          <span>Status:</span>
          <span class="status-badge">${orderData.status || 'Pending'}</span>
        </div>
        <div class="info-row">
          <span>Staff:</span>
          <span>${authStore.user?.displayName || authStore.user?.email || 'Staff'}</span>
        </div>
      </div>
      
      <div class="customer-section">
        <div class="section-title">Customer Information</div>
        <div class="info-row">
          <span>Name:</span>
          <span>${orderData.customer.name}</span>
        </div>
        <div class="info-row">
          <span>Phone:</span>
          <span>${orderData.customer.phone}</span>
        </div>
        ${orderData.customer.address ? `
        <div class="info-row">
          <span>Address:</span>
          <span>${orderData.customer.address}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span>Delivery:</span>
          <span>${orderData.customer.deliveryOption}</span>
        </div>
        <div class="info-row">
          <span>Payment:</span>
          <span>${orderData.customer.paymentMethod}</span>
        </div>
      </div>
      
      <div class="items-section">
        <div class="section-title">Items Ordered</div>
        <div class="item-row" style="border-bottom: 1px solid #000; font-weight: bold; margin-bottom: 5px;">
          <span class="item-name">ITEM</span>
          <span class="item-qty">QTY</span>
          <span class="item-price">AMOUNT</span>
        </div>
        ${orderData.items.map(item => `
        <div class="item-row">
          <span class="item-name">${item.name}</span>
          <span class="item-qty">×${item.quantity}</span>
          <span class="item-price">₱${formatPrice(item.price * item.quantity)}</span>
        </div>
        `).join('')}
      </div>
      
      <div class="totals-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₱${formatPrice(orderData.subtotal)}</span>
        </div>
        <div class="total-row">
          <span>Delivery Fee:</span>
          <span>₱${formatPrice(orderData.deliveryFee)}</span>
        </div>
        <div class="total-row final-total">
          <span>TOTAL AMOUNT:</span>
          <span>₱${formatPrice(orderData.total)}</span>
        </div>
      </div>
      
      <div class="receipt-footer">
        <div>Thank you for your business!</div>
        <div>Please keep this receipt for your records</div>
        <div style="margin-top: 10px;">
          For inquiries, please contact us at the number above
        </div>
        <div style="margin-top: 5px; font-size: 8px;">
          Generated by Metro Manila Hills Hardware Order Management System
        </div>
      </div>
    </body>
    </html>
  `
}

const handlePrintConfirm = () => {
  if (pendingOrderData.value) {
    printOrderSlip(pendingOrderData.value.id, pendingOrderData.value)
    pendingOrderData.value = null
  }
}

// Initialize check-in status
onMounted(async () => {
  // Check-in status is now initialized in authStore
})
</script>

<style scoped>
.order-processing {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.header-content .subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.check-in-status {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
}

.status-indicator.checked-in {
  background: #dcfce7;
  color: #166534;
}

.status-indicator.checked-out {
  background: #fef2f2;
  color: #991b1b;
}

.check-in-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  border: 1px solid #f59e0b;
}

.submit-btn:disabled,
.process-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #9ca3af !important;
}

.order-container {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 2rem;
  align-items: start;
}

/* Product Selection Panel */
.product-selection {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-bar {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  color: var(--text-tertiary);
}

.search-bar input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s;
}

.search-bar input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  outline: none;
}

.category-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  min-width: 160px;
  height: 44px;
  cursor: pointer;
}

.category-select-wrapper i:first-child {
  color: var(--primary-color);
  margin-right: 0.5rem;
}

.category-select {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
}

.select-arrow {
  color: var(--text-tertiary);
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

/* Order Cart Panel */
.order-cart {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 90px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-medium);
}

.cart-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.cart-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cart-count {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-weight: 600;
}

.cart-actions {
  display: flex;
  gap: 0.5rem;
}

.clear-btn, .details-btn {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-medium);
  background: white;
}

.clear-btn {
  color: var(--error-color);
  border-color: var(--error-color);
}

.clear-btn:hover {
  background: var(--error-color);
  color: white;
}

.details-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Cart Items */
.cart-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: var(--background-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  gap: 1rem;
  transition: all 0.2s;
}

.cart-item:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-sm);
}

.item-left {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.item-thumb {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
  border: 1px solid var(--border-medium);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.item-info { min-width: 0; flex: 1; }

.item-info h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details {
  color: var(--text-tertiary);
  font-size: 0.8rem;
  margin-top: 0.15rem;
}

.item-center {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: 0;
  background: white;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  overflow: hidden;
}

.qty-controls button {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.qty-controls button:hover {
  background: var(--primary-color);
  color: white;
}

.qty {
  min-width: 36px;
  text-align: center;
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.item-total {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 1rem;
  min-width: 70px;
  text-align: right;
}

.remove-btn {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid var(--border-medium);
  color: var(--text-tertiary);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.remove-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

/* Cart Summary */
.cart-summary {
  background: var(--background-secondary);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  border: 1px solid var(--border-medium);
}

.cart-summary h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.summary-row.total {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  padding-top: 0.75rem;
  border-top: 2px solid var(--border-medium);
  margin-top: 0.5rem;
}

.summary-divider {
  height: 1px;
  background: var(--border-medium);
  margin: 0.5rem 0;
}

/* Checkout & Process Button */
.checkout-section { width: 100%; }

.proceed-btn {
  width: 100%;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.proceed-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
}

/* Customer Form */
.customer-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
}

.customer-form h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
}

.form-row { margin-bottom: 1rem; }

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group { margin-bottom: 0; }

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  outline: none;
}

/* Delivery Options */
.delivery-options {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  transition: all 0.15s;
}

.delivery-option:hover {
  border-color: var(--primary-color);
  background: rgba(79, 70, 229, 0.05);
}

.delivery-option input[type="radio"] { width: 16px; height: 16px; }
.delivery-option span { font-size: 0.9rem; font-weight: 500; }

/* Form Actions */
.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-medium);
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

.submit-btn {
  flex: 2;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.submit-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Empty Cart */
.empty-cart {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-tertiary);
  background: var(--background-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-medium);
}

.empty-cart-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.empty-cart-icon i { font-size: 1.75rem; color: var(--text-tertiary); }
.empty-cart h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; }
.empty-cart p { font-size: 0.85rem; margin: 0; }

/* Mobile bottom bar */
.mobile-bar { display: none; }

/* Slide transitions */
.slide-enter-active, .slide-leave-active { transition: all 220ms ease; }
.slide-enter-from { transform: translateY(-6px); opacity: 0; }
.slide-enter-to { transform: translateY(0); opacity: 1; }
.slide-leave-from { opacity: 1; }
.slide-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── RESPONSIVE BREAKPOINTS ── */

/* Tablet */
@media (max-width: 1024px) {
  .order-container {
    grid-template-columns: 1fr;
  }
  .order-cart {
    position: static;
  }
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}

/* Phone */
@media (max-width: 768px) {
  .order-processing { padding: 1rem; }
  .header-content h1 { font-size: 1.5rem; }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  .search-bar input {
    font-size: 16px; /* prevents iOS zoom */
    padding: 0.85rem 1rem 0.85rem 2.5rem;
  }
  .category-select-wrapper {
    height: 48px;
    min-width: auto;
    width: 100%;
  }
  .category-select { font-size: 16px; }
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 0.75rem;
  }
  .order-cart { padding: 1rem; }
  .cart-actions { flex-wrap: wrap; }
  .form-row.two-col { grid-template-columns: 1fr; }
  .delivery-options { flex-direction: column; gap: 0.5rem; }
  .delivery-option {
    padding: 0.75rem 1rem;
    min-height: 48px;
  }
  .form-group input,
  .form-group select,
  .form-group textarea {
    font-size: 16px;
    padding: 0.85rem 1rem;
    min-height: 48px;
  }
  .proceed-btn, .submit-btn, .cancel-btn {
    min-height: 52px;
    font-size: 1rem;
  }
}

/* Small phone */
@media (max-width: 480px) {
  .order-processing { padding: 0.5rem; }
  .header-content h1 { font-size: 1.25rem; }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .check-in-status { align-items: flex-start; }
  .product-selection { padding: 0.75rem; }
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
  }
  .order-cart { padding: 0.75rem; }
  /* Cart items stack */
  .cart-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  .item-center { justify-content: center; }
  .item-right { justify-content: space-between; }
  .item-total { min-width: auto; text-align: left; }
  .qty-controls button { width: 44px; height: 44px; }
  .qty { min-width: 44px; font-size: 1.1rem; }
  .form-actions { flex-direction: column; }
  .cancel-btn, .submit-btn { flex: none; width: 100%; }
}

/* Very small phone */
@media (max-width: 360px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }
  .header-content h1 { font-size: 1.1rem; }
  .cart-header h2 { font-size: 1rem; }
  .empty-cart { padding: 2rem 1rem; }
}

</style>
