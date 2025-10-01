# Test final de l'etat du deploiement
Write-Host "Test de l'etat du deploiement LineUp" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Test du backend
Write-Host "`nTest du backend Render..." -ForegroundColor Cyan
try {
    $backendResponse = Invoke-WebRequest -Uri "https://lineup-backend-xxak.onrender.com/health" -Method Get -TimeoutSec 30
    Write-Host "Backend Status: $($backendResponse.StatusCode)" -ForegroundColor Green
    if ($backendResponse.Content) {
        $content = $backendResponse.Content | ConvertFrom-Json
        Write-Host "Backend Response: $($content | ConvertTo-Json)" -ForegroundColor Blue
    }
}
catch {
    Write-Host "Backend Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test du frontend
Write-Host "`nTest du frontend Netlify..." -ForegroundColor Cyan
try {
    $frontendResponse = Invoke-WebRequest -Uri "https://ligneup.netlify.app/" -Method Head -TimeoutSec 30
    Write-Host "Frontend Status: $($frontendResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "Frontend Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest termine!" -ForegroundColor Green