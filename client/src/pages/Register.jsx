import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Title from "../components/Title";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "patient" // par défaut patient
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // Validation en temps réel
  const validateField = (name, value) => {
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'firstName':
      case 'lastName': {
        if (value.length < 2) {
          errors[name] = 'Doit contenir au moins 2 caractères';
        } else {
          delete errors[name];
        }
        break;
      }
      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[name] = 'Format d\'email invalide';
        } else {
          delete errors[name];
        }
        break;
      }
      case 'password': {
        if (value.length < 6) {
          errors[name] = 'Minimum 6 caractères requis';
        } else {
          delete errors[name];
        }
        // Vérifier aussi la confirmation si elle existe
        if (formData.confirmPassword && value !== formData.confirmPassword) {
          errors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else if (formData.confirmPassword) {
          delete errors.confirmPassword;
        }
        break;
      }
      case 'confirmPassword': {
        if (value !== formData.password) {
          errors[name] = 'Les mots de passe ne correspondent pas';
        } else {
          delete errors[name];
        }
        break;
      }
      default:
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation finale
    if (formData.password !== formData.confirmPassword) {
      showError("Les mots de passe ne correspondent pas", 5000);
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères", 5000);
      setIsLoading(false);
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      showError("Veuillez corriger les erreurs dans le formulaire", 5000);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roleName: formData.role
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      showSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.", 5000);
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      console.error("Erreur d'inscription:", error);
      showError(error.message || "Impossible de créer le compte", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validation en temps réel
    validateField(name, value);
  };

  const isFormValid = () => {
    return formData.firstName && 
           formData.lastName && 
           formData.email && 
           formData.password && 
           formData.confirmPassword &&
           Object.keys(validationErrors).length === 0;
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-xs xs:max-w-sm se:max-w-md lg:max-w-lg mx-auto 
                        bg-white 
                        p-3 xs:p-4 se:p-6 sm:p-8 
                        rounded-lg se:rounded-xl 
                        accessible-shadow old-device-optimized">
          <Title level={1}>✨ Créer un compte</Title>

          {/* Message d'aide principal */}
          <div className="help-text mb-4 xs:mb-6 sm:mb-8">
            <p className="text-center legacy-text-primary">
              Remplissez ce formulaire pour créer votre compte LineUp
            </p>
            <p className="mt-2 legacy-text-secondary">
              Tous les champs marqués d'un * sont obligatoires
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-5 se:space-y-6" noValidate>
            {/* Nom et Prénom */}
            <div className="space-y-4 xs:space-y-5 se:space-y-0 se:grid se:grid-cols-2 se:gap-3 md:gap-4">
              <div>
                <label 
                  htmlFor="firstName"
                  className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
                >
                  👤 Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 legacy-text-secondary ${
                    validationErrors.firstName ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Jean"
                  disabled={isLoading}
                  aria-describedby="firstName-help firstName-error"
                  autoComplete="given-name"
                />
                <div id="firstName-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                  Votre prénom tel qu'il apparaîtra sur vos tickets
                </div>
                {validationErrors.firstName && (
                  <div id="firstName-error" className="mt-1 xs:mt-2 text-xs xs:text-sm text-red-600 font-medium">
                    ⚠️ {validationErrors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label 
                  htmlFor="lastName"
                  className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
                >
                  👤 Nom de famille *
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 legacy-text-secondary ${
                    validationErrors.lastName ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Dupont"
                  disabled={isLoading}
                  aria-describedby="lastName-help lastName-error"
                  autoComplete="family-name"
                />
                <div id="lastName-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                  Votre nom de famille
                </div>
                {validationErrors.lastName && (
                  <div id="lastName-error" className="mt-1 xs:mt-2 text-xs xs:text-sm text-red-600 font-medium">
                    ⚠️ {validationErrors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="email"
                className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
              >
                📧 Adresse email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 
                           rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                           transition-all duration-200 legacy-text-secondary ${
                  validationErrors.email ? 'error-highlight' : 'border-gray-300'
                }`}
                placeholder="Ex: jean.dupont@email.com"
                disabled={isLoading}
                aria-describedby="email-help email-error"
                autoComplete="email"
              />
              <div id="email-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                Cette adresse servira pour vous connecter
              </div>
              {validationErrors.email && (
                <div id="email-error" className="mt-1 xs:mt-2 text-xs xs:text-sm text-red-600 font-medium">
                  ⚠️ {validationErrors.email}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label 
                htmlFor="phone"
                className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
              >
                📱 Numéro de téléphone (optionnel)
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 border-gray-300 
                          rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                          transition-all duration-200 legacy-text-secondary"
                placeholder="Ex: 06 12 34 56 78"
                disabled={isLoading}
                aria-describedby="phone-help"
                autoComplete="tel"
              />
              <div id="phone-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                Pour vous contacter en cas de besoin (facultatif)
              </div>
            </div>

            {/* Type de compte */}
            <div>
              <label 
                htmlFor="role"
                className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
              >
                🎭 Type de compte *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 border-gray-300 
                          rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                          transition-all duration-200 legacy-text-secondary"
                disabled={isLoading}
                aria-describedby="role-help"
              >
                <option value="patient">👤 Patient - Je veux prendre des tickets de consultation</option>
                <option value="visiteur">👁️ Visiteur - Je veux seulement consulter les files d'attente</option>
              </select>
              <div id="role-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                Choisissez selon votre utilisation prévue du système
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label 
                htmlFor="password"
                className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
              >
                🔒 Mot de passe *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 
                           rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                           transition-all duration-200 legacy-text-secondary ${
                  validationErrors.password ? 'error-highlight' : 'border-gray-300'
                }`}
                placeholder="Minimum 6 caractères"
                disabled={isLoading}
                aria-describedby="password-help password-error"
                autoComplete="new-password"
              />
              <div id="password-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                Choisissez un mot de passe sécurisé d'au moins 6 caractères
              </div>
              {validationErrors.password && (
                <div id="password-error" className="mt-1 xs:mt-2 text-xs xs:text-sm text-red-600 font-medium">
                  ⚠️ {validationErrors.password}
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label 
                htmlFor="confirmPassword"
                className="block legacy-text-primary font-semibold text-gray-800 mb-2 xs:mb-3"
              >
                🔒 Confirmer le mot de passe *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full legacy-button px-3 xs:px-4 py-2 xs:py-3 border-2 
                           rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                           transition-all duration-200 legacy-text-secondary ${
                  validationErrors.confirmPassword ? 'error-highlight' : 'border-gray-300'
                }`}
                placeholder="Retapez votre mot de passe"
                disabled={isLoading}
                aria-describedby="confirmPassword-help confirmPassword-error"
                autoComplete="new-password"
              />
              <div id="confirmPassword-help" className="mt-1 xs:mt-2 text-xs xs:text-sm text-gray-600">
                Retapez le même mot de passe pour confirmation
              </div>
              {validationErrors.confirmPassword && (
                <div id="confirmPassword-error" className="mt-1 xs:mt-2 text-xs xs:text-sm text-red-600 font-medium">
                  ⚠️ {validationErrors.confirmPassword}
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`w-full legacy-button transition-all duration-200 ${
                isLoading || !isFormValid()
                  ? "bg-gray-400 cursor-not-allowed border-gray-400 text-gray-600 loading-state"
                  : "bg-green-600 hover:bg-green-700 text-white border-green-600"
              }`}
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <span className="old-android-safe inline-block mr-2 xs:mr-3">⏳</span>
                  Création en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
            
            {!isFormValid() && (
              <div id="submit-help" className="text-xs xs:text-sm text-gray-600 text-center">
                Veuillez remplir correctement tous les champs obligatoires
              </div>
            )}
          </form>

          {/* Lien vers connexion */}
          <div className="mt-6 xs:mt-8 pt-4 xs:pt-6 border-t-2 border-gray-200">
            <p className="legacy-text-secondary text-gray-700 mb-3 xs:mb-4 text-center">
              Vous avez déjà un compte ?
            </p>
            <Link
              to="/login"
              className="block w-full text-center legacy-button bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 transition-all duration-200 no-underline"
              aria-label="Aller à la page de connexion"
            >
              🔐 Se connecter
            </Link>
          </div>

          {/* Information importante */}
          <div className="mt-6 xs:mt-8 help-text">
            <h3 className="legacy-text-primary font-bold mb-2 xs:mb-3">ℹ️ Information importante</h3>
            <p className="text-xs xs:text-sm leading-relaxed">
              Les comptes <strong>Médecin</strong> et <strong>Secrétaire</strong> sont réservés au personnel médical 
              et ne peuvent pas être créés via cette page. Si vous êtes membre du personnel médical, 
              contactez l'administration pour obtenir vos accès.
            </p>
          </div>

          {/* Toasts pour les messages */}
          <Toast toasts={toasts} removeToast={removeToast} />
        </div>
      </AnimatedPage>
    </Layout>
  );
} 