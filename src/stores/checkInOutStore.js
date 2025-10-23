// Staff Check-In/Check-Out Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '../firebase/config'
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from './authStore'

export const useCheckInOutStore = defineStore('checkInOut', () => {
  const authStore = useAuthStore()

  // State
  const currentSession = ref(null)
  const isCheckedIn = ref(false)
  const checkInTime = ref(null)
  const checkOutTime = ref(null)
  const loading = ref(false)
  const sessions = ref([])

  // Computed
  const sessionDuration = computed(() => {
    if (!checkInTime.value) return 0
    const endTime = checkOutTime.value || new Date()
    return Math.floor((endTime - checkInTime.value) / (1000 * 60)) // minutes
  })

  const formattedDuration = computed(() => {
    const minutes = sessionDuration.value
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  })

  const canAccessOrderProcess = computed(() => {
    return authStore.user && isCheckedIn.value
  })

  // Initialize check-in status
  const initializeCheckInStatus = async () => {
    if (!authStore.user) return

    loading.value = true
    try {
      // Get all sessions for this user (no compound query)
      const sessionsQuery = query(
        collection(db, 'checkInOutSessions'),
        where('userId', '==', authStore.user.uid)
      )

      const sessionsSnapshot = await getDocs(sessionsQuery)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filter for today's active sessions in JavaScript
      const todaySessions = sessionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(session => {
          if (!session.date) return false
          const sessionDate = session.date.toDate ? session.date.toDate() : new Date(session.date)
          return sessionDate >= today && sessionDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        })
        .filter(session => session.checkInTime && !session.checkOutTime) // Only active sessions
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
          return dateB - dateA
        })

      if (todaySessions.length > 0) {
        const activeSession = todaySessions[0] // Most recent active session
        currentSession.value = activeSession
        isCheckedIn.value = true
        checkInTime.value = activeSession.checkInTime?.toDate ? activeSession.checkInTime.toDate() : new Date(activeSession.checkInTime)
      }
    } catch (error) {
      console.error('Error initializing check-in status:', error)
    } finally {
      loading.value = false
    }
  }

  // Check In
  const checkIn = async () => {
    if (!authStore.user) {
      throw new Error('User must be authenticated to check in')
    }

    if (isCheckedIn.value) {
      throw new Error('Already checked in')
    }

    loading.value = true
    try {
      const now = new Date()
      const sessionData = {
        userId: authStore.user.uid,
        userEmail: authStore.user.email,
        userRole: authStore.userRole,
        checkInTime: now,
        checkOutTime: null,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        status: 'active',
        createdAt: now
      }

      const docRef = await addDoc(collection(db, 'checkInOutSessions'), sessionData)

      currentSession.value = {
        id: docRef.id,
        ...sessionData
      }

      isCheckedIn.value = true
      checkInTime.value = now

      console.log('Checked in successfully')
      return docRef.id
    } catch (error) {
      console.error('Error checking in:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Check Out
  const checkOut = async () => {
    if (!authStore.user) {
      throw new Error('User must be authenticated to check out')
    }

    if (!isCheckedIn.value) {
      throw new Error('Not checked in')
    }

    loading.value = true
    try {
      const now = new Date()

      // Update the session document
      const sessionRef = doc(db, 'checkInOutSessions', currentSession.value.id)
      await updateDoc(sessionRef, {
        checkOutTime: now,
        status: 'completed',
        updatedAt: now
      })

      // Update local state
      checkOutTime.value = now
      isCheckedIn.value = false

      // Add to sessions history
      const completedSession = {
        ...currentSession.value,
        checkOutTime: now,
        status: 'completed'
      }
      sessions.value.unshift(completedSession)
      currentSession.value = null

      console.log('Checked out successfully')
    } catch (error) {
      console.error('Error checking out:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Get sessions history
  const getSessionsHistory = async (days = 7) => {
    if (!authStore.user) return

    loading.value = true
    try {
      // Get all sessions for this user (simplest possible query)
      const sessionsQuery = query(
        collection(db, 'checkInOutSessions'),
        where('userId', '==', authStore.user.uid)
      )

      const sessionsSnapshot = await getDocs(sessionsQuery)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Filter and sort sessions in JavaScript
      sessions.value = sessionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkInTime: doc.data().checkInTime?.toDate(),
          checkOutTime: doc.data().checkOutTime?.toDate(),
          date: doc.data().date?.toDate()
        }))
        .filter(session => {
          if (!session.date && !session.createdAt) return false
          const sessionDate = session.date || new Date(session.createdAt)
          return sessionDate >= startDate
        })
        .sort((a, b) => {
          const dateA = a.date || new Date(a.createdAt)
          const dateB = b.date || new Date(b.createdAt)
          return dateB - dateA
        })
    } catch (error) {
      console.error('Error fetching sessions history:', error)
    } finally {
      loading.value = false
    }
  }

  // Reset state (for logout)
  const resetState = () => {
    currentSession.value = null
    isCheckedIn.value = false
    checkInTime.value = null
    checkOutTime.value = null
    sessions.value = []
  }

  return {
    // State
    currentSession,
    isCheckedIn,
    checkInTime,
    checkOutTime,
    loading,
    sessions,

    // Computed
    sessionDuration,
    formattedDuration,
    canAccessOrderProcess,

    // Methods
    initializeCheckInStatus,
    checkIn,
    checkOut,
    getSessionsHistory,
    resetState
  }
})
