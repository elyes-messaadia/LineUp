export default function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 w-full 
                        bg-secondary-50/95 backdrop-blur-sm
                        text-secondary-500 text-xs text-center 
                        py-3 px-4 border-t border-secondary-200
                        shadow-inner sm:hidden
                        transition-all duration-300"
    >
      <div className="max-w-sm mx-auto">
        &copy; 2025 - LineUp • Projet DWWM ✨
      </div>
    </footer>
  );
}
