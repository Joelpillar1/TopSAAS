import React, { useState } from 'react';

export interface AnalyticsPoint {
  dateLabel: string;
  value: number;
}

export interface AnalyticsChartCardProps {
  title: string;
  unitSingular: string;
  unitPlural: string;
  total: number;
  yMax: number;
  series: AnalyticsPoint[];
  rangeStartLabel: string;
  rangeEndLabel: string;
  emptyMessage: string;
  dotClassName: string;
  barClassName: string;
  barActiveClassName: string;
  baselineClassName: string;
}

/** Interactive bar chart card with crosshair highlight, live header readout, and floating tooltip */
export const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  title,
  unitSingular,
  unitPlural,
  total,
  yMax,
  series,
  rangeStartLabel,
  rangeEndLabel,
  emptyMessage,
  dotClassName,
  barClassName,
  barActiveClassName,
  baselineClassName,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : null;
  const safeYMax = Math.max(1, yMax);
  const ticks = [safeYMax, Math.round(safeYMax * 0.75), Math.round(safeYMax * 0.5), Math.round(safeYMax * 0.25), 0];

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${dotClassName}`} />
          <span className="text-sm font-bold text-neutral-950">{title}</span>
        </div>
        <span className="text-xs font-mono-num text-neutral-500 transition-colors">
          {activePoint
            ? `${activePoint.dateLabel} · ${activePoint.value.toLocaleString()}`
            : `${total.toLocaleString()} total`}
        </span>
      </div>

      <div className="relative flex gap-3 h-44">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-[10px] font-mono-num text-neutral-400 pb-5 select-none">
          {ticks.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>

        {/* Plot Area */}
        <div
          className="relative flex-1 flex flex-col justify-end"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Subtle horizontal gridlines */}
          <div className="pointer-events-none absolute inset-0 bottom-5 flex flex-col justify-between">
            {ticks.slice(0, 4).map((_, i) => (
              <div key={i} className="w-full border-t border-dashed border-neutral-100" />
            ))}
            <div />
          </div>

          {total === 0 && hoveredIdx === null && (
            <div className="absolute inset-0 bottom-5 flex items-center justify-center pointer-events-none z-10">
              <span className="text-xs text-neutral-400 text-center px-3">
                {emptyMessage}
              </span>
            </div>
          )}

          {/* Interactive Bars */}
          <div className="relative z-10 flex items-end gap-1 h-full pb-1 border-b border-neutral-200/70">
            {series.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              const pct = pt.value > 0 ? Math.max(8, Math.round((pt.value / safeYMax) * 100)) : 0;
              const tooltipAlign =
                idx <= 1
                  ? 'left-0'
                  : idx >= series.length - 2
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={`${pt.dateLabel}: ${pt.value} ${pt.value === 1 ? unitSingular : unitPlural}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx((prev) => (prev === idx ? null : idx))}
                  className={`relative flex-1 h-full flex items-end cursor-crosshair rounded-t-md transition-colors outline-none ${
                    isHovered ? 'bg-neutral-100/70' : ''
                  }`}
                >
                  {isHovered && (
                    <div
                      className={`pointer-events-none absolute -top-8 ${tooltipAlign} z-30 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg`}
                    >
                      <span className="text-neutral-300">{pt.dateLabel}</span>
                      <span className="mx-1 text-neutral-500">·</span>
                      <span className="font-mono-num font-bold">
                        {pt.value.toLocaleString()} {pt.value === 1 ? unitSingular : unitPlural}
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-full rounded-t-sm transition-all duration-150 ${
                      pt.value > 0
                        ? isHovered
                          ? barActiveClassName
                          : barClassName
                        : isHovered
                        ? `h-[4px] ${barActiveClassName}`
                        : `h-[2px] ${baselineClassName}`
                    }`}
                    style={pt.value > 0 ? { height: `${pct}%` } : undefined}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[10px] font-mono-num text-neutral-400">
            <span>{rangeStartLabel}</span>
            <span>{rangeEndLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
