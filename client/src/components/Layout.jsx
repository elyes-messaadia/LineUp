import Title from './Title';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-center p-6 flex flex-col items-center pb-10 overflow-x-hidden">
      <div className="mb-6">
        <Title left="" />
      </div>
      <div className="w-full max-w-md">{children}</div>
      <Footer />
    </div>
  );
}
