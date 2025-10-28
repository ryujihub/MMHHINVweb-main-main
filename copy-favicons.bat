@echo off
echo Copying MMH Hardware favicon files...

REM Copy favicon files from Downloads to project root
copy "C:\Users\cabur\Downloads\favicon_io\favicon.ico" "favicon.ico"
copy "C:\Users\cabur\Downloads\favicon_io\favicon-16x16.png" "favicon-16x16.png"
copy "C:\Users\cabur\Downloads\favicon_io\favicon-32x32.png" "favicon-32x32.png"
copy "C:\Users\cabur\Downloads\favicon_io\apple-touch-icon.png" "apple-touch-icon.png"
copy "C:\Users\cabur\Downloads\favicon_io\android-chrome-192x192.png" "android-chrome-192x192.png"
copy "C:\Users\cabur\Downloads\favicon_io\android-chrome-512x512.png" "android-chrome-512x512.png"

REM Check if site.webmanifest exists and copy it
if exist "C:\Users\cabur\Downloads\favicon_io\site.webmanifest" (
    copy "C:\Users\cabur\Downloads\favicon_io\site.webmanifest" "site.webmanifest"
    echo Web manifest copied successfully!
)

echo.
echo Favicon files copied successfully!
echo You can now refresh your browser to see the new MMH Hardware icon.
echo.
pause