# MMH Hardware Management System

## 🌐 Web-Based Management & Accessibility Platform

The MMH Hardware Management System is a **centralized, always-accessible dashboard** designed for **management, monitoring, and oversight** of hardware inventory operations. This web-based system provides comprehensive control and visibility from anywhere in the world.

## 🎯 Objectives and Scope and Delimitation

**Objectives:**
To provide a centralized web-based platform for efficient management, monitoring, and oversight of hardware inventory operations.
To enable real-time tracking of stock levels, sales performance, and recent activities for informed decision-making.
To streamline order processing and management, from creation to fulfillment, ensuring accurate record-keeping.
To offer comprehensive reporting and analytics capabilities for in-depth insights into inventory health and sales trends.
To implement a secure system with role-based access control, ensuring appropriate access levels for different user types.

**Scope and Delimitation:**
The Metro Manila Hills Hardware Management System is a web application focused on administrative functions for hardware inventory.
It includes modules for:
Dashboard: Providing an overview of operational statistics and quick actions.
Product Catalog: Managing product listings with search, filter, and low-stock alert functionalities.
Order Management: Handling the full lifecycle of customer orders, including creation, tracking, and modification.
Reports & Analytics: Generating various reports (sales, stock movement) with export options.
User Management: Implementing role-based access control for managers and staff.

The system's primary focus is on web-based access and real-time data updates. Inventory updates can be performed via a mobile application for QR/barcode scanning. It does not include:
Financial accounting features such as invoicing, tax computation, or payment processing.
Advanced predictive analytics beyond current trends.
Customer-facing e-commerce functionalities (it is an internal administrative tool).
Mobile native applications (though it is responsively designed for mobile browsers).

## ✨ Key Features

### 📊 **Dashboard Overview**
- **Real-time Statistics**: Stock levels, sales performance, and recent activities.
- **Quick Actions**: Approve/reject requests, reorder items, and manage critical alerts.
- **Performance Metrics**: Sales trends, customer insights, and inventory health.

### 📦 **Product Catalog**
- **Product Listing**: Displays all products with their names, categories, prices, stock levels, and product codes.
- **Search & Filter**: Easily search for products by name, product code, or category, and filter by category.
- **Low Stock Alerts**: Visually highlights products that are running low on stock.
- **Grid Layout**: Products are displayed in a responsive 4-column grid for better readability and organization.

### 📝 **Order Processing and Management**
- **New Order Creation**: Efficiently process new customer orders.
- **Order Tracking**: Monitor the status of all orders from placement to fulfillment.
-- **Order Editing**: Modify existing orders, including item quantities and customer details.
- **Order History**: Maintain a comprehensive record of all past orders for easy reference.
- **Status Updates**: Real-time updates on order status (e.g., pending, confirmed, shipped, delivered).

### 📈 **Reports & Analytics**
- **Date Range & Period Selection**: Generate reports for daily, weekly, or monthly periods within a custom date range.
- **Orders Summary**: Provides total orders, total revenue, and average order value, visualized with an interactive chart.
- **Best Selling Products**: Lists top-performing products based on revenue and quantity sold.
- **Stock Movement**: Tracks total items sold, low stock items count, and total stock value, visualized with a bar chart.
- **Export Options**: Export reports to CSV and PDF formats for external analysis and record-keeping.

### 🔐 **Role-Based Access Control**
- **Manager Access**: Full system access with approval capabilities.
- **Staff Access**: Basic inventory and sales operations.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Firebase project with Firestore database
- Modern web browser

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ryujihub/MMHHINVweb-main.git
    cd MMHHINVweb-main
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    - Create a `.env` file in the root directory
    - Add your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Start development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

## 🏗️ System Architecture

### Frontend
- **Vue.js 3**: Modern reactive framework with Composition API.
- **Vue Router**: Client-side routing and navigation.
- **Pinia**: State management for complex data flows.
- **Chart.js**: Interactive charts and data visualization, with `chartjs-adapter-date-fns` for time series.
- **Vuepic/Vue-Datepicker**: Date range selection component.
- **jsPDF** and **jspdf-autotable**: For generating PDF reports.

### Backend
- **Firebase Firestore**: NoSQL database for real-time data.
- **Firebase Authentication**: Secure user authentication and authorization.
- **Real-time Listeners**: Live data updates and notifications.

### Key Components
- **App.vue**: Main application layout, sidebar navigation, and top bar.
- **Login.vue**: User authentication interface.
- **Dashboard.vue**: Central management overview and quick actions.
- **ProductCatalog.vue**: Displays and manages product listings.
- **Reports.vue**: Analytics and reporting tools with charts and export options.
- **OrderManagement.vue**: Manages customer orders.
- **OrderProcessing.vue**: Handles new order creation.
- **ProductCard.vue**: Individual product display component.
- **inventoryStore.js**: Pinia store for managing inventory and order data.
- **authStore.js**: Pinia store for managing user authentication state.

## 📱 Responsive Design

The system is fully responsive and optimized for:
- **Desktop**: Full-featured dashboard with advanced analytics.
- **Tablet**: Touch-friendly interface with simplified navigation.
- **Mobile**: Essential functions accessible on small screens.

## 🔧 Configuration

### User Roles
Configure user roles in the Firebase users collection:
```javascript
{
  uid: "user_id",
  role: "manager", // manager, supervisor, staff, accountant
  permissions: ["approve", "manage", "view"],
  department: "operations"
}
```

### Notification Settings
Customize notification preferences:
```javascript
{
  userId: "user_id",
  emailNotifications: true,
  smsNotifications: false,
  lowStockThreshold: 10,
  approvalNotifications: true
}
```

## 📊 Data Structure

### Collections
- **users**: User profiles and permissions.
- **inventory**: Product stock and information.
- **customers**: Customer profiles and history.
- **orders**: Sales transactions and order details.
- **approvals**: Pending approval requests.
- **notifications**: System alerts and user notifications.
- **activities**: User action logs and system events.

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Other Platforms
- **Vercel**: `npm run build && vercel --prod`
- **Netlify**: `npm run build && netlify deploy --prod`
- **GitHub Pages**: `npm run deploy`

## 🔒 Security Features

- **Authentication**: Firebase Auth with email/password and OAuth.
- **Authorization**: Role-based access control.
- **Data Validation**: Input sanitization and validation.
- **Audit Logging**: Complete action history and tracking.

## 📈 Performance Optimization

- **Lazy Loading**: Components loaded on demand.
- **Real-time Updates**: Efficient Firestore listeners.
- **Caching**: Smart data caching and optimization.
- **Responsive Images**: Optimized for different screen sizes.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Make your changes.
4.  Add tests if applicable.
5.  Submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository.
- Contact the development team.
- Check the documentation and FAQs.

## 🔮 Future Enhancements

- **Mobile App**: Native iOS and Android applications.
- **Advanced Analytics**: Machine learning insights and predictions.
- **Integration APIs**: Connect with external systems and services.
- **Multi-language Support**: Internationalization for global teams.
- **Advanced Reporting**: Custom report builder and scheduling.

---

**MMH Hardware Management System** - Empowering managers with comprehensive oversight and control from anywhere in the world.
