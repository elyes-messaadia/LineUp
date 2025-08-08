import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Title from "../components/Title";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";
import { UserRound, Mail, Eye, EyeOff, Lock, Info, Loader2 } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <div className="max-w-sm sm:max-w-md lg:max-w-lg mx-auto 
                        bg-white 
                        p-4 sm:p-6 lg:p-8 
                        rounded-xl 
                        accessible-shadow old-device-optimized">
          <Title level={1} icon={<UserRound className="w-6 h-6" />}>Créer un compte</Title>

          {/* Message d'aide principal */}
          <div className="help-text mb-6 sm:mb-8">
            <p className="text-center legacy-text-primary">
              Remplissez ce formulaire pour créer votre compte LineUp
            </p>
            <p className="mt-2 legacy-text-secondary">
              Tous les champs marqués d'un * sont obligatoires
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
            {/* Nom et Prénom - Toujours en colonne sur mobile et tablettes */}
            <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
              <div>
                <label 
                  htmlFor="firstName"
                  className="block legacy-text-primary font-semibold text-gray-800 mb-3"
                >
                  Prénom *
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white px-4 py-3 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 text-gray-700 ${
                    validationErrors.firstName ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Jean"
                  disabled={isLoading}
                  aria-describedby="firstName-help firstName-error"
                  autoComplete="given-name"
                />
                <div id="firstName-help" className="mt-2 text-sm text-gray-600">
                  Votre prénom tel qu'il apparaîtra sur vos tickets
                </div>
                  {validationErrors.firstName && (
                  <div id="firstName-error" className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.firstName}
                  </div>
                )}
              </div>

              <div>
                <label 
                  htmlFor="lastName"
                  className="block legacy-text-primary font-semibold text-gray-800 mb-3"
                >
                  Nom de famille *
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white px-4 py-3 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 text-gray-700 ${
                    validationErrors.lastName ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Dupont"
                  disabled={isLoading}
                  aria-describedby="lastName-help lastName-error"
                  autoComplete="family-name"
                />
                <div id="lastName-help" className="mt-2 text-sm text-gray-600">
                  Votre nom de famille
                </div>
                {validationErrors.lastName && (
                  <div id="lastName-error" className="mt-2 text-sm text-red-600 font-medium">
                    {validationErrors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="email"
                className="block legacy-text-primary font-semibold text-gray-800 mb-3"
              >
                 Adresse email *
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full bg-white px-4 py-3 border-2 
                           rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                           transition-all duration-200 text-gray-700 ${
                  validationErrors.email ? 'error-highlight' : 'border-gray-300'
                }`}
                placeholder="Ex: jean.dupont@email.com"
                disabled={isLoading}
                aria-describedby="email-help email-error"
                autoComplete="email"
              />
              <div id="email-help" className="mt-2 text-sm text-gray-600">
                Cette adresse servira pour vous connecter
              </div>
               {validationErrors.email && (
                <div id="email-error" className="mt-2 text-sm text-red-600 font-medium">
                  {validationErrors.email}
                </div>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label 
                htmlFor="phone"
                className="block legacy-text-primary font-semibold text-gray-800 mb-3"
              >
                 Numéro de téléphone (optionnel)
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white px-4 py-3 border-2 border-gray-300 
                          rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                          transition-all duration-200 text-gray-700"
                placeholder="Ex: 06 12 34 56 78"
                disabled={isLoading}
                aria-describedby="phone-help"
                autoComplete="tel"
              />
              <div id="phone-help" className="mt-2 text-sm text-gray-600">
                Pour vous contacter en cas de besoin (facultatif)
              </div>
            </div>

            {/* Type de compte */}
            <div>
              <label 
                htmlFor="role"
                className="block legacy-text-primary font-semibold text-gray-800 mb-3"
              >
                 Type de compte *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-white px-4 py-3 border-2 border-gray-300 
                          rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                          transition-all duration-200 text-gray-700"
                disabled={isLoading}
                aria-describedby="role-help"
              >
                <option value="patient">Patient - Je veux prendre des tickets de consultation</option>
                <option value="visiteur">Visiteur - Je veux seulement consulter les files d'attente</option>
              </select>
              <div id="role-help" className="mt-2 text-sm text-gray-600">
                Choisissez selon votre utilisation prévue du système
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label 
                htmlFor="password"
                className="block legacy-text-primary font-semibold text-gray-800 mb-3"
              >
                 Mot de passe *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white px-4 py-3 pr-12 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 text-gray-700 ${
                    validationErrors.password ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 6 caractères"
                  disabled={isLoading}
                  aria-describedby="password-help password-error"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div id="password-help" className="mt-2 text-sm text-gray-600">
                Choisissez un mot de passe sécurisé d'au moins 6 caractères
              </div>
              {validationErrors.password && (
                <div id="password-error" className="mt-2 text-sm text-red-600 font-medium">
                  ⚠️ {validationErrors.password}
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label 
                htmlFor="confirmPassword"
                className="block legacy-text-primary font-semibold text-gray-800 mb-3"
              >
                 Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className={`w-full bg-white px-4 py-3 pr-12 border-2 
                             rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 
                             transition-all duration-200 text-gray-700 ${
                    validationErrors.confirmPassword ? 'error-highlight' : 'border-gray-300'
                  }`}
                  placeholder="Retapez votre mot de passe"
                  disabled={isLoading}
                  aria-describedby="confirmPassword-help confirmPassword-error"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div id="confirmPassword-help" className="mt-2 text-sm text-gray-600">
                Retapez le même mot de passe pour confirmation
              </div>
               {validationErrors.confirmPassword && (
                <div id="confirmPassword-error" className="mt-2 text-sm text-red-600 font-medium">
                  {validationErrors.confirmPassword}
                </div>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid()}
              className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition-all duration-200 ${
                isLoading || !isFormValid()
                  ? "bg-gray-400 cursor-not-allowed border-gray-400 text-gray-600 loading-state"
                  : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              }`}
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline-block mr-3" />
                  Création en cours...
                </>
              ) : (
                "Créer mon compte"
              )}
            </button>
            
            {!isFormValid() && (
              <div id="submit-help" className="text-sm text-gray-600 text-center">
                Veuillez remplir correctement tous les champs obligatoires
              </div>
            )}
          </form>

          {/* Lien vers connexion */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="legacy-text-secondary text-gray-700 mb-4 text-center">
              Vous avez déjà un compte ?
            </p>
            <Link
              to="/login"
              className="block w-full text-center px-4 py-3 border-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 transition-all duration-200 no-underline"
              aria-label="Aller à la page de connexion"
            >
              <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Se connecter</span>
            </Link>
          </div>

          {/* Information importante */}
          <div className="mt-8 help-text">
            <h3 className="legacy-text-primary font-bold mb-3"><span className="inline-flex items-center gap-2"><Info className="w-4 h-4" /> Information importante</span></h3>
            <p className="text-sm leading-relaxed">
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