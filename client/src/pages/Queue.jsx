import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Constantes
const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000;
const DOCTEURS = ['Docteur 1', 'Docteur 2', 'Docteur 3'];

// Configuration des statuts avec design amélioré
const STATUS_CONFIG = {
  en_attente: {
    icon: "⏳",
    label: "En attente",
    color: "amber",
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    badgeClass: "bg-amber-500 text-white",
    iconBg: "bg-amber-100 text-amber-700",
    dotColor: "bg-amber-500",
    ringColor: "ring-amber-300"
  },
  en_consultation: {
    icon: "🩺",
    label: "En consultation",
    color: "emerald",
    bgClass: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200",
    badgeClass: "bg-emerald-500 text-white",
    iconBg: "bg-emerald-100 text-emerald-700",
    dotColor: "bg-emerald-500",
    ringColor: "ring-emerald-300"
  },
  termine: {
    icon: "✅",
    label: "Terminé",
    color: "slate",
    bgClass: "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200",
    badgeClass: "bg-slate-500 text-white",
    iconBg: "bg-slate-100 text-slate-700",
    dotColor: "bg-slate-500",
    ringColor: "ring-slate-300"
  },
  desiste: {
    icon: "❌",
    label: "Désisté",
    color: "red",
    bgClass: "bg-gradient-to-br from-red-50 to-rose-50 border-red-200",
    badgeClass: "bg-red-500 text-white",
    iconBg: "bg-red-100 text-red-700",
    dotColor: "bg-red-500",
    ringColor: "ring-red-300"
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

// Hook pour les notifications
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

// Header moderne amélioré avec beaucoup plus d'espacement
const ModernHeader = ({ allTickets, currentTime }) => {
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
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-12 py-16">
        {/* Titre principal avec beaucoup plus d'espace */}
        <div className="text-center mb-16">
          <h1 className="text-7xl font-black text-gray-900 mb-6 tracking-tight">
            🏥 File d'Attente Médicale
          </h1>
          <div className="flex items-center justify-center space-x-6 text-2xl text-gray-600">
            <span className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-semibold">Temps réel</span>
            </span>
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Statistiques générales avec espacement généreux */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-10 text-center shadow-2xl">
            <div className="text-6xl font-black mb-4">{totalStats.total}</div>
            <div className="text-blue-100 text-xl font-semibold mb-2">Patients Total</div>
            <div className="text-blue-200 text-lg">Aujourd'hui</div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-amber-200 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-5xl font-bold text-amber-600 mb-3">{totalStats.waiting}</div>
            <div className="text-amber-700 font-bold text-lg mb-3">En Attente</div>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              <span className="text-amber-600 font-medium">File active</span>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-emerald-200 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-5xl font-bold text-emerald-600 mb-3">{totalStats.inConsultation}</div>
            <div className="text-emerald-700 font-bold text-lg mb-3">En Consultation</div>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-emerald-600 font-medium">En cours</span>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-slate-200 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-5xl font-bold text-slate-600 mb-3">{totalStats.finished}</div>
            <div className="text-slate-700 font-bold text-lg mb-3">Terminés</div>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-500 rounded-full mr-2"></div>
              <span className="text-slate-600 font-medium">Finis</span>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl border-2 border-purple-200 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="text-5xl font-bold text-purple-600 mb-3">{avgWaitTime}</div>
            <div className="text-purple-700 font-bold text-lg mb-3">Minutes</div>
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-purple-600 font-medium">Attente moy.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket Card complètement repensé avec plus d'espacement
const EnhancedTicketCard = ({ ticket, isMyTicket, position, isCompact = false }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div 
      className={`
        relative rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl hover:scale-102
        ${config.bgClass}
        ${isMyTicket 
          ? `ring-4 ${config.ringColor} ring-offset-4 shadow-2xl transform scale-105` 
          : 'hover:shadow-xl'
        }
        ${isCompact ? 'p-6' : 'p-10'}
      `}
    >
      {/* Badge "Vous" */}
      {isMyTicket && (
        <div className="absolute -top-5 -right-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold px-8 py-4 rounded-full shadow-2xl animate-pulse">
          🫵 C'est vous !
        </div>
      )}
      
      {/* Badge de position pour les files d'attente */}
      {ticket.status === 'en_attente' && position && (
        <div className="absolute -top-4 -left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-black text-xl shadow-xl">
          {position}
        </div>
      )}
      
      <div className="flex items-center space-x-8">
        {/* Icône avec animation */}
        <div className={`
          ${config.iconBg} rounded-3xl flex-shrink-0 shadow-xl
          ${isCompact ? 'p-6' : 'p-8'}
          ${ticket.status === 'en_consultation' ? 'animate-pulse' : ''}
        `}>
          <span className={`${isCompact ? 'text-4xl' : 'text-6xl'}`}>
            {config.icon}
          </span>
        </div>
        
        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-6 mb-6">
            <span className={`font-black text-gray-900 ${isCompact ? 'text-3xl' : 'text-4xl'}`}>
              Ticket n°{ticket.number}
            </span>
            <span className={`${config.badgeClass} px-6 py-3 rounded-full text-lg font-bold shadow-lg`}>
              {config.label}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="font-bold text-lg">Attente</div>
                <div className="text-lg">{formatWaitingTime(ticket.createdAt)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🕐</span>
              <div>
                <div className="font-bold text-lg">Arrivée</div>
                <div className="text-lg">{formatTime(ticket.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Indicateur de statut */}
        <div className="flex-shrink-0">
          {ticket.status === 'en_consultation' && (
            <div className="text-center">
              <div className={`w-8 h-8 ${config.dotColor} rounded-full animate-ping mx-auto mb-3`}></div>
              <span className="text-emerald-600 font-black text-lg bg-emerald-100 px-4 py-2 rounded-full">
                EN DIRECT
              </span>
            </div>
          )}
          {ticket.status === 'en_attente' && position && (
            <div className="text-center">
              <div className={`w-8 h-8 ${config.dotColor} rounded-full mx-auto mb-3`}></div>
              <span className="text-amber-600 font-black text-lg bg-amber-100 px-4 py-2 rounded-full">
                #{position}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Carte docteur complètement redesignée avec énormément plus d'espacement
const ModernDoctorCard = ({ docteur, tickets, myId }) => {
  const stats = {
    waiting: tickets.filter(t => t.status === "en_attente").length,
    inConsultation: tickets.filter(t => t.status === "en_consultation").length,
    finished: tickets.filter(t => t.status === "termine").length,
    cancelled: tickets.filter(t => t.status === "desiste").length,
    total: tickets.length
  };

  const waitingTickets = tickets
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  const currentTicket = tickets.find(t => t.status === "en_consultation");
  const recentFinished = tickets
    .filter(t => t.status === "termine")
    .slice(-2)
    .reverse();

  const avgWaitTime = waitingTickets.length > 0 
    ? Math.floor(waitingTickets.reduce((acc, t) => acc + (Date.now() - new Date(t.createdAt)) / 60000, 0) / waitingTickets.length)
    : 0;

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
      {/* En-tête moderne avec plus d'espace */}
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 text-white p-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-5xl font-black mb-4 tracking-tight">{docteur}</h2>
            <p className="text-gray-300 text-2xl flex items-center">
              <span className="mr-3">🏥</span>
              Cabinet médical
            </p>
          </div>
          <div className="text-center bg-white/20 rounded-3xl p-8">
            <div className="text-6xl font-black text-white mb-3">{stats.total}</div>
            <div className="text-gray-300 text-xl">patients</div>
          </div>
        </div>
        
        {avgWaitTime > 0 && (
          <div className="bg-blue-500/20 rounded-2xl p-6 border border-blue-400/30">
            <div className="flex items-center justify-center space-x-3">
              <span className="text-2xl">⏱️</span>
              <span className="font-bold text-xl">Temps d'attente moyen: {avgWaitTime} minutes</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques détaillées avec espacement généreux */}
      <div className="p-10 bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-100">
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-8 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl font-black text-amber-700 mb-3">{stats.waiting}</div>
            <div className="text-amber-600 font-bold text-lg">Attente</div>
            <div className="w-12 h-2 bg-amber-500 rounded-full mx-auto mt-3"></div>
          </div>
          <div className="text-center bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl p-8 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl font-black text-emerald-700 mb-3">{stats.inConsultation}</div>
            <div className="text-emerald-600 font-bold text-lg">En cours</div>
            <div className="w-12 h-2 bg-emerald-500 rounded-full mx-auto mt-3"></div>
          </div>
          <div className="text-center bg-gradient-to-br from-slate-100 to-gray-100 rounded-3xl p-8 border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl font-black text-slate-700 mb-3">{stats.finished}</div>
            <div className="text-slate-600 font-bold text-lg">Terminés</div>
            <div className="w-12 h-2 bg-slate-500 rounded-full mx-auto mt-3"></div>
          </div>
          <div className="text-center bg-gradient-to-br from-red-100 to-rose-100 rounded-3xl p-8 border-2 border-red-200 shadow-lg hover:shadow-xl transition-all">
            <div className="text-4xl font-black text-red-700 mb-3">{stats.cancelled}</div>
            <div className="text-red-600 font-bold text-lg">Désistés</div>
            <div className="w-12 h-2 bg-red-500 rounded-full mx-auto mt-3"></div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec beaucoup plus d'espacement */}
      <div className="p-10 max-h-[900px] overflow-y-auto space-y-12">
        {/* Patient en consultation */}
        {currentTicket && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-gray-900 flex items-center">
                <span className="bg-emerald-500 text-white p-6 rounded-3xl mr-6 shadow-xl">🩺</span>
                En Consultation
              </h3>
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-full font-black text-lg shadow-xl animate-pulse">
                🔴 LIVE
              </div>
            </div>
            <EnhancedTicketCard 
              ticket={currentTicket} 
              isMyTicket={currentTicket._id === myId}
            />
          </div>
        )}

        {/* File d'attente */}
        {waitingTickets.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-gray-900 flex items-center">
                <span className="bg-amber-500 text-white p-6 rounded-3xl mr-6 shadow-xl">⏳</span>
                File d'Attente
                <span className="ml-6 bg-amber-100 text-amber-800 px-6 py-3 rounded-full text-2xl font-black">
                  {waitingTickets.length}
                </span>
              </h3>
              {avgWaitTime > 0 && (
                <div className="bg-amber-100 text-amber-700 px-8 py-4 rounded-full font-black text-lg shadow-lg">
                  ~{avgWaitTime} min
                </div>
              )}
            </div>
            <div className="space-y-8">
              {waitingTickets.map((ticket, index) => (
                <EnhancedTicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  position={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Récemment terminés */}
        {recentFinished.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-4xl font-black text-gray-900 flex items-center">
              <span className="bg-slate-500 text-white p-6 rounded-3xl mr-6 shadow-xl">✅</span>
              Récemment Terminés
            </h3>
            <div className="space-y-8">
              {recentFinished.map((ticket) => (
                <EnhancedTicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                />
              ))}
            </div>
          </div>
        )}

        {/* État vide amélioré */}
        {stats.total === 0 && (
          <div className="text-center py-24">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-24 border-2 border-dashed border-blue-300 shadow-inner">
              <div className="text-10xl mb-12 opacity-60">🏥</div>
              <h3 className="text-5xl font-black text-gray-700 mb-8">Aucun Patient</h3>
              <p className="text-gray-500 text-2xl leading-relaxed">
                La consultation n'a pas encore commencé.<br/>
                Les patients apparaîtront ici dès qu'ils prendront un ticket.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal
const Queue = () => {
  const [state, setState] = useState({
    queues: Object.fromEntries(DOCTEURS.map(d => [d, []])),
    myId: null,
    currentTime: Date.now(),
    isLoading: true,
    error: null
  });

  const refs = {
    pollInterval: useRef(null),
    retryCount: useRef(0),
    timeInterval: useRef(null)
  };

  const toast = useToast();
  const { playNotificationSound, showSystemNotification } = useNotifications();

  const fetchQueues = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/queue`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const tickets = await res.json();

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
        setTimeout(fetchQueues, 1000 * refs.retryCount.current);
      } else {
        setState(prev => ({
          ...prev,
          error: "Impossible de charger les files d'attente."
        }));
      }
    }
  }, [API_URL]);

  useEffect(() => {
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

    refs.pollInterval.current = setInterval(fetchQueues, POLL_INTERVAL);
    refs.timeInterval.current = setInterval(() => {
      setState(prev => ({ ...prev, currentTime: Date.now() }));
    }, 1000);
    
    return () => {
      if (refs.pollInterval.current) clearInterval(refs.pollInterval.current);
      if (refs.timeInterval.current) clearInterval(refs.timeInterval.current);
    };
  }, [fetchQueues]);

  const allTickets = Object.values(state.queues).flat();

  if (state.isLoading) {
    return (
      <Layout hideTitle={true} fullscreen={true}>
        <AnimatedPage>
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center bg-white p-20 rounded-3xl shadow-2xl border border-gray-100">
              <div className="animate-spin text-9xl mb-10">⏳</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-6">Chargement</h2>
              <p className="text-gray-600 text-2xl">Connexion aux files d'attente...</p>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout hideTitle={true} fullscreen={true}>
        <AnimatedPage>
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="bg-white border-2 border-red-200 text-red-700 px-16 py-12 rounded-3xl shadow-2xl max-w-lg">
              <div className="flex items-center">
                <span className="text-8xl mr-8">⚠️</span>
                <div>
                  <h3 className="text-3xl font-bold">Erreur de connexion</h3>
                  <p className="mt-4 text-xl">{state.error}</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout hideTitle={true} fullscreen={true}>
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
          {/* Header moderne */}
          <ModernHeader 
            allTickets={allTickets}
            currentTime={state.currentTime}
          />

          {/* Grille des docteurs avec espacement généreux */}
          <div className="max-w-7xl mx-auto px-12 py-16">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
              {DOCTEURS.map(docteur => (
                <ModernDoctorCard
                  key={docteur}
                  docteur={docteur}
                  tickets={state.queues[docteur] || []}
                  myId={state.myId}
                />
              ))}
            </div>
          </div>

          {/* Footer avec informations */}
          <div className="bg-white border-t border-gray-200 mt-16">
            <div className="max-w-7xl mx-auto px-12 py-12">
              <div className="text-center text-gray-600">
                <p className="text-2xl font-semibold">🏥 Interface de gestion des files d'attente médicales</p>
                <p className="text-lg mt-3">Mise à jour automatique toutes les {POLL_INTERVAL/1000} secondes</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
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
