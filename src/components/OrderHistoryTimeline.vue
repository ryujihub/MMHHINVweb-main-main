<template>
  <div class="order-history-timeline">
    <div class="timeline-header">
      <h3>
        <i class="fas fa-history"></i>
        Order History
      </h3>
      <div class="timeline-actions">
        <button @click="refreshHistory" class="refresh-btn" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'spinning': loading }"></i>
          Refresh
        </button>
        <button @click="exportHistory" class="export-btn">
          <i class="fas fa-download"></i>
          Export
        </button>
      </div>
    </div>

    <LoadingSpinner v-if="loading && history.length === 0" message="Loading order history..." />
    
    <ErrorAlert 
      v-if="error" 
      type="error" 
      title="Failed to load history"
      :message="error"
      @dismiss="error = null"
    />

    <div v-if="!loading && history.length === 0 && !error" class="empty-history">
      <div class="empty-icon">
        <i class="fas fa-clock"></i>
      </div>
      <h4>No History Available</h4>
      <p>Order activities will appear here as they occur.</p>
    </div>

    <div v-if="history.length > 0" class="timeline-container">
      <div class="timeline-filters">
        <select v-model="filterType" @change="applyFilters" class="filter-select">
          <option value="">All Activities</option>
          <option v-for="type in availableTypes" :key="type" :value="type">
            {{ formatActivityType(type) }}
          </option>
        </select>
        <input 
          type="date" 
          v-model="filterDate" 
          @change="applyFilters"
          class="filter-date"
        >
      </div>

      <div class="timeline">
        <div 
          v-for="(entry, index) in filteredHistory" 
          :key="entry.id"
          class="timeline-entry"
          :class="{ 'recent': isRecent(entry.timestamp) }"
        >
          <div class="timeline-connector" v-if="index < filteredHistory.length - 1"></div>
          
          <div class="timeline-marker" :class="getActivityClass(entry.type)">
            <i :class="getActivityIcon(entry.type)"></i>
          </div>
          
          <div class="timeline-content">
            <div class="timeline-header-content">
              <h4 class="activity-title">{{ entry.description }}</h4>
              <span class="activity-time" :title="formatFullDate(entry.timestamp)">
                {{ formatRelativeTime(entry.timestamp) }}
              </span>
            </div>
            
            <div class="activity-details">
              <div class="activity-meta">
                <span class="activity-type">{{ formatActivityType(entry.type) }}</span>
                <span v-if="entry.userId" class="activity-user">
                  by {{ getUserName(entry.userId) }}
                </span>
              </div>
              
              <div v-if="entry.metadata && Object.keys(entry.metadata).length > 0" class="activity-metadata">
                <button 
                  @click="toggleMetadata(entry.id)" 
                  class="metadata-toggle"
                  :class="{ 'expanded': expandedMetadata.includes(entry.id) }"
                >
                  <i class="fas fa-chevron-right"></i>
                  Details
                </button>
                <div v-if="expandedMetadata.includes(entry.id)" class="metadata-content">
                  <div v-for="(value, key) in entry.metadata" :key="key" class="metadata-item">
                    <strong>{{ formatMetadataKey(key) }}:</strong>
                    <span>{{ formatMetadataValue(value) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button @click="loadMoreHistory" class="load-more-btn" :disabled="loadingMore">
          <LoadingSpinner v-if="loadingMore" size="small" />
          <span v-else>Load More History</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format, formatDistanceToNow, isAfter, subHours } from 'date-fns'
import { OrderFirebaseService } from '../utils/firebaseEnhancements'
import { getHistoryIcon, getHistoryColor, ORDER_HISTORY_TYPES } from '../utils/orderEnhancements'
import LoadingSpinner from './ui/LoadingSpinner.vue'
import ErrorAlert from './ui/ErrorAlert.vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  orderId: {
    type: String,
    required: true
  },
  staffList: {
    type: Array,
    default: () => []
  },
  realTime: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['historyUpdated'])

const toast = useToast()

// State
const history = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(null)
const hasMore = ref(false)
const lastDoc = ref(null)
const expandedMetadata = ref([])
const filterType = ref('')
const filterDate = ref('')
const unsubscribe = ref(null)

// Computed
const availableTypes = computed(() => {
  const types = [...new Set(history.value.map(entry => entry.type))]
  return types.sort()
})

const filteredHistory = computed(() => {
  let filtered = [...history.value]
  
  if (filterType.value) {
    filtered = filtered.filter(entry => entry.type === filterType.value)
  }
  
  if (filterDate.value) {
    const filterDateObj = new Date(filterDate.value)
    filtered = filtered.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate.toDateString() === filterDateObj.toDateString()
    })
  }
  
  return filtered
})

