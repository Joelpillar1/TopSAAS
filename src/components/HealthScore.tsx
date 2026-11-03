import React from 'react';
import type { HealthBand } from '../utils/repoHealth';

// Band styling shared by card chips and detail-page display.
export const healthBandClass: Record<HealthBand, string> = {
  A: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  B: 'border-mint-500/40 bg-mint-500/15 text-mint-600',
  C: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  D: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
  E: 'border-red-500/40 bg-red-500/15 text-red-300',
};

export const healthExplain =
  'Health score: activity 40, popularity 25, engagement 15, issue load 10, open-source hygiene 10';

interface HealthScoreProps {
  score: number;
  band: HealthBand;
  className?: string;
}

/** Compact chip for repo cards: "84 A" with a hover explanation. */
export const HealthScore: React.FC<HealthScoreProps> = ({ score, band, className = '' }) => (
  <span
    title={`${healthExplain}. This project scores ${score}/100 (grade ${band}).`}
    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-black font-mono-num ${healthBandClass[band]} ${className}`}
  >
    {score}
    <span className="opacity-80">{band}</span>
  </span>
);
