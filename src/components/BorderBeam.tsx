import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
  useMemo,
  CSSProperties,
  ReactNode,
} from 'react';

export type BeamSize = 'md' | 'sm' | 'line' | 'pulse-inner' | 'pulse-outside';
export type BeamColorVariant = 'colorful' | 'mono' | 'ocean' | 'sunset';
export type BeamTheme = 'light' | 'dark' | 'auto';

export interface BorderBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  size?: BeamSize;
  colorVariant?: BeamColorVariant;
  theme?: BeamTheme;
  strength?: number;
  active?: boolean;
  duration?: number;
  borderRadius?: number;
  staticColors?: boolean;
  brightness?: number;
  saturation?: number;
  hueRange?: number;
  className?: string;
  style?: CSSProperties;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onAnimationEnd?: (e: React.AnimationEvent<HTMLDivElement>) => void;
}

const sizePresets: Record<BeamSize, { borderRadius: number; borderWidth: number; width?: number; height?: number }> = {
  sm: { borderRadius: 32, borderWidth: 1, width: 70, height: 36 },
  md: { borderRadius: 16, borderWidth: 1 },
  line: { borderRadius: 16, borderWidth: 1 },
  'pulse-outside': { borderRadius: 16, borderWidth: 1 },
  'pulse-inner': { borderRadius: 16, borderWidth: 1 },
};

const sizeThemePresets = {
  sm: {
    dark: { strokeOpacity: 0.46, innerOpacity: 0.24, bloomOpacity: 0.38, innerShadow: 'rgba(255, 255, 255, 0.3)', saturation: 1.2 },
    light: { strokeOpacity: 0.12, innerOpacity: 0.3, bloomOpacity: 0.16, innerShadow: 'rgba(0, 0, 0, 0.14)', saturation: 1.8 },
  },
  md: {
    dark: { strokeOpacity: 0.26, innerOpacity: 0.42, bloomOpacity: 0.24, innerShadow: 'rgba(255, 255, 255, 0.27)', saturation: 1.2 },
    light: { strokeOpacity: 0.12, innerOpacity: 0.26, bloomOpacity: 0.34, innerShadow: 'rgba(0, 0, 0, 0.14)', saturation: 1.5 },
  },
  line: {
    dark: { strokeOpacity: 1.14, innerOpacity: 0.7, bloomOpacity: 0.8, innerShadow: 'rgba(255, 255, 255, 0.1)', saturation: 1.2 },
    light: { strokeOpacity: 0.16, innerOpacity: 0.32, bloomOpacity: 0.3, innerShadow: 'rgba(0, 0, 0, 0.14)', saturation: 1.95 },
  },
  'pulse-outside': {
    dark: { strokeOpacity: 0.94, innerOpacity: 0.34, bloomOpacity: 0.3, innerShadow: 'transparent', saturation: 1.2, brightness: 1.9, hairlineOpacity: 0 },
    light: { strokeOpacity: 1.96, innerOpacity: 1.04, bloomOpacity: 0.42, innerShadow: 'transparent', saturation: 0.6, brightness: 1.7, hairlineOpacity: 0 },
  },
  'pulse-inner': {
    dark: { strokeOpacity: 1.54, innerOpacity: 0.44, bloomOpacity: 0.66, innerShadow: 'transparent', saturation: 1.2, brightness: 0.75 },
    light: { strokeOpacity: 0.32, innerOpacity: 0.4, bloomOpacity: 0.8, innerShadow: 'transparent', saturation: 0.75, brightness: 1.3 },
  },
};

