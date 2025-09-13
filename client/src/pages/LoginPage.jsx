/**
 * 🔐 Page de Connexion Moderne - LineUp
 * 
 * Interface sécurisée avec validation en temps réel et design harmonisé
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFormValidation } from '../utils/validation';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { LoadingSpinner, ErrorFeedback, SuccessFeedback } from '../components/ui/UXComponents';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState(null);

  // Validation avec le hook personnalisé
  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateAll,
    getFieldProps,
    isValid
  } = useFormValidation(
    { email: '', password: '' },
    ['email', 'password']
  );

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Gestion du blocage temporaire
  useEffect(() => {
    if (loginAttempts >= 5) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes
      
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loginAttempts]);

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isBlocked) {
      setFeedback({
        type: 'error',
        message: `Compte temporairement bloqué. Réessayez dans ${Math.ceil(blockTimeRemaining / 60)} minutes.`
      });
      return;
    }

    if (!validateAll() || !isValid) {
      setFeedback({
        type: 'error',
        message: 'Veuillez corriger les erreurs dans le formulaire.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await login(values.email, values.password);
      
      if (result.success) {
        setFeedback({
          type: 'success',
          message: 'Connexion réussie ! Redirection...'
        });
        
        // Redirection basée sur le rôle
        setTimeout(() => {
          switch (result.user.role) {
            case 'docteur':
              navigate('/dashboard/doctor');
              break;
            case 'secretaire':
              navigate('/dashboard/secretary');
              break;
            case 'admin':
              navigate('/dashboard/admin');
              break;
            default:
              navigate('/dashboard/patient');
          }
        }, 1500);
      } else {
        setLoginAttempts(prev => prev + 1);
        setFeedback({
          type: 'error',
          message: result.message || 'Email ou mot de passe incorrect.'
        });
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      setFeedback({
        type: 'error',
        message: 'Erreur de connexion. Vérifiez votre connexion internet.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format du temps de blocage
  const formatBlockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 
                    flex items-center justify-center p-4 animate-fade-in">
      
      {/* Feedback Messages */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50">
          {feedback.type === 'success' ? (
            <SuccessFeedback 
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          ) : (
            <ErrorFeedback 
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          )}
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 
                          bg-primary-500 rounded-full mb-4 shadow-accessible">
            <Icon name="security" size="xl" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-800 mb-2">
            Connexion à LineUp
          </h1>
          <p className="text-secondary-600">
            Accédez à votre espace personnel sécurisé
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-accessible 
                        border border-secondary-200 p-6 animate-scale-in">
          
          {/* Indicateur de tentatives */}
          {loginAttempts > 0 && (
            <div className={`mb-4 p-3 rounded-lg border ${
              loginAttempts >= 3 ? 'bg-error-50 border-error-200 text-error-700' :
              'bg-warning-50 border-warning-200 text-warning-700'
            }`}>
              <div className="flex items-center gap-2">
                <Icon name="warning" size="sm" />
                <span className="text-sm font-medium">
                  {loginAttempts >= 3 ? 
                    `Attention : ${loginAttempts}/5 tentatives` :
                    `${loginAttempts} tentative${loginAttempts > 1 ? 's' : ''} échouée${loginAttempts > 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Blocage temporaire */}
          {isBlocked && (
            <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-center gap-2 text-error-700">
                <Icon name="lock" size="sm" />
                <div>
                  <p className="font-semibold">Compte temporairement bloqué</p>
                  <p className="text-sm">
                    Temps restant : {formatBlockTime(blockTimeRemaining)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                <Icon name="email" size="sm" className="inline mr-2" />
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                disabled={isBlocked || isSubmitting}
                className={`
                  w-full px-4 py-3 rounded-lg border transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                  disabled:bg-secondary-50 disabled:cursor-not-allowed
                  ${getFieldProps('email').error ? 
                    'border-error-300 bg-error-50' : 
                    'border-secondary-300 hover:border-secondary-400'
                  }
                `}
                placeholder="votre@email.com"
                {...getFieldProps('email')}
              />
              {getFieldProps('email').helperText && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <Icon name="warning" size="xs" />
                  {getFieldProps('email').helperText}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                <Icon name="lock" size="sm" className="inline mr-2" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  disabled={isBlocked || isSubmitting}
                  className={`
                    w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                    disabled:bg-secondary-50 disabled:cursor-not-allowed
                    ${getFieldProps('password').error ? 
                      'border-error-300 bg-error-50' : 
                      'border-secondary-300 hover:border-secondary-400'
                    }
                  `}
                  placeholder="••••••••"
                  {...getFieldProps('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isBlocked || isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-secondary-500 hover:text-secondary-700
                           transition-colors duration-200 disabled:opacity-50"
                >
                  <Icon name={showPassword ? 'unlock' : 'lock'} size="sm" />
                </button>
              </div>
              {getFieldProps('password').helperText && (
                <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                  <Icon name="warning" size="xs" />
                  {getFieldProps('password').helperText}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-secondary-300 text-primary-500 
                           focus:ring-primary-400 focus:ring-2"
                />
                <span className="text-secondary-600">Se souvenir de moi</span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-primary-600 hover:text-primary-700 font-medium
                         transition-colors duration-200"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Boutons */}
            <div className="space-y-3 pt-2">
              <PrimaryButton
                type="submit"
                disabled={isBlocked || isSubmitting || !isValid}
                loading={isSubmitting}
                icon="login"
                className="w-full"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </PrimaryButton>

              <SecondaryButton
                type="button"
                onClick={() => navigate('/')}
                className="w-full"
                icon="back"
              >
                Retour à l'accueil
              </SecondaryButton>
            </div>
          </form>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-secondary-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-secondary-500">ou</span>
            </div>
          </div>

          {/* Lien inscription */}
          <div className="text-center">
            <p className="text-secondary-600">
              Pas encore de compte ?{' '}
              <Link 
                to="/register" 
                className="text-primary-600 hover:text-primary-700 font-semibold
                         transition-colors duration-200"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Footer sécurité */}
        <div className="mt-6 text-center text-xs text-secondary-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="security" size="xs" />
            <span>Connexion sécurisée SSL</span>
          </div>
          <p>Vos données sont protégées par un chiffrement de niveau bancaire</p>
        </div>
      </div>
    </div>
  );
}