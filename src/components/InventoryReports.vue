<template>
  <div class="inventory-reports">
    <!-- Professional Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-wrapper">
            <div class="icon-container">
              <i class="fas fa-boxes"></i>
            </div>
            <div class="title-text">
              <h1>Inventory Intelligence</h1>
              <p class="subtitle">Advanced stock management and analytics platform</p>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <div class="controls-section">
            <div class="date-range">
              <label>Analysis Period</label>
              <Datepicker
                v-model="dateRange"
                range
                :enable-time-picker="false"
                class="date-picker"
              />
              <select v-model="reportPeriod" class="period-select">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="action-buttons">
              <button @click="refreshData" class="refresh-btn">
                <i class="fas fa-sync-alt"></i>
                Refresh
              </button>
              <button @click="exportToPdf" class="export-btn">
                <i class="fas fa-file-export"></i>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Executive KPI Overview -->
    <div class="kpi-section">
      <div class="kpi-header">
        <h2>Inventory Performance Metrics</h2>
        <div class="kpi-period">{{ formatDateRange }}</div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="kpi-trend positive">
              <i class="fas fa-arrow-up"></i>
              <span>{{ stockTurnover }}%</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">{{ totalItemsSold }}</div>
            <div class="kpi-label">Items Sold</div>
            <div class="kpi-description">total units moved</div>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="kpi-trend neutral">
              <span>{{ lowStockCount }}</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">{{ lowStockPercentage }}%</div>
            <div class="kpi-label">Low Stock Alert</div>
            <div class="kpi-description">items below threshold</div>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="kpi-trend positive">
              <i class="fas fa-arrow-up"></i>
              <span>5.2%</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">₱{{ formatPrice(totalStockValue) }}</div>
            <div class="kpi-label">Total Stock Value</div>
            <div class="kpi-description">current inventory worth</div>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-cube"></i>
            </div>
            <div class="kpi-trend">
              <span>{{ totalProducts }}</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">{{ categories.length }}</div>
            <div class="kpi-label">Categories</div>
            <div class="kpi-description">product categories</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Analytics -->
    <div class="analytics-section">
      <!-- Stock Movement Analytics -->
      <div class="analytics-card main-chart">
        <div class="card-header">
          <div class="header-section">
            <div class="card-title">
              <i class="fas fa-chart-bar"></i>
              <h3>Stock Movement Analysis</h3>
            </div>
            <div class="card-subtitle">Inventory flow and turnover patterns</div>
          </div>
          <div class="chart-controls">
            <div class="view-options">
              <button
                v-for="type in chartTypes"
                :key="type.id"
                @click="activeChartType = type.id"
                :class="['chart-type-btn', { active: activeChartType === type.id }]"
              >
                <i :class="type.icon"></i>
                {{ type.name }}
              </button>
            </div>
            <select v-model="stockMovementCategory" class="category-select">
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category">
                {{ category }}
              </option>
            </select>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="stockMovementChart"></canvas>
          <div class="chart-overlay" v-if="loading">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading data...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Business Insights -->
    <div class="insights-section">
      <div class="insights-card">
        <div class="insights-header">
          <h3><i class="fas fa-lightbulb"></i> Inventory Insights</h3>
        </div>
        <div class="insights-content">
          <div class="insight-item" v-for="insight in inventoryInsights" :key="insight.id">
            <div class="insight-icon" :class="insight.type">
              <i :class="insight.icon"></i>
            </div>
            <div class="insight-text">
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-description">{{ insight.description }}</div>
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
const loading = ref(false)
const activeChartType = ref('bar')

// Chart instances
let stockChartInstance = null

// Chart types for selection
const chartTypes = ref([
  { id: 'bar', name: 'Bar', icon: 'fas fa-chart-bar' },
  { id: 'line', name: 'Line', icon: 'fas fa-chart-line' },
  { id: 'doughnut', name: 'Doughnut', icon: 'fas fa-chart-pie' }
])

// Business insights
const inventoryInsights = ref([
  {
    id: 1,
    type: 'warning',
    icon: 'fas fa-exclamation-triangle',
    title: 'Low Stock Alert',
    description: `${inventoryStore.getLowStockCount} items are below minimum stock levels. Consider restocking to avoid stockouts.`
  },
  {
    id: 2,
    type: 'info',
    icon: 'fas fa-trending-up',
    title: 'Fast Moving Items',
    description: 'Products in Tools category show highest turnover rate. Maintain higher stock levels for these items.'
  },
  {
    id: 3,
    type: 'positive',
    icon: 'fas fa-dollar-sign',
    title: 'High Value Stock',
    description: 'Hardware category represents 60% of total inventory value. Monitor these items closely for optimization.'
  }
])

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

const totalProducts = computed(() => inventoryStore.inventory.length)

const stockTurnover = computed(() => {
  const totalSold = totalItemsSold.value
  const avgStock = inventoryStore.inventory.reduce((sum, item) => sum + item.currentStock, 0) / inventoryStore.inventory.length
  return avgStock > 0 ? Math.round((totalSold / avgStock) * 100) : 0
})