const COLOR_MAP = {
  colorful: {
    border: [
      { color: 'rgb(255, 50, 100)', pos: '33% -7.4%', size: '70px 40px' },
      { color: 'rgb(40, 140, 255)', pos: '12% -5%', size: '60px 35px' },
      { color: 'rgb(50, 200, 80)', pos: '2.1% 68.3%', size: '40px 70px' },
      { color: 'rgb(30, 185, 170)', pos: '2.1% 68.3%', size: '20px 35px' },
      { color: 'rgb(100, 70, 255)', pos: '74.4% 100%', size: '180px 32px' },
      { color: 'rgb(40, 140, 255)', pos: '55% 100%', size: '85px 26px' },
      { color: 'rgb(255, 120, 40)', pos: '93.9% 0%', size: '74px 32px' },
      { color: 'rgb(240, 50, 180)', pos: '100% 27.1%', size: '26px 42px' },
      { color: 'rgb(180, 40, 240)', pos: '100% 27.1%', size: '52px 48px' },
    ],
  },
  mono: {
    border: [
      { color: 'rgb(180, 180, 180)', pos: '33% -7.4%', size: '70px 40px' },
      { color: 'rgb(140, 140, 140)', pos: '12% -5%', size: '60px 35px' },
      { color: 'rgb(160, 160, 160)', pos: '2.1% 68.3%', size: '40px 70px' },
      { color: 'rgb(130, 130, 130)', pos: '2.1% 68.3%', size: '20px 35px' },
      { color: 'rgb(170, 170, 170)', pos: '74.4% 100%', size: '180px 32px' },
      { color: 'rgb(150, 150, 150)', pos: '55% 100%', size: '85px 26px' },
      { color: 'rgb(190, 190, 190)', pos: '93.9% 0%', size: '74px 32px' },
      { color: 'rgb(145, 145, 145)', pos: '100% 27.1%', size: '26px 42px' },
      { color: 'rgb(165, 165, 165)', pos: '100% 27.1%', size: '52px 48px' },
    ],
  },
  ocean: {
    border: [
      { color: 'rgb(100, 80, 220)', pos: '33% -7.4%', size: '70px 40px' },
      { color: 'rgb(60, 120, 255)', pos: '12% -5%', size: '60px 35px' },
      { color: 'rgb(80, 100, 200)', pos: '2.1% 68.3%', size: '40px 70px' },
      { color: 'rgb(50, 140, 220)', pos: '2.1% 68.3%', size: '20px 35px' },
      { color: 'rgb(120, 80, 255)', pos: '74.4% 100%', size: '180px 32px' },
      { color: 'rgb(70, 130, 255)', pos: '55% 100%', size: '85px 26px' },
      { color: 'rgb(140, 100, 240)', pos: '93.9% 0%', size: '74px 32px' },
      { color: 'rgb(90, 110, 230)', pos: '100% 27.1%', size: '26px 42px' },
      { color: 'rgb(130, 70, 255)', pos: '100% 27.1%', size: '52px 48px' },
    ],
  },
  sunset: {
    border: [
      { color: 'rgb(255, 80, 50)', pos: '33% -7.4%', size: '70px 40px' },
      { color: 'rgb(255, 160, 40)', pos: '12% -5%', size: '60px 35px' },
      { color: 'rgb(255, 120, 60)', pos: '2.1% 68.3%', size: '40px 70px' },
      { color: 'rgb(255, 200, 50)', pos: '2.1% 68.3%', size: '20px 35px' },
      { color: 'rgb(255, 100, 80)', pos: '74.4% 100%', size: '180px 32px' },
      { color: 'rgb(255, 180, 60)', pos: '55% 100%', size: '85px 26px' },
      { color: 'rgb(255, 60, 60)', pos: '93.9% 0%', size: '74px 32px' },
      { color: 'rgb(255, 140, 50)', pos: '100% 27.1%', size: '26px 42px' },
      { color: 'rgb(255, 90, 70)', pos: '100% 27.1%', size: '52px 48px' },
    ],
  },
};

function renderBorderGradients(variant: BeamColorVariant) {
  return COLOR_MAP[variant].border
    .map((item) => `radial-gradient(ellipse ${item.size} at ${item.pos}, ${item.color}, transparent)`)
    .join(',\n');
}

