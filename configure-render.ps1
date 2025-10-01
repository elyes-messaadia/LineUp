# Configuration Render.com pour LineUp - Guide etape par etape
Write-Host "Guide de configuration Render.com" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "`n1. Ouvrir le dashboard Render.com:" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com/" -ForegroundColor Blue

Write-Host "`n2. Aller dans votre service 'lineup-backend':" -ForegroundColor Cyan
Write-Host "   https://dashboard.render.com/web/srv-VOTRE_ID" -ForegroundColor Blue

Write-Host "`n3. Cliquer sur 'Environment' dans le menu de gauche" -ForegroundColor Cyan

Write-Host "`n4. Ajouter/Modifier ces variables d'environnement:" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Yellow

# Recuperer les variables du guide securise
$secureConfig = @"
MONGO_URI=mongodb+srv://NOUVEAU_USER:NOUVEAU_PASS@cluster0.vauvacv.mongodb.net/lineup
JWT_SECRET=D|o_CX^R2I&!%c]+?cR$`$8S{UB%aG^&:NWn*%T-}^a()HA:t/O(-jDNm-HAJsu9_6
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://ligneup.netlify.app
VAPID_PUBLIC_KEY=BGH1aJhSZ_jU0-dLqFvFNBFZNP23QeW2mep9xj1141MwxPPzp9D0bAWzltUlXfFFPrMzmfmZokem5KCDuRranNE
VAPID_PRIVATE_KEY=UNZ4EVOeFDkYeT2pc_mLGyngDZ-SNNkNHowVWCZeN7g
VAPID_EMAIL=contact@lineup.app
"@

Write-Host $secureConfig -ForegroundColor Green

Write-Host "`n5. Pour chaque variable:" -ForegroundColor Cyan
Write-Host "   - Cliquer sur 'Add Environment Variable'" -ForegroundColor White
Write-Host "   - Entrer la KEY (ex: MONGO_URI)" -ForegroundColor White
Write-Host "   - Entrer la VALUE correspondante" -ForegroundColor White
Write-Host "   - Cliquer Save" -ForegroundColor White

Write-Host "`n6. Une fois toutes les variables ajoutees:" -ForegroundColor Cyan
Write-Host "   - Le service va automatiquement se redeployer" -ForegroundColor White
Write-Host "   - Attendre 5-10 minutes" -ForegroundColor White

Write-Host "`n7. Tester le deploiement:" -ForegroundColor Cyan
Write-Host "   .\test-deployment.ps1" -ForegroundColor Yellow

Write-Host "`nATTENTION MONGODB:" -ForegroundColor Red
Write-Host "N'oubliez pas de changer le mot de passe dans MongoDB Atlas AVANT!" -ForegroundColor Red
Write-Host "https://cloud.mongodb.com/" -ForegroundColor Blue

# Copier dans le presse-papier pour faciliter
$secureConfig | Set-Clipboard
Write-Host "`nVariables copiees dans le presse-papier!" -ForegroundColor Green