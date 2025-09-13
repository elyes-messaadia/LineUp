import { useNavigate, useLocation } from "react-router-dom";
import Title from "./Title";

export default function Header({ hideTitle = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (hideTitle) return null;

  const canGoBack = location.pathname !== "/" && window.history.length > 1;

  return (
    <header
      className="mb-2 xs:mb-3 se:mb-4 sm:mb-6 w-full old-device-optimized"
      role="banner"
    >
      <div className="flex items-center justify-between mb-1 xs:mb-2 se:mb-3 sm:mb-4">
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 
                       px-3 py-2 xs:py-2 se:px-4 se:py-3 
                       bg-secondary-50 hover:bg-secondary-100 text-secondary-700 
                       rounded-lg shadow-subtle hover:shadow-mobile
                       transition-all duration-300 ease-smooth
                       text-xs se:text-sm font-medium 
                       min-h-touch iphone-se-friendly
                       transform hover:scale-105 active:scale-95"
            aria-label="Retour à la page précédente"
            title="Retour à la page précédente"
          >
            <span className="text-sm">←</span>
            <span className="hidden md:inline">Retour</span>
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 
                     px-3 py-2 xs:py-2 se:px-4 se:py-3 
                     bg-primary-50 hover:bg-primary-100 text-primary-700 
                     rounded-lg shadow-subtle hover:shadow-mobile
                     transition-all duration-300 ease-smooth
                     text-xs se:text-sm font-medium ml-auto 
                     min-h-touch iphone-se-friendly
                     transform hover:scale-105 active:scale-95"
          aria-label="Retour à l'accueil"
          title="Retour à l'accueil"
        >
          <span className="text-sm">🏠</span>
          <span className="hidden md:inline">Accueil</span>
        </button>
      </div>

      <Title left="Ticket" emoji="🎫" />
    </header>
  );
}
