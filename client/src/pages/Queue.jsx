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
    iconBg: "bg-blue-100",
    gradientClass: "from-blue-500 to-blue-600"
  },
  en_consultation: {
    icon: "🩺",
    label: "En consultation",
    color: "green",
    bgClass: "bg-green-50 border-green-200 hover:bg-green-100",
    badgeClass: "bg-green-100 text-green-800",
    iconBg: "bg-green-100",
    gradientClass: "from-green-500 to-green-600"
  },
  termine: {
    icon: "✅",
    label: "Terminé",
    color: "gray",
    bgClass: "bg-gray-50 border-gray-200 hover:bg-gray-100",
    badgeClass: "bg-gray-100 text-gray-800",
    iconBg: "bg-gray-100",
    gradientClass: "from-gray-500 to-gray-600"
  },
  desiste: {
    icon: "❌",
    label: "Désisté",
    color: "red",
    bgClass: "bg-red-50 border-red-200 hover:bg-red-100",
    badgeClass: "bg-red-100 text-red-800",
    iconBg: "bg-red-100",
    gradientClass: "from-red-500 to-red-600"
  }
};

// Utilitaires
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
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

// Composant pour les statistiques globales (desktop)
const GlobalStats = ({ allTickets }) => {
  const totalStats = {
    total: allTickets.length,
    waiting: allTickets.filter(t => t.status === "en_attente").length,
    inConsultation: allTickets.filter(t => t.status === "en_consultation").length,
    finished: allTickets.filter(t => t.status === "termine").length,
    cancelled: allTickets.filter(t => t.status === "desiste").length
  };

  const avgWaitTime = totalStats.waiting > 0 
    ? Math.floor(allTickets
        .filter(t => t.status === "en_attente")
        .reduce((acc, t) => acc + (Date.now() - new Date(t.createdAt)) / 60000, 0) / totalStats.waiting)
    : 0;

  return (
    <div className="hidden xl:block bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center">
              📊 Vue d'ensemble
            </h2>
            <p className="text-indigo-100 mt-2 text-lg">Statistiques globales en temps réel</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{totalStats.total}</div>
            <div className="text-indigo-200">patients aujourd'hui</div>
          </div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="grid grid-cols-6 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total aujourd'hui</p>
              <p className="text-4xl font-bold text-blue-900">{totalStats.total}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-sm font-medium text-orange-700 mb-1">En attente</p>
              <p className="text-4xl font-bold text-orange-900">{totalStats.waiting}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">🩺</div>
              <p className="text-sm font-medium text-green-700 mb-1">En consultation</p>
              <p className="text-4xl font-bold text-green-900">{totalStats.inConsultation}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Terminés</p>
              <p className="text-4xl font-bold text-gray-900">{totalStats.finished}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">❌</div>
              <p className="text-sm font-medium text-red-700 mb-1">Désistés</p>
              <p className="text-4xl font-bold text-red-900">{totalStats.cancelled}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition-all">
            <div className="text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <p className="text-sm font-medium text-purple-700 mb-1">Temps moyen</p>
              <p className="text-4xl font-bold text-purple-900">{avgWaitTime}<span className="text-2xl">min</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour les statistiques d'un docteur
const StatsCard = ({ label, count, icon, colorClass, percentage }) => (
  <div className={`${colorClass} p-4 rounded-xl border transition-all hover:scale-105 hover:shadow-md`}>
    <div className="text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <div className="flex items-center justify-center space-x-1">
        <p className="text-3xl font-bold">{count}</p>
        {percentage !== undefined && (
          <span className="text-xs text-gray-500">({percentage}%)</span>
        )}
      </div>
    </div>
  </div>
);

// Composant pour un ticket individuel (version desktop améliorée)
const TicketCard = ({ ticket, isMyTicket, position, isDesktop = false }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div 
      className={`
        relative p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg group
        ${config.bgClass}
        ${isMyTicket ? 'ring-2 ring-yellow-400 ring-opacity-75 shadow-lg transform scale-[1.02]' : 'shadow-sm hover:scale-[1.01]'}
      `}
    >
      {/* Badge "Vous" pour mon ticket */}
      {isMyTicket && (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-sm font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
          👤 Vous
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Icône de statut */}
          <div className={`${config.iconBg} p-3 rounded-full group-hover:scale-110 transition-transform`}>
            <span className="text-2xl">{config.icon}</span>
          </div>
          
          {/* Informations du ticket */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl font-bold text-gray-900">N°{ticket.number}</span>
              <span className={`${config.badgeClass} px-3 py-1 rounded-full text-sm font-medium`}>
                {config.label}
              </span>
            </div>
            
            {/* Informations détaillées */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {ticket.status === 'en_attente' && position && (
                <span className="text-blue-600 font-semibold bg-blue-100 px-3 py-1 rounded-full">
                  🏃‍♂️ Position: {position}
                </span>
              )}
              <span className="text-gray-600 font-medium">
                ⏰ {formatWaitingTime(ticket.createdAt)}
              </span>
              <span className="text-gray-500">
                🕒 {isDesktop ? formatDateTime(ticket.createdAt) : formatTime(ticket.createdAt)}
              </span>
              {isDesktop && ticket.metadata?.ipAddress && (
                <span className="text-gray-400 text-xs">
                  📍 {ticket.metadata.ipAddress.slice(-8)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Indicateur visuel du statut */}
        <div className="flex flex-col items-center space-y-2 ml-4">
          {ticket.status === 'en_consultation' && (
            <div className="flex items-center space-x-2">
              <div className="animate-pulse">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              {isDesktop && <span className="text-xs text-green-600 font-bold">LIVE</span>}
            </div>
          )}
          {ticket.status === 'en_attente' && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              {isDesktop && position && position <= 3 && (
                <span className="text-xs text-blue-600 font-bold">BIENTÔT</span>
              )}
            </div>
          )}
          {isDesktop && ticket.status === 'termine' && (
            <span className="text-xs text-gray-500 text-center">
              ✓ {formatTime(ticket.updatedAt || ticket.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour la file d'attente d'un docteur (version desktop améliorée)
const DoctorQueue = React.memo(({ docteur, tickets, currentTime, myId, isDesktop = false }) => {
  // Calcul des statistiques
  const stats = {
    waiting: tickets.filter(t => t.status === "en_attente").length,
    inConsultation: tickets.filter(t => t.status === "en_consultation").length,
    finished: tickets.filter(t => t.status === "termine").length,
    cancelled: tickets.filter(t => t.status === "desiste").length,
    total: tickets.length
  };

  // Calcul des pourcentages
  const getPercentage = (count) => stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

  // Filtrage et tri des tickets
  const waitingTickets = tickets
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const currentTicket = tickets.find(t => t.status === "en_consultation");
  const completedTickets = tickets.filter(t => t.status === "termine");
  const cancelledTickets = tickets.filter(t => t.status === "desiste");

  // Temps d'attente moyen
  const avgWaitTime = waitingTickets.length > 0 
    ? Math.floor(waitingTickets.reduce((acc, t) => acc + (Date.now() - new Date(t.createdAt)) / 60000, 0) / waitingTickets.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* En-tête du docteur */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{docteur}</h2>
            <p className="text-blue-100 mt-2 text-lg">File d'attente en temps réel</p>
            {isDesktop && avgWaitTime > 0 && (
              <p className="text-blue-200 text-sm mt-2">
                ⏱️ Attente moyenne: {avgWaitTime} minutes
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{stats.total}</div>
            <div className="text-blue-200 text-lg">patients total</div>
            {isDesktop && (
              <div className="text-sm text-blue-300 mt-2">
                {stats.waiting} en attente • {stats.inConsultation} en cours
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-8 border-b border-gray-100">
        <div className={`grid gap-4 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
          <StatsCard 
            label="En attente" 
            count={stats.waiting} 
            icon="⏳" 
            colorClass="bg-blue-50 border-blue-200"
            percentage={isDesktop ? getPercentage(stats.waiting) : undefined}
          />
          <StatsCard 
            label="En consultation" 
            count={stats.inConsultation} 
            icon="🩺" 
            colorClass="bg-green-50 border-green-200"
            percentage={isDesktop ? getPercentage(stats.inConsultation) : undefined}
          />
          <StatsCard 
            label="Terminés" 
            count={stats.finished} 
            icon="✅" 
            colorClass="bg-gray-50 border-gray-200"
            percentage={isDesktop ? getPercentage(stats.finished) : undefined}
          />
          <StatsCard 
            label="Désistés" 
            count={stats.cancelled} 
            icon="❌" 
            colorClass="bg-red-50 border-red-200"
            percentage={isDesktop ? getPercentage(stats.cancelled) : undefined}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`p-8 ${isDesktop ? 'max-h-[800px] overflow-y-auto' : ''}`}>
        {/* Patient en consultation */}
        {currentTicket && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              🩺 En consultation maintenant
              {isDesktop && (
                <span className="ml-3 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  ACTIF
                </span>
              )}
            </h3>
            <TicketCard 
              ticket={currentTicket} 
              isMyTicket={currentTicket._id === myId}
              isDesktop={isDesktop}
            />
          </div>
        )}

        {/* File d'attente */}
        {waitingTickets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <span className="flex items-center">
                ⏳ File d'attente ({waitingTickets.length})
                {isDesktop && avgWaitTime > 0 && (
                  <span className="ml-3 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    ~{avgWaitTime}min
                  </span>
                )}
              </span>
              {isDesktop && waitingTickets.length > 5 && (
                <span className="text-sm text-gray-500">
                  Scroll pour voir plus ↓
                </span>
              )}
            </h3>
            <div className={`space-y-4 ${isDesktop && waitingTickets.length > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
              {waitingTickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  position={index + 1}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </div>
        )}

        {/* Patients terminés (version desktop étendue) */}
        {completedTickets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              ✅ Récemment terminés
              {isDesktop && (
                <span className="ml-3 bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  {completedTickets.length} total
                </span>
              )}
            </h3>
            <div className={`space-y-4 ${isDesktop ? 'max-h-48 overflow-y-auto pr-2' : ''}`}>
              {completedTickets
                .slice(isDesktop ? -8 : -3)
                .reverse()
                .map((ticket) => (
                  <TicketCard 
                    key={ticket._id}
                    ticket={ticket} 
                    isMyTicket={ticket._id === myId}
                    isDesktop={isDesktop}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* Patients désistés */}
        {cancelledTickets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              ❌ Désistements ({cancelledTickets.length})
              {isDesktop && (
                <span className="ml-3 bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                  {getPercentage(cancelledTickets.length)}% du total
                </span>
              )}
            </h3>
            <div className={`space-y-4 ${isDesktop ? 'max-h-40' : 'max-h-32'} overflow-y-auto pr-2`}>
              {cancelledTickets.map((ticket) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  isDesktop={isDesktop}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message si aucun ticket */}
        {stats.total === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 border-2 border-dashed border-gray-300">
              <div className="text-8xl mb-6">🏥</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">Aucun patient aujourd'hui</h3>
              <p className="text-gray-500 text-lg">La file d'attente se remplira automatiquement</p>
              {isDesktop && (
                <div className="mt-6 flex justify-center">
                  <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-lg border border-blue-200">
                    <span className="text-sm">🔄 Actualisation toutes les {POLL_INTERVAL/1000} secondes</span>
                  </div>
                </div>
              )}
            </div>
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
  
  // Détection du rôle et de la taille d'écran
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSecretary = user.role?.name === "secretaire";
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);

  // Listener pour la taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1280);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
              <div className="animate-spin text-8xl mb-6">⏳</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Chargement des files d'attente</h2>
              <p className="text-gray-600">Veuillez patienter...</p>
              {isDesktop && (
                <p className="text-gray-500 text-sm mt-3">Interface optimisée pour votre écran</p>
              )}
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
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="bg-white border border-red-200 text-red-700 px-8 py-6 rounded-2xl shadow-xl max-w-md">
              <div className="flex items-center">
                <span className="text-4xl mr-4">⚠️</span>
                <div>
                  <h3 className="text-xl font-bold">Erreur de connexion</h3>
                  <p className="mt-2">{state.error}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  // Calcul des tickets globaux pour les stats
  const allTickets = Object.values(state.queues).flat();

  return (
    <Layout hideTitle={true}>
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {/* En-tête avec titre et contrôles */}
          <div className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-6 md:mb-0">
                  <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                    📋 File d'attente
                  </h1>
                  <p className="text-gray-600 mt-2 flex items-center space-x-6 text-lg">
                    <span className="flex items-center">
                      🔄 Mise à jour automatique • {formatTime(state.currentTime)}
                    </span>
                    {isDesktop && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 font-medium">{allTickets.length} patients total aujourd'hui</span>
                        <span>•</span>
                        <span className="text-green-600 flex items-center">
                          🟢 Temps réel
                        </span>
                      </>
                    )}
                  </p>
                </div>
                
                {/* Sélecteur de docteur pour secrétaires */}
                {isSecretary && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setState(prev => ({ ...prev, selectedDoctor: null }))}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        !state.selectedDoctor
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                      }`}
                    >
                      {isDesktop ? '📊 Vue globale' : '📊 Tous'}
                    </button>
                    {DOCTEURS.map(docteur => (
                      <button
                        key={docteur}
                        onClick={() => setState(prev => ({ ...prev, selectedDoctor: docteur }))}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          state.selectedDoctor === docteur
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105'
                        }`}
                      >
                        {docteur}
                        {isDesktop && (
                          <span className="ml-2 bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                            {state.queues[docteur]?.filter(t => t.status === 'en_attente').length || 0}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Statistiques globales (desktop only) */}
            {isDesktop && !state.selectedDoctor && (
              <GlobalStats allTickets={allTickets} />
            )}

            {/* Grille des files d'attente */}
            <div className={`grid gap-8 ${
              state.selectedDoctor 
                ? 'grid-cols-1' 
                : isDesktop 
                  ? 'grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2'
                  : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            }`}>
              {(state.selectedDoctor ? [state.selectedDoctor] : DOCTEURS).map(docteur => (
                <div key={docteur} className="w-full">
                  <DoctorQueue
                    docteur={docteur}
                    tickets={state.queues[docteur] || []}
                    currentTime={state.currentTime}
                    myId={state.myId}
                    isDesktop={isDesktop}
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
