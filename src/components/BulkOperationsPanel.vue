<template>
  <div class="bulk-operations-panel" :class="{ 'visible': selectedOrders.length > 0 }">
    <div class="bulk-panel-content">
      <div class="bulk-info">
        <div class="selection-count">
          <i class="fas fa-check-square"></i>
          <span>{{ selectedOrders.length }} order{{ selectedOrders.length > 1 ? 's' : '' }} selected</span>
        </div>
        <button @click="clearSelection" class="clear-selection-btn">
          <i class="fas fa-times"></i>
          Clear Selection
        </button>
      </div>

      <div class="bulk-actions">
        <div class="action-group">
          <label>Quick Actions:</label>
          <div class="quick-actions">
            <button 
              @click="openBulkModal('status')" 
              class="bulk-action-btn status"
              :disabled="processing"
            >
              <i class="fas fa-sync-alt"></i>
              Update Status
            </button>
            <button 
              @click="openBulkModal('assign')" 
              class="bulk-action-btn assign"
              :disabled="processing"
            >
              <i class="fas fa-user-tag"></i>
              Assign Staff
            </button>
            <button 
              @click="openBulkModal('export')" 
              class="bulk-action-btn export"
              :disabled="processing"
            >
              <i class="fas fa-file-export"></i>
              Export Selected
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Operation Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click="closeBulkModal">
      <div class="bulk-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i :class="getModalIcon(bulkOperation)"></i>
            {{ getModalTitle(bulkOperation) }}
          </h3>
          <button @click="closeBulkModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="operation-summary">
            <p>
              <strong>{{ selectedOrders.length }}</strong> orders will be affected by this operation.
            </p>
            <div class="affected-orders">
              <div class="orders-preview">
                <div 
                  v-for="order in selectedOrdersData.slice(0, 3)" 
                  :key="order.id"
                  class="order-preview-item"
                >
                  <span class="order-id">#{{ order.id.slice(-6) }}</span>
                  <span class="order-customer">{{ order.customer?.name || 'Unknown' }}</span>
                  <span class="order-status" :class="order.status?.toLowerCase()">
                    {{ order.status }}
                  </span>
                </div>
                <div v-if="selectedOrders.length > 3" class="more-orders">
                  +{{ selectedOrders.length - 3 }} more orders
                </div>
              </div>
            </div>
          </div>

          <!-- Status Update Form -->
          <form v-if="bulkOperation === 'status'" @submit.prevent="executeBulkOperation">
            <div class="form-group">
              <label for="newStatus">New Status</label>
              <select id="newStatus" v-model="bulkData.status" required class="form-select">
                <option value="">Select new status</option>
                <option v-for="status in orderStatuses" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="statusReason">Reason (Optional)</label>
              <textarea 
                id="statusReason"
                v-model="bulkData.reason" 
                placeholder="Reason for status change..."
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
          </form>

          <!-- Staff Assignment Form -->
          <form v-if="bulkOperation === 'assign'" @submit.prevent="executeBulkOperation">
            <div class="form-group">
              <label for="assignStaff">Assign to Staff</label>
              <select id="assignStaff" v-model="bulkData.staffId" required class="form-select">
                <option value="">Select staff member</option>
                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                  {{ staff.username || staff.name || staff.email }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="assignmentNotes">Assignment Notes (Optional)</label>
              <textarea 
                id="assignmentNotes"
                v-model="bulkData.notes" 
                placeholder="Special instructions or notes..."
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>
          </form>

          <!-- Export Options -->
          <div v-if="bulkOperation === 'export'" class="export-options">
            <div class="form-group">
              <label>Export Format</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" v-model="bulkData.format" value="docx" checked>
                  <span class="radio-label">
                    <i class="fas fa-file-word"></i>
                    Microsoft Word (DOCX)
                  </span>
                </label>
                <label class="radio-option">
                  <input type="radio" v-model="bulkData.format" value="csv">
                  <span class="radio-label">
                    <i class="fas fa-file-csv"></i>
                    Comma Separated Values (CSV)
                  </span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="bulkData.includeHistory">
                Include order history in export
              </label>
            </div>
          </div>

          <!-- Progress Display -->
          <div v-if="processing" class="operation-progress">
            <ProgressBar 
              :current="progress.completed"
              :total="progress.total"
              :errors="progress.errors"
              :label="progress.message"
              :variant="progress.errors > 0 ? 'warning' : 'primary'"
            />
            <div class="progress-details">
              <div v-if="progress.currentOrder" class="current-operation">
                Processing: #{{ progress.currentOrder.slice(-6) }}
              </div>
              <div v-if="progress.errors > 0" class="error-summary">
                {{ progress.errors }} operation{{ progress.errors > 1 ? 's' : '' }} failed
              </div>
            </div>
          </div>

          <!-- Results Display -->
          <div v-if="operationResults" class="operation-results">
            <div class="results-summary" :class="operationResults.success ? 'success' : 'error'">
              <i :class="operationResults.success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
              <span>
                {{ operationResults.success ? 'Operation Completed' : 'Operation Failed' }}
              </span>
            </div>
            
            <div class="results-details">
              <div v-if="operationResults.results?.success?.length > 0" class="success-items">
                <h4>
                  <i class="fas fa-check text-green-600"></i>
                  Successfully processed ({{ operationResults.results.success.length }})
                </h4>
                <div class="result-list">
                  <span 
                    v-for="orderId in operationResults.results.success.slice(0, 5)" 
                    :key="orderId"
                    class="result-item success"
                  >
                    #{{ orderId.slice(-6) }}
                  </span>
                  <span v-if="operationResults.results.success.length > 5" class="more-items">
                    +{{ operationResults.results.success.length - 5 }} more
                  </span>
                </div>
              </div>

              <div v-if="operationResults.results?.failed?.length > 0" class="failed-items">
                <h4>
                  <i class="fas fa-times text-red-600"></i>
                  Failed to process ({{ operationResults.results.failed.length }})
                </h4>
                <div class="result-list">
                  <div 
                    v-for="failure in operationResults.results.failed.slice(0, 3)" 
                    :key="failure.orderId"
                    class="result-item failed"
                  >
                    <span>#{{ failure.orderId.slice(-6) }}</span>
                    <span class="error-reason">{{ failure.error }}</span>
                  </div>
                  <span v-if="operationResults.results.failed.length > 3" class="more-items">
                    +{{ operationResults.results.failed.length - 3 }} more failures
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            v-if="!processing && !operationResults" 
            @click="closeBulkModal" 
            class="cancel-btn"
          >
            Cancel
          </button>
          <button 
            v-if="!processing && !operationResults" 
            @click="executeBulkOperation" 
            class="confirm-btn"
            :disabled="!isFormValid"
          >
            <i :class="getModalIcon(bulkOperation)"></i>
            {{ getConfirmText(bulkOperation) }}
          </button>
          <button 
            v-if="operationResults" 
            @click="closeBulkModal" 
            class="done-btn"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { OrderFirebaseService, ErrorHandler } from '../utils/firebaseEnhancements'
import { exportOrdersToDocx } from '../utils/docxExport'
import ProgressBar from './ui/ProgressBar.vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  selectedOrders: {
    type: Array,
    required: true
  },
  selectedOrdersData: {
    type: Array,
    required: true
  },
  orderStatuses: {
    type: Array,
    required: true
  },
  staffList: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['clearSelection', 'operationComplete'])

