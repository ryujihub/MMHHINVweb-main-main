import QRCode from 'qrcode'
import { format } from 'date-fns'

/**
 * Generate QR code for order tracking
 * @param {string} orderId - Order ID
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - Base64 QR code image
 */
export const generateOrderQRCode = async (orderId, options = {}) => {
  const {
    size = 200,
    margin = 2,
    color = {
      dark: '#000000',
      light: '#FFFFFF'
    }
  } = options

  try {
    // Create tracking URL (you can customize this based on your domain)
    const trackingUrl = `${window.location.origin}/track/${orderId}`
    
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      width: size,
      margin: margin,
      color: color,
      errorCorrectionLevel: 'M'
    })
    
    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Create order history entry
 * @param {string} type - Type of history entry
 * @param {string} description - Description of the action
 * @param {string} userId - User who performed the action
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - History entry object
 */
export const createOrderHistoryEntry = (type, description, userId, metadata = {}) => {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    description,
    timestamp: new Date(),
    userId,
    metadata,
    createdAt: new Date()
  }
}

/**
 * Order history types
 */
export const ORDER_HISTORY_TYPES = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned',
  ITEM_ADDED: 'item_added',
  ITEM_REMOVED: 'item_removed',
  ITEM_UPDATED: 'item_updated',
  PAYMENT_UPDATED: 'payment_updated',
  DELIVERY_SCHEDULED: 'delivery_scheduled',
  NOTES_ADDED: 'notes_added',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPORTED: 'exported',
  PRINTED: 'printed'
}

/**
 * Get icon for history entry type
 * @param {string} type - History entry type
 * @returns {string} - Font Awesome icon class
 */
export const getHistoryIcon = (type) => {
  const icons = {
    [ORDER_HISTORY_TYPES.CREATED]: 'fas fa-plus-circle',
    [ORDER_HISTORY_TYPES.STATUS_CHANGED]: 'fas fa-sync-alt',
    [ORDER_HISTORY_TYPES.ASSIGNED]: 'fas fa-user-tag',
    [ORDER_HISTORY_TYPES.ITEM_ADDED]: 'fas fa-cart-plus',
    [ORDER_HISTORY_TYPES.ITEM_REMOVED]: 'fas fa-cart-arrow-down',
    [ORDER_HISTORY_TYPES.ITEM_UPDATED]: 'fas fa-edit',
    [ORDER_HISTORY_TYPES.PAYMENT_UPDATED]: 'fas fa-credit-card',
    [ORDER_HISTORY_TYPES.DELIVERY_SCHEDULED]: 'fas fa-truck',
    [ORDER_HISTORY_TYPES.NOTES_ADDED]: 'fas fa-sticky-note',
    [ORDER_HISTORY_TYPES.CANCELLED]: 'fas fa-ban',
    [ORDER_HISTORY_TYPES.COMPLETED]: 'fas fa-check-circle',
    [ORDER_HISTORY_TYPES.EXPORTED]: 'fas fa-file-export',
    [ORDER_HISTORY_TYPES.PRINTED]: 'fas fa-print'
  }
  return icons[type] || 'fas fa-info-circle'
}

/**
 * Get color for history entry type
 * @param {string} type - History entry type
 * @returns {string} - CSS color class
 */
export const getHistoryColor = (type) => {
  const colors = {
    [ORDER_HISTORY_TYPES.CREATED]: 'text-blue-600',
    [ORDER_HISTORY_TYPES.STATUS_CHANGED]: 'text-purple-600',
    [ORDER_HISTORY_TYPES.ASSIGNED]: 'text-indigo-600',
    [ORDER_HISTORY_TYPES.ITEM_ADDED]: 'text-green-600',
    [ORDER_HISTORY_TYPES.ITEM_REMOVED]: 'text-orange-600',
    [ORDER_HISTORY_TYPES.ITEM_UPDATED]: 'text-yellow-600',
    [ORDER_HISTORY_TYPES.PAYMENT_UPDATED]: 'text-teal-600',
    [ORDER_HISTORY_TYPES.DELIVERY_SCHEDULED]: 'text-cyan-600',
    [ORDER_HISTORY_TYPES.NOTES_ADDED]: 'text-gray-600',
    [ORDER_HISTORY_TYPES.CANCELLED]: 'text-red-600',
    [ORDER_HISTORY_TYPES.COMPLETED]: 'text-green-600',
    [ORDER_HISTORY_TYPES.EXPORTED]: 'text-blue-600',
    [ORDER_HISTORY_TYPES.PRINTED]: 'text-gray-600'
  }
  return colors[type] || 'text-gray-500'
}

/**
 * Bulk operations for orders
 */