function renderInnerGradients(variant: BeamColorVariant) {
  const map = COLOR_MAP[variant];
  const alpha = variant === 'mono' ? 0.225 : 0.45;
  return map.border
    .map((r) => {
      const col = r.color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
      const sz = r.size
        .split(' ')
        .map((x) => `${Math.round(parseInt(x, 10) * 0.9)}px`)
        .join(' ');
      return `radial-gradient(ellipse ${sz} at ${r.pos}, ${col}, transparent)`;
    })
    .join(',\n');
}

function generateBeamCss(params: {
  id: string;
  borderRadius: number;
  borderWidth: number;
  duration: number;
  strokeOpacity: number;
  innerOpacity: number;
  bloomOpacity: number;
  innerShadow: string;
  colorVariant: BeamColorVariant;
  staticColors: boolean;
  brightness: number;
  saturation: number;
  hueRange: number;
  theme: 'light' | 'dark';
}) {
  const {
    id,
    borderRadius,
    borderWidth,
    duration,
    strokeOpacity,
    innerOpacity,
    bloomOpacity,
    innerShadow,
    colorVariant,
    staticColors,
    brightness,
    saturation,
    hueRange,
    theme,
  } = params;

  const innerRadius = Math.max(0, borderRadius - borderWidth);
  const colorMult = colorVariant === 'mono' ? 0.5 : 1;
  const effStroke = strokeOpacity * colorMult;
  const effInner = innerOpacity * colorMult;
  const effBloom = bloomOpacity * colorMult;

  const hueAnim = staticColors
    ? ''
    : `animation: beam-hue-shift-${id} 12s ease-in-out infinite;`;

  const hueKeyframes = staticColors
    ? ''
    : `
@keyframes beam-hue-shift-${id} {
  0% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${hueRange}deg)) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  50% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) + ${hueRange}deg)) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
  100% { filter: hue-rotate(calc(var(--beam-hue-base, 0deg) - ${hueRange}deg)) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)}); }
}`;

  const isDark = theme === 'dark';
  const conicStroke = isDark
    ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(255, 255, 255, 0.1) 57%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0.6) 63%,
        rgba(255, 255, 255, 0.75) 66%,
        rgba(255, 255, 255, 0.6) 69%,
        rgba(255, 255, 255, 0.3) 72%,
        rgba(255, 255, 255, 0.1) 75%,
        transparent 78%, transparent 100%
      )`
    : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 54%,
        rgba(0, 0, 0, 0.08) 57%,
        rgba(0, 0, 0, 0.2) 60%,
        rgba(0, 0, 0, 0.4) 63%,
        rgba(0, 0, 0, 0.55) 66%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.2) 72%,
        rgba(0, 0, 0, 0.08) 75%,
        transparent 78%, transparent 100%
      )`;

  const borderGradients = renderBorderGradients(colorVariant);
  const innerGradients = renderInnerGradients(colorVariant);

  const conicBloom = isDark
    ? `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(255, 255, 255, 0.03) 62%,
        rgba(255, 255, 255, 0.08) 65%,
        rgba(255, 255, 255, 0.2) 67%,
        rgba(255, 255, 255, 0.45) 69%,
        rgba(255, 255, 255, 0.85) 70%,
        rgba(255, 255, 255, 0.85) 70.5%,
        rgba(255, 255, 255, 0.45) 71.5%,
        rgba(255, 255, 255, 0.2) 73%,
        rgba(255, 255, 255, 0.08) 75%,
        rgba(255, 255, 255, 0.03) 78%,
        transparent 82%
      )`
    : `conic-gradient(
        from var(--beam-angle-${id}),
        transparent 0%, transparent 58%,
        rgba(0, 0, 0, 0.02) 62%,
        rgba(0, 0, 0, 0.08) 65%,
        rgba(0, 0, 0, 0.2) 67%,
        rgba(0, 0, 0, 0.4) 69%,
        rgba(0, 0, 0, 0.6) 70%,
        rgba(0, 0, 0, 0.6) 70.5%,
        rgba(0, 0, 0, 0.4) 71.5%,
        rgba(0, 0, 0, 0.2) 73%,
        rgba(0, 0, 0, 0.08) 75%,
        rgba(0, 0, 0, 0.02) 78%,
        transparent 82%
      )`;

  return `
@property --beam-angle-${id} {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: true;
}

@property --beam-opacity-${id} {
  syntax: "<number>";
  initial-value: 0;
  inherits: true;
}

[data-beam="${id}"] {
  position: relative;
  border-radius: ${borderRadius}px;
  overflow: hidden;
}

[data-beam="${id}"][data-active] {
  animation:
    beam-spin-${id} ${duration}s linear infinite,
    beam-fade-in-${id} 0.6s ease forwards;
}

[data-beam="${id}"][data-fading] {
  animation:
    beam-spin-${id} ${duration}s linear infinite,
    beam-fade-out-${id} 0.5s ease forwards;
}

[data-beam="${id}"][data-active]::after,
[data-beam="${id}"][data-fading]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${innerRadius}px;
  padding: ${borderWidth}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${conicStroke}, ${borderGradients};
  -webkit-mask:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: source-in, xor;
  mask:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: intersect, exclude;
  pointer-events: none;
  z-index: 2;
  opacity: calc(var(--beam-opacity-${id}) * ${effStroke.toFixed(2)} * var(--beam-stroke-opacity, 1) * var(--beam-strength, 1));
  ${hueAnim}
}

[data-beam="${id}"][data-active]::before,
[data-beam="${id}"][data-fading]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: ${borderRadius}px;
  background: ${innerGradients};
  box-shadow: inset 0 0 9px 1px ${innerShadow};
  -webkit-mask-image:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  -webkit-mask-composite: source-in, source-over;
  mask-image:
    conic-gradient(
      from var(--beam-angle-${id}),
      transparent 0%, transparent 30%,
      rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.35) 44%,
      white 52%, white 80%,
      rgba(255, 255, 255, 0.35) 86%, rgba(255, 255, 255, 0.1) 92%,
      transparent 95%, transparent 100%
    ),
    linear-gradient(white, transparent 28px, transparent calc(100% - 28px), white),
    linear-gradient(to right, white, transparent 28px, transparent calc(100% - 28px), white);
  mask-composite: intersect, add;
  pointer-events: none;
  z-index: 1;
  opacity: calc(var(--beam-opacity-${id}) * ${effInner.toFixed(2)} * var(--beam-inner-opacity, 1) * var(--beam-strength, 1));
  clip-path: inset(0 round ${borderRadius}px);
  ${hueAnim}
}

[data-beam="${id}"] [data-beam-bloom] {
  display: none;
  position: absolute;
  inset: 0;
  border-radius: ${innerRadius}px;
  clip-path: inset(0 round ${borderRadius}px);
  background: ${conicBloom};
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  padding: ${borderWidth}px;
  filter: blur(8px) brightness(${brightness.toFixed(2)}) saturate(${saturation.toFixed(2)});
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

[data-beam="${id}"][data-active] [data-beam-bloom],
[data-beam="${id}"][data-fading] [data-beam-bloom] {
  display: block;
  opacity: calc(var(--beam-opacity-${id}) * ${effBloom.toFixed(2)} * var(--beam-bloom-opacity, 1) * var(--beam-strength, 1));
}

@keyframes beam-spin-${id} {
  to { --beam-angle-${id}: 360deg; }
}

@keyframes beam-fade-in-${id} {
  to { --beam-opacity-${id}: 1; }
}

@keyframes beam-fade-out-${id} {
  from { --beam-opacity-${id}: 1; }
  to { --beam-opacity-${id}: 0; }
}

${hueKeyframes}

[data-beam="${id}"][data-paused],
[data-beam="${id}"][data-paused]::after,
[data-beam="${id}"][data-paused]::before,
[data-beam="${id}"][data-paused] [data-beam-bloom] {
  animation-play-state: paused !important;
}
`;
}

