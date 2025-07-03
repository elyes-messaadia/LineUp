import { useState } from 'react';

export default function QueueDebugPanel({ queue, selectedDoctor, stats, lastUpdate, error }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition"
          title="Debug Queue"
        >
          🐛
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-300 rounded-lg p-4 shadow-xl z-50 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-purple-800">🐛 Queue Debug</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Docteur sélectionné:</strong> {selectedDoctor || 'Tous'}
        </div>
        
        <div>
          <strong>Tickets chargés:</strong> {queue.length}
        </div>
        
        <div>
          <strong>Dernière MAJ:</strong> {new Date(lastUpdate).toLocaleTimeString()}
        </div>
        
        {error && (
          <div className="text-red-600">
            <strong>Erreur:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>Stats:</strong>
          <ul className="ml-4 text-xs">
            <li>En attente: {stats.waiting}</li>
            <li>En consultation: {stats.inConsultation}</li>
            <li>Terminé: {stats.completed}</li>
          </ul>
        </div>
        
        <div>
          <strong>Tickets détaillés:</strong>
          <div className="max-h-32 overflow-y-auto text-xs bg-gray-50 p-2 rounded">
            {queue.length === 0 ? (
              <div className="text-gray-500">Aucun ticket</div>
            ) : (
              queue.map(ticket => (
                <div key={ticket._id} className="border-b border-gray-200 pb-1 mb-1">
                  <div>#{ticket.number} - {ticket.docteur}</div>
                  <div className="text-gray-600">Status: {ticket.status}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 