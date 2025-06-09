import { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../hooks/useToast';

export default function NotificationSettings() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const { showToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleNotifications = async () => {
    try {
      let result;
      if (isSubscribed) {
        result = await unsubscribe();
      } else {
        result = await subscribe();
      }

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Erreur lors de la gestion des notifications', 'error');
    }
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

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* En-tête */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🔔</span>
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900">Notifications Push</h3>
            <p className="text-sm text-gray-500">
              {isSubscribed ? 'Activées' : 'Désactivées'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {/* Contenu détaillé */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-4">
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

            {/* Bouton d'action */}
            <button
              onClick={handleToggleNotifications}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                isSubscribed
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
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

            {/* Information technique */}
            {isSubscribed && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                <p className="flex items-center space-x-1">
                  <span>✅</span>
                  <span>Notifications activées et synchronisées</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 