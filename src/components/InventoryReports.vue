<template>
  <div class="inventory-reports">
    <div class="page-header">
      <h1>Inventory Report</h1>
      <div class="header-actions">
        <div class="date-range">
          <Datepicker 
            v-model="dateRange" 
            range 
            :enable-time-picker="false"
          />
          <select v-model="reportPeriod">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="export-actions">
          <button @click="exportToPdf" class="export-btn">
            <i class="fas fa-file-pdf"></i>
            Export PDF
          </button>
        </div>
      </div>
    </div>

    <div class="reports-grid">
      <!-- Stock Movement -->
      <div class="report-card">
        <div class="card-header">
          <h2>Stock Movement</h2>
          <select v-model="stockMovementCategory">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category">
              {{ category }}
            </option>
          </select>
        </div>
        <div class="card-content">
          <canvas ref="stockMovementChart"></canvas>
          <div class="movement-summary">
            <div class="summary-item">
              <span class="label">Total Items Sold</span>
              <span class="value">{{ totalItemsSold }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Low Stock Items</span>
              <span class="value warning">{{ lowStockCount }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Stock Value</span>
              <span class="value">₱{{ formatPrice(totalStockValue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useInventoryStore } from '../stores/inventoryStore'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { 
  startOfDay, 
  endOfDay, 
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format 
} from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const inventoryStore = useInventoryStore()

// State
const dateRange = ref([new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()])
const reportPeriod = ref('daily')
const stockMovementCategory = ref('')
const stockMovementChart = ref(null)

// Chart instances
let stockChartInstance = null

// Computed
const formatDateRange = computed(() => {
  if (!dateRange.value[0] || !dateRange.value[1]) return ''
  return `${format(dateRange.value[0], 'MMM d, yyyy')} - ${format(dateRange.value[1], 'MMM d, yyyy')}`
})

const categories = computed(() => inventoryStore.categories)

const filteredOrders = computed(() => {
  const start = startOfDay(dateRange.value[0])
  const end = endOfDay(dateRange.value[1])
  
  return inventoryStore.dailyOrders.filter(order => {
    const orderDate = order.createdAt.toDate()
    return orderDate >= start && orderDate <= end
  })
})

const totalItemsSold = computed(() => {
  return filteredOrders.value.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)
})

const lowStockCount = computed(() => inventoryStore.getLowStockCount)

const totalStockValue = computed(() => {
  return inventoryStore.inventory.reduce((sum, item) => {
    if (!stockMovementCategory.value || item.category === stockMovementCategory.value) {
      return sum + (item.price * item.currentStock)
    }
    return sum
  }, 0)
})

// Methods
const formatPrice = (amount) => {
  return amount.toLocaleString('en-PH')
}

const updateStockMovementChart = () => {
  if (stockChartInstance) {
    stockChartInstance.destroy()
  }

  const ctx = stockMovementChart.value.getContext('2d')
  const inventory = inventoryStore.inventory.filter(item => 
    !stockMovementCategory.value || item.category === stockMovementCategory.value
  )

  const data = inventory.map(item => ({
    x: item.name,
    sold: item.totalSold || 0,
    stock: item.currentStock
  }))

  stockChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.x),
      datasets: [
        {
          label: 'Current Stock',
          data: data.map(d => d.stock),
          backgroundColor: '#dbeafe',
          borderColor: '#2563eb'
        },
        {
          label: 'Sold',
          data: data.map(d => d.sold),
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          stacked: false
        },
        x: {
          stacked: false
        }
      }
    }
  })
}


const exportToPdf = () => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Inventory Report', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Period: ${formatDateRange.value}`, 20, 30)

  doc.setFontSize(16)
  doc.text('Summary', 20, 45)
  
  doc.setFontSize(12)
  doc.text([
    `Total Items Sold: ${totalItemsSold.value}`,
    `Low Stock Items: ${lowStockCount.value}`,
    `Total Stock Value: ₱${formatPrice(totalStockValue.value)}`
  ], 20, 55)

  doc.setFontSize(16)
  doc.text('Stock Movement', 20, 85)

  autoTable(doc, {
    startY: 90,
    head: [['Product', 'Category', 'Current Stock', 'Total Sold']],
    body: inventoryStore.inventory
      .filter(item => !stockMovementCategory.value || item.category === stockMovementCategory.value)
      .map(item => [
        item.name,
        item.category,
        item.currentStock,
        item.totalSold || 0
      ])
  })

  doc.save(`inventory_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Watchers
watch([stockMovementCategory], () => {
  updateStockMovementChart()
})

// Lifecycle
onMounted(() => {
  updateStockMovementChart()
})
</script>

<style scoped>
/* Re-using styles from Reports.vue, adjust as needed */
.inventory-reports {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.date-range {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.date-range :deep(.dp__main) {
  width: 260px;
}

.export-actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background: #e5e7eb;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.report-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.period {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
  color: #1f2937;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .inventory-reports {
    padding: 1rem;
  }

  .header-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .date-range {
    width: 100%;
  }

  .date-range :deep(.dp__main) {
    width: 100%;
  }

  .export-actions {
    width: 100%;
    justify-content: stretch;
  }

  .export-btn {
    flex: 1;
    justify-content: center;
  }

  .reports-grid {
    grid-template-columns: 1fr;
  }
}
</style>