export const BorderBeam = forwardRef<HTMLDivElement, BorderBeamProps>(function BorderBeam(
  {
    children,
    size = 'md',
    colorVariant = 'colorful',
    theme = 'dark',
    strength = 1,
    active = true,
    duration,
    borderRadius,
    staticColors = false,
    brightness,
    saturation,
    hueRange = 30,
    className,
    style,
    onActivate,
    onDeactivate,
    onAnimationEnd,
    ...rest
  },
  forwardedRef
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, '-');
  const innerRef = useRef<HTMLDivElement | null>(null);

  const [isActive, setIsActive] = useState(active);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [inferredRadius, setInferredRadius] = useState<number | null>(null);

  useEffect(() => {
    if (borderRadius != null) return;
    const el = innerRef.current;
    if (!el) return;
    const compute = () => {
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) return;
      const cs = getComputedStyle(child);
      const r = parseFloat(cs.borderTopLeftRadius);
      if (!isNaN(r) && r > 0) setInferredRadius(r);
    };
    compute();
    const mo = new MutationObserver(compute);
    mo.observe(el, { childList: true, subtree: false });
    return () => mo.disconnect();
  }, [borderRadius, children]);

  useEffect(() => {
    if (active && !isActive && !isFading) {
      setIsActive(true);
    } else if (!active && isActive && !isFading) {
      setIsFading(true);
    }
  }, [active, isActive, isFading]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        setIsVisible(entry.isIntersecting);
      }
    }, { rootMargin: '256px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleAnimEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      const animName = e.animationName;
      if (animName.includes('fade-out')) {
        setIsActive(false);
        setIsFading(false);
        onDeactivate?.();
      } else if (animName.includes('fade-in')) {
        onActivate?.();
      }
      onAnimationEnd?.(e);
    },
    [onActivate, onDeactivate, onAnimationEnd]
  );

  const resolvedTheme: 'light' | 'dark' = theme === 'auto' ? 'dark' : theme;
  const themePreset = sizeThemePresets[size][resolvedTheme];
  const sizePreset = sizePresets[size];

  const effRadius = borderRadius ?? inferredRadius ?? sizePreset.borderRadius;
  const effDuration = duration ?? (size === 'line' ? 3.1 : 1.96);
  const effSaturation = saturation ?? themePreset.saturation;
  const effBrightness = brightness ?? ('brightness' in themePreset ? (themePreset as { brightness: number }).brightness : 1.3);

  const css = useMemo(
    () =>
      generateBeamCss({
        id,
        borderRadius: effRadius,
        borderWidth: sizePreset.borderWidth,
        duration: effDuration,
        strokeOpacity: themePreset.strokeOpacity,
        innerOpacity: themePreset.innerOpacity,
        bloomOpacity: themePreset.bloomOpacity,
        innerShadow: themePreset.innerShadow,
        colorVariant,
        staticColors,
        brightness: effBrightness,
        saturation: effSaturation,
        hueRange,
        theme: resolvedTheme,
      }),
    [
      id,
      effRadius,
      sizePreset.borderWidth,
      effDuration,
      themePreset,
      colorVariant,
      staticColors,
      effBrightness,
      effSaturation,
      hueRange,
      resolvedTheme,
    ]
  );

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [forwardedRef]
  );

  const computedStyle: CSSProperties = {
    ...style,
    // @ts-expect-error custom css variable
    '--beam-strength': Math.max(0, Math.min(1, strength)),
  };

  return (
    <>
      <style>{css}</style>
      <div
        {...rest}
        ref={combinedRef}
        data-beam={id}
        data-active={isActive && !isFading ? '' : undefined}
        data-fading={isFading ? '' : undefined}
        data-paused={isActive && !isFading && !isVisible ? '' : undefined}
        className={className}
        style={computedStyle}
        onAnimationEnd={handleAnimEnd}
      >
        {children}
        <div data-beam-bloom="" />
      </div>
    </>
  );
});

export default BorderBeam;
