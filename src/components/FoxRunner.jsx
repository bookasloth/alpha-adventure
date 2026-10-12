"use client";

import { useEffect, useRef } from "react";

// Chrome "No internet" dino game, with a fox. Space / ↑ / tap to jump,
// ↓ to duck. Canvas is 600x150 logical px, same as Chrome's.
const W = 600, H = 150, GROUND = 127, INK = "#535353";

const sprite = (rows) => rows.map((r) => [...r].map((c) => c === "#"));
const FOX_BODY = [
  "..............#...#.",
  ".............##..##.",
  ".............######.",
  "............#######.",
  "............##.####.",
  "............#######.",
  "...........#########",
  "...........#####....",
  "#.........######....",
  "##.......#######....",
  ".##.....########....",
  "..##############....",
  "..##############....",
  "...#############....",
  "....###########.....",
];
const FOX_RUN1 = sprite([...FOX_BODY, "....##......##......", "....#........#......", "...##.......##......"]);
const FOX_RUN2 = sprite([...FOX_BODY, ".....##....##.......", "......#.....#.......", "......##....##......"]);
const FOX_JUMP = sprite([...FOX_BODY, "....##......##......", "....##......##......", "...................."]);
const FOX_DEAD = sprite(FOX_BODY.map((r, i) => (i === 4 ? "............#.#.###." : r)).concat(["....##......##......", "....#........#......", "...##.......##......"]));
const DUCK_BODY = [
  ".......................#..#",
  "......................####.",
  "##...................#####.",
  ".##################.##.###.",
  "..########################.",
  "..#########################",
  "...###############.........",
  "...##############..........",
];
const FOX_DUCK1 = sprite([...DUCK_BODY, "....##.......##............", "....#........#.............", "...##.......##............."]);
const FOX_DUCK2 = sprite([...DUCK_BODY, ".....##.....##.............", "......#......#.............", "......##.....##............"]);
const BIRD1 = sprite([
  "......#.............",
  "......##............",
  "......###...........",
  "...#..####..........",
  "..###.#####.........",
  ".############.......",
  "...############.....",
  ".......##########...",
  ".......########.....",
  "........#####.......",
]);
const BIRD2 = sprite([
  "....................",
  "....................",
  "...#................",
  "..###...............",
  ".################...",
  "...############.....",
  ".......######.......",
  ".......#####........",
  ".......####.........",
  ".......###..........",
]);
const PX = 2; // sprite pixel size

function draw(ctx, spr, x, y) {
  for (let r = 0; r < spr.length; r++)
    for (let c = 0; c < spr[r].length; c++) if (spr[r][c]) ctx.fillRect(x + c * PX, y + r * PX, PX, PX);
}

function cactus(ctx, o) {
  // trunk + two arms, scaled by o.h
  for (let i = 0; i < o.n; i++) {
    const x = o.x + i * 14, h = o.h, y = GROUND - h;
    ctx.fillRect(x + 4, y, 6, h);
    ctx.fillRect(x, y + h * 0.3, 3, h * 0.35);
    ctx.fillRect(x, y + h * 0.6, 6, 3);
    ctx.fillRect(x + 11, y + h * 0.2, 3, h * 0.35);
    ctx.fillRect(x + 8, y + h * 0.5, 6, 3);
  }
}

