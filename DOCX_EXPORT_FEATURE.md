# DOCX Export Feature for Order Management

## Overview
Added DOCX export functionality to the Order Management system, allowing the owner to export order lists and individual order details as Microsoft Word documents.

## Features Added

### 1. Bulk Order Export
- **Location**: Order Management page (`/orders`)
- **Button**: "Export to DOCX" button in the header
- **Functionality**: Exports all filtered orders to a comprehensive DOCX report

### 2. Individual Order Export
- **Location**: Action buttons in each order row
- **Button**: Word icon (📄) in the actions column
- **Functionality**: Exports detailed information for a single order

## Export Content

### Bulk Export Includes:
- Company header (Metro Manila Hills Hardware)
- Generation timestamp
- Total order count
- Orders table with:
  - Order number
  - Date
  - Customer name and phone
  - Items summary
  - Total amount
  - Status
- Summary section with:
  - Total revenue
  - Average order value
  - Orders breakdown by status

### Individual Order Export Includes:
- Company header
- Order number
- Customer information (name, phone, address, delivery, payment)
- Order details (date, status)
- Detailed items table with quantities and prices
- Order summary with subtotal, delivery fee, and total

## Technical Implementation

### Dependencies Added:
- `docx`: Microsoft Word document generation library
- Uses existing `file-saver` for download functionality

### Files Modified:
1. `src/components/OrderManagement.vue` - Added export buttons and functionality
2. `src/utils/docxExport.js` - Utility functions for DOCX generation

### Key Functions:
- `exportOrdersToDocx()` - Bulk export utility
- `exportSingleOrderToDocx()` - Individual order export utility
- `exportToDocx()` - Component method for bulk export
- `exportSingleOrder()` - Component method for individual export

## Usage Instructions

### For Bulk Export:
1. Navigate to Order Management (`/orders`)
2. Apply any desired filters (status, date, staff)
3. Click "Export to DOCX" button in the header
4. File will be automatically downloaded with timestamp

### For Individual Order Export:
1. Navigate to Order Management (`/orders`)
2. Find the desired order in the table
3. Click the Word document icon (📄) in the Actions column
4. Individual order file will be downloaded

## File Naming Convention
- Bulk export: `orders-report-YYYY-MM-DD-HHMM.docx`
- Individual export: `order-[ORDER_ID]-YYYY-MM-DD-HHMM.docx`

## Responsive Design
- Export buttons are fully responsive
- Mobile-friendly layout with proper button sizing
- Maintains accessibility with proper tooltips

## Error Handling
- Validates data before export
- Shows user-friendly error messages
- Handles empty order lists gracefully

## Future Enhancements
The utility functions support additional options:
- Custom titles
- Toggle customer details inclusion
- Toggle summary section
- Custom file naming

This feature provides the hardware store owner with professional documentation capabilities for order management and record-keeping.