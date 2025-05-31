# 🎭 Nouvelle Structure des Rôles - LineUp

## 🏗️ **Architecture mise à jour**

### **📊 Structure des données :**
- **Collection `users`** : Tous les utilisateurs unifiés
- **Collection `roles`** : 4 rôles avec permissions spécifiques
- **Collection `tickets`** : Système de tickets inchangé

---

## 👥 **Les 4 rôles définis**

### 👁️ **1. VISITEUR**
**Permissions :** `view_queue`
- ✅ Consulter la file d'attente
- ❌ Prendre un ticket
- ❌ Actions administratives

**Cas d'usage :** Accompagnants, personnes qui veulent juste voir l'état de la file

### 👤 **2. PATIENT** 
**Permissions :** `create_ticket`, `view_queue`, `cancel_ticket`
- ✅ Prendre un ticket
- ✅ Consulter la file d'attente
- ✅ Annuler son ticket
- ❌ Actions administratives

**Cas d'usage :** Patients venant pour une consultation

### 👩‍💼 **3. SECRÉTAIRE**
**Permissions :** `view_queue`, `call_next`, `manage_users`, `view_stats`, `create_ticket`
- ✅ Consulter la file d'attente
- ✅ Appeler le patient suivant
- ✅ Gérer les utilisateurs
- ✅ Voir les statistiques
- ✅ Créer des tickets pour les patients
- ❌ Terminer les consultations
- ❌ Réinitialiser la file

**Cas d'usage :** Personnel administratif, accueil

### 👨‍⚕️ **4. MÉDECIN**
**Permissions :** `view_queue`, `call_next`, `finish_consultation`, `reset_queue`, `view_stats`
- ✅ Consulter la file d'attente
- ✅ Appeler le patient suivant
- ✅ Terminer les consultations
- ✅ Réinitialiser la file d'attente
- ✅ Voir les statistiques
- ❌ Gérer les utilisateurs (sécurité)

**Cas d'usage :** Médecins, praticiens

---

## 🔑 **Comptes de test disponibles**

| Rôle | Email | Mot de passe | Nom complet |
|------|-------|--------------|-------------|
| 👨‍⚕️ **Médecin** | `medecin@lineup.com` | `medecin123` | Dr. Jean Dupont |
| 👩‍💼 **Secrétaire** | `secretaire@lineup.com` | `secretaire123` | Marie Martin |
| 👤 **Patient** | `patient@lineup.com` | `patient123` | Pierre Durand |
| 👁️ **Visiteur** | `visiteur@lineup.com` | `visiteur123` | Visiteur Test |

---

## 🔐 **Matrice des permissions**

| Permission | Visiteur | Patient | Secrétaire | Médecin |
|------------|----------|---------|------------|---------|
| `view_queue` | ✅ | ✅ | ✅ | ✅ |
| `create_ticket` | ❌ | ✅ | ✅ | ❌ |
| `cancel_ticket` | ❌ | ✅ | ❌ | ❌ |
| `call_next` | ❌ | ❌ | ✅ | ✅ |
| `finish_consultation` | ❌ | ❌ | ❌ | ✅ |
| `reset_queue` | ❌ | ❌ | ❌ | ✅ |
| `manage_users` | ❌ | ❌ | ✅ | ❌ |
| `view_stats` | ❌ | ❌ | ✅ | ✅ |

---

## 🚀 **Utilisation pratique**

### **🔗 Pages d'accès par rôle :**

**👁️ Visiteur :**
- `/queue` - Voir la file d'attente uniquement

**👤 Patient :**
- `/` - Prendre un ticket
- `/ticket` - Gérer son ticket
- `/queue` - Voir sa position

**👩‍💼 Secrétaire :**
- `/admin` - Tableau de bord complet
- Gestion des utilisateurs
- Création de tickets pour les patients

**👨‍⚕️ Médecin :**
- `/admin` - Tableau de bord médical
- Gestion des consultations
- Contrôle total de la file

### **🎯 Connexions :**
- **URL de connexion :** `/admin-login` (pour secrétaire et médecin)
- **URL patient :** `/login-patient` (pour patients)
- **Visiteurs :** Accès direct à `/queue` sans connexion

---

## 📊 **Statistiques de la base**

```
🎭 Rôles : 4
   - Visiteur (1 permission)
   - Patient (3 permissions)
   - Secrétaire (5 permissions)
   - Médecin (5 permissions)

👥 Utilisateurs : 4 (1 par rôle)
   - Tous actifs
   - Base propre et organisée
```

---

## 🛠️ **Scripts de gestion disponibles**

```bash
# Lister les utilisateurs
npm run list:new-users

# Mettre à jour les rôles
npm run update:roles

# Nettoyer la base
npm run cleanup:users

# Migration complète
npm run migrate
```

---

## 🔄 **Évolutions possibles**

### **Nouveaux rôles potentiels :**
- **Infirmier/ère** : Permissions intermédiaires
- **Administrateur système** : Gestion complète
- **Stagiaire** : Permissions limitées

### **Nouvelles permissions :**
- `edit_ticket` : Modifier un ticket
- `view_patient_history` : Voir l'historique
- `send_notifications` : Envoyer des notifications
- `export_data` : Exporter les données

---

## 🎉 **Avantages de cette structure**

✅ **Sécurité renforcée** : Permissions granulaires  
✅ **Flexibilité** : Ajout facile de nouveaux rôles  
✅ **Clarté** : Rôles métier bien définis  
✅ **Évolutivité** : Structure extensible  
✅ **Maintenance** : Base de données propre  

---

**🎯 Votre système LineUp est maintenant prêt pour un usage professionnel !** 