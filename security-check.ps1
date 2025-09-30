# Script de vérification de sécurité - LineUp
# Utilisation: .\security-check.ps1

Write-Host "🔒 Vérification de sécurité LineUp" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# 1. Vérifier les fichiers .env trackés
Write-Host "`n1. Vérification des fichiers .env dans Git..." -ForegroundColor Cyan
$envFilesInGit = git ls-files | Select-String "\.env$"
if ($envFilesInGit) {
    Write-Host "❌ ALERTE: Fichiers .env trouvés dans Git:" -ForegroundColor Red
    $envFilesInGit | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "   ⚠️ Exécutez: git rm --cached <fichier>" -ForegroundColor Yellow
} else {
    Write-Host "✅ Aucun fichier .env dans Git" -ForegroundColor Green
}

# 2. Vérifier les fichiers .env locaux
Write-Host "`n2. Vérification des fichiers .env locaux..." -ForegroundColor Cyan
$localEnvFiles = Get-ChildItem -Path . -Recurse -Name "*.env" -Force | Where-Object { $_ -notlike "*.example*" }
if ($localEnvFiles) {
    Write-Host "📋 Fichiers .env locaux trouvés:" -ForegroundColor Blue
    $localEnvFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Blue }
} else {
    Write-Host "ℹ️ Aucun fichier .env local trouvé" -ForegroundColor Blue
}

# 3. Vérifier le contenu du .gitignore
Write-Host "`n3. Vérification du .gitignore..." -ForegroundColor Cyan
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -contains ".env" -or $gitignoreContent -contains "*.env") {
    Write-Host "✅ .gitignore contient des règles pour .env" -ForegroundColor Green
} else {
    Write-Host "❌ .gitignore ne protège pas suffisamment les fichiers .env" -ForegroundColor Red
}

# 4. Vérifier les variables d'environnement sensibles dans les logs Git
Write-Host "`n4. Recherche de secrets dans l'historique Git..." -ForegroundColor Cyan
$suspiciousPatterns = @("password", "secret", "key", "token", "mongodb://", "mongodb+srv://")
$foundSecrets = $false

foreach ($pattern in $suspiciousPatterns) {
    $gitLogResults = git log --all --grep="$pattern" --oneline 2>$null
    if ($gitLogResults) {
        Write-Host "⚠️ Pattern '$pattern' trouvé dans les commits:" -ForegroundColor Yellow
        $gitLogResults | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
        $foundSecrets = $true
    }
}

if (-not $foundSecrets) {
    Write-Host "✅ Aucun pattern suspect dans les messages de commit" -ForegroundColor Green
}

# 5. Recommandations de sécurité
Write-Host "`n🔐 RECOMMANDATIONS DE SÉCURITÉ:" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta
Write-Host "1. Changez IMMÉDIATEMENT les secrets exposés:" -ForegroundColor Red
Write-Host "   - Clés MongoDB" -ForegroundColor Red
Write-Host "   - JWT Secret" -ForegroundColor Red
Write-Host "   - Clés VAPID" -ForegroundColor Red
Write-Host ""
Write-Host "2. Variables d'environnement a configurer sur Render:" -ForegroundColor Yellow
Write-Host "   - MONGO_URI=<nouvelle_url_mongodb>" -ForegroundColor Yellow
Write-Host "   - JWT_SECRET=<nouveau_secret_fort>" -ForegroundColor Yellow
Write-Host "   - VAPID_PUBLIC_KEY=<nouvelle_clé>" -ForegroundColor Yellow
Write-Host "   - VAPID_PRIVATE_KEY=<nouvelle_clé>" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Générer de nouvelles clés VAPID:" -ForegroundColor Cyan
Write-Host "   npm install -g web-push" -ForegroundColor Cyan
Write-Host "   web-push generate-vapid-keys" -ForegroundColor Cyan

Write-Host "`n✅ Vérification terminée" -ForegroundColor Green