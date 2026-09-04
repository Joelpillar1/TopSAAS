import React, { useState, useEffect } from 'react';

/** Diagonal-striped placeholder cell that fills the empty slots of the bento grid */
export const GridFillerCell: React.FC = () => (
  <div
    aria-hidden="true"
    className="bg-[#2a2a2a]"
    style={{
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(148,163,184,0.06) 0px, rgba(148,163,184,0.06) 1px, transparent 1px, transparent 10px)',
    }}
  />
);

/** Column count for the bento grid at the current breakpoint (mirrors the grid classes) */
export const useGridColumns = (): number => {
  const getCols = () => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    if (w >= 1280) return 4; // xl
    if (w >= 1024) return 3; // lg
    if (w >= 640) return 2; // sm
    return 1;
  };
  const [cols, setCols] = useState<number>(getCols);
  useEffect(() => {
    const onResize = () => setCols(getCols());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
};