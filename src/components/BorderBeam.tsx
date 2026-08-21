import React from 'react';

export interface BorderBeamProps {
  children?: React.ReactNode;
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorMid?: string;
  colorTo?: string;
  gradient?: string;
  active?: boolean;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  children,
  className = '',
  size = 180,
  duration = 5,
  borderWidth = 1.5,
  colorFrom = '#ffaa40',
  colorMid = '#9c40ff',
  colorTo = '#00d2ff',
  gradient,
  active = true,
}) => {
  if (!active) {
    return <>{children}</>;
  }

  // Precomputed rich gradient beam
  const beamGradient =
    gradient ||
    `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 220deg, ${colorFrom} 270deg, ${colorMid} 315deg, ${colorTo} 360deg)`;

  const beamOverlay = (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
        } as React.CSSProperties
      }
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      {/* Rotating Conic Gradient Beam */}
      <div
        className="absolute -inset-[180%] animate-spin-slow opacity-90 transition-opacity duration-300"
        style={{
          background: beamGradient,
          animationDuration: `${duration}s`,
        }}
      />
    </div>
  );

  // If used as a wrapper: <BorderBeam><YourCard /></BorderBeam>
  if (children) {
    return (
      <div
        className={`relative rounded-xl p-[1.5px] overflow-hidden group/beam ${className}`}
        style={{
          boxShadow: '0 0 15px -3px rgba(156, 64, 255, 0.12), 0 0 6px -2px rgba(0, 210, 255, 0.15)',
        }}
      >
        {beamOverlay}
        <div className="relative z-10 w-full h-full rounded-[10.5px] bg-white">
          {children}
        </div>
      </div>
    );
  }

  // Standalone overlay for internal card usage
  return beamOverlay;
};
