import Title from './Title';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-center px-4 py-6 sm:px-6 sm:py-8 flex flex-col items-center pb-16 sm:pb-10 overflow-x-hidden">
      <div className="mb-4 sm:mb-6 w-full">
        <Title left="" />
      </div>
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">{children}</div>
      <Footer />
    </div>
  );
}
