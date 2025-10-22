<template>
  <div class="sales-reports">
    <!-- Professional Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-wrapper">
            <div class="icon-container">
              <i class="fas fa-analytics"></i>
            </div>
            <div class="title-text">
              <h1>Executive Sales Dashboard</h1>
              <p class="subtitle">Enterprise-grade business intelligence platform</p>
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
        <h2>Key Performance Indicators</h2>
        <div class="kpi-period">{{ formatDateRange }}</div>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card primary">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-chart-line-up"></i>
            </div>
            <div class="kpi-trend positive">
              <i class="fas fa-arrow-up"></i>
              <span>12.5%</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">{{ totalOrders }}</div>
            <div class="kpi-label">Total Orders</div>
            <div class="kpi-description">vs. previous period</div>
          </div>
        </div>

        <div class="kpi-card success">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="kpi-trend positive">
              <i class="fas fa-arrow-up"></i>
              <span>8.3%</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">₱{{ formatPrice(totalRevenue) }}</div>
            <div class="kpi-label">Total Revenue</div>
            <div class="kpi-description">gross sales volume</div>
          </div>
        </div>

        <div class="kpi-card warning">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-calculator-alt"></i>
            </div>
            <div class="kpi-trend neutral">
              <i class="fas fa-minus"></i>
              <span>2.1%</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">₱{{ formatPrice(averageOrderValue) }}</div>
            <div class="kpi-label">Avg Order Value</div>
            <div class="kpi-description">per transaction</div>
          </div>
        </div>

        <div class="kpi-card info">
          <div class="kpi-visual">
            <div class="kpi-icon">
              <i class="fas fa-crown"></i>
            </div>
            <div class="kpi-trend">
              <span>{{ topProducts.length }}</span>
            </div>
          </div>
          <div class="kpi-data">
            <div class="kpi-value">{{ topProductsLimit }}</div>
            <div class="kpi-label">Top Performers</div>
            <div class="kpi-description">tracked products</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Advanced Analytics Grid -->
    <div class="analytics-grid">
      <!-- Revenue Analytics -->
      <div class="analytics-card main-chart">
        <div class="card-header">
          <div class="header-section">
            <div class="card-title">
              <i class="fas fa-chart-area"></i>
              <h3>Revenue Analytics</h3>
            </div>
            <div class="card-subtitle">Performance trends and forecasting</div>
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
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="ordersChart"></canvas>
          <div class="chart-overlay" v-if="loading">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading data...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Performance -->
      <div class="analytics-card products-performance">
        <div class="card-header">
          <div class="header-section">
            <div class="card-title">
              <i class="fas fa-trophy"></i>
              <h3>Product Leaderboard</h3>
            </div>
            <div class="card-subtitle">Top performing products by revenue</div>
          </div>
          <div class="performance-controls">
            <select v-model="topProductsLimit" class="products-limit-select">
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
            </select>
          </div>
        </div>
        <div class="leaderboard-content">
          <div class="products-list">
            <div v-for="(product, index) in topProducts" :key="product.id" class="leaderboard-item">
              <div class="rank-badge">
                <span class="rank-number">{{ index + 1 }}</span>
                <div class="rank-ribbon" v-if="index < 3"></div>
              </div>
              <div class="product-details">
                <div class="product-main">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-category">{{ product.category }}</span>
                </div>
                <div class="product-metrics">
                  <div class="metric">
                    <span class="metric-value">{{ product.quantitySold }}</span>
                    <span class="metric-label">units sold</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">₱{{ formatPrice(product.revenue) }}</span>
                    <span class="metric-label">revenue</span>
                  </div>
                </div>
              </div>
              <div class="performance-bar">
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: `${(product.revenue / topProducts[0]?.revenue) * 100}%` }"
                  ></div>
                </div>
                <span class="percentage">{{ Math.round((product.revenue / topProducts[0]?.revenue) * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Insights -->
    <div class="insights-section">
      <div class="insights-card">
        <div class="insights-header">
          <h3><i class="fas fa-lightbulb"></i> Business Insights</h3>
        </div>
        <div class="insights-content">
          <div class="insight-item" v-for="insight in businessInsights" :key="insight.id">
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
const topProductsLimit = ref(5)
const ordersChart = ref(null)
const loading = ref(false)
const activeChartType = ref('line')

// Chart instances
let ordersChartInstance = null

// Chart types for selection
const chartTypes = ref([
  { id: 'line', name: 'Line', icon: 'fas fa-chart-line' },
  { id: 'bar', name: 'Bar', icon: 'fas fa-chart-bar' },
  { id: 'area', name: 'Area', icon: 'fas fa-chart-area' }
])

// Business insights
const businessInsights = ref([
  {
    id: 1,
    type: 'positive',
    icon: 'fas fa-arrow-up',
    title: 'Revenue Growth',
    description: 'Sales have increased by 8.3% compared to last month, indicating positive market response.'
  },
  {
    id: 2,
    type: 'info',
    icon: 'fas fa-star',
    title: 'Top Performer',
    description: 'Product category "Tools" is generating 45% of total revenue and should be prioritized for inventory.'
  },
  {
    id: 3,
    type: 'warning',
    icon: 'fas fa-exclamation-triangle',
    title: 'Seasonal Trend',
    description: 'Order volume typically increases 15% during Q4. Consider preparing additional stock levels.'
  }
])

// Computed
const formatDateRange = computed(() => {
  if (!dateRange.value[0] || !dateRange.value[1]) return ''
  return `${format(dateRange.value[0], 'MMM d, yyyy')} - ${format(dateRange.value[1], 'MMM d, yyyy')}`
})

const filteredOrders = computed(() => {
  const start = startOfDay(dateRange.value[0])
  const end = endOfDay(dateRange.value[1])
  
  return inventoryStore.dailyOrders.filter(order => {
    const orderDate = order.createdAt.toDate()
    return orderDate >= start && orderDate <= end
  })
})

const ordersByPeriod = computed(() => {
  const orders = filteredOrders.value
  const result = new Map()

  switch (reportPeriod.value) {
    case 'daily':
      eachDayOfInterval({ start: dateRange.value[0], end: dateRange.value[1] })
        .forEach(date => {
          const key = format(date, 'yyyy-MM-dd')
          result.set(key, {
            date,
            orders: orders.filter(o => 
              format(o.createdAt.toDate(), 'yyyy-MM-dd') === key
            )
          })
        })
      break
    case 'weekly':
      eachWeekOfInterval({ start: dateRange.value[0], end: dateRange.value[1] })
        .forEach(date => {
          const key = format(date, 'yyyy-[W]ww')
          result.set(key, {
            date,
            orders: orders.filter(o => {
              const orderWeek = format(o.createdAt.toDate(), 'yyyy-[W]ww')
              return orderWeek === key
            })
          })
        })
      break
    case 'monthly':
      eachMonthOfInterval({ start: dateRange.value[0], end: dateRange.value[1] })
        .forEach(date => {
          const key = format(date, 'yyyy-MM')
          result.set(key, {
            date,
            orders: orders.filter(o => {
              const orderMonth = format(o.createdAt.toDate(), 'yyyy-MM')
              return orderMonth === key
            })
          })
        })
      break
  }

  return result
})

const totalOrders = computed(() => filteredOrders.value.length)

const totalRevenue = computed(() => {
  return filteredOrders.value.reduce((sum, order) => sum + order.total, 0)
})

const averageOrderValue = computed(() => {
  return totalOrders.value ? totalRevenue.value / totalOrders.value : 0
})

const topProducts = computed(() => {
  const products = new Map()

  filteredOrders.value.forEach(order => {
    order.items.forEach(item => {
      if (!products.has(item.id)) {
        products.set(item.id, {
          id: item.id,
          name: item.name,
          category: item.category,
          quantitySold: 0,
          revenue: 0
        })
      }
      const product = products.get(item.id)
      product.quantitySold += item.quantity
      product.revenue += item.price * item.quantity
    })
  })

  return Array.from(products.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topProductsLimit.value)
})

// Methods
const formatPrice = (amount) => {
  return amount.toLocaleString('en-PH')
}

const updateOrdersChart = () => {
  if (ordersChartInstance) {
    ordersChartInstance.destroy()
  }

  const ctx = ordersChart.value.getContext('2d')
  const data = Array.from(ordersByPeriod.value.entries()).map(([key, value]) => ({
    x: value.date,
    y: value.orders.reduce((sum, order) => sum + order.total, 0)
  }))

  const getChartType = () => {
    switch (activeChartType.value) {
      case 'area':
        return 'line'
      case 'bar':
        return 'bar'
      default:
        return 'line'
    }
  }

  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: reportPeriod.value === 'monthly' ? 'month' :
                  reportPeriod.value === 'weekly' ? 'week' : 'day'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#e2e8f0'
          }
        }
      }
    }

    if (activeChartType.value === 'bar') {
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            type: 'time',
            time: {
              unit: reportPeriod.value === 'monthly' ? 'month' :
                    reportPeriod.value === 'weekly' ? 'week' : 'day'
            }
          }
        }
      }
    }

    return baseOptions
  }

  const chartConfig = {
    type: getChartType(),
    data: {
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: '#2563eb',
        backgroundColor: activeChartType.value === 'area' ? '#dbeafe' :
                        activeChartType.value === 'bar' ? '#3b82f6' : '#2563eb',
        fill: activeChartType.value === 'area',
        borderWidth: activeChartType.value === 'bar' ? 0 : 2,
        borderRadius: activeChartType.value === 'bar' ? 4 : 0,
        borderSkipped: false
      }]
    },
    options: getChartOptions()
  }

  ordersChartInstance = new Chart(ctx, chartConfig)
}

