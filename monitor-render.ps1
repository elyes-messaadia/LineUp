# Script de monitoring du deploiement Render
$renderUrl = "https://lineup-backend-xxak.onrender.com"
$maxAttempts = 20
$waitTime = 30

Write-Host "Monitoring du deploiement Render" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "URL: $renderUrl" -ForegroundColor Blue
Write-Host "Tentatives max: $maxAttempts" -ForegroundColor Blue
Write-Host "Intervalle: $waitTime secondes" -ForegroundColor Blue

for ($i = 1; $i -le $maxAttempts; $i++) {
    Write-Host "`nTentative $i/$maxAttempts - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    
    try {
        # Test health endpoint
        $healthResponse = Invoke-WebRequest -Uri "$renderUrl/health" -Method Get -TimeoutSec 15
        Write-Host "✅ Health Check: $($healthResponse.StatusCode)" -ForegroundColor Green
        
        if ($healthResponse.Content) {
            $healthData = $healthResponse.Content | ConvertFrom-Json
            Write-Host "Health Data: $($healthData | ConvertTo-Json -Compress)" -ForegroundColor Blue
        }
        
        # Test root endpoint
        $rootResponse = Invoke-WebRequest -Uri "$renderUrl/" -Method Get -TimeoutSec 15
        Write-Host "✅ Root Endpoint: $($rootResponse.StatusCode)" -ForegroundColor Green
        
        if ($rootResponse.Content) {
            $rootData = $rootResponse.Content | ConvertFrom-Json
            Write-Host "API Status: $($rootData.status)" -ForegroundColor Blue
            Write-Host "Version: $($rootData.version)" -ForegroundColor Blue
        }
        
        Write-Host "🎉 DEPLOIEMENT REUSSI!" -ForegroundColor Green
        Write-Host "Le backend est operationnel" -ForegroundColor Green
        break
        
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -like "*500*") {
            Write-Host "⚠️ Erreur 500: Configuration probablement en cours..." -ForegroundColor Yellow
        }
        elseif ($errorMsg -like "*timeout*") {
            Write-Host "⏱️ Timeout: Service en cours de redemarrage..." -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Erreur: $errorMsg" -ForegroundColor Red
        }
        
        if ($i -lt $maxAttempts) {
            Write-Host "Attente de $waitTime secondes..." -ForegroundColor Gray
            Start-Sleep -Seconds $waitTime
        }
    }
}

if ($i -gt $maxAttempts) {
    Write-Host "`n❌ TIMEOUT: Le deploiement n'est pas termine apres $($maxAttempts * $waitTime / 60) minutes" -ForegroundColor Red
    Write-Host "Verifiez:" -ForegroundColor Yellow
    Write-Host "1. Les variables d'environnement sur Render" -ForegroundColor Yellow
    Write-Host "2. Les logs du service sur dashboard.render.com" -ForegroundColor Yellow
    Write-Host "3. La connexion MongoDB Atlas" -ForegroundColor Yellow
}