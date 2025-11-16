<template>
  <div class="contact-page">
    <div class="container">
      <!-- Header -->
      <section class="contact-header">
        <h1>Get in Touch</h1>
        <p class="subtitle">We're here to help with all your construction supply needs</p>
      </section>

      <div class="contact-content">
        <!-- Contact Information -->
        <section class="contact-info-section">
          <div class="info-cards">
            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <h3>Visit Us</h3>
              <p>Metro Manila Hills Construction Supply and Trading</p>
              <p class="info-detail">Metro Manila Hills, Montalban, Rizal, Philippines</p>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-phone"></i>
              </div>
              <h3>Call Us</h3>
              <p>For inquiries and orders</p>
              <p class="info-detail">[Your Phone Number]</p>
              <p class="info-detail">[Your Mobile Number]</p>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-envelope"></i>
              </div>
              <h3>Email Us</h3>
              <p>Send us a message</p>
              <p class="info-detail">nolimolina1987@gmail.com</p>
            </div>

            <div class="info-card">
              <div class="info-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3>Business Hours</h3>
              <p class="info-detail">Monday - Friday: 8:00 AM - 6:00 PM</p>
              <p class="info-detail">Saturday: 8:00 AM - 5:00 PM</p>
              <p class="info-detail">Sunday: Closed</p>
            </div>
          </div>
        </section>

        <!-- Contact Form -->
        <section class="contact-form-section">
          <h2>Send Us a Message</h2>
          <form @submit.prevent="handleSubmit" class="contact-form">
            <div class="form-group">
              <label for="name">Full Name *</label>
              <input
                type="text"
                id="name"
                v-model="form.name"
                required
                placeholder="Enter your full name"
              />
            </div>

            <div class="form-group">
              <label for="email">Email Address *</label>
              <input
                type="email"
                id="email"
                v-model="form.email"
                required
                placeholder="Enter your email address"
              />
            </div>

            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                v-model="form.phone"
                placeholder="Enter your phone number"
              />
            </div>

            <div class="form-group">
              <label for="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                v-model="form.subject"
                required
                placeholder="What is this regarding?"
              />
            </div>

            <div class="form-group">
              <label for="message">Message *</label>
              <textarea
                id="message"
                v-model="form.message"
                required
                rows="6"
                placeholder="Tell us how we can help you..."
              ></textarea>
            </div>

            <!-- Success Message -->
            <div v-if="submitSuccess" class="alert alert-success">
              <i class="fas fa-check-circle"></i>
              <span>Thank you for your message! We will get back to you soon.</span>
            </div>

            <!-- Error Message -->
            <div v-if="submitError" class="alert alert-error">
              <i class="fas fa-exclamation-circle"></i>
              <span>{{ errorMessage }}</span>
            </div>

            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="!isSubmitting">
                <i class="fas fa-paper-plane"></i> Send Message
              </span>
              <span v-else>
                <i class="fas fa-spinner fa-spin"></i> Sending...
              </span>
            </button>
          </form>
        </section>
      </div>

      <!-- Map Section (Placeholder) -->
      <section class="map-section">
        <h2>Find Us</h2>
        <div class="map-placeholder">
          <i class="fas fa-map-marked-alt"></i>
          <p>Map location will be displayed here</p>
          <p class="map-note">[Add your Google Maps embed or location details]</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import emailjs from '@emailjs/browser'