const refreshData = async () => {
  loading.value = true
  try {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    // In a real app, you would refetch data here
    updateOrdersChart()
  } finally {
    loading.value = false
  }
}


const exportToPdf = () => {
  // Create PDF in landscape orientation with better settings
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  // Set default font
  doc.setFont('helvetica')

  // Header section with better styling
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 37, 41) // Dark gray color
  doc.text('MMH HARDWARE INVENTORY', 20, 25)

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(59, 130, 246) // Blue color
  doc.text('Sales Report', 20, 35)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(108, 117, 125) // Medium gray
  doc.text(`Report Period: ${formatDateRange.value}`, 20, 45)

  // Summary section with professional layout
  let currentY = 60

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 37, 41)
  doc.text('EXECUTIVE SUMMARY', 20, currentY)

  currentY += 15

  // Summary metrics in a clean layout
  const summaryData = [
    { label: 'Total Orders', value: totalOrders.value.toString(), icon: '' },
    { label: 'Total Revenue', value: `PHP ${formatPrice(totalRevenue.value)}`, icon: '' },
    { label: 'Average Order Value', value: `PHP ${formatPrice(averageOrderValue.value)}`, icon: '' }
  ]

  summaryData.forEach((item, index) => {
    const x = 20 + (index * 90)

    // Label only (no icons to avoid encoding issues)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(52, 58, 64)
    doc.text(item.label, x, currentY + 3)

    // Value
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(33, 37, 41)
    doc.text(item.value, x, currentY + 13)
  })

  // Best Selling Products section
  currentY = 100

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 37, 41)
  doc.text('TOP PERFORMING PRODUCTS', 20, currentY)

  currentY += 10

  // Products table with enhanced styling
  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Product Name', 'Qty Sold', 'Revenue']],
    body: topProducts.value.map((product, index) => [
      (index + 1).toString(),
      (product.name || 'Unknown Product').toUpperCase(),
      product.quantitySold.toString(),
      `PHP ${formatPrice(product.revenue)}`
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
      lineColor: [222, 226, 230],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [33, 37, 41], // Dark header
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [33, 37, 41]
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Rank
      1: { cellWidth: 90, fontStyle: 'bold' }, // Product name
      2: { cellWidth: 25, halign: 'center' }, // Quantity
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' } // Revenue
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250] // Light gray for alternate rows
    },
    margin: { top: currentY, right: 15, bottom: 25, left: 15 },
    tableWidth: 'wrap'
  })

  // Footer section
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width

  // Footer line
  doc.setDrawColor(222, 226, 230)
  doc.setLineWidth(0.5)
  doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20)

  // Footer text
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(108, 117, 125)

  const generationDate = format(new Date(), 'MMM d, yyyy - h:mm a')
  doc.text(`Generated on: ${generationDate}`, 20, pageHeight - 12)
  doc.text('MMH Hardware Inventory Management System', pageWidth - 20, pageHeight - 12, { align: 'right' })

  // Save with a cleaner filename
  const fileDate = format(new Date(), 'yyyy-MM-dd')
  doc.save(`MMH_Sales_Report_${fileDate}.pdf`)
}

