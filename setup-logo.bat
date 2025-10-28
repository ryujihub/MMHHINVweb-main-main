@echo off
echo Setting up MMH Hardware logo...

REM Copy your specific MMH logo file
echo Copying MMHHLOGO.png from Downloads...

if exist "C:\Users\cabur\Downloads\MMHHLOGO.png" (
    REM Copy for sidebar logo
    copy "C:\Users\cabur\Downloads\MMHHLOGO.png" "mmh-logo.png"
    echo ✓ MMH logo copied as mmh-logo.png
    
    REM Also copy as android-chrome for compatibility
    copy "C:\Users\cabur\Downloads\MMHHLOGO.png" "android-chrome-192x192.png"
    echo ✓ MMH logo copied as android-chrome-192x192.png
    
    REM Copy for favicon if needed
    copy "C:\Users\cabur\Downloads\MMHHLOGO.png" "favicon-192x192.png"
    echo ✓ MMH logo copied as favicon-192x192.png
    
    echo.
    echo ✅ SUCCESS! Your MMH Hardware logo has been set up.
    echo The logo will appear in:
    echo   • Sidebar navigation
    echo   • Browser tab (favicon)
    echo   • Mobile home screen
    echo   • Printed receipts
    
) else (
    echo ❌ MMHHLOGO.png not found!
    echo.
    echo Expected location: C:\Users\cabur\Downloads\MMHHLOGO.png
    echo.
    echo Please ensure your MMH Hardware logo file is named "MMHHLOGO.png"
    echo and located in your Downloads folder.
    echo.
    echo Alternative: Copy your logo file to this project folder and rename it to:
    echo   • mmh-logo.png (for sidebar)
    echo   • android-chrome-192x192.png (for compatibility)
)

echo.
echo Refresh your browser to see the changes!
echo.
pause