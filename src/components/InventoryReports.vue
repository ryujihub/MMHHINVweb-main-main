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
/* Professional Inventory Reports Styling */
.inventory-reports {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
}

/* Enhanced Header */
.page-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-container {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
}

.title-text h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  color: #64748b;
  font-size: 1.1rem;
  font-weight: 400;
}

.header-actions {
  display: flex;
  gap: 2rem;
  align-items: end;
}

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-range {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-range label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range :deep(.dp__main) {
  width: 280px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.date-range :deep(.dp__main):hover {
  border-color: #10b981;
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.15);
}

.period-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.period-select:hover {
  border-color: #10b981;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.15);
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-1px);
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(16, 185, 129, 0.4);
}

/* KPI Section */
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
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kpi-header h2::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 2px;
}

.kpi-period {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10b981, #059669);
}

.kpi-card.primary::before {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.kpi-card.success::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.kpi-card.warning::before {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.kpi-card.info::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.kpi-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
}

.kpi-visual {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.kpi-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  position: relative;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.kpi-card.primary .kpi-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.kpi-card.success .kpi-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.kpi-card.warning .kpi-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.kpi-card.info .kpi-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
}

.kpi-trend.positive {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #166534;
}

.kpi-trend.neutral {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.kpi-trend i {
  font-size: 0.8rem;
}

.kpi-data {
  text-align: left;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.kpi-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.kpi-description {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 400;
}

/* Analytics Section */
.analytics-section {
  margin-bottom: 3rem;
}

.analytics-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.analytics-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.analytics-card .card-header {
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.header-section {
  margin-bottom: 1.5rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.card-title i {
  color: #10b981;
  font-size: 1.5rem;
}

.card-title h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.card-subtitle {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 400;
}

/* Chart Controls */
.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.view-options {
  display: flex;
  gap: 0.5rem;
}

.chart-type-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.chart-type-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.chart-type-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
  color: white;
}

.category-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.85rem;
  cursor: pointer;
}

.chart-container {
  position: relative;
  padding: 2rem;
  height: 400px;
}

.chart-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 20px 20px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #64748b;
  font-weight: 500;
}

.loading-spinner i {
  font-size: 1.5rem;
}

/* Insights Section */
.insights-section {
  margin-bottom: 2rem;
}

.insights-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.insights-header {
  padding: 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.insights-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.insights-header h3 i {
  color: #f59e0b;
}

.insights-content {
  padding: 2rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.insight-item:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.insight-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  flex-shrink: 0;
}

.insight-icon.positive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.insight-icon.info {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.insight-icon.warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.insight-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.insight-description {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .inventory-reports {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .controls-section {
    width: 100%;
  }

  .chart-controls {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .inventory-reports {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .title-wrapper {
    text-align: center;
  }

  .title-text h1 {
    font-size: 2rem;
    justify-content: center;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-card {
    padding: 1.5rem;
  }

  .kpi-value {
    font-size: 2rem;
  }

  .insights-content {
    padding: 1.5rem;
  }

  .insight-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .title-text h1 {
    font-size: 1.5rem;
  }

  .kpi-value {
    font-size: 1.5rem;
  }

  .card-title h3 {
    font-size: 1.25rem;
  }
}
</style>
