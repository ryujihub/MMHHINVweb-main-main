<template>
  <div class="settings-management">
    <div class="page-header">
      <h1>Settings Management</h1>
      <p class="subtitle">Configure delivery fees, business hours, and other system settings</p>
    </div>

    <div class="settings-container">
      <!-- Delivery Fee Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h2>
            <i class="fas fa-truck"></i>
            Delivery Fee Settings
          </h2>
          <button @click="saveSettings" class="save-btn" :disabled="settingsStore.loading">
            <i class="fas fa-save"></i>
            Save Changes
          </button>
        </div>

        <div class="settings-grid">
          <!-- Basic Delivery Settings -->
          <div class="settings-card">
            <h3>Basic Settings</h3>

            <div class="setting-item">
              <div class="setting-info">
                <label>Enable Delivery Fees</label>
                <p class="setting-description">Allow charging delivery fees for orders</p>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  v-model="localSettings.deliveryFeeEnabled"
                />
                <span class="slider"></span>
              </label>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label>Default Delivery Fee (₱)</label>
                <p class="setting-description">Standard delivery fee for all orders</p>
              </div>
              <input
                type="number"
                v-model.number="localSettings.deliveryFee"
                :disabled="!localSettings.deliveryFeeEnabled"
                class="number-input"
                min="0"
                step="10"
              />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label>Pickup Fee (₱)</label>
                <p class="setting-description">Fee for pickup orders (usually 0)</p>
              </div>
              <input
                type="number"
                v-model.number="localSettings.pickupFee"
                class="number-input"
                min="0"
                step="10"
              />
            </div>
          </div>

          <!-- Delivery Zones -->
          <div class="settings-card">
            <div class="card-header">
              <h3>Delivery Zones</h3>
              <button @click="addDeliveryZone" class="add-btn">
                <i class="fas fa-plus"></i>
                Add Zone
              </button>
            </div>

            <div class="zones-list">
              <div
                v-for="zone in localSettings.deliveryZones"
                :key="zone.id"
                class="zone-item"
              >
                <div class="zone-header">
                  <input
                    v-model="zone.name"
                    placeholder="Zone name (e.g., Downtown)"
                    class="zone-name-input"
                  />
                  <button @click="removeDeliveryZone(zone.id)" class="remove-zone-btn">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>

                <div class="zone-settings">
                  <div class="zone-setting">
                    <label>Fee (₱)</label>
                    <input
                      type="number"
                      v-model.number="zone.fee"
                      class="number-input small"
                      min="0"
                      step="10"
                    />
                  </div>

                  <div class="zone-setting">
                    <label>Min. Order (₱)</label>
                    <input
                      type="number"
                      v-model.number="zone.minimumOrder"
                      class="number-input small"
                      min="0"
                      step="50"
                    />
                  </div>

                  <div class="zone-setting">
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="zone.enabled" />
                      <span class="slider"></span>
                    </label>
                    <span class="toggle-label">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Business Hours Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h2>
            <i class="fas fa-clock"></i>
            Business Hours
          </h2>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <label>Enable Business Hours</label>
              <p class="setting-description">Restrict operations to specific hours</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="localSettings.businessHours.enabled" />
              <span class="slider"></span>
            </label>
          </div>

          <div v-if="localSettings.businessHours.enabled" class="business-hours-settings">
            <div class="time-inputs">
              <div class="time-input">
                <label>Start Time</label>
                <input
                  type="time"
                  v-model="localSettings.businessHours.start"
                  class="time-input-field"
                />
              </div>

              <div class="time-input">
                <label>End Time</label>
                <input
                  type="time"
                  v-model="localSettings.businessHours.end"
                  class="time-input-field"
                />
              </div>
            </div>

            <div class="current-status">
              <p>
                <strong>Current Status:</strong>
                <span :class="{ 'status-open': settingsStore.isBusinessHours, 'status-closed': !settingsStore.isBusinessHours }">
                  {{ settingsStore.isBusinessHours ? 'Open' : 'Closed' }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- System Settings -->
      <div class="settings-section">
        <div class="section-header">
          <h2>
            <i class="fas fa-cog"></i>
            System Settings
          </h2>
        </div>

        <div class="settings-grid">
          <div class="settings-card">
            <div class="setting-item">
              <div class="setting-info">
                <label>Minimum Order Amount (₱)</label>
                <p class="setting-description">Minimum order value required</p>
              </div>
              <input
                type="number"
                v-model.number="localSettings.minimumOrderAmount"
                class="number-input"
                min="0"
                step="50"
              />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label>Tax Rate (%)</label>
                <p class="setting-description">Default tax rate for orders</p>
              </div>
              <input
                type="number"
                v-model.number="localSettings.taxRate"
                class="number-input"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <label>Currency</label>
                <p class="setting-description">Default currency for pricing</p>
              </div>
              <select v-model="localSettings.currency" class="select-input">
                <option value="PHP">Philippine Peso (₱)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="settings-actions">
        <button @click="resetToDefaults" class="reset-btn" :disabled="settingsStore.loading">
          <i class="fas fa-undo"></i>
          Reset to Defaults
        </button>

        <div class="save-status">
          <span v-if="settingsStore.loading" class="saving">
            <i class="fas fa-spinner fa-spin"></i>
            Saving...
          </span>
          <span v-else-if="lastSaved" class="saved">
            <i class="fas fa-check"></i>
            Last saved: {{ formatLastSaved(lastSaved) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { formatDistanceToNow } from 'date-fns'

const settingsStore = useSettingsStore()

// Local state for form management
const localSettings = ref({})
const lastSaved = ref(null)

// Initialize local settings when store is ready
watch(
  () => settingsStore.settings,
  (newSettings) => {
    localSettings.value = JSON.parse(JSON.stringify(newSettings))
  },
  { immediate: true, deep: true }
)

// Watch for changes in store initialization
watch(
  () => settingsStore.initialized,
  (initialized) => {
    if (initialized && Object.keys(localSettings.value).length === 0) {
      localSettings.value = JSON.parse(JSON.stringify(settingsStore.settings))
    }
  }
)

// Methods
const saveSettings = async () => {
  try {
    await settingsStore.saveSettings(localSettings.value)
    lastSaved.value = new Date()
  } catch (error) {
    alert('Error saving settings: ' + error.message)
  }
}

const addDeliveryZone = () => {
  const newZone = {
    id: `zone_${Date.now()}`,
    name: '',
    fee: 150,
    minimumOrder: 0,
    enabled: true
  }
  localSettings.value.deliveryZones.push(newZone)
}

const removeDeliveryZone = (zoneId) => {
  if (confirm('Are you sure you want to remove this delivery zone?')) {
    localSettings.value.deliveryZones = localSettings.value.deliveryZones.filter(
      zone => zone.id !== zoneId
    )
  }
}

const resetToDefaults = async () => {
  if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    try {
      await settingsStore.resetToDefaults()
      lastSaved.value = new Date()
    } catch (error) {
      alert('Error resetting settings: ' + error.message)
    }
  }
}

const formatLastSaved = (date) => {
  return formatDistanceToNow(date, { addSuffix: true })
}

// Auto-save functionality (optional)
let autoSaveTimer = null
watch(
  localSettings,
  () => {
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    // Set new timer for auto-save after 2 seconds of inactivity
    autoSaveTimer = setTimeout(() => {
      saveSettings()
    }, 2000)
  },
  { deep: true }
)

// Cleanup timer on unmount
onMounted(() => {
  return () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
  }
})
</script>

<style scoped>
.settings-management {
  padding: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0 0 0.25rem 0;
  color: #1a202c;
}

.subtitle {
  color: #718096;
  margin: 0;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #2d3748;
}

.section-header h2 i {
  color: #3182ce;
  font-size: 1.25rem;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3182ce;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #2c5aa0;
}

.save-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.settings-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.settings-card h3 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  font-size: 1.125rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.125rem;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #48bb78;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #38a169;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-info label {
  display: block;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 0.25rem;
}

