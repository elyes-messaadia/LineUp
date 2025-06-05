export default function Title({ children, left, emoji, level = 1 }) {
  const TitleTag = `h${level}`;
  
  // Si children est fourni, l'utiliser directement
  if (children) {
    return (
      <TitleTag className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center px-2 senior-friendly-text">
        <span className="text-gray-900">
          {children}
        </span>
      </TitleTag>
    );
  }
  
  // Sinon, utiliser le format traditionnel avec LineUp
  return (
    <TitleTag className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center px-2 senior-friendly-text">
      <span className="text-gray-900">
        {emoji ? `${emoji} ` : ''}
        {left}
      </span>{' '}
      <span className="text-blue-700 font-extrabold">LineUp</span>
    </TitleTag>
  );
}
  