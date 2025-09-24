import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../firebase/config'
import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore'

export const useStockMovementsStore = defineStore('stockMovements', () => {
  const stockMovements = ref([])
  const loading = ref(false)
  
  // Record a new stock movement
  const recordStockMovement = async ({ productId, orderId, quantity, type, remainingStock, notes = '' }) => {
    try {
      await addDoc(collection(db, 'stockMovements'), {
        productId,
        orderId,
        quantity,
        type,
        remainingStock,
        notes,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Error recording stock movement:', error)
      throw error
    }
  }

  // Get reserved stock quantity for a product from pending orders
  const getReservedStock = async (productId) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'pending'),
        where('processed', '==', false)
      )
      
      const snapshot = await getDocs(q)
      const pendingOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

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
      const q = query(
        collection(db, 'stockMovements'),
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
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