
// Staff Portal Auth Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '../supabase/supabaseClient'

export const useAuthStore = defineStore('auth', () => {

  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value); // New reactive isAuthenticated state
  // Only 'admin' and 'staff' roles for staff portal
  const userRole = ref('staff') // Default role for staff portal
  const loading = ref(true)
  let authListener = null // Store listener reference to prevent duplicates


  const isAdmin = computed(() => userRole.value === 'admin')
  const isStaff = computed(() => userRole.value === 'staff')


  // Initialize authentication and fetch user role
  const initializeAuth = () => {
    // Prevent multiple listeners
    if (authListener) {
      console.log('Auth listener already initialized, skipping...');
      return;
    }

    console.log('Initializing auth listener...');
    authListener = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event, 'Session exists:', !!session);
      loading.value = true
      try {
        if (session) {
          user.value = session.user
          console.log('Auth state changed: User logged in', session.user.email);
          await fetchUserRole(session.user.id);
        } else {
          user.value = null
          userRole.value = 'staff' // Default to staff if not logged in
          console.log('Auth state changed: User logged out or no user');
        }
      } finally {
        loading.value = false
      }
    })
  }


  // Fetch user role from Supabase ('admin' or 'staff')
  const fetchUserRole = async (uid) => {
    try {
      const { data, error } = await db.from('users').select('role').eq('id', uid).single();
      if (error) throw error;

      if (data) {
        const role = data.role
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

  const setUserRole = (role) => {
    userRole.value = (role === 'admin' || role === 'staff') ? role : 'staff';
  };

  // Logout function
  const logout = async () => {
    try {
      loading.value = true;
      console.log('Attempting to logout user...');

      // Sign out from Supabase
      const { error } = await auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
        throw error;
      }

      // Clear local state
      user.value = null;
      userRole.value = 'staff';

      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    isAuthenticated, // Expose isAuthenticated
    userRole,
    loading,
    isAdmin,
    isStaff,
    initializeAuth,
    fetchUserRole,
    canAccess,
    setUserRole,
    logout
  }
})
