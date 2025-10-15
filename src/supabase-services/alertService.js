import { db } from '../supabase/supabaseClient';

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false,
      acknowledged: false
    };

    const { data, error } = await db.from('alerts').insert(alert).select().single();
    if (error) throw error;
    return data.id;
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
  // Build Supabase query
  let query = db.from('alerts').select('*');

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.read !== undefined) {
    query = query.eq('read', filters.read);
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId);
  }

  // Order by creation time (descending)
  query = query.order('createdAt', { ascending: false });

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  // Set up real-time subscription
  const subscription = query.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'alerts'
  }, (payload) => {
    // For real-time updates, we need to refetch the filtered data
    getFilteredAlerts(filters, callback);
  });

  // Initial fetch
  getFilteredAlerts(filters, callback);

  return subscription;
};

/**
 * Helper function to get filtered alerts
 */
const getFilteredAlerts = async (filters, callback) => {
  let query = db.from('alerts').select('*');

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.read !== undefined) {
    query = query.eq('read', filters.read);
  }

  if (filters.userId) {
    query = query.eq('userId', filters.userId);
  }

  // Order by creation time (descending)
  query = query.order('createdAt', { ascending: false });

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching alerts:', error);
    return;
  }

  callback(data || []);
};

/**
 * Mark alert as read
 * @param {string} alertId - Alert ID
 * @returns {Promise<void>}
 */
export const markAlertAsRead = async (alertId) => {
  try {
    const { error } = await db.from('alerts').update({
      read: true,
      updatedAt: new Date().toISOString()
    }).eq('id', alertId);

    if (error) throw error;
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
    const { error } = await db.from('alerts').update({
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString(),
      acknowledgmentNotes: notes,
      updatedAt: new Date().toISOString()
    }).eq('id', alertId);

    if (error) throw error;
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
    const { data, error } = await db.from('alert_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
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

    // Get old acknowledged alerts
    const { data: oldAlerts, error: fetchError } = await db.from('alerts')
      .select('id')
      .lt('createdAt', cutoffDate.toISOString())
      .eq('acknowledged', true);

    if (fetchError) throw fetchError;

    if (oldAlerts && oldAlerts.length > 0) {
      // Archive old alerts
      const alertIds = oldAlerts.map(alert => alert.id);
      const { error: updateError } = await db.from('alerts')
        .update({ archived: true })
        .in('id', alertIds);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error('Error cleaning up old alerts:', error);
    throw error;
  }
};
