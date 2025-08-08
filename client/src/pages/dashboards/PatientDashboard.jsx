import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import DashboardHeader from "../../components/DashboardHeader";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";
import { DOCTEURS, getDoctorDisplayName } from "../../config/doctors";
import { getDisplayName } from "../../utils/userUtils";
import NotificationSettings from "../../components/NotificationSettings";
import PushTestPanel from "../../components/PushTestPanel";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [myTicket, setMyTicket] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Surveillance de la connectivité
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo("Connexion rétablie", 2000);
      loadMyTicket();
      loadQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("Connexion perdue - Données en local", 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showInfo, showWarning]);

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
        setLastUpdate(new Date());
        calculateStats(data);
      }
    } catch (error) {
      if (isOnline) {
        console.error("Erreur chargement queue:", error);
      }
    }
  }, [isOnline]);

  const calculateStats = (queueData) => {
    const waiting = queueData.filter(t => t.status === "en_attente");
    const inConsultation = queueData.filter(t => t.status === "en_consultation");
    
    // Statistiques par médecin
    const doctorStats = {};
    DOCTEURS.forEach(doctor => {
      const doctorQueue = queueData.filter(t => t.docteur === doctor.value);
      const doctorWaiting = doctorQueue.filter(t => t.status === "en_attente");
      doctorStats[doctor.value] = {
        waiting: doctorWaiting.length,
        inConsultation: doctorQueue.filter(t => t.status === "en_consultation").length,
        estimatedWait: doctorWaiting.length * 15
      };
    });

    setStats({
      totalWaiting: waiting.length,
      totalInConsultation: inConsultation.length,
      doctorStats
    });
  };

  const loadMyTicket = useCallback(async () => {
    try {
      // D'abord, essayer de récupérer le ticket depuis le serveur (pour les patients connectés)
      const token = localStorage.getItem("token");
      if (token) {
        console.log(`🎫 Chargement ticket pour patient authentifié...`);
        const res = await fetch(`${BACKEND_URL}/patient/my-ticket`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ Ticket trouvé: n°${data.ticket.number} - statut: ${data.ticket.status}`);
          setMyTicket(data.ticket);
          localStorage.setItem("lineup_ticket", JSON.stringify(data.ticket));
          return;
        } else if (res.status === 404) {
          console.log(`ℹ️ Aucun ticket actif côté serveur - nettoyage localStorage`);
          // Aucun ticket actif côté serveur, nettoyer localStorage
          localStorage.removeItem("lineup_ticket");
          setMyTicket(null);
          return;
        } else if (res.status === 401) {
          console.log(`⚠️ Token expiré - redirection vers login`);
          showWarning("Session expirée", 3000);
          handleLogout();
          return;
        } else {
          console.error(`❌ Erreur serveur ${res.status} lors du chargement du ticket`);
        }
      }
      
      // Fallback : chercher dans localStorage pour les tickets anonymes
      const stored = localStorage.getItem("lineup_ticket");
      if (stored) {
        try {
          const parsedTicket = JSON.parse(stored);
          console.log(`🔍 Ticket localStorage trouvé: n°${parsedTicket.number} - statut: ${parsedTicket.status}`);
          
          // Vérifier que le ticket dans localStorage est encore valide
          if (parsedTicket.status === 'en_attente' || parsedTicket.status === 'en_consultation') {
            // Pour les tickets anonymes, vérifier s'ils existent encore côté serveur
            if (!token && parsedTicket.sessionId) {
              try {
                const verifyRes = await fetch(`${BACKEND_URL}/queue`);
                if (verifyRes.ok) {
                  const queue = await verifyRes.json();
                  const ticketExists = queue.find(t => t._id === parsedTicket._id && t.sessionId === parsedTicket.sessionId);
                  if (!ticketExists) {
                    console.log(`⚠️ Ticket localStorage obsolète - suppression`);
                    localStorage.removeItem("lineup_ticket");
                    setMyTicket(null);
                    return;
                  }
                }
              } catch (error) {
                console.log(`⚠️ Impossible de vérifier le ticket - utilisation données localStorage`);
              }
            }
            setMyTicket(parsedTicket);
          } else {
            console.log(`🗑️ Ticket localStorage terminé/annulé - suppression`);
            // Ticket terminé/annulé, le supprimer
            localStorage.removeItem("lineup_ticket");
            setMyTicket(null);
          }
        } catch (error) {
          console.error(`❌ Erreur parsing ticket localStorage:`, error);
          localStorage.removeItem("lineup_ticket");
          setMyTicket(null);
        }
      } else {
        console.log(`ℹ️ Aucun ticket trouvé`);
        setMyTicket(null);
      }
    } catch (error) {
      console.error("Erreur chargement ticket:", error);
      // En cas d'erreur réseau, ne pas utiliser localStorage pour éviter d'afficher de vieux tickets
      if (isOnline) {
        setMyTicket(null);
      }
    }
  }, [isOnline, showWarning]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!userData || !isAuthenticated) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.name !== "patient") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadMyTicket();
    loadQueue();

    // Actualiser régulièrement
    const interval = setInterval(() => {
      if (isOnline) {
        loadMyTicket();
        loadQueue();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate, loadMyTicket, loadQueue, isOnline]);

  const getWelcomeMessage = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "🌅 Bonjour";
    if (hour < 18) return "☀️ Bon après-midi";
    return "🌙 Bonsoir";
  };

  const getMyPosition = () => {
    if (!myTicket || !queue.length) return null;
    
    // Vérifier si mon ticket existe encore dans la file
    const myTicketInQueue = queue.find(t => t._id === myTicket._id);
    if (!myTicketInQueue) {
      // Mon ticket n'existe plus dans la file - probablement terminé ou annulé
      console.log(`⚠️ Ticket n°${myTicket.number} non trouvé dans la file - nettoyage`);
      localStorage.removeItem("lineup_ticket");
      setMyTicket(null);
      showInfo("Votre ticket a été mis à jour", 2000);
      return null;
    }
    
    // Vérifier si le statut a changé
    if (myTicketInQueue.status !== myTicket.status) {
      console.log(`🔄 Statut ticket mis à jour: ${myTicket.status} → ${myTicketInQueue.status}`);
      const updatedTicket = { ...myTicket, status: myTicketInQueue.status };
      setMyTicket(updatedTicket);
      localStorage.setItem("lineup_ticket", JSON.stringify(updatedTicket));
      
      if (myTicketInQueue.status === "en_consultation") {
        showSuccess("C'est votre tour ! Présentez-vous au cabinet 🩺", 5000);
      } else if (myTicketInQueue.status === "termine") {
        showInfo("Votre consultation est terminée", 3000);
        setTimeout(() => {
          localStorage.removeItem("lineup_ticket");
          setMyTicket(null);
        }, 3000);
        return null;
      } else if (myTicketInQueue.status === "desiste") {
        showInfo("Votre ticket a été annulé", 3000);
        localStorage.removeItem("lineup_ticket");
        setMyTicket(null);
        return null;
      }
    }
    
    const waitingTickets = queue
      .filter(t => t.status === "en_attente" && t.docteur === myTicket.docteur)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const position = waitingTickets.findIndex(t => t._id === myTicket._id) + 1;
    return position > 0 ? position : null;
  };

  const getEstimatedWaitTime = () => {
    const position = getMyPosition();
    if (!position) return null;
    
    const estimatedMinutes = position * 15;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  const getWaitingTime = () => {
    if (!myTicket) return null;
    return Math.round((new Date() - new Date(myTicket.createdAt)) / (1000 * 60));
  };

  const handleTakeTicket = () => {
    if (myTicket) {
      showWarning("Vous avez déjà un ticket en cours !");
      return;
    }
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
      
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
      }
      
      const res = await fetch(`${BACKEND_URL}/ticket`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: user._id,
          docteur: selectedDoctor
        })
      });

      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore si on ne peut pas parser la réponse
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      // Vérifier la structure de la réponse et normaliser
      const ticketData = data.ticket || data; // Compatibilité avec les deux formats
      
      localStorage.setItem("lineup_ticket", JSON.stringify(ticketData));
      setMyTicket(ticketData);
      
      showSuccess(`Ticket n°${ticketData.number} créé pour ${selectedDoctorInfo.label} ! 🎉`, 4000);
      setSelectedDoctor(""); // Réinitialiser la sélection
      loadQueue();

    } catch (error) {
      console.error("Erreur création ticket:", error);
      
      if (error.message.includes("401") || error.message.includes("Token")) {
        showError("Session expirée. Veuillez vous reconnecter.", 5000);
        handleLogout();
      } else if (error.message.includes("400")) {
        if (error.message.includes("déjà un ticket")) {
          showWarning("Vous avez déjà un ticket en cours ! Chargement...", 3000);
          setTimeout(() => {
            loadMyTicket();
            loadQueue();
          }, 1000);
        } else {
          showError("Données invalides. Vérifiez votre profil.", 5000);
        }
      } else if (error.message.includes("429")) {
        showWarning("Trop de demandes. Veuillez attendre quelques instants.", 3000);
      } else {
        showError(error.message || "Impossible de créer le ticket", 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTicket = () => {
    if (!myTicket) {
      showWarning("Aucun ticket à annuler");
      return;
    }
    setShowCancelModal(true);
  };

  const confirmCancelTicket = async () => {
    if (!myTicket) return;

    setShowCancelModal(false);
    setIsLoading(true);

    try {
      showInfo("Annulation de votre ticket...");

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json"
      };

      // Ajouter le token seulement s'il existe
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let url = `${BACKEND_URL}/ticket/${myTicket._id}`;
      
      // Si c'est un ticket anonyme, ajouter sessionId
      if (!token && myTicket.sessionId) {
        url += `?sessionId=${myTicket.sessionId}`;
      }

      console.log(`🗑️ Annulation ticket n°${myTicket.number} - URL: ${url}`);

      const res = await fetch(url, {
        method: "DELETE",
        headers
      });

      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore si on ne peut pas parser la réponse
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      localStorage.removeItem("lineup_ticket");
      setMyTicket(null);
      showSuccess("Ticket annulé avec succès ! 👋", 4000);
      
      // Forcer le rechargement des données
      setTimeout(() => {
        loadMyTicket();
        loadQueue();
      }, 500);

    } catch (error) {
      console.error("Erreur annulation ticket:", error);
      
      if (error.message.includes("403")) {
        showError("Vous ne pouvez annuler que vos propres tickets", 5000);
      } else if (error.message.includes("404")) {
        showWarning("Ce ticket a déjà été supprimé", 3000);
        // Nettoyer les données locales
        localStorage.removeItem("lineup_ticket");
        setMyTicket(null);
        loadQueue();
      } else if (error.message.includes("401")) {
        showError("Session expirée. Veuillez vous reconnecter.", 5000);
        handleLogout();
      } else {
        showError(error.message || "Impossible d'annuler le ticket", 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("lineup_ticket");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="loading-container">
            <div className="loading-content">
              <div className="loading-spinner animate-float">🧑‍⚕️</div>
              <p className="loading-text">Chargement de votre espace patient...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  const myPosition = getMyPosition();
  const estimatedWaitTime = getEstimatedWaitTime();
  const waitingTime = getWaitingTime();

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-wrapper">
          <div className="dashboard-container">
            
            {/* Header du dashboard patient */}
            <div className="dashboard-header">
              <div className="dashboard-header-content">
                <div>
                  <h1 className="dashboard-title">
                    🧑‍⚕️ Espace Patient
                  </h1>
                  <p className="dashboard-subtitle">
                    {getWelcomeMessage()}, {getDisplayName(user)} ! ✨ Gérez vos consultations médicales
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      🕐 {currentTime.toLocaleTimeString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2">
                      {myTicket ? 
                        `🎫 Ticket n°${myTicket.number}` : 
                        "✅ Aucun ticket actif"
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      {isOnline ? "🟢 En ligne" : "🔴 Hors ligne"}
                    </div>
                    <div className="text-xs">
                      ↻ Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="dashboard-actions">
                  <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                  >
                    🏠 Accueil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn-danger"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              </div>
            </div>

            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Mon ticket actuel */}
            {myTicket ? (
              <div className="dashboard-card dashboard-section">
                <h2 className="dashboard-card-title">
                  🎫 Mon ticket de consultation
                  {myTicket.status === "en_consultation" && (
                    <span className="animate-pulse ml-2">🩺</span>
                  )}
                </h2>
                
                <div className={`rounded-lg p-6 border-l-4 ${
                  myTicket.status === "en_consultation" 
                    ? "bg-gradient-to-r from-green-50 to-green-100 border-green-500"
                    : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500"
                }`}>
                  <div className="dashboard-grid mb-6">
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        myTicket.status === "en_consultation" ? "text-green-600" : "text-blue-600"
                      }`}>Numéro de ticket</p>
                      <p className={`text-3xl font-bold ${
                        myTicket.status === "en_consultation" ? "text-green-800" : "text-blue-800"
                      }`}>
                        🎫 #{myTicket.number}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        myTicket.status === "en_consultation" ? "text-green-600" : "text-blue-600"
                      }`}>Médecin</p>
                      <p className={`text-xl font-bold ${
                        myTicket.status === "en_consultation" ? "text-green-800" : "text-blue-800"
                      }`}>
                        👨‍⚕️ {getDoctorDisplayName(myTicket.docteur)}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        myTicket.status === "en_consultation" ? "text-green-600" : "text-blue-600"
                      }`}>Statut</p>
                      <p className={`text-xl font-bold ${
                        myTicket.status === "en_consultation" ? "text-green-800" : "text-blue-800"
                      }`}>
                        {myTicket.status === "en_consultation" ? "🩺 En consultation" : "⏳ En attente"}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-sm font-medium ${
                        myTicket.status === "en_consultation" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {myTicket.status === "en_consultation" ? "Durée" : "Position"}
                      </p>
                      <p className={`text-xl font-bold ${
                        myTicket.status === "en_consultation" ? "text-green-800" : "text-blue-800"
                      }`}>
                        {myTicket.status === "en_consultation" 
                          ? `⏱️ ${waitingTime}min`
                          : myPosition ? `📍 #${myPosition}` : "🔄 Calcul..."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`text-center p-3 rounded-lg ${
                      myTicket.status === "en_consultation" 
                        ? "bg-green-100 border border-green-200"
                        : "bg-blue-100 border border-blue-200"
                    }`}>
                      <div className="text-sm text-gray-600">Heure d'arrivée</div>
                      <div className="font-bold">
                        🕐 {new Date(myTicket.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className={`text-center p-3 rounded-lg ${
                      myTicket.status === "en_consultation" 
                        ? "bg-green-100 border border-green-200"
                        : "bg-blue-100 border border-blue-200"
                    }`}>
                      <div className="text-sm text-gray-600">Temps d'attente</div>
                      <div className="font-bold">⏱️ {waitingTime}min</div>
                    </div>
                    
                    {myTicket.status === "en_attente" && estimatedWaitTime && (
                      <div className="text-center p-3 rounded-lg bg-blue-100 border border-blue-200">
                        <div className="text-sm text-gray-600">Temps estimé</div>
                        <div className="font-bold">⏳ {estimatedWaitTime}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center">
                    {myTicket.status === "en_attente" && (
                      <button
                        onClick={handleCancelTicket}
                        disabled={isLoading || !isOnline}
                        className="btn-danger btn-large"
                      >
                        {isLoading ? "🔄 Annulation..." : "❌ Annuler mon ticket"}
                      </button>
                    )}
                    
                    {myTicket.status === "en_consultation" && (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-800 mb-2">
                          🩺 Vous êtes en consultation !
                        </div>
                        <div className="text-sm text-green-600">
                          Veuillez vous rendre dans le cabinet médical
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Créer un nouveau ticket */
              <div className="dashboard-card dashboard-section">
                <h2 className="dashboard-card-title">
                  🎫 Prendre un ticket de consultation
                </h2>
                
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-500 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">🏥</div>
                    <h3 className="text-xl font-bold text-emerald-800 mb-2">
                      Aucun ticket actif
                    </h3>
                    <p className="text-emerald-600">
                      Prenez un ticket pour consulter l'un de nos médecins
                    </p>
                  </div>
                  
                  <button
                    onClick={handleTakeTicket}
                    disabled={isLoading || !isOnline}
                    className="btn-success btn-full btn-large"
                  >
                    {isLoading ? "🔄 Création..." : "🎫 Prendre un ticket"}
                  </button>
                </div>
              </div>
            )}

            {/* Situation générale */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                📊 Situation des consultations
                <span className="animate-pulse ml-2">🔴</span>
              </h2>
              
              <div className="dashboard-grid-3">
                {DOCTEURS.filter(d => d.disponible).map(doctor => {
                  const doctorStats = stats.doctorStats?.[doctor.value] || {};
                  const isMyDoctor = myTicket?.docteur === doctor.value;
                  
                  return (
                    <div 
                      key={doctor.value} 
                      className={`doctor-status-card ${isMyDoctor ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-7">
                          <h4 className="doctor-status-title mb-2">
                            {getDoctorDisplayName(doctor.value)}
                            {isMyDoctor && <span className="ml-2">👤</span>}
                          </h4>
                          
                          <div className="mt-2">
                            {doctorStats.inConsultation > 0 ? (
                              <div className="status-card status-card-consultation">
                                <div className="status-text">🩺 En consultation</div>
                              </div>
                            ) : (
                              <div className="status-card status-card-available">
                                <div className="status-text">✅ Disponible</div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="col-span-5">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="doctor-waiting-count text-center">
                              <div className="doctor-waiting-number text-lg">{doctorStats.waiting || 0}</div>
                              <div className="doctor-waiting-label text-xs">👥 en attente</div>
                            </div>
                            <div className="doctor-waiting-count text-center">
                              <div className="doctor-waiting-number text-lg">{doctorStats.estimatedWait || 0}min</div>
                              <div className="doctor-waiting-label text-xs">⏱️ temps estimé</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                ⚡ Actions rapides
              </h2>
              
              <div className="dashboard-grid-3">
                <button
                  onClick={() => {
                    loadMyTicket();
                    loadQueue();
                  }}
                  disabled={isLoading || !isOnline}
                  className="btn-primary btn-large"
                >
                  {isLoading ? "🔄 Actualisation..." : "🔄 Actualiser"}
                </button>
                
                {!myTicket && (
                  <button
                    onClick={handleTakeTicket}
                    disabled={isLoading || !isOnline}
                    className="btn-success btn-large"
                  >
                    🎫 Prendre un ticket
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/queue')}
                  className="btn-secondary btn-large"
                >
                  📋 Voir la file complète
                </button>
              </div>

              {/* Diagnostic - Mode développement ou en cas de problème */}
              {(myTicket && process.env.NODE_ENV === 'development') && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">🔧 Diagnostic Ticket</h4>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p><strong>ID:</strong> {myTicket._id}</p>
                    <p><strong>Numéro:</strong> {myTicket.number}</p>
                    <p><strong>Statut:</strong> {myTicket.status}</p>
                    <p><strong>Docteur:</strong> {myTicket.docteur}</p>
                    <p><strong>SessionId:</strong> {myTicket.sessionId || 'N/A'}</p>
                    <p><strong>Dans la file:</strong> {queue.find(t => t._id === myTicket._id) ? '✅ Oui' : '❌ Non'}</p>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🎫 Ticket actuel:', myTicket);
                      console.log('📋 File actuelle:', queue);
                      const ticketInQueue = queue.find(t => t._id === myTicket._id);
                      console.log('🔍 Ticket dans la file:', ticketInQueue);
                    }}
                    className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                  >
                    📊 Log Debug Console
                  </button>
                </div>
              )}
            </div>

            {/* Informations utiles */}
            <div className="dashboard-card dashboard-section">
              <h2 className="dashboard-card-title">
                💡 Informations utiles
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">🎫</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Votre ticket</h4>
                      <p className="text-sm text-blue-600">
                        Un seul ticket actif par patient. Vous serez appelé(e) selon l'ordre d'arrivée.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">⏱️</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Temps d'attente</h4>
                      <p className="text-sm text-blue-600">
                        Les temps sont estimatifs et peuvent varier selon la complexité des consultations.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">🔄</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Actualisation</h4>
                      <p className="text-sm text-blue-600">
                        Votre position se met à jour automatiquement toutes les 3 secondes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">❌</div>
                    <div>
                      <h4 className="font-medium text-blue-800">Annulation</h4>
                      <p className="text-sm text-blue-600">
                        Vous pouvez annuler votre ticket à tout moment avant d'être appelé(e).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut de connexion */}
            {!isOnline && (
              <div className="dashboard-card dashboard-section">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800">Mode hors ligne</h4>
                      <p className="text-sm text-yellow-600">
                        Vous visualisez les dernières données disponibles. Votre ticket reste valide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modales */}
            <ConfirmModal
              isOpen={showTicketModal}
              title="🎫 Prendre un ticket de consultation"
              message={
                <div className="space-y-6">
                  <div className="modal-content-horizontal">
                    <div className="modal-icon">🎫</div>
                    <div className="modal-text">
                      <p className="modal-title-text">
                        Sélectionnez le médecin que vous souhaitez consulter :
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {DOCTEURS.filter(d => d.disponible).map(doctor => {
                      const doctorStats = stats.doctorStats?.[doctor.value] || {};
                      return (
                        <label key={doctor.value} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="doctor"
                            value={doctor.value}
                            checked={selectedDoctor === doctor.value}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{doctor.label}</div>
                            <div className="text-sm text-gray-600">
                              👥 {doctorStats.waiting || 0} en attente • ⏱️ ~{doctorStats.estimatedWait || 0}min
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              }
              onConfirm={confirmTakeTicket}
              onCancel={() => {
                setShowTicketModal(false);
                setSelectedDoctor("");
              }}
              confirmText="🎫 Créer mon ticket"
              cancelText="❌ Annuler"
              isLoading={isLoading}
            />

            <ConfirmModal
              isOpen={showCancelModal}
              title="❌ Annuler votre ticket"
              message={
                <div className="modal-content-horizontal">
                  <div className="modal-icon">⚠️</div>
                  <div className="modal-text">
                    <p className="modal-title-text">
                      Voulez-vous vraiment annuler votre ticket n°{myTicket?.number} ?
                    </p>
                    <p className="modal-subtitle-text">
                      🚨 Cette action est irréversible. Vous devrez reprendre un nouveau ticket pour consulter.
                    </p>
                  </div>
                </div>
              }
              onConfirm={confirmCancelTicket}
              onCancel={() => setShowCancelModal(false)}
              confirmText="❌ Confirmer l'annulation"
              cancelText="🔙 Garder mon ticket"
              isLoading={isLoading}
            />
          </div>
        </div>
      </AnimatedPage>
    </Layout>
  );
} 