// Methods
const loadHistory = async (loadMore = false) => {
  try {
    if (loadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
      error.value = null
    }

    const result = await OrderFirebaseService.getOrderHistory(props.orderId, {
      lastDoc: loadMore ? lastDoc.value : null
    })

    if (result.success) {
      if (loadMore) {
        history.value = [...history.value, ...result.data]
      } else {
        history.value = result.data
      }
      
      lastDoc.value = result.lastDoc
      hasMore.value = result.hasMore
      
      emit('historyUpdated', history.value)
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreHistory = () => {
  loadHistory(true)
}

const refreshHistory = () => {
  lastDoc.value = null
  hasMore.value = false
  loadHistory()
}

const setupRealTimeUpdates = () => {
  if (!props.realTime) return

  unsubscribe.value = OrderFirebaseService.subscribeToOrderHistory(
    props.orderId,
    (result) => {
      if (result.success) {
        // Merge new data with existing, avoiding duplicates
        const existingIds = new Set(history.value.map(entry => entry.id))
        const newEntries = result.data.filter(entry => !existingIds.has(entry.id))
        
        if (newEntries.length > 0) {
          history.value = [...newEntries, ...history.value].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          )
          emit('historyUpdated', history.value)
        }
      }
    }
  )
}

const applyFilters = () => {
  // Filters are applied via computed property
}

const toggleMetadata = (entryId) => {
  const index = expandedMetadata.value.indexOf(entryId)
  if (index > -1) {
    expandedMetadata.value.splice(index, 1)
  } else {
    expandedMetadata.value.push(entryId)
  }
}

const exportHistory = async () => {
  try {
    const csvContent = generateHistoryCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `order-${props.orderId.slice(-6)}-history.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('History exported successfully')
  } catch (err) {
    toast.error('Failed to export history')
  }
}

const generateHistoryCSV = () => {
  const headers = ['Date', 'Time', 'Activity', 'Description', 'User', 'Type']
  const rows = filteredHistory.value.map(entry => [
    format(entry.timestamp, 'yyyy-MM-dd'),
    format(entry.timestamp, 'HH:mm:ss'),
    formatActivityType(entry.type),
    entry.description,
    getUserName(entry.userId),
    entry.type
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Utility methods
const isRecent = (timestamp) => {
  return isAfter(new Date(timestamp), subHours(new Date(), 1))
}

const formatRelativeTime = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const formatFullDate = (timestamp) => {
  return format(new Date(timestamp), 'PPpp')
}

const formatActivityType = (type) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getActivityClass = (type) => {
  const colorMap = {
    [ORDER_HISTORY_TYPES.CREATED]: 'created',
    [ORDER_HISTORY_TYPES.STATUS_CHANGED]: 'status-changed',
    [ORDER_HISTORY_TYPES.ASSIGNED]: 'assigned',
    [ORDER_HISTORY_TYPES.COMPLETED]: 'completed',
    [ORDER_HISTORY_TYPES.CANCELLED]: 'cancelled',
    [ORDER_HISTORY_TYPES.EXPORTED]: 'exported'
  }
  return colorMap[type] || 'default'
}

const getActivityIcon = (type) => {
  return getHistoryIcon(type)
}

const getUserName = (userId) => {
  const staff = props.staffList.find(s => s.id === userId)
  return staff ? (staff.username || staff.name || staff.email) : 'System'
}

const formatMetadataKey = (key) => {
  return key.split(/(?=[A-Z])/).join(' ').toLowerCase()
    .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatMetadataValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// Lifecycle
onMounted(() => {
  loadHistory()
  setupRealTimeUpdates()
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})
</script>

<style scoped>
.order-history-timeline {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.timeline-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
  font-size: 1.125rem;
}

.timeline-actions {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn, .export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.refresh-btn:hover, .export-btn:hover {
  background: #f3f4f6;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

.empty-history {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-history h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.timeline-filters {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.filter-select, .filter-date {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.timeline-container {
  max-height: 600px;
  overflow-y: auto;
}

.timeline {
  padding: 1.5rem;
}

.timeline-entry {
  position: relative;
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.timeline-entry.recent .timeline-content {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.timeline-connector {
  position: absolute;
  left: 1rem;
  top: 2.5rem;
  bottom: -2rem;
  width: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.timeline-marker {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-marker.created { background: #3b82f6; }
.timeline-marker.status-changed { background: #8b5cf6; }
.timeline-marker.assigned { background: #06b6d4; }
.timeline-marker.completed { background: #10b981; }
.timeline-marker.cancelled { background: #ef4444; }
.timeline-marker.exported { background: #f59e0b; }
.timeline-marker.default { background: #6b7280; }

.timeline-content {
  flex: 1;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
}

.timeline-content:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.activity-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.activity-time {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.activity-details {
  font-size: 0.75rem;
}

.activity-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.activity-type {
  color: #374151;
  font-weight: 500;
}

.activity-user {
  color: #6b7280;
}

.metadata-toggle {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.25rem 0;
}

.metadata-toggle:hover {
  text-decoration: underline;
}

.metadata-toggle.expanded i {
  transform: rotate(90deg);
}

.metadata-content {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.metadata-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.metadata-item strong {
  color: #374151;
  min-width: 80px;
}

.load-more {
  padding: 1rem 1.5rem;
  text-align: center;
  border-top: 1px solid #e5e7eb;
}

.load-more-btn {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
}

.load-more-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .timeline-actions {
    justify-content: center;
  }

  .timeline-filters {
    flex-direction: column;
  }

  .timeline-entry {
    gap: 0.75rem;
  }

  .timeline-marker {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.75rem;
  }

  .timeline-connector {
    left: 0.75rem;
  }

  .timeline-header-content {
    flex-direction: column;
    gap: 0.5rem;
  }

  .activity-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>