<template>
  <div class="sales-reports">
    <div class="page-header">
      <h1>Sales Report</h1>
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
      <!-- Orders Summary -->
      <div class="report-card">
        <div class="card-header">
          <h2>Orders Summary</h2>
          <span class="period">{{ formatDateRange }}</span>
        </div>
        <div class="card-content">
          <canvas ref="ordersChart"></canvas>
          <div class="summary-stats">
            <div class="stat">
              <span class="label">Total Orders</span>
              <span class="value">{{ totalOrders }}</span>
            </div>
            <div class="stat">
              <span class="label">Total Revenue</span>
              <span class="value">₱{{ formatPrice(totalRevenue) }}</span>
            </div>
            <div class="stat">
              <span class="label">Average Order Value</span>
              <span class="value">₱{{ formatPrice(averageOrderValue) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Best Selling Products -->
      <div class="report-card">
        <div class="card-header">
          <h2>Best Selling Products</h2>
          <select v-model="topProductsLimit">
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="20">Top 20</option>
          </select>
        </div>
        <div class="card-content">
          <div class="products-list">
            <div v-for="product in topProducts" :key="product.id" class="product-row">
              <div class="product-info">
                <span class="product-name">{{ product.name }}</span>
                <span class="product-category">{{ product.category }}</span>
              </div>
              <div class="product-stats">
                <div class="stat">
                  <span class="label">Sold</span>
                  <span class="value">{{ product.quantitySold }}</span>
                </div>
                <div class="stat">
                  <span class="label">Revenue</span>
                  <span class="value">₱{{ formatPrice(product.revenue) }}</span>
                </div>
              </div>
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

// Chart instances
let ordersChartInstance = null

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

  ordersChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: '#2563eb',
        backgroundColor: '#dbeafe',
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: reportPeriod.value === 'monthly' ? 'month' : 
                  reportPeriod.value === 'weekly' ? 'week' : 'day'
          }
        },
        y: {
          beginAtZero: true
        }
      }
    }
  })
}


const exportToPdf = () => {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text('Sales Report', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Period: ${formatDateRange.value}`, 20, 30)

  doc.setFontSize(16)
  doc.text('Summary', 20, 45)
  
  doc.setFontSize(12)
  doc.text([
    `Total Orders: ${totalOrders.value}`,
    `Total Revenue: ₱${formatPrice(totalRevenue.value)}`,
    `Average Order Value: ₱${formatPrice(averageOrderValue.value)}`
  ], 20, 55)

  doc.setFontSize(16)
  doc.text('Best Selling Products', 20, 85)

  autoTable(doc, {
    startY: 90,
    head: [['Product', 'Category', 'Quantity', 'Revenue']],
    body: topProducts.value.map(product => [
      product.name,
      product.category,
      product.quantitySold,
      `₱${formatPrice(product.revenue)}`
    ])
  })

  doc.save(`sales_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

// Watchers
watch([dateRange, reportPeriod], () => {
  updateOrdersChart()
})

// Lifecycle
onMounted(() => {
  updateOrdersChart()
})
</script>

<style scoped>
/* Re-using styles from Reports.vue, adjust as needed */
.sales-reports {
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

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
  color: #1f2937;
}

.product-category {
  font-size: 0.875rem;
  color: #6b7280;
}

.product-stats {
  display: flex;
  gap: 2rem;
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
  .sales-reports {
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

  .product-stats {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  }
}
</style>
