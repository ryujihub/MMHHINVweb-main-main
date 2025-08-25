<template>
  <div class="auth-container">
    <div v-if="isLogin">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
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
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase/config'
import { doc, setDoc } from 'firebase/firestore'
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
    const role = ref('staff')
    const error = ref('')
    const router = useRouter()

    const login = async () => {
      error.value = ''
      try {
        await signInWithEmailAndPassword(auth, email.value, password.value)
        router.push('/')
      } catch (err) {
        error.value = err.message
      }
    }

    const register = async () => {
      error.value = ''
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          role: role.value
        });
        router.push('/')
      } catch (err) {
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

    return { isLogin, email, password, role, error, login, register, loginWithGoogle }
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
.auth-container h2 {
  margin-bottom: 1.5rem;
}
.auth-container form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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