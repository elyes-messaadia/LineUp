# Script de verification de securite - LineUp
Write-Host "Verification de securite LineUp" -ForegroundColor Yellow

# 1. Verifier les fichiers .env tracks
Write-Host "1. Verification des fichiers .env dans Git..." -ForegroundColor Cyan
$envFilesInGit = git ls-files | Select-String "\.env$"
if ($envFilesInGit) {
    Write-Host "ALERTE: Fichiers .env trouves dans Git:" -ForegroundColor Red
    $envFilesInGit | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
} else {
    Write-Host "OK: Aucun fichier .env dans Git" -ForegroundColor Green
}

# 2. Verifier les fichiers .env locaux
Write-Host "2. Verification des fichiers .env locaux..." -ForegroundColor Cyan
$localEnvFiles = Get-ChildItem -Path . -Recurse -Name "*.env" -Force | Where-Object { $_ -notlike "*.example*" }
if ($localEnvFiles) {
    Write-Host "Fichiers .env locaux trouves:" -ForegroundColor Blue
    $localEnvFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Blue }
} else {
    Write-Host "Aucun fichier .env local trouve" -ForegroundColor Blue
}

Write-Host "URGENT: Changez tous les secrets exposes!" -ForegroundColor Red