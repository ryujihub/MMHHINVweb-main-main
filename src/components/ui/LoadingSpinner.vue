<template>
  <div class="loading-spinner" :class="{ 'overlay': overlay }">
    <div class="spinner" :class="size">
      <div class="spinner-circle"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  message: {
    type: String,
    default: ''
  },
  overlay: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-spinner.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner.small {
  width: 20px;
  height: 20px;
}

.spinner.medium {
  width: 40px;
  height: 40px;
}

.spinner.large {
  width: 60px;
  height: 60px;
}

.spinner-circle {
  width: 100%;
  height: 100%;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-message {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>