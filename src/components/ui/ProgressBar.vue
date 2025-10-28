<template>
  <div class="progress-container">
    <div v-if="label" class="progress-label">
      <span>{{ label }}</span>
      <span class="progress-percentage">{{ Math.round(percentage) }}%</span>
    </div>
    <div class="progress-bar" :class="{ 'animated': animated }">
      <div 
        class="progress-fill" 
        :class="variant"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
    <div v-if="showStats" class="progress-stats">
      <span class="stat">{{ current }} / {{ total }}</span>
      <span v-if="errors > 0" class="stat error">{{ errors }} errors</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  errors: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'error'].includes(value)
  },
  animated: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const percentage = computed(() => {
  if (props.total === 0) return 0
  return Math.min((props.current / props.total) * 100, 100)
})
</script>

<style scoped>
.progress-container {
  width: 100%;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.progress-percentage {
  color: #6b7280;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar.animated .progress-fill {
  transition: width 0.3s ease-in-out;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

.progress-fill.primary {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.progress-fill.success {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-fill.error {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.stat.error {
  color: #dc2626;
  font-weight: 500;
}
</style>