const toast = useToast()

// State
const showBulkModal = ref(false)
const bulkOperation = ref('')
const processing = ref(false)
const operationResults = ref(null)
const bulkData = ref({})
const progress = ref({
  completed: 0,
  total: 0,
  errors: 0,
  message: '',
  currentOrder: null
})

// Computed
const isFormValid = computed(() => {
  switch (bulkOperation.value) {
    case 'status':
      return !!bulkData.value.status
    case 'assign':
      return !!bulkData.value.staffId
    case 'export':
      return !!bulkData.value.format
    default:
      return false
  }
})

// Methods
const clearSelection = () => {
  emit('clearSelection')
}

const openBulkModal = (operation) => {
  bulkOperation.value = operation
  bulkData.value = getDefaultBulkData(operation)
  operationResults.value = null
  showBulkModal.value = true
}

const closeBulkModal = () => {
  if (processing.value) return
  showBulkModal.value = false
  bulkOperation.value = ''
  bulkData.value = {}
  operationResults.value = null
}

const getDefaultBulkData = (operation) => {
  switch (operation) {
    case 'status':
      return { status: '', reason: '' }
    case 'assign':
      return { staffId: '', notes: '' }
    case 'export':
      return { format: 'docx', includeHistory: false }
    default:
      return {}
  }
}

