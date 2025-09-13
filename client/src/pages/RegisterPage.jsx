/**
 * 📝 Page d'Inscription Moderne - LineUp
 *
 * Interface sécurisée avec validation en temps réel et design harmonisé
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useFormValidation } from "../utils/validation";
import { PrimaryButton, SecondaryButton } from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import {
  LoadingSpinner,
  ErrorFeedback,
  SuccessFeedback,
} from "../components/ui/UXComponents";

const ROLES = [
  {
    value: "patient",
    label: "Patient",
    icon: "patient",
    description: "Prendre des rendez-vous",
  },
  {
    value: "docteur",
    label: "Médecin",
    icon: "doctor",
    description: "Gérer les consultations",
  },
  {
    value: "secretaire",
    label: "Secrétaire",
    icon: "secretary",
    description: "Administrer les rendez-vous",
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    isValid,
  } = useFormValidation(
    {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "patient",
    },
    [
      "email",
      "password",
      "confirmPassword",
      "firstName",
      "lastName",
      "phone",
      "role",
    ]
  );

  // Redirection si déjà connecté
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Validation par étape
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return (
          ["email", "password", "confirmPassword"].every(
            (field) => !errors[field] || errors[field].length === 0
          ) &&
          values.email &&
          values.password &&
          values.confirmPassword
        );

      case 2:
        return (
          ["firstName", "lastName"].every(
            (field) => !errors[field] || errors[field].length === 0
          ) &&
          values.firstName &&
          values.lastName
        );

      case 3:
        return values.role && agreedToTerms;

      default:
        return false;
    }
  };

  // Navigation entre étapes
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll() || !isValid || !agreedToTerms) {
      setFeedback({
        type: "error",
        message: "Veuillez corriger les erreurs et accepter les conditions.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const registrationData = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        role: values.role,
      };

      const result = await register(registrationData);

      if (result.success) {
        setFeedback({
          type: "success",
          message:
            "Inscription réussie ! Vérifiez votre email pour activer votre compte.",
        });

        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
            },
          });
        }, 3000);
      } else {
        setFeedback({
          type: "error",
          message: result.message || "Erreur lors de l'inscription.",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "Erreur de connexion. Vérifiez votre connexion internet.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Indicateur de progression
  const progressPercentage = (currentStep / 3) * 100;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 
                    flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Feedback Messages */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50">
          {feedback.type === "success" ? (
            <SuccessFeedback
              message={feedback.message}
              onClose={() => setFeedback(null)}
              autoClose={false}
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
          <div
            className="inline-flex items-center justify-center w-16 h-16 
                          bg-accent-500 rounded-full mb-4 shadow-accessible"
          >
            <Icon name="add" size="xl" className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-800 mb-2">
            Créer un compte LineUp
          </h1>
          <p className="text-secondary-600">
            Rejoignez notre communauté médicale
          </p>
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-secondary-600 mb-2">
            <span
              className={currentStep >= 1 ? "text-primary-600 font-medium" : ""}
            >
              Sécurité
            </span>
            <span
              className={currentStep >= 2 ? "text-primary-600 font-medium" : ""}
            >
              Identité
            </span>
            <span
              className={currentStep >= 3 ? "text-primary-600 font-medium" : ""}
            >
              Rôle
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-smooth"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Formulaire */}
        <div
          className="bg-white/95 backdrop-blur-sm rounded-xl shadow-accessible 
                        border border-secondary-200 p-6 animate-scale-in"
        >
          <form onSubmit={handleSubmit}>
            {/* Étape 1: Sécurité */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-slide-in-right">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-secondary-800 mb-1">
                    <Icon name="security" size="sm" className="inline mr-2" />
                    Sécurité de votre compte
                  </h2>
                  <p className="text-sm text-secondary-600">
                    Créez vos identifiants de connexion sécurisés
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="email" size="sm" className="inline mr-2" />
                    Adresse email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    disabled={isSubmitting}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-300
                      focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                      disabled:bg-secondary-50 disabled:cursor-not-allowed
                      ${
                        getFieldProps("email").error
                          ? "border-error-300 bg-error-50"
                          : "border-secondary-300 hover:border-secondary-400"
                      }
                    `}
                    placeholder="votre@email.com"
                    {...getFieldProps("email")}
                  />
                  {getFieldProps("email").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("email").helperText}
                    </p>
                  )}
                </div>

                {/* Mot de passe */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="lock" size="sm" className="inline mr-2" />
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      disabled={isSubmitting}
                      className={`
                        w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                        disabled:bg-secondary-50 disabled:cursor-not-allowed
                        ${
                          getFieldProps("password").error
                            ? "border-error-300 bg-error-50"
                            : "border-secondary-300 hover:border-secondary-400"
                        }
                      `}
                      placeholder="••••••••"
                      {...getFieldProps("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 
                               text-secondary-500 hover:text-secondary-700
                               transition-colors duration-200 disabled:opacity-50"
                    >
                      <Icon name={showPassword ? "unlock" : "lock"} size="sm" />
                    </button>
                  </div>
                  {getFieldProps("password").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("password").helperText}
                    </p>
                  )}
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="lock" size="sm" className="inline mr-2" />
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      disabled={isSubmitting}
                      className={`
                        w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                        disabled:bg-secondary-50 disabled:cursor-not-allowed
                        ${
                          getFieldProps("confirmPassword").error
                            ? "border-error-300 bg-error-50"
                            : "border-secondary-300 hover:border-secondary-400"
                        }
                      `}
                      placeholder="••••••••"
                      {...getFieldProps("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isSubmitting}
                      className="absolute right-3 top-1/2 -translate-y-1/2 
                               text-secondary-500 hover:text-secondary-700
                               transition-colors duration-200 disabled:opacity-50"
                    >
                      <Icon
                        name={showConfirmPassword ? "unlock" : "lock"}
                        size="sm"
                      />
                    </button>
                  </div>
                  {getFieldProps("confirmPassword").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("confirmPassword").helperText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2: Identité */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-slide-in-right">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-secondary-800 mb-1">
                    <Icon name="user" size="sm" className="inline mr-2" />
                    Vos informations personnelles
                  </h2>
                  <p className="text-sm text-secondary-600">
                    Ces informations nous aident à personnaliser votre
                    expérience
                  </p>
                </div>

                {/* Prénom */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="user" size="sm" className="inline mr-2" />
                    Prénom *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    disabled={isSubmitting}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-300
                      focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                      disabled:bg-secondary-50 disabled:cursor-not-allowed
                      ${
                        getFieldProps("firstName").error
                          ? "border-error-300 bg-error-50"
                          : "border-secondary-300 hover:border-secondary-400"
                      }
                    `}
                    placeholder="Jean"
                    {...getFieldProps("firstName")}
                  />
                  {getFieldProps("firstName").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("firstName").helperText}
                    </p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="user" size="sm" className="inline mr-2" />
                    Nom *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    disabled={isSubmitting}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-300
                      focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                      disabled:bg-secondary-50 disabled:cursor-not-allowed
                      ${
                        getFieldProps("lastName").error
                          ? "border-error-300 bg-error-50"
                          : "border-secondary-300 hover:border-secondary-400"
                      }
                    `}
                    placeholder="Dupont"
                    {...getFieldProps("lastName")}
                  />
                  {getFieldProps("lastName").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("lastName").helperText}
                    </p>
                  )}
                </div>

                {/* Téléphone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    <Icon name="phone" size="sm" className="inline mr-2" />
                    Téléphone (optionnel)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    disabled={isSubmitting}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-300
                      focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                      disabled:bg-secondary-50 disabled:cursor-not-allowed
                      ${
                        getFieldProps("phone").error
                          ? "border-error-300 bg-error-50"
                          : "border-secondary-300 hover:border-secondary-400"
                      }
                    `}
                    placeholder="06 12 34 56 78"
                    {...getFieldProps("phone")}
                  />
                  {getFieldProps("phone").helperText && (
                    <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                      <Icon name="warning" size="xs" />
                      {getFieldProps("phone").helperText}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Étape 3: Rôle */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-slide-in-right">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-secondary-800 mb-1">
                    <Icon name="settings" size="sm" className="inline mr-2" />
                    Choisissez votre rôle
                  </h2>
                  <p className="text-sm text-secondary-600">
                    Sélectionnez le rôle qui correspond à votre utilisation
                  </p>
                </div>

                {/* Sélection du rôle */}
                <div className="space-y-3">
                  {ROLES.map((role) => (
                    <label
                      key={role.value}
                      className={`
                        flex items-center p-4 rounded-lg border-2 cursor-pointer
                        transition-all duration-300 hover:shadow-mobile
                        ${
                          values.role === role.value
                            ? "border-primary-400 bg-primary-50"
                            : "border-secondary-200 hover:border-secondary-300"
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={values.role === role.value}
                        onChange={handleChange("role")}
                        className="sr-only"
                      />
                      <div className="flex items-center flex-1">
                        <div
                          className={`
                          w-10 h-10 rounded-full flex items-center justify-center mr-3
                          ${
                            values.role === role.value
                              ? "bg-primary-500 text-white"
                              : "bg-secondary-100 text-secondary-600"
                          }
                        `}
                        >
                          <Icon name={role.icon} size="sm" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-800">
                            {role.label}
                          </p>
                          <p className="text-sm text-secondary-600">
                            {role.description}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`
                        w-5 h-5 rounded-full border-2 flex-shrink-0
                        ${
                          values.role === role.value
                            ? "border-primary-500 bg-primary-500"
                            : "border-secondary-300"
                        }
                      `}
                      >
                        {values.role === role.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Conditions d'utilisation */}
                <div className="pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 rounded border-secondary-300 text-primary-500 
                               focus:ring-primary-400 focus:ring-2"
                    />
                    <div className="text-sm text-secondary-600">
                      J'accepte les{" "}
                      <Link
                        to="/terms"
                        className="text-primary-600 hover:text-primary-700 font-medium
                                 transition-colors duration-200"
                        target="_blank"
                      >
                        conditions d'utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link
                        to="/privacy"
                        className="text-primary-600 hover:text-primary-700 font-medium
                                 transition-colors duration-200"
                        target="_blank"
                      >
                        politique de confidentialité
                      </Link>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex gap-3 pt-6">
              {currentStep > 1 && (
                <SecondaryButton
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  icon="back"
                  className="flex-1"
                >
                  Précédent
                </SecondaryButton>
              )}

              {currentStep < 3 ? (
                <PrimaryButton
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep) || isSubmitting}
                  icon="right"
                  className="flex-1"
                >
                  Suivant
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  type="submit"
                  disabled={
                    !validateStep(currentStep) || !agreedToTerms || isSubmitting
                  }
                  loading={isSubmitting}
                  icon="add"
                  className="flex-1"
                >
                  {isSubmitting ? "Création..." : "Créer mon compte"}
                </PrimaryButton>
              )}
            </div>
          </form>

          {/* Lien connexion */}
          <div className="mt-6 text-center border-t border-secondary-200 pt-6">
            <p className="text-secondary-600">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold
                         transition-colors duration-200"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Footer sécurité */}
        <div className="mt-6 text-center text-xs text-secondary-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon name="security" size="xs" />
            <span>Inscription sécurisée SSL</span>
          </div>
          <p>Vos données personnelles sont protégées et chiffrées</p>
        </div>
      </div>
    </div>
  );
}
