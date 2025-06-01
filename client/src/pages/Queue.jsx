import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

// Constantes
const API_URL = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 2000;
const DOCTEURS = ['Docteur 1', 'Docteur 2', 'Docteur 3'];

// Configuration des statuts
const STATUS_CONFIG = {
  en_attente: {
    icon: "⏳",
    label: "En attente",
    color: "amber",
    bgClass: "bg-amber-50 border-amber-200",
    badgeClass: "bg-amber-100 text-amber-800",
    iconBg: "bg-amber-100",
    dotColor: "bg-amber-500"
  },
  en_consultation: {
    icon: "🩺",
    label: "En consultation",
    color: "emerald",
    bgClass: "bg-emerald-50 border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-800",
    iconBg: "bg-emerald-100",
    dotColor: "bg-emerald-500"
  },
  termine: {
    icon: "✅",
    label: "Terminé",
    color: "slate",
    bgClass: "bg-slate-50 border-slate-200",
    badgeClass: "bg-slate-100 text-slate-800",
    iconBg: "bg-slate-100",
    dotColor: "bg-slate-500"
  },
  desiste: {
    icon: "❌",
    label: "Désisté",
    color: "red",
    bgClass: "bg-red-50 border-red-200",
    badgeClass: "bg-red-100 text-red-800",
    iconBg: "bg-red-100",
    dotColor: "bg-red-500"
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

// Interface mobile (version simplifiée)
const MobileInterface = ({ allTickets, currentTime, queues, myId }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header mobile */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              File d'attente médicale
            </h1>
            <p className="text-gray-600">
              Mise à jour • {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Grille mobile */}
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="space-y-8">
          {DOCTEURS.map(docteur => (
            <MobileDoctorCard
              key={docteur}
              docteur={docteur}
              tickets={queues[docteur] || []}
              myId={myId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Sidebar Desktop avec navigation et stats
const DesktopSidebar = ({ allTickets, currentTime, selectedDoctor, onDoctorSelect }) => {
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
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto shadow-xl">
      {/* Header Sidebar */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white p-8">
        <h1 className="text-3xl font-bold mb-2">📋 LineUp</h1>
        <p className="text-indigo-100 mb-4">Gestion des files d'attente</p>
        <div className="bg-white/20 rounded-lg p-4">
          <div className="text-2xl font-bold">{formatTime(currentTime)}</div>
          <div className="text-indigo-200 text-sm">Temps réel</div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="p-8 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Vue d'ensemble</h2>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-6 border border-blue-200">
          <div className="text-center">
            <div className="text-5xl font-black text-indigo-700 mb-2">{totalStats.total}</div>
            <div className="text-indigo-600 font-semibold">Patients aujourd'hui</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
            <div className="text-3xl font-bold text-amber-700">{totalStats.waiting}</div>
            <div className="text-amber-600 text-sm font-medium">En attente</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
            <div className="text-3xl font-bold text-emerald-700">{totalStats.inConsultation}</div>
            <div className="text-emerald-600 text-sm font-medium">En cours</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-slate-700">{totalStats.finished}</div>
            <div className="text-slate-600 text-sm font-medium">Terminés</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-center">
            <div className="text-3xl font-bold text-red-700">{totalStats.cancelled}</div>
            <div className="text-red-600 text-sm font-medium">Désistés</div>
          </div>
        </div>

        {avgWaitTime > 0 && (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 text-center">
            <div className="text-3xl font-bold text-purple-700">{avgWaitTime} min</div>
            <div className="text-purple-600 text-sm font-medium">Temps d'attente moyen</div>
          </div>
        )}
      </div>

      {/* Navigation des docteurs */}
      <div className="p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">👨‍⚕️ Docteurs</h2>
        <div className="space-y-3">
          <button
            onClick={() => onDoctorSelect(null)}
            className={`w-full text-left p-4 rounded-xl font-semibold transition-all duration-200 ${
              !selectedDoctor
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:scale-102'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>📊 Vue globale</span>
              <span className="text-sm opacity-75">{totalStats.total}</span>
            </div>
          </button>
          
          {DOCTEURS.map(docteur => {
            const doctorTickets = allTickets.filter(t => t.docteur === docteur);
            const waiting = doctorTickets.filter(t => t.status === 'en_attente').length;
            const inConsultation = doctorTickets.filter(t => t.status === 'en_consultation').length;
            
            return (
              <button
                key={docteur}
                onClick={() => onDoctorSelect(docteur)}
                className={`w-full text-left p-4 rounded-xl font-semibold transition-all duration-200 ${
                  selectedDoctor === docteur
                    ? 'bg-indigo-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{docteur}</span>
                  <div className="flex items-center space-x-2 text-sm">
                    {waiting > 0 && (
                      <span className={`px-2 py-1 rounded-full ${
                        selectedDoctor === docteur 
                          ? 'bg-white/20' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {waiting}
                      </span>
                    )}
                    {inConsultation > 0 && (
                      <span className={`px-2 py-1 rounded-full ${
                        selectedDoctor === docteur 
                          ? 'bg-white/20' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        🩺
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Interface Desktop avec pleine utilisation de l'espace
const DesktopInterface = ({ allTickets, currentTime, queues, myId, selectedDoctor, onDoctorSelect }) => {
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <DesktopSidebar 
        allTickets={allTickets}
        currentTime={currentTime}
        selectedDoctor={selectedDoctor}
        onDoctorSelect={onDoctorSelect}
      />

      {/* Zone principale */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-12">
          {!selectedDoctor ? (
            // Vue globale - Grille adaptative
            <>
              <div className="mb-12">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  🏥 Vue d'ensemble des consultations
                </h1>
                <p className="text-xl text-gray-600">
                  Interface temps réel • {formatTime(currentTime)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 2xl:grid-cols-3 gap-12 auto-rows-fr">
                {DOCTEURS.map(docteur => (
                  <DesktopDoctorCard
                    key={docteur}
                    docteur={docteur}
                    tickets={queues[docteur] || []}
                    myId={myId}
                    isFullWidth={false}
                  />
                ))}
              </div>
            </>
          ) : (
            // Vue docteur spécifique - Pleine largeur
            <>
              <div className="mb-12">
                <button
                  onClick={() => onDoctorSelect(null)}
                  className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  ← Retour à la vue globale
                </button>
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  {selectedDoctor}
                </h1>
                <p className="text-xl text-gray-600">
                  Gestion détaillée de la file d'attente
                </p>
              </div>
              
              <div className="max-w-6xl">
                <DesktopDoctorCard
                  docteur={selectedDoctor}
                  tickets={queues[selectedDoctor] || []}
                  myId={myId}
                  isFullWidth={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Carte ticket optimisée
const TicketCard = ({ ticket, isMyTicket, position, isCompact = false }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div 
      className={`
        relative rounded-xl border-2 transition-all duration-300 hover:shadow-lg
        ${config.bgClass}
        ${isMyTicket 
          ? 'ring-2 ring-indigo-400 ring-offset-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-300' 
          : 'hover:shadow-md hover:-translate-y-1'
        }
        ${isCompact ? 'p-4' : 'p-6'}
      `}
    >
      {isMyTicket && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
          C'est vous
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <div className={`${config.iconBg} rounded-full ${isCompact ? 'p-3' : 'p-4'} flex-shrink-0`}>
          <span className={isCompact ? 'text-2xl' : 'text-3xl'}>{config.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-xl' : 'text-2xl'}`}>
              N°{ticket.number}
            </span>
            {ticket.status === 'en_attente' && position && (
              <span className="bg-white/80 text-amber-700 font-semibold px-3 py-1 rounded-full text-sm border border-amber-200">
                Position {position}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600">
            <span className="flex items-center space-x-1">
              <span>🕐</span>
              <span className="font-medium">{formatWaitingTime(ticket.createdAt)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>📅</span>
              <span>{formatTime(ticket.createdAt)}</span>
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {ticket.status === 'en_consultation' && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${config.dotColor} rounded-full animate-pulse`}></div>
              <span className="text-emerald-600 font-medium text-sm">EN DIRECT</span>
            </div>
          )}
          {ticket.status === 'en_attente' && (
            <div className={`w-3 h-3 ${config.dotColor} rounded-full`}></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Carte docteur desktop optimisée
const DesktopDoctorCard = ({ docteur, tickets, myId, isFullWidth = false }) => {
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
    .slice(-5)
    .reverse();

  const avgWaitTime = waitingTickets.length > 0 
    ? Math.floor(waitingTickets.reduce((acc, t) => acc + (Date.now() - new Date(t.createdAt)) / 60000, 0) / waitingTickets.length)
    : 0;

  const maxHeight = isFullWidth ? 'max-h-[calc(100vh-400px)]' : 'max-h-[calc(100vh-300px)]';

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden h-full flex flex-col">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2">{docteur}</h2>
            <p className="text-slate-300 text-lg">Cabinet médical</p>
            {avgWaitTime > 0 && (
              <p className="text-slate-200 text-sm mt-2 bg-slate-700/50 rounded-full px-3 py-1 inline-block">
                ⏱️ Attente moyenne: {avgWaitTime} min
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-white mb-1">{stats.total}</div>
            <div className="text-slate-300">patients</div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-6 bg-gray-50/50 border-b border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="text-3xl font-bold text-amber-700">{stats.waiting}</div>
            <div className="text-amber-600 text-sm font-medium">Attente</div>
          </div>
          <div className="text-center bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-3xl font-bold text-emerald-700">{stats.inConsultation}</div>
            <div className="text-emerald-600 text-sm font-medium">En cours</div>
          </div>
          <div className="text-center bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-3xl font-bold text-slate-700">{stats.finished}</div>
            <div className="text-slate-600 text-sm font-medium">Terminés</div>
          </div>
          <div className="text-center bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="text-3xl font-bold text-red-700">{stats.cancelled}</div>
            <div className="text-red-600 text-sm font-medium">Désistés</div>
          </div>
        </div>
      </div>

      {/* Contenu avec scroll */}
      <div className={`flex-1 p-6 overflow-y-auto ${maxHeight} space-y-8`}>
        {/* Patient en consultation */}
        {currentTicket && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-emerald-100 p-3 rounded-full mr-4">🩺</span>
              En consultation
              <span className="ml-4 bg-emerald-500 text-white text-sm px-4 py-2 rounded-full animate-pulse">
                LIVE
              </span>
            </h3>
            <TicketCard 
              ticket={currentTicket} 
              isMyTicket={currentTicket._id === myId}
              isCompact={!isFullWidth}
            />
          </div>
        )}

        {/* File d'attente */}
        {waitingTickets.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-amber-100 p-3 rounded-full mr-4">⏳</span>
                File d'attente ({waitingTickets.length})
              </span>
              {avgWaitTime > 0 && (
                <span className="text-amber-600 text-lg bg-amber-50 px-4 py-2 rounded-full">
                  ~{avgWaitTime} min
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {waitingTickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  position={index + 1}
                  isCompact={!isFullWidth}
                />
              ))}
            </div>
          </div>
        )}

        {/* Récemment terminés */}
        {recentFinished.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-slate-100 p-3 rounded-full mr-4">✅</span>
              Récemment terminés
            </h3>
            <div className="space-y-4">
              {recentFinished.map((ticket) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  isCompact={!isFullWidth}
                />
              ))}
            </div>
          </div>
        )}

        {/* État vide */}
        {stats.total === 0 && (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-16 border-2 border-dashed border-gray-200">
              <div className="text-8xl mb-8 opacity-50">🏥</div>
              <h3 className="text-3xl font-bold text-gray-700 mb-4">Aucun patient</h3>
              <p className="text-gray-500 text-xl">La consultation n'a pas encore commencé</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Carte docteur mobile simplifiée
const MobileDoctorCard = ({ docteur, tickets, myId }) => {
  const stats = {
    waiting: tickets.filter(t => t.status === "en_attente").length,
    inConsultation: tickets.filter(t => t.status === "en_consultation").length,
    total: tickets.length
  };

  const waitingTickets = tickets
    .filter(t => t.status === "en_attente")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(0, 3); // Limite mobile
  
  const currentTicket = tickets.find(t => t.status === "en_consultation");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{docteur}</h2>
            <p className="text-slate-300">Cabinet médical</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.total}</div>
            <div className="text-slate-300 text-sm">patients</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {currentTicket && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🩺 En consultation</h3>
            <TicketCard 
              ticket={currentTicket} 
              isMyTicket={currentTicket._id === myId}
              isCompact={true}
            />
          </div>
        )}

        {waitingTickets.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              ⏳ En attente ({stats.waiting})
            </h3>
            <div className="space-y-3">
              {waitingTickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket._id}
                  ticket={ticket} 
                  isMyTicket={ticket._id === myId}
                  position={index + 1}
                  isCompact={true}
                />
              ))}
              {stats.waiting > 3 && (
                <div className="text-center text-gray-500 text-sm py-2">
                  ... et {stats.waiting - 3} autres patients
                </div>
              )}
            </div>
          </div>
        )}

        {stats.total === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-50">🏥</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">Aucun patient</h3>
            <p className="text-gray-500">La consultation n'a pas commencé</p>
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
  
  // Détection responsive avancée
  const [screenSize, setScreenSize] = useState(() => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1280) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setScreenSize('mobile');
      else if (width < 1280) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <Layout hideTitle={true}>
        <AnimatedPage>
          <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="text-center bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
              <div className="animate-spin text-6xl mb-6">⏳</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Chargement</h2>
              <p className="text-gray-600">Connexion aux files d'attente...</p>
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
            <div className="bg-white border border-red-200 text-red-700 px-8 py-6 rounded-3xl shadow-xl max-w-md">
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

  // Interface adaptative selon la taille d'écran
  if (screenSize === 'desktop') {
    return (
      <Layout hideTitle={true} fullscreen={true}>
        <AnimatedPage>
          <DesktopInterface 
            allTickets={allTickets}
            currentTime={state.currentTime}
            queues={state.queues}
            myId={state.myId}
            selectedDoctor={state.selectedDoctor}
            onDoctorSelect={(doctor) => setState(prev => ({ ...prev, selectedDoctor: doctor }))}
          />
          
          {toast.toasts && toast.toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={() => toast.removeToast(t.id)}
            />
          ))}
        </AnimatedPage>
      </Layout>
    );
  }

  // Interface mobile/tablette
  return (
    <Layout hideTitle={true} fullscreen={false}>
      <AnimatedPage>
        <MobileInterface 
          allTickets={allTickets}
          currentTime={state.currentTime}
          queues={state.queues}
          myId={state.myId}
        />
        
        {toast.toasts && toast.toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            onClose={() => toast.removeToast(t.id)}
          />
        ))}
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
