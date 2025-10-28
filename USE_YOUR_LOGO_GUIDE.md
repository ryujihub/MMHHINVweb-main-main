# How to Use Your MMH Hardware Logo

## Your Logo File
I can see you have a beautiful MMH Hardware logo at:
`C:\Users\cabur\Downloads\1761670343160d1av27hm\trans_bg.png`

## Quick Setup (Easiest Method)

### Step 1: Copy Your Logo
1. **Copy** your `trans_bg.png` file
2. **Rename** it to `mmh-logo.png`
3. **Place** it in your project root folder (same level as `index.html`)

### Step 2: Update HTML
Replace the favicon line in `index.html`:
```html
<!-- Change this line -->
<link rel="icon" type="image/svg+xml" href="/mmh-favicon.svg">

<!-- To this -->
<link rel="icon" type="image/png" href="/mmh-logo.png">
```

### Step 3: Create Multiple Sizes
For best results, create these sizes from your logo:

**Required Files:**
- `favicon-16x16.png` (16×16 pixels)
- `favicon-32x32.png` (32×32 pixels)  
- `apple-touch-icon.png` (180×180 pixels)
- `android-chrome-192x192.png` (192×192 pixels)

## Using Online Tools (Recommended)

### Method 1: Favicon.io
1. Go to **https://favicon.io/favicon-converter/**
2. **Upload** your `trans_bg.png` file
3. **Download** the generated favicon package
4. **Extract** all files to your project root
5. **Copy** the HTML code provided

### Method 2: RealFaviconGenerator
1. Go to **https://realfavicongenerator.net/**
2. **Upload** your logo
3. **Customize** settings (keep transparent background)
4. **Generate** and download
5. **Follow** their installation instructions

## Manual Resize (If Needed)

### Using Online Image Resizer
1. Go to **https://www.iloveimg.com/resize-image**
2. **Upload** your `trans_bg.png`
3. **Resize** to needed dimensions:
   - 16×16 for small favicon
   - 32×32 for standard favicon
   - 180×180 for Apple touch icon
   - 192×192 for Android

### Using Windows (Built-in)
1. **Right-click** your PNG file
2. **Open with** → **Paint**
3. **Resize** → **Pixels**
4. **Set** width and height (keep aspect ratio)
5. **Save as** PNG with new name

## Complete HTML Setup

Once you have your logo files, update `index.html`:

```html
<head>
  <meta charset="UTF-8">
  
  <!-- MMH Hardware Favicons -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
  
  <!-- Fallback -->
  <link rel="icon" href="/favicon.ico">
  
  <meta name="theme-color" content="#4a9d5f">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <title>MMH Hardware - Inventory Management</title>
  <meta name="description" content="Metro Manila Hills Hardware inventory management system">
  
  <!-- Rest of your head content -->
</head>
```

## Color Theme Updates

Based on your logo's green and orange colors:

```html
<!-- Update theme color to match your logo -->
<meta name="theme-color" content="#4a9d5f">

<!-- For Windows tiles -->
<meta name="msapplication-TileColor" content="#4a9d5f">
```

## Testing Your Logo

### After Setup:
1. **Refresh** your browser (Ctrl+F5)
2. **Check browser tab** for your MMH logo
3. **Bookmark the page** to see bookmark icon
4. **Test on mobile** by adding to home screen

### Troubleshooting:
- **Clear browser cache** if old icon persists
- **Wait 24 hours** for full propagation
- **Try incognito mode** to see fresh version
- **Check file paths** are correct

## File Structure
Your project should look like this:
```
your-project/
├── index.html
├── mmh-logo.png (your original logo)
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── favicon.ico (optional)
└── src/
    └── (your Vue files)
```

## Benefits of Using Your Actual Logo

✅ **Brand Consistency** - Same logo across all platforms
✅ **Professional Appearance** - Your actual business branding  
✅ **Recognition** - Customers will recognize your brand
✅ **Trust** - Professional appearance builds credibility

## Quick Start Commands

If you're comfortable with command line:

```bash
# Copy your logo to project (Windows)
copy "C:\Users\cabur\Downloads\1761670343160d1av27hm\trans_bg.png" mmh-logo.png

# Then use online tools to generate other sizes
```

Your MMH Hardware logo will look much more professional than any generic icon I could create! The green and orange colors with the hardware store building design perfectly represent your business.