// Watchers
watch([dateRange, reportPeriod, activeChartType], () => {
  updateOrdersChart()
})

// Lifecycle
onMounted(() => {
  updateOrdersChart()
})
</script>

<style scoped>
/* Modern Sales Reports Styling */
.sales-reports {
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

.title-section h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h1 i {
  color: #3b82f6;
  font-size: 2rem;
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
  border-color: #3b82f6;
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.15);
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
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(59, 130, 246, 0.4);
}

.export-btn.primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
}

.export-btn.primary:hover {
  box-shadow: 0 8px 15px rgba(16, 185, 129, 0.4);
}

/* Key Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.metric-card.total-orders::before {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.metric-card.total-revenue::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.metric-card.avg-order::before {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.metric-card.top-products::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1rem;
  position: relative;
}

.metric-card.total-orders .metric-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.metric-card.total-revenue .metric-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.metric-card.avg-order .metric-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.metric-card.top-products .metric-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.metric-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
}

.metric-content p {
  margin: 0 0 0.5rem 0;
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
}

.metric-change {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
}

.metric-change.positive {
  background: #dcfce7;
  color: #166534;
}

.metric-change.neutral {
  background: #fef3c7;
  color: #92400e;
}

/* Reports Grid */
.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
}

.report-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: all 0.3s ease;
}

