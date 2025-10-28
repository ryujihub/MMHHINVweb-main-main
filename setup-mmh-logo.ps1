# PowerShell script to setup MMH Hardware logo
Write-Host "Setting up MMH Hardware logo..." -ForegroundColor Green

$logoSource = "C:\Users\cabur\Downloads\MMHHLOGO.png"
$projectDir = "."

if (Test-Path $logoSource) {
    Write-Host "✓ Found MMHHLOGO.png" -ForegroundColor Green
    
    # Copy logo files for different uses
    $files = @(
        @{ Source = $logoSource; Target = "mmh-logo.png"; Purpose = "Sidebar logo" },
        @{ Source = $logoSource; Target = "android-chrome-192x192.png"; Purpose = "Compatibility" },
        @{ Source = $logoSource; Target = "favicon-192x192.png"; Purpose = "Favicon" },
        @{ Source = $logoSource; Target = "apple-touch-icon.png"; Purpose = "iOS home screen" }
    )
    
    foreach ($file in $files) {
        $targetPath = Join-Path $projectDir $file.Target
        Copy-Item $file.Source $targetPath -Force
        Write-Host "✓ Copied as $($file.Target) - $($file.Purpose)" -ForegroundColor Green
    }
    
    Write-Host "`n🎉 SUCCESS! Your MMH Hardware logo has been set up." -ForegroundColor Cyan
    Write-Host "`nThe logo will appear in:" -ForegroundColor White
    Write-Host "  • Sidebar navigation" -ForegroundColor Yellow
    Write-Host "  • Browser tab (favicon)" -ForegroundColor Yellow
    Write-Host "  • Mobile home screen" -ForegroundColor Yellow
    Write-Host "  • Printed receipts" -ForegroundColor Yellow
    
} else {
    Write-Host "❌ MMHHLOGO.png not found!" -ForegroundColor Red
    Write-Host "`nExpected location: $logoSource" -ForegroundColor Yellow
    Write-Host "`nPlease ensure your MMH Hardware logo file is:" -ForegroundColor White
    Write-Host "  • Named exactly 'MMHHLOGO.png'" -ForegroundColor Yellow
    Write-Host "  • Located in your Downloads folder" -ForegroundColor Yellow
    Write-Host "`nAlternative: Copy your logo to this project folder as 'mmh-logo.png'" -ForegroundColor Cyan
}

Write-Host "`nRefresh your browser to see the changes!" -ForegroundColor Magenta
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")