<template>
  <div class="auth-container">
    <div v-if="isLogin">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Email" required />
        <div class="password-input-container">
          <input :type="passwordFieldType" v-model="password" placeholder="Password" required />
          <span class="password-toggle-icon" @click="togglePasswordVisibility">
            <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20" fill="currentColor">
              <path d="M288 144a110.94 110.94 0 0 0-31.24 5.39c-14.71 4.7-29.12 10.77-43.11 18.49C171.5 207.52 148.66 230 130.11 256c18.55 26 41.39 48.48 83.54 77.12 14 7.72 28.41 13.79 43.11 18.49A110.94 110.94 0 0 0 288 368c44.18 0 84.85-29.93 108.23-77.28 6.6-13.46 12.41-27.58 17.32-42.42-4.91-14.84-10.72-28.96-17.32-42.42C372.85 173.93 332.18 144 288 144zm0 176a64 64 0 1 1 0-128 64 64 0 1 1 0 128zM288 0C128 0 0 103.24 0 256S128 512 288 512s288-103.24 288-256S448 0 288 0zm0 448c-110.53 0-200-93.12-200-192 0-48.52 19.27-93.13 52.41-128C170.53 96.9 227.5 64 288 64c60.5 0 117.47 32.9 163.59 83.92 33.14 34.87 52.41 79.48 52.41 128 0 98.88-89.47 192-200 192z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20" fill="currentColor">
              <path d="M320 400c-75.85 0-137.25-57.72-142.9-133.15L72.2 189.82c-13.79 17.36-28 35.78-41.86 55.59L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400zm320-144c-28.8-57.44-88.4-134.67-158.25-196.42L360.91 246.29c-3.21-2.77-6.29-5.5-9.26-8.22L447.78 105.3C480.83 119.53 508.07 138.87 530.07 162.42c33.14 34.87 52.41 79.48 52.41 128c0 31.91-6.36 62.33-17.61 90.85L517.8 354.7c24.08-26.92 43.56-56.08 57.93-88.58zM320 128c59.52 0 114.12 30.83 146.62 83.92l-45.23 45.23c-19.76-30.92-51.26-53.2-89.39-53.2c-48.52 0-88 39.48-88 88s39.48 88 88 88c36.34 0 68.38-22.09 83.33-53.53l44.58 44.58C434.52 381.84 381.78 416 320 416c-110.53 0-200-93.12-200-192S209.47 128 320 128zm.71 64.7l-45.23 45.23c-4.53 4.53-4.53 11.79 0 16.32l51.2 51.2c4.53 4.53 11.79 4.53 16.32 0l45.23-45.23c4.53-4.53 4.53-11.79 0-16.32l-51.2-51.2c-4.53-4.52-11.79-4.52-16.32 0zM19.8 317.58c-2.6-3.8-5.1-7.7-7.5-11.6l-10.1-16.7c-1.1-1.8-2.1-3.6-3.1-5.5c-3.2-5.8-6.3-11.7-9.3-17.7L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400z"/>
            </svg>
          </span>
        </div>
        <button type="submit">Login</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <button @click="loginWithGoogle" class="google-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Sign in with Google
      </button>
      <p>Don't have an account? <a href="#" @click.prevent="isLogin = false">Register</a></p>
    </div>
    <div v-else>
      <h2>Register</h2>
      <form @submit.prevent="register">
        <input v-model="username" type="text" placeholder="Username" required />
        <input v-model="email" type="email" placeholder="Email" required />
        <div class="password-input-container">
          <input :type="passwordFieldType" v-model="password" placeholder="Password" required />
          <span class="password-toggle-icon" @click="togglePasswordVisibility">
            <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20" fill="currentColor">
              <path d="M288 144a110.94 110.94 0 0 0-31.24 5.39c-14.71 4.7-29.12 10.77-43.11 18.49C171.5 207.52 148.66 230 130.11 256c18.55 26 41.39 48.48 83.54 77.12 14 7.72 28.41 13.79 43.11 18.49A110.94 110.94 0 0 0 288 368c44.18 0 84.85-29.93 108.23-77.28 6.6-13.46 12.41-27.58 17.32-42.42-4.91-14.84-10.72-28.96-17.32-42.42C372.85 173.93 332.18 144 288 144zm0 176a64 64 0 1 1 0-128 64 64 0 1 1 0 128zM288 0C128 0 0 103.24 0 256S128 512 288 512s288-103.24 288-256S448 0 288 0zm0 448c-110.53 0-200-93.12-200-192 0-48.52 19.27-93.13 52.41-128C170.53 96.9 227.5 64 288 64c60.5 0 117.47 32.9 163.59 83.92 33.14 34.87 52.41 79.48 52.41 128 0 98.88-89.47 192-200 192z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="20" height="20" fill="currentColor">
              <path d="M320 400c-75.85 0-137.25-57.72-142.9-133.15L72.2 189.82c-13.79 17.36-28 35.78-41.86 55.59L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400zm320-144c-28.8-57.44-88.4-134.67-158.25-196.42L360.91 246.29c-3.21-2.77-6.29-5.5-9.26-8.22L447.78 105.3C480.83 119.53 508.07 138.87 530.07 162.42c33.14 34.87 52.41 79.48 52.41 128c0 31.91-6.36 62.33-17.61 90.85L517.8 354.7c24.08-26.92 43.56-56.08 57.93-88.58zM320 128c59.52 0 114.12 30.83 146.62 83.92l-45.23 45.23c-19.76-30.92-51.26-53.2-89.39-53.2c-48.52 0-88 39.48-88 88s39.48 88 88 88c36.34 0 68.38-22.09 83.33-53.53l44.58 44.58C434.52 381.84 381.78 416 320 416c-110.53 0-200-93.12-200-192S209.47 128 320 128zm.71 64.7l-45.23 45.23c-4.53 4.53-4.53 11.79 0 16.32l51.2 51.2c4.53 4.53 11.79 4.53 16.32 0l45.23-45.23c4.53-4.53 4.53-11.79 0-16.32l-51.2-51.2c-4.53-4.52-11.79-4.52-16.32 0zM19.8 317.58c-2.6-3.8-5.1-7.7-7.5-11.6l-10.1-16.7c-1.1-1.8-2.1-3.6-3.1-5.5c-3.2-5.8-6.3-11.7-9.3-17.7L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400z"/>
            </svg>
          </span>
        </div>
        <select v-model="role" required>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Register</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
      <p>Already have an account? <a href="#" @click.prevent="isLogin = true">Login</a></p>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/config'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword
} from 'firebase/auth'

