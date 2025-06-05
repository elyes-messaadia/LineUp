import { useNavigate, useLocation } from 'react-router-dom';
import Title from './Title';

export default function Header({ hideTitle = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  if (hideTitle) return null;
  
  const canGoBack = location.pathname !== '/' && window.history.length > 1;
  
  return (
    <header className="mb-4 sm:mb-6 w-full" role="banner">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg border border-gray-300 gentle-transition text-xs sm:text-sm font-medium"
            aria-label="Retour à la page précédente"
            title="Retour à la page précédente"
          >
            <span className="text-sm sm:text-lg">←</span>
            <span className="hidden xs:inline">Retour</span>
          </button>
        )}
        
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg border border-blue-300 gentle-transition text-xs sm:text-sm font-medium ml-auto"
          aria-label="Retour à l'accueil"
          title="Retour à l'accueil"
        >
          <span className="text-sm sm:text-lg">🏠</span>
          <span className="hidden xs:inline">Accueil</span>
        </button>
      </div>
      
      <Title />
    </header>
  );
} 