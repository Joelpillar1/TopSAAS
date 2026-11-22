import React from 'react';
import { X } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

/* ------------------------------------------------------------------ *
 * Logo playground                                                     *
 * A grey canvas of well-known launch/tech brand chips the visitor can *
 * throw around. Position lives in a ref-mutated DOM transform so the  *
 * physics loop never re-renders React.                                *
 * ------------------------------------------------------------------ */

interface ChipDef {
  id: string;
  name: string;
  slug: string | null;
  color: string;
  mono: string;
  /** Initial centre as a fraction of the canvas. */
  fx: number;
  fy: number;
  rot: number;
}

const CHIPS: ChipDef[] = [
  { id: 'producthunt', name: 'Product Hunt', slug: 'producthunt', color: 'DA552F', mono: 'P', fx: 0.2, fy: 0.18, rot: -8 },
  { id: 'hackernews', name: 'Hacker News', slug: 'hackernews', color: 'FF6600', mono: 'Y', fx: 0.63, fy: 0.14, rot: 6 },
  { id: 'techcrunch', name: 'TechCrunch', slug: 'techcrunch', color: '0A8F3C', mono: 'TC', fx: 0.8, fy: 0.42, rot: -5 },
  { id: 'github', name: 'GitHub', slug: 'github', color: '181717', mono: 'GH', fx: 0.28, fy: 0.47, rot: 5 },
  { id: 'stripe', name: 'Stripe', slug: 'stripe', color: '635BFF', mono: 'S', fx: 0.57, fy: 0.45, rot: -7 },
  { id: 'vercel', name: 'Vercel', slug: 'vercel', color: '000000', mono: '▲', fx: 0.17, fy: 0.78, rot: 7 },
  { id: 'reddit', name: 'Reddit', slug: 'reddit', color: 'FF4500', mono: 'r', fx: 0.62, fy: 0.8, rot: 4 },
];

interface Body {
  el: HTMLDivElement | null;
  fx: number;
  fy: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  baseRot: number;
  rot: number;
  shakeT: number;
  shakeDur: number;
  dragging: boolean;
}

interface DragState {
  index: number;
  pointerId: number;
  canvasLeft: number;
  canvasTop: number;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  lastT: number;
  moved: number;
}

const SHAKE_DURATION = 0.55;
const MAX_SPEED = 2400;

const clampPosition = (value: number, size: number, total: number) =>
  total <= size ? total / 2 : Math.min(Math.max(value, size / 2), total - size / 2);

