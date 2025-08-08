export default function NetworkError({ error, onRetry, isConnected = false }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-4xl mb-4">
          {isConnected ? '' : ''}
        </div>
        
        <h3 className="text-lg font-bold text-red-800 mb-2">
          {isConnected ? 'Problème de connexion' : 'Connexion perdue'}
        </h3>
        
        <p className="text-red-700 mb-4 text-sm leading-relaxed">
          {error.includes('CORS') 
            ? 'Problème de configuration du serveur. Veuillez contacter l\'administrateur.'
            : error.includes('Failed to fetch')
            ? 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
            : `Erreur: ${error}`
          }
        </p>

        {onRetry && (
          <div className="space-y-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg border border-red-300 transition-colors touch-target-large font-medium"
            >
              Réessayer
            </button>
            
            <div className="text-xs text-red-600">
              La connexion sera tentée automatiquement toutes les 10 secondes
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 