import Title from './Title';

export default function Header({ hideTitle = false }) {
  if (hideTitle) return null;
  
  return (
    <div className="mb-4 sm:mb-6 w-full">
      <Title left="" />
    </div>
  );
} 