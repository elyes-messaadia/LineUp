import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import Title from "../components/Title";
import BACKEND_URL from "../config/api";

// Constantes
const API_URL = BACKEND_URL;
const POLL_INTERVAL = 3000;

// Configuration des statuts épurée
const STATUS_CONFIG = {
  en_attente: {
    icon: "⏱️",
    label: "En attente",
    color: "blue",
    bgClass: "bg-blue-50 border-blue-200",
    textClass: "text-blue-800",
    badgeClass: "bg-blue-100 text-blue-800"
  },
  en_consultation: {
    icon: "🩺",
    label: "En consultation", 
    color: "green",
    bgClass: "bg-green-50 border-green-200",
    textClass: "text-green-800",
    badgeClass: "bg-green-100 text-green-800"
  },
  termine: {
    icon: "✅",
    label: "Terminé",
    color: "gray",
    bgClass: "bg-gray-50 border-gray-200", 
    textClass: "text-gray-600",
    badgeClass: "bg-gray-100 text-gray-600"
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

// Header moderne et épuré
const CleanHeader = ({ allTickets, currentTime }) => {
  const stats = {
    total: allTickets.length,
    waiting: allTickets.filter(t => t.status === "en_attente").length,
    inConsultation: allTickets.filter(t => t.status === "en_consultation").length
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Titre principal épuré */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              File d'Attente Médicale
            </h1>
            <p className="text-gray-500 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Mise à jour automatique</span>
              <span className="text-gray-300">•</span>
              <span className="font-mono">{formatTime(currentTime)}</span>
            </p>
          </div>
          
          {/* Statistiques compactes */}
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.waiting}</div>
              <div className="text-sm text-gray-500">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.inConsultation}</div>
              <div className="text-sm text-gray-500">En consultation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Carte ticket épurée et moderne
const CleanTicketCard = ({ ticket, isMyTicket, position }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md
      ${config.bgClass}
      ${isMyTicket ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
    `}>
      
      {/* Header du ticket */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">#{ticket.number}</span>
              {isMyTicket && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Vous
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {ticket.docteur || 'Docteur général'}
            </div>
          </div>
        </div>
        
        {/* Badge de statut */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.badgeClass}`}>
          {config.label}
        </div>
      </div>

      {/* Informations additionnelles */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          {position && (
            <span className="font-medium">
              Position: {position}
            </span>
          )}
          <span>
            Créé: {formatTime(ticket.createdAt)}
          </span>
        </div>
        
        {ticket.status === "en_attente" && (
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="font-medium text-blue-700">
              {formatWaitingTime(ticket.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Interface principale avec vue liste épurée
const Queue = () => {
  const [state, setState] = useState({
    queues: {},
    myId: null,
    isLoading: true,
    error: null,
    currentTime: Date.now()
  });

  const [viewMode, setViewMode] = useState('all'); // 'all', 'waiting', 'consultation'
  const refs = useRef({
    pollInterval: null,
    timeInterval: null,
    retryCount: 0
  });

  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

  // Fonction de fetch simplifiée
  const fetchQueues = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/queue`);
      if (!response.ok) throw new Error('Erreur réseau');
      
      const tickets = await response.json();
      
      setState(prev => ({
        ...prev,
        queues: { general: tickets },
        error: null
      }));
      
      refs.current.retryCount = 0;
    } catch (err) {
      console.error("Erreur file d'attente:", err);
      setState(prev => ({
        ...prev,
        error: "Impossible de charger les données"
      }));
    }
  }, [API_URL]);

  // Effects
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
        localStorage.removeItem("lineup_ticket");
      }
    }

    fetchQueues();
    setState(prev => ({ ...prev, isLoading: false }));

    refs.current.pollInterval = setInterval(fetchQueues, POLL_INTERVAL);
    refs.current.timeInterval = setInterval(() => {
      setState(prev => ({ ...prev, currentTime: Date.now() }));
    }, 1000);
    
    return () => {
      if (refs.current.pollInterval) clearInterval(refs.current.pollInterval);
      if (refs.current.timeInterval) clearInterval(refs.current.timeInterval);
    };
  }, [fetchQueues]);

  // Données
  const allTickets = Object.values(state.queues).flat();
  const filteredTickets = allTickets.filter(ticket => {
    switch (viewMode) {
      case 'waiting': return ticket.status === 'en_attente';
      case 'consultation': return ticket.status === 'en_consultation';
      default: return true;
    }
  });

  const getMyPosition = () => {
    if (!state.myId) return null;
    const waitingTickets = allTickets
      .filter(t => t.status === "en_attente")
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const myIndex = waitingTickets.findIndex(t => t._id === state.myId);
    return myIndex !== -1 ? myIndex + 1 : null;
  };

  if (state.isLoading) {
    return (
      <Layout fullscreen>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⚕️</div>
            <p className="text-gray-600">Chargement de la file d'attente...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullscreen>
      <AnimatedPage>
        <div className="min-h-screen bg-gray-50">
          
          {/* Header */}
          <CleanHeader allTickets={allTickets} currentTime={state.currentTime} />
          
          {/* Contenu principal */}
          <div className="max-w-6xl mx-auto px-6 py-8">
            
            {/* Filtres */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'all' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tous ({allTickets.length})
                </button>
                <button
                  onClick={() => setViewMode('waiting')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'waiting' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En attente ({allTickets.filter(t => t.status === 'en_attente').length})
                </button>
                <button
                  onClick={() => setViewMode('consultation')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'consultation' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En consultation ({allTickets.filter(t => t.status === 'en_consultation').length})
                </button>
              </div>
              
              {/* Indicateur de position personnelle */}
              {state.myId && getMyPosition() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                  <span className="text-blue-800 font-medium">
                    Votre position: #{getMyPosition()}
                  </span>
                </div>
              )}
            </div>

            {/* Message d'erreur */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-red-800">{state.error}</span>
                </div>
              </div>
            )}

            {/* Liste des tickets */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏥</div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Aucun patient en attente
                  </h3>
                  <p className="text-gray-500">
                    La file d'attente est vide pour le moment
                  </p>
                </div>
              ) : (
                filteredTickets
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket, index) => (
                    <CleanTicketCard
                      key={ticket._id}
                      ticket={ticket}
                      isMyTicket={ticket._id === state.myId}
                      position={
                        ticket.status === 'en_attente' 
                          ? allTickets
                              .filter(t => t.status === 'en_attente')
                              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                              .findIndex(t => t._id === ticket._id) + 1
                          : null
                      }
                    />
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
            />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
