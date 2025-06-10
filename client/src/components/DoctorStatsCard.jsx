import { getDoctorDisplayName, getDoctorById } from '../config/doctors';

const DoctorStatsCard = ({ doctorId, stats, currentPatient, nextPatient }) => {
  const doctor = getDoctorById(doctorId);
  const doctorName = getDoctorDisplayName(doctorId);
  
  if (!doctor) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
        <div className="text-gray-500 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="font-medium">Docteur inconnu</div>
          <div className="text-sm">ID: {doctorId}</div>
        </div>
      </div>
    );
  }

  const waiting = stats?.en_attente || 0;
  const inConsultation = stats?.en_consultation || 0;
  const completed = stats?.termine || 0;
  const cancelled = stats?.desiste || 0;
  const total = stats?.total || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
      
      {/* Header avec info docteur */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{doctor.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg truncate">
              {doctorName}
            </h3>
            <p className="text-sm text-gray-600">{doctor.specialite}</p>
          </div>
          {doctor.disponible ? (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              ✅ Disponible
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              ❌ Indisponible
            </span>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-xl font-bold text-blue-600">{waiting}</div>
            <div className="text-xs text-gray-600">En attente</div>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="text-xl font-bold text-green-600">{inConsultation}</div>
            <div className="text-xs text-gray-600">En consultation</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="text-xl font-bold text-gray-600">{completed}</div>
            <div className="text-xs text-gray-600">Terminés</div>
          </div>
          <div className="text-center bg-red-50 rounded-lg p-3 border border-red-100">
            <div className="text-xl font-bold text-red-600">{cancelled}</div>
            <div className="text-xs text-gray-600">Annulés</div>
          </div>
        </div>

        {/* Total */}
        <div className="text-center bg-indigo-50 rounded-lg p-3 border border-indigo-100 mb-4">
          <div className="text-lg font-bold text-indigo-600">{total}</div>
          <div className="text-xs text-gray-600">Total aujourd'hui</div>
        </div>

        {/* État actuel */}
        <div className="space-y-3">
          {/* Patient en consultation */}
          {currentPatient ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800">🩺 En consultation</div>
                  <div className="text-sm text-green-600">
                    Ticket #{currentPatient.number}
                  </div>
                </div>
                <div className="text-xs text-green-600">
                  Depuis {new Date(currentPatient.updatedAt || currentPatient.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-center text-gray-500">
                <div className="font-medium">💤 Aucune consultation</div>
                <div className="text-sm">Libre actuellement</div>
              </div>
            </div>
          )}

          {/* Prochain patient */}
          {nextPatient ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-orange-800">⏱️ Prochain patient</div>
                  <div className="text-sm text-orange-600">
                    Ticket #{nextPatient.number}
                  </div>
                </div>
                <div className="text-xs text-orange-600">
                  Attend depuis {new Date(nextPatient.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ) : waiting > 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-center text-blue-600">
                <div className="font-medium">📋 File d'attente</div>
                <div className="text-sm">{waiting} patient{waiting > 1 ? 's' : ''} en attente</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-center text-gray-500">
                <div className="font-medium">🎯 File vide</div>
                <div className="text-sm">Aucun patient en attente</div>
              </div>
            </div>
          )}
        </div>

        {/* Barre de progression de la journée */}
        {total > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progression de la journée</span>
              <span>{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completed / total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorStatsCard; 