export const bulkOrderOperations = {
  /**
   * Update status for multiple orders
   * @param {Array} orderIds - Array of order IDs
   * @param {string} newStatus - New status to set
   * @param {string} userId - User performing the operation
   * @returns {Object} - Operation result
   */
  updateStatus: async (orderIds, newStatus, userId) => {
    const results = {
      success: [],
      failed: [],
      total: orderIds.length
    }

    for (const orderId of orderIds) {
      try {
        // This would be implemented with your Firebase update logic
        results.success.push(orderId)
      } catch (error) {
        results.failed.push({ orderId, error: error.message })
      }
    }

    return results
  },

  /**
   * Assign multiple orders to staff
   * @param {Array} orderIds - Array of order IDs
   * @param {string} staffId - Staff member ID
   * @param {string} userId - User performing the operation
   * @returns {Object} - Operation result
   */
  assignToStaff: async (orderIds, staffId, userId) => {
    const results = {
      success: [],
      failed: [],
      total: orderIds.length
    }

    for (const orderId of orderIds) {
      try {
        // This would be implemented with your Firebase update logic
        results.success.push(orderId)
      } catch (error) {
        results.failed.push({ orderId, error: error.message })
      }
    }

    return results
  }
}

/**
 * Order template management
 */
export const orderTemplates = {
  /**
   * Create order template from existing order
   * @param {Object} order - Order object
   * @param {string} templateName - Name for the template
   * @returns {Object} - Template object
   */
  createFromOrder: (order, templateName) => {
    // Ensure all values are defined and not null/undefined
    const cleanItems = (order.items || []).map(item => ({
      productId: item.id || '',
      name: item.name || '',
      price: item.price || 0,
      quantity: item.quantity || 1,
      category: item.category || 'General'
    }))

    return {
      id: `template_${Date.now()}`,
      name: templateName || 'Untitled Template',
      items: cleanItems,
      deliveryOption: order.customer?.deliveryOption || 'pickup',
      paymentMethod: order.customer?.paymentMethod || 'cash',
      notes: order.notes || '',
      createdAt: new Date(),
      createdBy: order.assignedTo || 'system',
      usageCount: 0,
      totalItems: cleanItems.length,
      estimatedTotal: cleanItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }
  },

  /**
   * Apply template to new order
   * @param {Object} template - Template object
   * @returns {Object} - Order data from template
   */
  applyToOrder: (template) => {
    return {
      items: template.items.map(item => ({
        ...item,
        id: item.productId
      })),
      deliveryOption: template.deliveryOption,
      paymentMethod: template.paymentMethod,
      notes: template.notes
    }
  }
}

/**
 * Order scheduling utilities
 */
export const orderScheduling = {
  /**
   * Schedule order for future delivery
   * @param {Object} order - Order object
   * @param {Date} scheduledDate - Scheduled delivery date
   * @param {string} timeSlot - Time slot for delivery
   * @returns {Object} - Scheduled order object
   */
  scheduleDelivery: (order, scheduledDate, timeSlot) => {
    return {
      ...order,
      scheduled: true,
      scheduledDate,
      timeSlot,
      status: 'Scheduled',
      scheduledAt: new Date()
    }
  },

  /**
   * Get available time slots for a date
   * @param {Date} date - Date to check
   * @returns {Array} - Available time slots
   */
  getAvailableTimeSlots: (date) => {
    // This would typically check against existing scheduled orders
    const timeSlots = [
      { id: 'morning', label: '8:00 AM - 12:00 PM', available: true },
      { id: 'afternoon', label: '1:00 PM - 5:00 PM', available: true },
      { id: 'evening', label: '6:00 PM - 8:00 PM', available: true }
    ]
    
    return timeSlots
  },

  /**
   * Check if date is available for scheduling
   * @param {Date} date - Date to check
   * @returns {boolean} - Whether date is available
   */
  isDateAvailable: (date) => {
    const today = new Date()
    const maxAdvanceDays = 30 // Maximum days in advance
    const maxDate = new Date(today.getTime() + (maxAdvanceDays * 24 * 60 * 60 * 1000))
    
    return date >= today && date <= maxDate
  }
}

/**
 * Format order tracking information
 * @param {Object} order - Order object
 * @returns {Object} - Formatted tracking info
 */
export const formatOrderTracking = (order) => {
  return {
    orderId: order.id,
    shortId: order.id.slice(-6),
    status: order.status,
    createdAt: order.createdAt,
    estimatedDelivery: order.scheduledDate || null,
    trackingSteps: [
      {
        step: 'Order Placed',
        completed: true,
        timestamp: order.createdAt,
        description: 'Your order has been received and is being processed.'
      },
      {
        step: 'Processing',
        completed: order.status !== 'Pending',
        timestamp: order.status !== 'Pending' ? order.updatedAt : null,
        description: 'Your order is being prepared for delivery.'
      },
      {
        step: 'Ready for Delivery',
        completed: ['Completed', 'Delivered'].includes(order.status),
        timestamp: order.status === 'Completed' ? order.updatedAt : null,
        description: 'Your order is ready and will be delivered soon.'
      },
      {
        step: 'Delivered',
        completed: order.status === 'Delivered',
        timestamp: order.status === 'Delivered' ? order.deliveredAt : null,
        description: 'Your order has been successfully delivered.'
      }
    ]
  }
}