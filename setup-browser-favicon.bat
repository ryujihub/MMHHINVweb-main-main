@echo off
echo Setting up MMH Hardware browser favicon...

set "logoSource=C:\Users\cabur\Downloads\MMHHLOGO.png"

if exist "%logoSource%" (
    echo ✓ Found MMHHLOGO.png
    
    REM Copy for different favicon sizes and uses
    copy "%logoSource%" "favicon.ico"
    echo ✓ Copied as favicon.ico (main browser icon)
    
    copy "%logoSource%" "favicon-16x16.png"
    echo ✓ Copied as favicon-16x16.png (small browser tab)
    
    copy "%logoSource%" "favicon-32x32.png"
    echo ✓ Copied as favicon-32x32.png (standard browser tab)
    
    copy "%logoSource%" "apple-touch-icon.png"
    echo ✓ Copied as apple-touch-icon.png (iOS home screen)
    
    copy "%logoSource%" "android-chrome-192x192.png"
    echo ✓ Copied as android-chrome-192x192.png (Android home screen)
    
    copy "%logoSource%" "mmh-logo.png"
    echo ✓ Copied as mmh-logo.png (web app logo)
    
    echo.
    echo 🎉 SUCCESS! Your MMH Hardware logo is now set up for:
    echo   • Browser tabs (favicon)
    echo   • Bookmarks
    echo   • Mobile home screen icons
    echo   • Web application logo
    echo.
    echo 📋 NEXT STEPS:
    echo 1. Close all browser windows
    echo 2. Reopen your browser
    echo 3. Navigate to your website
    echo 4. Look for MMH Hardware logo in browser tab
    echo.
    echo 💡 TIP: If logo doesn't appear immediately:
    echo   • Clear browser cache (Ctrl+Shift+Delete)
    echo   • Hard refresh (Ctrl+F5)
    echo   • Try incognito/private mode
    
) else (
    echo ❌ MMHHLOGO.png not found!
    echo.
    echo Expected location: %logoSource%
    echo.
    echo Please ensure:
    echo 1. File is named exactly "MMHHLOGO.png"
    echo 2. File is in your Downloads folder
    echo 3. File path is correct
    echo.
    echo Alternative: Copy your logo to this project folder as:
    echo   • favicon.ico
    echo   • favicon-16x16.png
    echo   • favicon-32x32.png
)

echo.
pause