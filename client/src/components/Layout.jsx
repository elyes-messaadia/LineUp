import Footer from './Footer';
import Header from './Header';

export default function Layout({ children, hideTitle = false }) {
  return (
    <div className="min-h-screen bg-white text-center px-4 py-6 sm:px-6 sm:py-8 flex flex-col items-center pb-16 sm:pb-10 overflow-x-hidden">
      <Header hideTitle={hideTitle} />
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">{children}</div>
      <Footer />
    </div>
  );
}
