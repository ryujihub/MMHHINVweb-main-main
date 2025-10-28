# Company Information Settings

## Overview
Added comprehensive company information settings that allow you to configure your business details for receipts, documents, and customer communications.

## Features Added

### 🏢 **Company Information Management**
- **Company Name**: Business name displayed on receipts and documents
- **Business Description**: Short tagline or description of services
- **Business Address**: Physical address for receipts and deliveries
- **Contact Phone**: Primary phone number for customer inquiries
- **Email Address**: Business email for communications (optional)
- **Website URL**: Business website link (optional)

### 🧾 **Receipt Integration**
- **Dynamic Receipts**: All receipt templates now use your configured company information
- **Real-time Preview**: See how your information will appear on receipts
- **Consistent Branding**: Same information across all printed materials

### ⚙️ **Settings Interface**
- **Easy Configuration**: User-friendly form in Settings Management
- **Live Preview**: See receipt preview as you type
- **Validation**: Proper input validation for phone numbers, emails, and URLs
- **Auto-save**: Changes are saved when you click "Save Changes"

## How to Configure

### 1. Access Settings
1. Navigate to **Settings** in the main menu
2. Scroll down to the **Company Information** section
3. Fill in your business details

### 2. Configure Company Details
```
Company Name: Metro Manila Hills Hardware
Business Description: Hardware & Construction Supplies
Business Address: 123 Main Street, Metro Manila Hills, Philippines
Contact Phone: +63 912 345 6789
Email: info@mmhhardware.com (optional)
Website: https://www.mmhhardware.com (optional)
```

### 3. Preview & Save
1. Check the **Receipt Preview** to see how it will look
2. Click **Save Changes** to apply your settings
3. Your information will immediately appear on all new receipts

## Receipt Preview
The preview shows exactly how your company information will appear on printed receipts:

```
╔══════════════════════════════════════╗
║        METRO MANILA HILLS HARDWARE   ║
║      Hardware & Construction Supplies║
║  📍 123 Main Street, Metro Manila... ║
║       📞 Contact: +63 912 345 6789   ║
║              SALES RECEIPT           ║
╚══════════════════════════════════════╝
```

## Technical Implementation

### Settings Store Enhancement
```javascript
companyInfo: {
  name: 'Metro Manila Hills Hardware',
  address: 'Metro Manila Hills, Philippines', 
  phone: '+63 XXX XXX XXXX',
  email: '',
  website: '',
  description: 'Hardware & Construction Supplies'
}
```

### Receipt Template Integration
- **OrderManagement**: Uses settings for existing order receipts
- **OrderProcessing**: Uses settings for new order receipts
- **Dynamic Loading**: Automatically pulls latest company information
- **Fallback Values**: Uses defaults if settings not configured

### Form Validation
- **Phone Numbers**: Validates phone number format
- **Email Addresses**: Validates email format
- **URLs**: Validates website URL format
- **Required Fields**: Company name, description, address, and phone are recommended

## Benefits

### 🎯 **Professional Branding**
- **Consistent Identity**: Same company information across all materials
- **Professional Appearance**: Well-formatted business details on receipts
- **Customer Trust**: Complete contact information builds credibility

### 📞 **Customer Service**
- **Easy Contact**: Customers have your phone number on every receipt
- **Multiple Channels**: Phone, email, and website options
- **Local Presence**: Physical address shows local business presence

### 🔧 **Easy Management**
- **Centralized Settings**: Update once, applies everywhere
- **No Code Changes**: Update information without technical knowledge
- **Instant Updates**: Changes apply immediately to new receipts

## Default Values
If you haven't configured your company information yet, the system uses these defaults:
- **Name**: Metro Manila Hills Hardware
- **Description**: Hardware & Construction Supplies  
- **Address**: Metro Manila Hills, Philippines
- **Phone**: +63 XXX XXX XXXX

## Mobile Responsive
The company settings interface is fully responsive and works on:
- **Desktop**: Full form layout with side-by-side fields
- **Tablet**: Stacked layout with larger touch targets
- **Mobile**: Single-column layout optimized for touch

## Future Enhancements

### Planned Features
1. **Logo Upload**: Add company logo to receipts
2. **Multiple Locations**: Support for multiple store locations
3. **Social Media**: Add social media links
4. **Business Hours**: Display operating hours on receipts
5. **Tax Information**: Add tax ID and registration numbers

### Advanced Options
- **Custom Receipt Templates**: Multiple receipt design options
- **Multilingual Support**: Company info in multiple languages
- **QR Code Integration**: QR codes with company contact info
- **Digital Business Cards**: Generate digital contact cards

## Troubleshooting

### Common Issues
- **Settings Not Saving**: Check internet connection and try again
- **Preview Not Updating**: Refresh the page and re-enter information
- **Phone Format**: Use international format (+63 XXX XXX XXXX)
- **Email Validation**: Ensure proper email format (name@domain.com)

### Best Practices
- **Keep It Concise**: Use clear, brief descriptions
- **Update Regularly**: Keep contact information current
- **Test Receipts**: Print test receipts to verify appearance
- **Backup Settings**: Note down your settings for reference

The company information settings provide a professional foundation for your business communications and ensure customers always have your current contact details.