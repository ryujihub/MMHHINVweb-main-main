<template>
  <div class="guide-manual">
    <div class="page-header">
      <h1>Guide Manual</h1>
      <div class="header-actions">
        <button @click="exportToPdf" class="export-btn">
          <i class="fas fa-file-pdf"></i>
          Export PDF
        </button>
      </div>
    </div>
    <div class="guide-content" ref="guideContent">
      <h2>Welcome to Metro Manila Hills Hardware Management System!</h2>
      <p>This comprehensive guide will help you navigate and utilize all features of the hardware inventory and order management system.</p>

      <h3>1. Dashboard</h3>
      <p>The dashboard provides a comprehensive overview of your business performance including daily orders, pending orders, most ordered items, sales trends over time, and inventory breakdown. It serves as your central hub for quick insights and key performance indicators.</p>

      <h3>2. Product Catalog</h3>
      <p>The Product Catalog section allows you to efficiently manage your entire inventory. Features include:</p>
      <ul>
        <li>Search products by name, product code, or category</li>
        <li>Filter products by category for easy browsing</li>
        <li>View essential product details: name, category, price, current stock, and product code</li>
        <li>Quick stock status identification (In Stock, Low Stock, Out of Stock)</li>
        <li>Automatic alerts for low stock items</li>
        <li>Real-time inventory tracking</li>
      </ul>

      <h3>3. Order Processing System</h3>
      <p>The order processing system provides efficient order management with enhanced bulk operations:</p>
      <ul>
        <li><strong>New Order:</strong> Create new customer orders with an intuitive interface. Select products from your catalog, specify quantities, add customer information, and process orders efficiently.</li>
        <li><strong>Order Management:</strong> Comprehensive order management interface with advanced filtering, search capabilities, and professional bulk operations for handling multiple orders simultaneously.</li>
        <li><strong>Bulk Operations:</strong> Revolutionary multi-select functionality allowing you to update status, assign staff, or export multiple orders at once, dramatically improving workflow efficiency.</li>
        <li><strong>Smart Filtering:</strong> Filter orders by status, date range, and assigned staff to quickly find the orders you need to manage.</li>
        <li><strong>Real-time Updates:</strong> Order changes are reflected immediately across the system with visual feedback and notifications.</li>
      </ul>

      <h3>4. Order Export Features</h3>
      <p>The system now includes powerful export capabilities for order documentation:</p>
      <ul>
        <li><strong>Bulk Order Export:</strong> Export all filtered orders to Microsoft Word (DOCX) format with comprehensive reporting including order summaries, customer details, and business analytics.</li>
        <li><strong>Individual Order Export:</strong> Export detailed single order documents in DOCX format for customer records, invoicing, or documentation purposes.</li>
        <li><strong>Professional Formatting:</strong> All exports include company branding, proper formatting, and detailed breakdowns suitable for business use.</li>
        <li><strong>Automatic File Naming:</strong> Files are automatically named with timestamps for easy organization and record-keeping.</li>
      </ul>

      <h3>5. Reports & Analytics</h3>
      <p>The Reports section provides detailed business insights and analytics:</p>
      <ul>
        <li><strong>Sales Report:</strong> Comprehensive sales data including total orders, total revenue, average order value, best-selling products, and performance trends over selected periods. Export capabilities to CSV and PDF formats.</li>
        <li><strong>Inventory Report:</strong> Detailed inventory analysis showing stock movement, total items sold, low stock alerts, total stock value, and inventory turnover rates. Full export functionality available.</li>
        <li><strong>Custom Date Ranges:</strong> Filter reports by specific time periods for targeted analysis.</li>
        <li><strong>Visual Analytics:</strong> Charts and graphs for easy data interpretation.</li>
      </ul>

      <h3>6. Settings & Administration</h3>
      <p>Administrative users have access to system settings and user management features for maintaining the system and managing staff access levels.</p>

      <h3>7. User Management & Logout</h3>
      <p>Click on your avatar in the top right corner to access the Guide Manual or log out of the system securely. The system maintains user sessions and provides role-based access control.</p>

      <h3>8. Advanced Order Management Features</h3>
      <ul>
        <li><strong>QR Code Tracking:</strong> Generate and share QR codes with customers for easy order tracking and status updates.</li>
        <li><strong>Bulk Operations:</strong> Use checkbox selection to perform actions on multiple orders simultaneously, saving time on routine tasks.</li>
        <li><strong>Order Templates:</strong> Create templates from frequently ordered items to speed up repeat customer orders.</li>
        <li><strong>Delivery Scheduling:</strong> Plan and schedule deliveries in advance with time slot management for better logistics.</li>
        <li><strong>Order History Tracking:</strong> Access detailed logs of all order activities for audit trails and customer service.</li>
      </ul>

      <h3>9. Tips for Efficient Use</h3>
      <ul>
        <li>Use the search and filter functions to quickly locate products and orders</li>
        <li>Leverage bulk operations for routine tasks like status updates and staff assignments</li>
        <li>Create order templates for your most common orders to speed up processing</li>
        <li>Use QR codes to provide customers with easy access to order tracking</li>
        <li>Schedule deliveries during off-peak hours to optimize logistics</li>
        <li>Regularly export order data for backup and record-keeping purposes</li>
        <li>Monitor the dashboard daily for business performance insights</li>
        <li>Keep inventory levels updated to maintain accurate stock information</li>
        <li>Use the export features to generate professional documentation for customers and stakeholders</li>
      </ul>

      <p><strong>Support:</strong> If you encounter any issues or have questions about using the system, please contact your system administrator or technical support team.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const guideContent = ref(null);

