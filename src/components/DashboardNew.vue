<template>
  <div class="dashboard">
    <div v-if="!user" class="auth-message">
      <p>Please log in to view the dashboard</p>
          <router-link to="/login" class="login-btn" aria-label="Login to your account">Login</router-link>
    </div>
    
    <div v-else class="dashboard-container">
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Staff Dashboard</h1>
          <p class="subtitle">Overview of your hardware inventory</p>
        </div>
        <div class="date-filter">
          <div class="date-range-selector">
            <div class="date-inputs">
              <div class="date-input-group">
                <label>From:</label>
                <input
                  type="date"
                  v-model="startDate"
                  class="date-input"
                  :max="endDate"
                  @change="updateDateRange"
                />
              </div>
              <div class="date-input-group">
                <label>To:</label>
                <input
                  type="date"
                  v-model="endDate"
                  class="date-input"
                  :min="startDate"
                  :max="today"
                  @change="updateDateRange"
                />
              </div>
            </div>

            <div class="quick-filters">
              <button
                v-for="filter in quickFilters"
                :key="filter.label"
                :class="['filter-btn', { active: isActiveFilter(filter) }]"
                @click="applyQuickFilter(filter)"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <!-- Daily Orders Summary -->
        <button class="stat-card" aria-label="View today's orders summary">
          <div class="stat-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="stat-info">
            <h3>Today's Orders</h3>
            <p class="stat-value">{{ dailyOrdersCount }}</p>
            <span class="stat-amount">{{ formatPrice(dailyOrdersTotal) }}</span>
          </div>
        </button>

        <!-- Low Stock Alerts -->
        <button class="stat-card warning" v-if="lowStockCount > 0" aria-label="View low stock items">
          <div class="stat-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <h3>Low Stock Items</h3>
            <p class="stat-value">{{ lowStockCount }}</p>
            <span class="stat-change">Requires attention</span>
          </div>
        </button>

        <!-- Pending Orders -->
        <button class="stat-card" aria-label="View pending orders">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <h3>Pending Orders</h3>
            <p class="stat-value">{{ pendingOrdersCount }}</p>
            <span class="stat-change">Awaiting processing</span>
          </div>
        </button>

      </div>

      <!-- Top Selling Items and Inventory Breakdown -->
      <div class="top-section-grid">
        <div class="section-card">
          <div class="card-header">
            <h3>Most Ordered Items</h3>
          </div>
          <div class="date-range-info">
            <small class="date-info">
              Showing data for: {{ getCurrentDateRange() }}
            </small>
          </div>
          <div v-if="isLoadingTopSelling" class="loading-state">
            Loading top selling items...
          </div>
          <div v-else-if="topSellingError" class="error-state">
            {{ topSellingError }}
          </div>
          <div v-else-if="topSellingItems.length > 0" class="items-list">
            <div v-for="(item, index) in topSellingItems" :key="item.id" class="item-row">
              <div class="item-rank">
                <span class="rank-number">{{ index + 1 }}</span>
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.name || 'Unknown Product' }}</span>
                <span class="item-category">{{ item.category || 'Uncategorized' }}</span>
              </div>
              <div class="item-stats">
                <span class="item-quantity">{{ item.quantitySold || 0 }} sold</span>
                <span class="item-stock">
                  {{ item.currentStock || 0 }} in stock
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-state-content">
              <i class="fas fa-chart-bar"></i>
              <p>No top selling items found for this period.</p>
              <small>Try selecting a different date range or check if there are orders in the selected period.</small>
            </div>
          </div>
        </div>

        <div class="section-card">
          <div class="card-header">
            <h3>Inventory Breakdown</h3>
          </div>
          <div v-if="isLoadingInventory" class="loading-state">
            Loading inventory data...
          </div>
          <div v-else-if="inventoryError" class="error-state">
            {{ inventoryError }}
          </div>
          <div v-else-if="inventoryChartData.length > 0">
            <InventoryChart :inventoryData="inventoryChartData" :labels="inventoryChartLabels" />
          </div>
          <div v-else class="empty-state">
            No inventory data available.
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3>Sales Over Time</h3>
          <div v-if="isLoadingSales" class="loading-state">
            Loading sales data...
          </div>
          <div v-else-if="salesError" class="error-state">
            {{ salesError }}
          </div>
          <div v-else-if="salesChartData.length > 0">
            <SalesChart :salesData="salesChartData" :labels="salesChartLabels" />
          </div>
          <div v-else class="empty-state">
            No sales data available for this period.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useInventoryStore } from '../stores/inventoryStore'
import { formatDistanceToNow, subDays } from 'date-fns'

