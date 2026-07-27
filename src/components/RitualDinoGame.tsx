import { useEffect, useMemo, useRef, useState } from 'react';
import { Gamepad2, RotateCcw } from 'lucide-react';

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
};

const GRAVITY = 0.85;
const JUMP_FORCE = 11.5;
const GROUND_HEIGHT = 22;
const PLAYER_SIZE = 26;
const GAME_WIDTH = 640;
const GAME_HEIGHT = 220;
const PLAYER_LEFT = 56;
const BASE_SPEED = 5.5;
const MAX_SPEED = 11;
const HITBOX_INSET_X = 3;
const HITBOX_INSET_TOP = 2;
const HITBOX_INSET_BOTTOM = 4;

export default function RitualDinoGame() {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.localStorage.getItem('ritual_dino_best');
    return saved ? Number(saved) : 0;
  });
  const [playerY, setPlayerY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const rafRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const bestRef = useRef(best);
  const playerYRef = useRef(0);
  const velocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const tickRef = useRef(0);
  const spawnRef = useRef(0);
  const runningRef = useRef(false);
  const gameOverRef = useRef(false);

  const persistBest = (nextBest: number) => {
    bestRef.current = nextBest;
    setBest(nextBest);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ritual_dino_best', String(nextBest));
    }
  };

  const resetState = (startImmediately = true) => {
    scoreRef.current = 0;
    playerYRef.current = 0;
    velocityRef.current = 0;
    obstaclesRef.current = [];
    tickRef.current = 0;
    spawnRef.current = 0;
    runningRef.current = startImmediately;
    gameOverRef.current = false;

    setScore(0);
    setPlayerY(0);
    setObstacles([]);
    setGameOver(false);
    setRunning(startImmediately);
  };

  const restart = () => {
    resetState(true);
    velocityRef.current = JUMP_FORCE;
  };

  const jump = () => {
    if (gameOverRef.current) {
      restart();
      return;
    }

    const grounded = playerYRef.current <= 0.01;
    if (!runningRef.current) {
      resetState(true);
      velocityRef.current = JUMP_FORCE;
      return;
    }

    if (grounded) {
      velocityRef.current = JUMP_FORCE;
    }
  };

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (isTypingTarget) {
        return;
      }

      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    runningRef.current = running;
    gameOverRef.current = gameOver;

    if (!running || gameOver) {
      if (rafRef.current) {
        window.clearTimeout(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const step = () => {
      if (!runningRef.current || gameOverRef.current) return;

      tickRef.current += 1;
      spawnRef.current += 1;
      const speed = Math.min(MAX_SPEED, BASE_SPEED + tickRef.current / 350);

      scoreRef.current += 1;
      setScore(scoreRef.current);

      if (scoreRef.current > bestRef.current) {
        persistBest(scoreRef.current);
      }

      velocityRef.current -= GRAVITY;
      playerYRef.current = Math.max(0, playerYRef.current + velocityRef.current);
      if (playerYRef.current === 0 && velocityRef.current < 0) {
        velocityRef.current = 0;
      }
      setPlayerY(playerYRef.current);

      let nextObstacles = obstaclesRef.current
        .map(ob => ({ ...ob, x: ob.x - speed }))
        .filter(ob => ob.x + ob.width > -20);

      if (spawnRef.current > 70 + Math.random() * 45) {
        spawnRef.current = 0;
        nextObstacles = [
          ...nextObstacles,
          {
            id: Date.now() + Math.random(),
            x: GAME_WIDTH + 10,
            width: 14 + Math.random() * 18,
            height: 20 + Math.random() * 34,
          },
        ];
      }

      const playerLeft = PLAYER_LEFT + HITBOX_INSET_X;
      const playerRight = PLAYER_LEFT + PLAYER_SIZE - HITBOX_INSET_X;
      const playerBottom = GAME_HEIGHT - GROUND_HEIGHT - playerYRef.current - HITBOX_INSET_BOTTOM;
      const playerTop = playerBottom - PLAYER_SIZE + HITBOX_INSET_TOP;

      const collided = nextObstacles.some(ob => {
        const obLeft = ob.x;
        const obRight = ob.x + ob.width;
        const obBottom = GAME_HEIGHT - GROUND_HEIGHT;
        const obTop = obBottom - ob.height;

        return playerRight > obLeft && playerLeft < obRight && playerBottom > obTop && playerTop < obBottom;
      });

      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);

      if (collided) {
        runningRef.current = false;
        gameOverRef.current = true;
        setRunning(false);
        setGameOver(true);
        return;
      }

      rafRef.current = window.setTimeout(step, 16) as unknown as number;
    };

    rafRef.current = window.setTimeout(step, 16) as unknown as number;

    return () => {
      if (rafRef.current) {
        window.clearTimeout(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [running, gameOver]);

  const status = useMemo(() => {
    if (gameOver) return 'Connection lost. Dino still ships.';
    if (!running) return 'Tap jump to start.';
    return 'Avoid the bugs while Ritual settles blocks.';
  }, [gameOver, running]);

  return (
    <div className="card p-5 bg-slate-950 text-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold">Ritual Runner</h3>
          </div>
          <p className="text-xs text-slate-400">{status}</p>
        </div>
        <button onClick={restart} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5">
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      <button
        type="button"
        onClick={jump}
        className="relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_40%),linear-gradient(180deg,_#0f172a,_#020617)]"
        style={{ height: GAME_HEIGHT }}
      >
        <div className="absolute left-0 right-0 top-6 flex justify-between px-4 text-[11px] font-mono text-slate-300">
          <span>score {score}</span>
          <span>best {best}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[22px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400" />

        <div
          className="absolute flex items-end"
          style={{ left: PLAYER_LEFT, bottom: GROUND_HEIGHT + playerY, width: PLAYER_SIZE, height: PLAYER_SIZE }}
        >
          <div className="relative h-[26px] w-[26px] rounded-[6px] border border-orange-300 bg-orange-400/90 shadow-[0_0_20px_rgba(251,146,60,0.35)]">
            <div className="absolute left-[6px] top-[7px] h-[4px] w-[4px] rounded-full bg-slate-950" />
            <div className="absolute bottom-[-6px] left-[5px] h-[8px] w-[3px] rounded bg-orange-200" />
            <div className="absolute bottom-[-6px] right-[5px] h-[8px] w-[3px] rounded bg-orange-200" />
          </div>
        </div>

        {obstacles.map(ob => (
          <div
            key={ob.id}
            className="absolute rounded-t-md bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.4)]"
            style={{
              left: ob.x,
              bottom: GROUND_HEIGHT,
              width: ob.width,
              height: ob.height,
            }}
          />
        ))}

        <div className="absolute inset-x-0 bottom-9 flex items-center justify-center text-[11px] text-slate-400">
          <span>space / tap to jump</span>
        </div>
      </button>
    </div>
  );
}
