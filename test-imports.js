// Test file to verify imports work correctly
import { generateOrderQRCode, ORDER_HISTORY_TYPES, getHistoryIcon } from './src/utils/orderEnhancements.js'
import { OrderFirebaseService } from './src/utils/firebaseEnhancements.js'

console.log('✅ All imports successful!')
console.log('ORDER_HISTORY_TYPES:', ORDER_HISTORY_TYPES)
console.log('generateOrderQRCode function:', typeof generateOrderQRCode)
console.log('OrderFirebaseService:', typeof OrderFirebaseService)
console.log('getHistoryIcon function:', typeof getHistoryIcon)