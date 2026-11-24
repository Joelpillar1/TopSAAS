import React, { useState, useEffect, useId, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import chatgptPng from '../assets/llms/chatgpt.png';
import googlePng from '../assets/llms/google.png';
import bingPng from '../assets/llms/bing.png';
import claudePng from '../assets/llms/claude.png';
import perplexityPng from '../assets/llms/perplexity.png';
import {
  fetchAiCrawlTelemetry,
  DEFAULT_AI_CRAWL_TELEMETRY,
  AiCrawlTelemetryData,
  CrawlerStatItem,
  TimeSeriesPoint,
} from '../utils/aiCrawlStats';

function createAreaChartPaths(data: number[], width = 200, height = 36) {
  if (!data || data.length === 0) {
    return { lineD: '', areaD: '', points: [] };
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return { x, y, val };
  });

  if (points.length === 1) {
    return {
      lineD: `M 0,${points[0].y} L ${width},${points[0].y}`,
      areaD: `M 0,${points[0].y} L ${width},${points[0].y} L ${width},${height} L 0,${height} Z`,
      points,
    };
  }

  // Smooth cubic Bezier spline
  let lineD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    lineD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const lastPoint = points[points.length - 1];
  const areaD = `${lineD} L ${lastPoint.x.toFixed(1)},${height} L 0,${height} Z`;

  return { lineD, areaD, points };
}

interface InteractiveSparklineProps {
  data: number[];
  timeSeries?: TimeSeriesPoint[];
  color: 'blue' | 'red';
  onHoverPoint?: (info: { label: string; value: number } | null) => void;
}

