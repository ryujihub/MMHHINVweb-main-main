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
  const inventoryError = ref(null); // New error state for inventory fetching
  const isInitialized = ref(false); // Track if listener is already initialized

  // Constants
  const LOW_STOCK_THRESHOLD = 10

  // Computed properties
  const totalProducts = computed(() => inventory.value.length)
  const getLowStockCount = computed(() => lowStockItems.value.length)
  const getDailyOrdersCount = computed(() => dailyOrders.value.length)
  const getDailyOrdersTotal = computed(() => {
    return dailyOrders.value.reduce((total, order) => total + order.total, 0)
  })

  // Helper to map Supabase data to store format
  const mapInventoryItem = (item) => {
    console.log('Mapping item:', item);
    console.log('Item fields:', Object.keys(item));

    // Map the actual database fields to expected format
    const mappedItem = {
      id: item.id,
      name: item.name || item.productName || `Product ${item.flctCode || item.id}`,
      description: item.description || '',
      price: item.price || item.sellingPrice || item.unitPrice || 0,
      cost: item.cost || item.purchasePrice || 0,
      currentStock: item.currentStock || item.physicalCount || item.stock || 0,
      minimumStock: item.minimumStock || item.targetStockLevel || item.minStock || 10,
      reorderPoint: Math.floor((item.minimumStock || item.targetStockLevel || item.minStock || 10) * 0.2) || 5,
      category: item.category || 'Uncategorized',
      productCode: item.productCode || item.flctCode || item.code || item.id,
      sku: item.sku || item.productCode || item.flctCode || '',
      unit: item.unit || 'pcs',
      inventoryVariance: item.inventoryVariance || 0,
      variancePercentage: item.variancePercentage || 0,
      usage: item.usage || 0,
      lastUpdated: item.lastUpdated || item.updatedAt,
      createdAt: item.createdAt,
      userId: item.userId
    };

    console.log('Mapped item:', mappedItem);
    return mappedItem;
  };

  // Initialize inventory and notifications
  const initializeInventoryListener = async () => {
    // Prevent multiple initializations
    if (isInitialized.value) {
      console.log('Inventory listener already initialized, skipping...');
      return;
    }

    console.log('Attempting to initialize inventory listener...');
    isInitialized.value = true;

    try {
      // Fetch initial inventory data
      console.log('Fetching initial inventory data from hardwareinventory table...');

      // First, let's check what tables are available
      try {
        const { data: tables, error: tablesError } = await db.from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .like('table_name', '%hardware%');

        if (tablesError) {
          console.log('Could not check tables, proceeding with direct query...');
        } else {
          console.log('Available hardware-related tables:', tables);
        }
      } catch (tableCheckError) {
        console.log('Table check failed, continuing with direct query...');
      }

      const { data, error } = await db.from('hardwareinventory').select('*');
      if (error) {
        console.error('Supabase error fetching initial inventory:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // If table doesn't exist, try alternative table names
        if (error.code === 'PGRST116' || error.message.includes('relation "hardwareinventory" does not exist')) {
          console.log('hardwareinventory table not found, trying alternative table names...');

          // Try alternative table names
          const possibleTables = ['inventory', 'products', 'hardware_inventory', 'items', 'hardwareactivity'];

          for (const tableName of possibleTables) {
            try {
              console.log(`Trying table: ${tableName}`);
              const { data: altData, error: altError } = await db.from(tableName).select('*');
              if (!altError && altData) {
                console.log(`Found data in table: ${tableName}`, altData);
                data = altData;
                break;
              }
            } catch (e) {
              console.log(`Table ${tableName} not found or error:`, e);
            }
          }
        } else {
          throw error;
        }
      }

      console.log('Raw data fetched from Supabase:', data);
      console.log('Data length:', data?.length || 0);
      console.log('First item (if any):', data?.[0]);

      // If still no data, log available tables for debugging
      if (!data || data.length === 0) {
        console.log('No data found, checking available tables...');
        try {
          const { data: tables, error: tablesError } = await db
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

          if (!tablesError) {
            console.log('Available tables in public schema:', tables?.map(t => t.table_name));
          }
        } catch (e) {
          console.log('Could not fetch table list:', e);
        }
      }

      // If no data, try alternative table names
      if (!data || data.length === 0) {
        console.log('No data found in hardwareinventory, checking other possible table names...');

        // Try alternative table names
        const possibleTables = ['inventory', 'products', 'hardware_inventory', 'items'];

        for (const tableName of possibleTables) {
          try {
            console.log(`Trying table: ${tableName}`);
            const { data: altData, error: altError } = await db.from(tableName).select('*');
            if (!altError && altData && altData.length > 0) {
              console.log(`Found data in table: ${tableName}`, altData);
              // Use this data instead
              data = altData;
              break;
            }
          } catch (e) {
            console.log(`Table ${tableName} not found or error:`, e);
          }
        }
      }

      // Use existing data as-is
      console.log('Using existing inventory data from database');

      console.log('Mapping data to inventory items...');
      inventory.value = data.map(mapInventoryItem);
      console.log('Initial inventory fetched:', inventory.value);
      console.log('Raw data from Supabase:', data);
      console.log('Mapped inventory items:', inventory.value);
      updateStockAlerts();
      await fetchCategories(); // Ensure categories are fetched after initial inventory
      console.log('Categories fetched after initial inventory.');

      // Listen for changes in the 'hardwareinventory' table
      console.log('Setting up real-time listener for hardwareinventory changes...');
      db.channel('hardwareinventory_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hardwareinventory' }, payload => {
          console.log('Real-time inventory change detected:', payload.eventType, payload.new || payload.old);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedItem = mapInventoryItem(payload.new);
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
          console.log('Inventory updated via real-time listener:', inventory.value);
        })
        .subscribe();
      console.log('Inventory listener initialized successfully.');
    } catch (error) {
      console.error('Error initializing inventory listener:', error);
      inventoryError.value = "Failed to load inventory data.";
    }

    // Listen for changes in the 'orders' table
    console.log('Attempting to initialize orders listener...');

    // Listen for changes in the 'orders' table
    db.channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedOrder = { id: payload.new.id, ...payload.new };
          const index = dailyOrders.value.findIndex(order => order.id === updatedOrder.id);
          if (index !== -1) {
            dailyOrders.value[index] = updatedOrder;
          } else {
            dailyOrders.value.unshift(updatedOrder); // Add new orders to the beginning
          }
        } else if (payload.eventType === 'DELETE') {
          dailyOrders.value = dailyOrders.value.filter(item => item.id !== payload.old.id);
        }
        console.log("Daily orders updated:", dailyOrders.value.map(order => ({ id: order.id, ...order })));
      })
      .subscribe();
    console.log('Orders listener initialized.');
  }

  // Handle low stock items
  const onLowStockItems = (callback) => {
    return watch(lowStockItems, (items) => {
      callback(items)
    })
  }

  // Update stock alerts and notifications
  const updateStockAlerts = () => {
    lowStockItems.value = inventory.value.filter(item => {
      // Use minimumStock if available, otherwise fall back to LOW_STOCK_THRESHOLD
      const threshold = item.minimumStock || LOW_STOCK_THRESHOLD
      return item.currentStock > 0 && item.currentStock <= threshold
    })

    // Create notifications for low stock items
    lowStockItems.value.forEach(item => {
      const threshold = item.minimumStock || LOW_STOCK_THRESHOLD
      addNotification({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: `${item.name} - only ${item.currentStock} left in stock (minimum: ${threshold})`,
        severity: 'warning'
      })
    })
  }

  // Fetch top selling items
  const fetchTopSellingItems = async (timeRange = 'day') => {
    console.log(`Fetching top selling items for period: ${timeRange}`);
    try {
      loading.value = true
      const start = timeRange === 'week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : startOfDay(new Date())
      
      const { data: orders, error } = await db
        .from('hardwareorders') // Changed to hardwareorders
        .select('*')
        .gte('createdAt', start.toISOString())
        .order('createdAt', { ascending: false })
        .limit(100); // Assuming a limit similar to the initial listener

      if (error) {
        console.error('Supabase error fetching top selling items:', error);
        throw error;
      }
      console.log('Raw orders for top selling:', orders);

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
      console.log('Top selling items:', topSellingItems.value);
    } catch (error) {
      console.error('Error fetching top selling items:', error)
      topSellingError.value = "Failed to load top selling items."; // Ensure error is propagated to component
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
      const { error } = await db.from('hardwarealerts').insert({ // Changed to hardwarealerts
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
        const { data: existingOrder, error: fetchError } = await db.from('hardwareorders').select('processed').eq('id', orderId).single(); // Changed to hardwareorders
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
        const { error: updateError } = await db.from('hardwareinventory') // Changed to hardwareinventory
          .update({ currentStock: newStock, lastUpdated: new Date().toISOString() }) // Use actual column name currentStock
          .eq('id', item.id);
        if (updateError) throw updateError;

        // Use item's minimumStock threshold if available, otherwise use default
        const threshold = product.minimumStock || LOW_STOCK_THRESHOLD
        if (newStock <= threshold) {
          lowStockAlerts.push({ id: item.id, name: item.name, newStock, threshold });
        }
      }

      // Mark order processed if orderId supplied
      if (orderId) {
        const { error: updateOrderError } = await db.from('hardwareorders') // Changed to hardwareorders
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
        .from('hardwareorders') // Changed to hardwareorders
        .select('*')
        .gte('createdAt', startDate.toISOString())
        .lte('createdAt', endDate.toISOString())
        .order('createdAt', { ascending: true });

      if (error) {
        console.error('Supabase error fetching sales by period:', error);
        throw error;
      }

      console.log("Fetched sales data from:", startDate, "to:", endDate, "Data:", orders);
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
      const { data: items, error } = await db.from('hardwareinventory').select('*'); // Changed to hardwareinventory
      if (error) {
        console.error('Supabase error fetching inventory breakdown:', error);
        throw error;
      }
      console.log('Fetched inventory items for breakdown:', items);

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
    console.log('Attempting to fetch categories...');
    try {
      const { data, error } = await db.from('hardwareinventory').select('category'); // Changed to hardwareinventory
      if (error) {
        console.error('Supabase error fetching categories:', error);
        throw error;
      }
      console.log('Raw categories fetched:', data);

      const uniqueCategories = new Set();
      data.forEach(item => {
        if (item.category) {
          uniqueCategories.add(item.category);
        }
      });
      categories.value = Array.from(uniqueCategories);
      console.log('Unique categories:', categories.value);
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
