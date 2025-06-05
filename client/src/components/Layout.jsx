import Footer from './Footer';
import Header from './Header';

export default function Layout({ children, hideTitle = false, fullscreen = false }) {
  // Version fullscreen pour desktop (Queue page)
  if (fullscreen) {
    return (
      <div className="min-h-screen bg-white overflow-hidden">
        {children}
      </div>
    );
  }

  // Version optimisée pour iPhone et petits écrans
  return (
    <div className="min-h-screen bg-gray-50 text-center px-3 py-4 sm:px-6 sm:py-8 flex flex-col items-center pb-16 sm:pb-20 overflow-x-hidden">
      <Header hideTitle={hideTitle} />
      <main 
        className="w-full max-w-sm sm:max-w-md lg:max-w-lg flex-1"
        role="main"
        aria-label="Contenu principal"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