const executeBulkOperation = async () => {
  if (!isFormValid.value || processing.value) return

  processing.value = true
  progress.value = {
    completed: 0,
    total: props.selectedOrders.length,
    errors: 0,
    message: getProgressMessage(bulkOperation.value),
    currentOrder: null
  }

  try {
    let result

    switch (bulkOperation.value) {
      case 'status':
        result = await executeBulkStatusUpdate()
        break
      case 'assign':
        result = await executeBulkAssignment()
        break
      case 'export':
        result = await executeBulkExport()
        break
      default:
        throw new Error('Unknown bulk operation')
    }

    operationResults.value = result
    
    if (result.success) {
      toast.success(`Bulk ${bulkOperation.value} completed successfully`)
      emit('operationComplete')
    } else {
      toast.error(`Bulk ${bulkOperation.value} failed: ${result.error}`)
    }
  } catch (error) {
    console.error('Bulk operation error:', error)
    operationResults.value = {
      success: false,
      error: error.message
    }
    toast.error(`Bulk operation failed: ${error.message}`)
  } finally {
    processing.value = false
  }
}

const executeBulkStatusUpdate = async () => {
  const updates = {
    status: bulkData.value.status
  }

  if (bulkData.value.reason) {
    updates.statusChangeReason = bulkData.value.reason
  }

  return await ErrorHandler.withErrorHandling(
    () => OrderFirebaseService.bulkUpdateOrders(
      props.selectedOrders,
      updates,
      'current-user-id' // This should come from auth store
    ),
    'bulk status update'
  )
}

const executeBulkAssignment = async () => {
  const updates = {
    assignedTo: bulkData.value.staffId
  }

  if (bulkData.value.notes) {
    updates.assignmentNotes = bulkData.value.notes
  }

  return await ErrorHandler.withErrorHandling(
    () => OrderFirebaseService.bulkUpdateOrders(
      props.selectedOrders,
      updates,
      'current-user-id' // This should come from auth store
    ),
    'bulk assignment'
  )
}

