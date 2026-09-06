import React from 'react';

interface RankMedalProps {
  rank: 1 | 2 | 3;
  className?: string;
  title?: string;
}

export const RankMedal: React.FC<RankMedalProps> = ({ rank, className = 'h-7 w-7', title }) => {
  // Rank 1: Gold, Rank 2: Silver, Rank 3: Bronze
  const colors = {
    1: {
      outer: '#E59838',
      inner: '#F6AD44',
      highlight: '#FED78A',
      shadow: '#C67A1B',
      text: '#683300',
    },
    2: {
      outer: '#B7ACC9',
      inner: '#D4CCE3',
      highlight: '#EFEBF8',
      shadow: '#988AAE',
      text: '#443B59',
    },
    3: {
      outer: '#B35D38',
      inner: '#CC7752',
      highlight: '#F0A787',
      shadow: '#964320',
      text: '#4A1D0B',
    },
  }[rank];

  const medalTitle = title || `Rank #${rank}`;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} title={medalTitle}>
      <svg
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Blue Ribbon Left Wing */}
        <path
          d="M13 14L4.5 4.5C3.8 3.7 4.5 2.5 5.5 2.5H11.5L16 11.5L13 14Z"
          fill="#3B82F6"
        />
        <path
          d="M5.5 2.5L3.5 6L8 10L11.5 2.5H5.5Z"
          fill="#2563EB"
          opacity="0.5"
        />

        {/* Blue Ribbon Right Wing */}
        <path
          d="M19 14L27.5 4.5C28.2 3.7 27.5 2.5 26.5 2.5H20.5L16 11.5L19 14Z"
          fill="#3B82F6"
        />
        <path
          d="M26.5 2.5L28.5 6L24 10L20.5 2.5H26.5Z"
          fill="#1D4ED8"
          opacity="0.5"
        />

        {/* Center Ribbon Fold / Notch */}
        <path
          d="M12 2.5H20L16 8.5L12 2.5Z"
          fill="#1D4ED8"
        />

        {/* Medal Outer Rim */}
        <circle cx="16" cy="22" r="11" fill={colors.outer} />

        {/* Medal Base */}
        <circle cx="16" cy="22" r="9.5" fill={colors.inner} />

        {/* Medal Inner Bevel & Depth */}
        <circle cx="16" cy="21.5" r="8.5" fill={colors.inner} stroke={colors.shadow} strokeWidth="0.75" />

        {/* Top subtle highlight arc */}
        <path
          d="M10 18.5C11.5 15.5 20.5 15.5 22 18.5"
          stroke={colors.highlight}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Rank Number */}
        <text
          x="16"
          y="25.5"
          textAnchor="middle"
          fill={colors.text}
          fontSize="10"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {rank}
        </text>
      </svg>
    </div>
  );
};
