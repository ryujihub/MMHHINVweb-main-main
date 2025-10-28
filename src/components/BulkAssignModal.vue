<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="fas fa-user-tag"></i>
          Bulk Staff Assignment
        </h3>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="selection-summary">
          <p><strong>{{ selectedCount }}</strong> orders will be assigned</p>
          <div class="selected-orders-preview">
            <div v-for="order in previewOrders" :key="order.id" class="order-preview">
              <span class="order-id">#{{ order.id.slice(-6) }}</span>
              <span class="customer-name">{{ order.customer?.name || 'Unknown' }}</span>
              <span class="current-staff">{{ getCurrentStaffName(order.assignedTo) }}</span>
            </div>
            <div v-if="selectedCount > 3" class="more-orders">
              +{{ selectedCount - 3 }} more orders
            </div>
          </div>
        </div>

        <div class="staff-selection">
          <label>Assign to Staff:</label>
          <div class="staff-options">
            <label class="staff-option">
              <input 
                type="radio" 
                value="" 
                v-model="selectedStaff"
                name="bulkStaff"
              >
              <div class="staff-info">
                <span class="staff-name">Unassigned</span>
                <span class="staff-role">Remove assignment</span>
              </div>
            </label>
            <label v-for="staff in staffList" :key="staff.id" class="staff-option">
              <input 
                type="radio" 
                :value="staff.id" 
                v-model="selectedStaff"
                name="bulkStaff"
              >
              <div class="staff-info">
                <span class="staff-name">{{ staff.username || staff.name || staff.email }}</span>
                <span class="staff-role">{{ staff.role || 'Staff' }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="notes-section">
          <label for="notes">Assignment Notes (Optional):</label>
          <textarea 
            v-model="notes" 
            placeholder="Add any special instructions or notes..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">Cancel</button>
        <button @click="confirmAssignment" :disabled="selectedStaff === null" class="confirm-btn">
          <i class="fas fa-check"></i>
          Assign {{ selectedCount }} Orders
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
  staffList: Array
})

const emit = defineEmits(['close', 'confirm'])

const selectedStaff = ref(null)
const notes = ref('')

const selectedCount = computed(() => props.selectedOrders.length)
const previewOrders = computed(() => props.selectedOrders.slice(0, 3))

const getCurrentStaffName = (staffId) => {
  if (!staffId) return 'Unassigned'
  const staff = props.staffList.find(s => s.id === staffId)
  return staff ? (staff.username || staff.name || staff.email) : 'Unknown'
}

const closeModal = () => {
  selectedStaff.value = null
  notes.value = ''
  emit('close')
}

const confirmAssignment = () => {
  if (selectedStaff.value === null) return
  
  emit('confirm', {
    staffId: selectedStaff.value,
    notes: notes.value
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
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
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
  background: #f5f3ff;
  border-radius: 0.5rem;
  border: 1px solid #d8b4fe;
}

.selection-summary p {
  margin: 0 0 1rem 0;
  color: #7c3aed;
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

.current-staff {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #374151;
}

.more-orders {
  padding: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
  font-size: 0.875rem;
}

.staff-selection {
  margin-bottom: 1.5rem;
}

.staff-selection label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.staff-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.staff-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.staff-option:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.staff-option:has(input:checked) {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.staff-option input[type="radio"] {
  margin: 0;
}

.staff-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.staff-name {
  font-weight: 500;
  color: #374151;
}

.staff-role {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notes-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.notes-section textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.875rem;
  min-height: 100px;
}

.notes-section textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
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

  .staff-option {
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

  .staff-options {
    max-height: 180px;
  }

  .staff-option {
    padding: 0.875rem;
  }

  .staff-name {
    font-size: 0.875rem;
  }

  .staff-role {
    font-size: 0.7rem;
  }

  .notes-section textarea {
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

  .current-staff {
    align-self: flex-end;
    font-size: 0.7rem;
  }

  .staff-options {
    max-height: 160px;
  }

  .staff-option {
    padding: 1rem;
    border-radius: 0.75rem;
  }

  .staff-info {
    gap: 0.125rem;
  }

  .staff-name {
    font-size: 0.875rem;
  }

  .staff-role {
    font-size: 0.65rem;
  }

  .notes-section textarea {
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

  .staff-options {
    max-height: 140px;
  }

  .staff-option {
    padding: 0.875rem;
  }

  .staff-name {
    font-size: 0.8rem;
  }

  .staff-role {
    font-size: 0.6rem;
  }

  .notes-section label {
    font-size: 0.875rem;
  }

  .notes-section textarea {
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