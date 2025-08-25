import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../firebase/config'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  increment
} from 'firebase/firestore'
import { startOfDay, endOfDay } from 'date-fns'

export const useInventoryStore = defineStore('inventory', () => {
  // State
  const inventory = ref([])
  const lowStockItems = ref([])
  const dailyOrders = ref([])
  const topSellingItems = ref([])
  const notifications = ref([])
  const loading = ref(false)
  const categories = ref(['cement', 'lumber', 'tools', 'paint', 'electrical', 'plumbing'])

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
    const inventoryQuery = query(collection(db, 'inventory'))
    
    onSnapshot(inventoryQuery, (snapshot) => {
      inventory.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      updateStockAlerts()
    })

    // Listen for new orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    onSnapshot(ordersQuery, (snapshot) => {
      console.log("Fetched orders:", snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      dailyOrders.value = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
    })
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
      
      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', start),
        orderBy('createdAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

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
      await addDoc(collection(db, 'alerts'), {
        productId,
        type,
        message,
        createdAt: serverTimestamp(),
        isRead: false
      })
    } catch (error) {
      console.error('Error creating stock alert:', error)
    }
  }

  const processOrder = async (orderItems) => {
    const batch = writeBatch(db)
    
    try {
      // Process each item in the order
      for (const item of orderItems) {
        const productRef = doc(db, 'inventory', item.id)
        const product = inventory.value.find(p => p.id === item.id)
        
        if (!product || product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}`)
        }
        
        // Update stock
        batch.update(productRef, {
          currentStock: increment(-item.quantity),
          lastUpdated: serverTimestamp()
        })
        
        // Check if low stock alert needed
        const newStock = product.currentStock - item.quantity
        if (newStock <= LOW_STOCK_THRESHOLD) {
          await createStockAlert(item.id, 'low_stock', 
            `${item.name} is running low (${newStock} remaining)`)
        }
      }
      
      await batch.commit()
    } catch (error) {
      console.error('Error processing order:', error)
      throw error
    }
  }

  const getSalesByPeriod = async (startDate, endDate) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    console.log("Fetching sales data from:", startDate, "to:", endDate);
    const salesByDate = {};
      orders.forEach(order => {
        const orderDate = order.createdAt.toDate().toLocaleDateString('en-US'); // Assuming createdAt is a Firestore Timestamp
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
      // Assuming 'inventory' collection has a 'category' field
      const q = query(collection(db, 'inventory'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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
  };

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
