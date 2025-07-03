# 🔧 Netlify Build Debug Guide

## Problème Rencontré
- **Erreur** : `Command failed with exit code 127: npm ci && npm run build`
- **Cause** : Exit code 127 = "command not found" (npm non trouvé)

## Solutions Appliquées

### 1. Configuration Node.js Explicite
```toml
[build.environment]
  NODE_VERSION = "18.18.0"
  NPM_VERSION = "9.8.1"
```

### 2. Fichiers de Version
- `.nvmrc` : `18.18.0`
- `package.json` : Scripts correctement définis

### 3. Commande Build Modifiée
```toml
command = "npm install && npm run build"
```
↳ Changé de `npm ci` vers `npm install` pour plus de robustesse

### 4. Configuration Base Directory
```toml
base = "."
```

## Si le Problème Persiste

### Option A : Variables d'Environnement Netlify UI
Dans Netlify Dashboard → Site Settings → Environment Variables :
```
NODE_VERSION = 18.18.0
NPM_VERSION = 9.8.1
NODE_ENV = production
VITE_API_URL = https://lineup-nby9.onrender.com
```

### Option B : Build Command Alternative
```toml
command = "node --version && npm --version && npm install && npm run build"
```

### Option C : Script de Build Personnalisé
Créer `build.sh` :
```bash
#!/bin/bash
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
npm cache clean --force
npm install
npm run build
```

## Test Local
```bash
cd client
npm ci
npm run build
# Vérifier que dist/ est créé
```

## Logs à Vérifier
1. Version Node.js utilisée par Netlify
2. Existence du package-lock.json
3. Commandes exécutées exactement
4. Variables d'environnement injectées 