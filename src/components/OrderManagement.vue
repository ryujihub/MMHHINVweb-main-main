<template>
  <div class="order-management">
    <div class="page-header">
      <h1>Order Management</h1>
      <div class="header-actions">
        <div class="filters">
          <select v-model="statusFilter">
            <option value="">All Status</option>
            <option v-for="status in orderStatuses" :key="status">
              {{ status }}
            </option>
          </select>
          <select v-model="dateFilter">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <select v-if="isAdmin" v-model="staffFilter">
            <option value="">All Staff</option>
            <option v-for="staff in staffList" :key="staff.id">
              {{ staff.name }}
            </option>
          </select>
        </div>
        <div class="search">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search orders..."
          >
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="orders-table">
      <table>
        <thead>
          <tr>
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
            <td colspan="8" class="no-orders-message">No orders found.</td>
          </tr>
          <tr v-for="order in sortedOrders" :key="order.id">
            <td>#{{ order.id.slice(-6) }}</td>
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
                  {{ staff.name }}
                </option>
              </select>
              <span v-else>
                {{ getStaffName(order.assignedTo) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="viewOrder(order)" class="view-btn">
                  <i class="fas fa-eye"></i>
                </button>
                <button @click="printOrder(order)" class="print-btn">
                  <i class="fas fa-print"></i>
                </button>
                <button 
                  v-if="canCancelOrder(order)"
                  @click="cancelOrder(order)" 
                  class="cancel-btn"
                >
                  <i class="fas fa-times"></i>
                </button>
                <button 
                  v-if="isAdmin"
                  @click="deleteOrder(order)" 
                  class="delete-btn"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
    <div v-if="showCancelModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Cancel Order</h2>
          <button @click="showCancelModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to cancel this order?</p>
          <div class="form-group">
            <label>Reason for Cancellation</label>
            <textarea 
              v-model="cancellationReason" 
              placeholder="Please provide a reason..."
              required
            ></textarea>
          </div>

          <div class="modal-actions">
            <button @click="showCancelModal = false" class="cancel-btn">
              No, Keep Order
            </button>
            <button @click="confirmCancelOrder" class="confirm-btn">
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Order Modal -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Delete Order</h2>
          <button @click="showDeleteModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <p>Are you sure you want to permanently delete this order?</p>
          <p>This action cannot be undone.</p>

          <div class="modal-actions">
            <button @click="showDeleteModal = false" class="cancel-btn">
              Cancel
            </button>
            <button @click="confirmDeleteOrder" class="confirm-btn">
              Yes, Delete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
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

const authStore = useAuthStore()

// Constants
const orderStatuses = ['Pending', 'Processing', 'Completed', 'Cancelled']

// Local state
const orders = ref([])
const selectedOrder = ref(null)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const cancellationReason = ref('')
const orderToCancel = ref(null)
const orderToDelete = ref(null)
const staffList = ref([])
const statusFilter = ref('')
const dateFilter = ref('today')
const staffFilter = ref('')
const searchQuery = ref('')
const sortBy = ref('createdAt')
const sortDesc = ref(true)

// Computed
const isAdmin = computed(() => authStore.isAdmin)

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

const confirmCancelOrder = async () => {
  if (!orderToCancel.value || !cancellationReason.value) {
    alert('Please provide a cancellation reason.')
    return
  }

  try {
    const orderId = orderToCancel.value?.id
    if (!orderId) {
      console.error('Invalid order ID')
      alert('Error: Invalid order ID')
      return
    }

    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      status: 'Cancelled',
      cancellationReason: cancellationReason.value,
      cancelledAt: serverTimestamp(),
      cancelledBy: authStore.user?.uid || 'system'
    })

    // Add to order history
    await addDoc(collection(db, `orders/${orderId}/history`), {
      type: 'cancellation',
      description: `Order cancelled: ${cancellationReason.value}`,
      timestamp: serverTimestamp(),
      updatedBy: authStore.user?.uid || 'system'
    })

    // Update local state
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'Cancelled'
      order.cancellationReason = cancellationReason.value
    }

    // Reset modal
    showCancelModal.value = false
    cancellationReason.value = ''
    orderToCancel.value = null
    
    alert('Order cancelled successfully!')
  } catch (error) {
    console.error('Error cancelling order:', error)
    alert('Failed to cancel order. Please try again.')
  }
}

const deleteOrder = (order) => {
  orderToDelete.value = order
  showDeleteModal.value = true
}

const confirmDeleteOrder = async () => {
  if (!orderToDelete.value) return

  try {
    const orderId = orderToDelete.value.id
    await deleteDoc(doc(db, 'orders', orderId))

    // Remove from local state
    orders.value = orders.value.filter(o => o.id !== orderId)

    // Reset modal
    showDeleteModal.value = false
    orderToDelete.value = null
    
    alert('Order deleted successfully!')
  } catch (error) {
    console.error('Error deleting order:', error)
    alert('Failed to delete order. Please try again.')
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

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchOrders(),
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
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filters select,
.search input {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.search {
  position: relative;
}

.search i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search input {
  padding-left: 2.5rem;
  width: 300px;
}

.orders-table {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: auto;
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

.cancel-btn {
  background: #fee2e2;
  color: #991b1b;
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

@media (max-width: 1024px) {
  .header-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .filters {
    width: 100%;
    overflow-x: auto;
  }

  .search {
    width: 100%;
  }

  .search input {
    width: 100%;
  }

  .order-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .order-management {
    padding: 1rem;
  }

  .orders-table {
    font-size: 0.875rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
