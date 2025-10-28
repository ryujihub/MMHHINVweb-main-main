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
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
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

    <!-- Simple Bulk Panel -->
    <SimpleBulkPanel 
      :selectedOrders="selectedOrders"
      @clearSelection="clearSelection"
      @updateStatus="openBulkStatusModal"
      @assignStaff="openBulkAssignModal"
      @exportSelected="exportSelectedOrders"
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
const dateFilter = ref('today')
const staffFilter = ref('')
const searchQuery = ref('')
const sortBy = ref('createdAt')
const sortDesc = ref(true)
const loading = ref(false)
const error = ref(null)
const selectedOrders = ref([])
const showBulkStatusModal = ref(false)
const showBulkAssignModal = ref(false)

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
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())

  switch (dateFilter.value) {
    case 'today':
      filtered = filtered.filter(order => order.createdAt >= today)
      break
    case 'week':
      filtered = filtered.filter(order => order.createdAt >= weekAgo)
      break
    case 'month':
      filtered = filtered.filter(order => order.createdAt >= monthAgo)
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
  // Implementation similar to OrderProcessing component
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

    // Reset modal
    showCancelModal.value = false
    orderToCancel.value = null

    toast.success('Order cancelled successfully!')
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
    await deleteDoc(doc(db, 'orders', orderId))

    // Remove from local state
    orders.value = orders.value.filter(o => o.id !== orderId)

    // Reset modal
    showDeleteModal.value = false
    orderToDelete.value = null

    toast.success('Order deleted successfully!')
  } catch (error) {
    console.error('Error deleting order:', error)
    toast.error('Failed to delete order. Please try again.')
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
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-title h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
}

.header-title h1 i {
  color: #3b82f6;
  font-size: 1.75rem;
}

.header-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 80px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
}

