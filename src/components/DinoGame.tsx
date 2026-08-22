import React, { useRef, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, RotateCcw, Trophy, Zap, ChevronUp, ChevronDown, Crown } from 'lucide-react';
import { playSound } from '../utils/sound';
import { Product } from '../types';

interface DinoGameProps {
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onGameOver?: (score: number, highScore: number, isNewRecord: boolean, durationMs?: number) => void;
  playAgainTrigger?: number;
  isModalOpen?: boolean;
  featuredProduct?: Product | null;
  onOpenFeaturedSpotModal?: () => void;
  onTrackClick?: (productId: string, url: string) => void;
}

// ─────────────────────────────────────────────────────────────
// Authentic 8-bit Audio Synthesizer (Instant latency, zero GC)
// ─────────────────────────────────────────────────────────────
class DinoAudio {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  jump(enabled: boolean) {
    if (!enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  score(enabled: boolean) {
    if (!enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  hit(enabled: boolean) {
    if (!enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }
}

const dinoAudio = new DinoAudio();

// ─────────────────────────────────────────────────────────────
// Sprite Pixel Maps for Crisp Chrome Dino Graphics
// ─────────────────────────────────────────────────────────────
// 1 = solid pixel, 0 = transparent
const DINO_RUN_LEFT = [
  "00000000000000111111110",
  "00000000000001111111111",
  "00000000000001111110111",
  "00000000000001111111111",
  "00000000000001111111111",
  "00000000000001111111000",
  "00000000000001111111111",
  "00000000000101111110000",
  "00000000001111111110000",
  "10000000011111111110000",
  "11000000111111111100000",
  "11100001111111111100000",
  "11110011111111111100000",
  "11111111111111111000000",
  "01111111111111111000000",
  "00111111111111110000000",
  "00011111111111100000000",
  "00001111111111000000000",
  "00000111111110000000000",
  "00000011000110000000000",
  "00000011000010000000000",
  "00000011000000000000000",
  "00000011000000000000000",
  "00000011100000000000000"
];

const DINO_RUN_RIGHT = [
  "00000000000000111111110",
  "00000000000001111111111",
  "00000000000001111110111",
  "00000000000001111111111",
  "00000000000001111111111",
  "00000000000001111111000",
  "00000000000001111111111",
  "00000000000101111110000",
  "00000000001111111110000",
  "10000000011111111110000",
  "11000000111111111100000",
  "11100001111111111100000",
  "11110011111111111100000",
  "11111111111111111000000",
  "01111111111111111000000",
  "00111111111111110000000",
  "00011111111111100000000",
  "00001111111111000000000",
  "00000111111110000000000",
  "00000011000110000000000",
  "00000001000110000000000",
  "00000000000110000000000",
  "00000000000110000000000",
  "00000000000111000000000"
];

const DINO_JUMP = [
  "00000000000000111111110",
  "00000000000001111111111",
  "00000000000001111110111",
  "00000000000001111111111",
  "00000000000001111111111",
  "00000000000001111111000",
  "00000000000001111111111",
  "00000000000101111110000",
  "00000000001111111110000",
  "10000000011111111110000",
  "11000000111111111100000",
  "11100001111111111100000",
  "11110011111111111100000",
  "11111111111111111000000",
  "01111111111111111000000",
  "00111111111111110000000",
  "00011111111111100000000",
  "00001111111111000000000",
  "00000111111110000000000",
  "00000011000110000000000",
  "00000011000110000000000",
  "00000000000000000000000",
  "00000000000000000000000",
  "00000000000000000000000"
];

const DINO_DEAD = [
  "00000000000000111111110",
  "00000000000001111111111",
  "00000000000001111010111",
  "00000000000001111101111",
  "00000000000001111010111",
  "00000000000001111111000",
  "00000000000001111111111",
  "00000000000101111110000",
  "00000000001111111110000",
  "10000000011111111110000",
  "11000000111111111100000",
  "11100001111111111100000",
  "11110011111111111100000",
  "11111111111111111000000",
  "01111111111111111000000",
  "00111111111111110000000",
  "00011111111111100000000",
  "00001111111111000000000",
  "00000111111110000000000",
  "00000011000110000000000",
  "00000011000110000000000",
  "00000011000110000000000",
  "00000011000110000000000",
  "00000011100111000000000"
];

const DINO_DUCK_1 = [
  "0000000000000000000001111111100",
  "0000000000000000000011111111110",
  "0000000000000000000011111101110",
  "0000000000000000000011111111110",
  "0000000000000000000011111111110",
  "1000000001111111111111111110000",
  "1100000011111111111111111111110",
  "1110000111111111111111111110000",
  "1111111111111111111111111110000",
  "0111111111111111111111111000000",
  "0011111111111111111111100000000",
  "0000111111111111111111000000000",
  "0000001100000011000000000000000",
  "0000001100000010000000000000000",
  "0000001110000000000000000000000"
];

const DINO_DUCK_2 = [
  "0000000000000000000001111111100",
  "0000000000000000000011111111110",
  "0000000000000000000011111101110",
  "0000000000000000000011111111110",
  "0000000000000000000011111111110",
  "1000000001111111111111111110000",
  "1100000011111111111111111111110",
  "1110000111111111111111111110000",
  "1111111111111111111111111110000",
  "0111111111111111111111111000000",
  "0011111111111111111111100000000",
  "0000111111111111111111000000000",
  "0000001100000011000000000000000",
  "0000000100000011000000000000000",
  "0000000000000011100000000000000"
];

const PTERO_1 = [
  "0000000000110000",
  "0000000011110000",
  "0000001111110000",
  "0011111111110000",
  "1111111111111111",
  "0000001111111110",
  "0000000011110000",
  "0000000001100000"
];

const PTERO_2 = [
  "0000000000000000",
  "0000000000000000",
  "0000000000000000",
  "0011111111110000",
  "1111111111111111",
  "0000001111111110",
  "0000001111110000",
  "0000000011000000"
];

export const DinoGame: React.FC<DinoGameProps> = ({
  soundEnabled = true,
  onToggleSound,
  onGameOver,
  playAgainTrigger,
  isModalOpen = false,
  featuredProduct,
  onOpenFeaturedSpotModal,
  onTrackClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // High level UI states (Only updated on Game Over or Init to keep 60+ FPS)
  const [gameState, setGameState] = useState<'idle' | 'running' | 'gameover'>('idle');
  const [gameOverScore, setGameOverScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('topsaas_dino_highscore_v2');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Pure mutable game engine state
  const engineRef = useRef({
    state: 'idle' as 'idle' | 'running' | 'gameover',
    score: 0,
    highScore: 0,
    flashScoreTimer: 0,
    distance: 0,
    speed: 6.0,
    baseSpeed: 6.0,
    maxSpeed: 13.0,
    acceleration: 0.001,
    gravity: 0.6,
    initialJumpVelocity: -11.0,
    dropVelocity: -4.0, // For quick drop on early key release
    isJumpHeld: false,

    // Dino state
    dino: {
      x: 35,
      y: 0,
      baseY: 0,
      vy: 0,
      isGrounded: true,
      isDucking: false,
      step: 0,
      stepTimer: 0,
      scale: 2, // 2x pixel size for crisp retro look
    },

    // Horizon & Entities
    groundY: 150,
    groundOffset: 0,
    obstacles: [] as {
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'cactus_small' | 'cactus_large' | 'cactus_group' | 'ptero';
      pteroStep?: number;
      hitboxes: { x: number; y: number; w: number; h: number }[];
    }[],
    clouds: [] as { x: number; y: number; speed: number }[],
    minObstacleGap: 180,
    nextObstacleTimer: 80,

    lastFrameTime: 0,
    startTime: 0,
    animId: 0,
  });

  // Sync highScore into ref
  useEffect(() => {
    engineRef.current.highScore = highScore;
  }, [highScore]);

  // High score celebration
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#000000', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch {}
  }, []);

  // Start Game
  const startGame = useCallback(() => {
    const e = engineRef.current;
    e.state = 'running';
    e.score = 0;
    e.distance = 0;
    e.speed = e.baseSpeed;
    e.startTime = Date.now();
    e.obstacles = [];
    e.nextObstacleTimer = 90;
    e.dino.y = e.groundY - 48;
    e.dino.vy = 0;
    e.dino.isGrounded = true;
    e.dino.isDucking = false;
    e.isJumpHeld = true;

    setGameState('running');
    setIsNewRecord(false);
    dinoAudio.jump(soundEnabled);
  }, [soundEnabled]);

  // Full game reset to initial clean state
  const resetGame = useCallback(() => {
    const e = engineRef.current;
    e.state = 'idle';
    e.score = 0;
    e.distance = 0;
    e.speed = e.baseSpeed;
    e.obstacles = [];
    e.nextObstacleTimer = 90;
    e.dino.y = e.groundY - 48;
    e.dino.vy = 0;
    e.dino.isGrounded = true;
    e.dino.isDucking = false;
    e.isJumpHeld = false;

    setGameState('idle');
    setGameOverScore(0);
    setHighScore(0);
    setIsNewRecord(false);
    try {
      localStorage.removeItem('topsaas_dino_highscore_v2');
      localStorage.removeItem('topsaas_dino_highscore');
    } catch {}
  }, []);

  // Restart game only when playAgainTrigger is explicitly triggered after mount
  const prevTriggerRef = useRef<number>(playAgainTrigger ?? 0);
  useEffect(() => {
    if (
      typeof playAgainTrigger === 'number' &&
      playAgainTrigger > 0 &&
      playAgainTrigger !== prevTriggerRef.current
    ) {
      prevTriggerRef.current = playAgainTrigger;
      startGame();
    }
  }, [playAgainTrigger, startGame]);

  // Jump action
  const handleJumpPress = useCallback(() => {
    const e = engineRef.current;
    if (e.state === 'idle' || e.state === 'gameover') {
      startGame();
      return;
    }
    if (e.state === 'running' && e.dino.isGrounded) {
      e.dino.vy = e.initialJumpVelocity;
      e.dino.isGrounded = false;
      e.isJumpHeld = true;
      dinoAudio.jump(soundEnabled);
    }
  }, [startGame, soundEnabled]);

  const handleJumpRelease = useCallback(() => {
    const e = engineRef.current;
    e.isJumpHeld = false;
    // Variable jump height: if releasing before apex, reduce upward momentum
    if (e.dino.vy < e.dropVelocity) {
      e.dino.vy = e.dropVelocity;
    }
  }, []);

  const handleDuckPress = useCallback(() => {
    const e = engineRef.current;
    if (e.state === 'running') {
      e.dino.isDucking = true;
      if (!e.dino.isGrounded) {
        // Fast gravity fall when ducking in air
        e.dino.vy += 5.5;
      }
    }
  }, []);

  const handleDuckRelease = useCallback(() => {
    const e = engineRef.current;
    e.dino.isDucking = false;
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
      if (isModalOpen) return;
      if (typeof document !== 'undefined' && document.querySelector('.fixed.inset-0.z-50, [role="dialog"]')) return;

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        handleJumpPress();
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        handleDuckPress();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isModalOpen) return;
      if (typeof document !== 'undefined' && document.querySelector('.fixed.inset-0.z-50, [role="dialog"]')) return;

      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        handleJumpRelease();
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        handleDuckRelease();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleJumpPress, handleJumpRelease, handleDuckPress, handleDuckRelease, isModalOpen]);

  // Main High Performance RAF Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Resize Canvas to device pixel ratio
    const updateSize = () => {
      const container = containerRef.current;
      const width = container ? container.clientWidth : 750;
      const height = 180;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.imageSmoothingEnabled = false;

      const e = engineRef.current;
      e.groundY = height - 26;
      e.dino.baseY = e.groundY;
      if (e.dino.isGrounded) {
        e.dino.y = e.groundY - (e.dino.isDucking ? 30 : 48);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize clouds
    const e = engineRef.current;
    if (e.clouds.length === 0) {
      for (let i = 0; i < 4; i++) {
        e.clouds.push({
          x: 100 + i * 200 + Math.random() * 80,
          y: 20 + Math.random() * 40,
          speed: 0.6 + Math.random() * 0.4,
        });
      }
    }

    // ────────────────────────────
    // Drawing Sprites Helper
    // ────────────────────────────
    const drawPixelMatrix = (
      matrix: string[],
      x: number,
      y: number,
      scale = 2,
      color = '#202124'
    ) => {
      ctx.fillStyle = color;
      const rows = matrix.length;
      for (let r = 0; r < rows; r++) {
        const row = matrix[r];
        const cols = row.length;
        for (let c = 0; c < cols; c++) {
          if (row[c] === '1') {
            ctx.fillRect(
              Math.floor(x + c * scale),
              Math.floor(y + r * scale),
              scale,
              scale
            );
          }
        }
      }
    };

    // Draw Authentic Cactus
    const drawCactusSprite = (
      type: 'cactus_small' | 'cactus_large' | 'cactus_group',
      x: number,
      y: number
    ) => {
      ctx.fillStyle = '#202124';
      if (type === 'cactus_small') {
        // Small single cactus (width ~16, height ~34)
        ctx.fillRect(x + 5, y, 6, 34);
        ctx.fillRect(x, y + 8, 5, 4);
        ctx.fillRect(x, y + 4, 4, 8);
        ctx.fillRect(x + 11, y + 12, 5, 4);
        ctx.fillRect(x + 12, y + 8, 4, 8);
      } else if (type === 'cactus_large') {
        // Large cactus (width ~24, height ~46)
        ctx.fillRect(x + 8, y, 8, 46);
        ctx.fillRect(x, y + 12, 8, 6);
        ctx.fillRect(x, y + 6, 6, 12);
        ctx.fillRect(x + 16, y + 16, 8, 6);
        ctx.fillRect(x + 18, y + 10, 6, 12);
      } else {
        // Cactus group
        ctx.fillRect(x + 4, y + 6, 6, 38);
        ctx.fillRect(x, y + 14, 4, 4);
        ctx.fillRect(x, y + 10, 4, 8);

        ctx.fillRect(x + 16, y, 7, 44);
        ctx.fillRect(x + 23, y + 12, 4, 4);
        ctx.fillRect(x + 23, y + 8, 4, 8);

        ctx.fillRect(x + 32, y + 8, 5, 36);
        ctx.fillRect(x + 28, y + 16, 4, 4);
        ctx.fillRect(x + 28, y + 12, 4, 8);
      }
    };

    // Draw Cloud
    const drawCloudSprite = (cx: number, cy: number) => {
      ctx.fillStyle = '#c4c4c4';
      ctx.fillRect(cx + 16, cy, 32, 6);
      ctx.fillRect(cx + 8, cy + 6, 48, 6);
      ctx.fillRect(cx, cy + 12, 64, 4);
    };

    // Draw Ground with bumpy dashes
    const drawGround = (width: number, groundY: number, offset: number) => {
      ctx.strokeStyle = '#535353';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.stroke();

      ctx.fillStyle = '#737373';
      for (let i = 0; i < width + 60; i += 24) {
        const x = (i - (offset % 24) + width) % width;
        if (i % 48 === 0) {
          ctx.fillRect(x, groundY + 4, 3, 2);
        } else if (i % 72 === 0) {
          ctx.fillRect(x, groundY + 8, 5, 2);
        } else {
          ctx.fillRect(x, groundY + 3, 2, 1);
        }
      }
    };

    // ────────────────────────────
    // 60FPS Game Engine Loop
    // ────────────────────────────
    e.lastFrameTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - e.lastFrameTime) / 1000, 0.05);
      e.lastFrameTime = now;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clear Canvas Background (Clean Chrome #f7f7f7 or white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 1. UPDATE GAME
      if (e.state === 'running') {
        e.distance += e.speed * (dt * 60);
        const curScore = Math.floor(e.distance / 10);

        // Score 100-pt checkpoint chime
        if (curScore > 0 && curScore % 100 === 0 && curScore !== e.score) {
          dinoAudio.score(soundEnabled);
          e.flashScoreTimer = 30; // Flash score for 30 frames
        }
        e.score = curScore;

        // Smooth speed acceleration curve
        if (e.speed < e.maxSpeed) {
          e.speed += e.acceleration * (dt * 60);
        }

        // Dino Physics
        const dino = e.dino;
        if (!dino.isGrounded) {
          dino.vy += e.gravity * (dt * 60);
          dino.y += dino.vy * (dt * 60);

          const h = dino.isDucking ? 30 : 48;
          if (dino.y >= e.groundY - h) {
            dino.y = e.groundY - h;
            dino.vy = 0;
            dino.isGrounded = true;
          }
        } else {
          const h = dino.isDucking ? 30 : 48;
          dino.y = e.groundY - h;
        }

        // Running animation leg switcher
        dino.stepTimer += dt * (e.speed * 2.2);
        if (dino.stepTimer >= 1) {
          dino.step = dino.step === 0 ? 1 : 0;
          dino.stepTimer = 0;
        }

        // Scroll ground & clouds
        e.groundOffset += e.speed * (dt * 60);
        e.clouds.forEach((c) => {
          c.x -= c.speed * (dt * 60);
          if (c.x < -70) {
            c.x = width + 20 + Math.random() * 100;
            c.y = 15 + Math.random() * 40;
          }
        });

        // Obstacle Spawner with safe guaranteed gap
        e.nextObstacleTimer -= e.speed * (dt * 60);
        if (e.nextObstacleTimer <= 0) {
          const rand = Math.random();
          let type: 'cactus_small' | 'cactus_large' | 'cactus_group' | 'ptero' = 'cactus_small';
          let obsW = 16;
          let obsH = 34;
          let obsY = e.groundY - 34;
          let hitboxes: { x: number; y: number; w: number; h: number }[] = [];

          if (rand < 0.4) {
            type = 'cactus_small';
            obsW = 16;
            obsH = 34;
            obsY = e.groundY - 34;
            hitboxes = [{ x: 4, y: 2, w: 8, h: 30 }];
          } else if (rand < 0.7) {
            type = 'cactus_large';
            obsW = 24;
            obsH = 46;
            obsY = e.groundY - 46;
            hitboxes = [{ x: 6, y: 2, w: 12, h: 42 }];
          } else if (rand < 0.85) {
            type = 'cactus_group';
            obsW = 38;
            obsH = 44;
            obsY = e.groundY - 44;
            hitboxes = [
              { x: 4, y: 6, w: 10, h: 36 },
              { x: 16, y: 2, w: 18, h: 40 },
            ];
          } else if (e.score > 250) {
            // Pterodactyl flying at 3 standard heights
            type = 'ptero';
            obsW = 32;
            obsH = 18;
            const alt = Math.random();
            if (alt < 0.35) {
              obsY = e.groundY - 22; // Low: Jump over
            } else if (alt < 0.7) {
              obsY = e.groundY - 42; // Mid: Duck or high jump
            } else {
              obsY = e.groundY - 60; // High: Run under
            }
            hitboxes = [{ x: 4, y: 3, w: 24, h: 12 }];
          }

          e.obstacles.push({
            x: width + 30,
            y: obsY,
            width: obsW,
            height: obsH,
            type,
            pteroStep: 0,
            hitboxes,
          });

          // Safe gap proportional to speed
          const speedFactor = e.speed * 28;
          e.nextObstacleTimer = e.minObstacleGap + speedFactor + Math.random() * 140;
        }

        // Obstacle Collision Detection & Update
        const dinoHitbox = dino.isDucking
          ? { x: dino.x + 4, y: dino.y + 6, w: 54, h: 22 }
          : { x: dino.x + 6, y: dino.y + 4, w: 34, h: 40 };

        for (let i = e.obstacles.length - 1; i >= 0; i--) {
          const obs = e.obstacles[i];
          obs.x -= e.speed * (dt * 60);

          if (obs.type === 'ptero') {
            obs.pteroStep = Math.floor(now / 160) % 2;
          }

          // Forgiving Fair Hitbox Check
          for (const box of obs.hitboxes) {
            const bx = obs.x + box.x;
            const by = obs.y + box.y;
            const bw = box.w;
            const bh = box.h;

            const isOverlap =
              dinoHitbox.x < bx + bw &&
              dinoHitbox.x + dinoHitbox.w > bx &&
              dinoHitbox.y < by + bh &&
              dinoHitbox.y + dinoHitbox.h > by;

            if (isOverlap) {
              // Crash / Game Over
              e.state = 'gameover';
              setGameState('gameover');
              setGameOverScore(e.score);
              dinoAudio.hit(soundEnabled);
              const isNew = e.score > e.highScore;
              if (isNew) {
                e.highScore = e.score;
                setHighScore(e.score);
                setIsNewRecord(true);
                triggerConfetti();
                try {
                  localStorage.setItem('topsaas_dino_highscore_v2', e.score.toString());
                } catch {}
              }
              const durationMs = Math.max(1000, Date.now() - (e.startTime || Date.now()));
              onGameOver?.(e.score, e.highScore, isNew, durationMs);
              break;
            }
          }

          // Remove off-screen obstacles
          if (obs.x < -60) {
            e.obstacles.splice(i, 1);
          }
        }
      }

      // 2. RENDER SCENE
      // Render Clouds
      e.clouds.forEach((c) => drawCloudSprite(c.x, c.y));

      // Render Ground
      drawGround(width, e.groundY, e.groundOffset);

      // Render Obstacles
      e.obstacles.forEach((obs) => {
        if (obs.type === 'ptero') {
          const sprite = obs.pteroStep === 0 ? PTERO_1 : PTERO_2;
          drawPixelMatrix(sprite, obs.x, obs.y, 2, '#202124');
        } else {
          drawCactusSprite(obs.type, obs.x, obs.y);
        }
      });

      // Render Dino Sprite
      const dino = e.dino;
      let dinoSprite: string[];

      if (e.state === 'gameover') {
        dinoSprite = DINO_DEAD;
      } else if (dino.isDucking) {
        dinoSprite = dino.step === 0 ? DINO_DUCK_1 : DINO_DUCK_2;
      } else if (!dino.isGrounded) {
        dinoSprite = DINO_JUMP;
      } else {
        dinoSprite = dino.step === 0 ? DINO_RUN_LEFT : DINO_RUN_RIGHT;
      }

      drawPixelMatrix(dinoSprite, dino.x, dino.y, 2, '#202124');

      // 3. RENDER HUD (Direct to canvas for zero re-renders)
      ctx.fillStyle = '#535353';
      ctx.font = 'bold 13px "Courier New", Courier, monospace';
      ctx.textAlign = 'right';

      const pad5 = (n: number) => n.toString().padStart(5, '0');
      const scoreStr = pad5(e.score);
      const hiStr = e.highScore > 0 ? `HI ${pad5(e.highScore)}  ` : '';

      if (e.flashScoreTimer > 0) {
        e.flashScoreTimer--;
        if (Math.floor(e.flashScoreTimer / 4) % 2 === 0) {
          ctx.fillText(`${hiStr}${scoreStr}`, width - 16, 22);
        } else {
          ctx.fillText(`${hiStr}`, width - 16, 22);
        }
      } else {
        ctx.fillText(`${hiStr}${scoreStr}`, width - 16, 22);
      }

      ctx.restore();
      e.animId = requestAnimationFrame(loop);
    };

    e.animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(e.animId);
      window.removeEventListener('resize', updateSize);
    };
  }, [soundEnabled, triggerConfetti]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xs select-none transition-all"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-3.5 py-1.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-black text-white shadow-2xs">
            <Zap className="h-3 w-3 fill-current" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-black font-mono">
            TopSAAS Runner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {highScore > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-200">
              <Trophy className="h-3 w-3 text-amber-500 fill-amber-400" />
              <span>HI {highScore.toString().padStart(5, '0')}</span>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playSound('click', soundEnabled);
              resetGame();
            }}
            className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Reset Game"
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          {onToggleSound && (
            <button
              type="button"
              onClick={(e) => {
                playSound('click', soundEnabled);
                onToggleSound();
              }}
              className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="relative cursor-pointer"
        onMouseDown={handleJumpPress}
        onMouseUp={handleJumpRelease}
        onTouchStart={(e) => {
          // If tap in lower 30% of canvas, treat as duck
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const touchY = e.touches[0].clientY - rect.top;
          if (touchY > rect.height * 0.7) {
            handleDuckPress();
          } else {
            handleJumpPress();
          }
        }}
        onTouchEnd={() => {
          handleJumpRelease();
          handleDuckRelease();
        }}
      >
        {/* In-Game Background Featured Sponsor Badge */}
        <div className="absolute top-2.5 left-3 sm:left-4 z-10 pointer-events-auto">
          {featuredProduct ? (
            <a
              href={featuredProduct.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click', soundEnabled);
                onTrackClick?.(featuredProduct.id, featuredProduct.url);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-neutral-200/90 bg-white/90 hover:bg-white px-2 sm:px-2.5 py-1 text-[11px] font-bold text-black backdrop-blur-xs shadow-2xs hover:border-black transition-all cursor-pointer group select-none"
              title={`Featured: ${featuredProduct.name}`}
            >
              {featuredProduct.logoUrl ? (
                <img
                  src={featuredProduct.logoUrl}
                  alt={featuredProduct.name}
                  className="h-4 w-4 rounded object-cover shrink-0 border border-neutral-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded bg-black text-white text-[9px] font-black shrink-0">
                  {featuredProduct.name[0]}
                </div>
              )}
              <span className="text-[11px] font-black text-black group-hover:underline truncate max-w-[100px] sm:max-w-[160px]">
                {featuredProduct.name}
              </span>
              <span className="rounded bg-black text-white text-[8px] font-black uppercase px-1 py-0.5 tracking-wider shrink-0">
                Featured
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click', soundEnabled);
                onOpenFeaturedSpotModal?.();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white/80 hover:bg-white px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black hover:border-black backdrop-blur-xs shadow-2xs transition-all cursor-pointer group select-none"
              title="Claim this featured spot"
            >
              <Crown className="h-3 w-3 text-neutral-400 group-hover:text-black transition-colors" />
              <span>Get Featured Here</span>
            </button>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="block w-full h-[180px] bg-white cursor-pointer"
        />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xs p-4 text-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
            >
              <span>Press Space to Play</span>
            </button>
            <p className="mt-2 text-[11px] text-neutral-500 font-medium">
              Space / ↑ to Jump (Hold for high jump) • ↓ to Duck
            </p>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-2xs p-4 text-center">
            <span className="text-sm font-black tracking-widest text-black font-mono mb-2">
              G A M E  O V E R
            </span>

            {isNewRecord ? (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-0.5 text-xs font-black text-amber-800">
                <Trophy className="h-3 w-3 fill-amber-500" />
                <span>NEW HIGH SCORE: {gameOverScore}</span>
              </div>
            ) : (
              <p className="mb-2 text-xs text-neutral-600 font-mono font-bold">
                SCORE: {gameOverScore}
              </p>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Play Again (Space)</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Quick Controls */}
      <div className="flex sm:hidden items-center justify-between border-t border-neutral-200 bg-neutral-50 px-3 py-1.5">
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            handleDuckPress();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleDuckRelease();
          }}
          className="flex-1 mr-2 flex items-center justify-center gap-1 rounded-lg border border-neutral-300 bg-white py-1.5 text-xs font-bold text-neutral-700 active:bg-neutral-200"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          <span>DUCK</span>
        </button>

        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            handleJumpPress();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleJumpRelease();
          }}
          className="flex-1 ml-2 flex items-center justify-center gap-1 rounded-lg bg-black py-1.5 text-xs font-bold text-white active:bg-neutral-800 shadow-2xs"
        >
          <ChevronUp className="h-3.5 w-3.5" />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
};