const lowStockPercentage = computed(() => {
  const totalItems = inventoryStore.inventory.length
  return totalItems > 0 ? Math.round((lowStockCount.value / totalItems) * 100) : 0
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

  let chartConfig

  switch (activeChartType.value) {
    case 'bar':
      chartConfig = {
        type: 'bar',
        data: {
          labels: data.map(d => d.x),
          datasets: [
            {
              label: 'Current Stock',
              data: data.map(d => d.stock),
              backgroundColor: '#dbeafe',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Items Sold',
              data: data.map(d => d.sold),
              backgroundColor: '#fee2e2',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#e2e8f0'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      }
      break

    case 'line':
      chartConfig = {
        type: 'line',
        data: {
          labels: data.map(d => d.x),
          datasets: [
            {
              label: 'Current Stock',
              data: data.map(d => d.stock),
              borderColor: '#2563eb',
              backgroundColor: '#dbeafe',
              fill: false,
              tension: 0.4
            },
            {
              label: 'Items Sold',
              data: data.map(d => d.sold),
              borderColor: '#ef4444',
              backgroundColor: '#fee2e2',
              fill: false,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#e2e8f0'
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          }
        }
      }
      break

    case 'doughnut':
      const totalStock = data.reduce((sum, item) => sum + item.stock, 0)
      const totalSold = data.reduce((sum, item) => sum + item.sold, 0)

      chartConfig = {
        type: 'doughnut',
        data: {
          labels: ['In Stock', 'Sold Out'],
          datasets: [{
            data: [totalStock, totalSold],
            backgroundColor: [
              '#10b981',
              '#f59e0b'
            ],
            borderWidth: 0,
            cutout: '60%'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  const percentage = totalStock + totalSold > 0 ?
                    Math.round((value / (totalStock + totalSold)) * 100) : 0
                  return `${label}: ${value} (${percentage}%)`
                }
              }
            }
          }
        }
      }
      break

    default:
      chartConfig = {
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
      }
  }

  stockChartInstance = new Chart(ctx, chartConfig)
}

const refreshData = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateStockMovementChart()
  } finally {
    loading.value = false
  }
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
watch([stockMovementCategory, activeChartType], () => {
  updateStockMovementChart()
})

// Lifecycle
onMounted(() => {
  updateStockMovementChart()
})
</script>

<style scoped>
.inventory-reports {
  padding: 2.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Page Header Modernization */
.page-header {
  background: white;
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  margin-bottom: 2.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.icon-container {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.title-text h1 {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.025em;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.125rem;
  margin-top: 0.5rem;
}

.controls-section {
  display: flex;
  align-items: flex-end;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.date-picker {
  width: 280px;
}

.period-select {
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  color: var(--text-primary);
  background: white;
  min-width: 140px;
  min-height: 44px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.refresh-btn, .export-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
}

.refresh-btn {
  background: white;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
}

.refresh-btn:hover {
  background: var(--background-secondary);
  border-color: var(--success-color);
  color: var(--success-color);
}

.export-btn {
  background: var(--success-color);
  border: none;
  color: white;
  box-shadow: var(--shadow-md);
}

.export-btn:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* KPI Section Overhaul */
.kpi-section {
  margin-bottom: 3rem;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.kpi-header h2 {
  font-size: 1.5rem;
  font-weight: 750;
  color: var(--text-primary);
  margin: 0;
}

.kpi-period {
  padding: 0.5rem 1rem;
  background: var(--background-secondary);
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-tertiary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  overflow: hidden;
}

.kpi-visual {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.primary .kpi-icon { background: rgba(67, 56, 202, 0.1); color: var(--primary-color); }
.success .kpi-icon { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
.warning .kpi-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
.info .kpi-icon { background: rgba(14, 165, 233, 0.1); color: var(--info-color); }

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  padding: 0.25rem 0.625rem;
  border-radius: 2rem;
}

.trend-positive { background: #dcfce7; color: #166534; }
.trend-negative { background: #fee2e2; color: #991b1b; }
.trend-neutral { background: #f1f5f9; color: #475569; }

.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.5rem;
}

/* Analytics Cards Modernization */
.analytics-section {
  margin-bottom: 3rem;
}

.analytics-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 2rem;
  border-bottom: 1px solid var(--border-medium);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  flex-direction: column;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 750;
  color: var(--text-primary);
}

.card-title i {
  font-size: 1.25rem;
  color: var(--success-color);
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.view-options {
  display: flex;
  background: var(--background-secondary);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  gap: 0.25rem;
}

.chart-type-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-type-btn.active {
  background: white;
  color: var(--success-color);
  box-shadow: var(--shadow-sm);
}

.category-select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 160px;
}

.chart-container {
  padding: 2rem;
  position: relative;
  min-height: 400px;
}

/* Insights Section Overhaul */
.insights-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.insights-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-medium);
}

.insights-content {
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}

.insight-item {
  display: flex;
  gap: 1.25rem;
}

.insight-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.insight-icon.positive { background: #dcfce7; color: #166534; }
.insight-icon.info { background: #e0f2fe; color: #075985; }
.insight-icon.warning { background: #fef3c7; color: #92400e; }

.insight-title {
  font-weight: 750;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.insight-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* Responsive Table */
@media (max-width: 1400px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .insights-content { grid-template-columns: 1fr; gap: 1.5rem; }
}

@media (max-width: 1024px) {
  .inventory-reports { padding: 1.5rem; }
  .header-content { flex-direction: column; align-items: flex-start; }
}

@media (max-width: 768px) {
  .page-header { padding: 1.5rem; }
  .title-text h1 { font-size: 1.75rem; }
  .kpi-grid { grid-template-columns: 1fr; }
  .chart-container { min-height: 300px; padding: 1rem; }
}

@media (max-width: 480px) {
  .inventory-reports { padding: 1rem; }
  .action-buttons { width: 100%; flex-direction: column; }
  .refresh-btn, .export-btn { width: 100%; }
  .period-select, .date-picker, .category-select { width: 100%; }
  .card-header { padding: 1rem; }
}
</style>
