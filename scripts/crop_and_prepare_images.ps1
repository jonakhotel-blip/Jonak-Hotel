Add-Type -AssemblyName System.Drawing

$refPath = "C:\Users\MANIRUL HUSSAIN\.gemini\antigravity\brain\a963d188-385d-44ef-9229-2965b6b4afd2\.user_uploaded\media_1793773608528_910ab0c1.jpg"
if (Test-Path $refPath) {
    $refImg = [System.Drawing.Bitmap]::FromFile($refPath)
    Write-Host "Ref width: $($refImg.Width), height: $($refImg.Height)"
    
    # In reference image (approx 9:16 aspect ratio):
    # Banner is located around y: 24% to 37% of height
    # Let's crop the delivery hero area: x: 0 to width, y: 0.245 * H to 0.38 * H
    $w = $refImg.Width
    $h = $refImg.Height
    
    $bannerY = [int]($h * 0.252)
    $bannerH = [int]($h * 0.138)
    $bannerRect = New-Object System.Drawing.Rectangle(0, $bannerY, $w, $bannerH)
    $bannerBmp = $refImg.Clone($bannerRect, $refImg.PixelFormat)
    $bannerBmp.Save("public\images\jonak-food-delivery-hero.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bannerBmp.Dispose()
    Write-Host "Created public\images\jonak-food-delivery-hero.jpg"
    
    # Rider crop on right of the banner:
    $riderX = [int]($w * 0.65)
    $riderY = [int]($h * 0.255)
    $riderW = [int]($w * 0.34)
    $riderH = [int]($h * 0.132)
    $riderRect = New-Object System.Drawing.Rectangle($riderX, $riderY, $riderW, $riderH)
    $riderBmp = $refImg.Clone($riderRect, $refImg.PixelFormat)
    $riderBmp.Save("public\images\ui\delivery_rider_hq.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $riderBmp.Dispose()
    Write-Host "Created public\images\ui\delivery_rider_hq.jpg"

    $refImg.Dispose()
} else {
    Write-Host "Reference path not found: $refPath"
}