const SignupLogoPlayground: React.FC = () => {
  const canvasRef = React.useRef<HTMLDivElement | null>(null);
  const chipRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const bodiesRef = React.useRef<Body[]>(
    CHIPS.map((chip) => ({
      el: null,
      fx: chip.fx,
      fy: chip.fy,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      vx: 0,
      vy: 0,
      baseRot: chip.rot,
      rot: chip.rot,
      shakeT: 0,
      shakeDur: SHAKE_DURATION,
      dragging: false,
    })),
  );
  const sizeRef = React.useRef({ w: 0, h: 0 });
  const rafRef = React.useRef<number | null>(null);
  const lastFrameRef = React.useRef(0);
  const dragRef = React.useRef<DragState | null>(null);
  const [failedLogos, setFailedLogos] = React.useState<Record<string, boolean>>({});

  const paint = React.useCallback((body: Body) => {
    const el = body.el;
    if (!el) return;
    el.style.transform = `translate3d(${body.x - body.w / 2}px, ${body.y - body.h / 2}px, 0) rotate(${body.rot}deg)`;
  }, []);

  const tick = React.useCallback(
    (time: number) => {
      const now = time || performance.now();
      const previous = lastFrameRef.current || now;
      const dt = Math.min(Math.max((now - previous) / 1000, 0), 0.05);
      lastFrameRef.current = now;

      const { w: canvasW, h: canvasH } = sizeRef.current;
      let active = false;

      for (const body of bodiesRef.current) {
        if (!body.el) continue;

        if (body.dragging) {
          active = true;
          continue;
        }

        if (body.shakeT > 0) {
          body.shakeT = Math.max(0, body.shakeT - dt);
          const progress = 1 - body.shakeT / body.shakeDur;
          body.rot = body.baseRot + Math.sin(progress * Math.PI * 6) * 13 * (1 - progress);
          active = true;
        } else if (Math.abs(body.rot - body.baseRot) > 0.05) {
          body.rot += (body.baseRot - body.rot) * Math.min(1, dt * 12);
          active = true;
        }

        const speed = Math.hypot(body.vx, body.vy);
        if (speed > 6) {
          body.x += body.vx * dt;
          body.y += body.vy * dt;

          // Air drag + a soft bounce off each edge of the canvas.
          const decay = Math.pow(0.05, dt);
          body.vx *= decay;
          body.vy *= decay;

          if (body.x <= body.w / 2) {
            body.x = body.w / 2;
            body.vx = Math.abs(body.vx) * 0.5;
          } else if (body.x >= canvasW - body.w / 2) {
            body.x = canvasW - body.w / 2;
            body.vx = -Math.abs(body.vx) * 0.5;
          }

          if (body.y <= body.h / 2) {
            body.y = body.h / 2;
            body.vy = Math.abs(body.vy) * 0.5;
          } else if (body.y >= canvasH - body.h / 2) {
            body.y = canvasH - body.h / 2;
            body.vy = -Math.abs(body.vy) * 0.5;
          }

          body.fx = canvasW ? body.x / canvasW : body.fx;
          body.fy = canvasH ? body.y / canvasH : body.fy;
          active = true;
        } else if (body.vx !== 0 || body.vy !== 0) {
          body.vx = 0;
          body.vy = 0;
        }

        paint(body);
      }

      if (active) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        lastFrameRef.current = 0;
      }
    },
    [paint],
  );

  const startLoop = React.useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const layout = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    sizeRef.current = { w: width, h: height };

    bodiesRef.current.forEach((body, index) => {
      const el = chipRefs.current[index];
      if (!el) return;
      body.el = el;
      body.w = el.offsetWidth;
      body.h = el.offsetHeight;
      body.x = clampPosition(body.fx * width, body.w, width);
      body.y = clampPosition(body.fy * height, body.h, height);
      body.fx = body.x / width;
      body.fy = body.y / height;
      el.style.opacity = '1';
      paint(body);
    });
  }, [paint]);

  React.useEffect(() => {
    layout();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => layout());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [layout]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, index: number) => {
    const body = bodiesRef.current[index];
    const canvas = canvasRef.current;
    if (!body || !canvas || !body.el) return;

    const canvasRect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - canvasRect.left;
    const pointerY = event.clientY - canvasRect.top;

    dragRef.current = {
      index,
      pointerId: event.pointerId,
      canvasLeft: canvasRect.left,
      canvasTop: canvasRect.top,
      offsetX: pointerX - body.x,
      offsetY: pointerY - body.y,
      lastX: pointerX,
      lastY: pointerY,
      lastT: performance.now(),
      moved: 0,
    };

    body.dragging = true;
    body.vx = 0;
    body.vy = 0;
    body.shakeT = 0;
    body.el.style.zIndex = '40';
    body.el.style.cursor = 'grabbing';
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* pointer capture is best-effort */
    }
    startLoop();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const body = bodiesRef.current[drag.index];
    if (!body) return;

    const { w: canvasW, h: canvasH } = sizeRef.current;
    const pointerX = event.clientX - drag.canvasLeft;
    const pointerY = event.clientY - drag.canvasTop;

    const deltaX = pointerX - drag.lastX;
    const deltaY = pointerY - drag.lastY;
    drag.moved += Math.hypot(deltaX, deltaY);

    const now = performance.now();
    const elapsed = Math.max(now - drag.lastT, 8);
    const instantX = (deltaX / elapsed) * 1000;
    const instantY = (deltaY / elapsed) * 1000;
    body.vx = body.vx * 0.6 + instantX * 0.4;
    body.vy = body.vy * 0.6 + instantY * 0.4;
    drag.lastX = pointerX;
    drag.lastY = pointerY;
    drag.lastT = now;

    body.x = clampPosition(pointerX - drag.offsetX, body.w, canvasW);
    body.y = clampPosition(pointerY - drag.offsetY, body.h, canvasH);
    body.fx = canvasW ? body.x / canvasW : body.fx;
    body.fy = canvasH ? body.y / canvasH : body.fy;
    body.rot = body.baseRot + Math.max(-14, Math.min(14, body.vx * 0.012));

    paint(body);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const body = bodiesRef.current[drag.index];
    dragRef.current = null;

    if (body?.el) {
      body.dragging = false;
      body.el.style.zIndex = '';
      body.el.style.cursor = '';
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        /* noop */
      }

      if (drag.moved < 6) {
        // A tap, not a drag: wobble the chip so it feels alive.
        body.vx = 0;
        body.vy = 0;
        body.shakeT = SHAKE_DURATION;
      } else {
        body.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, body.vx));
        body.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, body.vy));
      }
      paint(body);
    }

    startLoop();
  };

  return (
    <div
      ref={canvasRef}
      aria-hidden="true"
      className="relative h-[212px] select-none overflow-hidden bg-[#ececed] sm:h-[232px]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(17,24,39,0.10) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        touchAction: 'none',
      }}
    >
      {/* Soft light wash so the chips read as lifted off the grey. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.85),transparent_65%)]" />

      {CHIPS.map((chip, index) => (
        <div
          key={chip.id}
          ref={(el) => {
            chipRefs.current[index] = el;
          }}
          onPointerDown={(event) => handlePointerDown(event, index)}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute left-0 top-0 flex cursor-grab items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-2 py-1.5 shadow-[0_3px_10px_-2px_rgba(17,24,39,0.18)] will-change-transform"
          style={{ opacity: 0, touchAction: 'none' }}
        >
          {chip.slug && !failedLogos[chip.id] ? (
            <img
              src={`https://cdn.simpleicons.org/${chip.slug}/${chip.color}`}
              alt=""
              width={16}
              height={16}
              draggable={false}
              decoding="async"
              className="h-4 w-4 shrink-0 pointer-events-none"
              onError={() => setFailedLogos((prev) => ({ ...prev, [chip.id]: true }))}
            />
          ) : (
            <span
              className="pointer-events-none flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-black leading-none text-white"
              style={{ backgroundColor: `#${chip.color}` }}
            >
              {chip.mono}
            </span>
          )}
          <span className="pointer-events-none whitespace-nowrap text-[11px] font-bold tracking-tight text-neutral-900">
            {chip.name}
          </span>
        </div>
      ))}

      <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500/80">
        Drag them around · tap to shake
      </p>
    </div>
  );
};

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-modal-title"
        className="relative w-full max-w-sm max-h-[92vh] overflow-x-hidden overflow-y-auto rounded-3xl border border-neutral-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ── Top: playful logo canvas ── */}
        <div className="relative">
          <SignupLogoPlayground />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-50 rounded-xl bg-white/70 p-1.5 text-neutral-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Bottom: actions ── */}
        <div className="px-6 pt-5 pb-6 sm:px-8 sm:pb-7 text-center">
          <h3 id="signin-modal-title" className="text-lg font-black text-neutral-950 mb-1.5">
            Sign in to continue
          </h3>
          <p className="text-xs text-neutral-600 mb-5 max-w-[270px] mx-auto leading-relaxed">
            You need an account to upvote, submit websites, and participate. It's free and takes seconds.
          </p>

          <button
            type="button"
            data-ml-goal="signup_click"
            onClick={onSignIn}
            className="btn-secondary w-full py-3 px-4 text-sm font-bold"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
