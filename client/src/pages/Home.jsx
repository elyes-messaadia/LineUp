// Force Netlify rebuild with new API URL - 2025-01-27
import { useState, useEffect } from "react";
import { Hospital, Stethoscope, UsersRound, Eye as EyeIcon, Ticket as TicketIcon, User as UserIcon, Info, Sparkles, Mail, BarChart3, CheckCircle2, AlertTriangle, Clock, ChevronRight, XCircle, RefreshCcw, UserPlus, Lock, ClipboardList, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ResponsiveContainer from "../components/ui/ResponsiveContainer";
import ResponsiveText from "../components/ui/ResponsiveText";
import QuickDoctorAccess from "../components/QuickDoctorAccess";
import { useToast } from "../hooks/useToast";
import { getDisplayName } from "../utils/userUtils";
import BACKEND_URL from "../config/api";
import { DOCTEURS } from "../config/doctors";

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
      showError("Veuillez sélectionner un médecin");
      return;
    }

    const selectedDoctorInfo = DOCTEURS.find(d => d.value === selectedDoctor);
    if (!selectedDoctorInfo.disponible) {
      showError("Ce médecin n'est pas disponible aujourd'hui");
      return;
    }

    setShowTicketModal(false);
    setIsLoading(true);

    try {
      showInfo(`Création de votre ticket pour ${selectedDoctorInfo.label}...`);
      
      console.log('🎯 Using API URL:', BACKEND_URL);
      
      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docteur: selectedDoctor })
      });

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.message || `Erreur ${res.status}`);
        error.type = data.limitation || 'generic';
        error.status = res.status;
        throw error;
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
      
      showSuccess(`Ticket n°${data.ticket.number} créé pour ${selectedDoctorInfo.label} !`, 4000);
      
      // Redirection après un court délai
      setTimeout(() => {
        navigate("/queue");
      }, 1500);

    } catch (error) {
      console.error("Erreur création ticket:", error);
      setShowTicketModal(true); // Réafficher le modal en cas d'erreur
      
      if (error.status === 429) {
        if (error.type === 'ip_limit') {
          showError("⚠️ Limite atteinte : maximum 1 ticket actif par appareil", 5000);
        } else if (error.type === 'time_limit') {
          showError("⚠️ Limite atteinte : maximum 3 tickets par heure par appareil", 5000);
        } else {
          showError("Trop de demandes. Veuillez attendre quelques instants.", 5000);
        }
      } else if (error.status === 400 && error.type === 'doctor_limit') {
        showError("⚠️ Vous avez déjà un ticket actif chez ce médecin depuis cet appareil", 5000);
      } else {
        showError(error.message || "Impossible de créer le ticket. Veuillez réessayer.", 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

      return (
    <AnimatedPage>
      <ResponsiveContainer>
        {/* Hero Section */}
        <div className="text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg border border-white/50 w-full max-w-sm mx-auto md:max-w-none md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Hospital className="text-white w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div className="text-left min-w-0">
              <ResponsiveText 
                as="h1" 
                variant="h1" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate"
              >
                LineUp
              </ResponsiveText>
              <ResponsiveText variant="subtitle" className="truncate">
                Gestion de file d'attente médicale
              </ResponsiveText>
            </div>
          </div>
          
          <div className="space-y-3 md:space-y-4">
            <ResponsiveText as="h2" variant="h2" className="text-gray-900 px-2">
              Bienvenue sur votre plateforme de gestion
            </ResponsiveText>
            <ResponsiveText variant="body-large" className="text-gray-600 max-w-2xl mx-auto px-4">
              Prenez un ticket, suivez votre position en temps réel et gérez vos consultations en toute simplicité
            </ResponsiveText>
          </div>
        </div>

        {/* Section utilisateur connecté */}
        {isAuthenticated && user && (
          <Card variant="info" className="text-center">
            <Card.Content>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
                  {user.role?.name === "medecin" && <Stethoscope className="w-6 h-6" />}
                  {user.role?.name === "secretaire" && <UsersRound className="w-6 h-6" />}
                  {user.role?.name === "patient" && <UserIcon className="w-6 h-6" />}
                  {user.role?.name === "visiteur" && <EyeIcon className="w-6 h-6" />}
                </div>
                <div className="text-center sm:text-left min-w-0">
                  <h3 className="text-lg font-bold text-blue-900 truncate">
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
                icon={<BarChart3 className="w-4 h-4" />}
                size="lg"
                className="w-full"
              >
                Accéder à mon espace
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Accès rapide médecins */}
        {!isAuthenticated && (
                            <QuickDoctorAccess mode="direct" />
        )}

        {/* Actions principales */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
          {!isAuthenticated ? (
            <>
              {/* Action principale : Prendre un ticket */}
              <Card variant="info" hover gradient>
                <Card.Content className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                    <TicketIcon className="w-8 h-8" />
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
                    icon={<TicketIcon className="w-4 h-4" />}
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
                    <UserIcon className="w-8 h-8" />
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
                      icon={<Lock className="w-4 h-4" />}
                      fullWidth
                    >
                      Se connecter
                    </Button>
                    <Button 
                      onClick={() => navigate("/register")}
                      variant="outline"
                      icon={<Sparkles className="w-4 h-4" />}
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
                      <TicketIcon className="inline w-5 h-5 mr-2" /> Prendre un ticket de consultation
                    </h3>
                    <Button 
                      onClick={handleTakeTicket}
                       icon={<TicketIcon className="w-4 h-4" />}
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
                      <Settings className="inline w-5 h-5 mr-2" /> Gestion de la file d'attente
                    </h3>
                    <Button 
                      onClick={handleTakeTicket}
                      variant="success"
                      icon={<Settings className="w-4 h-4" />}
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
                      <EyeIcon className="inline w-5 h-5 mr-2" /> Mode visiteur
                    </h3>
                    <p className="text-yellow-700 mb-6">
                      Vous pouvez consulter la file d'attente mais pas prendre de tickets
                    </p>
                      <Button 
                      onClick={() => navigate("/register")}
                      variant="primary"
                      icon={<Sparkles className="w-4 h-4" />}
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
              Navigation rapide
            </h3>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button 
                onClick={() => navigate("/queue")}
                variant="secondary"
                icon={<ClipboardList className="w-4 h-4" />}
                fullWidth
              >
                Voir la file d'attente
              </Button>

              {!isAuthenticated && (
                <Button 
                  onClick={() => navigate("/ticket")}
                  variant="warning"
                  icon={<TicketIcon className="w-4 h-4" />}
                  fullWidth
                >
                  Mon ticket actuel
                </Button>
              )}

              {isAuthenticated && (
                <Button 
                  onClick={() => navigate(`/dashboard/${user.role.name}`)}
                  variant="primary"
                  icon={<BarChart3 className="w-4 h-4" />}
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
              Types d'utilisateurs
            </h3>
          </Card.Header>
          <Card.Content>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Stethoscope className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">Médecins</h4>
                  <p className="text-sm text-gray-600">Gestion consultations</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <UsersRound className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-gray-800">Secrétaires</h4>
                  <p className="text-sm text-gray-600">Coordination</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <UserIcon className="w-6 h-6 text-gray-700" />
                <div>
                  <h4 className="font-semibold text-gray-800">Patients</h4>
                  <p className="text-sm text-gray-600">Prise de tickets</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <EyeIcon className="w-6 h-6 text-yellow-700" />
                <div>
                  <h4 className="font-semibold text-gray-800">Visiteurs</h4>
                  <p className="text-sm text-gray-600">Consultation attente</p>
                </div>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Conseil :</strong> Créez un compte pour bénéficier de notifications,
                  d'un historique de vos consultations et de fonctionnalités avancées.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Modal amélioré de sélection de médecin pour mode anonyme */}
        {showTicketModal && (
          <div className="modal-overlay-fullscreen animate-overlay">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in relative">
              {/* Bouton de fermeture */}
              <button
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedDoctor(null);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 z-10"
                aria-label="Fermer la modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                  <span className="text-3xl">👩‍⚕️</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-800">
                      Choisir un médecin
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sélection rapide pour votre ticket
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm">
                  Sélectionnez le médecin que vous souhaitez consulter :
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {DOCTEURS.map((docteur) => (
                  <label 
                    key={docteur.value}
                    className={`
                      flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02]
                      ${selectedDoctor === docteur.value 
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                      ${!docteur.disponible ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="doctor"
                      value={docteur.value}
                      checked={selectedDoctor === docteur.value}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      disabled={!docteur.disponible}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-4 w-full">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{docteur.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{docteur.label}</p>
                        <p className="text-sm text-gray-600 mb-1">{docteur.specialite}</p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${docteur.disponible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <p className={`text-xs font-medium ${docteur.disponible ? 'text-green-600' : 'text-red-600'}`}>
                            {docteur.disponible ? 'Disponible aujourd\'hui' : 'Non disponible'}
                          </p>
                        </div>
                      </div>
                      {selectedDoctor === docteur.value && (
                        <div className="flex-shrink-0 text-blue-500 bg-blue-100 rounded-full p-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-2 justify-center">
                  <Info className="text-blue-500 w-5 h-5" />
                  <p className="text-sm text-blue-800 font-medium">
                    <strong>Recommandation :</strong> Créer un compte vous permet un meilleur suivi et l'accès aux notifications.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowTicketModal(false);
                    setSelectedDoctor(null);
                    navigate("/register");
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Créer un compte</span>
                </button>
                <button
                  onClick={confirmTakeTicket}
                  disabled={!selectedDoctor || isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Continuer anonyme</span>
                      </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toasts pour les messages */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </ResponsiveContainer>
    </AnimatedPage>
  );
}
