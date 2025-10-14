import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../supabase/supabaseClient'
import { startOfDay, endOfDay } from 'date-fns'

export const useInventoryStore = defineStore('inventory', () => {
  // State
  const inventory = ref([])
  const lowStockItems = ref([])
  const dailyOrders = ref([])
  const topSellingItems = ref([])
  const notifications = ref([])
  const loading = ref(false)
  const categories = ref([]) // Initialize as empty, will be populated from DB

  // Constants
  const LOW_STOCK_THRESHOLD = 10

  // Computed properties
  const totalProducts = computed(() => inventory.value.length)
  const getLowStockCount = computed(() => lowStockItems.value.length)
  const getDailyOrdersCount = computed(() => dailyOrders.value.length)
  const getDailyOrdersTotal = computed(() => {
    return dailyOrders.value.reduce((total, order) => total + order.total, 0)
  })

  // Initialize inventory and notifications
  const initializeInventoryListener = () => {
    db.from('inventory')
      .on('*', payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedItem = { id: payload.new.id, ...payload.new };
          const index = inventory.value.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            inventory.value[index] = updatedItem;
          } else {
            inventory.value.push(updatedItem);
          }
        } else if (payload.eventType === 'DELETE') {
          inventory.value = inventory.value.filter(item => item.id !== payload.old.id);
        }
        updateStockAlerts();
        fetchCategories();
      })
      .subscribe();

    // Listen for new orders
    db.from('orders')
      .on('*', payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = { id: payload.new.id, ...payload.new };
          const index = dailyOrders.value.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            dailyOrders.value[index] = updatedOrder;
          } else {
            dailyOrders.value.unshift(updatedOrder); // Add new orders to the beginning
          }
        } else if (payload.eventType === 'DELETE') {
          dailyOrders.value = dailyOrders.value.filter(order => order.id !== payload.old.id);
        }
        console.log("Fetched orders:", dailyOrders.value.map(order => ({ id: order.id, ...order })));
      })
      .subscribe();
  }

  // Handle low stock items
  const onLowStockItems = (callback) => {
    return watch(lowStockItems, (items) => {
      callback(items)
    })
  }

  // Update stock alerts and notifications
  const updateStockAlerts = () => {
    lowStockItems.value = inventory.value.filter(item => 
      item.currentStock > 0 && item.currentStock <= LOW_STOCK_THRESHOLD
    )
    
    // Create notifications for low stock items
    lowStockItems.value.forEach(item => {
      addNotification({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${item.name} - only ${item.currentStock} left in stock`,
        severity: 'warning'
      })
    })
  }

  // Fetch top selling items
  const fetchTopSellingItems = async (timeRange = 'day') => {
    try {
      loading.value = true
      const start = timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : startOfDay(new Date())
      
      const { data: orders, error } = await db
        .from('orders')
        .select('*')
        .gte('createdAt', start.toISOString())
        .order('createdAt', { ascending: false })
        .limit(100); // Assuming a limit similar to the initial listener

      if (error) throw error;

      // Calculate most ordered items
      const itemCounts = {}
      orders.forEach(order => {
        order.items?.forEach(item => {
          itemCounts[item.productId] = (itemCounts[item.productId] || 0) + item.quantity
        })
      })

      // Get top 5 items
      const topItemIds = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id)

      topSellingItems.value = inventory.value
        .filter(item => topItemIds.includes(item.id))
        .map(item => ({
          ...item,
          quantitySold: itemCounts[item.id]
        }))
    } catch (error) {
      console.error('Error fetching top selling items:', error)
    } finally {
      loading.value = false
    }
  }

  // Notification management
  const addNotification = (notification) => {
    notifications.value.unshift({
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    })
  }

  const markNotificationAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  const createStockAlert = async (productId, type, message) => {
    try {
      const { error } = await db.from('alerts').insert({
        productId,
        type,
        message,
        createdAt: new Date().toISOString(),
        isRead: false
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error creating stock alert:', error)
    }
  }

  const processOrder = async (orderId, orderItems) => {
    // Accepts orderId for idempotency. If called with only items (legacy), shift params.
    if (!orderItems && Array.isArray(orderId)) {
      orderItems = orderId
      orderId = null
    }

    // If orderId provided, we'll check below whether it's already processed

    const lowStockAlerts = []
    try {
      // If orderId provided, attempt to read order and short-circuit if processed
      if (orderId) {
        const { data: existingOrder, error: fetchError } = await db.from('orders').select('processed').eq('id', orderId).single();
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116 means no rows found
        if (existingOrder && existingOrder.processed) {
          // Already processed — nothing to do
          return;
        }
      }

      // Process each item in the order
      for (const item of orderItems) {
        const product = inventory.value.find(p => p.id === item.id);
        if (!product || product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        const newStock = product.currentStock - item.quantity;
        const { error: updateError } = await db.from('inventory')
          .update({ currentStock: newStock, lastUpdated: new Date().toISOString() })
          .eq('id', item.id);
        if (updateError) throw updateError;

        if (newStock <= LOW_STOCK_THRESHOLD) {
          lowStockAlerts.push({ id: item.id, name: item.name, newStock });
        }
      }

      // Mark order processed if orderId supplied
      if (orderId) {
        const { error: updateOrderError } = await db.from('orders')
          .update({ processed: true, processedAt: new Date().toISOString() })
          .eq('id', orderId);
        if (updateOrderError) throw updateOrderError;
      }

      // Create low stock alerts after commit for atomicity
      for (const alert of lowStockAlerts) {
        try {
          await createStockAlert(alert.id, 'low_stock', `${alert.name} is running low (${alert.newStock} remaining)`)
        } catch (e) {
          console.error('Error creating stock alert during processing:', e)
        }
      }
    } catch (error) {
      console.error('Error processing order:', error)
      throw error
    }
  }

  const getSalesByPeriod = async (startDate, endDate) => {
    try {
      const { data: orders, error } = await db
        .from('orders')
        .select('*')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString())
        .order('createdAt', { ascending: true });

      if (error) throw error;

      console.log("Fetching sales data from:", startDate, "to:", endDate);
      const salesByDate = {};
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-US');
        if (!salesByDate[orderDate]) {
          salesByDate[orderDate] = 0;
        }
        salesByDate[orderDate] += order.total;
      });

      return Object.keys(salesByDate).map(date => ({
        date,
        totalSales: salesByDate[date]
      }));
    } catch (error) {
      console.error('Error fetching sales by period:', error);
      throw error;
    }
  };

  const getProfitLoss = (startDate, endDate) => {
    const totalRevenue = inventory.value.reduce((sum, item) => {
      return sum + (item.price * (item.sold || 0))
    }, 0)

    const totalCost = inventory.value.reduce((sum, item) => {
      return sum + (item.cost * (item.sold || 0))
    }, 0)

    return {
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost,
        margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0
    }
  }

  const getInventoryBreakdown = async () => {
    try {
      const { data: items, error } = await db.from('inventory').select('*');
      if (error) throw error;

      const breakdownMap = {};
      categories.value.forEach(category => {
        breakdownMap[category] = 0;
      });

      items.forEach(item => {
        if (item.category && breakdownMap.hasOwnProperty(item.category)) {
          breakdownMap[item.category] += item.currentStock;
        }
      });

      return Object.keys(breakdownMap).map(category => ({
        category,
        totalStock: breakdownMap[category]
      }));
    } catch (error) {
      console.error('Error fetching inventory breakdown:', error);
      throw error;
    }
  }

  // Fetch unique categories from inventory
  const fetchCategories = async () => {
    try {
      const { data, error } = await db.from('inventory').select('category');
      if (error) throw error;

      const uniqueCategories = new Set();
      data.forEach(item => {
        if (item.category) {
          uniqueCategories.add(item.category);
        }
      });
      categories.value = Array.from(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  return {
    inventory,
    lowStockItems,
    dailyOrders,
    topSellingItems,
    notifications,
    loading,
    categories,
    totalProducts,
    getLowStockCount,
    getDailyOrdersCount,
    getDailyOrdersTotal,
    initializeInventoryListener,
    updateStockAlerts,
    onLowStockItems,
    processOrder,
    getSalesByPeriod,
    getProfitLoss,
    createStockAlert,
    fetchTopSellingItems,  // Added this function
    getInventoryBreakdown
  }
})
