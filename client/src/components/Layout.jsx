import Footer from './Footer';
import Header from './Header';

export default function Layout({ children, hideTitle = false, fullscreen = false }) {
  // Version fullscreen pour desktop (Queue page)
  if (fullscreen) {
    return (
      <div className="min-h-screen 
                      bg-gradient-to-br from-primary-50 via-white to-accent-50/30
                      overflow-hidden animate-fade-in">
        {children}
      </div>
    );
  }

  // Version optimisée pour iPhone et anciens modèles
  return (
    <div className="min-h-screen 
                    bg-gradient-to-br from-primary-50 via-white to-accent-50/30
                    text-center 
                    px-2 xs:px-3 se:px-4 sm:px-6 
                    py-3 xs:py-4 sm:py-8 
                    flex flex-col items-center 
                    pb-safe-bottom pb-16 se:pb-18 sm:pb-20 
                    overflow-x-hidden old-device-optimized
                    animate-fade-in">
      <Header hideTitle={hideTitle} />
      <main 
        className="w-full 
                   legacy-container
                   max-w-xs xs:max-w-sm se:max-w-md lg:max-w-lg 
                   flex-1"
        role="main"
        aria-label="Contenu principal"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
