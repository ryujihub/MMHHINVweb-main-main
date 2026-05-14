<template>
  <div class="order-management">
    <div class="page-header">
      <div class="header-top">
        <div class="header-title">
          <h1>
            <i class="fas fa-clipboard-list"></i>
            Order Management
          </h1>
          <p class="header-subtitle">Manage and process customer orders efficiently</p>
        </div>
        <div class="header-stats" v-if="orders.length > 0">
          <div class="stat-card">
            <span class="stat-number">{{ orders.length }}</span>
            <span class="stat-label">Total Orders</span>
          </div>
          <div class="stat-card" v-if="selectedOrders.length > 0">
            <span class="stat-number">{{ selectedOrders.length }}</span>
            <span class="stat-label">Selected</span>
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <div class="filters-section">
          <div class="filter-group">
            <label>Status:</label>
            <select v-model="statusFilter" class="filter-select">
              <option value="">All Status</option>
              <option v-for="status in orderStatuses" :key="status">
                {{ status }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>Period:</label>
            <select v-model="dateFilter" class="filter-select">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          <div class="filter-group custom-date-range" v-if="dateFilter === 'custom'">
            <label>From:</label>
            <input type="date" v-model="customDateFrom" class="filter-input" />
            <label>To:</label>
            <input type="date" v-model="customDateTo" class="filter-input" />
          </div>
          
          <div class="filter-group" v-if="isAdmin">
            <label>Staff:</label>
            <select v-model="staffFilter" class="filter-select">
              <option value="">All Staff</option>
              <option v-for="staff in staffList" :key="staff.id">
                {{ staff.username || staff.name || staff.email }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="actions-section">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search orders, customers..."
              class="search-input"
            >
          </div>
          
          <button @click="exportToDocx" class="export-btn">
            <i class="fas fa-file-word"></i>
            <span>Export All</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading && orders.length === 0" message="Loading orders..." overlay />
    
    <!-- Error State -->
    <ErrorAlert 
      v-if="error" 
      type="error" 
      title="Failed to load orders"
      :message="error"
      @dismiss="error = null"
    />

    <!-- Orders Display - Desktop Table / Mobile Cards -->
    <div v-if="!loading || orders.length > 0" class="orders-container">
      
      <!-- Desktop Table View -->
      <div class="orders-table desktop-view">
        <table>
          <thead>
            <tr>
              <th class="checkbox-col">
                <input 
                  type="checkbox" 
                  @change="toggleSelectAll" 
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected"
                >
              </th>
              <th @click="sort('id')">
                Order #
                <i class="fas" :class="getSortIcon('id')"></i>
              </th>
              <th @click="sort('createdAt')">
                Date
                <i class="fas" :class="getSortIcon('createdAt')"></i>
              </th>
              <th>Customer</th>
              <th>Items</th>
              <th @click="sort('total')">
                Total
                <i class="fas" :class="getSortIcon('total')"></i>
              </th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="sortedOrders.length === 0">
              <td colspan="9" class="no-orders-message">No orders found.</td>
            </tr>
            <tr v-for="order in sortedOrders" :key="order.id" :class="{ 'selected': selectedOrders.includes(order.id) }">
              <td class="checkbox-col">
                <input 
                  type="checkbox" 
                  :value="order.id" 
                  v-model="selectedOrders"
                >
              </td>
              <td>
                <span class="order-number">#{{ order.id.slice(-6) }}</span>
              </td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <div class="customer-info">
                  <span>{{ order.customer.name }}</span>
                  <span class="phone">{{ order.customer.phone }}</span>
                </div>
              </td>
              <td>
                <div class="items-summary">
                  {{ getItemsSummary(order.items) }}
                </div>
              </td>
              <td>₱{{ formatPrice(order.total) }}</td>
              <td>
                <select 
                  v-model="order.status"
                  @change="updateOrderStatus(order)"
                  :class="['status-select', order.status]"
                >
                  <option 
                    v-for="status in orderStatuses" 
                    :key="status"
                    :value="status"
                  >
                    {{ status }}
                  </option>
                </select>
              </td>
              <td>
                <select
                  v-if="isAdmin"
                  v-model="order.assignedTo"
                  @change="assignOrder(order)"
                  class="staff-select"
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="staff in staffList"
                    :key="staff.id"
                    :value="staff.id"
                  >
                    {{ staff.username || staff.name || staff.email }}
                  </option>
                </select>
                <span v-else>
                  {{ getStaffName(order.assignedTo) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button @click="viewOrder(order)" class="view-btn" title="View Order">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button @click="printOrder(order)" class="print-btn" title="Print Order">
                    <i class="fas fa-print"></i>
                  </button>
                  <button @click="exportSingleOrder(order)" class="export-single-btn" title="Export to DOCX">
                    <i class="fas fa-file-word"></i>
                  </button>
                  <button 
                    v-if="canCancelOrder(order)"
                    @click="cancelOrder(order)" 
                    class="cancel-btn"
                    title="Cancel Order"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                  <button 
                    v-if="isAdmin"
                    @click="deleteOrder(order)" 
                    class="delete-btn"
                    title="Delete Order"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="orders-cards mobile-view">
        <div v-if="sortedOrders.length === 0" class="no-orders-message">
          <i class="fas fa-clipboard-list"></i>
          <p>No orders found.</p>
        </div>
        
        <div 
          v-for="order in sortedOrders" 
          :key="order.id" 
          :class="['order-card', { 'selected': selectedOrders.includes(order.id) }]"
          @click="toggleOrderSelection(order.id)"
        >
          <div class="card-header">
            <div class="order-info">
              <div class="checkbox-wrapper">
                <input 
                  type="checkbox" 
                  :value="order.id" 
                  v-model="selectedOrders"
                  @click.stop
                >
              </div>
              <div class="order-details">
                <span class="order-number">#{{ order.id.slice(-6) }}</span>
                <span class="order-date">{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>
            <div class="order-total">₱{{ formatPrice(order.total) }}</div>
          </div>

          <div class="card-body">
            <div class="customer-section">
              <div class="customer-info">
                <i class="fas fa-user"></i>
                <div>
                  <span class="customer-name">{{ order.customer.name }}</span>
                  <span class="customer-phone">{{ order.customer.phone }}</span>
                </div>
              </div>
            </div>

            <div class="items-section">
              <i class="fas fa-box"></i>
              <span class="items-summary">{{ getItemsSummary(order.items) }}</span>
            </div>

            <div class="status-section">
              <div class="status-wrapper">
                <label>Status:</label>
                <select 
                  v-model="order.status"
                  @change="updateOrderStatus(order)"
                  :class="['status-select-mobile', order.status]"
                  @click.stop
                >
                  <option 
                    v-for="status in orderStatuses" 
                    :key="status"
                    :value="status"
                  >
                    {{ status }}
                  </option>
                </select>
              </div>

              <div class="staff-wrapper" v-if="isAdmin">
                <label>Assigned:</label>
                <select
                  v-model="order.assignedTo"
                  @change="assignOrder(order)"
                  class="staff-select-mobile"
                  @click.stop
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="staff in staffList"
                    :key="staff.id"
                    :value="staff.id"
                  >
                    {{ staff.username || staff.name || staff.email }}
                  </option>
                </select>
              </div>
              <div v-else class="staff-display">
                <label>Assigned:</label>
                <span>{{ getStaffName(order.assignedTo) }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <button @click="viewOrder(order); $event.stopPropagation()" class="action-btn view-btn">
              <i class="fas fa-eye"></i>
              <span>View</span>
            </button>
            <button @click="printOrder(order); $event.stopPropagation()" class="action-btn print-btn">
              <i class="fas fa-print"></i>
              <span>Print</span>
            </button>
            <button @click="exportSingleOrder(order); $event.stopPropagation()" class="action-btn export-btn">
              <i class="fas fa-file-word"></i>
              <span>Export</span>
            </button>
            <button 
              v-if="canCancelOrder(order)"
              @click="cancelOrder(order); $event.stopPropagation()" 
              class="action-btn cancel-btn"
            >
              <i class="fas fa-times"></i>
              <span>Cancel</span>
            </button>
            <button 
              v-if="isAdmin"
              @click="deleteOrder(order); $event.stopPropagation()" 
              class="action-btn delete-btn"
            >
              <i class="fas fa-trash"></i>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Order #{{ selectedOrder.id.slice(-6) }}</h2>
          <button @click="selectedOrder = null" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="order-details">
            <div class="detail-section">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> {{ selectedOrder.customer.name }}</p>
              <p><strong>Phone:</strong> {{ selectedOrder.customer.phone }}</p>
              <p><strong>Address:</strong> {{ selectedOrder.customer.address }}</p>
              <p><strong>Delivery:</strong> {{ selectedOrder.customer.deliveryOption }}</p>
              <p><strong>Payment:</strong> {{ selectedOrder.customer.paymentMethod }}</p>
            </div>

            <div class="detail-section">
              <h3>Order Items</h3>
              <div class="items-list">
                <div v-for="item in selectedOrder.items" :key="item.id" class="item">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-quantity">× {{ item.quantity }}</span>
                  <span class="item-price">₱{{ formatPrice(item.price * item.quantity) }}</span>
                </div>
              </div>

              <div class="order-summary">
                <div class="summary-line">
                  <span>Subtotal</span>
                  <span>₱{{ formatPrice(selectedOrder.subtotal) }}</span>
                </div>
                <div class="summary-line">
                  <span>Delivery Fee</span>
                  <span>₱{{ formatPrice(selectedOrder.deliveryFee) }}</span>
                </div>
                <div class="summary-line total">
                  <span>Total</span>
                  <span>₱{{ formatPrice(selectedOrder.total) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="order-history">
            <h3>Order History</h3>
            <div class="history-timeline">
              <div 
                v-for="(event, index) in selectedOrder.history" 
                :key="index"
                class="timeline-event"
              >
                <div class="event-icon">
                  <i :class="getEventIcon(event.type)"></i>
                </div>
                <div class="event-details">
                  <p class="event-description">{{ event.description }}</p>
                  <span class="event-time">
                    {{ formatDate(event.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Order Modal -->
    <ConfirmModal
      v-model:show="showCancelModal"
      title="Cancel Order"
      message="Are you sure you want to cancel this order?"
      confirm-text="Yes, Cancel Order"
      cancel-text="No, Keep Order"
      :show-input="true"
      input-label="Reason for Cancellation"
      input-placeholder="Please provide a reason..."
      @confirm="handleCancelConfirm"
    />

    <!-- Delete Order Modal -->
    <ConfirmModal
      v-model:show="showDeleteModal"
      title="Delete Order"
      message="Are you sure you want to permanently delete this order? This action cannot be undone."
      confirm-text="Yes, Delete Order"
      cancel-text="Cancel"
      @confirm="handleDeleteConfirm"
    />

    <!-- Bulk Delete Modal -->
    <ConfirmModal
      v-model:show="showBulkDeleteModal"
      title="Delete Selected Orders"
      :message="`Are you sure you want to permanently delete ${selectedOrders.length} orders? This action cannot be undone.`"
      confirm-text="Yes, Delete All"
      cancel-text="Cancel"
      @confirm="handleBulkDeleteConfirm"
    />

    <!-- Simple Bulk Panel -->
    <SimpleBulkPanel 
      :selectedOrders="selectedOrders"
      :isAdmin="isAdmin"
      @clearSelection="clearSelection"
      @updateStatus="openBulkStatusModal"
      @assignStaff="openBulkAssignModal"
      @exportSelected="exportSelectedOrders"
      @deleteSelected="openBulkDeleteModal"
    />

    <!-- Bulk Status Modal -->
    <BulkStatusModal
      :show="showBulkStatusModal"
      :selectedOrders="selectedOrdersData"
      :orderStatuses="orderStatuses"
      @close="showBulkStatusModal = false"
      @confirm="handleBulkStatusUpdate"
    />

    <!-- Bulk Assign Modal -->
    <BulkAssignModal
      :show="showBulkAssignModal"
      :selectedOrders="selectedOrdersData"
      :staffList="staffList"
      @close="showBulkAssignModal = false"
      @confirm="handleBulkStaffAssign"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useInventoryStore } from '../stores/inventoryStore'
import ConfirmModal from './ConfirmModal.vue'
import { format } from 'date-fns'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useToast } from 'vue-toastification'
import { exportOrdersToDocx, exportSingleOrderToDocx } from '../utils/docxExport'
import { 
  bulkOrderOperations
} from '../utils/orderEnhancements'
import { OrderFirebaseService, ErrorHandler, PerformanceMonitor } from '../utils/firebaseEnhancements'
import LoadingSpinner from './ui/LoadingSpinner.vue'
import ErrorAlert from './ui/ErrorAlert.vue'
import SimpleBulkPanel from './SimpleBulkPanel.vue'
import BulkStatusModal from './BulkStatusModal.vue'
import BulkAssignModal from './BulkAssignModal.vue'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const inventoryStore = useInventoryStore()
const toast = useToast()

// Constants
const orderStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled']

// Local state
const orders = ref([])
const selectedOrder = ref(null)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const orderToCancel = ref(null)
const orderToDelete = ref(null)
const staffList = ref([])
const statusFilter = ref('')
const dateFilter = ref('month')
const customDateFrom = ref('')
const customDateTo = ref('')
const staffFilter = ref('')
const searchQuery = ref('')
const sortBy = ref('createdAt')
const sortDesc = ref(true)
const loading = ref(false)
const error = ref(null)
const selectedOrders = ref([])
const showBulkStatusModal = ref(false)
const showBulkAssignModal = ref(false)
const showBulkDeleteModal = ref(false)

// Computed
const isAdmin = computed(() => authStore.isAdmin)

const selectedOrdersData = computed(() => {
  return orders.value.filter(order => selectedOrders.value.includes(order.id))
})

const isAllSelected = computed(() => {
  return sortedOrders.value.length > 0 && selectedOrders.value.length === sortedOrders.value.length
})

const isSomeSelected = computed(() => {
  return selectedOrders.value.length > 0 && selectedOrders.value.length < sortedOrders.value.length
})

const filteredOrders = computed(() => {
  let filtered = [...orders.value]

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  // Date filter
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Start of this week (Sunday)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  switch (dateFilter.value) {
    case 'today':
      filtered = filtered.filter(order => order.createdAt >= today)
      break
    case 'yesterday':
      filtered = filtered.filter(order => order.createdAt >= yesterday && order.createdAt < today)
      break
    case 'week':
      filtered = filtered.filter(order => order.createdAt >= weekStart)
      break
    case 'last7':
      filtered = filtered.filter(order => order.createdAt >= sevenDaysAgo)
      break
    case 'last30':
      filtered = filtered.filter(order => order.createdAt >= thirtyDaysAgo)
      break
    case 'month':
      filtered = filtered.filter(order => order.createdAt >= monthStart)
      break
    case 'custom':
      if (customDateFrom.value) {
        const from = new Date(customDateFrom.value)
        filtered = filtered.filter(order => order.createdAt >= from)
      }
      if (customDateTo.value) {
        const to = new Date(customDateTo.value)
        to.setHours(23, 59, 59, 999)
        filtered = filtered.filter(order => order.createdAt <= to)
      }
      break
    case 'all':
    default:
      // No date filtering — show all orders
      break
  }

  // Staff filter
  if (staffFilter.value) {
    filtered = filtered.filter(order => order.assignedTo === staffFilter.value)
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.customer.name.toLowerCase().includes(query) ||
      order.customer.phone.includes(query) ||
      order.id.includes(query)
    )
  }

  return filtered
})

const sortedOrders = computed(() => {
  return [...filteredOrders.value].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy.value) {
      case 'id':
        comparison = a.id.localeCompare(b.id)
        break
      case 'createdAt':
        comparison = a.createdAt - b.createdAt
        break
      case 'total':
        comparison = a.total - b.total
        break
      default:
        comparison = 0
    }

    return sortDesc.value ? -comparison : comparison
  })
})

// Methods
const fetchOrders = async () => {
  try {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    orders.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }))
  } catch (error) {
    console.error('Error fetching orders:', error)
  }
}

const fetchStaffList = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'staff'])
    )
    
    const snapshot = await getDocs(q)
    staffList.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error fetching staff list:', error)
  }
}

