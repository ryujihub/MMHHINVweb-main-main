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
  padding: var(--space-6);
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
  min-height: 100vh;
  position: relative;
}

.order-processing::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  margin: 0 0 0.25rem 0;
  color: #1a202c;
  font-size: 1.75rem;
  font-weight: 600;
}

.header-content .subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
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
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
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
  border-radius: 8px;
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
  gap: var(--space-8);
  align-items: start;
  max-width: 1400px;
  margin: 0 auto;
}

.product-selection {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.product-selection::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.product-selection:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-color);
}

.product-selection:hover::before {
  transform: scaleX(1);
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
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--surface-primary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.search-bar input:focus,
.search-bar select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.category-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  min-width: 120px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.category-select-wrapper:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
}

.category-select-wrapper:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.category-select-wrapper i:first-child {
  color: var(--accent-color);
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.category-select {
  border: none;
  outline: none;
  background: transparent;
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.category-select option {
  padding: 0.4rem;
}

.select-arrow {
  color: #9ca3af;
  margin-left: 0.5rem;
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.category-select-wrapper:hover .select-arrow {
  color: var(--primary-color);
}

.category-select:focus + .select-arrow {
  transform: translateY(1px);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.order-cart {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  position: sticky;
  top: var(--space-6);
  transition: all var(--transition-normal);
}

.order-cart:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-color);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border-primary);
}

.cart-header h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.cart-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cart-count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.cart-actions {
  display: flex;
  gap: var(--space-3);
}

.clear-btn {
  border: 1px solid var(--error-color);
  color: var(--error-color);
  background: var(--surface-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clear-btn:hover {
  background: var(--error-color);
  color: white;
  transform: translateY(-1px);
}

.details-btn {
  background: var(--surface-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.details-btn:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  transform: translateY(-1px);
}

.cart-item {
  display: flex;
  align-items: center;
  padding: var(--space-4);
  margin-bottom: var(--space-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-fast);
  gap: var(--space-4);
}

.cart-item:hover {
  background: var(--surface-hover);
  border-color: var(--accent-color);
  transform: translateX(2px);
  box-shadow: var(--shadow-sm);
}

.cart-item:last-child {
  margin-bottom: 0;
}

.item-left {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  flex: 1;
  min-width: 0;
}

.item-thumb {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-xs);
  flex-shrink: 0;
}

.item-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.item-info {
  min-width: 0;
  flex: 1;
}

.item-info h4 {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--space-1);
}

.item-center {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 70px;
  flex-shrink: 0;
}

.item-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  width: 120px;
  flex-shrink: 0;
}

.qty-controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--surface-primary);
  border-radius: var(--radius-sm);
  padding: 0px;
  border: 1px solid var(--border-primary);
}

.qty-controls button {
  padding: 6px 10px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--border-primary);
  background: var(--surface-primary);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
}

.qty-controls button:hover {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  transform: scale(1.05);
}

.qty {
  min-width: 40px;
  text-align: center;
  font-weight: var(--font-medium);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.item-total {
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  font-size: var(--font-size-lg);
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  background: none;
  border: 1px solid var(--error-color);
  color: var(--error-color);
  font-size: var(--font-size-lg);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: var(--error-color);
  color: white;
  transform: scale(1.1);
}

.cart-summary {
  margin-top: var(--space-6);
  padding: var(--space-5);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  font-size: var(--font-size-sm);
}

.summary-line.total {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-primary);
  margin-top: var(--space-3);
}

.customer-form {
  margin-top: var(--space-6);
  padding: var(--space-6);
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-md);
}

.customer-form h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.customer-form h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
  border-radius: var(--radius-sm);
}

.form-group {
  margin-bottom: var(--space-5);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  font-weight: var(--font-medium);
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: var(--surface-primary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input::placeholder, .form-group textarea::placeholder {
  color: var(--text-muted);
}

.form-group.two-col {
  display: flex;
  gap: var(--space-4);
}

.submit-btn {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-medium);
  margin-top: var(--space-5);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.submit-btn:hover {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-color));
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(0);
}

.mobile-bar { display:none }

@media (max-width: 1024px) {
  .order-container { grid-template-columns: 1fr }
  .order-cart { position: static }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 0.5rem;
  }
  .toolbar { flex-direction:column; align-items:stretch }
  .mobile-bar { display:flex; position:fixed; bottom:12px; left:12px; right:12px; gap:0.6rem; background:#ffffff; padding:0.6rem; border-radius:10px; box-shadow:0 8px 26px rgba(20,20,40,0.12); align-items:center; justify-content:space-between }
  .process-btn { background:var(--accent-color); color:white; padding:0.5rem 0.8rem; border-radius:8px; border:none }

  /* Mobile cart item layout */
  .cart-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
    min-height: auto;
  }

  .item-left {
    gap: var(--space-2);
  }

  .item-center {
    justify-content: center;
  }

  .item-right {
    justify-content: space-between;
    gap: var(--space-2);
  }

  .item-total {
    min-width: auto;
    text-align: left;
  }
}

.slide-enter-active, .slide-leave-active { transition: all 220ms ease }
.slide-enter-from { transform: translateY(-6px); opacity:0 }
.slide-enter-to { transform: translateY(0); opacity:1 }
.slide-leave-from { opacity:1 }
.slide-leave-to { opacity:0; transform: translateY(-6px) }

/* Enhanced Cart Layout */
.cart-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.cart-items-section {
  flex: 1;
}

.cart-checkout-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cart-summary {
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-sm);
}

.cart-summary h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-summary h3::before {
  content: '';
  width: 3px;
  height: 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
  border-radius: var(--radius-sm);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.summary-row.total {
  font-size: var(--font-size-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-primary);
  margin-top: var(--space-3);
}

.summary-divider {
  height: 1px;
  background: var(--border-primary);
  margin: var(--space-3) 0;
}

.checkout-section {
  width: 100%;
}

.proceed-btn {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.proceed-btn:hover {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-color));
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.proceed-btn i {
  font-size: var(--font-size-sm);
}

/* Enhanced Empty Cart State */
.empty-cart {
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  background: var(--surface-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
}

.empty-cart-icon {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: var(--surface-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-2);
}

.empty-cart-icon i {
  font-size: 2.5rem;
  color: var(--text-muted);
  opacity: 0.6;
}

.empty-cart h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-cart p {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin: 0;
}

/* Enhanced Form Styling */
.form-row {
  margin-bottom: var(--space-5);
}

.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.delivery-options {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.delivery-option:hover {
  background: var(--surface-hover);
}

.delivery-option input[type="radio"] {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.delivery-option span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border-primary);
}

.cancel-btn {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.cancel-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
  transform: translateY(-1px);
}

.cancel-btn i {
  font-size: var(--font-size-sm);
}
</style>
