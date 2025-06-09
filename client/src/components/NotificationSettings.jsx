import { useState, useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../hooks/useToast';

export default function NotificationSettings() {
  const { 
    isSupported, 
    isSubscribed, 
    isLoading, 
    lastError, 
    subscription,
    subscribe, 
    unsubscribe, 
    refreshStatus 
  } = usePushNotifications();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Animation de transition pour les changements d'état
  const [statusTransition, setStatusTransition] = useState('');

  useEffect(() => {
    // Animation visuelle lors du changement d'état
    if (isSubscribed) {
      setStatusTransition('animate-pulse');
      setTimeout(() => setStatusTransition(''), 1000);
    }
  }, [isSubscribed]);

  const handleToggleNotifications = async () => {
    setLocalLoading(true);
    
    try {
      let result;
      if (isSubscribed) {
        // Feedback visuel immédiat pour la désactivation
        showToast('Désactivation des notifications...', 'info');
        result = await unsubscribe();
      } else {
        // Feedback visuel immédiat pour l'activation
        showToast('Activation des notifications...', 'info');
        result = await subscribe();
      }

      if (result.success) {
        showToast(result.message, 'success');
        
        // Animation de succès
        setStatusTransition('animate-bounce');
        setTimeout(() => setStatusTransition(''), 1000);
      } else {
        showToast(result.message, 'error');
        
        // En cas d'erreur, forcer une vérification du statut
        setTimeout(() => {
          refreshStatus();
        }, 500);
      }
    } catch (error) {
      showToast('Erreur lors de la gestion des notifications', 'error');
      // Vérification de récupération
      setTimeout(() => {
        refreshStatus();
      }, 500);
    } finally {
      setLocalLoading(false);
    }
  };

  // Gestion manuelle du rafraîchissement pour debug
  const handleRefreshStatus = async () => {
    setLocalLoading(true);
    await refreshStatus();
    showToast('Statut rafraîchi', 'info');
    setLocalLoading(false);
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm text-yellow-800">
            Les notifications push ne sont pas supportées sur ce navigateur
          </span>
        </div>
      </div>
    );
  }

  const isActuallyLoading = isLoading || localLoading;
  const statusColor = isSubscribed ? 'bg-green-500' : 'bg-gray-300';
  const statusText = isSubscribed ? 'Activées' : 'Désactivées';

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* En-tête avec statut réactif */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg">
              {isActuallyLoading ? '⏳' : isSubscribed ? '🔔' : '🔕'}
            </span>
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">Notifications Push</h3>
            <p className={`text-sm transition-colors duration-300 ${
              isSubscribed ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isActuallyLoading ? 'Traitement...' : statusText}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${statusColor} ${statusTransition}`}></div>
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Contenu détaillé */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            
            {/* Affichage des erreurs */}
            {lastError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">❌</span>
                  <span className="text-sm text-red-800">{lastError}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                Recevez des notifications instantanées pour :
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Votre tour dans la file d'attente</li>
                <li>Changements de statut de votre ticket</li>
                <li>Messages importants du cabinet</li>
                <li>Rappels de rendez-vous</li>
              </ul>
            </div>

            {/* Bouton d'action avec feedback visuel amélioré */}
            <button
              onClick={handleToggleNotifications}
              disabled={isActuallyLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSubscribed
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              } ${isActuallyLoading ? 'opacity-50 cursor-not-allowed' : 'transform active:scale-95'}`}
            >
              {isActuallyLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <span>{isSubscribed ? '🔕' : '🔔'}</span>
                  <span>
                    {isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
                  </span>
                </>
              )}
            </button>

            {/* Information technique avec statut en temps réel */}
            {isSubscribed && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 space-y-2">
                <p className="flex items-center space-x-1">
                  <span>✅</span>
                  <span>Notifications activées et synchronisées</span>
                </p>
                <p className="text-gray-400">
                  Endpoint: ...{subscription?.endpoint?.substring(subscription.endpoint.length - 20) || 'N/A'}
                </p>
              </div>
            )}

            {/* Panel de développement pour debug */}
            {process.env.NODE_ENV === 'development' && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 space-y-2">
                  <p><strong>Debug:</strong></p>
                  <p>Support: {isSupported ? '✅' : '❌'}</p>
                  <p>Abonné: {isSubscribed ? '✅' : '❌'}</p>
                  <p>Loading: {isActuallyLoading ? '✅' : '❌'}</p>
                  <button
                    onClick={handleRefreshStatus}
                    disabled={isActuallyLoading}
                    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    🔄 Rafraîchir statut
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 