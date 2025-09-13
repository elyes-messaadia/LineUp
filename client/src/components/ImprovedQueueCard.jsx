import { getDoctorDisplayName, getDoctorById } from '../config/doctors';
import { formatTime } from '../utils/dateUtils';

const formatWaitingTime = (createdAt) => {
  if (!createdAt) return '';
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'maintenant';
  if (diffMins < 60) return `${diffMins}min`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
};

const formatEstimatedTime = (minutes) => {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes}min d'attente`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''} d'attente`;
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'en_attente':
      return {
        icon: '⏱️',
        label: 'En attente',
        bgClass: 'bg-info-50/80 border-info-200',
        badgeClass: 'bg-info-100 text-info-700',
        textClass: 'text-info-800'
      };
    case 'en_consultation':
      return {
        icon: '🩺',
        label: 'En consultation',
        bgClass: 'bg-success-50/80 border-success-200',
        badgeClass: 'bg-success-100 text-success-700',
        textClass: 'text-success-800'
      };
    case 'termine':
      return {
        icon: '✅',
        label: 'Terminé',
        bgClass: 'bg-secondary-50/80 border-secondary-200',
        badgeClass: 'bg-secondary-100 text-secondary-700',
        textClass: 'text-secondary-700'
      };
    case 'desiste':
      return {
        icon: '❌',
        label: 'Annulé',
        bgClass: 'bg-error-50/80 border-error-200',
        badgeClass: 'bg-error-100 text-error-700',
        textClass: 'text-error-800'
      };
    default:
      return {
        icon: '❓',
        label: status,
        bgClass: 'bg-secondary-50/80 border-secondary-200',
        badgeClass: 'bg-secondary-100 text-secondary-700',
        textClass: 'text-secondary-700'
      };
  }
};

const ImprovedQueueCard = ({ 
  ticket, 
  isMyTicket = false, 
  position = null, 
  estimatedWait = 0, 
  hasStatusChanged = false,
  showDetailedDoctorInfo = true 
}) => {
  const config = getStatusConfig(ticket.status);
  const doctor = getDoctorById(ticket.docteur);
  const doctorName = getDoctorDisplayName(ticket.docteur);
  
  return (
    <div className={`
      relative rounded-xl border-2 p-4 sm:p-6 transition-all duration-300 shadow-sm hover:shadow-md
      ${config.bgClass}
      ${isMyTicket ? 'ring-2 ring-blue-400 ring-offset-2 transform scale-[1.02]' : ''}
      ${hasStatusChanged ? 'border-orange-400 shadow-lg' : ''}
      ${position === 1 ? 'border-green-400 shadow-lg bg-green-50' : ''}
    `}>
      
      {/* Badge "Mon ticket" */}
      {isMyTicket && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          👤 MON TICKET
        </div>
      )}

      {/* Badge "Suivant" */}
      {position === 1 && !isMyTicket && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
          🔥 SUIVANT
        </div>
      )}

      {/* Header du ticket */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        
        {/* Informations principales */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="text-3xl sm:text-4xl flex-shrink-0">{config.icon}</div>
          
          <div className="min-w-0 flex-1">
            {/* Numéro et position */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                Ticket #{ticket.number}
              </span>
              
              {position && (
                <span className={`
                  px-2 py-1 rounded-full text-xs font-bold
                  ${position === 1 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : position <= 3 
                      ? 'bg-orange-100 text-orange-800 border border-orange-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }
                `}>
                  Position #{position}
                </span>
              )}
              
              {hasStatusChanged && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full border border-orange-300 animate-bounce">
                  🆕 Nouveau
                </span>
              )}
            </div>
            
            {/* Informations docteur améliorées */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{doctor?.emoji || '👨‍⚕️'}</span>
                <span className="font-semibold text-gray-900">
                  {doctorName}
                </span>
              </div>
              
              {showDetailedDoctorInfo && doctor?.specialite && (
                <div className="text-sm text-gray-600 ml-6">
                  📋 {doctor.specialite}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Badge de statut */}
        <div className={`
          px-4 py-2 rounded-full text-sm font-medium text-center sm:text-left
          ${config.badgeClass} flex-shrink-0 border border-opacity-30
        `}>
          {config.label}
        </div>
      </div>

      {/* Informations temporelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        
        {/* Heure de création */}
        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-200">
          <div className="text-gray-600 text-xs font-medium mb-1">Créé à</div>
          <div className="font-semibold text-gray-900">
            🕐 {formatTime(ticket.createdAt)}
          </div>
        </div>
        
        {/* Temps d'attente actuel */}
        {ticket.status === "en_attente" && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
            <div className="text-blue-600 text-xs font-medium mb-1">Temps d'attente</div>
            <div className="font-semibold text-blue-900">
              ⏱️ {formatWaitingTime(ticket.createdAt)}
            </div>
          </div>
        )}
        
        {/* Estimation */}
        {ticket.status === "en_attente" && estimatedWait > 0 && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-orange-200">
            <div className="text-orange-600 text-xs font-medium mb-1">Estimation</div>
            <div className="font-semibold text-orange-900">
              📊 {formatEstimatedTime(estimatedWait)}
            </div>
          </div>
        )}
        
        {/* Statut spéciaux */}
        {ticket.status === "en_consultation" && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-200 sm:col-span-2 lg:col-span-1">
            <div className="text-green-600 text-xs font-medium mb-1">Consultation</div>
            <div className="font-semibold text-green-900">
              🩺 En cours actuellement
            </div>
          </div>
        )}
        
        {ticket.status === "termine" && (
          <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs font-medium mb-1">Terminé à</div>
            <div className="font-semibold text-gray-900">
              ✅ {formatTime(ticket.updatedAt || ticket.createdAt)}
            </div>
          </div>
        )}
      </div>

      {/* Messages d'encouragement */}
      {position === 1 && (
        <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
          <div className="text-green-800 font-medium text-center">
            🎯 C'est votre tour ! Préparez-vous à être appelé
          </div>
        </div>
      )}
      
      {position === 2 && (
        <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
          <div className="text-orange-800 font-medium text-center">
            ⚡ Vous êtes le prochain ! Restez à proximité
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedQueueCard; 