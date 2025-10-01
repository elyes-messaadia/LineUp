# Script de generation de nouvelles variables d'environnement securisees
# Usage: .\generate-secure-env.ps1

Write-Host "Generation de nouvelles variables d'environnement securisees" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Green

# 1. Generer un nouveau JWT Secret
Write-Host "`n1. Nouveau JWT Secret:" -ForegroundColor Cyan
Add-Type -AssemblyName System.Web
$newJwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 8)
Write-Host "JWT_SECRET=$newJwtSecret" -ForegroundColor Yellow

# 2. Generer des nouvelles cles VAPID (simulation)
Write-Host "`n2. Nouvelles cles VAPID (a generer avec web-push):" -ForegroundColor Cyan
Write-Host "Commande a executer: npm install -g web-push && web-push generate-vapid-keys" -ForegroundColor Yellow

# 3. Variables pour Render.com
Write-Host "`n3. Variables a configurer sur Render.com:" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MONGO_URI=mongodb+srv://NOUVEAU_USER:NOUVEAU_PASS@cluster0.vauvacv.mongodb.net/lineup" -ForegroundColor Green
Write-Host "JWT_SECRET=$newJwtSecret" -ForegroundColor Green
Write-Host "NODE_ENV=production" -ForegroundColor Green
Write-Host "PORT=10000" -ForegroundColor Green
Write-Host "CORS_ORIGIN=https://ligneup.netlify.app" -ForegroundColor Green

# 4. Variables pour Netlify
Write-Host "`n4. Variables a configurer sur Netlify:" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "VITE_API_URL=https://lineup-backend-xxak.onrender.com" -ForegroundColor Green
Write-Host "NODE_VERSION=18" -ForegroundColor Green

# 5. Etapes suivantes
Write-Host "`n5. Etapes suivantes:" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta
Write-Host "1. Changer le mot de passe MongoDB Atlas" -ForegroundColor White
Write-Host "2. Configurer les variables sur Render.com" -ForegroundColor White
Write-Host "3. Configurer les variables sur Netlify" -ForegroundColor White
Write-Host "4. Generer nouvelles cles VAPID" -ForegroundColor White
Write-Host "5. Tester l'API: Invoke-WebRequest -Uri 'https://lineup-backend-xxak.onrender.com/health'" -ForegroundColor White

Write-Host "`nVariables copiees dans le presse-papier!" -ForegroundColor Green
$envVars = @"
MONGO_URI=mongodb+srv://NOUVEAU_USER:NOUVEAU_PASS@cluster0.vauvacv.mongodb.net/lineup
JWT_SECRET=$newJwtSecret
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://ligneup.netlify.app
"@
$envVars | Set-Clipboard