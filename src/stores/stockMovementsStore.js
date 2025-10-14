import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../supabase/supabaseClient'

export const useStockMovementsStore = defineStore('stockMovements', () => {
  const stockMovements = ref([])
  const loading = ref(false)
  
  // Record a new stock movement
  const recordStockMovement = async ({ productId, orderId, quantity, type, remainingStock, notes = '' }) => {
    try {
      const { error } = await db.from('stockMovements').insert({
        productId,
        orderId,
        quantity,
        type,
        remainingStock,
        notes,
        timestamp: new Date().toISOString()
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error recording stock movement:', error)
      throw error
    }
  }

  // Get reserved stock quantity for a product from pending orders
  const getReservedStock = async (productId) => {
    try {
      const { data: pendingOrders, error } = await db
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('processed', false);

      if (error) throw error;

      // Sum up reserved quantities from pending orders
      return pendingOrders.reduce((total, order) => {
        const item = order.items.find(i => i.id === productId)
        return total + (item?.quantity || 0)
      }, 0)
    } catch (error) {
      console.error('Error getting reserved stock:', error)
      return 0
    }
  }

  // Get movement history for a product
  const getProductMovements = async (productId) => {
    try {
      loading.value = true
      const { data: movements, error } = await db
        .from('stockMovements')
        .select('*')
        .eq('productId', productId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return movements;
    } catch (error) {
      console.error('Error fetching product movements:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    stockMovements,
    loading,
    recordStockMovement,
    getReservedStock,
    getProductMovements
  }
})