const formatDate = (date) => {
  return format(date, 'MMM d, yyyy h:mm a')
}

const formatPrice = (amount) => {
  return amount.toLocaleString('en-PH')
}

const getItemsSummary = (items) => {
  if (items.length === 0) return 'No items'
  if (items.length === 1) return `${items[0].name} × ${items[0].quantity}`
  return `${items[0].name} × ${items[0].quantity} + ${items.length - 1} more`
}

const sort = (field) => {
  if (sortBy.value === field) {
    sortDesc.value = !sortDesc.value
  } else {
    sortBy.value = field
    sortDesc.value = true
  }
}

const getSortIcon = (field) => {
  if (sortBy.value !== field) return 'fa-sort'
  return sortDesc.value ? 'fa-sort-down' : 'fa-sort-up'
}

const updateOrderStatus = async (order) => {
  try {
    const orderRef = doc(db, 'orders', order.id)
    await updateDoc(orderRef, {
      status: order.status,
      lastUpdated: serverTimestamp()
    })

    // Add to order history
    await addDoc(collection(db, `orders/${order.id}/history`), {
      type: 'status_change',
      description: `Order status changed to ${order.status}`,
      timestamp: serverTimestamp(),
      updatedBy: authStore.user.uid
    })
  } catch (error) {
    console.error('Error updating order status:', error)
  }
}