import { db } from '../firebase/config'
import SalesChart from './SalesChart.vue'
import InventoryChart from './InventoryChart.vue'

// Store initialization
const authStore = useAuthStore()
const inventoryStore = useInventoryStore()

// Local state
const selectedPeriod = ref('Today');
const isLoadingSales = ref(false);
const isLoadingInventory = ref(false);
const isLoadingTopSelling = ref(false);

// Date range state
const startDate = ref('');
const endDate = ref('');
const today = ref(new Date().toISOString().split('T')[0]);

// Quick filter options
const quickFilters = ref([
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'This Month', days: 30 }
]);

// Constants from store
const { LOW_STOCK_THRESHOLD } = inventoryStore

// Computed properties
const user = computed(() => authStore.user)
const dailyOrdersCount = computed(() => inventoryStore.getDailyOrdersCount)
const dailyOrdersTotal = computed(() => inventoryStore.getDailyOrdersTotal)
const lowStockCount = computed(() => inventoryStore.getLowStockCount)
const lowStockItems = computed(() => inventoryStore.lowStockItems)
const topSellingItems = computed(() => inventoryStore.topSellingItems)
const pendingOrdersCount = computed(() => {
  // Filter dailyOrders to count only those with status 'pending'
  return (inventoryStore.dailyOrders || []).filter(order => order.status === 'pending').length;
});

// Chart data
const salesChartData = ref([]);
const salesChartLabels = ref([]);
const inventoryChartData = ref([]);
const inventoryChartLabels = ref([]);
const salesError = ref(null);
const inventoryError = ref(null);
const topSellingError = ref(null);

// Methods
const getStartDate = (period) => {
  const today = new Date();
  if (period === 'Week') {
    return subDays(today, 6); // Last 7 days
  }
  return subDays(today, 0); // Just today
};

const fetchChartData = async () => {
  const today = new Date();
  const startDate = getStartDate(selectedPeriod.value);

  isLoadingSales.value = true;
  salesError.value = null;
  try {
    const sales = await inventoryStore.getSalesByPeriod(startDate, today);
    salesChartLabels.value = sales.map(s => s.date);
    salesChartData.value = sales.map(s => s.totalSales);
  } catch (error) {
    console.error("Error fetching sales data:", error);
    salesError.value = "Failed to load sales data.";
  } finally {
    isLoadingSales.value = false;
  }

  isLoadingInventory.value = true;
  inventoryError.value = null;
  try {
    const inventoryBreakdown = await inventoryStore.getInventoryBreakdown();
    inventoryChartLabels.value = inventoryBreakdown.map(item => item.category);
    inventoryChartData.value = inventoryBreakdown.map(item => item.totalStock);
  } catch (error) {
    console.error("Error fetching inventory breakdown:", error);
    inventoryError.value = "Failed to load inventory data.";
  } finally {
    isLoadingInventory.value = false;
  }
};

const fetchChartDataForDateRange = async (start, end) => {
  isLoadingSales.value = true;
  salesError.value = null;

  try {
    // For now, we'll use the existing method but with a broader date range
    // In a full implementation, you'd modify the store method to accept custom date ranges
    const sales = await inventoryStore.getSalesByPeriod(start, end);
    salesChartLabels.value = sales.map(s => s.date);
    salesChartData.value = sales.map(s => s.totalSales);
  } catch (error) {
    console.error("Error fetching sales data for date range:", error);
    salesError.value = "Failed to load sales data for selected date range.";
  } finally {
    isLoadingSales.value = false;
  }

  // Inventory data doesn't change with date range, so we keep the existing logic
  isLoadingInventory.value = true;
  inventoryError.value = null;
  try {
    const inventoryBreakdown = await inventoryStore.getInventoryBreakdown();
    inventoryChartLabels.value = inventoryBreakdown.map(item => item.category);
    inventoryChartData.value = inventoryBreakdown.map(item => item.totalStock);
  } catch (error) {
    console.error("Error fetching inventory breakdown:", error);
    inventoryError.value = "Failed to load inventory data.";
  } finally {
    isLoadingInventory.value = false;
  }
};

const changePeriod = async (period) => {
  selectedPeriod.value = period;
  isLoadingTopSelling.value = true;
  topSellingError.value = null;
  try {
    await inventoryStore.fetchTopSellingItems(period.toLowerCase());
  } catch (error) {
    console.error("Error fetching top selling items:", error);
    topSellingError.value = "Failed to load top selling items.";
  } finally {
    isLoadingTopSelling.value = false;
  }
  await fetchChartData();
};

