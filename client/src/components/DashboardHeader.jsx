import PropTypes from 'prop-types';

// Composant d'en-tête unifié pour tous les dashboards
const DashboardHeader = ({ 
  title, 
  subtitle, 
  icon, 
  user, 
  onLogout, 
  colorScheme = 'blue',
  actions = null 
}) => {
  
  // Configuration des couleurs par rôle
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      titleColor: 'text-blue-800',
      subtitleColor: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      titleColor: 'text-green-800',
      subtitleColor: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      titleColor: 'text-purple-800',
      subtitleColor: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      titleColor: 'text-orange-800',
      subtitleColor: 'text-orange-600'
    }
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.blue;

  // Fonction pour obtenir le nom d'affichage de l'utilisateur
  const getDisplayName = (user) => {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    if (user.email) return user.email.split('@')[0];
    return 'utilisateur';
  };

  return (
    <div className={`${colors.bg} ${colors.border} dashboard-header`}>
      <div className="dashboard-header-content">
        <div className="min-w-0 flex-1">
          <h1 className={`dashboard-title ${colors.titleColor}`}>
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </h1>
          {subtitle && (
            <p className={`dashboard-subtitle ${colors.subtitleColor}`}>
              {subtitle.replace('{user}', getDisplayName(user))}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Actions personnalisées */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
          
          {/* Bouton de déconnexion */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="
                text-xs sm:text-sm text-red-600 hover:text-red-800 
                bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg border border-red-200
                transition-colors touch-target-large legacy-button flex-shrink-0
              "
              title="Se déconnecter"
            >
              <span className="block sm:hidden">🚪</span>
              <span className="hidden sm:block">🔒 Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

DashboardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  user: PropTypes.object,
  onLogout: PropTypes.func,
  colorScheme: PropTypes.oneOf(['blue', 'green', 'purple', 'orange']),
  actions: PropTypes.node
};

export default DashboardHeader; 