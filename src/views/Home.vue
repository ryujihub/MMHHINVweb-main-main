<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Metro Manila Hills</h1>
          <h2 class="hero-subtitle">Construction Supply and Trading</h2>
          <p class="hero-description">
            Your trusted partner for quality construction materials and hardware supplies. 
            Serving Metro Manila and beyond with excellence, reliability, and unmatched service.
          </p>
          <div class="hero-buttons">
            <router-link to="/products" class="btn btn-primary">Explore Products</router-link>
            <router-link to="/contact" class="btn btn-secondary">Contact Us</router-link>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-placeholder">
            <i class="fas fa-building"></i>
            <i class="fas fa-tools"></i>
            <i class="fas fa-hard-hat"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Why Choose Us</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <h3>Quality Products</h3>
            <p>We offer only the finest construction materials and hardware supplies, ensuring durability and reliability for your projects.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-truck"></i>
            </div>
            <h3>Fast Delivery</h3>
            <p>Efficient delivery service to get your materials to your construction site on time, every time.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
            <h3>Competitive Prices</h3>
            <p>Best value for your money with competitive pricing on all our construction supplies and materials.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-users"></i>
            </div>
            <h3>Expert Support</h3>
            <p>Our experienced team is ready to assist you with product selection and project planning.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Products Preview Section -->
    <section class="products-preview-section">
      <div class="container">
        <h2 class="section-title">Our Product Categories</h2>
        <div class="categories-grid">
          <div class="category-card">
            <i class="fas fa-hammer"></i>
            <h3>Hand Tools</h3>
            <p>Quality hand tools for all your construction needs</p>
          </div>
          <div class="category-card">
            <i class="fas fa-cog"></i>
            <h3>Power Tools</h3>
            <p>Professional-grade power tools and equipment</p>
          </div>
          <div class="category-card">
            <i class="fas fa-cube"></i>
            <h3>Building Materials</h3>
            <p>Concrete, steel, lumber, and more</p>
          </div>
          <div class="category-card">
            <i class="fas fa-paint-brush"></i>
            <h3>Paint & Supplies</h3>
            <p>Complete range of paints and painting supplies</p>
          </div>
          <div class="category-card">
            <i class="fas fa-plug"></i>
            <h3>Electrical Supplies</h3>
            <p>Wires, switches, outlets, and electrical components</p>
          </div>
          <div class="category-card">
            <i class="fas fa-faucet"></i>
            <h3>Plumbing Materials</h3>
            <p>Pipes, fittings, and plumbing essentials</p>
          </div>
        </div>
        <div class="section-cta">
          <router-link to="/products" class="btn btn-primary">View All Products</router-link>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <h2>Ready to Start Your Project?</h2>
        <p>Contact us today for a quote or visit our store</p>
        <router-link to="/contact" class="btn btn-white">Get in Touch</router-link>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home-page {
  width: 100%;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
  color: white;
  padding: 80px 32px;
  min-height: 600px;
  display: flex;
  align-items: center;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-text {
  animation: fadeInUp 0.8s ease-out;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 2rem;
  font-weight: 500;
  margin-bottom: 24px;
  color: #94a3b8;
}

.hero-description {
  font-size: 1.25rem;
  line-height: 1.8;
  margin-bottom: 40px;
  color: #cbd5e1;
}

.hero-buttons {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px) scale(1.02);
}

.btn-secondary {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-secondary:hover {
  background: white;
  color: #1e293b;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-placeholder {
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.hero-placeholder i {
  font-size: 80px;
  color: rgba(255, 255, 255, 0.8);
  animation: float 3s ease-in-out infinite;
}

.hero-placeholder i:nth-child(2) {
  animation-delay: 0.5s;
}

.hero-placeholder i:nth-child(3) {
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
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

/* Features Section */
.features-section {
  padding: 80px 32px;
  background: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
  color: #1e293b;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
}

.feature-card {
  background: white;
  padding: 40px 32px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:nth-child(1) { animation-delay: 0.1s; }
.feature-card:nth-child(2) { animation-delay: 0.2s; }
.feature-card:nth-child(3) { animation-delay: 0.3s; }
.feature-card:nth-child(4) { animation-delay: 0.4s; }

.feature-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.feature-icon::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
  filter: blur(8px);
}

.feature-card:hover .feature-icon {
  transform: rotate(360deg) scale(1.1);
}

.feature-card:hover .feature-icon::before {
  opacity: 0.5;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1e293b;
}

.feature-card p {
  color: #64748b;
  line-height: 1.6;
}

/* Products Preview Section */
.products-preview-section {
  padding: 80px 32px;
  background: white;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  margin-bottom: 48px;
}

.category-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 40px 32px;
  border-radius: 16px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.category-card::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.category-card:hover::after {
  width: 300px;
  height: 300px;
}

.category-card:nth-child(1) { animation-delay: 0.1s; }
.category-card:nth-child(2) { animation-delay: 0.2s; }
.category-card:nth-child(3) { animation-delay: 0.3s; }
.category-card:nth-child(4) { animation-delay: 0.4s; }
.category-card:nth-child(5) { animation-delay: 0.5s; }
.category-card:nth-child(6) { animation-delay: 0.6s; }

.category-card:hover {
  transform: translateY(-12px) scale(1.05);
  border-color: #3b82f6;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
}

.category-card i {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
}

.category-card:hover i {
  transform: scale(1.2) rotate(10deg);
  color: #2563eb;
}

.category-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1e293b;
}

.category-card p {
  color: #64748b;
}

.section-cta {
  text-align: center;
  margin-top: 48px;
}

/* CTA Section */
.cta-section {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 80px 32px;
  text-align: center;
}

.cta-section h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.cta-section p {
  font-size: 1.25rem;
  margin-bottom: 32px;
  opacity: 0.9;
}

.btn-white {
  background: white;
  color: #3b82f6;
  padding: 16px 40px;
  font-size: 1.1rem;
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }

  .hero-description {
    font-size: 1.1rem;
  }

  .hero-placeholder {
    width: 100%;
    max-width: 300px;
    height: 300px;
  }

  .hero-placeholder i {
    font-size: 60px;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid,
  .categories-grid {
    grid-template-columns: 1fr;
  }

  .cta-section h2 {
    font-size: 2rem;
  }
}
</style>

