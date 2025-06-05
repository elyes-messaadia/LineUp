// Force Netlify rebuild with new API URL - 2025-01-27
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Title from "../components/Title";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../hooks/useToast";
import BACKEND_URL from "../config/api";

const DOCTEURS = ['Docteur 1', 'Docteur 2', 'Docteur 3'];

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();

  useEffect(() => {
    // Vérifier l'authentification
    const userData = localStorage.getItem("user");
    const authStatus = localStorage.getItem("isAuthenticated");
    
    if (userData && authStatus) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  const handleTakeTicket = () => {
    if (isAuthenticated && user) {
      // Si connecté, vérifier le rôle
      if (user.role.name === "visiteur") {
        showInfo("En tant que visiteur, vous ne pouvez pas prendre de ticket. Créez un compte Patient.");
        return;
      }
      if (user.role.name === "patient") {
        // Rediriger vers le dashboard patient
        navigate("/dashboard/patient");
        return;
      }
      if (["medecin", "secretaire"].includes(user.role.name)) {
        // Les médecins/secrétaires peuvent créer des tickets via leur dashboard
        navigate(`/dashboard/${user.role.name}`);
        return;
      }
    }
    
    // Mode anonyme (ancien système)
    setShowTicketModal(true);
  };

  const confirmTakeTicket = async () => {
    if (!selectedDoctor) {
      showError("Veuillez sélectionner un docteur");
      return;
    }

    setShowTicketModal(false);
    setIsLoading(true);

    try {
      showInfo("Création de votre ticket en cours...");
      
      console.log('🎯 Using API URL:', BACKEND_URL);
      
      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docteur: selectedDoctor })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Erreur ${res.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || "Erreur lors de la création du ticket");
      }

      // S'assurer que le ticket est bien créé
      if (!data.ticket) {
        throw new Error("Données de ticket manquantes dans la réponse");
      }

      // Stocker les informations du ticket
      localStorage.setItem("lineup_ticket", JSON.stringify({
        ...data.ticket,
        isAnonymous: true,
        docteur: selectedDoctor
      }));
      
      showSuccess(`Ticket n°${data.ticket.number} créé avec succès !`, 4000);
      
      // Redirection après un court délai
      setTimeout(() => {
        navigate("/queue");
      }, 1500);

    } catch (error) {
      console.error("Erreur création ticket:", error);
      setShowTicketModal(true); // Réafficher le modal en cas d'erreur
      showError(error.message || "Impossible de créer le ticket. Veuillez réessayer.", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout hideTitle={true}>
      <AnimatedPage>
        <div className="text-center bg-white p-4 sm:p-6 lg:p-8 rounded-xl accessible-shadow max-w-2xl mx-auto">
          <Title>🏥 Bienvenue sur LineUp</Title>
          
          {/* Description principale avec message d'aide */}
          <div className="help-text mb-6 sm:mb-8">
            <p className="font-medium text-center">
              Gérez votre file d'attente médicale en toute simplicité
            </p>
            <p className="mt-2 text-sm">
              Prenez un ticket, suivez votre position en temps réel
            </p>
          </div>

          {/* Section utilisateur connecté */}
          {isAuthenticated && user && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">
                  {user.role?.name === "medecin" && "🩺"}
                  {user.role?.name === "secretaire" && "👩‍💼"}
                  {user.role?.name === "patient" && "👤"}
                  {user.role?.name === "visiteur" && "👁️"}
                </span>
                <h2 className="senior-friendly-text font-bold text-blue-900">
                  Bonjour {user.fullName || `${user.firstName} ${user.lastName}`}
                </h2>
              </div>
              <p className="text-blue-700 senior-friendly-text mb-4 sm:mb-6">
                Vous êtes connecté en tant que{' '}
                <strong>
                  {user.role?.name === "medecin" ? "Médecin" :
                   user.role?.name === "secretaire" ? "Secrétaire" :
                   user.role?.name === "patient" ? "Patient" :
                   user.role?.name === "visiteur" ? "Visiteur" : "Utilisateur"}
                </strong>
              </p>
              <button
                onClick={() => navigate(`/dashboard/${user.role.name}`)}
                className="high-contrast-button touch-target-large bg-blue-600 hover:bg-blue-700 text-white border-blue-600 w-full sm:w-auto gentle-transition"
                aria-label="Accéder à votre espace personnel"
              >
                📊 Accéder à mon espace
              </button>
            </div>
          )}

          {/* Actions principales */}
          <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
            {!isAuthenticated ? (
              // Mode non connecté
              <div className="space-y-6">
                {/* Action principale : Prendre un ticket */}
                <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="senior-friendly-text font-bold text-blue-900 mb-4">
                    🎟️ Prendre un ticket rapidement
                  </h3>
                  <button
                    onClick={handleTakeTicket}
                    disabled={isLoading}
                    className={`w-full high-contrast-button touch-target-large gentle-transition ${
                      isLoading 
                        ? "bg-gray-400 cursor-not-allowed border-gray-400 text-gray-600 loading-state" 
                        : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    }`}
                    aria-label="Prendre un ticket de consultation en mode anonyme"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block mr-3">⏳</span>
                        Création en cours...
                      </>
                    ) : (
                      "Prendre un ticket (mode anonyme)"
                    )}
                  </button>
                  <p className="text-sm text-blue-700 mt-3">
                    Mode rapide sans inscription
                  </p>
                </div>

                {/* Ou se connecter */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-600 font-medium">
                      OU
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                  <h3 className="senior-friendly-text font-bold text-green-900 mb-4">
                    👤 Connexion personnalisée
                  </h3>
                  <p className="text-green-700 text-sm mb-6">
                    Pour un suivi personnalisé et des fonctionnalités avancées
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate("/login")}
                      className="w-full high-contrast-button touch-target-large bg-green-600 hover:bg-green-700 text-white border-green-600 gentle-transition"
                      aria-label="Se connecter avec un compte existant"
                    >
                      🔐 Se connecter
                    </button>
                    <button
                      onClick={() => navigate("/register")}
                      className="w-full high-contrast-button touch-target-large bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 gentle-transition"
                      aria-label="Créer un nouveau compte utilisateur"
                    >
                      ✨ Créer un compte
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Mode connecté - Actions selon le rôle
              <div className="space-y-4">
                {user.role?.name === "patient" && (
                  <div className="bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="senior-friendly-text font-bold text-blue-900 mb-4">
                      🎟️ Prendre un ticket de consultation
                    </h3>
                    <button
                      onClick={handleTakeTicket}
                      disabled={isLoading}
                      className="w-full high-contrast-button touch-target-large bg-blue-600 hover:bg-blue-700 text-white border-blue-600 gentle-transition"
                      aria-label="Prendre un nouveau ticket de consultation"
                    >
                      Prendre un ticket de consultation
                    </button>
                  </div>
                )}
                
                {["medecin", "secretaire"].includes(user.role?.name) && (
                  <div className="bg-gradient-to-b from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                    <h3 className="senior-friendly-text font-bold text-green-900 mb-4">
                      ⚙️ Gestion de la file d'attente
                    </h3>
                    <button
                      onClick={handleTakeTicket}
                      className="w-full high-contrast-button touch-target-large bg-green-600 hover:bg-green-700 text-white border-green-600 gentle-transition"
                      aria-label="Accéder aux outils de gestion de la file d'attente"
                    >
                      Gérer la file d'attente
                    </button>
                  </div>
                )}

                {user.role?.name === "visiteur" && (
                  <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
                    <h3 className="senior-friendly-text font-bold text-yellow-900 mb-4">
                      👁️ Mode visiteur
                    </h3>
                    <p className="text-yellow-700 senior-friendly-text mb-4">
                      Vous pouvez consulter la file d'attente mais pas prendre de tickets
                    </p>
                    <button
                      onClick={() => navigate("/register")}
                      className="w-full high-contrast-button touch-target-large bg-blue-600 hover:bg-blue-700 text-white border-blue-600 gentle-transition"
                      aria-label="Créer un compte patient pour prendre des tickets"
                    >
                      ✨ Devenir patient
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation rapide */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="senior-friendly-text font-bold text-gray-900 mb-6 text-center">
              🧭 Navigation rapide
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => navigate("/queue")}
                className="w-full high-contrast-button touch-target-large bg-gray-600 hover:bg-gray-700 text-white border-gray-600 gentle-transition"
                aria-label="Consulter la file d'attente actuelle"
              >
                📋 Voir la file d'attente
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => navigate("/ticket")}
                  className="w-full high-contrast-button touch-target-large bg-orange-600 hover:bg-orange-700 text-white border-orange-600 gentle-transition"
                  aria-label="Voir mon ticket actuel"
                >
                  🎫 Mon ticket actuel
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => navigate(`/dashboard/${user.role.name}`)}
                  className="w-full high-contrast-button touch-target-large bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 gentle-transition"
                  aria-label="Accéder à mon tableau de bord personnel"
                >
                  📊 Mon tableau de bord
                </button>
              )}
            </div>
          </div>

          {/* Informations système simplifiées */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="senior-friendly-text font-bold text-gray-900 mb-4 text-center">
              ℹ️ Types d'utilisateurs
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">🩺</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Médecins</h4>
                  <p className="text-sm text-gray-600">Gestion complète des consultations</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">👩‍💼</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Secrétaires</h4>
                  <p className="text-sm text-gray-600">Assistance et coordination des rendez-vous</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Patients</h4>
                  <p className="text-sm text-gray-600">Prise de tickets et suivi des consultations</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">👁️</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Visiteurs</h4>
                  <p className="text-sm text-gray-600">Consultation du temps d'attente</p>
                </div>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Conseil :</strong> Créez un compte pour bénéficier de notifications,
                  d'un historique de vos consultations et de fonctionnalités avancées.
                </p>
              </div>
            )}
          </div>

          {/* Modal de confirmation pour ticket anonyme - Amélioré */}
          <ConfirmModal
            isOpen={showTicketModal}
            title="Choisir un médecin"
            message={
              <div className="space-y-6">
                <div className="help-text">
                  <p>Veuillez sélectionner le médecin que vous souhaitez consulter :</p>
                </div>
                <div>
                  <label 
                    htmlFor="doctor-select"
                    className="block senior-friendly-text font-semibold text-gray-800 mb-3"
                  >
                    👨‍⚕️ Médecin disponible :
                  </label>
                  <select
                    id="doctor-select"
                    value={selectedDoctor || ""}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full touch-target-large px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 gentle-transition senior-friendly-text"
                    aria-describedby="doctor-help"
                  >
                    <option value="">Choisissez un médecin</option>
                    {DOCTEURS.map((docteur) => (
                      <option key={docteur} value={docteur}>
                        {docteur}
                      </option>
                    ))}
                  </select>
                  <div id="doctor-help" className="mt-2 text-sm text-gray-600">
                    Cette information est nécessaire pour organiser la file d'attente
                  </div>
                </div>
                <div className="help-text">
                  <p><strong>Recommandation :</strong> Créer un compte vous permet un meilleur suivi.</p>
                </div>
              </div>
            }
            confirmText="✅ Continuer en mode anonyme"
            cancelText="✨ Créer un compte à la place"
            type="info"
            onConfirm={confirmTakeTicket}
            onCancel={() => {
              setShowTicketModal(false);
              navigate("/register");
            }}
          />

          {/* Toasts pour les messages */}
          <Toast toasts={toasts} removeToast={removeToast} />
        </div>
      </AnimatedPage>
    </Layout>
  );
}
