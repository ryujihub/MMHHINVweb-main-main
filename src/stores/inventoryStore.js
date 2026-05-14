import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '../firebase/config'
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
  const categories = ref([]) // Initialize as empty, will be populated from DB

  // Constants
  // LOW_STOCK_THRESHOLD removed as requested

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
      fetchCategories() // Fetch categories after inventory is loaded
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
    // Removed threshold-based filtering as requested
    lowStockItems.value = []

    // No notifications will be created since lowStockItems is empty
  }

  // Fetch top selling items (supports custom date ranges)
  const fetchTopSellingItems = async (timeRange = 'day', customStartDate = null, customEndDate = null) => {
    try {
      loading.value = true
      let start, end

      if (customStartDate && customEndDate) {
        // Use custom date range
        start = new Date(customStartDate)
        end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999) // End of day
      } else {
        // Use predefined time range
        end = new Date()
        end.setHours(23, 59, 59, 999) // End of today

        if (timeRange === 'week') {
          start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        } else {
          start = startOfDay(new Date()) // Start of today
        }
      }

      console.log('Fetching top selling items for period:', { start, end, timeRange })

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', start),
        where('createdAt', '<=', end),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      console.log('Found orders:', orders.length)

      // Calculate most ordered items
      const itemCounts = {}
      const itemDetails = {} // Store item details for later matching

      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            // Try different possible field names for product ID
            const productId = item.productId || item.id || item.productID
            const productName = item.name || item.productName || 'Unknown Product'

            if (productId && item.quantity) {
              if (!itemCounts[productId]) {
                itemCounts[productId] = 0
                itemDetails[productId] = {
                  name: productName,
                  category: item.category || 'Uncategorized',
                  price: item.price || 0
                }
              }
              itemCounts[productId] += item.quantity
            }
          })
        }
      })

      console.log('Item counts:', itemCounts)
      console.log('Item details:', itemDetails)
      console.log('Available inventory items:', inventory.value.map(item => ({ id: item.id, name: item.name, category: item.category })))

      // Get top 5 items
      const topItems = Object.entries(itemCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([productId, quantitySold]) => {
          // Try to find matching inventory item
          let inventoryItem = null
          if (inventory.value.length > 0) {
            inventoryItem = inventory.value.find(inv =>
              inv.id === productId ||
              inv.productId === productId ||
              inv.id === productId
            )
          }

          if (inventoryItem) {
            return {
              ...inventoryItem,
              quantitySold
            }
          } else {
            // If not found in loaded inventory, fetch it directly
            return {
              id: productId,
              quantitySold,
              name: 'Unknown Product',
              category: 'Uncategorized',
              currentStock: 0
            }
          }
        })

      // Try to enrich unknown products by fetching fresh inventory data
      if (topItems.some(item => item.name === 'Unknown Product')) {
        try {
          const inventorySnapshot = await getDocs(collection(db, 'inventory'))
          const inventoryData = inventorySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          topSellingItems.value = topItems.map(item => {
            if (item.name === 'Unknown Product') {
              // Try ID-based matching first
              let inventoryItem = inventoryData.find(inv =>
                inv.id === item.id ||
                inv.productId === item.id
              )

              // If no ID match, try name-based matching using stored item details
              if (!inventoryItem && itemDetails[item.id]) {
                inventoryItem = inventoryData.find(inv =>
                  inv.name === itemDetails[item.id].name ||
                  (inv.name && inv.name.toLowerCase() === itemDetails[item.id].name.toLowerCase())
                )
              }

              if (inventoryItem) {
                return {
                  ...inventoryItem,
                  quantitySold: item.quantitySold
                }
              }
            }
            return item
          })
        } catch (error) {
          console.error('Error fetching inventory for enrichment:', error)
          topSellingItems.value = topItems
        }
      } else {
        topSellingItems.value = topItems
      }

      console.log('Top selling items:', topSellingItems.value)
    } catch (error) {
      console.error('Error fetching top selling items:', error)
      topSellingItems.value = []
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

  const processOrder = async (orderId, orderItems) => {
    // Accepts orderId for idempotency. If called with only items (legacy), shift params.
    if (!orderItems && Array.isArray(orderId)) {
      orderItems = orderId
      orderId = null
    }

    // If orderId provided, we'll check below whether it's already processed

    const batch = writeBatch(db)
    try {
      // If orderId provided, attempt to read order and short-circuit if processed
      if (orderId) {
        const orderRef = doc(db, 'orders', orderId)
        const orderSnapshot = await getDoc(orderRef)
        if (orderSnapshot && typeof orderSnapshot.exists === 'function' && orderSnapshot.exists()) {
          const data = orderSnapshot.data()
          if (data && data.processed) {
            // Already processed — nothing to do
            return
          }
        }
      }

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
        // Low stock alerts removed as requested
      }

      // Mark order processed in the same batch if orderId supplied
      if (orderId) {
        const orderRef = doc(db, 'orders', orderId)
        batch.update(orderRef, {
          processed: true,
          processedAt: serverTimestamp()
        })
      }

      await batch.commit()
    } catch (error) {
      console.error('Error processing order:', error)
      throw error
    }
  }

  const restoreStock = async (orderId, orderItems) => {
    const batch = writeBatch(db)
    try {
      // If orderId provided, we'll check if it was processed
      if (orderId) {
        const orderRef = doc(db, 'orders', orderId)
        const orderSnapshot = await getDoc(orderRef)
        if (orderSnapshot.exists()) {
          const data = orderSnapshot.data()
          if (!data.processed) {
            // Not processed, so stock was never deducted
            return
          }
        }
      }

      // Restore each item in the order
      for (const item of orderItems) {
        const productRef = doc(db, 'inventory', item.id)
        batch.update(productRef, {
          currentStock: increment(item.quantity || 1),
          lastUpdated: serverTimestamp()
        })
      }

      // Mark order as not processed (or we'll delete it soon anyway)
      if (orderId) {
        const orderRef = doc(db, 'orders', orderId)
        batch.update(orderRef, {
          processed: false,
          processedAt: null,
          restoredAt: serverTimestamp()
        })
      }

      await batch.commit()
    } catch (error) {
      console.error('Error restoring stock:', error)
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
    console.log("Found orders for sales:", orders.length);
    const salesByDate = {};
      orders.forEach(order => {
        let orderDate;
        if (order.createdAt && order.createdAt.toDate) {
          // Firestore Timestamp
          orderDate = order.createdAt.toDate().toLocaleDateString('en-US');
        } else if (order.createdAt instanceof Date) {
          // JavaScript Date
          orderDate = order.createdAt.toLocaleDateString('en-US');
        } else if (typeof order.createdAt === 'string') {
          // String date
          orderDate = new Date(order.createdAt).toLocaleDateString('en-US');
        } else {
          console.warn("Unknown date format for order:", order.id, order.createdAt);
          return;
        }

        if (!salesByDate[orderDate]) {
          salesByDate[orderDate] = 0;
        }
        salesByDate[orderDate] += order.total || 0;
      });

      console.log("Sales by date:", salesByDate);

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
  }

  // Fetch unique categories from inventory
  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'inventory'))
      const snapshot = await getDocs(q)
      const uniqueCategories = new Set()
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.category) {
          uniqueCategories.add(data.category)
        }
      })
      categories.value = Array.from(uniqueCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Remove sample orders from database
  const removeSampleOrders = async () => {
    try {
      const q = query(collection(db, 'orders'))
      const snapshot = await getDocs(q)
      const sampleOrders = snapshot.docs.filter(doc => {
        const orderId = doc.id.toLowerCase()
        const data = doc.data()
        return orderId.includes('sample') ||
               (data.id && data.id.toLowerCase().includes('sample')) ||
               (data.customer && data.customer.name && data.customer.name.toLowerCase().includes('sample'))
      })

      if (sampleOrders.length === 0) {
        console.log('No sample orders found')
        return 0
      }

      const batch = writeBatch(db)
      sampleOrders.forEach(orderDoc => {
        batch.delete(orderDoc.ref)
      })

      await batch.commit()
      console.log(`Removed ${sampleOrders.length} sample orders`)
      return sampleOrders.length
    } catch (error) {
      console.error('Error removing sample orders:', error)
      throw error
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
    restoreStock,
    getSalesByPeriod,
    getProfitLoss,
    createStockAlert,
    fetchTopSellingItems,  // Added this function
    getInventoryBreakdown,
    removeSampleOrders  // Added this function
  }
})