// Calendar interface methods
const updateDateRange = async () => {
  if (startDate.value && endDate.value) {
    isLoadingTopSelling.value = true;
    isLoadingSales.value = true;
    topSellingError.value = null;
    salesError.value = null;

    try {
      // Fetch data for custom date range
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);

      // Update chart data with custom date range
      await fetchChartDataForDateRange(start, end);

      // Fetch top selling items for the selected date range
      await inventoryStore.fetchTopSellingItems('custom', startDate.value, endDate.value);
    } catch (error) {
      console.error("Error fetching data for date range:", error);
      topSellingError.value = "Failed to load data for selected date range.";
    } finally {
      isLoadingTopSelling.value = false;
      isLoadingSales.value = false;
    }
  }
};

const applyQuickFilter = (filter) => {
  const today = new Date();
  const daysToSubtract = filter.days;

  if (filter.days === 0) {
    // Today
    startDate.value = today.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
  } else {
    // Last N days
    const start = new Date(today);
    start.setDate(today.getDate() - daysToSubtract);
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = today.toISOString().split('T')[0];
  }

  updateDateRange();
};

const isActiveFilter = (filter) => {
  if (!startDate.value || !endDate.value) return false;

  const today = new Date();
  const filterStart = new Date(today);

  if (filter.days === 0) {
    // Today
    return startDate.value === today.toISOString().split('T')[0] &&
           endDate.value === today.toISOString().split('T')[0];
  } else {
    // Last N days
    filterStart.setDate(today.getDate() - filter.days);
    return startDate.value === filterStart.toISOString().split('T')[0] &&
           endDate.value === today.toISOString().split('T')[0];
  }
};

const formatPrice = (amount) => {
  if (amount === null || amount === undefined) {
    return '₱0.00'; // Or any default representation for undefined/null amounts
  }
  return amount.toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP'
  })
}

const formatTime = (timestamp) => {
  return formatDistanceToNow(timestamp, { addSuffix: true })
}

const formatDateRange = (start, end) => {
  if (!start || !end) return 'No period selected'

  try {
    const startFormatted = new Date(start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    const endFormatted = new Date(end).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    if (start === end) {
      return startFormatted
    }

    return `${startFormatted} - ${endFormatted}`
  } catch (error) {
    console.error('Error formatting date range:', error)
    return 'Invalid date range'
  }
}

const getCurrentDateRange = () => {
  return formatDateRange(startDate.value, endDate.value)
}

// Clean up sample orders
const cleanupSampleOrders = async () => {
  try {
    const removedCount = await inventoryStore.removeSampleOrders()
    if (removedCount > 0) {
      alert(`Successfully removed ${removedCount} sample orders from the database.`)
      // Refresh the page to update the orders list
      window.location.reload()
    } else {
      alert('No sample orders found to remove.')
    }
  } catch (error) {
    console.error('Error cleaning up sample orders:', error)
    alert('Error removing sample orders: ' + error.message)
  }
}




// Lifecycle hooks
onMounted(async () => {
  if (user.value) {
    // Initialize date inputs to "Today" by default
    const todayStr = today.value;
    startDate.value = todayStr;
    endDate.value = todayStr;

    inventoryStore.initializeInventoryListener();

    // Wait a bit for inventory to load before fetching top selling items
    setTimeout(async () => {
      isLoadingTopSelling.value = true;
      topSellingError.value = null;
      try {
        console.log("Dashboard: Fetching top selling items for today");
        await inventoryStore.fetchTopSellingItems('day');
        console.log("Dashboard: Top selling items fetched:", inventoryStore.topSellingItems);
      } catch (error) {
        console.error("Error fetching top selling items on mount:", error);
        topSellingError.value = "Failed to load top selling items.";
      } finally {
        isLoadingTopSelling.value = false;
      }
    }, 100);

    await fetchChartData();
  }
});
</script>

<style scoped>
.dashboard {
  padding: 1rem;
  margin: 0 auto;
  max-width: 1400px;
}

.dashboard-container {
  margin: 0 auto;
  padding: 1.5rem;
  max-width: 1400px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-content h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.header-content .subtitle {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.date-filter {
  display: flex;
  gap: 0.5rem;
  background: #fff;
  padding: 0.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Date Range Selector Styles */
.date-range-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  align-items: end;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  min-width: 140px;
}

.date-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  background: transparent;
  color: #7f8c8d;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.filter-btn.active {
  background: #3498db;
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Force 4 columns on larger screens */
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media (max-width: 1200px) { /* Adjust breakpoint as needed */
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Revert to auto-fit for smaller screens */
  }
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  border-left: 4px solid #f59e0b;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
  position: relative;
}


.stat-info {
  flex: 1;
}

.stat-info h3 {
  font-size: 0.875rem;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0.25rem 0;
  line-height: 1.2;
}

.stat-amount {
  color: #27ae60;
  font-size: 1.125rem;
  font-weight: 500;
  display: block;
  margin-top: 0.25rem;
}

.stat-change {
  font-size: 0.875rem;
  color: #7f8c8d;
  display: block;
  margin-top: 0.25rem;
}

.top-section-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr; /* Most Ordered Items smaller, Inventory Breakdown larger */
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 900px) { /* Adjust breakpoint as needed */
  .top-section-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Revert to auto-fit for smaller screens */
  }
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Force 2 columns on larger screens */
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 900px) { /* Adjust breakpoint as needed */
  .section-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Revert to auto-fit for smaller screens */
  }
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-card.warning {
  border-left: 4px solid #f39c12;
}