const exportToPdf = () => {
  const doc = new jsPDF();
  let y = 20; // Initial Y position

  // Header
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Metro Manila Hills Hardware', 20, y);
  y += 10;
  doc.setFontSize(16);
  doc.text('System Guide Manual', 20, y);
  y += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, y);
  y += 15;

  const addText = (text, x, yPos, fontSize = 12, isBold = false, lineHeightMultiplier = 1.2) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const splitText = doc.splitTextToSize(text, 170); // Max width for text
    doc.text(splitText, x, yPos);
    return yPos + (splitText.length * fontSize * lineHeightMultiplier / doc.internal.scaleFactor) + 2;
  };

  const checkPageBreak = (currentY, additionalSpace = 20) => {
    if (currentY + additionalSpace > 280) {
      doc.addPage();
      return 20;
    }
    return currentY;
  };

  if (guideContent.value) {
    const sections = guideContent.value.children;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (section.tagName === 'H2') {
        y = checkPageBreak(y, 25);
        y = addText(section.textContent, 20, y + 8, 16, true);
      } else if (section.tagName === 'H3') {
        y = checkPageBreak(y, 20);
        y = addText(section.textContent, 20, y + 6, 14, true);
      } else if (section.tagName === 'P') {
        y = checkPageBreak(y, 15);
        y = addText(section.textContent, 20, y + 3);
      } else if (section.tagName === 'UL') {
        const listItems = Array.from(section.children).map(li => li.textContent);
        listItems.forEach(item => {
          y = checkPageBreak(y, 12);
          y = addText(`• ${item}`, 25, y + 2);
        });
        y += 3; // Extra space after list
      }
    }
  }

  doc.save('hardware_system_guide_manual.pdf');
};
</script>

<style scoped>
.guide-manual {
  padding: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.375rem;
  background: #dc2626;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;
}

.export-btn:hover {
  background: #b91c1c;
}

.page-header h1 {
  font-size: 2rem;
  color: #1f2937;
}

.guide-content h2 {
  font-size: 1.5rem;
  color: #2563eb;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.guide-content h3 {
  font-size: 1.25rem;
  color: #374151;
  margin-top: 1rem;
  margin-bottom: 0.75rem;
}

.guide-content p {
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
  margin-bottom: 1rem;
}

.guide-content ul {
  list-style-type: disc;
  margin-left: 20px;
  margin-bottom: 1rem;
}

.guide-content ul li {
  font-size: 1rem;
  line-height: 1.5;
  color: #4b5563;
  margin-bottom: 0.5rem;
}
</style>
