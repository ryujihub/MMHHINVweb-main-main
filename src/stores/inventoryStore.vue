import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  onSnapshot,
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  increment,
  runTransaction
} from 'firebase/firestore';
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

  // Get available stock (current - reserved)
  const getAvailableStock = async (productId) => {
    try {
      // Get current product
      const product = inventory.value.find(p => p.id === productId)
      if (!product) {
        console.warn(`Product ${productId} not found`)
        return 0
      }

      // Get reserved stock from pending orders
      const reservedQuery = query(
        collection(db, 'orders'),
        where('status', '==', 'pending'),
        where('processed', '==', false)
      )
      
      const snapshot = await getDocs(reservedQuery)
      const pendingOrders = snapshot.docs.map(doc => doc.data())
      
      // Calculate total reserved quantity
      const reservedQuantity = pendingOrders.reduce((total, order) => {
        const item = order.items.find(i => i.id === productId)
        return total + (item?.quantity || 0)
      }, 0)

      return Math.max(0, product.currentStock - reservedQuantity)
    } catch (error) {
      console.error('Error getting available stock:', error)
      throw error
    }
  }

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
      });
    } catch (error) {
      console.error('Error creating stock alert:', error);
    }
  };

  // Reserve stock for a new order
  const reserveStockForOrder = async (orderId, items) => {
    try {
      await runTransaction(db, async (transaction) => {
        // Verify all items are available first
        for (const item of items) {
          const productRef = doc(db, 'inventory', item.id)
          const productDoc = await transaction.get(productRef)
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.id} not found`)
          }
          
          const product = productDoc.data()
          const availableStock = await getAvailableStock(item.id)
          
          if (availableStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${availableStock}`)
          }
        }

        // Create stock movement records for reservations
        for (const item of items) {
          const movementRef = doc(collection(db, 'stockMovements'))
          transaction.set(movementRef, {
            productId: item.id,
            orderId,
            quantity: -item.quantity,
            type: 'stock_reserved',
            timestamp: serverTimestamp(),
            notes: `Reserved for order ${orderId}`
          })
        }

        // Update order status to indicate stock is reserved
        const orderRef = doc(db, 'orders', orderId)
        transaction.update(orderRef, {
          stockReserved: true,
          reservedAt: serverTimestamp()
        })
      })
    } catch (error) {
      console.error('Error reserving stock:', error)
      throw error
    }
  }

  const processOrder = async (orderId, orderItems) => {
    if (!orderItems || !orderId) {
      throw new Error('Order ID and items are required')
    }

    try {
      return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        if (orderData.processed || orderData.status === 'completed') {
          return false; // Already processed
        }

        // Process each item in the order
        for (const item of orderItems) {
          const productRef = doc(db, 'inventory', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.id} not found`);
          }

          // Update inventory
          transaction.update(productRef, {
            currentStock: increment(-item.quantity),
            lastUpdated: serverTimestamp()
          });

          // Record final stock movement
          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            productId: item.id,
            orderId,
            quantity: -item.quantity,
            type: 'order_completed',
            timestamp: serverTimestamp(),
            notes: `Order ${orderId} completed`
          });
        }

        // Mark order as completed
        transaction.update(orderRef, {
          status: 'completed',
          processed: true,
          processedAt: serverTimestamp()
        });

        return true;
      })
    } catch (error) {
      console.error('Error processing order:', error)
      throw error
    }
  }

  }); // Close the runTransaction from processOrder

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
    };
  };

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
    getAvailableStock,
    reserveStockForOrder,
    getSalesByPeriod,
    getProfitLoss,
    createStockAlert,
    fetchTopSellingItems,
    getInventoryBreakdown
  };
});