.filters-section {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  min-width: 140px;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.actions-section {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  z-index: 1;
}

.search-input {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  width: 280px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}

.export-btn:hover {
  background: linear-gradient(135deg, #047857, #065f46);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
}

.export-btn i {
  font-size: 1rem;
}

.orders-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.orders-table {
  overflow: auto;
}

/* Default: Desktop View */
.desktop-view {
  display: block !important;
}

.mobile-view {
  display: none !important;
}

/* Ensure desktop view on larger screens */
@media (min-width: 769px) {
  .desktop-view {
    display: block !important;
  }

  .mobile-view {
    display: none !important;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
}

th i {
  margin-left: 0.5rem;
}

td {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.customer-info {
  display: flex;
  flex-direction: column;
}

.phone {
  font-size: 0.875rem;
  color: #6b7280;
}

.items-summary {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-select {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.status-select.Pending {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.status-select.Processing {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

.status-select.Completed {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}

.status-select.Cancelled {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.staff-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
}

.view-btn {
  background: #e5e7eb;
  color: #374151;
}

.print-btn {
  background: #dbeafe;
  color: #1e40af;
}

.export-single-btn {
  background: #d1fae5;
  color: #059669;
}

.export-single-btn:hover {
  background: #a7f3d0;
}

.cancel-btn {
  background: #fee2e2;
  color: #991b1b;
}

.delete-btn {
  background: #fecaca;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fca5a5;
}

/* Enhanced Order Management Styles */
.checkbox-col {
  width: 40px;
  text-align: center;
}

.order-number {
  font-weight: 500;
}





.selected {
  background: #eff6ff;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
}

.modal-body {
  padding: 1.5rem;
}

.order-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.detail-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1f2937;
}

.items-list {
  margin: 1rem 0;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.item-quantity {
  color: #6b7280;
}

.order-summary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.summary-line.total {
  font-weight: 600;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.order-history {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #f3f4f6;
}

.history-timeline {
  margin-top: 1rem;
}

.timeline-event {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  position: relative;
}

.timeline-event:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 2.5rem;
  left: 0.85rem;
  bottom: -1rem;
  width: 2px;
  background: #e5e7eb;
}

.event-icon {
  width: 2rem;
  height: 2rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  z-index: 1;
}

.event-details {
  flex: 1;
}

.event-description {
  margin: 0;
  color: #1f2937;
}

.event-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-actions button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
}

.modal-actions .cancel-btn {
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
}

.modal-actions .confirm-btn {
  background: #ef4444;
  border: none;
  color: white;
}

/* Mobile Card Styles */
.orders-cards {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.order-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.order-card.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.order-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.checkbox-wrapper {
  margin-top: 0.125rem;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-number {
  font-weight: 600;
  font-size: 1.125rem;
  color: #1f2937;
}

.order-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.order-total {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-bottom: 1rem;
}

.customer-section,
.items-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.customer-section i,
.items-section i {
  width: 20px;
  color: #6b7280;
  font-size: 1rem;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.customer-info div {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.customer-name {
  font-weight: 500;
  color: #1f2937;
}

.customer-phone {
  font-size: 0.875rem;
  color: #6b7280;
}

.items-summary {
  color: #374151;
  font-size: 0.875rem;
}

.status-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-wrapper,
.staff-wrapper,
.staff-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-wrapper label,
.staff-wrapper label,
.staff-display label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  min-width: 70px;
}

.status-select-mobile,
.staff-select-mobile {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
}

.status-select-mobile.Pending {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}

.status-select-mobile.Processing {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}

.status-select-mobile.Completed {
  background: #d1fae5;
  color: #065f46;
  border-color: #6ee7b7;
}

.status-select-mobile.Cancelled {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.staff-display span {
  color: #374151;
  font-size: 0.875rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  justify-content: center;
  min-width: 80px;
}

.action-btn.view-btn {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.view-btn:hover {
  background: #e5e7eb;
}

.action-btn.print-btn {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn.print-btn:hover {
  background: #bfdbfe;
}

.action-btn.export-btn {
  background: #d1fae5;
  color: #059669;
}

.action-btn.export-btn:hover {
  background: #a7f3d0;
}

.action-btn.cancel-btn {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn.cancel-btn:hover {
  background: #fecaca;
}

.action-btn.delete-btn {
  background: #fecaca;
  color: #dc2626;
}

.action-btn.delete-btn:hover {
  background: #fca5a5;
}

.no-orders-message {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.no-orders-message i {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
  display: block;
}

.no-orders-message p {
  font-size: 1.125rem;
  margin: 0;
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 1200px) {
  .order-management {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
}

@media (max-width: 1024px) {
  .header-top {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }

  .header-stats {
    align-self: stretch;
    justify-content: center;
    flex-wrap: wrap;
  }

  .header-actions {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .filters-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .actions-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
    min-width: 200px;
  }

  .order-details {
    grid-template-columns: 1fr;
  }

  /* Table improvements for tablets */
  .orders-table {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 800px;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  /* Switch to mobile card layout */
  .desktop-view {
    display: none !important;
  }

  .mobile-view {
    display: block !important;
  }

  .orders-container {
    background: transparent;
    box-shadow: none;
  }

  .order-management {
    padding: 0.75rem;
  }

  .page-header {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .header-title h1 {
    font-size: 1.5rem;
  }

  .header-title h1 i {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.875rem;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
  }

  .actions-section {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 2.5rem;
    font-size: 1rem;
  }

  .export-btn {
    width: 100%;
    justify-content: center;
    padding: 0.875rem 1rem;
    font-size: 1rem;
  }

  .stat-card {
    flex: 1;
    min-width: 70px;
    padding: 0.75rem;
  }

  .stat-number {
    font-size: 1.125rem;
  }

  .stat-label {
    font-size: 0.625rem;
  }

  /* Enhanced table mobile view */
  .orders-table {
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  table {
    min-width: 900px;
  }

  th, td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .customer-info {
    min-width: 120px;
  }

  .customer-info .phone {
    font-size: 0.75rem;
  }

  .items-summary {
    max-width: 150px;
    font-size: 0.75rem;
  }

  .action-buttons {
    flex-direction: row;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .action-buttons button {
    padding: 0.5rem;
    font-size: 0.75rem;
    min-width: 32px;
    height: 32px;
  }

  /* Modal improvements for mobile */
  .modal-content {
    width: 95%;
    margin: 1rem;
    max-height: 85vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .order-details {
    gap: 1.5rem;
  }

  .detail-section h3 {
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .order-management {
    padding: 0.5rem;
  }

  .page-header {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  /* Mobile card optimizations */
  .orders-cards {
    padding: 0.5rem;
    gap: 0.75rem;
  }

  .order-card {
    padding: 0.875rem;
    border-radius: 0.75rem;
  }

  .card-header {
    margin-bottom: 0.875rem;
    padding-bottom: 0.625rem;
  }

  .order-number {
    font-size: 1rem;
  }

  .order-total {
    font-size: 1.125rem;
  }

  .card-body {
    gap: 0.75rem;
    margin-bottom: 0.875rem;
  }

  .customer-section,
  .items-section {
    gap: 0.625rem;
  }

  .status-section {
    gap: 0.625rem;
  }

  .status-wrapper,
  .staff-wrapper,
  .staff-display {
    gap: 0.625rem;
  }

  .status-wrapper label,
  .staff-wrapper label,
  .staff-display label {
    min-width: 60px;
    font-size: 0.8rem;
  }

  .card-actions {
    gap: 0.375rem;
    padding-top: 0.625rem;
  }

  .action-btn {
    padding: 0.625rem 0.5rem;
    font-size: 0.8rem;
    min-width: 70px;
  }

  .action-btn span {
    display: none;
  }

  .action-btn i {
    margin: 0;
  }

  .header-title h1 {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.8rem;
  }

  .header-stats {
    gap: 0.5rem;
  }

  .stat-card {
    padding: 0.5rem;
    min-width: 60px;
  }

  .stat-number {
    font-size: 1rem;
  }

  .stat-label {
    font-size: 0.6rem;
  }

  .filter-select {
    padding: 1rem;
    font-size: 1.1rem;
    border-radius: 0.75rem;
  }

  .search-input {
    padding: 1rem 1rem 1rem 3rem;
    font-size: 1.1rem;
    border-radius: 0.75rem;
  }

  .search-box i {
    left: 1.25rem;
    font-size: 1.1rem;
  }

  .export-btn {
    padding: 1rem;
    font-size: 1.1rem;
    border-radius: 0.75rem;
  }

  /* Ultra-mobile table view */
  table {
    min-width: 800px;
  }

  th, td {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .checkbox-col {
    width: 35px;
  }

  .order-number {
    font-size: 0.75rem;
  }

  .customer-info {
    min-width: 100px;
  }

  .items-summary {
    max-width: 120px;
    font-size: 0.7rem;
  }

  .status-select, .staff-select {
    padding: 0.375rem;
    font-size: 0.75rem;
    min-width: 80px;
  }

  .action-buttons button {
    padding: 0.375rem;
    font-size: 0.7rem;
    min-width: 28px;
    height: 28px;
  }

  /* Mobile modal full-screen approach */
  .modal {
    padding: 0.5rem;
  }

  .modal-content {
    width: 100%;
    height: 95vh;
    margin: 0;
    border-radius: 1rem 1rem 0 0;
  }

  .modal-header h2 {
    font-size: 1.125rem;
  }

  .timeline-event {
    padding: 0.75rem 0;
  }

  .event-icon {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.75rem;
  }

  .event-description {
    font-size: 0.875rem;
  }

  .event-time {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .order-management {
    padding: 0.25rem;
  }

  .page-header {
    padding: 0.5rem;
    border-radius: 0.75rem;
  }

  /* Ultra-mobile card optimizations */
  .orders-cards {
    padding: 0.25rem;
    gap: 0.5rem;
  }

  .order-card {
    padding: 0.75rem;
    border-radius: 0.625rem;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .order-info {
    width: 100%;
    justify-content: space-between;
  }

  .order-total {
    font-size: 1rem;
    align-self: flex-end;
  }

  .card-body {
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }

  .status-section {
    gap: 0.5rem;
  }

  .status-wrapper,
  .staff-wrapper,
  .staff-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
  }

  .status-wrapper label,
  .staff-wrapper label,
  .staff-display label {
    min-width: unset;
    font-size: 0.75rem;
  }

  .status-select-mobile,
  .staff-select-mobile {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
  }

  .card-actions {
    justify-content: space-between;
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.5rem;
    min-width: 44px;
    border-radius: 0.5rem;
  }

  .no-orders-message {
    padding: 2rem 1rem;
  }

  .no-orders-message i {
    font-size: 2rem;
  }

  .no-orders-message p {
    font-size: 1rem;
  }

  .header-title h1 {
    font-size: 1.125rem;
    gap: 0.5rem;
  }

  .header-title h1 i {
    font-size: 1rem;
  }

  .header-subtitle {
    font-size: 0.75rem;
  }

  /* Compact stats for very small screens */
  .header-stats {
    gap: 0.25rem;
  }

  .stat-card {
    padding: 0.375rem;
    min-width: 50px;
  }

  .stat-number {
    font-size: 0.875rem;
  }

  .stat-label {
    font-size: 0.5rem;
  }

  /* Touch-friendly form elements */
  .filter-select, .search-input, .export-btn {
    min-height: 48px;
    font-size: 16px; /* Prevents zoom on iOS */
  }

  /* Simplified table for tiny screens */
  .orders-table {
    font-size: 0.75rem;
  }

  table {
    min-width: 700px;
  }

  th, td {
    padding: 0.375rem 0.125rem;
    font-size: 0.7rem;
  }

  .no-orders-message {
    padding: 2rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
