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
      <p>This guide will help you navigate and utilize the features of this application.</p>

      <h3>1. Dashboard</h3>
      <p>The dashboard provides an overview of your daily orders, pending orders, most ordered items, sales over time, and inventory breakdown. It's your central hub for quick insights into your business performance.</p>

      <h3>2. Product Catalog</h3>
      <p>The Product Catalog section allows you to efficiently manage your inventory. Here, you can search for products by name, product code, or category, and filter them by category. Each product card displays essential details such as name, category, price, current stock level, and product code. You can also quickly identify stock status (In Stock, Low Stock, Out of Stock) and receive alerts for low stock items.</p>

      <h3>3. Order Processing</h3>
      <p>This section is divided into two sub-menus:</p>
      <ul>
        <li><strong>New Order:</strong> Use this to create new customer orders. You can select products from your catalog, specify quantities, and process the order.</li>
        <li><strong>Orders:</strong> View a list of all orders, track their status (pending, processed, etc.), and manage order details.</li>
      </ul>

      <h3>4. Reports</h3>
      <p>The Reports section offers detailed insights into your sales and inventory. It is divided into:</p>
      <ul>
        <li><strong>Sales Report:</strong> Provides data on total orders, total revenue, average order value, and best-selling products over a selected period. You can export this data to CSV or PDF.</li>
        <li><strong>Inventory Report:</strong> Shows stock movement, total items sold, low stock items, and total stock value. This report can also be exported to CSV or PDF.</li>
      </ul>

      <h3>5. User Profile & Logout</h3>
      <p>Click on your avatar in the top right corner to access your profile or log out of the system.</p>

      <p>If you encounter any issues or have further questions, please contact support.</p>
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

  doc.setFontSize(20);
  doc.text('Guide Manual', 20, y);
  y += 15; // Space after main title

  doc.setFontSize(14);
  doc.text('Welcome to Metro Manila Hills Hardware Management System!', 20, y);
  y += 10; // Space after welcome message

  doc.setFontSize(12);
  doc.text('This guide will help you navigate and utilize the features of this application.', 20, y);
  y += 15; // Space before first section

  const addText = (text, x, yPos, fontSize = 12, isBold = false, lineHeightMultiplier = 1.2) => {
    doc.setFontSize(fontSize);
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const splitText = doc.splitTextToSize(text, 170); // Max width for text
    doc.text(splitText, x, yPos);
    return yPos + (splitText.length * fontSize * lineHeightMultiplier / doc.internal.scaleFactor);
  };

  if (guideContent.value) {
    const sections = guideContent.value.children;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.tagName === 'H2') {
        y = addText(section.textContent, 20, y + 10, 16, true); // Larger space before H2
      } else if (section.tagName === 'H3') {
        y = addText(section.textContent, 20, y + 8, 14, true); // Smaller space before H3
      } else if (section.tagName === 'P') {
        y = addText(section.textContent, 20, y + 5); // Smaller space before P
      } else if (section.tagName === 'UL') {
        const listItems = Array.from(section.children).map(li => li.textContent);
        listItems.forEach(item => {
          y = addText(`• ${item}`, 25, y + 4); // Even smaller space for list items
        });
      }
      if (y > 280) { // Check if content exceeds page height
        doc.addPage();
        y = 20;
      }
    }
  }

  doc.save('guide_manual.pdf');
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
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-btn:hover {
  background: #e5e7eb;
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
