
// Staff Portal Auth Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '../firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {

  const user = ref(null)
  // Only 'admin' and 'staff' roles for staff portal
  const userRole = ref('staff') // Default role for staff portal
  const loading = ref(true)


  const isAdmin = computed(() => userRole.value === 'admin')
  const isStaff = computed(() => userRole.value === 'staff')


  // Initialize authentication and fetch user role
  const initializeAuth = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      loading.value = true
      try {
        if (firebaseUser) {
          user.value = firebaseUser
          console.log('Auth state changed: User logged in', firebaseUser.email);
          await fetchUserRole(firebaseUser.uid);
        } else {
          user.value = null
          userRole.value = 'staff' // Default to staff if not logged in
          console.log('Auth state changed: User logged out or no user');
        }
      } finally {
        loading.value = false
      }
      loading.value = false
    })
  }


  // Fetch user role from Firestore ('admin' or 'staff')
  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const role = userDoc.data().role
        userRole.value = (role === 'admin' || role === 'staff') ? role : 'staff'
        console.log('User role fetched:', userRole.value);
      } else {
        console.log('User document not found for uid:', uid);
        userRole.value = 'staff';
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      userRole.value = 'staff'
    }
  }


  // Role-based access: 'admin' > 'staff'
  const canAccess = (requiredRole) => {
    const roles = ['staff', 'admin']
    const userRoleIndex = roles.indexOf(userRole.value)
    const requiredRoleIndex = roles.indexOf(requiredRole)
    return userRoleIndex >= requiredRoleIndex
  }

  return {
    user,
    userRole,
    loading,
    isAdmin,
    isStaff,
    initializeAuth,
    canAccess
  }
})
