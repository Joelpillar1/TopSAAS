import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
  size?: number | string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = 'h-3.5 w-3.5',
  size,
  title = 'Verified Startup',
}) => {
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 align-middle"
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform hover:scale-110 ${className}`}
        style={size ? { width: size, height: size } : undefined}
        role="img"
        aria-label={title}
      >
        {/* Scalloped rosette starburst badge in TopSAAS mint theme */}
        <path
          d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
          fill="#00e599"
        />
        {/* Crisp dark checkmark inside */}
        <path
          d="m8.5 12.2 2.4 2.4 4.8-4.8"
          stroke="#09090b"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};
