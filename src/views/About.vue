<template>
  <div class="about-page">
    <div class="container">
      <!-- Header Section -->
      <section class="about-header">
        <h1>About Metro Manila Hills</h1>
        <h2>Construction Supply and Trading</h2>
        <p class="lead-text">
          Your trusted partner in construction and building excellence since our establishment.
        </p>
      </section>

      <!-- Mission & Vision -->
      <section class="mission-vision">
        <div class="mv-grid">
          <div class="mv-card">
            <div class="mv-icon">
              <i class="fas fa-bullseye"></i>
            </div>
            <h3>Our Mission</h3>
            <p>
              To provide high-quality construction materials and hardware supplies that meet the highest standards 
              of excellence. We are committed to supporting builders, contractors, and homeowners in bringing their 
              construction projects to life with reliable products and exceptional service.
            </p>
          </div>
          <div class="mv-card">
            <div class="mv-icon">
              <i class="fas fa-eye"></i>
            </div>
            <h3>Our Vision</h3>
            <p>
              To be the leading construction supply and trading company in Metro Manila, recognized for our 
              commitment to quality, customer satisfaction, and innovation in the construction industry. 
              We aim to build lasting relationships with our clients through trust and reliability.
            </p>
          </div>
        </div>
      </section>

      <!-- Values Section -->
      <section class="values-section">
        <h2 class="section-title">Our Core Values</h2>
        <div class="values-grid">
          <div class="value-card">
            <i class="fas fa-star"></i>
            <h3>Quality</h3>
            <p>We never compromise on quality. Every product we offer meets rigorous standards.</p>
          </div>
          <div class="value-card">
            <i class="fas fa-handshake"></i>
            <h3>Integrity</h3>
            <p>Honest business practices and transparent dealings with all our clients.</p>
          </div>
          <div class="value-card">
            <i class="fas fa-heart"></i>
            <h3>Customer Focus</h3>
            <p>Your satisfaction is our priority. We go the extra mile for every customer.</p>
          </div>
          <div class="value-card">
            <i class="fas fa-rocket"></i>
            <h3>Innovation</h3>
            <p>Continuously improving our services and staying updated with industry trends.</p>
          </div>
        </div>
      </section>

      <!-- Why Choose Us -->
      <section class="why-choose-section">
        <h2 class="section-title">Why Choose Metro Manila Hills</h2>
        <div class="why-grid">
          <div class="why-item">
            <div class="why-number">01</div>
            <h3>Extensive Product Range</h3>
            <p>From basic hardware to specialized construction materials, we have everything you need.</p>
          </div>
          <div class="why-item">
            <div class="why-number">02</div>
            <h3>Expert Team</h3>
            <p>Our knowledgeable staff is always ready to assist you with product selection and project advice.</p>
          </div>
          <div class="why-item">
            <div class="why-number">03</div>
            <h3>Competitive Pricing</h3>
            <p>We offer the best value for your money without compromising on quality.</p>
          </div>
          <div class="why-item">
            <div class="why-number">04</div>
            <h3>Reliable Service</h3>
            <p>Timely delivery and consistent service that you can count on for every project.</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="about-cta">
        <h2>Ready to Work With Us?</h2>
        <p>Let's build something great together</p>
        <div class="cta-buttons">
          <router-link to="/contact" class="btn btn-primary">Contact Us</router-link>
          <router-link to="/products" class="btn btn-secondary">View Products</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
}
</script>

<style scoped>
.about-page {
  padding: 60px 32px;
  background: #f8fafc;
  min-height: calc(100vh - 76px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Section */
.about-header {
  text-align: center;
  margin-bottom: 80px;
  padding: 40px 0;
}

.about-header h1 {
  font-size: 3rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.about-header h2 {
  font-size: 2rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 24px;
}

.lead-text {
  font-size: 1.25rem;
  color: #64748b;
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
}

/* Mission & Vision */
.mission-vision {
  margin-bottom: 80px;
}

.mv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 40px;
}

.mv-card {
  background: white;
  padding: 48px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.mv-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.05), transparent);
  transition: left 0.6s ease;
}

.mv-card:hover::before {
  left: 100%;
}

.mv-card:nth-child(1) { animation-delay: 0.1s; }
.mv-card:nth-child(2) { animation-delay: 0.3s; }

.mv-card:hover {
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

.mv-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  margin-bottom: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.mv-icon::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
  filter: blur(12px);
}

.mv-card:hover .mv-icon {
  transform: rotate(360deg) scale(1.15);
}

.mv-card:hover .mv-icon::after {
  opacity: 0.6;
}

.mv-card h3 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.mv-card p {
  color: #64748b;
  line-height: 1.8;
  font-size: 1.1rem;
}

/* Values Section */
.values-section {
  margin-bottom: 80px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  color: #1e293b;
  margin-bottom: 48px;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
}

.value-card {
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

.value-card::before {
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

.value-card:hover::before {
  width: 300px;
  height: 300px;
}

.value-card:nth-child(1) { animation-delay: 0.1s; }
.value-card:nth-child(2) { animation-delay: 0.2s; }
.value-card:nth-child(3) { animation-delay: 0.3s; }
.value-card:nth-child(4) { animation-delay: 0.4s; }

.value-card:hover {
  transform: translateY(-12px) scale(1.05);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.value-card i {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
}

.value-card:hover i {
  transform: scale(1.3) rotate(15deg);
  color: #2563eb;
}

.value-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.value-card p {
  color: #64748b;
  line-height: 1.6;
}

/* Why Choose Section */
.why-choose-section {
  margin-bottom: 80px;
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.why-item {
  background: white;
  padding: 40px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  animation: fadeInUp 0.6s ease-out backwards;
  overflow: hidden;
}

.why-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.4s ease;
}

.why-item:hover::after {
  width: 100%;
}

.why-item:nth-child(1) { animation-delay: 0.1s; }
.why-item:nth-child(2) { animation-delay: 0.2s; }
.why-item:nth-child(3) { animation-delay: 0.3s; }
.why-item:nth-child(4) { animation-delay: 0.4s; }

.why-item:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.why-number {
  font-size: 3rem;
  font-weight: 700;
  color: #3b82f6;
  opacity: 0.2;
  position: absolute;
  top: 20px;
  right: 20px;
}

.why-item h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  margin-top: 20px;
}

.why-item p {
  color: #64748b;
  line-height: 1.6;
}

/* CTA Section */
.about-cta {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  padding: 60px 40px;
  border-radius: 16px;
  text-align: center;
}

.about-cta h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.about-cta p {
  font-size: 1.25rem;
  margin-bottom: 32px;
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
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
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
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

/* Responsive */
@media (max-width: 768px) {
  .about-page {
    padding: 40px 16px;
  }

  .about-header h1 {
    font-size: 2rem;
  }

  .about-header h2 {
    font-size: 1.5rem;
  }

  .lead-text {
    font-size: 1.1rem;
  }

  .mv-grid {
    grid-template-columns: 1fr;
  }

  .mv-card {
    padding: 32px 24px;
  }

  .section-title {
    font-size: 2rem;
  }

  .values-grid,
  .why-grid {
    grid-template-columns: 1fr;
  }

  .about-cta h2 {
    font-size: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
</style>

