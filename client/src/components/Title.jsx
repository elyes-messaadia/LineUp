export default function Title({ left, emoji }) {
    return (
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-4 text-center px-2">
        <span className="text-black">
          {emoji ? `${emoji} ` : ''}
          {left}
        </span>{' '}
        <span className="text-blue-600">LineUp</span>
      </h1>
    );
  }
  