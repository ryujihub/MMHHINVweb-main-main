<template>
  <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button @click="cancel" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
        <div v-if="showInput" class="form-group">
          <label>{{ inputLabel }}</label>
          <textarea
            v-model="inputValue"
            :placeholder="inputPlaceholder"
            :required="inputRequired"
            class="input-field"
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="cancel" class="btn btn-secondary">
          {{ cancelText }}
        </button>
        <button @click="confirm" class="btn btn-primary">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  showInput: {
    type: Boolean,
    default: false
  },
  inputLabel: {
    type: String,
    default: 'Reason'
  },
  inputPlaceholder: {
    type: String,
    default: 'Please provide a reason...'
  },
  inputRequired: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

const inputValue = ref('')

const handleOverlayClick = () => {
  cancel()
}

const confirm = () => {
  emit('confirm', inputValue.value)
  emit('update:show', false)
  inputValue.value = ''
}

const cancel = () => {
  emit('cancel')
  emit('update:show', false)
  inputValue.value = ''
}

// Close on Escape key
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.show) {
    cancel()
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
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
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
}

.modal-body {
  padding: 1rem;
}

.modal-body p {
  margin: 0;
  color: #4b5563;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-primary {
  background: #ef4444;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
}

.input-field:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}
</style>
