# PowerShell script to copy MMH Hardware favicon files
Write-Host "Copying MMH Hardware favicon files..." -ForegroundColor Green

$sourceDir = "C:\Users\cabur\Downloads\favicon_io"
$targetDir = "."

# List of files to copy
$files = @(
    "favicon.ico",
    "favicon-16x16.png", 
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "android-chrome-192x192.png",
    "android-chrome-512x512.png",
    "site.webmanifest"
)

foreach ($file in $files) {
    $sourcePath = Join-Path $sourceDir $file
    $targetPath = Join-Path $targetDir $file
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $targetPath -Force
        Write-Host "✓ Copied $file" -ForegroundColor Green
    } else {
        Write-Host "⚠ File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nFavicon files copied successfully!" -ForegroundColor Green
Write-Host "You can now refresh your browser to see the new MMH Hardware icon." -ForegroundColor Cyan
Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")