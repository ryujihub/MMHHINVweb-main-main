<template>
  <div v-if="show" class="error-alert" :class="type">
    <div class="alert-icon">
      <i :class="iconClass"></i>
    </div>
    <div class="alert-content">
      <h4 v-if="title" class="alert-title">{{ title }}</h4>
      <p class="alert-message">{{ message }}</p>
      <div v-if="details" class="alert-details">
        <button @click="showDetails = !showDetails" class="details-toggle">
          <i :class="showDetails ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          {{ showDetails ? 'Hide' : 'Show' }} Details
        </button>
        <div v-if="showDetails" class="details-content">
          <pre>{{ details }}</pre>
        </div>
      </div>
    </div>
    <button v-if="dismissible" @click="dismiss" class="alert-dismiss">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'error',
    validator: (value) => ['error', 'warning', 'info', 'success'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ''
  },
  dismissible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['dismiss'])

const showDetails = ref(false)

const iconClass = computed(() => {
  const icons = {
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
    success: 'fas fa-check-circle'
  }
  return icons[props.type]
})

const dismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid;
  margin-bottom: 1rem;
}

.error-alert.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.error-alert.warning {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #92400e;
}

.error-alert.info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.error-alert.success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.alert-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
}

.alert-content {
  flex: 1;
}

.alert-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
}

.alert-message {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.alert-details {
  margin-top: 0.75rem;
}

.details-toggle {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0;
}

.details-toggle:hover {
  text-decoration: underline;
}

.details-content {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.alert-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  opacity: 0.7;
}

.alert-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}
</style>