import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * Enhanced Firebase operations for order management
 */
export class OrderFirebaseService {
  
  /**
   * Add order history entry with proper error handling
   */
  static async addOrderHistory(orderId, type, description, userId, metadata = {}) {
    try {
      const historyEntry = {
        type,
        description,
        userId,
        metadata,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      }

      const historyRef = collection(db, `orders/${orderId}/history`)
      const docRef = await addDoc(historyRef, historyEntry)
      
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Error adding order history:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get order history with pagination
   */
  static async getOrderHistory(orderId, options = {}) {
    try {
      const { limit: limitCount = 50, lastDoc = null } = options
      
      let historyQuery = query(
        collection(db, `orders/${orderId}/history`),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )

      if (lastDoc) {
        historyQuery = query(historyQuery, startAfter(lastDoc))
      }

      const snapshot = await getDocs(historyQuery)
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().createdAt)
      }))

      return { 
        success: true, 
        data: history,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === limitCount
      }
    } catch (error) {
      console.error('Error fetching order history:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  /**
   * Bulk update orders with batch operations
   */
  static async bulkUpdateOrders(orderIds, updates, userId) {
    const batch = writeBatch(db)
    const results = {
      success: [],
      failed: [],
      total: orderIds.length
    }

    try {
      // Validate input
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error('Invalid order IDs provided')
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates provided')
      }

      // Process each order
      for (const orderId of orderIds) {
        try {
          const orderRef = doc(db, 'orders', orderId)
          
          // Add metadata to updates
          const enhancedUpdates = {
            ...updates,
            lastUpdated: serverTimestamp(),
            updatedBy: userId
          }

          batch.update(orderRef, enhancedUpdates)
          
          // Add history entry for each order
          const historyRef = collection(db, `orders/${orderId}/history`)
          const historyEntry = {
            type: 'bulk_update',
            description: `Bulk operation: ${Object.keys(updates).join(', ')} updated`,
            userId,
            metadata: { updates, operation: 'bulk_update' },
            timestamp: serverTimestamp(),
            createdAt: new Date().toISOString()
          }
          
          const historyDocRef = doc(historyRef)
          batch.set(historyDocRef, historyEntry)
          
          results.success.push(orderId)
        } catch (error) {
          results.failed.push({ orderId, error: error.message })
        }
      }

      // Commit batch operation
      await batch.commit()
      
      return { success: true, results }
    } catch (error) {
      console.error('Bulk update error:', error)
      return { 
        success: false, 
        error: error.message, 
        results: {
          ...results,
          failed: orderIds.map(id => ({ orderId: id, error: error.message }))
        }
      }
    }
  }

  /**
   * Real-time order updates listener
   */
  static subscribeToOrderUpdates(orderId, callback) {
    try {
      const orderRef = doc(db, 'orders', orderId)
      
      const unsubscribe = onSnapshot(orderRef, (doc) => {
        if (doc.exists()) {
          const orderData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().lastUpdated?.toDate()
          }
          callback({ success: true, data: orderData })
        } else {
          callback({ success: false, error: 'Order not found' })
        }
      }, (error) => {
        console.error('Order subscription error:', error)
        callback({ success: false, error: error.message })
      })

      return unsubscribe
    } catch (error) {
      console.error('Error setting up order subscription:', error)
      return null
    }
  }

  /**
   * Real-time order history listener
   */
  static subscribeToOrderHistory(orderId, callback) {
    try {
      const historyQuery = query(
        collection(db, `orders/${orderId}/history`),
        orderBy('timestamp', 'desc'),
        limit(20)
      )
      
      const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
        const history = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().createdAt)
        }))
        
        callback({ success: true, data: history })
      }, (error) => {
        console.error('History subscription error:', error)
        callback({ success: false, error: error.message })
      })

      return unsubscribe
    } catch (error) {
      console.error('Error setting up history subscription:', error)
      return null
    }
  }

  /**
   * Get orders with advanced filtering and pagination
   */
  static async getOrdersWithFilters(filters = {}) {
    try {
      const {
        status,
        assignedTo,
        dateFrom,
        dateTo,
        limit: limitCount = 50,
        lastDoc = null
      } = filters

      let ordersQuery = collection(db, 'orders')
      const constraints = []

      // Add filters
      if (status) {
        constraints.push(where('status', '==', status))
      }
      
      if (assignedTo) {
        constraints.push(where('assignedTo', '==', assignedTo))
      }
      
      if (dateFrom) {
        constraints.push(where('createdAt', '>=', dateFrom))
      }
      
      if (dateTo) {
        constraints.push(where('createdAt', '<=', dateTo))
      }

      // Add ordering and limit
      constraints.push(orderBy('createdAt', 'desc'))
      constraints.push(limit(limitCount))

      if (lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      ordersQuery = query(ordersQuery, ...constraints)
      
      const snapshot = await getDocs(ordersQuery)
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().lastUpdated?.toDate()
      }))

      return {
        success: true,
        data: orders,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === limitCount
      }
    } catch (error) {
      console.error('Error fetching filtered orders:', error)
      return { success: false, error: error.message, data: [] }
    }
  }

  /**
   * Validate order data before operations
   */
  static validateOrderData(orderData) {
    const errors = []

    if (!orderData.customer || !orderData.customer.name) {
      errors.push('Customer name is required')
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      errors.push('Order must have at least one item')
    }

    if (orderData.items) {
      orderData.items.forEach((item, index) => {
        if (!item.name) errors.push(`Item ${index + 1}: Name is required`)
        if (!item.price || item.price <= 0) errors.push(`Item ${index + 1}: Valid price is required`)
        if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Valid quantity is required`)
      })
    }

    if (!orderData.total || orderData.total <= 0) {
      errors.push('Valid order total is required')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Clean order data for Firebase storage
   */
  static cleanOrderData(orderData) {
    const cleanData = { ...orderData }

    // Remove undefined values
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key]
      }
    })

    // Ensure required fields have default values
    cleanData.status = cleanData.status || 'Pending'
    cleanData.createdAt = cleanData.createdAt || serverTimestamp()
    cleanData.items = cleanData.items || []
    cleanData.total = cleanData.total || 0
    cleanData.customer = cleanData.customer || {}

    // Clean customer data
    if (cleanData.customer) {
      cleanData.customer.name = cleanData.customer.name || ''
      cleanData.customer.phone = cleanData.customer.phone || ''
      cleanData.customer.address = cleanData.customer.address || ''
      cleanData.customer.deliveryOption = cleanData.customer.deliveryOption || 'pickup'
      cleanData.customer.paymentMethod = cleanData.customer.paymentMethod || 'cash'
    }

    // Clean items data
    if (cleanData.items) {
      cleanData.items = cleanData.items.map(item => ({
        id: item.id || '',
        name: item.name || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        category: item.category || 'General'
      }))
    }

    return cleanData
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  static handleFirebaseError(error) {
    const errorMessages = {
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested document was not found',
      'already-exists': 'A document with this ID already exists',
      'resource-exhausted': 'Too many requests. Please try again later',
      'unauthenticated': 'You must be logged in to perform this action',
      'unavailable': 'Service is temporarily unavailable. Please try again',
      'deadline-exceeded': 'Request timed out. Please try again',
      'invalid-argument': 'Invalid data provided'
    }

    const userMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred'
    
    console.error('Firebase Error:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    })

    return {
      code: error.code,
      message: userMessage,
      originalMessage: error.message
    }
  }

  static async withErrorHandling(operation, context = '') {
    try {
      return await operation()
    } catch (error) {
      const handledError = this.handleFirebaseError(error)
      console.error(`Error in ${context}:`, handledError)
      throw new Error(handledError.message)
    }
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  static startTimer(label) {
    console.time(label)
    return {
      end: () => console.timeEnd(label)
    }
  }

  static async measureAsync(label, operation) {
    const timer = this.startTimer(label)
    try {
      const result = await operation()
      timer.end()
      return result
    } catch (error) {
      timer.end()
      throw error
    }
  }
}