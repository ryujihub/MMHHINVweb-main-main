<template>
  <div class="check-in-out-widget">
    <div class="widget-header">
      <h3>Staff Check-In/Out</h3>
      <div class="status-indicator" :class="{ 'checked-in': isCheckedIn, 'checked-out': !isCheckedIn }">
        <i :class="isCheckedIn ? 'fas fa-user-check' : 'fas fa-user-clock'"></i>
        <span>{{ isCheckedIn ? 'Checked In' : 'Checked Out' }}</span>
      </div>
    </div>

    <div class="widget-content">
      <!-- Current Session Info -->
      <div v-if="isCheckedIn" class="current-session">
        <div class="session-info">
          <div class="time-info">
            <i class="fas fa-clock"></i>
            <span>Checked in: {{ formatTime(checkInTime) }}</span>
          </div>
          <div class="duration-info">
            <i class="fas fa-hourglass-half"></i>
            <span>Duration: {{ formattedDuration }}</span>
          </div>
        </div>
        <button @click="handleCheckOut" class="check-out-btn" :disabled="loading.value">
          <i class="fas fa-sign-out-alt"></i>
          Check Out
        </button>
      </div>

      <!-- Check In Form -->
      <div v-else class="check-in-form">
        <button @click="handleCheckIn" class="check-in-btn" :disabled="loading.value">
          <i class="fas fa-sign-in-alt"></i>
          Check In
        </button>
      </div>

      <!-- Session History -->
      <div class="session-history">
        <h4>Recent Sessions</h4>
        <div class="history-list">
          <div v-for="session in recentSessions" :key="session.id" class="history-item">
            <div class="session-date">{{ formatDate(session.date) }}</div>
            <div class="session-times">
              <span>{{ formatTime(session.checkInTime) }}</span>
              <i class="fas fa-arrow-right"></i>
              <span>{{ session.checkOutTime ? formatTime(session.checkOutTime) : 'Active' }}</span>
            </div>
            <div class="session-duration" v-if="session.checkOutTime">
              {{ getSessionDuration(session) }}
            </div>
          </div>
          <div v-if="recentSessions.length === 0" class="no-sessions">
            No recent sessions
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading.value" class="loading-overlay">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCheckInOutStore } from '../stores/checkInOutStore'
import { useAuthStore } from '../stores/authStore'

const checkInOutStore = useCheckInOutStore()
const authStore = useAuthStore()

// Computed
const isCheckedIn = computed(() => checkInOutStore.isCheckedIn)
const checkInTime = computed(() => checkInOutStore.checkInTime)
const formattedDuration = computed(() => checkInOutStore.formattedDuration)
const sessions = computed(() => checkInOutStore.sessions)
const loading = computed(() => checkInOutStore.loading)

const recentSessions = computed(() => {
  return sessions.value.slice(0, 5) // Show last 5 sessions
})

// Methods
const formatTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

const getSessionDuration = (session) => {
  if (!session.checkInTime || !session.checkOutTime) return ''
  const duration = Math.floor((session.checkOutTime - session.checkInTime) / (1000 * 60))
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  return `${hours}h ${minutes}m`
}

const handleCheckIn = async () => {
  try {
    await checkInOutStore.checkIn()
    // Refresh sessions history
    await checkInOutStore.getSessionsHistory(7)
  } catch (error) {
    alert(`Check-in failed: ${error.message}`)
  }
}

const handleCheckOut = async () => {
  try {
    await checkInOutStore.checkOut()
    // Refresh sessions history
    await checkInOutStore.getSessionsHistory(7)
  } catch (error) {
    alert(`Check-out failed: ${error.message}`)
  }
}

// Initialize
onMounted(async () => {
  // Check-in status is now initialized in authStore
  await checkInOutStore.getSessionsHistory(7)
})
</script>

<style scoped>
.check-in-out-widget {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  position: relative;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-medium);
}

.widget-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.125rem;
  font-weight: 700;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-indicator.checked-in {
  background: #dcfce7;
  color: #166534;
}

.status-indicator.checked-out {
  background: #fef2f2;
  color: #991b1b;
}

.current-session {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.session-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.time-info, .duration-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-size: 0.875rem;
}

.check-in-btn, .check-out-btn {
  width: auto;
  min-width: 120px;
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.check-in-btn {
  background: #10b981;
  color: white;
}

.check-in-btn:hover:not(:disabled) {
  background: #059669;
}

.check-out-btn {
  background: #ef4444;
  color: white;
}

.check-out-btn:hover:not(:disabled) {
  background: #dc2626;
}

.check-in-btn:disabled, .check-out-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.session-history {
  border-top: 1px solid #e6e9ef;
  padding-top: 1rem;
}

.session-history h4 {
  margin: 0 0 0.75rem 0;
  color: #1a202c;
  font-size: 1rem;
  font-weight: 600;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.history-item:last-child {
  border-bottom: none;
}

.session-date {
  font-weight: 500;
  color: #1a202c;
}

.session-times {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
}

.session-duration {
  color: #718096;
  font-size: 0.8rem;
}

.no-sessions {
  text-align: center;
  color: #a0aec0;
  font-style: italic;
  padding: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.loading-overlay i {
  font-size: 1.5rem;
  color: #4a5568;
}

@media (max-width: 768px) {
  .check-in-out-widget { padding: 1rem; }
  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .session-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .check-in-btn, .check-out-btn {
    width: 100%;
    min-width: auto;
    min-height: 52px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .check-in-out-widget { padding: 0.75rem; }
  .widget-header h3 { font-size: 1rem; }
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
