# 🔐 Guide du Système d'Authentification LineUp

## 🎯 **Vue d'ensemble**

Le système LineUp intègre maintenant un système d'authentification complet avec **4 rôles différents** et des **dashboards personnalisés** selon les permissions de chaque utilisateur.

---

## 👥 **Rôles et Permissions**

### **🩺 Médecin**
- **Permissions** : `view_queue`, `call_next`, `finish_consultation`, `reset_queue`, `view_stats`
- **Accès** : Interface complète de gestion des patients
- **Fonctionnalités** :
  - ✅ Appeler le patient suivant
  - ✅ Terminer les consultations 
  - ✅ Réinitialiser la file d'attente
  - ✅ Voir les statistiques détaillées
  - ✅ Interface admin avancée

### **👩‍💼 Secrétaire**
- **Permissions** : `view_queue`, `call_next`, `manage_users`, `view_stats`, `create_ticket`
- **Accès** : Interface d'assistance médicale
- **Fonctionnalités** :
  - ✅ Créer des tickets pour les patients
  - ✅ Appeler le patient suivant
  - ✅ Gérer les utilisateurs
  - ✅ Voir les statistiques
  - ✅ Coordonner avec le médecin

### **👤 Patient**
- **Permissions** : `create_ticket`, `view_queue`, `cancel_ticket`
- **Accès** : Interface patient complète
- **Fonctionnalités** :
  - ✅ Prendre un ticket de consultation
  - ✅ Voir sa position en temps réel
  - ✅ Annuler son ticket
  - ✅ Recevoir des notifications de statut

### **👁️ Visiteur**
- **Permissions** : `view_queue`
- **Accès** : Consultation en lecture seule
- **Fonctionnalités** :
  - ✅ Voir la file d'attente
  - ✅ Temps d'attente estimés
  - ✅ Statistiques générales
  - ❌ Pas de création de tickets

---

## 🧪 **Comptes de Test**

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| 🩺 **Médecin** | `medecin@lineup.com` | `medecin123` | Dr. Marie Dupont |
| 👩‍💼 **Secrétaire** | `secretaire@lineup.com` | `secretaire123` | Sophie Martin |
| 👤 **Patient** | `patient@lineup.com` | `patient123` | Jean Patient |
| 👁️ **Visiteur** | `visiteur@lineup.com` | `visiteur123` | Pierre Visiteur |

---

## 🌐 **Pages et Navigation**

### **Pages Publiques**
- **`/`** - Accueil (tous)
- **`/queue`** - File d'attente (tous)
- **`/ticket`** - Gestion ticket anonyme (non connectés)

### **Authentification**
- **`/login`** - Connexion universelle
- **`/register`** - Inscription (Patient/Visiteur uniquement)

### **Dashboards Personnalisés**
- **`/dashboard/medecin`** - Espace médecin
- **`/dashboard/secretaire`** - Espace secrétaire
- **`/dashboard/patient`** - Espace patient
- **`/dashboard/visiteur`** - Espace visiteur

---

## 🚀 **Flux d'Utilisation**

### **1. Inscription (Patients & Visiteurs)**
```
Visiteur → /register → Choix du rôle → Création compte → Redirection /login
```

### **2. Connexion**
```
Tous les rôles → /login → Authentification → Redirection dashboard spécifique
```

### **3. Workflow Médical Typique**
```
1. Patient se connecte → Prend un ticket
2. Secrétaire gère la file → Appelle les patients
3. Médecin consulte → Termine les consultations
4. Visiteurs consultent les temps d'attente
```

---

## 🔧 **Fonctionnalités Techniques**

### **Authentification JWT**
- **Token** : Valide 24h
- **Stockage** : localStorage côté client
- **Sécurité** : Bcrypt hash avec salt rounds 12
- **Middleware** : Vérification automatique des permissions

### **Synchronisation Temps Réel**
- **Interval polling** : 3-5 secondes selon le rôle
- **Updates automatiques** : File d'attente, statuts, statistiques
- **Notifications** : Toast contextuelles selon les changements

### **Gestion des États**
- **Persistance** : localStorage pour les sessions
- **Fallback** : Mode hors ligne pour les patients
- **Validation** : Vérification serveur des tickets

---

## 📊 **Dashboards Détaillés**

### **🩺 Dashboard Médecin**
```
┌─────────────────────────────────────────┐
│ 🩺 ESPACE MÉDECIN - Dr. Marie Dupont   │
├─────────────────────────────────────────┤
│ 👨‍⚕️ Patient en consultation            │
│ Ticket n°42 - Depuis 14:30            │
│ [✅ Terminer la consultation]          │
├─────────────────────────────────────────┤
│ 📊 STATS: 3 attente │ 1 consultation   │
│ 📢 [Appeler suivant] 📋 [File complète] │
│ 🔄 [Réinitialiser]  ⚙️ [Admin]        │
└─────────────────────────────────────────┘
```

