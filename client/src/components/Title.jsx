export default function Title({ children, left, emoji, icon, level = 1 }) {
  const TitleTag = `h${level}`;
  
  // Si children est fourni, l'utiliser directement
  if (children) {
    return (
      <TitleTag className="text-lg xs:text-xl se:text-2xl sm:text-3xl md:text-4xl 
                          font-bold mb-3 xs:mb-4 sm:mb-6 text-center 
                          px-2 xs:px-3 legacy-text-primary old-device-optimized">
        <span className="text-gray-900">
          {children}
        </span>
      </TitleTag>
    );
  }
  
  // Sinon, utiliser le format traditionnel avec LineUp
  return (
    <TitleTag className="text-lg xs:text-xl se:text-2xl sm:text-3xl md:text-4xl 
                        font-bold mb-3 xs:mb-4 sm:mb-6 text-center 
                        px-2 xs:px-3 legacy-text-primary old-device-optimized">
      <span className="text-gray-900">
        {/* Support nouvel API: icône Lucide en React node, avec compatibilité emoji */}
        {icon ? (
          <span className="inline-flex items-center mr-2 align-middle">{icon}</span>
        ) : (
          (emoji ? `${emoji} ` : '')
        )}
        {left}
      </span>{' '}
      <span className="text-blue-700 font-extrabold">LineUp</span>
    </TitleTag>
  );
}
  