export default {
  name: 'Contact',
  data() {
    return {
      form: {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      },
      isSubmitting: false,
      submitSuccess: false,
      submitError: false,
      errorMessage: ''
    }
  },
  mounted() {
    // Initialize EmailJS with your Public Key
    // Get this from: https://dashboard.emailjs.com/admin/account
    // Go to EmailJS Dashboard → Account → General → Public Key
    const publicKey = 'YOUR_PUBLIC_KEY' // Replace with your EmailJS Public Key
    if (publicKey && publicKey !== 'YOUR_PUBLIC_KEY') {
      emailjs.init(publicKey)
    }
  },
  methods: {
    async handleSubmit() {
      // Validate form
      if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) {
        this.submitError = true
        this.errorMessage = 'Please fill in all required fields.'
        setTimeout(() => {
          this.submitError = false
        }, 3000)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.form.email)) {
        this.submitError = true
        this.errorMessage = 'Please enter a valid email address.'
        setTimeout(() => {
          this.submitError = false
        }, 3000)
        return
      }

      this.isSubmitting = true
      this.submitError = false
      
      try {
        // Prepare email template parameters
        const emailParams = {
          from_name: this.form.name,
          from_email: this.form.email,
          phone: this.form.phone || 'Not provided',
          subject: this.form.subject,
          message: this.form.message,
          to_email: 'nolimolina1987@gmail.com'
        }

        // Send email via EmailJS
        // Make sure to replace 'YOUR_TEMPLATE_ID' with your actual EmailJS Template ID
        const templateId = 'YOUR_TEMPLATE_ID' // Replace with your EmailJS Template ID
        if (!templateId || templateId === 'YOUR_TEMPLATE_ID') {
          throw new Error('EmailJS Template ID not configured. Please set your Template ID in Contact.vue')
        }
        
        await emailjs.send(
          'service_roaiiq7',      // Your EmailJS Service ID
          templateId,             // Your EmailJS Template ID
          emailParams
        )

        // Save to Firestore
        await addDoc(collection(db, 'contactMessages'), {
          name: this.form.name,
          email: this.form.email,
          phone: this.form.phone || 'Not provided',
          subject: this.form.subject,
          message: this.form.message,
          createdAt: serverTimestamp(),
          status: 'new',
          read: false,
          emailSent: true
        })

        // Show success message
        this.submitSuccess = true
        
        // Reset form
        this.form = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        }

        // Hide success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false
        }, 5000)

      } catch (error) {
        console.error('Error submitting form:', error)
        
        // Get error message (EmailJS provides error.text, standard errors have error.message)
        const errorMessage = error.text || error.message || 'Unknown error occurred'
        
        // Try to save to Firestore even if email fails
        try {
          const firestoreData = {
            name: this.form.name,
            email: this.form.email,
            phone: this.form.phone || 'Not provided',
            subject: this.form.subject,
            message: this.form.message,
            createdAt: serverTimestamp(),
            status: 'new',
            read: false,
            emailSent: false
          }
          
          // Only add emailError if we have a valid error message
          if (errorMessage && errorMessage !== 'Unknown error occurred') {
            firestoreData.emailError = errorMessage
          }
          
          await addDoc(collection(db, 'contactMessages'), firestoreData)
        } catch (firestoreError) {
          console.error('Error saving to Firestore:', firestoreError)
        }

        this.submitError = true
        this.errorMessage = 'Failed to send message. Please try again later or contact us directly at nolimolina1987@gmail.com'
        setTimeout(() => {
          this.submitError = false
        }, 5000)
      } finally {
        this.isSubmitting = false
      }
    }
  }
}
</script>

<style scoped>
.contact-page {
  padding: 60px 32px;
  background: #f8fafc;
  min-height: calc(100vh - 76px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.contact-header {
  text-align: center;
  margin-bottom: 60px;
}

.contact-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 1.25rem;
  color: #64748b;
  max-width: 700px;
  margin: 0 auto;
}

/* Contact Content */
.contact-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 60px;
  margin-bottom: 80px;
}

/* Contact Info Section */
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.05), transparent);
  transition: left 0.5s ease;
}

.info-card:hover::before {
  left: 100%;
}

.info-card:nth-child(1) { animation-delay: 0.1s; }
.info-card:nth-child(2) { animation-delay: 0.2s; }
.info-card:nth-child(3) { animation-delay: 0.3s; }
.info-card:nth-child(4) { animation-delay: 0.4s; }

.info-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.info-icon::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
  filter: blur(8px);
}

.info-card:hover .info-icon {
  transform: rotate(360deg) scale(1.15);
}

.info-card:hover .info-icon::after {
  opacity: 0.5;
}

.info-icon i {
  font-size: 1.5rem;
  color: white;
}

.info-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.info-card > p {
  color: #64748b;
  margin-bottom: 8px;
}

.info-detail {
  color: #475569;
  font-weight: 500;
  margin-bottom: 4px;
}

/* Contact Form Section */
.contact-form-section {
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: fadeInRight 0.6s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.contact-form-section h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
  animation: slideInUp 0.4s ease-out backwards;
}

.form-group:nth-child(1) input { animation-delay: 0.1s; }
.form-group:nth-child(2) input { animation-delay: 0.2s; }
.form-group:nth-child(3) input { animation-delay: 0.3s; }
.form-group:nth-child(4) input { animation-delay: 0.4s; }
.form-group:nth-child(5) textarea { animation-delay: 0.5s; }

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(-1px) scale(1);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Alert Messages */
.alert {
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideDown 0.3s ease-out;
  font-weight: 500;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.alert-success i {
  color: #10b981;
  font-size: 1.25rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.alert-error i {
  color: #ef4444;
  font-size: 1.25rem;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Map Section */
.map-section {
  margin-top: 60px;
}

.map-section h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
}

.map-placeholder {
  background: white;
  padding: 80px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  border: 2px dashed #cbd5e1;
}

.map-placeholder i {
  font-size: 4rem;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.map-placeholder p {
  color: #64748b;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.map-note {
  font-size: 0.9rem;
  color: #94a3b8;
  font-style: italic;
}

/* Responsive */
@media (max-width: 968px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .contact-page {
    padding: 40px 16px;
  }

  .contact-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .contact-form-section {
    padding: 32px 24px;
  }

  .info-cards {
    gap: 20px;
  }

  .info-card {
    padding: 24px;
  }

  .map-placeholder {
    padding: 60px 24px;
  }

  .map-placeholder i {
    font-size: 3rem;
  }
}
</style>

