<template>
  <div class="simple-bulk-panel" v-if="selectedOrders.length > 0">
    <div class="panel-content">
      <div class="selection-info">
        <i class="fas fa-check-square"></i>
        <span>{{ selectedOrders.length }} orders selected</span>
      </div>
      
      <div class="bulk-actions">
        <button @click="updateStatus" class="action-btn status-btn">
          <i class="fas fa-sync-alt"></i>
          Update Status
        </button>
        <button @click="assignStaff" class="action-btn assign-btn">
          <i class="fas fa-user-tag"></i>
          Assign Staff
        </button>
        <button @click="exportSelected" class="action-btn export-btn">
          <i class="fas fa-file-export"></i>
          Export Selected
        </button>
        <button v-if="isAdmin" @click="deleteSelected" class="action-btn delete-btn">
          <i class="fas fa-trash-alt"></i>
          Delete Selected
        </button>
      </div>
      
      <button @click="clearSelection" class="clear-btn">
        <i class="fas fa-times"></i>
        Clear
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  selectedOrders: {
    type: Array,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clearSelection', 'updateStatus', 'assignStaff', 'exportSelected', 'deleteSelected'])

const clearSelection = () => {
  emit('clearSelection')
}

const updateStatus = () => {
  emit('updateStatus')
}

const assignStaff = () => {
  emit('assignStaff')
}

const exportSelected = () => {
  emit('exportSelected')
}

const deleteSelected = () => {
  emit('deleteSelected')
}
</script>

<style scoped>
.simple-bulk-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 3px solid #3b82f6;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.panel-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
}

.selection-info i {
  color: #3b82f6;
  font-size: 1.1rem;
}

.bulk-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn {
  background: #dbeafe;
  color: #1e40af;
}

.status-btn:hover {
  background: #bfdbfe;
  transform: translateY(-1px);
}

.assign-btn {
  background: #e0e7ff;
  color: #3730a3;
}

.assign-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.export-btn {
  background: #d1fae5;
  color: #065f46;
}

.export-btn:hover {
  background: #a7f3d0;
  transform: translateY(-1px);
}

.delete-btn {
  background: #fee2e2;
  color: #991b1b;
}

.delete-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #e5e7eb;
}

/* Enhanced Mobile Responsive */
@media (max-width: 1024px) {
  .panel-content {
    padding: 1rem 1.5rem;
  }

  .bulk-actions {
    gap: 0.75rem;
  }

  .action-btn {
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .simple-bulk-panel {
    border-top: 2px solid #3b82f6;
  }

  .panel-content {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .selection-info {
    justify-content: center;
    font-size: 0.875rem;
  }

  .bulk-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .action-btn {
    flex: 1;
    min-width: 120px;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    justify-content: center;
  }

  .clear-btn {
    width: 100%;
    justify-content: center;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 640px) {
  .panel-content {
    padding: 0.875rem;
    gap: 0.875rem;
  }

  .selection-info {
    font-size: 0.8rem;
  }

  .selection-info i {
    font-size: 1rem;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn {
    width: 100%;
    min-width: unset;
    padding: 1rem;
    font-size: 1rem;
    border-radius: 0.75rem;
  }

  .clear-btn {
    padding: 1rem;
    font-size: 1rem;
    border-radius: 0.75rem;
  }
}

@media (max-width: 480px) {
  .simple-bulk-panel {
    border-top: 3px solid #3b82f6;
  }

  .panel-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .selection-info {
    font-size: 0.75rem;
    gap: 0.375rem;
  }

  .action-btn, .clear-btn {
    padding: 0.875rem;
    font-size: 0.875rem;
    min-height: 48px; /* Touch-friendly */
  }

  .action-btn i, .clear-btn i {
    font-size: 0.875rem;
  }
}
</style>