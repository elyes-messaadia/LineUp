import { useEffect, useState, useCallback } from "react";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import NetworkError from "../components/NetworkError";
import DoctorQueueSelector from "../components/DoctorQueueSelector";
import ImprovedQueueCard from "../components/ImprovedQueueCard";
import QueueDebugPanel from "../components/QueueDebugPanel";
import { useToast } from "../hooks/useToast";
import { useRealTimeQueue } from "../hooks/useRealTimeQueue";
import Title from "../components/Title";
import BACKEND_URL from "../config/api";
import { getDoctorDisplayName } from "../config/doctors";
import { formatTime } from "../utils/dateUtils";

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

// Header moderne et épuré avec indicateurs temps réel - VERSION RESPONSIVE
const CleanHeader = ({ stats, currentTime, lastUpdate, error }) => {
  const timeSinceUpdate = Math.floor((currentTime - lastUpdate) / 1000);
  const isStale = timeSinceUpdate > 10; // Plus de 10 secondes

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 legacy-container">
        
        {/* Layout responsive: stack sur mobile, côte à côte sur desktop */}
        <div className="space-y-6 lg:space-y-0">
          
          {/* Titre principal avec statut connexion */}
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 legacy-text-primary">
              File d'Attente Médicale
            </h1>
            
            {/* Indicateurs de connexion - Stack sur très petits écrans */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {/* Indicateur de connexion */}
              <div className="flex items-center space-x-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  error ? 'bg-red-500' : 
                  isStale ? 'bg-yellow-500' : 
                  'bg-green-500 old-android-safe'
                }`}></span>
                <span className="text-gray-600 text-mobile-readable">
                  {error ? 'Connexion impossible' :
                   isStale ? 'Connexion lente' :
                   'Temps réel'}
                </span>
              </div>
              
              {/* Séparateur - caché sur très petits écrans */}
              <span className="text-gray-300 hidden sm:inline">•</span>
              
              {/* Heure de dernière mise à jour */}
              <span className="text-gray-500 font-mono text-xs sm:text-sm text-mobile-readable">
                Mis à jour: {formatTime(lastUpdate)}
              </span>
              
              {/* Temps écoulé - affiché conditionnellement */}
              {timeSinceUpdate > 0 && (
                <>
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    il y a {timeSinceUpdate}s
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Statistiques - Grid responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-6">
            <div className="text-center bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-100">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.waiting}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 legacy-text-secondary">En attente</div>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-3 sm:p-4 border border-green-100">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.inConsultation}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 legacy-text-secondary">En consultation</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-100 col-span-2 sm:col-span-1">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1 legacy-text-secondary">Total aujourd'hui</div>
            </div>
            {stats.cancelled > 0 && (
              <div className="text-center bg-red-50 rounded-lg p-3 sm:p-4 border border-red-100 col-span-2 sm:col-span-3 lg:col-span-1">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{stats.cancelled}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1 legacy-text-secondary">Annulés</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Carte ticket épurée et moderne avec estimation - VERSION RESPONSIVE
const CleanTicketCard = ({ ticket, isMyTicket, position, estimatedWait, hasStatusChanged }) => {
  const config = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.en_attente;
  
  return (
    <div className={`
      relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md
      ${config.bgClass}
      ${isMyTicket ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
      ${hasStatusChanged ? 'border-orange-400' : ''}
      old-device-optimized legacy-container
    `}>
      
      {/* Header du ticket - Layout responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="text-xl sm:text-2xl flex-shrink-0">{config.icon}</div>
          <div className="min-w-0 flex-1">
            {/* Numéro et badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-lg sm:text-xl font-bold text-gray-900 legacy-text-primary">
                #{ticket.number}
              </span>
              {isMyTicket && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0">
                  Vous
                </span>
              )}
              {hasStatusChanged && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full flex-shrink-0">
                  Nouveau
                </span>
              )}
            </div>
            {/* Docteur */}
            <div className="text-xs sm:text-sm text-gray-500 legacy-text-secondary truncate">
              👨‍⚕️ {getDoctorDisplayName(ticket.docteur) || 'Docteur général'}
            </div>
          </div>
        </div>
        
        {/* Badge de statut - Pleine largeur sur mobile */}
        <div className={`
          px-3 py-2 rounded-full text-xs sm:text-sm font-medium text-center sm:text-left
          ${config.badgeClass} flex-shrink-0
        `}>
          {config.label}
        </div>
      </div>

      {/* Informations additionnelles - Stack sur mobile */}
      <div className="space-y-3 sm:space-y-0">
        {/* Première ligne d'informations */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          {position && (
            <span className="font-medium bg-white px-2 py-1 rounded border border-gray-200">
              Position: {position}
            </span>
          )}
          <span className="text-mobile-readable">
            Créé: {formatTime(ticket.createdAt)}
          </span>
        </div>
        
        {/* Estimation et temps d'attente - Deuxième ligne sur mobile */}
        {ticket.status === "en_attente" && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded border border-blue-200">
              <span className="w-2 h-2 bg-blue-500 rounded-full old-android-safe flex-shrink-0"></span>
              <span className="font-medium text-blue-700 text-xs sm:text-sm">
                {formatWaitingTime(ticket.createdAt)}
              </span>
            </div>
            {estimatedWait > 0 && (
              <div className="flex items-center space-x-1 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                <span className="text-orange-600 font-medium text-xs sm:text-sm">
                  {formatEstimatedTime(estimatedWait)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Statut spécial pour consultations/terminées */}
        {ticket.status === "en_consultation" && (
          <div className="bg-green-50 border border-green-200 rounded px-3 py-2 mt-2">
            <span className="text-green-700 font-medium text-xs sm:text-sm">
              🩺 En consultation actuellement
            </span>
          </div>
        )}
        
        {ticket.status === "termine" && (
          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 mt-2">
            <span className="text-gray-600 font-medium text-xs sm:text-sm">
              ✅ Consultation terminée à {formatTime(ticket.updatedAt || ticket.createdAt)}
            </span>
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
  const [selectedDoctor, setSelectedDoctor] = useState(null); // null = toutes les files
  
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
  // Gestion des changements de statut en temps réel (optimisée)
  const handleStatusChanges = useCallback((changes) => {
    // Éviter les mises à jour trop fréquentes
    if (changes.length === 0) return;
    
    changes.forEach(change => {
      // Marquer le ticket comme ayant changé récemment
      setRecentChanges(prev => new Set([...prev, change.ticket._id]));
      
      // Supprimer le marquage après 3 secondes pour réduire les animations
      setTimeout(() => {
        setRecentChanges(prev => {
          const newSet = new Set(prev);
          newSet.delete(change.ticket._id);
          return newSet;
        });
      }, 3000);

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
    isTransitioning,
    error,
    lastUpdate,
    stats,
    forceUpdate,
    getPosition,
    getEstimatedWait
  } = useRealTimeQueue(handleStatusChanges, selectedDoctor);

  // ===== EFFETS =====
  // Timer pour l'horloge (optimisé)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // Mise à jour toutes les 5 secondes au lieu de chaque seconde
    
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 legacy-container">
            
            {/* Sélecteur de file d'attente par docteur */}
            <DoctorQueueSelector 
              selectedDoctor={selectedDoctor}
              onDoctorChange={setSelectedDoctor}
            />
            
            {/* Indicateur de transition pour changement de médecin */}
            {isTransitioning && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin text-xl">🔄</div>
                  <div>
                    <h3 className="text-blue-800 font-medium">Changement de médecin en cours...</h3>
                    <p className="text-blue-600 text-sm">Transition optimisée activée - chargement quasi-instantané</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Section filtres et actions - Layout responsive */}
            <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between mb-6 sm:mb-8">
              
              {/* Filtres - Stack sur mobile, scroll horizontal si nécessaire */}
              <div className="w-full lg:w-auto">
                <div className="flex overflow-x-auto space-x-1 bg-white rounded-lg p-1 shadow-sm border legacy-nav">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`
                      px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-shrink-0 touch-target-large
                      ${viewMode === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="block sm:hidden">📊</span>
                    <span className="hidden sm:block">Tous ({queue.length})</span>
                  </button>
                  <button
                    onClick={() => setViewMode('waiting')}
                    className={`
                      px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-shrink-0 touch-target-large
                      ${viewMode === 'waiting' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="block sm:hidden">⏱️</span>
                    <span className="hidden sm:block">En attente ({stats.waiting})</span>
                  </button>
                  <button
                    onClick={() => setViewMode('consultation')}
                    className={`
                      px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-shrink-0 touch-target-large
                      ${viewMode === 'consultation' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="block sm:hidden">🩺</span>
                    <span className="hidden sm:block">En consultation ({stats.inConsultation})</span>
                  </button>
                  <button
                    onClick={() => setViewMode('completed')}
                    className={`
                      px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-shrink-0 touch-target-large
                      ${viewMode === 'completed' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="block sm:hidden">✅</span>
                    <span className="hidden sm:block">Terminés ({stats.completed + stats.cancelled})</span>
                  </button>
                </div>
              </div>
              
              {/* Actions - Stack sur mobile */}
              <div className="w-full lg:w-auto space-y-3 lg:space-y-0 lg:flex lg:items-center lg:space-x-3">
                
                {/* Indicateur de position personnelle - Pleine largeur sur mobile */}
                {myId && getPosition(myId) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 lg:py-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-center lg:text-left">
                      <span className="text-blue-800 font-medium text-sm sm:text-base">
                        Votre position: #{getPosition(myId)}
                      </span>
                      {getEstimatedWait(getPosition(myId)) > 0 && (
                        <span className="text-blue-600 text-xs sm:text-sm">
                          (~{formatEstimatedTime(getEstimatedWait(getPosition(myId)))})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Boutons d'action - Grid sur mobile */}
                <div className="grid grid-cols-2 lg:flex gap-2 lg:gap-3">
                  {/* Bouton test audio */}
                  <button
                    onClick={() => {
                      initializeAudio();
                      testSound('success');
                      showInfo('🔊 Test audio effectué !');
                    }}
                    className="
                      px-3 sm:px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 
                      rounded-lg border border-green-300 transition-colors text-xs sm:text-sm
                      touch-target-large legacy-button
                    "
                    title="Tester les notifications audio"
                  >
                    <span className="block sm:hidden">🔊</span>
                    <span className="hidden sm:block">🔊 Test son</span>
                  </button>
                  
                  {/* Bouton de mise à jour manuelle */}
                  <button
                    onClick={forceUpdate}
                    className="
                      px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 
                      rounded-lg border border-gray-300 transition-colors text-xs sm:text-sm
                      touch-target-large legacy-button
                    "
                    title="Actualiser manuellement"
                  >
                    <span className="block sm:hidden">🔄</span>
                    <span className="hidden sm:block">🔄 Actualiser</span>
                  </button>
                </div>
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

            {            /* Liste des tickets */}
            <div className="space-y-4 old-device-optimized queue-stable stable-layout">
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
                  .sort((a, b) => {
                    // Tri stable pour éviter les réordonnements constants
                    const dateA = new Date(a.createdAt).getTime();
                    const dateB = new Date(b.createdAt).getTime();
                    if (dateA !== dateB) return dateA - dateB;
                    // Tri secondaire par ID pour stabilité
                    return a._id.localeCompare(b._id);
                  })
                  .map((ticket) => {
                    const position = ticket.status === 'en_attente' ? getPosition(ticket._id) : null;
                    const estimatedWait = position ? getEstimatedWait(position) : 0;
                    
                    return (
                      <ImprovedQueueCard
                        key={`${ticket._id}-${ticket.status}-${ticket.updatedAt || ticket.createdAt}`}
                        ticket={ticket}
                        isMyTicket={ticket._id === myId}
                        position={position}
                        estimatedWait={estimatedWait}
                        hasStatusChanged={recentChanges.has(ticket._id)}
                        showDetailedDoctorInfo={true}
                      />
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Toasts pour les notifications */}
        <Toast toasts={toasts} removeToast={removeToast} />

        {/* Debug Panel temporaire */}
        <QueueDebugPanel 
          queue={queue}
          selectedDoctor={selectedDoctor}
          stats={stats}
          lastUpdate={lastUpdate}
          error={error}
        />
      </AnimatedPage>
    </Layout>
  );
};

export default Queue;