const assignOrder = async (order) => {
  try {
    const orderRef = doc(db, 'orders', order.id)
    await updateDoc(orderRef, {
      assignedTo: order.assignedTo,
      lastUpdated: serverTimestamp()
    })

    // Add to order history
    const staff = staffList.value.find(s => s.id === order.assignedTo)
    await addDoc(collection(db, `orders/${order.id}/history`), {
      type: 'assignment',
      description: staff ? 
        `Order assigned to ${staff.name}` : 
        'Order unassigned',
      timestamp: serverTimestamp(),
      updatedBy: authStore.user.uid
    })
  } catch (error) {
    console.error('Error assigning order:', error)
  }
}

const viewOrder = (order) => {
  selectedOrder.value = order
}

const printOrder = (order) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  
  // Generate receipt HTML
  const receiptHTML = generateReceiptHTML(order)
  
  // Write HTML to the new window
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

const generateReceiptHTML = (order) => {
  const currentDate = new Date().toLocaleString()
  const subtotal = order.subtotal || (order.total - (order.deliveryFee || 0))
  const deliveryFee = order.deliveryFee || 0
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - Order #${order.id.slice(-6)}</title>
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
        }
        
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-processing { background: #dbeafe; color: #1e40af; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        
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
          <span>#${order.id.slice(-6)}</span>
        </div>
        <div class="info-row">
          <span>Date:</span>
          <span>${formatDate(order.createdAt)}</span>
        </div>
        <div class="info-row">
          <span>Printed:</span>
          <span>${currentDate}</span>
        </div>
        <div class="info-row">
          <span>Status:</span>
          <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
        </div>
        ${order.assignedTo ? `
        <div class="info-row">
          <span>Staff:</span>
          <span>${getStaffName(order.assignedTo)}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="customer-section">
        <div class="section-title">Customer Information</div>
        <div class="info-row">
          <span>Name:</span>
          <span>${order.customer.name}</span>
        </div>
        <div class="info-row">
          <span>Phone:</span>
          <span>${order.customer.phone}</span>
        </div>
        ${order.customer.address ? `
        <div class="info-row">
          <span>Address:</span>
          <span>${order.customer.address}</span>
        </div>
        ` : ''}
        ${order.customer.deliveryOption ? `
        <div class="info-row">
          <span>Delivery:</span>
          <span>${order.customer.deliveryOption}</span>
        </div>
        ` : ''}
        ${order.customer.paymentMethod ? `
        <div class="info-row">
          <span>Payment:</span>
          <span>${order.customer.paymentMethod}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="items-section">
        <div class="section-title">Items Ordered</div>
        <div class="item-row" style="border-bottom: 1px solid #000; font-weight: bold; margin-bottom: 5px;">
          <span class="item-name">ITEM</span>
          <span class="item-qty">QTY</span>
          <span class="item-price">AMOUNT</span>
        </div>
        ${order.items.map(item => `
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
          <span>₱${formatPrice(subtotal)}</span>
        </div>
        ${deliveryFee > 0 ? `
        <div class="total-row">
          <span>Delivery Fee:</span>
          <span>₱${formatPrice(deliveryFee)}</span>
        </div>
        ` : ''}
        <div class="total-row final-total">
          <span>TOTAL AMOUNT:</span>
          <span>₱${formatPrice(order.total)}</span>
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

const canCancelOrder = (order) => {
  return order.status === 'Pending' || order.status === 'Processing'
}

const cancelOrder = (order) => {
  orderToCancel.value = order
  showCancelModal.value = true
}

const handleCancelConfirm = async (reason) => {
  if (!orderToCancel.value || !reason) {
    toast.error('Please provide a cancellation reason.')
    return
  }

  try {
    const orderId = orderToCancel.value?.id
    if (!orderId) {
      console.error('Invalid order ID')
      toast.error('Error: Invalid order ID')
      return
    }

    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledAt: serverTimestamp(),
      cancelledBy: authStore.user?.uid || 'system'
    })

    // Add to order history
    await addDoc(collection(db, `orders/${orderId}/history`), {
      type: 'cancellation',
      description: `Order cancelled: ${reason}`,
      timestamp: serverTimestamp(),
      updatedBy: authStore.user?.uid || 'system'
    })

    // Update local state
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'Cancelled'
      order.cancellationReason = reason
    }

    // Restore stock if it was previously deducted
    if (orderToCancel.value.items && orderToCancel.value.processed) {
      await inventoryStore.restoreStock(orderId, orderToCancel.value.items)
    }

    // Reset modal
    showCancelModal.value = false
    orderToCancel.value = null

    toast.success('Order cancelled and stock restored!')
  } catch (error) {
    console.error('Error cancelling order:', error)
    toast.error('Failed to cancel order. Please try again.')
  }
}

const deleteOrder = (order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!orderToDelete.value) return

  try {
    const orderId = orderToDelete.value.id
    
    // Restore stock if it was previously deducted
    if (orderToDelete.value.items && orderToDelete.value.processed) {
      await inventoryStore.restoreStock(orderId, orderToDelete.value.items)
    }

    await deleteDoc(doc(db, 'orders', orderId))

    // Remove from local state
    orders.value = orders.value.filter(o => o.id !== orderId)

    // Reset modal
    showDeleteModal.value = false
    orderToDelete.value = null

    toast.success('Order deleted and stock restored!')
  } catch (error) {
    console.error('Error deleting order:', error)
    toast.error('Failed to delete order. Please try again.')
  }
}

const openBulkDeleteModal = () => {
  showBulkDeleteModal.value = true
}

const handleBulkDeleteConfirm = async () => {
  if (selectedOrders.value.length === 0) return

  loading.value = true
  try {
    // Process each selected order for stock restoration and deletion
    for (const id of selectedOrders.value) {
      const order = orders.value.find(o => o.id === id)
      if (order && order.items && order.processed) {
        await inventoryStore.restoreStock(id, order.items)
      }
      await deleteDoc(doc(db, 'orders', id))
    }

    // Update local state
    orders.value = orders.value.filter(o => !selectedOrders.value.includes(o.id))
    selectedOrders.value = [] // Clear selection

    showBulkDeleteModal.value = false
    toast.success('Successfully deleted selected orders and restored stock!')
  } catch (error) {
    console.error('Error deleting multiple orders:', error)
    toast.error('Some orders could not be deleted. Please try again.')
  } finally {
    loading.value = false
  }
}

const getStaffName = (staffId) => {
  const staff = staffList.value.find(s => s.id === staffId)
  return staff ? staff.name : 'Unassigned'
}

const getEventIcon = (type) => {
  const icons = {
    'status_change': 'fas fa-sync',
    'assignment': 'fas fa-user',
    'cancellation': 'fas fa-ban',
    'default': 'fas fa-info-circle'
  }
  return icons[type] || icons.default
}

const exportToDocx = async () => {
  try {
    const ordersToExport = sortedOrders.value
    
    if (ordersToExport.length === 0) {
      toast.warning('No orders to export')
      return
    }

    const fileName = await exportOrdersToDocx(ordersToExport, {
      title: 'Metro Manila Hills Hardware - Order Report',
      includeCustomerDetails: true,
      includeSummary: true
    })
    
    toast.success(`Orders exported successfully as ${fileName}`)
  } catch (error) {
    console.error('Error exporting to DOCX:', error)
    toast.error('Failed to export orders. Please try again.')
  }
}

const exportSingleOrder = async (order) => {
  try {
    const fileName = await exportSingleOrderToDocx(order, {
      title: 'Metro Manila Hills Hardware - Order Details'
    })
    
    toast.success(`Order exported successfully as ${fileName}`)
  } catch (error) {
    console.error('Error exporting order to DOCX:', error)
    toast.error('Failed to export order. Please try again.')
  }
}

// Enhanced Order Management Functions
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedOrders.value = []
  } else {
    selectedOrders.value = sortedOrders.value.map(order => order.id)
  }
}







const clearSelection = () => {
  selectedOrders.value = []
}

const toggleOrderSelection = (orderId) => {
  const index = selectedOrders.value.indexOf(orderId)
  if (index > -1) {
    selectedOrders.value.splice(index, 1)
  } else {
    selectedOrders.value.push(orderId)
  }
}

const handleBulkOperationComplete = () => {
  clearSelection()
  fetchOrders() // Refresh orders after bulk operation
}

// Beautiful modal functions
const openBulkStatusModal = () => {
  showBulkStatusModal.value = true
}

const openBulkAssignModal = () => {
  if (staffList.value.length === 0) {
    toast.error('No staff members available')
    return
  }
  showBulkAssignModal.value = true
}

const handleBulkStatusUpdate = (data) => {
  updateBulkStatus(data.status, data.reason)
}

const handleBulkStaffAssign = (data) => {
  assignBulkStaff(data.staffId, data.notes)
}

const exportSelectedOrders = async () => {
  try {
    const selectedOrdersData = orders.value.filter(order => selectedOrders.value.includes(order.id))
    
    if (selectedOrdersData.length === 0) {
      toast.warning('No orders selected for export')
      return
    }

    const fileName = await exportOrdersToDocx(selectedOrdersData, {
      title: `Selected Orders Export (${selectedOrdersData.length} orders)`,
      includeCustomerDetails: true,
      includeSummary: true
    })
    
    toast.success(`${selectedOrdersData.length} orders exported as ${fileName}`)
    clearSelection()
  } catch (error) {
    console.error('Error exporting selected orders:', error)
    toast.error('Failed to export selected orders')
  }
}

const updateBulkStatus = async (newStatus, reason = '') => {
  try {
    toast.info(`Updating ${selectedOrders.value.length} orders to ${newStatus}...`)
    
    // Simulate bulk update - replace with actual Firebase batch operation
    for (const orderId of selectedOrders.value) {
      const order = orders.value.find(o => o.id === orderId)
      if (order) {
        order.status = newStatus
        if (reason) {
          order.statusChangeReason = reason
        }
      }
    }
    
    const reasonText = reason ? ` (Reason: ${reason})` : ''
    toast.success(`Successfully updated ${selectedOrders.value.length} orders to ${newStatus}${reasonText}`)
    clearSelection()
  } catch (error) {
    console.error('Error updating bulk status:', error)
    toast.error('Failed to update order status')
  }
}

const assignBulkStaff = async (staffId, notes = '') => {
  try {
    const staff = staffList.value.find(s => s.id === staffId)
    const staffName = staff ? (staff.username || staff.name || staff.email) : 'Unassigned'
    
    toast.info(`Assigning ${selectedOrders.value.length} orders to ${staffName}...`)
    
    // Simulate bulk assignment - replace with actual Firebase batch operation
    for (const orderId of selectedOrders.value) {
      const order = orders.value.find(o => o.id === orderId)
      if (order) {
        order.assignedTo = staffId || null
        if (notes) {
          order.assignmentNotes = notes
        }
      }
    }
    
    const notesText = notes ? ` (Notes: ${notes})` : ''
    toast.success(`Successfully assigned ${selectedOrders.value.length} orders to ${staffName}${notesText}`)
    clearSelection()
  } catch (error) {
    console.error('Error assigning bulk staff:', error)
    toast.error('Failed to assign orders to staff')
  }
}

const onHistoryUpdated = (historyData) => {
  // Handle history updates if needed
  console.log('Order history updated:', historyData)
}

// Enhanced fetch methods with error handling
const fetchOrdersEnhanced = async () => {
  const timer = PerformanceMonitor.startTimer('fetchOrders')
  
  try {
    loading.value = true
    error.value = null
    
    const result = await ErrorHandler.withErrorHandling(
      () => OrderFirebaseService.getOrdersWithFilters({
        status: statusFilter.value,
        assignedTo: staffFilter.value
      }),
      'fetch orders'
    )
    
    if (result.success) {
      orders.value = result.data
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
    toast.error(`Failed to load orders: ${err.message}`)
  } finally {
    loading.value = false
    timer.end()
  }
}

// Enhanced order history with Firebase service
const addOrderHistoryEnhanced = async (orderId, type, description, metadata = {}) => {
  try {
    const result = await OrderFirebaseService.addOrderHistory(
      orderId, 
      type, 
      description, 
      authStore.user?.uid || 'system',
      metadata
    )
    
    if (!result.success) {
      console.error('Failed to add order history:', result.error)
    }
  } catch (error) {
    console.error('Error adding order history:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchOrdersEnhanced(),
    fetchStaffList()
  ])
})
</script>

<style scoped>
.order-management {
  padding: 2.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  margin-bottom: 2.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}

.header-title h1 {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
  color: var(--text-primary);
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.header-title h1 i {
  color: var(--primary-color);
}

.header-subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin-top: 0.5rem;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  background: var(--background-secondary);
  padding: 1.25rem 2rem;
  border-radius: var(--radius-md);
  text-align: center;
  min-width: 120px;
}

.stat-number {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--primary-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-medium);
  flex-wrap: wrap;
}

.filters-section {
  display: flex;
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select, .filter-input {
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  color: var(--text-primary);
  background: white;
  min-width: 160px;
  transition: all 0.2s ease;
}

.filter-select:focus, .filter-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(67, 56, 202, 0.1);
  outline: none;
}

.custom-date-range {
  flex-direction: row;
  align-items: flex-end;
  gap: 1rem;
}

.custom-date-range label {
  margin-bottom: 0.5rem;
}

.actions-section {
  display: flex;
  gap: 1rem;
}

.search-input {
  padding: 0.75rem 1.25rem 0.75rem 3rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  width: 320px;
}

.export-btn {
  background: var(--success-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

/* Table Design */
.orders-container {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--background-secondary);
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

td {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-medium);
  color: var(--text-primary);
  font-size: 0.95rem;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: #f8fafc;
}

.order-number {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--primary-color);
}

.status-select {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.status-select.Pending { background: #fef3c7; color: #92400e; }
.status-select.Processing { background: #dbeafe; color: #1e40af; }
.status-select.Completed { background: #d1fae5; color: #065f46; }
.status-select.Cancelled { background: #fee2e2; color: #991b1b; }

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-medium);
  background: white;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.action-buttons button:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Modals */
.modal {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
}

.modal-content {
  border-radius: var(--radius-xl);
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header {
  padding: 2rem;
  background: var(--background-secondary);
}

.modal-body {
  padding: 2rem;
}

.detail-section h3 {
  font-size: 1.125rem;
  font-weight: 800;
  margin-bottom: 1.25rem;
  color: var(--primary-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .order-management { padding: 1rem; }
  .page-header { padding: 1.5rem; }
  .header-top { flex-direction: column; align-items: stretch; gap: 1.5rem; }
  .header-actions { flex-direction: column; align-items: stretch; }
  .filters-section { flex-direction: column; }
  .search-input { width: 100%; }
}
</style>
