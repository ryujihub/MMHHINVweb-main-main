<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-sync-alt"></i>
          Bulk Status Update
        </h3>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="selection-summary">
          <p><strong>{{ selectedCount }}</strong> orders will be updated</p>
          <div class="selected-orders-preview">
            <div v-for="order in previewOrders" :key="order.id" class="order-preview">
              <span class="order-id">#{{ order.id.slice(-6) }}</span>
              <span class="customer-name">{{ order.customer?.name || 'Unknown' }}</span>
              <span class="current-status" :class="order.status?.toLowerCase()">{{ order.status }}</span>
            </div>
            <div v-if="selectedCount > 3" class="more-orders">
              +{{ selectedCount - 3 }} more orders
            </div>
          </div>
        </div>

        <div class="status-selection">
          <label for="newStatus">New Status:</label>
          <div class="status-options">
            <label v-for="status in orderStatuses" :key="status" class="status-option">
              <input 
                type="radio" 
                :value="status" 
                v-model="selectedStatus"
                name="bulkStatus"
              >
              <span class="status-label" :class="status.toLowerCase()">{{ status }}</span>
            </label>
          </div>
        </div>

        <div class="reason-section">
          <label for="reason">Reason (Optional):</label>
          <textarea 
            v-model="reason" 
            placeholder="Enter reason for status change..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">Cancel</button>
        <button @click="confirmUpdate" :disabled="!selectedStatus" class="confirm-btn">
          <i class="fas fa-check"></i>
          Update {{ selectedCount }} Orders
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  selectedOrders: Array,
  orderStatuses: Array
})

const emit = defineEmits(['close', 'confirm'])

const selectedStatus = ref('')
const reason = ref('')

const selectedCount = computed(() => props.selectedOrders.length)
const previewOrders = computed(() => props.selectedOrders.slice(0, 3))

const closeModal = () => {
  selectedStatus.value = ''
  reason.value = ''
  emit('close')
}

const confirmUpdate = () => {
  if (!selectedStatus.value) return
  
  emit('confirm', {
    status: selectedStatus.value,
    reason: reason.value
  })
  closeModal()
}
</script>

<style scoped>
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

.modal-container {
  background: white;
  border-radius: 1rem;
  width: 95%;
  max-width: 650px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 1rem 1rem 0 0;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 2rem;
}

.selection-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
  border: 1px solid #bae6fd;
}

.selection-summary p {
  margin: 0 0 1rem 0;
  color: #1e40af;
  font-weight: 500;
}

.selected-orders-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.order-id {
  font-weight: 600;
  color: #374151;
}

.customer-name {
  flex: 1;
  color: #6b7280;
}

.current-status {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.current-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.current-status.processing {
  background: #dbeafe;
  color: #1e40af;
}

.current-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.current-status.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.more-orders {
  padding: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
}

.status-selection {
  margin-bottom: 1.5rem;
}

.status-selection label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.status-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.status-option:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.status-option input[type="radio"] {
  margin: 0;
}

.status-option input[type="radio"]:checked + .status-label {
  font-weight: 600;
}

.status-option:has(input:checked) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.status-label {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  font-weight: 500;
}

.status-label.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-label.processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-label.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-label.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.reason-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.reason-section textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  min-height: 100px;
}

.reason-section textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 1rem 1rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 1024px) {
  .modal-container {
    width: 90%;
    max-width: 600px;
  }

  .status-options {
    gap: 0.75rem;
  }

  .status-option {
    padding: 0.875rem;
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .selection-summary {
    padding: 0.875rem;
  }

  .order-preview {
    padding: 0.375rem;
    font-size: 0.8rem;
  }

  .status-options {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .status-option {
    padding: 0.875rem;
  }

  .reason-section textarea {
    padding: 0.875rem;
    font-size: 1rem;
  }

  .modal-footer {
    flex-direction: column;
    padding: 1.25rem;
    gap: 0.75rem;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
    justify-content: center;
    padding: 1rem;
    font-size: 1rem;
  }
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-container {
    width: 100%;
    margin: 0;
    max-height: 95vh;
    border-radius: 1rem 1rem 0 0;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .selection-summary {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .selection-summary p {
    font-size: 0.875rem;
  }

  .order-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .status-option {
    padding: 1rem;
    border-radius: 0.75rem;
  }

  .status-label {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }

  .reason-section textarea {
    padding: 1rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    min-height: 120px;
  }

  .modal-footer {
    padding: 1rem;
  }

  .cancel-btn,
  .confirm-btn {
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    min-height: 48px;
  }
}

@media (max-width: 480px) {
  .modal-container {
    height: 100vh;
    border-radius: 0;
    max-height: 100vh;
  }

  .modal-header {
    padding: 0.875rem;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .modal-header h3 {
    font-size: 0.95rem;
  }

  .modal-body {
    padding: 0.875rem;
    flex: 1;
    overflow-y: auto;
  }

  .selection-summary {
    padding: 0.625rem;
    font-size: 0.8rem;
  }

  .order-preview {
    padding: 0.375rem;
    font-size: 0.75rem;
  }

  .status-option {
    padding: 0.875rem;
  }

  .status-label {
    font-size: 0.75rem;
  }

  .reason-section label {
    font-size: 0.875rem;
  }

  .reason-section textarea {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 0.875rem;
  }

  .modal-footer {
    padding: 0.875rem;
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 2px solid #f3f4f6;
  }
}
</style>