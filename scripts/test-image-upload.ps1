# PowerShell test script for image upload endpoint

param(
    [Parameter(Mandatory=$true)]
    [string]$JwtToken,
    
    [Parameter(Mandatory=$true)]
    [string]$ChatId
)

Write-Host "📸 Testing image upload to chat: $ChatId" -ForegroundColor Cyan
Write-Host "🔑 Using JWT: $($JwtToken.Substring(0, [Math]::Min(20, $JwtToken.Length)))..." -ForegroundColor Yellow

# Create a test image (simple 1x1 pixel PNG as base64)
$base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA0K4y9wAAAABJRU5ErkJggg=="
$imageBytes = [Convert]::FromBase64String($base64Image)
$testImagePath = "test-image.png"
[System.IO.File]::WriteAllBytes($testImagePath, $imageBytes)

try {
    Write-Host "📤 Uploading test image..." -ForegroundColor Green
    
    # Prepare the multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $headers = @{
        "Authorization" = "Bearer $JwtToken"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    # Read the image file
    $imageContent = [System.IO.File]::ReadAllBytes($testImagePath)
    
    # Create multipart body
    $bodyLines = @(
        "--$boundary",
        'Content-Disposition: form-data; name="image"; filename="test-image.png"',
        'Content-Type: image/png',
        '',
        [System.Text.Encoding]::Latin1.GetString($imageContent),
        "--$boundary--"
    )
    $body = $bodyLines -join "`r`n"
    
    # Make the request
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/chats/$ChatId/upload-image" -Method Post -Headers $headers -Body ([System.Text.Encoding]::Latin1.GetBytes($body))
    
    Write-Host "✅ Upload successful!" -ForegroundColor Green
    Write-Host "📋 Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Upload failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
} finally {
    # Clean up
    if (Test-Path $testImagePath) {
        Remove-Item $testImagePath
    }
}

Write-Host ""
Write-Host "💡 Check the server logs to see if the image was uploaded to Cloudinary" -ForegroundColor Cyan

# Example usage:
Write-Host ""
Write-Host "Example usage:" -ForegroundColor Magenta
Write-Host ".\test-image-upload.ps1 -JwtToken 'your-jwt-token-here' -ChatId 'your-chat-id-here'" -ForegroundColor Gray
