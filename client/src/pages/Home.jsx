// Force Netlify rebuild with new API URL - 2025-01-27
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useToast } from "../hooks/useToast";
import { getDisplayName } from "../utils/userUtils";
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
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🏥</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LineUp
              </h1>
              <p className="text-gray-600">Gestion de file d'attente médicale</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Bienvenue sur votre plateforme de gestion
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Prenez un ticket, suivez votre position en temps réel et gérez vos consultations en toute simplicité
            </p>
          </div>
        </div>

        {/* Section utilisateur connecté */}
        {isAuthenticated && user && (
          <Card variant="info" className="text-center">
            <Card.Content>
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl">
                  {user.role?.name === "medecin" && "🩺"}
                  {user.role?.name === "secretaire" && "👩‍💼"}
                  {user.role?.name === "patient" && "👤"}
                  {user.role?.name === "visiteur" && "👁️"}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-blue-900">
                    Bonjour {getDisplayName(user)}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {user.role?.name === "medecin" ? "Médecin" :
                     user.role?.name === "secretaire" ? "Secrétaire" :
                     user.role?.name === "patient" ? "Patient" :
                     user.role?.name === "visiteur" ? "Visiteur" : "Utilisateur"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate(`/dashboard/${user.role.name}`)}
                icon="📊"
                size="lg"
                className="w-full sm:w-auto"
              >
                Accéder à mon espace
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Actions principales */}
        <div className="grid gap-6 md:grid-cols-2">
          {!isAuthenticated ? (
            <>
              {/* Action principale : Prendre un ticket */}
              <Card variant="info" hover gradient>
                <Card.Content className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                    🎟️
                  </div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">
                    Prendre un ticket rapidement
                  </h3>
                  <p className="text-blue-700 mb-6 text-sm">
                    Mode rapide sans inscription
                  </p>
                  <Button 
                    onClick={handleTakeTicket}
                    loading={isLoading}
                    icon="🎫"
                    size="lg"
                    fullWidth
                  >
                    {isLoading ? "Création en cours..." : "Prendre un ticket"}
                  </Button>
                </Card.Content>
              </Card>

              {/* Connexion personnalisée */}
              <Card variant="success" hover gradient>
                <Card.Content className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                    👤
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-3">
                    Connexion personnalisée
                  </h3>
                  <p className="text-green-700 mb-6 text-sm">
                    Pour un suivi personnalisé et des fonctionnalités avancées
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => navigate("/login")}
                      variant="success"
                      icon="🔐"
                      fullWidth
                    >
                      Se connecter
                    </Button>
                    <Button 
                      onClick={() => navigate("/register")}
                      variant="outline"
                      icon="✨"
                      fullWidth
                    >
                      Créer un compte
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </>
          ) : (
            // Mode connecté - Actions selon le rôle
            <div className="md:col-span-2">
              {user.role?.name === "patient" && (
                <Card variant="info" hover>
                  <Card.Content className="text-center">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">
                      🎟️ Prendre un ticket de consultation
                    </h3>
                    <Button 
                      onClick={handleTakeTicket}
                      icon="🎫"
                      size="lg"
                      fullWidth
                    >
                      Prendre un ticket de consultation
                    </Button>
                  </Card.Content>
                </Card>
              )}
              
              {["medecin", "secretaire"].includes(user.role?.name) && (
                <Card variant="success" hover>
                  <Card.Content className="text-center">
                    <h3 className="text-xl font-bold text-green-900 mb-4">
                      ⚙️ Gestion de la file d'attente
                    </h3>
                    <Button 
                      onClick={handleTakeTicket}
                      variant="success"
                      icon="⚙️"
                      size="lg"
                      fullWidth
                    >
                      Gérer la file d'attente
                    </Button>
                  </Card.Content>
                </Card>
              )}

              {user.role?.name === "visiteur" && (
                <Card variant="warning" hover>
                  <Card.Content className="text-center">
                    <h3 className="text-xl font-bold text-yellow-900 mb-4">
                      👁️ Mode visiteur
                    </h3>
                    <p className="text-yellow-700 mb-6">
                      Vous pouvez consulter la file d'attente mais pas prendre de tickets
                    </p>
                    <Button 
                      onClick={() => navigate("/register")}
                      variant="primary"
                      icon="✨"
                      size="lg"
                      fullWidth
                    >
                      Devenir patient
                    </Button>
                  </Card.Content>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Navigation rapide */}
        <Card>
          <Card.Header>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              🧭 Navigation rapide
            </h3>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button 
                onClick={() => navigate("/queue")}
                variant="secondary"
                icon="📋"
                fullWidth
              >
                Voir la file d'attente
              </Button>

              {!isAuthenticated && (
                <Button 
                  onClick={() => navigate("/ticket")}
                  variant="warning"
                  icon="🎫"
                  fullWidth
                >
                  Mon ticket actuel
                </Button>
              )}

              {isAuthenticated && (
                <Button 
                  onClick={() => navigate(`/dashboard/${user.role.name}`)}
                  variant="primary"
                  icon="📊"
                  fullWidth
                >
                  Mon tableau de bord
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Types d'utilisateurs */}
        <Card>
          <Card.Header>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              ℹ️ Types d'utilisateurs
            </h3>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">🩺</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Médecins</h4>
                  <p className="text-sm text-gray-600">Gestion consultations</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">👩‍💼</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Secrétaires</h4>
                  <p className="text-sm text-gray-600">Coordination</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Patients</h4>
                  <p className="text-sm text-gray-600">Prise de tickets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">👁️</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Visiteurs</h4>
                  <p className="text-sm text-gray-600">Consultation attente</p>
                </div>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Conseil :</strong> Créez un compte pour bénéficier de notifications,
                  d'un historique de vos consultations et de fonctionnalités avancées.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Modal de confirmation pour ticket anonyme */}
        <ConfirmModal
          isOpen={showTicketModal}
          title="Choisir un médecin"
          message={
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">Veuillez sélectionner le médecin que vous souhaitez consulter :</p>
                <select
                  value={selectedDoctor || ""}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 xs:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 legacy-button"
                >
                  <option value="">Choisissez un médecin</option>
                  {DOCTEURS.map((docteur) => (
                    <option key={docteur} value={docteur}>
                      {docteur}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Recommandation :</strong> Créer un compte vous permet un meilleur suivi.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowTicketModal(false);
                    navigate("/register");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 xs:px-4 py-2 xs:py-3 rounded-lg transition legacy-button text-sm xs:text-base"
                >
                  ✨ Créer un compte
                </button>
              </div>
            </div>
          }
          confirmText="✅ Continuer en mode anonyme"
          cancelText="❌ Annuler"
          type="info"
          onConfirm={confirmTakeTicket}
          onCancel={() => {
            setShowTicketModal(false);
            setSelectedDoctor(null);
          }}
        />

        {/* Toasts pour les messages */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </AnimatedPage>
  );
}