.setting-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
}

.number-input {
  width: 120px;
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  text-align: center;
  font-size: 0.875rem;
}

.number-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.number-input.small {
  width: 80px;
}

.select-input {
  width: 150px;
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
}

.select-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 30px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3182ce;
}

input:checked + .slider:before {
  transform: translateX(30px);
}

.toggle-label {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  color: #4a5568;
}

/* Delivery Zones */
.zones-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.zone-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.zone-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.zone-name-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.zone-name-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.remove-zone-btn {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-zone-btn:hover {
  background: #c53030;
}

.zone-settings {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.zone-setting {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.zone-setting label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Business Hours */
.business-hours-settings {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.time-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.time-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.time-input label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
}

.time-input-field {
  padding: 0.5rem;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.time-input-field:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.current-status {
  padding: 0.75rem;
  background: #edf2f7;
  border-radius: 6px;
}

.current-status p {
  margin: 0;
  font-size: 0.875rem;
  color: #2d3748;
}

.status-open {
  color: #38a169;
  font-weight: 600;
}

.status-closed {
  color: #e53e3e;
  font-weight: 600;
}

/* Settings Actions */
.settings-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-btn:hover:not(:disabled) {
  background: #c53030;
}

.reset-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.saving, .saved {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.saving {
  color: #3182ce;
}

.saved {
  color: #38a169;
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-management {
    padding: 1rem;
  }

  .settings-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .section-header h2 {
    justify-content: center;
  }

  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .setting-info {
    text-align: left;
  }

  .zone-settings {
    flex-direction: column;
    align-items: stretch;
  }

  .time-inputs {
    flex-direction: column;
  }

  .settings-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