.report-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.header-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-info h2 i {
  color: #3b82f6;
}

.header-info p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chart-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
}

.legend-color.revenue {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.products-limit-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.85rem;
  cursor: pointer;
}

.card-content {
  padding: 1.5rem;
}

/* Product List Enhancements */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-row {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  gap: 1rem;
}

.product-row:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.product-rank {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.rank-number {
  line-height: 1;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 1rem;
}

.product-category {
  font-size: 0.8rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  width: fit-content;
}

.product-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  text-align: center;
}

.stat .label {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}

.stat .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.product-progress {
  width: 100px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 3px;
  transition: width 0.3s ease;
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
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
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

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(550px, 1fr));
  gap: 2rem;
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
  color: #3b82f6;
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
  border-color: #3b82f6;
  color: #3b82f6;
}

.chart-type-btn.active {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-color: #3b82f6;
  color: white;
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

/* Leaderboard */
.leaderboard-content {
  padding: 2rem;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  gap: 1.5rem;
}

.leaderboard-item:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  transform: translateX(8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.rank-badge {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.rank-badge:nth-child(1) {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.rank-badge:nth-child(2) {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
}

.rank-badge:nth-child(3) {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.rank-badge:nth-child(n+4) {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.rank-ribbon {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-radius: 50%;
  border: 2px solid white;
}

.product-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-metrics {
  display: flex;
  gap: 2rem;
}

.metric {
  text-align: left;
}

.metric-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  display: block;
}

.metric-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.performance-bar {
  width: 120px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.percentage {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  min-width: 40px;
  text-align: right;
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

/* Action Buttons */
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
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-1px);
}

.refresh-btn:active {
  transform: translateY(0);
  background: #f8fafc;
}

/* Enhanced Responsive Design */
@media (max-width: 1200px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1024px) {
  .sales-reports {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .kpi-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .leaderboard-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .product-metrics {
    justify-content: space-between;
    width: 100%;
  }

  .performance-bar {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .sales-reports {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .title-wrapper {
    text-align: center;
  }

  .title-section h1 {
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

  .leaderboard-item {
    padding: 1rem;
  }

  .product-metrics {
    flex-direction: column;
    gap: 1rem;
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
  .title-section h1 {
    font-size: 1.5rem;
  }

  .kpi-value {
    font-size: 1.5rem;
  }

  .card-title h3 {
    font-size: 1.25rem;
  }

  .leaderboard-item {
    padding: 1rem;
  }

  .rank-badge {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>
