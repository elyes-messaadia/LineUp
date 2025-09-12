## Organisation de la documentation et sécurité du projet

La documentation du projet LineUp est structurée pour couvrir à la fois l’aspect fonctionnel (dans le dossier `docs/`) et l’aspect sécurité (dans `Docs/SECURITY.md`). Cette organisation permet une séparation claire entre la documentation utilisateur/développeur et les procédures spécifiques à la sécurité.

### Structure des dossiers

- **docs/** : Contient la documentation générale du projet (installation, API, guides d’utilisation, architecture, etc.).
- **Docs/SECURITY.md** : Document dédié à la sécurité, détaillant les vulnérabilités identifiées, les correctifs, les bonnes pratiques, la configuration sécurisée, les procédures d’audit et le plan de réponse aux incidents.

### Stack technique détaillée

#### Backend

- **Node.js** avec **Express.js** pour le serveur HTTP.
- **MongoDB** comme base de données principale.
- **Pino** pour le logging structuré et sécurisé.
- **Helmet** pour la configuration des headers HTTP de sécurité (CSP, HSTS, etc.).
- **express-rate-limit** pour la limitation de taux (rate limiting).
- **express-mongo-sanitize** et **xss-clean** pour la protection contre les injections NoSQL et XSS.
- **jsonwebtoken** pour la gestion des tokens JWT.
- **bcrypt** pour le hachage sécurisé des mots de passe.

#### Frontend

- **React** (ou équivalent moderne) pour l’interface utilisateur.
- Utilisation de **fetch** ou **axios** pour les appels API.
- Stockage sécurisé des tokens (cookies HttpOnly/Secure/SameSite).

#### Sécurité et DevOps

- **Dependabot** pour la surveillance et la mise à jour automatique des dépendances.
- **npm audit** pour l’audit régulier des vulnérabilités.
- **ESLint** avec des règles de sécurité pour l’analyse statique du code.
- **Tests de pénétration** réguliers (manuels ou automatisés).
- **Backups** et procédures de restauration testées.

Cette organisation permet de garantir que la sécurité est traitée comme une préoccupation transversale, documentée et suivie tout au long du cycle de vie du projet.
