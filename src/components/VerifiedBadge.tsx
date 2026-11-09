import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
  size?: number | string;
  title?: string;
  variant?: 'blue' | 'gold';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = 'h-3.5 w-3.5',
  size,
  title,
  variant = 'blue',
}) => {
  const isGold = variant === 'gold';
  const defaultTitle = isGold ? 'Golden Verified Sponsor' : 'Verified Startup';
  const resolvedTitle = title || defaultTitle;

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 align-middle"
      title={resolvedTitle}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform hover:scale-110 ${className}`}
        style={size ? { width: size, height: size } : undefined}
        role="img"
        aria-label={resolvedTitle}
      >
        <defs>
          <linearGradient id="gold-rosette-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        {/* Scalloped rosette starburst badge in TopSAAS primary blue or lustrous gold */}
        <path
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          fill={isGold ? 'url(#gold-rosette-gradient)' : '#2563eb'}
        />
        {/* Crisp white checkmark inside */}
        <path
          d="m8.5 12.2 2.4 2.4 4.8-4.8"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
