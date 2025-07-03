# Commandes MongoDB - LineUp

## 🚀 Scripts Disponibles

### 1. Peupler la base avec des utilisateurs de test
```bash
npm run seed
# ou
npm run seed:users
```
**Résultat :** Crée des admins et patients de test avec mots de passe prédéfinis.

### 2. Lister tous les utilisateurs
```bash
npm run list:users
```
**Résultat :** Affiche tous les admins et patients avec leurs IDs MongoDB.

### 3. Créer un utilisateur spécifique
```bash
npm run create:user <type> <email> <password>
```
**Exemples :**
```bash
# Créer un admin
npm run create:user admin mon.admin@email.com motdepasse123

# Créer un patient
npm run create:user patient nouveau.patient@email.com password456
```

## 👥 Comptes de Test Créés

### 👨‍⚕️ Admins
- **Email :** `admin@lineup.com` | **Mot de passe :** `admin123`
- **Email :** `docteur@lineup.com` | **Mot de passe :** `docteur123`

### 👤 Patients
- **Email :** `patient1@test.com` | **Mot de passe :** `patient123`
- **Email :** `patient2@test.com` | **Mot de passe :** `patient123`
- **Email :** `marie.dupont@email.com` | **Mot de passe :** `password123`

## 🔍 Commandes MongoDB Directes

Si vous voulez utiliser MongoDB directement, voici quelques commandes utiles :

### Se connecter à MongoDB
```bash
# Avec MongoDB Compass
mongodb+srv://username:password@cluster.mongodb.net/lineup

# Avec CLI MongoDB
mongosh "mongodb+srv://username:password@cluster.mongodb.net/lineup"
```

### Consulter les collections
```javascript
// Voir toutes les collections
show collections

// Compter les utilisateurs
db.admins.countDocuments()
db.patients.countDocuments()

// Lister tous les admins
db.admins.find().pretty()

// Lister tous les patients
db.patients.find().pretty()

// Trouver un utilisateur par email
db.admins.findOne({email: "admin@lineup.com"})
db.patients.findOne({email: "patient1@test.com"})
```

### Supprimer des utilisateurs
```javascript
// Supprimer un admin spécifique
db.admins.deleteOne({email: "admin@lineup.com"})

// Supprimer un patient spécifique
db.patients.deleteOne({email: "patient1@test.com"})

// Supprimer tous les admins (ATTENTION!)
db.admins.deleteMany({})

// Supprimer tous les patients (ATTENTION!)
db.patients.deleteMany({})
```

### Modifier un mot de passe
```javascript
// Changer le mot de passe d'un admin (nécessite de hasher avec bcrypt)
db.admins.updateOne(
  {email: "admin@lineup.com"},
  {$set: {password: "nouveau_hash_bcrypt"}}
)
```

## 🛠️ Conseils d'Utilisation

### En Développement
1. Utilisez `npm run seed` pour créer rapidement des utilisateurs de test
2. Utilisez `npm run list:users` pour voir qui existe dans votre base
3. Utilisez `npm run create:user` pour créer des comptes spécifiques

### En Production
1. **NE JAMAIS** utiliser `npm run seed` en production
2. Créer les admins avec `npm run create:user admin email@domain.com motdepasse`
3. Les patients s'inscrivent via l'interface web

### Sécurité
- Tous les mots de passe sont hashés avec bcrypt
- Utilisez des mots de passe forts en production
- Gardez vos variables d'environnement (`.env`) secrètes

## 🚨 Résolution de Problèmes

### Erreur de connexion MongoDB
```
❌ Erreur MongoDB : Connection string invalid
```
**Solution :** Vérifiez votre `MONGO_URI` dans le fichier `.env`

### Utilisateur déjà existant
```
❌ Un admin avec cet email existe déjà
```
**Solution :** Utilisez un email différent ou supprimez l'utilisateur existant

### Format d'email invalide
```
❌ Format d'email invalide
```
**Solution :** Utilisez un format email valide (ex: user@domain.com) 