export default function FoxRunner() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let hi = 0;
    try { hi = Number(localStorage.getItem("fox-hi")) || 0; } catch {}

    const s = {};
    const reset = () => Object.assign(s, {
      state: "idle", // idle | run | over
      y: 0, vy: 0, duck: false, speed: 6, dist: 0, frame: 0,
      obs: [], next: 40, clouds: [{ x: 420, y: 30 }, { x: 200, y: 55 }],
      ground: 0, flash: 0, night: false, nightAt: 700,
    });
    reset();

    const jump = () => {
      if (s.state === "over") { reset(); s.state = "run"; return; }
      if (s.state === "idle") s.state = "run";
      if (s.y === 0) s.vy = -10.5;
    };
    const key = (e, down) => {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) { e.preventDefault(); if (down) jump(); }
      if (["ArrowDown", "KeyS"].includes(e.code)) { e.preventDefault(); s.duck = down; if (down && s.y < 0) s.vy += 4; }
    };
    const kd = (e) => key(e, true), ku = (e) => key(e, false);
    const tap = (e) => { e.preventDefault(); jump(); };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    canvas.addEventListener("pointerdown", tap);

    function spawn() {
      const score = s.dist * 0.1;
      if (score > 300 && Math.random() < 0.3) {
        const heights = [GROUND - 24, GROUND - 50, GROUND - 75];
        s.obs.push({ kind: "bird", x: W, y: heights[(Math.random() * 3) | 0], w: 40, h: 20 });
      } else {
        const big = Math.random() < 0.5, n = 1 + ((Math.random() * (s.speed > 8 ? 3 : 2)) | 0);
        s.obs.push({ kind: "cactus", x: W, h: big ? 46 : 32, n, w: n * 14, y: GROUND - (big ? 46 : 32) });
      }
      s.next = 50 + Math.random() * 60 + (s.speed - 6) * 4; // gap in frames
    }

    function foxBox() {
      return s.duck && s.y === 0
        ? { x: 50 + 4, y: GROUND - 22 + 4, w: 48, h: 16 }
        : { x: 50 + 6, y: GROUND - 36 + s.y + 2, w: 30, h: 32 };
    }
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    let raf, last = performance.now();
    function tick(now) {
      const dt = Math.min(2, (now - last) / (1000 / 60)); // 60fps-normalised step
      last = now;

      if (s.state === "run") {
        s.frame += dt;
        s.speed = Math.min(13, s.speed + 0.0012 * dt);
        s.dist += s.speed * dt;
        s.vy += 0.6 * dt;
        s.y = Math.min(0, s.y + s.vy * dt);
        if (s.y === 0) s.vy = 0;
        s.ground = (s.ground + s.speed * dt) % 24;
        for (const c of s.clouds) { c.x -= 0.5 * dt; if (c.x < -50) { c.x = W + Math.random() * 100; c.y = 20 + Math.random() * 50; } }
        for (const o of s.obs) o.x -= (s.speed + (o.kind === "bird" ? 0.8 : 0)) * dt;
        s.obs = s.obs.filter((o) => o.x + o.w > -10);
        if ((s.next -= dt) <= 0) spawn();

        const fb = foxBox();
        if (s.obs.some((o) => hit(fb, { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 4 }))) {
          s.state = "over";
          const score = Math.floor(s.dist * 0.1);
          if (score > hi) { hi = score; try { localStorage.setItem("fox-hi", String(hi)); } catch {} }
        }

        const score = Math.floor(s.dist * 0.1);
        if (score > 0 && score % 100 === 0 && s.flash <= 0) s.flash = 60;
        if (s.flash > 0) s.flash -= dt;
        if (score >= s.nightAt) { s.night = !s.night; s.nightAt += 700; canvas.style.filter = s.night ? "invert(1)" : ""; }
      }

      // render
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.35;
      for (const c of s.clouds) { ctx.fillRect(c.x, c.y, 36, 6); ctx.fillRect(c.x + 8, c.y - 6, 18, 6); }
      ctx.globalAlpha = 1;
      ctx.fillRect(0, GROUND, W, 1);
      for (let x = -s.ground; x < W; x += 24) { ctx.fillRect(x + 3, GROUND + 5, 2, 1); ctx.fillRect(x + 14, GROUND + 9, 3, 1); }

      for (const o of s.obs) {
        if (o.kind === "cactus") cactus(ctx, o);
        else draw(ctx, Math.floor(s.frame / 10) % 2 ? BIRD1 : BIRD2, o.x, o.y);
      }

      const runFrame = Math.floor(s.frame / 6) % 2;
      let spr;
      if (s.state === "over") spr = FOX_DEAD;
      else if (s.y < 0 || s.state === "idle") spr = FOX_JUMP;
      else if (s.duck) spr = runFrame ? FOX_DUCK1 : FOX_DUCK2;
      else spr = runFrame ? FOX_RUN1 : FOX_RUN2;
      draw(ctx, spr, 50, GROUND - spr.length * PX + s.y);

      ctx.font = "bold 12px 'Courier New', monospace";
      ctx.textAlign = "right";
      const pad = (n) => String(n).padStart(5, "0");
      const score = Math.floor(s.dist * 0.1);
      const showScore = s.flash <= 0 || Math.floor(s.flash / 8) % 2 === 0;
      ctx.fillText(`HI ${pad(hi)}  ${showScore ? pad(score) : "     "}`, W - 10, 20);

      ctx.textAlign = "center";
      if (s.state === "idle") ctx.fillText("PRESS SPACE OR TAP TO START", W / 2, 70);
      if (s.state === "over") {
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillText("G A M E   O V E R", W / 2, 60);
        // restart icon
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, 88, 10, -Math.PI * 0.4, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(W / 2 + 2, 72); ctx.lineTo(W / 2 + 10, 78); ctx.lineTo(W / 2 + 1, 83);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      canvas.removeEventListener("pointerdown", tap);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label="Fox runner game. Press space or tap to jump, down arrow to duck."
      className="mx-auto block w-full max-w-[600px] cursor-pointer touch-none select-none bg-white"
      style={{ aspectRatio: `${W} / ${H}` }}
    />
  );
}