### **👩‍💼 Dashboard Secrétaire**
```
┌─────────────────────────────────────────┐
│ 👩‍💼 ESPACE SECRÉTAIRE - Sophie Martin │
├─────────────────────────────────────────┤
│ 📊 STATS: 3 attente │ 1 consultation   │
│ 🎟️ [Créer ticket] 📢 [Appeler suivant] │
│ 📋 [File complète] ⚙️ [Gestion admin]  │
├─────────────────────────────────────────┤
│ ⏭️ Prochain: Ticket n°43 - 15 min      │
│ 👨‍⚕️ Actuel: Ticket n°42 - en cours    │
└─────────────────────────────────────────┘
```

### **👤 Dashboard Patient**
```
┌─────────────────────────────────────────┐
│ 👤 ESPACE PATIENT - Jean Patient       │
├─────────────────────────────────────────┤
│ 🎫 MON TICKET ACTUEL                   │
│ Numéro: 43 │ Position: 2ème           │
│ Statut: En attente │ Attente: ~30 min  │
│ [📋 Voir position] [❌ Annuler]        │
├─────────────────────────────────────────┤
│ 📊 État file: 3 attente │ 1 consultation│
└─────────────────────────────────────────┘
```

### **👁️ Dashboard Visiteur**
```
┌─────────────────────────────────────────┐
│ 👁️ ESPACE VISITEUR - Pierre Visiteur   │
├─────────────────────────────────────────┤
│ 📊 STATISTIQUES EN TEMPS RÉEL          │
│ En attente: 3 │ En consultation: 1     │
│ Terminées: 15 │ Total du jour: 19      │
├─────────────────────────────────────────┤
│ ⏱️ Temps d'attente estimé: 45 min      │
│ Si vous preniez un ticket maintenant   │
├─────────────────────────────────────────┤
│ 💡 Pour prendre un ticket, créez un    │
│ [✨ Compte Patient] [🏠 Accueil]       │
└─────────────────────────────────────────┘
```

---

## 🔄 **Mise à Jour depuis l'Ancien Système**

### **Migration Automatique**
- ✅ **Ancien système** reste compatible
- ✅ **Nouvelles routes** ajoutées en parallèle
- ✅ **Données existantes** préservées
- ✅ **Tickets** continuent de fonctionner

### **Commandes de Migration**
```bash
# Créer les utilisateurs de test
npm run create:test-users

# Corriger les tickets existants  
npm run fix:tickets

# Vérifier la base de données
npm run check:db
```

---

## 🎨 **Interface Utilisateur**

### **Navigation Adaptive**
- **Non connecté** : Accueil, File, Ticket, Connexion, Inscription
- **Connecté** : Accueil, File, Mon Espace + Badge rôle + Déconnexion
- **Responsive** : Optimisé mobile et desktop

### **Notifications Contextuelles**
- **Toast messages** selon les actions
- **Couleurs** adaptées aux types (succès, erreur, info, warning)
- **Animations** fluides et professionnelles

### **Modales de Confirmation**
- **Actions importantes** : Suppression, réinitialisation
- **Sécurité** : Double confirmation pour les actions critiques

---

## 🛠️ **Installation et Configuration**

### **Prérequis**
```bash
cd server
npm install jsonwebtoken  # Déjà installé
```

### **Variables d'Environnement**
```env
JWT_SECRET=votre_secret_jwt_super_securise
MONGO_URI=mongodb://localhost:27017/lineup
```

### **Initialisation**
```bash
# 1. Créer les rôles (si pas déjà fait)
npm run update:roles

# 2. Créer les utilisateurs de test
npm run create:test-users

# 3. Corriger les tickets existants
npm run fix:tickets

# 4. Démarrer le serveur
npm run dev
```

---

## 🚨 **Sécurité**

### **Authentification**
- **JWT** avec expiration 24h
- **Bcrypt** hash sécurisé (12 rounds)
- **Validation** email unique
- **Sanitisation** des données d'entrée

### **Autorisation**
- **Middleware** de vérification des rôles
- **Protection** des routes sensibles
- **Permissions** granulaires par endpoint

### **Protection CSRF**
- **CORS** configuré pour les domaines autorisés
- **Headers** sécurisés
- **Validation** origin pour production

---

## 📈 **Monitoring et Logs**

### **Logs Serveur**
```
✅ Connexion réussie: patient@lineup.com (patient)
✅ Ticket n°42 créé (Session: session_1704123456789_abc123def)
⚠️ Tentative de connexion avec email invalide
```

### **Métriques Disponibles**
- **Connexions** par rôle et par jour
- **Tickets créés** par utilisateur authentifié
- **Temps de session** moyen
- **Erreurs** d'authentification

---

## 🎯 **Roadmap Future**

### **V2.1 - Améliorations**
- [ ] **Refresh tokens** automatiques
- [ ] **Sessions multiples** par utilisateur
- [ ] **Permissions** plus granulaires
- [ ] **Audit logs** complets

### **V2.2 - Fonctionnalités**
- [ ] **Profils utilisateurs** éditables  
- [ ] **Préférences** personnalisées
- [ ] **Notifications push** (PWA)
- [ ] **Historique** des consultations

---

**🎉 Le système d'authentification LineUp est maintenant opérationnel !**

Connectez-vous avec l'un des comptes de test pour découvrir les dashboards personnalisés selon votre rôle. 