const executeBulkExport = async () => {
  try {
    if (bulkData.value.format === 'docx') {
      const fileName = await exportOrdersToDocx(props.selectedOrdersData, {
        title: 'Bulk Export - Selected Orders',
        includeCustomerDetails: true,
        includeSummary: true
      })
      
      return {
        success: true,
        message: `Orders exported as ${fileName}`,
        results: {
          success: props.selectedOrders,
          failed: []
        }
      }
    } else if (bulkData.value.format === 'csv') {
      // Implement CSV export
      const csvContent = generateOrdersCSV(props.selectedOrdersData)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      
      return {
        success: true,
        message: 'Orders exported as CSV',
        results: {
          success: props.selectedOrders,
          failed: []
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

const generateOrdersCSV = (orders) => {
  const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Assigned To']
  const rows = orders.map(order => [
    order.id.slice(-6),
    order.createdAt ? order.createdAt.toLocaleDateString() : '',
    order.customer?.name || '',
    order.items?.length || 0,
    order.total || 0,
    order.status || '',
    order.assignedTo || ''
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Utility methods
const getModalIcon = (operation) => {
  const icons = {
    status: 'fas fa-sync-alt',
    assign: 'fas fa-user-tag',
    export: 'fas fa-file-export'
  }
  return icons[operation] || 'fas fa-cog'
}

const getModalTitle = (operation) => {
  const titles = {
    status: 'Bulk Status Update',
    assign: 'Bulk Staff Assignment',
    export: 'Bulk Export Orders'
  }
  return titles[operation] || 'Bulk Operation'
}

const getConfirmText = (operation) => {
  const texts = {
    status: 'Update Status',
    assign: 'Assign Staff',
    export: 'Export Orders'
  }
  return texts[operation] || 'Execute'
}

const getProgressMessage = (operation) => {
  const messages = {
    status: 'Updating order statuses...',
    assign: 'Assigning orders to staff...',
    export: 'Exporting orders...'
  }
  return messages[operation] || 'Processing...'
}

// Watch for progress updates
watch(() => progress.value.completed, (newVal) => {
  if (newVal > 0 && newVal < progress.value.total) {
    const currentOrderId = props.selectedOrders[newVal - 1]
    progress.value.currentOrder = currentOrderId
  }
})
</script>

<style scoped>
.bulk-operations-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 2px solid #3b82f6;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
}

.bulk-operations-panel.visible {
  transform: translateY(0);
}

.bulk-panel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selection-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #1f2937;
}

.selection-count i {
  color: #3b82f6;
}

.clear-selection-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.clear-selection-btn:hover {
  background: #e5e7eb;
}

.bulk-actions {
  display: flex;
  gap: 2rem;
}

.action-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.quick-actions {
  display: flex;
  gap: 0.5rem;
}

.bulk-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.bulk-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-action-btn.status {
  background: #dbeafe;
  color: #1e40af;
}

.bulk-action-btn.status:hover:not(:disabled) {
  background: #bfdbfe;
}

.bulk-action-btn.assign {
  background: #e0e7ff;
  color: #3730a3;
}

.bulk-action-btn.assign:hover:not(:disabled) {
  background: #c7d2fe;
}

.bulk-action-btn.export {
  background: #d1fae5;
  color: #065f46;
}

.bulk-action-btn.export:hover:not(:disabled) {
  background: #a7f3d0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.bulk-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0.75rem 0.75rem 0 0;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.operation-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
}

.affected-orders {
  margin-top: 1rem;
}

.orders-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.order-preview-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.order-id {
  font-weight: 500;
  color: #1f2937;
}

.order-customer {
  color: #6b7280;
}

.order-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.order-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.order-status.processing {
  background: #dbeafe;
  color: #1e40af;
}

.order-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.order-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.more-orders {
  padding: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-select, .form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.radio-option input[type="radio"] {
  margin: 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.export-options .form-group:last-child label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.operation-progress {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.progress-details {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.current-operation {
  color: #374151;
  font-weight: 500;
}

.error-summary {
  color: #dc2626;
  margin-top: 0.5rem;
}

.operation-results {
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
}

.results-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.results-summary.success {
  color: #065f46;
  background: #d1fae5;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.results-summary.error {
  color: #991b1b;
  background: #fee2e2;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.results-details h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0 0.5rem 0;
  font-size: 0.875rem;
}

.result-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.result-item {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.result-item.success {
  background: #d1fae5;
  color: #065f46;
}

.result-item.failed {
  background: #fee2e2;
  color: #991b1b;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-reason {
  font-size: 0.7rem;
  opacity: 0.8;
}

.more-items {
  padding: 0.25rem 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.cancel-btn, .confirm-btn, .done-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.cancel-btn:hover {
  background: #f9fafb;
}

.confirm-btn {
  background: #3b82f6;
  border: none;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #2563eb;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.done-btn {
  background: #10b981;
  border: none;
  color: white;
}

.done-btn:hover {
  background: #059669;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .bulk-panel-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .bulk-actions {
    width: 100%;
    justify-content: center;
  }

  .quick-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .bulk-modal {
    width: 95%;
    margin: 1rem;
  }

  .modal-header, .modal-body, .modal-footer {
    padding: 1rem;
  }

  .orders-preview {
    flex-direction: column;
  }

  .radio-group {
    gap: 0.5rem;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>