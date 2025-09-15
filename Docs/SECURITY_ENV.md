# Sécurité des Variables d'Environnement

## Règles Importantes

1. **Ne jamais commiter de fichiers .env**
   - Les fichiers .env contiennent des informations sensibles
   - Utilisez toujours .env.example comme modèle

2. **Secrets en Production**
   - Utilisez des gestionnaires de secrets sécurisés (ex: Vault, AWS Secrets Manager)
   - Changez régulièrement les secrets
   - Utilisez des secrets différents pour chaque environnement

3. **Variables Frontend**
   - Ne stockez JAMAIS de secrets dans le frontend
   - Les variables d'environnement frontend sont publiques
   - Préfixez les variables Vite avec VITE_

4. **Variables Backend**
   - Stockez les secrets sensibles uniquement côté serveur
   - Utilisez des variables d'environnement pour tous les secrets
   - Validez les variables requises au démarrage

## Configuration

1. Copiez les fichiers .env.example :
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

2. Remplissez les valeurs requises dans les fichiers .env

3. Vérifiez que les fichiers .env sont dans .gitignore

## Sécurité en Production

1. Utilisez des secrets forts et aléatoires
2. Limitez l'accès aux variables d'environnement
3. Auditez régulièrement les accès aux secrets
4. Utilisez la rotation automatique des secrets si possible

## Vérification de Sécurité

Pour vérifier qu'aucun secret n'a été commité :

1. Vérifiez l'historique Git :
   ```bash
   git log -p | grep -i "password\|secret\|key\|token"
   ```

2. Utilisez des outils comme GitGuardian ou TruffleHog

3. Configurez des hooks pre-commit pour prévenir les fuites