<template>
  <div class="login-wrapper">
    <!-- Animated Background -->
    <div class="bg-decoration">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="login-card glass-effect">
      <div class="login-header">
        <div class="logo-box">
          <img src="/mmh-logo.png" alt="MMH Hardware" class="logo-img" />
        </div>
        <h1>MMH Hardware</h1>
        <p>Inventory Management System</p>
      </div>

      <div class="login-body">
        <h2 class="form-title">Welcome Back</h2>
        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label>Email Address</label>
            <div class="input-with-icon">
              <i class="fas fa-envelope"></i>
              <input v-model="email" type="email" placeholder="name@company.com" required />
            </div>
          </div>

          <div class="form-group">
            <label>Password</label>
            <div class="input-with-icon">
              <i class="fas fa-lock"></i>
              <input :type="passwordFieldType" v-model="password" placeholder="••••••••" required />
              <button type="button" class="password-toggle" @click="togglePasswordVisibility">
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Bot Protection -->
          <div class="captcha-section">
            <label>Verification Code</label>
            <div class="captcha-box">
              <span class="captcha-code">{{ captchaText }}</span>
              <button type="button" @click="generateCaptcha" class="refresh-captcha">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
            <input
              v-model="userCaptchaAnswer"
              type="text"
              placeholder="Enter code above"
              class="captcha-input-field"
              maxlength="6"
              required
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="!isCaptchaValid">
            <span>Sign In</span>
            <i class="fas fa-arrow-right"></i>
          </button>
          
          <p v-if="error" class="error-msg">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </p>
        </form>
      </div>

      <div class="login-footer">
        <p>&copy; {{ new Date().getFullYear() }} MMH Hardware. All Rights Reserved.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase/config'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default {
  setup() {
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const router = useRouter()
    const showPassword = ref(false)

    // CAPTCHA Logic
    const captchaText = ref('')
    const captchaAnswer = ref('')
    const userCaptchaAnswer = ref('')
    const captchaFailedAttempts = ref(0)
    const maxCaptchaAttempts = 3

    const passwordFieldType = computed(() => showPassword.value ? 'text' : 'password')

    const generateCaptcha = () => {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      captchaAnswer.value = result.toLowerCase()
      captchaText.value = result
    }

    const isCaptchaValid = computed(() => {
      return userCaptchaAnswer.value.trim().toLowerCase() === captchaAnswer.value
    })

    const login = async () => {
      error.value = ''
      if (!isCaptchaValid.value) {
        captchaFailedAttempts.value++
        error.value = 'Invalid verification code'
        if (captchaFailedAttempts.value >= maxCaptchaAttempts) {
          generateCaptcha()
          captchaFailedAttempts.value = 0
          userCaptchaAnswer.value = ''
        }
        return
      }

      try {
        await signInWithEmailAndPassword(auth, email.value, password.value)
        router.push('/')
      } catch (err) {
        error.value = 'Invalid email or password'
        console.error(err)
      }
    }

    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value
    }

    generateCaptcha()

    return {
      email,
      password,
      error,
      login,
      showPassword,
      passwordFieldType,
      togglePasswordVisibility,
      captchaText,
      userCaptchaAnswer,
      isCaptchaValid,
      generateCaptcha
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-primary);
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

/* Background Aesthetics */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s infinite alternate;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background-color: var(--primary-light);
  top: -100px;
  right: -100px;
}

.blob-2 {
  width: 300px;
  height: 300px;
  background-color: var(--accent-light, #06b6d4);
  bottom: -50px;
  left: -50px;
  animation-delay: -5s;
}

.blob-3 {
  width: 250px;
  height: 250px;
  background-color: #818cf8;
  top: 40%;
  left: 20%;
  animation-delay: -10s;
}

@keyframes float {
  from { transform: translate(0, 0) rotate(0deg); }
  to { transform: translate(50px, 100px) rotate(10deg); }
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  z-index: 10;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-box {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
  background: white;
  padding: 0.75rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.login-header p {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.form-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon i {
  position: absolute;
  left: 1rem;
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

.input-with-icon input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white !important;
}

.input-with-icon input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
  outline: none;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
}

/* Captcha Styling */
.captcha-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(248, 250, 252, 0.5);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-medium);
}

.captcha-section label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.captcha-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
}

.captcha-code {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--primary-color);
  user-select: none;
}

.refresh-captcha {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s;
}

.refresh-captcha:hover {
  color: var(--primary-color);
}

.captcha-input-field {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  text-align: center;
}

.submit-btn {
  margin-top: 0.5rem;
  padding: 0.875rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: var(--error-color);
  font-size: 0.85rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.login-footer p {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Tablet */
@media (max-width: 768px) {
  .login-wrapper { padding: 1rem; }
  .blob-1 { width: 280px; height: 280px; }
  .blob-2 { width: 200px; height: 200px; }
  .blob-3 { width: 160px; height: 160px; }
  .login-card { max-width: 400px; padding: 2rem; }
  .login-header h1 { font-size: 1.35rem; }
}

/* Small phones */
@media (max-width: 480px) {
  .login-wrapper { padding: 0.75rem; }
  .blob-1 { width: 200px; height: 200px; top: -60px; right: -60px; }
  .blob-2 { width: 150px; height: 150px; }
  .blob-3 { width: 120px; height: 120px; }
  .login-card {
    padding: 1.5rem;
    border-radius: 16px;
  }
  .logo-box { width: 52px; height: 52px; }
  .login-header h1 { font-size: 1.2rem; }
  .login-header p { font-size: 0.8rem; }
  .form-title { font-size: 1rem; margin-bottom: 1rem; }
  .login-form { gap: 1rem; }
  .form-group label { font-size: 0.8rem; }
  .input-with-icon input {
    padding: 0.65rem 0.85rem 0.65rem 2.25rem;
    font-size: 0.9rem;
  }
  .captcha-section { padding: 0.75rem; }
  .captcha-code { font-size: 1.1rem; }
  .captcha-input-field { font-size: 0.85rem; }
  .submit-btn { padding: 0.75rem; font-size: 0.95rem; }
  .login-footer { margin-top: 1.25rem; }
}

/* Very small phones (Galaxy Fold, etc.) */
@media (max-width: 360px) {
  .login-wrapper { padding: 0.5rem; }
  .login-card { padding: 1.25rem; }
  .login-header { margin-bottom: 1.25rem; }
  .logo-box { width: 44px; height: 44px; margin-bottom: 0.75rem; }
  .login-header h1 { font-size: 1.1rem; }
  .form-title { font-size: 0.95rem; }
  .input-with-icon input {
    padding: 0.6rem 0.75rem 0.6rem 2rem;
    font-size: 16px; /* prevents iOS zoom */
  }
  .captcha-code { font-size: 1rem; letter-spacing: 0.15em; }
  .submit-btn { padding: 0.7rem; }
}
</style>
