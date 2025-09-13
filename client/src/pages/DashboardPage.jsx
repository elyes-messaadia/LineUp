/**
 * 🎯 Dashboard Principal - LineUp
 *
 * Composant qui route vers le bon dashboard selon le rôle de l'utilisateur
 */

import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner, ErrorFeedback } from "../components/ui/UXComponents";
import PatientDashboard from "../components/dashboards/PatientDashboard";
import DoctorDashboard from "../components/dashboards/DoctorDashboard";
import SecretaryDashboard from "../components/dashboards/SecretaryDashboard";
import Icon from "../components/ui/Icon";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Chargement
  if (loading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 
                      flex items-center justify-center"
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">
            Chargement de votre dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Utilisateur non connecté
  if (!user) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30 
                      flex items-center justify-center p-4"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-error-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Icon name="warning" size="lg" className="text-error-600" />
          </div>
          <h1 className="text-xl font-semibold text-secondary-800 mb-2">
            Accès non autorisé
          </h1>
          <p className="text-secondary-600 mb-6">
            Vous devez être connecté pour accéder à cette page.
          </p>
          <ErrorFeedback
            message="Veuillez vous connecter pour continuer."
            onClose={() => (window.location.href = "/login")}
            actionLabel="Se connecter"
          />
        </div>
      </div>
    );
  }

  // Layout principal du dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50/30">
      {/* Header global */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-secondary-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et titre */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Icon name="medical" size="sm" className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-secondary-800">
                  LineUp
                </h1>
                <p className="text-xs text-secondary-600">
                  Dashboard{" "}
                  {user.role === "docteur"
                    ? "Médecin"
                    : user.role === "secretaire"
                    ? "Secrétaire"
                    : "Patient"}
                </p>
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="flex items-center gap-4">
              {/* Notifications (placeholder) */}
              <button
                className="relative p-2 text-secondary-600 hover:text-secondary-800 
                               hover:bg-secondary-100 rounded-lg transition-colors duration-200"
              >
                <Icon name="notification" size="sm" />
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 
                               rounded-full text-xs flex items-center justify-center"
                >
                  <span className="sr-only">Nouvelles notifications</span>
                </span>
              </button>

              {/* Profil utilisateur */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Icon
                    name={
                      user.role === "docteur"
                        ? "doctor"
                        : user.role === "secretaire"
                        ? "secretary"
                        : "patient"
                    }
                    size="sm"
                    className="text-primary-600"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-secondary-800">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-secondary-600">
                    {user.role === "docteur"
                      ? "Médecin"
                      : user.role === "secretaire"
                      ? "Secrétaire"
                      : "Patient"}
                  </p>
                </div>
              </div>

              {/* Menu utilisateur */}
              <button
                className="p-2 text-secondary-600 hover:text-secondary-800 
                               hover:bg-secondary-100 rounded-lg transition-colors duration-200"
              >
                <Icon name="settings" size="sm" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Rendu conditionnel selon le rôle */}
        {user.role === "patient" && <PatientDashboard />}
        {user.role === "docteur" && <DoctorDashboard />}
        {user.role === "secretaire" && <SecretaryDashboard />}

        {/* Rôle non reconnu */}
        {!["patient", "docteur", "secretaire"].includes(user.role) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warning-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Icon name="warning" size="lg" className="text-warning-600" />
            </div>
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Rôle non reconnu
            </h2>
            <p className="text-secondary-600 mb-6">
              Votre rôle "{user.role}" n'est pas pris en charge par cette
              version de l'application.
            </p>
            <ErrorFeedback message="Contactez l'administrateur pour résoudre ce problème." />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-secondary-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Icon name="security" size="xs" />
              <span>Plateforme médicale sécurisée</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-secondary-600">
              <span>© 2024 LineUp</span>
              <button className="hover:text-secondary-800 transition-colors duration-200">
                Support
              </button>
              <button className="hover:text-secondary-800 transition-colors duration-200">
                Confidentialité
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
