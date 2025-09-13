# Sécurisation des Formulaires

## Principes de Base

### 1. Validation Côté Client

```javascript
const validateForm = {
  email: {
    required: "L'email est requis",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Email invalide"
    }
  },
  password: {
    required: "Le mot de passe est requis",
    minLength: {
      value: 8,
      message: "Le mot de passe doit faire au moins 8 caractères"
    },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: "Le mot de passe doit contenir majuscule, minuscule, chiffre et caractère spécial"
    }
  }
};
```

### 2. Sanitization des Entrées

```javascript
const sanitizeInput = (input) => {
  return sanitizeHtml(input, {
    allowedTags: [], // Aucune balise HTML permise
    allowedAttributes: {} // Aucun attribut permis
  });
};
```

### 3. Protection CSRF

```javascript
// Configuration du middleware CSRF
app.use(csrf());

// Dans le formulaire React
<form onSubmit={handleSubmit}>
  <input type="hidden" name="_csrf" value={csrfToken} />
  {/* autres champs */}
</form>
```

## Meilleures Pratiques

### 1. Validation des Champs

#### Email

- Format valide
- Domaine existant
- Pas de caractères dangereux

#### Mot de passe

- Longueur minimum
- Complexité requise
- Pas de données personnelles

#### Noms/Identifiants

- Longueur limitée
- Caractères autorisés
- Pas d'injection possible

### 2. Protection contre les Attaques

#### XSS (Cross-Site Scripting)

```javascript
// Middleware de sanitization
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
});
```

#### SQL/NoSQL Injection

```javascript
// Middleware de protection NoSQL
const sanitizeNoSQL = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key in obj) {
    if (!key.startsWith('$')) {
      clean[key] = typeof obj[key] === 'object' 
        ? sanitizeNoSQL(obj[key]) 
        : obj[key];
    }
  }
  return clean;
};
```

### 3. Gestion des Fichiers

```javascript
const fileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  validateFile: (file) => {
    if (!file) return 'Fichier requis';
    if (file.size > fileValidation.maxSize) return 'Fichier trop volumineux';
    if (!fileValidation.allowedTypes.includes(file.type)) return 'Type de fichier non autorisé';
    return null;
  }
};
```

## Implémentation Frontend

### 1. Composant de Formulaire Sécurisé

```jsx
const SecureForm = ({ onSubmit, fields, validation }) => {
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    const rules = validation[name];
    if (!rules) return true;

    if (rules.required && !value) {
      return rules.required;
    }

    if (rules.pattern && !rules.pattern.value.test(value)) {
      return rules.pattern.message;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formErrors = {};
    
    // Validation
    fields.forEach(field => {
      const error = validateField(field.name, field.value);
      if (error) formErrors[field.name] = error;
    });

    if (Object.keys(formErrors).length === 0) {
      try {
        await onSubmit(fields);
      } catch (error) {
        setErrors({ submit: error.message });
      }
    } else {
      setErrors(formErrors);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
          />
          {errors[field.name] && <span className="error">{errors[field.name]}</span>}
        </div>
      ))}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
};
```

### 2. Hook de Validation

```javascript
const useFormValidation = (initialState, validations) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (fieldValues = values) => {
    let tempErrors = {};
    Object.keys(fieldValues).forEach(key => {
      if (validations[key]) {
        const error = validateField(key, fieldValues[key], validations[key]);
        if (error) tempErrors[key] = error;
      }
    });
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    validate,
    setIsSubmitting
  };
};
```

## Tests de Sécurité

```javascript
describe('Form Security Tests', () => {
  it('should sanitize XSS attempts', () => {
    const input = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate email format', () => {
    const email = 'test@example.com';
    const isValid = validateField('email', email, validateForm.email);
    expect(isValid).toBe(null);
  });

  it('should reject weak passwords', () => {
    const password = 'weak';
    const error = validateField('password', password, validateForm.password);
    expect(error).toBeTruthy();
  });
});
```

## Checklist de Sécurité

1. **Validation**
   - [ ] Tous les champs requis sont validés
   - [ ] Formats d'email/téléphone vérifiés
   - [ ] Mots de passe conformes aux règles

2. **Sanitization**
   - [ ] Protection XSS active
   - [ ] Caractères spéciaux échappés
   - [ ] Longueurs max respectées

3. **Protection**
   - [ ] CSRF implementé
   - [ ] Rate limiting actif
   - [ ] Validation côté serveur

4. **Fichiers**
   - [ ] Types vérifiés
   - [ ] Taille limitée
   - [ ] Noms sécurisés

5. **Feedback**
   - [ ] Messages d'erreur clairs
   - [ ] Pas d'information sensible
   - [ ] Logs appropriés
