import React, { useState } from 'react';
import { Flame } from 'lucide-react';

interface ProductLogoProps {
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
  badge?: React.ReactNode;
}

export const ProductLogo: React.FC<ProductLogoProps> = ({
  src,
  alt = 'Product Logo',
  className = 'h-full w-full object-cover',
  iconClassName = 'h-3.5 w-3.5 text-black shrink-0',
  containerClassName = 'relative flex items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white shadow-2xs',
  badge,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={containerClassName}>
      {/* While loading or if error / unreachable, show score Fire icon */}
      {(!src || hasError || !isLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-0">
          <Flame className={iconClassName} />
        </div>
      )}

      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`${className} relative z-10 ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150`}
          referrerPolicy="no-referrer"
        />
      )}

      {badge}
    </div>
  );
};