.section-card h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.date-range-info {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.date-info {
  color: #64748b;
  font-size: 0.8rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.item-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 50%;
  margin-right: 1rem;
}

.rank-number {
  font-weight: bold;
  font-size: 1.1rem;
  color: white;
}

.item-row:hover {
  background: #f1f3f5;
  transform: translateX(4px);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-weight: 500;
  color: #2c3e50;
}

.item-category {
  font-size: 0.875rem;
  color: #7f8c8d;
  text-transform: capitalize;
}

.item-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.item-quantity {
  font-weight: 500;
  color: #3498db;
}

.item-stock {
  font-size: 0.875rem;
  color: #27ae60;
}

.item-stock.low-stock,
.warning .item-stock {
  color: #e74c3c;
  font-weight: 500;
}









.auth-message {
  text-align: center;
  padding: 2rem;
}

.login-btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 0.375rem;
  margin-top: 1rem;
  transition: background-color 0.2s;
}

.login-btn:hover {
  background: #1d4ed8;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Force 2 columns on larger screens */
  gap: 1.5rem;
  margin-top: 2rem;
}
@media (max-width: 900px) { /* Adjust breakpoint as needed */
  .charts-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); /* Revert to auto-fit for smaller screens */
  }
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.chart-placeholder {
  height: 200px; /* Adjust as needed */
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  color: #7f8c8d;
}

.loading-state, .error-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.error-state {
  color: #e74c3c;
  font-weight: bold;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state-content i {
  font-size: 2rem;
  color: #cbd5e0;
}

.empty-state-content p {
  margin: 0;
  color: #4a5568;
  font-weight: 500;
}

.empty-state-content small {
  color: #a0aec0;
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Mobile Responsiveness */
@media (max-width: 1024px) {
  .dashboard {
    padding: 0.75rem;
  }

  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .top-section-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .section-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0.5rem;
  }

  .dashboard-container {
    padding: 0.75rem;
  }

  .dashboard-header {
    margin-bottom: 1rem;
  }

  .header-content h1 {
    font-size: 1.25rem;
  }

  .header-content .subtitle {
    font-size: 0.8rem;
  }

  .date-range-selector {
    width: 100%;
  }

  .date-inputs {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .date-input-group {
    flex: 1;
  }

  .date-input {
    width: 100%;
    min-width: auto;
  }

  .quick-filters {
    justify-content: center;
    gap: 0.25rem;
  }

  .filter-btn {
    flex: 1;
    padding: 0.4rem 1rem;
    font-size: 0.8rem;
    min-width: 80px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    padding: 1rem;
    gap: 1rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-amount {
    font-size: 1rem;
  }

  .section-card {
    padding: 1rem;
  }

  .section-card h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .item-row {
    padding: 0.75rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-card h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0.25rem;
  }

  .dashboard-container {
    padding: 0.5rem;
  }

  .header-content h1 {
    font-size: 1.1rem;
  }

  .header-content .subtitle {
    font-size: 0.75rem;
  }

  .date-filter {
    padding: 0.2rem;
    gap: 0.25rem;
  }

  .filter-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
  }

  .stat-card {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .stat-info h3 {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-amount {
    font-size: 0.9rem;
  }

  .stat-change {
    font-size: 0.75rem;
  }

  .section-card {
    padding: 0.75rem;
  }

  .section-card h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .item-row {
    padding: 0.5rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .item-info {
    gap: 0.2rem;
  }

  .item-name {
    font-size: 0.9rem;
  }

  .item-category {
    font-size: 0.8rem;
  }

  .item-stats {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    width: 100%;
    justify-content: space-between;
  }

  .item-quantity,
  .item-stock {
    font-size: 0.8rem;
  }

  .chart-card {
    padding: 0.75rem;
  }

  .chart-card h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    padding: 1rem;
    font-size: 0.9rem;
  }
}

.demo-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #10b981;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.demo-btn:hover {
  background: #059669;
}
</style>