const InteractiveSparkline: React.FC<InteractiveSparklineProps> = ({
  data,
  timeSeries,
  color,
  onHoverPoint,
}) => {
  const chartId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 200;
  const height = 36;
  const { lineD, areaD, points } = createAreaChartPaths(data, width, height);

  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, relativeX / rect.width));
    const idx = Math.min(points.length - 1, Math.max(0, Math.round(pct * (points.length - 1))));

    setActiveIdx(idx);

    if (onHoverPoint) {
      const pointLabel = timeSeries?.[idx]?.label || `Hour ${idx + 1}`;
      onHoverPoint({
        label: pointLabel,
        value: points[idx].val,
      });
    }
  };

  const handlePointerLeave = () => {
    setActiveIdx(null);
    if (onHoverPoint) {
      onHoverPoint(null);
    }
  };

  const strokeColor = color === 'blue' ? '#3B82F6' : '#EF4444';
  const gradStart = color === 'blue' ? '#60A5FA' : '#F87171';
  const crosshairColor = color === 'blue' ? '#93C5FD' : '#FCA5A5';

  const activePoint = activeIdx !== null && points[activeIdx] ? points[activeIdx] : null;

  return (
    <div className="relative w-full">
      {/* Floating Tooltip */}
      {activeIdx !== null && activePoint && (
        <div
          className="pointer-events-none absolute -top-8 z-30 transform -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md font-mono"
          style={{
            left: `${Math.max(12, Math.min(88, (activePoint.x / width) * 100))}%`,
          }}
        >
          <span>{timeSeries?.[activeIdx]?.label || `Hour ${activeIdx + 1}`}</span>
          <span className="mx-1 text-neutral-400">·</span>
          <span className="text-emerald-400 font-bold">{activePoint.val.toLocaleString()} reqs</span>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-9 overflow-visible cursor-crosshair touch-none"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        fill="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradStart} stopOpacity="0.45" />
            <stop offset="85%" stopColor={gradStart} stopOpacity="0.05" />
            <stop offset="100%" stopColor={gradStart} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Filled Area */}
        <path d={areaD} fill={`url(#grad-${chartId})`} />

        {/* Crisp Stroke Line */}
        <path
          d={lineD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Active Hover Crosshair Line & Target Indicator */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={height}
              stroke={crosshairColor}
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="3.5"
              fill={strokeColor}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export const AiCrawlAnalyticsSection: React.FC = () => {
  const [telemetry, setTelemetry] = useState<AiCrawlTelemetryData>(DEFAULT_AI_CRAWL_TELEMETRY);

  // Active hover readouts for each column
  const [hoveredTotal, setHoveredTotal] = useState<{ label: string; value: number } | null>(null);
  const [hoveredAllowed, setHoveredAllowed] = useState<{ label: string; value: number } | null>(null);
  const [hoveredUnsuccessful, setHoveredUnsuccessful] = useState<{ label: string; value: number } | null>(null);

  // Fetch live numbers from Cloudflare API via Supabase Edge Function (every 30m)
  useEffect(() => {
    let isMounted = true;
    const loadTelemetry = (force = false) => {
      fetchAiCrawlTelemetry(force).then((data) => {
        if (isMounted && data) {
          setTelemetry(data);
        }
      });
    };

    loadTelemetry();

    // Periodic 30-minute refresh cycle
    const interval = setInterval(() => {
      loadTelemetry(true);
    }, 30 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getCrawlerIcon = (id: string) => {
    switch (id) {
      case 'openai':
        return <img src={chatgptPng} alt="OpenAI" className="h-4 w-4 object-contain" />;
      case 'google':
        return <img src={googlePng} alt="Google" className="h-4 w-4 object-contain" />;
      case 'microsoft':
        return <img src={bingPng} alt="Microsoft" className="h-4 w-4 object-contain" />;
      case 'anthropic':
        return <img src={claudePng} alt="Anthropic" className="h-4 w-4 object-contain" />;
      case 'perplexity':
        return <img src={perplexityPng} alt="Perplexity" className="h-4 w-4 object-contain" />;
      case 'apple':
        return (
          <svg viewBox="0 0 170 170" className="h-4 w-4 fill-neutral-900" aria-label="Apple">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.58-7.85-11.68-14.3-6.19-9.87-10.97-20.73-14.34-32.58-3.37-11.85-5.06-23.27-5.06-34.26 0-14.92 3.84-27.12 11.52-36.59 7.68-9.47 17.18-14.28 28.5-14.42 5.01 0 10.45 1.25 16.32 3.75 5.87 2.5 9.87 3.8 12.01 3.9 1.74 0 5.82-1.35 12.24-4.04 6.42-2.69 11.77-3.9 16.05-3.64 12.19.76 21.99 5.38 29.4 13.86-10.66 6.42-15.88 15.45-15.66 27.09.22 9.58 3.97 17.63 11.25 24.15 7.28 6.53 15.78 10.23 25.5 11.1-2.07 6.42-4.46 12.78-7.18 19.09zM119.22 31.02c0-7.39 2.66-14.58 7.98-21.57 5.32-6.99 12.02-11.48 20.1-13.48.33 1.09.49 2.29.49 3.6 0 7.39-2.77 14.7-8.31 21.93-5.54 7.23-12.28 11.64-20.26 13.23-.22-1.2-.33-2.43-.33-3.71z" />
          </svg>
        );
      case 'meta':
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#0081FB]" aria-label="Meta">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.89 13.91c-1.42 0-2.48-.96-3.89-2.73-1.42 1.77-2.48 2.73-3.89 2.73-2.09 0-3.61-1.84-3.61-4.41 0-2.89 1.83-4.99 4.11-4.99 1.62 0 2.72.96 3.39 1.95.67-.99 1.77-1.95 3.39-1.95 2.28 0 4.11 2.1 4.11 4.99 0 2.57-1.52 4.41-3.61 4.41z" />
          </svg>
        );
      case 'amazon':
        return (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#FF9900]" aria-label="Amazon">
            <path d="M13.92 14.16c-1.9 1.4-4.5 2.14-6.88 2.14-3.34 0-6.35-1.29-8.62-3.46-.18-.17-.02-.41.2-.27 2.45 1.57 5.48 2.51 8.63 2.51 2.11 0 4.46-.57 6.47-1.74.31-.18.57.14.2.82zm1.09-1.03c-.24-.31-1.61-.15-2.22-.07-.19.02-.22-.13-.05-.25 1.1-.78 2.91-.56 3.12-.3.21.27-.05 2.08-1.08 2.95-.16.13-.31.06-.24-.11.23-.55.71-1.91.47-2.22z" />
          </svg>
        );
      case 'baidu':
        return (
          <div className="h-4 w-4 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px] leading-none">
            度
          </div>
        );
      case 'duckduckgo':
        return (
          <div className="h-4 w-4 rounded-full bg-[#DE5833] text-white font-bold flex items-center justify-center text-[8px] leading-none">
            DDG
          </div>
        );
      default:
        return <div className="h-4 w-4 rounded-full bg-neutral-200" />;
    }
  };

  const renderCrawlerCard = (crawler: CrawlerStatItem, key: string) => {
    return (
      <div
        key={key}
        className={`group flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 transition-all shadow-2xs hover:shadow-sm shrink-0 select-none ${
          crawler.isBlueBorder
            ? 'border-blue-300 ring-1 ring-blue-100'
            : 'border-neutral-200/90 hover:border-neutral-300'
        }`}
      >
        {/* Brand Icon */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 p-1">
          {getCrawlerIcon(crawler.id)}
        </div>

        {/* Info Column */}
        <div className="flex flex-col">
          {/* Top Line: Name + bot pill */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-neutral-900 tracking-tight">
              {crawler.name}
            </span>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
              {crawler.botTag}
            </span>
          </div>

          {/* Bottom Line: Allowed requests + percentage change */}
          <div className="flex items-center gap-1.5 mt-1 leading-none text-xs">
            <span className="text-[11px] text-neutral-500 font-normal">Allowed:</span>
            <span className="font-extrabold text-neutral-950 font-mono-num text-xs">
              {crawler.allowedRequests}
            </span>

            {crawler.trend && (
              <span
                className={`inline-flex items-center text-[10px] font-semibold font-mono-num ml-0.5 ${
                  crawler.trendDirection === 'up' ? 'text-emerald-600' : 'text-neutral-500'
                }`}
              >
                {crawler.trendDirection === 'up' ? (
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5 mr-0.5 stroke-[2.5]" />
                )}
                {crawler.trend}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const { metrics, sparklines, timeSeries } = telemetry;

  return (
    <div
      id="ai-crawler-analytics"
      className="w-full my-4 font-sans select-none"
      aria-label="AI Crawler Analytics"
    >
      {/* ── Top Analytics Card (Interactive Area Charts) ── */}
      <div className="w-full rounded-2xl border border-neutral-200/90 bg-white p-3.5 sm:p-4 shadow-2xs overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-xs sm:text-sm font-semibold text-neutral-800 tracking-tight">
              AI Crawler Analytics
            </span>
            {telemetry.isLive && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                Live
              </span>
            )}
          </div>
          <span className="text-[11px] sm:text-xs text-neutral-400 font-medium">
            {telemetry.periodLabel} · Updates every 30m
          </span>
        </div>

        {/* 3 Metric Columns with Interactive Time-Series Area Graphs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 pt-1">
          {/* Column 1: Total requests */}
          <div className="relative flex flex-col justify-between pt-1 sm:pt-0 sm:pr-4 pb-2">
            <div>
              <div className="text-xs font-semibold text-neutral-800 underline decoration-dashed decoration-neutral-300 underline-offset-4 mb-1">
                Total requests
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-mono-num">
                  {hoveredTotal ? hoveredTotal.value.toLocaleString() : metrics.totalRequests.value}
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-blue-600 font-mono-num">
                  {hoveredTotal ? (
                    <span className="text-neutral-500 font-normal">at {hoveredTotal.label}</span>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 mr-0.5 stroke-[2.5]" />
                      {metrics.totalRequests.trend}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Interactive Blue Area Graph */}
            <div className="mt-3 w-full">
              <InteractiveSparkline
                data={sparklines.total}
                timeSeries={timeSeries}
                color="blue"
                onHoverPoint={setHoveredTotal}
              />
            </div>
            {/* Blue baseline border */}
            <div className="w-full h-0.5 bg-blue-500/80 rounded-full mt-0.5" />
          </div>

          {/* Column 2: Allowed requests */}
          <div className="relative flex flex-col justify-between pt-3 sm:pt-0 sm:px-4 pb-2">
            <div>
              <div className="text-xs font-semibold text-neutral-800 underline decoration-dashed decoration-neutral-300 underline-offset-4 mb-1">
                Allowed requests
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-mono-num">
                  {hoveredAllowed ? hoveredAllowed.value.toLocaleString() : metrics.allowedRequests.value}
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-blue-600 font-mono-num">
                  {hoveredAllowed ? (
                    <span className="text-neutral-500 font-normal">at {hoveredAllowed.label}</span>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 mr-0.5 stroke-[2.5]" />
                      {metrics.allowedRequests.trend}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Interactive Blue Area Graph */}
            <div className="mt-3 w-full">
              <InteractiveSparkline
                data={sparklines.allowed}
                timeSeries={timeSeries}
                color="blue"
                onHoverPoint={setHoveredAllowed}
              />
            </div>
            {/* Blue baseline border */}
            <div className="w-full h-0.5 bg-blue-500/80 rounded-full mt-0.5" />
          </div>

          {/* Column 3: Unsuccessful requests */}
          <div className="relative flex flex-col justify-between pt-3 sm:pt-0 sm:pl-4 pb-2">
            <div>
              <div className="text-xs font-semibold text-neutral-800 underline decoration-dashed decoration-neutral-300 underline-offset-4 mb-1">
                Unsuccessful requests
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-mono-num">
                  {hoveredUnsuccessful ? hoveredUnsuccessful.value.toLocaleString() : metrics.unsuccessfulRequests.value}
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-rose-500 font-mono-num">
                  {hoveredUnsuccessful ? (
                    <span className="text-neutral-500 font-normal">at {hoveredUnsuccessful.label}</span>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 mr-0.5 stroke-[2.5]" />
                      {metrics.unsuccessfulRequests.trend}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Interactive Red Area Graph */}
            <div className="mt-3 w-full">
              <InteractiveSparkline
                data={sparklines.unsuccessful}
                timeSeries={timeSeries}
                color="red"
                onHoverPoint={setHoveredUnsuccessful}
              />
            </div>
            {/* Red baseline border */}
            <div className="w-full h-0.5 bg-rose-500/80 rounded-full mt-0.5" />
          </div>
        </div>
      </div>

      {/* ── Bottom Crawlers Row (Infinite Horizontal Scrolling Line) ── */}
      <div className="relative mt-3.5 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)]">
        {/* Subtle edge gradient fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-neutral-50/80 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-neutral-50/80 to-transparent" />

        <div className="flex gap-3 animate-marquee-infinite py-0.5">
          {/* Loop 1 */}
          {telemetry.crawlers.map((c, i) => renderCrawlerCard(c, `c1-${c.id}-${i}`))}
          {/* Loop 2 for seamless wrap */}
          {telemetry.crawlers.map((c, i) => renderCrawlerCard(c, `c2-${c.id}-${i}`))}
        </div>
      </div>
    </div>
  );
};