export default {
  setup() {
    const isLogin = ref(true)
    const email = ref('')
    const password = ref('')
    const username = ref('') // Add username ref
    const role = ref('staff')
    const error = ref('')
    const router = useRouter()
    const showPassword = ref(false)

    const passwordFieldType = computed(() => showPassword.value ? 'text' : 'password')

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    const login = async () => {
      error.value = ''
      try {
        await signInWithEmailAndPassword(auth, email.value, password.value)
        router.push('/')
      } catch (err) {
        console.error('Login error:', err.message); // Add console.error for debugging
        error.value = err.message
      }
    }

    const register = async () => {
      error.value = ''
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
        const userDataToSave = {
          username: username.value, // Save username
          role: role.value
        };
        console.log('Saving user data to Firestore:', userDataToSave); // Debugging log
        await setDoc(doc(db, "users", userCredential.user.uid), userDataToSave);
        router.push('/')
      } catch (err) {
        console.error('Registration error:', err.message); // Add console.error for debugging
        error.value = err.message
      }
    }

    const loginWithGoogle = async () => {
      error.value = ''
      try {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(auth, provider)
        router.push('/')
      } catch (err) {
        error.value = err.message
      }
    }

    return { 
      isLogin, 
      email, 
      password, 
      username, // Expose username
      role, 
      error, 
      login, 
      register, 
      loginWithGoogle,
      showPassword,
      passwordFieldType,
      togglePasswordVisibility
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 350px;
  margin: 80px auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media (max-width: 480px) {
  .auth-container {
    margin-top: 40px; /* Reduce top margin on smaller screens */
    padding: 1.5rem;
  }
}
.auth-container h2 {
  margin-bottom: 1.5rem;
}
.auth-container form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.password-input-container {
  position: relative;
  width: 100%;
}
.password-input-container input {
  width: 100%;
  padding-right: 2.5rem; /* Make space for the icon */
}
.password-toggle-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.2rem;
  color: #888;
}
.auth-container input, .auth-container select {
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}
.auth-container button {
  padding: 0.7rem;
  border: none;
  border-radius: 6px;
  background: #3498db;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: background 0.2s;
}
.auth-container button:hover {
  background: #217dbb;
}
.google-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #444;
  border: 1px solid #ddd;
  margin-bottom: 1rem;
}
.google-btn img {
  width: 20px;
  height: 20px;
}
.error {
  color: #e74c3c;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}
p {
  margin-top: 1rem;
}
a {
  color: #3498db;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

</style>
