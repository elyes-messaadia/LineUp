import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import NetworkError from "../components/NetworkError";
import { useToast } from "../hooks/useToast";
import { useRealTimeQueue } from "../hooks/useRealTimeQueue";
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
  },
  desiste: {
    icon: "❌",
    label: "Annulé",
    color: "red",
    bgClass: "bg-red-50 border-red-200", 
    textClass: "text-red-600",
    badgeClass: "bg-red-100 text-red-600"
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

const formatEstimatedTime = (minutes) => {
  if (minutes <= 0) return "Maintenant";
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `~${hours}h${mins.toString().padStart(2, '0')}`;
};

// Header moderne et épuré avec indicateurs temps réel
const CleanHeader = ({ stats, currentTime, lastUpdate, error }) => {
  const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / 1000);
  const isStale = timeSinceUpdate > 10; // Plus de 10 secondes

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Titre principal épuré */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              File d'Attente Médicale
            </h1>
            <div className="flex items-center space-x-4 text-sm">
              {/* Indicateur de connexion */}
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  error ? 'bg-red-500' : 
                  isStale ? 'bg-yellow-500' : 
                  'bg-green-500 animate-pulse'
                }`}></span>
                <span className="text-gray-600">
                  {error ? 'Connexion impossible' :
                   isStale ? 'Connexion lente' :
                   'Temps réel'}
                </span>
              </div>
              
              <span className="text-gray-300">•</span>
              
              {/* Heure de dernière mise à jour */}
              <span className="text-gray-500 font-mono">
                Mis à jour: {formatTime(lastUpdate)}
              </span>
              
              {timeSinceUpdate > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400">
                    il y a {timeSinceUpdate}s
                  </span>
                </>
              )}
            </div>
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
              <div className="text-sm text-gray-500">Total aujourd'hui</div>
            </div>
            {stats.cancelled > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <div className="text-sm text-gray-500">Annulés</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Carte ticket épurée et moderne avec estimation
const CleanTicketCard = ({ ticket, isMyTicket, position, estimatedWait, hasStatusChanged }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md
      ${config.bgClass}
      ${isMyTicket ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      ${hasStatusChanged ? 'animate-pulse border-orange-400' : ''}
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
              {hasStatusChanged && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full animate-pulse">
                  Nouveau
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
        
        {/* Estimation et temps d'attente */}
        {ticket.status === "en_attente" && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="font-medium text-blue-700">
                {formatWaitingTime(ticket.createdAt)}
              </span>
            </div>
            {estimatedWait > 0 && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-orange-600 font-medium">
                  {formatEstimatedTime(estimatedWait)}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Interface principale avec vue liste épurée
const Queue = () => {
  // ===== HOOKS D'ÉTAT (toujours en premier) =====
  const [viewMode, setViewMode] = useState('all'); // 'all', 'waiting', 'consultation'
  const [myId, setMyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [recentChanges, setRecentChanges] = useState(new Set());
  
  // ===== HOOKS PERSONNALISÉS (toujours dans le même ordre) =====
  const { 
    toasts, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showImportant, 
    removeToast,
    testSound,
    initializeAudio
  } = useToast();

  // ===== CALLBACKS =====
  // Gestion des changements de statut en temps réel
  const handleStatusChanges = useCallback((changes) => {
    changes.forEach(change => {
      // Marquer le ticket comme ayant changé récemment
      setRecentChanges(prev => new Set([...prev, change.ticket._id]));
      
      // Supprimer le marquage après 5 secondes
      setTimeout(() => {
        setRecentChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(change.ticket._id);
          return newSet;
        });
      }, 5000);

      // Notification selon le type de changement
      switch (change.type) {
        case 'new':
          showInfo(change.message, 4000, true);
          break;
        case 'removed':
          showWarning(change.message, 5000, true);
          break;
        case 'status_change':
          if (change.isImportant) {
            showImportant(change.message);
          } else {
            showSuccess(change.message, 4000, true);
          }
          break;
        default:
          showInfo(change.message, 3000);
      }
    });
  }, [showSuccess, showError, showWarning, showInfo, showImportant]);

  // ===== HOOK TEMPS RÉEL =====
  // Utiliser le hook temps réel (toujours après les autres hooks)
  const {
    queue,
    isLoading,
    error,
    lastUpdate,
    stats,
    forceUpdate,
    getPosition,
    getEstimatedWait
  } = useRealTimeQueue(handleStatusChanges);

  // ===== EFFETS =====
  // Timer pour l'horloge
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Initialiser l'audio après la première interaction utilisateur
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [initializeAudio]);

  // Charger l'ID du ticket utilisateur
  useEffect(() => {
    const storedTicket = localStorage.getItem("lineup_ticket");
    if (storedTicket) {
      try {
        const parsed = JSON.parse(storedTicket);
        setMyId(parsed._id || parsed.userId || parsed.sessionId);
      } catch (e) {
        localStorage.removeItem("lineup_ticket");
      }
    }
  }, []);

  // Notification de bienvenue avec conseils audio
  useEffect(() => {
    const timer = setTimeout(() => {
      showInfo('💡 Astuce: Cliquez sur "🔊 Test son" pour activer les notifications audio', 6000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [showInfo]);

  // ===== LOGIQUE DE RENDU =====
  // Filtrer les tickets selon le mode de vue
  const filteredTickets = queue.filter(ticket => {
    switch (viewMode) {
      case 'waiting': return ticket.status === 'en_attente';
      case 'consultation': return ticket.status === 'en_consultation';
      case 'completed': return ['termine', 'desiste'].includes(ticket.status);
      default: return true;
    }
  });

  if (isLoading) {
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
          <CleanHeader 
            stats={stats} 
            currentTime={currentTime} 
            lastUpdate={lastUpdate}
            error={error}
          />
          
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
                  Tous ({queue.length})
                </button>
                <button
                  onClick={() => setViewMode('waiting')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'waiting' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En attente ({stats.waiting})
                </button>
                <button
                  onClick={() => setViewMode('consultation')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'consultation' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En consultation ({stats.inConsultation})
                </button>
                <button
                  onClick={() => setViewMode('completed')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'completed' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Terminés ({stats.completed + stats.cancelled})
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-3">
                {/* Indicateur de position personnelle */}
                {myId && getPosition(myId) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <span className="text-blue-800 font-medium">
                      Votre position: #{getPosition(myId)}
                    </span>
                    {getEstimatedWait(getPosition(myId)) > 0 && (
                      <span className="text-blue-600 ml-2">
                        (~{formatEstimatedTime(getEstimatedWait(getPosition(myId)))})
                      </span>
                    )}
                  </div>
                )}
                
                {/* Bouton test audio */}
                <button
                  onClick={() => {
                    initializeAudio();
                    testSound('success');
                    showInfo('🔊 Test audio effectué !');
                  }}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg border border-green-300 transition-colors"
                  title="Tester les notifications audio"
                >
                  🔊 Test son
                </button>
                
                {/* Bouton de mise à jour manuelle */}
                <button
                  onClick={forceUpdate}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
                  title="Actualiser manuellement"
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <NetworkError 
                error={error}
                onRetry={forceUpdate}
                isConnected={stats.total > 0} // Si on a des données, c'est que la connexion fonctionne partiellement
              />
            )}

            {/* Liste des tickets */}
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {viewMode === 'waiting' && '⏱️'}
                    {viewMode === 'consultation' && '🩺'}
                    {viewMode === 'completed' && '✅'}
                    {viewMode === 'all' && '🏥'}
                  </div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    {viewMode === 'waiting' && 'Aucun patient en attente'}
                    {viewMode === 'consultation' && 'Aucune consultation en cours'}
                    {viewMode === 'completed' && 'Aucune consultation terminée'}
                    {viewMode === 'all' && 'Aucun ticket aujourd\'hui'}
                  </h3>
                  <p className="text-gray-500">
                    {viewMode === 'waiting' && 'La file d\'attente est vide pour le moment'}
                    {viewMode === 'consultation' && 'Aucun patient en consultation actuellement'}
                    {viewMode === 'completed' && 'Aucune consultation terminée aujourd\'hui'}
                    {viewMode === 'all' && 'Aucun patient n\'a pris de ticket aujourd\'hui'}
                  </p>
                </div>
              ) : (
                filteredTickets
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map((ticket) => {
                    const position = ticket.status === 'en_attente' ? getPosition(ticket._id) : null;
                    const estimatedWait = position ? getEstimatedWait(position) : 0;
                    
                    return (
                      <CleanTicketCard
                        key={ticket._id}
                        ticket={ticket}
                        isMyTicket={ticket._id === myId}
                        position={position}
                        estimatedWait={estimatedWait}
                        hasStatusChanged={recentChanges.has(ticket._id)}
                      />
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Toasts pour les notifications */}
        <Toast toasts={toasts} removeToast={removeToast} />
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
