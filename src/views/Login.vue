<template>
  <div class="auth-container">
    <div v-if="isLogin">
      <!-- Login Page Logo -->
      <div class="login-logo">
        <img src="/mmh-logo.png" alt="MMH Hardware" class="login-logo-image" />
        <h1 class="login-title">MMH Hardware</h1>
        <p class="login-subtitle">Inventory Management System</p>
      </div>
      
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
              <path d="M320 400c-75.85 0-137.25-57.72-142.9-133.15L72.2 189.82c-13.79 17.36-28 35.78-41.86 55.59L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400zm320-144c-28.8-57.44-88.4-134.67-158.25-196.42L360.91 246.29c-3.21-2.77-6.29-5.5-9.26-8.22L447.78 105.3C480.83 119.53 508.07 138.87 530.07 162.42c33.14 34.87 52.41 79.48 52.41 128c0 31.91-6.36 62.33-17.61 90.85L517.8 354.7c24.08-26.92 43.56-56.08 57.93-88.58zM320 128c59.52 0 114.12 30.83 146.62 83.92l-45.23 45.23c-19.76-30.92-51.26-53.2-89.39-53.2c-48.52 0-88 39.48-88 88s39.48 88 88 88c36.34 0 68.38-22.09 83.33-53.53l44.58 44.58C434.52 381.84 381.78 416 320 416c-110.53 0-200-93.12-200-192S209.47 128 320 128zm.71 64.7l-45.23 45.23c-4.53 4.53-4.53 11.79 0 16.32l51.2 51.2c-4.53 4.53 11.79 4.53 16.32 0l45.23-45.23c4.53-4.53 4.53-11.79 0-16.32l-51.2-51.2c-4.53-4.52-11.79-4.52-16.32 0zM19.8 317.58c-2.6-3.8-5.1-7.7-7.5-11.6l-10.1-16.7c-1.1-1.8-2.1-3.6-3.1-5.5c-3.2-5.8-6.3-11.7-9.3-17.7L0 256c55.54 99.54 196.53 192 320 192c22.2 0 43.28-1.92 63.31-5.38l-36.01-36.01C345.12 395.64 332.5 400 320 400z"/>
            </svg>
          </span>
        </div>

        <!-- Enhanced Bot Protection CAPTCHA -->
        <div class="captcha-container">
          <label class="captcha-label">Enter the text below:</label>
          <div class="captcha-display">
            <span class="captcha-text">{{ captchaText }}</span>
            <button type="button" @click="generateCaptcha" class="captcha-refresh">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8v2l4-4-4-4zm0 16v2c5.52 0 10-4.48 10-10h-2c0 4.41-3.59 8-8 8v-2l-4 4 4 4z"/>
              </svg>
            </button>
          </div>
          <input
            v-model="userCaptchaAnswer"
            type="text"
            placeholder="Enter the text above"
            class="captcha-input"
            maxlength="6"
            required
          />
        </div>

        <button type="submit" :disabled="!isCaptchaValid">Login</button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>

    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import {
  signInWithEmailAndPassword
} from 'firebase/auth'

export default {
  setup() {
    const isLogin = ref(true) // Keep for template compatibility
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const router = useRouter()
    const showPassword = ref(false)

    // Enhanced bot protection
    const captchaText = ref('')
    const captchaAnswer = ref('')
    const userCaptchaAnswer = ref('')
    const captchaFailedAttempts = ref(0)
    const maxCaptchaAttempts = 3

    const passwordFieldType = computed(() => showPassword.value ? 'text' : 'password')

    // Generate sophisticated CAPTCHA text
    const generateCaptcha = () => {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      captchaAnswer.value = result.toLowerCase()
      captchaText.value = result
    }

    // Computed property to check if CAPTCHA is valid
    const isCaptchaValid = computed(() => {
      return userCaptchaAnswer.value.trim().toLowerCase() === captchaAnswer.value
    })

    // Enhanced login with better bot detection
    const login = async () => {
      error.value = ''

      // Validate CAPTCHA before login
      if (!isCaptchaValid.value) {
        captchaFailedAttempts.value++
        error.value = 'Please enter the correct verification code'

        // After 3 failed attempts, generate new CAPTCHA
        if (captchaFailedAttempts.value >= maxCaptchaAttempts) {
          generateCaptcha()
          captchaFailedAttempts.value = 0
          userCaptchaAnswer.value = ''
          error.value = 'Too many failed attempts. New verification code generated.'
        }
        return
      }

      // Reset CAPTCHA attempts on successful validation
      captchaFailedAttempts.value = 0

      try {
        await signInWithEmailAndPassword(auth, email.value, password.value)
        router.push('/')
      } catch (err) {
        console.error('Login error:', err.message)
        error.value = err.message
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }



    // Initialize CAPTCHA on component setup
    generateCaptcha()

    return {
      isLogin,
      email,
      password,
      error,
      login,
      showPassword,
      passwordFieldType,
      togglePasswordVisibility,
      captchaText,
      captchaAnswer,
      userCaptchaAnswer,
      isCaptchaValid,
      generateCaptcha
    }
  }
}
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 60px auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Login Logo Styles */
.login-logo {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  width: 100%;
}

.login-logo-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tablet responsiveness */
@media (max-width: 768px) {
  .auth-container {
    max-width: 400px;
    margin: 60px auto;
    padding: 1.75rem;
  }
}

/* Mobile responsiveness */
@media (max-width: 480px) {
  .auth-container {
    max-width: 100%;
    width: calc(100% - 2rem);
    margin: 20px auto;
    padding: 1.5rem;
    border-radius: 8px;
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

.error {
  color: #e74c3c;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.captcha-container {
  margin: 1rem 0;
}

.captcha-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #2c3e50;
  font-weight: 500;
}

.captcha-input {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.captcha-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.captcha-input:invalid {
  border-color: #e74c3c;
}

.captcha-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.captcha-text {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 2px solid #e9ecef;
  letter-spacing: 0.1em;
  user-select: none;
}

.captcha-refresh {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.captcha-refresh:hover {
  background: #5a6268;
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

/* Additional mobile responsiveness for form elements */
@media (max-width: 768px) {
  .auth-container h2 {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .auth-container input,
  .auth-container button {
    padding: 0.8rem;
    font-size: 1rem;
  }

  .captcha-container {
    margin: 1.25rem 0;
  }

  .captcha-label {
    font-size: 0.85rem;
  }

  .captcha-text {
    font-size: 1.1rem;
    padding: 0.6rem 0.9rem;
  }

  .captcha-input {
    padding: 0.8rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .auth-container h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .auth-container form {
    gap: 0.9rem;
  }

  .auth-container input,
  .auth-container button {
    padding: 0.75rem;
    font-size: 0.95rem;
    border-radius: 4px;
  }

  .password-toggle-icon {
    right: 8px;
    font-size: 1.1rem;
  }

  .captcha-container {
    margin: 1rem 0;
  }

  .captcha-label {
    font-size: 0.8rem;
    margin-bottom: 0.4rem;
  }

  .captcha-display {
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }

  .captcha-text {
    font-size: 1rem;
    padding: 0.5rem 0.8rem;
    letter-spacing: 0.05em;
  }

  .captcha-refresh {
    padding: 0.4rem;
  }

  .captcha-input {
    padding: 0.75rem;
    font-size: 0.95rem;
    border-radius: 4px;
  }

  .error {
    font-size: 0.9rem;
    line-height: 1.4;
  }
}

</style>
