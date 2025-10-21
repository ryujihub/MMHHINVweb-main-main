import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../firebase/config'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref({
    deliveryFee: 150,
    deliveryFeeEnabled: true,
    pickupFee: 0,
    minimumOrderAmount: 0,
    taxRate: 0,
    currency: 'PHP',
    businessHours: {
      start: '08:00',
      end: '18:00',
      enabled: true
    },
    deliveryZones: [
      {
        id: 'default',
        name: 'Default Zone',
        fee: 150,
        minimumOrder: 0,
        enabled: true
      }
    ]
  })

  const loading = ref(false)
  const initialized = ref(false)

  // Computed properties
  const currentDeliveryFee = computed(() => {
    if (!settings.value.deliveryFeeEnabled) return 0
    return settings.value.deliveryFee || 150
  })

  const currentPickupFee = computed(() => {
    return settings.value.pickupFee || 0
  })

  const getDeliveryFeeForZone = computed(() => {
    return (zoneId = 'default') => {
      if (!settings.value.deliveryFeeEnabled) return 0
      const zone = settings.value.deliveryZones?.find(z => z.id === zoneId)
      return zone?.enabled ? (zone.fee || 150) : 0
    }
  })

  const isBusinessHours = computed(() => {
    if (!settings.value.businessHours?.enabled) return true

    const now = new Date()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    const startTime = parseInt(settings.value.businessHours.start.replace(':', ''))
    const endTime = parseInt(settings.value.businessHours.end.replace(':', ''))

    return currentTime >= startTime && currentTime <= endTime
  })

  // Initialize settings listener
  const initializeSettings = () => {
    if (initialized.value) return

    const settingsDoc = doc(db, 'settings', 'main')

    // Try to get existing settings
    getDoc(settingsDoc).then((doc) => {
      if (doc.exists()) {
        settings.value = { ...settings.value, ...doc.data() }
      } else {
        // Create default settings if none exist
        saveSettings()
      }
      initialized.value = true
    }).catch((error) => {
      console.error('Error loading settings:', error)
      initialized.value = true
    })

    // Listen for real-time updates
    onSnapshot(settingsDoc, (doc) => {
      if (doc.exists()) {
        settings.value = { ...settings.value, ...doc.data() }
      }
    }, (error) => {
      console.error('Error listening to settings:', error)
    })
  }

  // Save settings to Firestore
  const saveSettings = async (newSettings = null) => {
    try {
      loading.value = true
      const settingsToSave = newSettings || settings.value
      const settingsDoc = doc(db, 'settings', 'main')

      await setDoc(settingsDoc, {
        ...settingsToSave,
        updatedAt: serverTimestamp(),
        updatedBy: 'system' // Could be enhanced to track user
      })

      if (newSettings) {
        settings.value = { ...settings.value, ...newSettings }
      }

      return true
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update specific setting
  const updateSetting = async (key, value) => {
    try {
      const settingsDoc = doc(db, 'settings', 'main')
      await updateDoc(settingsDoc, {
        [key]: value,
        updatedAt: serverTimestamp()
      })
      settings.value[key] = value
      return true
    } catch (error) {
      console.error('Error updating setting:', error)
      throw error
    }
  }

  // Update delivery fee
  const updateDeliveryFee = async (fee) => {
    return updateSetting('deliveryFee', fee)
  }

  // Update delivery zones
  const updateDeliveryZones = async (zones) => {
    return updateSetting('deliveryZones', zones)
  }

  // Add delivery zone
  const addDeliveryZone = async (zone) => {
    try {
      const currentZones = settings.value.deliveryZones || []
      const newZone = {
        id: `zone_${Date.now()}`,
        name: zone.name,
        fee: zone.fee || 150,
        minimumOrder: zone.minimumOrder || 0,
        enabled: zone.enabled !== false,
        ...zone
      }

      const updatedZones = [...currentZones, newZone]
      await updateDeliveryZones(updatedZones)
      return newZone.id
    } catch (error) {
      console.error('Error adding delivery zone:', error)
      throw error
    }
  }

  // Update delivery zone
  const updateDeliveryZone = async (zoneId, updates) => {
    try {
      const currentZones = settings.value.deliveryZones || []
      const updatedZones = currentZones.map(zone =>
        zone.id === zoneId ? { ...zone, ...updates } : zone
      )
      await updateDeliveryZones(updatedZones)
      return true
    } catch (error) {
      console.error('Error updating delivery zone:', error)
      throw error
    }
  }

  // Remove delivery zone
  const removeDeliveryZone = async (zoneId) => {
    try {
      const currentZones = settings.value.deliveryZones || []
      const updatedZones = currentZones.filter(zone => zone.id !== zoneId)
      await updateDeliveryZones(updatedZones)
      return true
    } catch (error) {
      console.error('Error removing delivery zone:', error)
      throw error
    }
  }

  // Reset to default settings
  const resetToDefaults = async () => {
    const defaultSettings = {
      deliveryFee: 150,
      deliveryFeeEnabled: true,
      pickupFee: 0,
      minimumOrderAmount: 0,
      taxRate: 0,
      currency: 'PHP',
      businessHours: {
        start: '08:00',
        end: '18:00',
        enabled: true
      },
      deliveryZones: [
        {
          id: 'default',
          name: 'Default Zone',
          fee: 150,
          minimumOrder: 0,
          enabled: true
        }
      ]
    }

    return saveSettings(defaultSettings)
  }

  return {
    // State
    settings,
    loading,
    initialized,

    // Computed
    currentDeliveryFee,
    currentPickupFee,
    getDeliveryFeeForZone,
    isBusinessHours,

    // Methods
    initializeSettings,
    saveSettings,
    updateSetting,
    updateDeliveryFee,
    updateDeliveryZones,
    addDeliveryZone,
    updateDeliveryZone,
    removeDeliveryZone,
    resetToDefaults
  }
})
