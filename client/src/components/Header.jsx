import { useNavigate, useLocation } from 'react-router-dom';
import Title from './Title';
import { Home, ArrowLeft, Ticket as TicketIcon } from 'lucide-react';

export default function Header({ hideTitle = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  if (hideTitle) return null;
  
  const canGoBack = location.pathname !== '/' && window.history.length > 1;
  
  return (
    <header className="mb-2 xs:mb-3 se:mb-4 sm:mb-6 w-full old-device-optimized" role="banner">
      <div className="flex items-center justify-between mb-1 xs:mb-2 se:mb-3 sm:mb-4">
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 
                       px-2 py-1 xs:py-2 se:px-3 se:py-2 
                       bg-gray-100 hover:bg-gray-200 text-gray-800 
                       rounded border border-gray-300 
                       transition-colors duration-200 
                       text-xs se:text-sm font-medium 
                       min-h-touch iphone-se-friendly"
            aria-label="Retour à la page précédente"
            title="Retour à la page précédente"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Retour</span>
          </button>
        )}
        
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 
                     px-2 py-1 xs:py-2 se:px-3 se:py-2 
                     bg-blue-100 hover:bg-blue-200 text-blue-800 
                     rounded border border-blue-300 
                     transition-colors duration-200 
                     text-xs se:text-sm font-medium ml-auto 
                     min-h-touch iphone-se-friendly"
          aria-label="Retour à l'accueil"
          title="Retour à l'accueil"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline">Accueil</span>
        </button>
      </div>
      
      <Title left="Ticket" icon={<TicketIcon className="w-6 h-6 inline" />} />
    </header>
  );
} 