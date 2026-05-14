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
          <div class="date-inputs-inline">
            <div class="date-input-group">
              <label for="start-date">From:</label>
              <div class="date-input-wrapper">
                <input
                  id="start-date"
                  type="date"
                  v-model="startDate"
                  class="date-input-compact"
                  :max="endDate"
                  @change="updateDateRange"
                />
                <i class="fas fa-calendar-alt date-icon"></i>
              </div>
            </div>
            <div class="date-input-group">
              <label for="end-date">To:</label>
              <div class="date-input-wrapper">
                <input
                  id="end-date"
                  type="date"
                  v-model="endDate"
                  class="date-input-compact"
                  :min="startDate"
                  :max="today"
                  @change="updateDateRange"
                />
                <i class="fas fa-calendar-alt date-icon"></i>
              </div>
            </div>
          </div>

          <div class="quick-filters-inline">
            <div class="filter-buttons-compact">
              <button
                v-for="filter in quickFilters"
                :key="filter.label"
                :class="['filter-btn-compact', { active: isActiveFilter(filter) }]"
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

      <!-- Check-in/Check-out Section -->
      <div class="check-in-out-section" v-if="user">
        <CheckInOutWidget />
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
import { useCheckInOutStore } from '../stores/checkInOutStore'
import { formatDistanceToNow, subDays } from 'date-fns'

import { db } from '../firebase/config'
import SalesChart from './SalesChart.vue'
import InventoryChart from './InventoryChart.vue'
import CheckInOutWidget from './CheckInOutWidget.vue'

// Store initialization
const authStore = useAuthStore()
const inventoryStore = useInventoryStore()
const checkInOutStore = useCheckInOutStore()

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

    // Initialize stores
    inventoryStore.initializeInventoryListener();
    await checkInOutStore.initializeCheckInStatus();

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
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  flex-wrap: wrap;
}

.date-filter {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  background: white;
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
}

.date-inputs-inline {
  display: flex;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.date-input-compact {
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.025em;
  margin-bottom: 0.5rem;
}

.header-content .subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Stats Cards Section */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: white;
  padding: 1.75rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-light);
}

.stat-card.warning {
  border-left: 4px solid var(--warning-color);
}

.stat-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 8px 16px -4px rgba(79, 70, 229, 0.2);
}

.stat-card.warning .stat-icon {
  background: linear-gradient(135deg, var(--warning-color), #fbbf24);
  box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.2);
}

.stat-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-amount {
  font-size: 1rem;
  font-weight: 600;
  color: var(--success-color);
}

/* Sections & Tables */
.top-section-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.section-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-medium);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.item-row:hover {
  background: #edf2f7;
  transform: scale(1.01);
}

.item-rank {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--primary-color);
  margin-right: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.item-category {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.item-stats {
  text-align: right;
}

.item-quantity {
  display: block;
  font-weight: 700;
  color: var(--primary-color);
}

.item-stock {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

/* Date Range Info */
.date-range-info {
  margin-bottom: 1rem;
  padding: 0.5rem 0.75rem;
  background: var(--primary-light);
  color: white;
  border-radius: var(--radius-sm);
  display: inline-block;
}

.date-info {
  font-weight: 500;
}

.section-card {
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.section-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--accent-color);
}

.section-card:hover::before {
  transform: scaleX(1);
}

.section-card.warning {
  border-left: 4px solid var(--warning-color);
}

.section-card.warning::before {
  background: linear-gradient(90deg, var(--warning-color), var(--warning-light));
}

.section-card h3 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  gap: var(--space-2);
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
  background: var(--surface-primary);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-primary);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-light));
  transform: scaleX(0);
  transition: transform var(--transition-normal);
}

.chart-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--accent-color);
}

.chart-card:hover::before {
  transform: scaleX(1);
}

.chart-card h3 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

/* Quick Filter Buttons */
.quick-filters-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 700;
  text-transform: uppercase;
}

.filter-btn,
.filter-btn-compact {
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--border-medium);
  background: white;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-btn:hover,
.filter-btn-compact:hover {
  background: var(--background-secondary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.filter-btn.active,
.filter-btn-compact.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* Date Range Selector */
.date-range-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input {
  padding: 0.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.date-icon {
  position: absolute;
  right: 0.5rem;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  pointer-events: none;
}

/* Section Grid */
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

/* --- RESPONSIVE BREAKPOINTS --- */

/* Tablet */
@media (max-width: 1024px) {
  .dashboard {
    padding: 0.75rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .date-filter {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .top-section-grid,
  .section-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Phone */
@media (max-width: 768px) {
  .dashboard {
    padding: 0.5rem;
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

  /* Date filter stacks vertically */
  .date-filter {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .date-inputs-inline {
    flex-direction: column;
    gap: 0.75rem;
  }

  .date-input-compact {
    width: 100%;
    min-width: auto;
    max-width: none;
    font-size: 16px; /* prevents iOS zoom */
  }

  .date-inputs {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .date-range-selector {
    width: 100%;
  }

  .date-input-group {
    flex: 1;
  }

  .date-input {
    width: 100%;
    min-width: auto;
  }

  .quick-filters,
  .quick-filters-inline {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .filter-btn,
  .filter-btn-compact {
    flex: 1;
    min-width: 70px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    text-align: center;
  }

  /* Stats */
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
    width: 48px;
    height: 48px;
    font-size: 1.25rem;
    border-radius: 12px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-amount {
    font-size: 0.95rem;
  }

  /* Cards */
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

/* Small phones */
@media (max-width: 480px) {
  .dashboard {
    padding: 0.25rem;
  }

  .header-content h1 {
    font-size: 1.1rem;
  }

  .header-content .subtitle {
    font-size: 0.75rem;
  }

  .date-filter {
    padding: 0.5rem;
  }

  .filter-btn,
  .filter-btn-compact {
    padding: 0.4rem 0.6rem;
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
    border-radius: 10px;
  }

  .stat-info h3 {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-amount {
    font-size: 0.85rem;
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

  .item-info { gap: 0.2rem; }
  .item-name { font-size: 0.9rem; }
  .item-category { font-size: 0.8rem; }

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

/* Check-in/Check-out Section */
.check-in-out-section {
  margin-bottom: 2rem;
}

.check-in-out-section .section-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
}

.check-in-out-section .section-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
  transition: all 0.3s ease;
}
</style>
