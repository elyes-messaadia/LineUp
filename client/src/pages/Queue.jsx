import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Constantes
const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000;
const DOCTEURS = ['Docteur 1', 'Docteur 2', 'Docteur 3'];

// Icônes et couleurs pour chaque statut
const STATUS_CONFIG = {
  en_attente: {
    icon: "⏳",
    label: "En attente",
    color: "blue",
    bgClass: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    badgeClass: "bg-blue-100 text-blue-800",
    iconBg: "bg-blue-100"
  },
  en_consultation: {
    icon: "🩺",
    label: "En consultation",
    color: "green",
    bgClass: "bg-green-50 border-green-200 hover:bg-green-100",
    badgeClass: "bg-green-100 text-green-800",
    iconBg: "bg-green-100"
  },
  termine: {
    icon: "✅",
    label: "Terminé",
    color: "gray",
    bgClass: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    badgeClass: "bg-gray-100 text-gray-800",
    iconBg: "bg-gray-100"
  },
  desiste: {
    icon: "❌",
    label: "Désisté",
    color: "red",
    bgClass: "bg-red-50 border-red-200 hover:bg-red-100",
    badgeClass: "bg-red-100 text-red-800",
    iconBg: "bg-red-100"
  }
};

// Utilitaires
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatWaitingTime = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
};

// Hook personnalisé pour la gestion des notifications
const useNotifications = () => {
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/notify.mp3");
      audio.volume = 1.0;
      audio.play().catch(console.warn);
    } catch (error) {
      console.warn('Erreur audio:', error);
    }
  }, []);

  const showSystemNotification = useCallback((title, body) => {
    if (!("Notification" in window)) return;
    
    const showNotif = () => {
      new Notification(title, {
        body,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        vibrate: [300, 100, 300]
      });
    };

    if (Notification.permission === "granted") {
      showNotif();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") showNotif();
      });
    }
  }, []);

  return { playNotificationSound, showSystemNotification };
};

