import { db } from '../firebase/config'
import { 
  collection, 
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore'

export const createStockMovement = async (data) => {
  try {
    await addDoc(collection(db, 'stockMovements'), {
      ...data,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    throw error
  }
}

export const getPendingStockReservations = async (productId) => {
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

  // Calculate total reserved quantity for the product
  let reservedQuantity = 0
  pendingOrders.forEach(order => {
    const item = order.items.find(i => i.id === productId)
    if (item) {
      reservedQuantity += item.quantity
    }
  })

  return reservedQuantity
}