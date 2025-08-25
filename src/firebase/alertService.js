import { collection, addDoc, query, where, onSnapshot, orderBy, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// Alert types
export const ALERT_TYPES = {
  LOW_STOCK: 'low_stock',
  EXPIRY: 'expiry',
  OVERDUE_ORDER: 'overdue_order',
  SYSTEM_HEALTH: 'system_health',
  USER_ACTIVITY: 'user_activity'
};

// Alert priorities
export const ALERT_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Create a new alert
 * @param {Object} alertData - Alert data
 * @returns {Promise<string>} - Alert ID
 */
export const createAlert = async (alertData) => {
  try {
    const alert = {
      ...alertData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      read: false,
      acknowledged: false
    };
    
    const docRef = await addDoc(collection(db, 'alerts'), alert);
    return docRef.id;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

/**
 * Get real-time alerts
 * @param {Object} filters - Filter options
 * @param {Function} callback - Callback function for real-time updates
 * @returns {Function} - Unsubscribe function
 */
export const getRealTimeAlerts = (filters = {}, callback) => {
  let q = collection(db, 'alerts');
  
  // Apply filters
  const conditions = [];
  
  if (filters.type) {
    conditions.push(where('type', '==', filters.type));
  }
  
  if (filters.priority) {
    conditions.push(where('priority', '==', filters.priority));
  }
  
  if (filters.read !== undefined) {
    conditions.push(where('read', '==', filters.read));
  }
  
  if (filters.userId) {
    conditions.push(where('userId', '==', filters.userId));
  }
  
  // Order by creation time
  conditions.push(orderBy('createdAt', 'desc'));
  
  // Limit results
  if (filters.limit) {
    conditions.push(limit(filters.limit));
  }
  
  // Build query
  if (conditions.length > 0) {
    q = query(collection(db, 'alerts'), ...conditions);
  }
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(alerts);
  });
};

/**
 * Mark alert as read
 * @param {string} alertId - Alert ID
 * @returns {Promise<void>}
 */
export const markAlertAsRead = async (alertId) => {
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      read: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    throw error;
  }
};

/**
 * Acknowledge alert
 * @param {string} alertId - Alert ID
 * @param {string} userId - User ID
 * @param {string} notes - Acknowledgment notes
 * @returns {Promise<void>}
 */
export const acknowledgeAlert = async (alertId, userId, notes = '') => {
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: serverTimestamp(),
      acknowledgmentNotes: notes,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
};

/**
 * Get alert rules
 * @returns {Promise<Array>} - Alert rules
 */
export const getAlertRules = async () => {
  try {
    const q = query(collection(db, 'alert_rules'), orderBy('priority', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting alert rules:', error);
    throw error;
  }
};

/**
 * Check if alert should be triggered based on rules
 * @param {Object} data - Current data to check against rules
 * @returns {Promise<Array>} - Alerts to trigger
 */
export const checkAlertRules = async (data) => {
  try {
    const rules = await getAlertRules();
    const alertsToTrigger = [];
    
    for (const rule of rules) {
      let shouldTrigger = false;
      
      switch (rule.type) {
        case ALERT_TYPES.LOW_STOCK:
          if (data.currentStock <= rule.threshold) {
            shouldTrigger = true;
          }
          break;
        case ALERT_TYPES.EXPIRY:
          if (data.daysUntilExpiry <= rule.threshold) {
            shouldTrigger = true;
          }
          break;
        case ALERT_TYPES.OVERDUE_ORDER:
          if (data.daysOverdue >= rule.threshold) {
            shouldTrigger = true;
          }
          break;
      }
      
      if (shouldTrigger) {
        alertsToTrigger.push({
          type: rule.type,
          priority: rule.priority,
          title: rule.title,
          message: rule.message,
          data: data,
          ruleId: rule.id
        });
      }
    }
    
    return alertsToTrigger;
  } catch (error) {
    console.error('Error checking alert rules:', error);
    throw error;
  }
};

/**
 * Cleanup old alerts
 * @param {number} days - Number of days to keep alerts
 * @returns {Promise<void>}
 */
export const cleanupOldAlerts = async (days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const q = query(
      collection(db, 'alerts'),
      where('createdAt', '<', cutoffDate),
      where('acknowledged', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { archived: true })
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error cleaning up old alerts:', error);
    throw error;
  }
};
