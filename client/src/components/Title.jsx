export default function Title({ left, right, emoji }) {
    return (
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-4 text-center">
        <span className="text-black">{left}</span>{' '}
        <span className="text-blue-600">
          {emoji ? `${emoji} ` : ''}
          {right}
        </span>
      </h1>
    );
  }
  