// Composant pour les statistiques d'un docteur
const StatsCard = ({ label, count, icon, colorClass }) => (
  <div className={`${colorClass} p-4 rounded-lg border transition-transform hover:scale-105`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </div>
);

// Composant pour un ticket individuel
const TicketCard = ({ ticket, isMyTicket, position }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${config.bgClass}
        ${isMyTicket ? 'ring-2 ring-yellow-400 ring-opacity-50 shadow-lg' : 'shadow-sm'}
      `}
    >
      {/* Badge "Vous" pour mon ticket */}
      {isMyTicket && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          👤 Vous
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Icône de statut */}
          <div className={`${config.iconBg} p-2 rounded-full`}>
            <span className="text-lg">{config.icon}</span>
          </div>
          
          {/* Informations du ticket */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">N°{ticket.number}</span>
              <span className={`${config.badgeClass} px-2 py-1 rounded-full text-xs font-medium`}>
                {config.label}
              </span>
            </div>
            
            {/* Position dans la file ou temps d'attente */}
            <div className="flex items-center space-x-4 mt-1">
              {ticket.status === 'en_attente' && position && (
                <span className="text-sm text-blue-600 font-medium">
                  🏃‍♂️ Position: {position}
                </span>
              )}
              <span className="text-sm text-gray-500">
                ⏰ {formatWaitingTime(ticket.createdAt)}
              </span>
              <span className="text-sm text-gray-400">
                {formatTime(ticket.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Indicateur visuel du statut */}
        <div className="flex flex-col items-center">
          {ticket.status === 'en_consultation' && (
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          )}
          {ticket.status === 'en_attente' && (
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour la file d'attente d'un docteur
const DoctorQueue = React.memo(({ docteur, tickets, currentTime, myId }) => {
  // Calcul des statistiques
  const stats = {
    waiting: tickets.filter(t => t.status === "en_attente").length,
    inConsultation: tickets.filter(t => t.status === "en_consultation").length,
    finished: tickets.filter(t => t.status === "termine").length,
    cancelled: tickets.filter(t => t.status === "desiste").length,
    total: tickets.length
  };

  // Filtrage et tri des tickets
  const waitingTickets = tickets
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const currentTicket = tickets.find(t => t.status === "en_consultation");
  const completedTickets = tickets.filter(t => t.status === "termine");
  const cancelledTickets = tickets.filter(t => t.status === "desiste");

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* En-tête du docteur */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{docteur}</h2>
            <p className="text-blue-100 mt-1">File d'attente en temps réel</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-blue-100">tickets total</div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            label="En attente" 
            count={stats.waiting} 
            icon="⏳" 
            colorClass="bg-blue-50 border-blue-200"
          />
          <StatsCard 
            label="En consultation" 
            count={stats.inConsultation} 
            icon="🩺" 
            colorClass="bg-green-50 border-green-200"
          />
          <StatsCard 
            label="Terminés" 
            count={stats.finished} 
            icon="✅" 
            colorClass="bg-gray-50 border-gray-200"
          />
          <StatsCard 
            label="Désistés" 
            count={stats.cancelled} 
            icon="❌" 
            colorClass="bg-red-50 border-red-200"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {/* Patient en consultation */}
        {currentTicket && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              🩺 En consultation maintenant
            </h3>
            <TicketCard 
              ticket={currentTicket} 
              isMyTicket={currentTicket._id === myId}
            />
          </div>
        )}

        {/* File d'attente */}
        {waitingTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              ⏳ File d'attente ({waitingTickets.length})
            </h3>
            <div className="space-y-3">
              {waitingTickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  position={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Patients terminés (derniers 3) */}
        {completedTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              ✅ Récemment terminés
            </h3>
            <div className="space-y-3">
              {completedTickets
                .slice(-3)
                .reverse()
                .map((ticket) => (
                  <TicketCard 
                    key={ticket._id}
                    ticket={ticket} 
                    isMyTicket={ticket._id === myId}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* Patients désistés (si il y en a) */}
        {cancelledTickets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              ❌ Désistements ({cancelledTickets.length})
            </h3>
            <div className="space-y-3 max-h-32 overflow-y-auto">
              {cancelledTickets.map((ticket) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message si aucun ticket */}
        {stats.total === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏥</div>
            <p>Aucun patient aujourd'hui</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Composant principal
const Queue = () => {
  const [state, setState] = useState({
    queues: Object.fromEntries(DOCTEURS.map(d => [d, []])),
    myId: null,
    currentTime: Date.now(),
    isLoading: true,
    error: null,
    selectedDoctor: null
  });

  const refs = {
    pollInterval: useRef(null),
    retryCount: useRef(0),
    timeInterval: useRef(null)
  };

  const toast = useToast();
  const { playNotificationSound, showSystemNotification } = useNotifications();
  
  // Détection du rôle (à remplacer par la vraie logique)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSecretary = user.role?.name === "secretaire";

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/queue`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const tickets = await res.json();

      // Grouper les tickets par docteur
      const queuesByDoctor = DOCTEURS.reduce((acc, docteur) => {
        acc[docteur] = tickets.filter(t => t.docteur === docteur);
        return acc;
      }, {});

      setState(prev => ({
        ...prev,
        queues: queuesByDoctor,
        error: null
      }));

      refs.retryCount.current = 0;
    } catch (err) {
      console.error("Erreur file d'attente:", err);
      refs.retryCount.current++;
      
      if (refs.retryCount.current <= 3) {
        setState(prev => ({
          ...prev,
          error: `Tentative de reconnexion... (${refs.retryCount.current}/3)`
        }));
        setTimeout(() => {
          fetchQueues();
        }, 1000 * refs.retryCount.current);
      } else {
        setState(prev => ({
          ...prev,
          error: "Impossible de charger les files d'attente. Veuillez rafraîchir la page."
        }));
      }
    }
  }, [API_URL]);

  useEffect(() => {
    // Initialisation
    const storedTicket = localStorage.getItem("lineup_ticket");
    if (storedTicket) {
      try {
        const parsed = JSON.parse(storedTicket);
        setState(prev => ({
          ...prev,
          myId: parsed._id || parsed.userId || parsed.sessionId
        }));
      } catch (e) {
        console.error("Erreur ticket:", e);
        localStorage.removeItem("lineup_ticket");
      }
    }

    fetchQueues();
    setState(prev => ({ ...prev, isLoading: false }));

    // Polling
    refs.pollInterval.current = setInterval(fetchQueues, POLL_INTERVAL);
    
    // Timer pour l'heure actuelle
    refs.timeInterval.current = setInterval(() => {
      setState(prev => ({ ...prev, currentTime: Date.now() }));
    }, 1000);
    
    return () => {
      if (refs.pollInterval.current) {
        clearInterval(refs.pollInterval.current);
      }
      if (refs.timeInterval.current) {
        clearInterval(refs.timeInterval.current);
      }
    };
  }, [fetchQueues]);

  if (state.isLoading) {
    return (
      <Layout hideTitle={true}>
        <AnimatedPage>
          <div className="min-h-screen flex justify-center items-center">
            <div className="text-center">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Chargement des files d'attente...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout hideTitle={true}>
        <AnimatedPage>
          <div className="min-h-screen flex justify-center items-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <strong className="font-bold">Erreur de connexion</strong>
                  <p className="mt-1">{state.error}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout hideTitle={true}>
      <AnimatedPage>
        <div className="min-h-screen bg-gray-50">
          {/* En-tête avec titre et contrôles */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-3xl font-bold text-gray-900">📋 File d'attente</h1>
                  <p className="text-gray-600 mt-1">
                    Mise à jour automatique • {formatTime(state.currentTime)}
                  </p>
                </div>
                
                {/* Sélecteur de docteur pour secrétaires */}
                {isSecretary && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setState(prev => ({ ...prev, selectedDoctor: null }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !state.selectedDoctor
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      Tous les docteurs
                    </button>
                    {DOCTEURS.map(docteur => (
                      <button
                        key={docteur}
                        onClick={() => setState(prev => ({ ...prev, selectedDoctor: docteur }))}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          state.selectedDoctor === docteur
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {docteur}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grille des files d'attente */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className={`grid gap-8 ${
              state.selectedDoctor 
                ? 'grid-cols-1' 
                : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {(state.selectedDoctor ? [state.selectedDoctor] : DOCTEURS).map(docteur => (
                <div key={docteur} className="w-full">
                  <DoctorQueue
                    docteur={docteur}
                    tickets={state.queues[docteur] || []}
                    currentTime={state.currentTime}
                    myId={state.myId}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Toast */}
          {toast.toasts && toast.toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => toast.removeToast(t.id)}
            />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
