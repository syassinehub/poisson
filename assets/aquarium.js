// Aquarium animé en canvas : poissons procéduraux, banc de néons (boids),
// crevettes, escargot, plantes, rayons de lumière, caustiques, bulles.
// Interaction : les poissons fuient la souris, un clic dans l'eau fait tomber
// de la nourriture qu'ils viennent manger.
//
// Modes : "hero" (scène complète), "head" (bandeau des pages), "footer".

(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Géométrie du corps des poissons (vue de profil) ----------
  // Un poisson est décrit le long d'une colonne u ∈ [0 museau, 1 base de la queue].
  // La colonne ondule (onde qui se propage vers la queue), le contour suit.

  const SAMPLES = 14;

  // Demi-hauteur du corps le long de u (0..1), selon la silhouette de l'espèce.
  const PROFILES = {
    slim: (u) => (u < 0.32 ? 0.2 + 0.8 * Math.sin((u / 0.32) * Math.PI / 2) : 0.26 + 0.74 * Math.cos(((u - 0.32) / 0.68) * Math.PI / 2) ** 1.15),
    deep: (u) => (u < 0.3 ? 0.25 + 0.75 * Math.sin((u / 0.3) * Math.PI / 2) ** 0.8 : 0.24 + 0.76 * Math.cos(((u - 0.3) / 0.7) * Math.PI / 2) ** 1.3),
    cory: (u) => (u < 0.35 ? 0.3 + 0.7 * Math.sin((u / 0.35) * Math.PI / 2) ** 0.7 : 0.3 + 0.7 * Math.cos(((u - 0.35) / 0.65) * Math.PI / 2) ** 1.1),
  };

  function buildBody(L, H, phase, amp, profile, topK = 1, botK = 1) {
    const sp = [], hs = [], top = [], bot = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const u = i / SAMPLES;
      const x = L * (0.5 - u * 0.85);
      const y = Math.sin(phase - u * 4.2) * amp * u * u;
      const h = H * profile(u);
      sp.push([x, y]);
      hs.push(h);
      top.push([x, y - h * topK]);
      bot.push([x, y + h * botK]);
    }
    const nose = [L * 0.53, sp[0][1] + H * 0.05];
    return { L, H, sp, hs, top, bot, loop: [nose, ...top, ...bot.slice().reverse()] };
  }

  // Point interpolé sur un tableau d'échantillons
  function at(arr, u) {
    const f = clamp(u, 0, 1) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
    const a = arr[i], b = arr[i + 1];
    return Array.isArray(a) ? [lerp(a[0], b[0], k), lerp(a[1], b[1], k)] : lerp(a, b, k);
  }

  // Courbe fermée lissée passant par les milieux des points
  function smoothClosed(ctx, pts) {
    const n = pts.length;
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      m = mid(p, q);
      ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    ctx.closePath();
  }

  // Nageoire dorsale/anale : base le long du contour, pointe repoussée vers l'arrière
  function drawFin(ctx, body, edge, u0, u1, height, fill, phase, sweep = 0.35) {
    const base = [], tip = [], N = 7;
    for (let i = 0; i <= N; i++) {
      const v = i / N, u = lerp(u0, u1, v);
      const p = at(edge, u);
      base.push(p);
      const shape = Math.sin(Math.PI * Math.min(1, v * 1.15)) ** 0.7 * (1 - 0.35 * v);
      const ripple = 1 + 0.12 * Math.sin(phase * 1.3 - v * 3);
      tip.push([p[0] - Math.abs(height) * sweep * v - Math.abs(height) * 0.25 * shape, p[1] + height * shape * ripple]);
    }
    ctx.beginPath();
    smoothClosed(ctx, [...base, ...tip.reverse()]);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawTail(ctx, body, size, fill, phase, swim, forked = 0.62) {
    const n = SAMPLES, [x1, y1] = body.sp[n], [x0, y0] = body.sp[n - 2];
    const hb = body.hs[n];
    const ang = Math.atan2(-(y1 - y0), -(x1 - x0)) + Math.sin(phase - 5.2) * 0.32 * swim;
    ctx.save();
    ctx.translate(x1 + body.L * 0.01, y1);
    ctx.rotate(ang);
    const spread = 0.55 + 0.08 * Math.sin(phase * 0.7);
    ctx.beginPath();
    smoothClosed(ctx, [
      [0.5, -hb * 0.9], [-size * 0.55, -size * spread * 0.75], [-size, -size * spread],
      [-size * forked, 0],
      [-size, size * spread], [-size * 0.55, size * spread * 0.75], [0.5, hb * 0.9],
    ]);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function drawPectoral(ctx, body, u, fill, phase, len) {
    const [x, y] = at(body.sp, u);
    const h = at(body.hs, u);
    ctx.save();
    ctx.translate(x, y + h * 0.35);
    ctx.rotate(0.55 + Math.sin(phase * 1.6) * 0.35);
    ctx.beginPath();
    ctx.ellipse(-len * 0.5, 0, len * 0.55, len * 0.22, 0, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function drawEye(ctx, body, u, r, iris, ring = "rgba(235,240,245,.9)") {
    const [x, y] = at(body.sp, u);
    const ey = y - at(body.hs, u) * 0.22;
    ctx.beginPath(); ctx.arc(x, ey, r, 0, TAU); ctx.fillStyle = ring; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.08, ey, r * 0.68, 0, TAU); ctx.fillStyle = iris; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.15, ey, r * 0.42, 0, TAU); ctx.fillStyle = "#050607"; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.32, ey - r * 0.32, r * 0.2, 0, TAU); ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fill();
  }

  // Bande qui suit la colonne (rayure, ventre coloré...) : offsets en fraction de demi-hauteur
  function bandPath(ctx, body, u0, u1, off0, off1) {
    const N = 10, up = [], down = [];
    for (let i = 0; i <= N; i++) {
      const u = lerp(u0, u1, i / N), [x, y] = at(body.sp, u), h = at(body.hs, u);
      up.push([x, y + h * off0]);
      down.push([x, y + h * off1]);
    }
    ctx.beginPath();
    ctx.moveTo(up[0][0], up[0][1]);
    up.forEach((p) => ctx.lineTo(p[0], p[1]));
    down.reverse().forEach((p) => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
  }

  function bodyPath(ctx, body) {
    ctx.beginPath();
    smoothClosed(ctx, body.loop);
  }

  // ---------- Espèces ----------
  const SPECIES = {
    neon: {
      len: 34, H: 0.13, speed: 1.9, minSpeed: 0.55, school: true, amp: 0.08, freq: 1.5,
      zone: (T, f) => [T.top + 40, T.bottom - 60],
      draw(ctx, f, t) {
        const L = f.size, H = L * this.H;
        const b = buildBody(L, H, f.phase, L * this.amp * (0.35 + f.swim), PROFILES.slim);
        drawFin(ctx, b, b.top, 0.4, 0.55, -H * 0.9, "rgba(225,235,240,.35)", f.phase);
        drawFin(ctx, b, b.bot, 0.48, 0.8, H * 0.85, "rgba(225,235,240,.3)", f.phase);
        drawTail(ctx, b, L * 0.24, "rgba(235,215,215,.42)", f.phase, f.swim);

        bodyPath(ctx, b);
        const g = ctx.createLinearGradient(0, -H, 0, H);
        g.addColorStop(0, "#56705f"); g.addColorStop(0.45, "#aab9b2"); g.addColorStop(1, "#eef3f2");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.save();
        ctx.clip();
        bandPath(ctx, b, 0.42, 1, 0.05, 1.3);
        ctx.fillStyle = "#e3233e";
        ctx.fill();
        // rayure bleu électrique, irisée
        const hue = 188 + 14 * Math.sin(t * 1.7 + f.seed), light = 58 + 10 * Math.sin(t * 2.3 + f.seed * 2);
        bandPath(ctx, b, 0.1, 0.92, -0.62, -0.02);
        ctx.fillStyle = `hsl(${hue} 100% ${light}%)`;
        ctx.fill();
        ctx.restore();
        // halo de la rayure
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha *= 0.35;
        bandPath(ctx, b, 0.14, 0.88, -0.9, 0.2);
        ctx.fillStyle = `hsl(${hue} 100% 55%)`;
        ctx.fill();
        ctx.restore();
        drawPectoral(ctx, b, 0.24, "rgba(230,240,245,.35)", f.phase, L * 0.12);
        drawEye(ctx, b, 0.1, L * 0.068, "#2a8fb8");
      },
    },

    ramirezi: {
      len: 66, H: 0.22, speed: 1.1, amp: 0.05, freq: 1, hover: true,
      zone: (T) => [T.top + T.h * 0.28, T.bottom - 30],
      draw(ctx, f, t) {
        const L = f.size, H = L * this.H;
        const b = buildBody(L, H, f.phase, L * this.amp * (0.3 + f.swim), PROFILES.deep, 1, 0.95);
        drawFin(ctx, b, b.top, 0.22, 0.78, -H * 1.05, "rgba(110,140,215,.55)", f.phase, 0.5);
        drawFin(ctx, b, b.top, 0.2, 0.33, -H * 1.2, "rgba(15,15,20,.9)", f.phase, 0.2);
        drawFin(ctx, b, b.bot, 0.55, 0.82, H * 0.95, "rgba(110,150,220,.55)", f.phase, 0.45);
        drawFin(ctx, b, b.bot, 0.27, 0.36, H * 1.25, "rgba(240,95,45,.85)", f.phase, 0.5);
        drawTail(ctx, b, L * 0.28, "rgba(120,150,215,.55)", f.phase, f.swim, 0.85);

        bodyPath(ctx, b);
        const g = ctx.createLinearGradient(L * 0.5, 0, -L * 0.4, 0);
        g.addColorStop(0, "#f2a93b"); g.addColorStop(0.28, "#f0c86a"); g.addColorStop(0.55, "#9db8d8"); g.addColorStop(1, "#5c76c4");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const v = ctx.createLinearGradient(0, -H, 0, H);
        v.addColorStop(0, "rgba(20,30,60,.35)"); v.addColorStop(0.5, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(255,110,60,.35)");
        ctx.fillStyle = v;
        ctx.fillRect(-L, -H * 2, L * 2, H * 4);
        bandPath(ctx, b, 0.08, 0.16, -1.4, 1.4);
        ctx.fillStyle = "rgba(15,15,20,.85)";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(at(b.sp, 0.45)[0], at(b.sp, 0.45)[1] - H * 0.1, L * 0.035, H * 0.22, 0, 0, TAU);
        ctx.fillStyle = "rgba(15,15,20,.75)";
        ctx.fill();
        for (const [u, w] of f.spots) {
          const [x, y] = at(b.sp, u), h = at(b.hs, u);
          ctx.beginPath();
          ctx.arc(x, y + h * w, L * 0.016, 0, TAU);
          ctx.fillStyle = `hsla(${190 + 20 * Math.sin(t + u * 9)},95%,72%,.9)`;
          ctx.fill();
        }
        ctx.restore();
        drawPectoral(ctx, b, 0.25, "rgba(240,200,140,.35)", f.phase, L * 0.12);
        drawEye(ctx, b, 0.11, L * 0.06, "#d32630", "rgba(240,190,80,.95)");
      },
    },

    cory: {
      len: 50, H: 0.17, speed: 0.9, amp: 0.05, freq: 1.3, bottom: true,
      zone: (T, f) => {
        const y = T.floorAt(f.x);
        return [y - 30, y - 9];
      },
      draw(ctx, f, t) {
        const L = f.size, H = L * this.H;
        const b = buildBody(L, H, f.phase, L * this.amp * (0.3 + f.swim), PROFILES.cory, 1.15, 0.75);
        drawFin(ctx, b, b.top, 0.24, 0.42, -H * 1.35, "rgba(20,20,22,.9)", f.phase, 0.25);
        drawFin(ctx, b, b.top, 0.72, 0.8, -H * 0.5, "rgba(230,220,205,.6)", f.phase, 0.2);
        drawFin(ctx, b, b.bot, 0.6, 0.78, H * 0.75, "rgba(230,225,215,.4)", f.phase);
        drawTail(ctx, b, L * 0.25, "rgba(230,225,215,.45)", f.phase, f.swim, 0.55);

        bodyPath(ctx, b);
        const g = ctx.createLinearGradient(0, -H, 0, H);
        g.addColorStop(0, "#cdbca8"); g.addColorStop(0.5, "#efe5d8"); g.addColorStop(1, "#f6ede4");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.save();
        ctx.clip();
        // masque noir du "panda" et tache du pédoncule
        bandPath(ctx, b, 0.05, 0.19, -1.5, 0.45);
        ctx.fillStyle = "#18181a";
        ctx.fill();
        bandPath(ctx, b, 0.8, 0.93, -1.3, 0.8);
        ctx.fill();
        // plaques osseuses
        ctx.strokeStyle = "rgba(120,100,80,.18)";
        ctx.lineWidth = L * 0.01;
        for (let u = 0.25; u < 0.9; u += 0.07) {
          const [x, y] = at(b.sp, u);
          ctx.beginPath(); ctx.moveTo(x, y - H); ctx.lineTo(x - L * 0.02, y + H); ctx.stroke();
        }
        ctx.restore();
        // barbillons
        const [nx, ny] = b.loop[0];
        ctx.strokeStyle = "rgba(230,215,195,.8)";
        ctx.lineWidth = 0.8;
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          ctx.moveTo(nx - 2, ny + H * 0.3);
          ctx.quadraticCurveTo(nx + 1, ny + H * (0.7 + k * 0.3), nx - 1 + k * 2 + Math.sin(f.phase + k) * 0.8, ny + H * (0.9 + k * 0.25));
          ctx.stroke();
        }
        drawPectoral(ctx, b, 0.22, "rgba(235,225,210,.55)", f.phase, L * 0.14);
        drawEye(ctx, b, 0.11, L * 0.052, "#2b2b2b", "rgba(200,205,210,.95)");
      },
    },
  };

  // ---------- Poisson ----------
  class Fish {
    constructor(tank, kind) {
      this.tank = tank;
      this.kind = kind;
      this.sp = SPECIES[kind];
      this.z = kind === "neon" ? rand(0.55, 1) : rand(0.78, 1);
      this.size = this.sp.len * rand(0.88, 1.12);
      this.x = rand(40, tank.w - 40);
      const [y0, y1] = this.sp.zone(tank, this);
      this.y = rand(y0, Math.max(y0 + 1, y1));
      this.vx = rand(-1, 1) * this.sp.speed;
      this.vy = rand(-0.2, 0.2);
      this.phase = rand(0, TAU);
      this.facing = Math.sign(this.vx) || 1;
      this.pitch = 0;
      this.swim = 0.5;
      this.boost = 0;
      this.seed = rand(0, 100);
      this.wander = rand(0, TAU);
      this.timer = 0;
      this.rest = 0;
      this.spots = Array.from({ length: 16 }, () => [rand(0.3, 0.85), rand(-0.7, 0.7)]);
    }

    mouth() {
      const dir = Math.sign(this.facing) || 1;
      const r = this.size * 0.5 * this.z;
      return [this.x + Math.cos(this.pitch) * r * dir, this.y + Math.sin(this.pitch) * r];
    }

    update(dt, t) {
      const T = this.tank, sp = this.sp;
      let ax = 0, ay = 0;
      const [y0, y1] = sp.zone(T, this);

      // rester dans l'aquarium
      const m = 70;
      if (this.x < m) ax += (m - this.x) * 0.0016;
      if (this.x > T.w - m) ax -= (this.x - (T.w - m)) * 0.0016;
      if (this.y < y0) ay += (y0 - this.y) * 0.0025;
      if (this.y > y1) ay -= (this.y - y1) * 0.0035;

      if (sp.school) {
        // boids : séparation, alignement, cohésion
        let n = 0, cx = 0, cy = 0, avx = 0, avy = 0, sx = 0, sy = 0;
        for (const o of T.fish) {
          if (o === this || o.kind !== this.kind) continue;
          const dx = o.x - this.x, dy = o.y - this.y, d2 = dx * dx + dy * dy;
          if (d2 > 95 * 95) continue;
          n++; cx += o.x; cy += o.y; avx += o.vx; avy += o.vy;
          if (d2 < 24 * 24) {
            const d = Math.sqrt(d2) || 1, k = (24 - d) / 24;
            sx -= (dx / d) * k; sy -= (dy / d) * k;
          }
        }
        if (n) {
          ax += (cx / n - this.x) * 0.0007 + (avx / n - this.vx) * 0.035 + sx * 0.07;
          ay += (cy / n - this.y) * 0.0007 + (avy / n - this.vy) * 0.035 + sy * 0.07;
        }
        this.wander += rand(-0.25, 0.25);
        ax += Math.cos(this.wander) * 0.012;
        ay += Math.sin(this.wander) * 0.006;
      } else {
        // promenade vers des points au hasard, pauses de temps en temps
        this.timer -= dt;
        const dxT = (this.tx ?? this.x) - this.x, dyT = (this.ty ?? this.y) - this.y, dT = Math.hypot(dxT, dyT);
        if (this.timer <= 0 || dT < 12) {
          for (let k = 0; k < 10; k++) {
            this.tx = rand(60, T.w - 60);
            const [a, b] = sp.zone(T, { x: this.tx });
            this.ty = rand(a, Math.max(a + 1, b));
            if (!T.avoid.some((r) => this.tx > r.l && this.tx < r.r && this.ty > r.t && this.ty < r.b)) break;
          }
          this.timer = rand(240, 600);
          if (Math.random() < (sp.bottom ? 0.45 : 0.3)) this.rest = rand(60, 240);
        }
        if (this.rest > 0) {
          this.rest -= dt;
          this.vx *= 0.96; this.vy *= 0.96;
        } else {
          const want = sp.speed * (dT < 90 ? dT / 90 : 1) * 0.75;
          ax += ((dxT / (dT || 1)) * want - this.vx) * 0.02;
          ay += ((dyT / (dT || 1)) * want - this.vy) * 0.02;
        }
      }

      // contourner les blocs de texte du bandeau (lisibilité)
      for (const r of T.avoid) {
        if (this.x < r.l || this.x > r.r || this.y < r.t || this.y > r.b) continue;
        const dl = this.x - r.l, dr = r.r - this.x, du = this.y - r.t, dd = r.b - this.y;
        const m = Math.min(dl, dr, du, dd), k = sp.school ? 0.08 : 0.16;
        if (m === dl) ax -= k; else if (m === dr) ax += k; else if (m === du) ay -= k; else ay += k;
      }

      // nourriture
      const food = T.closestFood(this);
      if (food) {
        const [mx, my] = this.mouth();
        const dx = food.x - mx, dy = food.y - my, d = Math.hypot(dx, dy) || 1;
        ax += (dx / d) * 0.09;
        ay += (dy / d) * 0.09;
        this.rest = 0;
        this.boost = Math.max(this.boost, 0.6);
        if (d < 4 + this.size * 0.12 * this.z) T.eat(food, this);
      }

      // fuite devant la souris
      if (T.pointer.active) {
        const dx = this.x - T.pointer.x, dy = this.y - T.pointer.y, d = Math.hypot(dx, dy) || 1;
        const R = 130;
        if (d < R) {
          const k = (1 - d / R) ** 1.5;
          ax += (dx / d) * k * 0.5;
          ay += (dy / d) * k * 0.4;
          this.boost = Math.max(this.boost, k * 1.4);
          this.rest = 0;
        }
      }

      this.vx += ax * dt;
      this.vy += ay * dt;
      this.vy *= Math.pow(0.97, dt);
      const max = sp.speed * (1 + this.boost * 1.3);
      let s = Math.hypot(this.vx, this.vy);
      if (s > max) { this.vx *= max / s; this.vy *= max / s; s = max; }
      if (sp.minSpeed && s < sp.minSpeed) { const k = sp.minSpeed / (s || 1); this.vx *= k; this.vy *= k; s = sp.minSpeed; }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.boost = Math.max(0, this.boost - 0.012 * dt);

      // animation : battement de queue proportionnel à la vitesse, demi-tour en 3D, tangage
      this.swim = lerp(this.swim, clamp(s / sp.speed, 0.15, 1.8), 0.05);
      this.phase += (0.07 + this.swim * 0.16) * sp.freq * dt;
      if (Math.abs(this.vx) > 0.06) this.facing = lerp(this.facing, Math.sign(this.vx), 0.07 * dt);
      const targetPitch = clamp(Math.atan2(this.vy, Math.abs(this.vx) + 0.3), -0.55, 0.55);
      this.pitch = lerp(this.pitch, targetPitch, 0.08);
    }

    draw(ctx, t) {
      const T = this.tank;
      const px = (T.pointer.sx - 0.5) * (1 - this.z) * -30;
      const sx = Math.sign(this.facing) * Math.max(Math.abs(this.facing), 0.16);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.65 * this.z * this.z;
      ctx.translate(this.x + px, this.y);
      ctx.rotate(this.pitch * Math.sign(sx));
      ctx.scale(sx * this.z, this.z);
      this.sp.draw(ctx, this, t);
      ctx.restore();
    }
  }

  // ---------- Crevettes ----------
  const SHRIMP_COLORS = {
    cherry: { body: "#d11f2c", dark: "#8e0f1a", light: "rgba(255,170,170,.55)" },
    velvet: { body: "#2f63d8", dark: "#173a8c", light: "rgba(170,205,255,.55)" },
    amano: { body: "rgba(175,185,165,.8)", dark: "rgba(90,70,55,.85)", light: "rgba(240,245,235,.5)", dots: true },
  };

  class Shrimp {
    constructor(tank, kind) {
      this.tank = tank;
      this.c = SHRIMP_COLORS[kind];
      this.kind = kind;
      this.x = rand(tank.w * 0.4, tank.w - 30);
      this.depth = rand(4, 34);
      this.size = (kind === "amano" ? 1.7 : 1.4) * rand(0.85, 1.1);
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.state = "walk";
      this.timer = rand(60, 300);
      this.walk = rand(0, TAU);
      this.seed = rand(0, 100);
      this.air = 0; this.vy = 0; this.vx = 0;
      this.pick = 0;
    }

    get z() { return 0.75 + this.depth / 120; }

    update(dt, t) {
      const T = this.tank;
      this.timer -= dt;
      // nourriture tombée au sol
      const food = T.food.find((f) => f.settled && Math.abs(f.x - this.x) < 160 && !f.taken);
      if (this.air === 0 && food) {
        this.dir = Math.sign(food.x - this.x) || this.dir;
        this.state = Math.abs(food.x - this.x) < 7 ? "pick" : "walk";
        if (this.state === "pick" && Math.random() < 0.02 * dt) T.eat(food, this);
      } else if (this.timer <= 0 && this.air === 0) {
        const r = Math.random();
        if (r < 0.12) {
          // saut en arrière (coup de queue)
          this.air = 1; this.vy = -rand(1.6, 2.6); this.vx = -this.dir * rand(1.5, 2.5);
        } else {
          this.state = r < 0.55 ? "walk" : "pick";
          if (Math.random() < 0.4) this.dir *= -1;
        }
        this.timer = rand(80, 320);
      }
      if (this.air) {
        this.x += this.vx * dt;
        this.vy += 0.05 * dt;
        this.vx *= Math.pow(0.97, dt);
        this.air += this.vy * dt;
        if (this.air >= 0) { this.air = 0; this.vy = 0; }
      } else if (this.state === "walk") {
        this.x += this.dir * 0.22 * this.size * dt;
        this.walk += 0.25 * dt;
      }
      this.pick = lerp(this.pick, this.state === "pick" && !this.air ? 1 : 0, 0.08);
      if (this.x < 20) this.dir = 1;
      if (this.x > T.w - 20) this.dir = -1;
      this.x = clamp(this.x, 10, T.w - 10);
    }

    draw(ctx, t) {
      const T = this.tank, s = this.size * this.z, c = this.c;
      const y = T.floorAt(this.x) + this.depth + Math.min(0, this.air);
      ctx.save();
      ctx.translate(this.x, y);
      ctx.scale(this.dir * s, s);
      const bob = this.pick * (0.5 + 0.5 * Math.sin(t * 9 + this.seed)) * 1.2;
      ctx.rotate(this.pick * 0.12 + (this.air ? -0.25 : 0));
      ctx.lineCap = "round";

      // pattes
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 0.7;
      for (let k = 0; k < 5; k++) {
        const lx = 1 + k * 1.7, step = this.state === "walk" && !this.air ? Math.sin(this.walk + k * 1.4) * 1.4 : 0;
        ctx.beginPath(); ctx.moveTo(lx, -4.5); ctx.lineTo(lx + step - 0.6, this.air ? -2 : 0); ctx.stroke();
      }
      // pléopodes
      for (let k = 0; k < 4; k++) {
        const px = -2 - k * 3, a = Math.sin(t * 10 + k + this.seed) * 0.8;
        ctx.beginPath(); ctx.moveTo(px, -5.5 + k * 0.3); ctx.lineTo(px + a, -3 + k * 0.3); ctx.stroke();
      }
      // abdomen (segments)
      const segs = [];
      for (let k = 0; k < 6; k++) {
        segs.push([-1.2 - k * 3.1, -7.2 - 2.4 * Math.sin((k / 5) * Math.PI * 0.85) + k * k * 0.2, 3.7 - k * 0.36]);
      }
      const [tx, ty] = segs[5];
      // éventail de la queue
      ctx.fillStyle = c.body;
      for (const rot of [0.05, 0.45, 0.85]) {
        ctx.beginPath();
        ctx.ellipse(tx - Math.cos(rot) * 3, ty + Math.sin(rot) * 3, 3.3, 1.05, -rot, 0, TAU);
        ctx.fill();
      }
      for (let k = 5; k >= 0; k--) {
        const [x, yy, r] = segs[k];
        ctx.beginPath(); ctx.ellipse(x, yy, r * 0.95, r, 0, 0, TAU);
        ctx.fillStyle = c.body; ctx.fill();
      }
      // carapace
      ctx.beginPath(); ctx.ellipse(5.2, -7 - bob, 6.2, 3.8, -0.08, 0, TAU); ctx.fillStyle = c.body; ctx.fill();
      // rostre
      ctx.beginPath(); ctx.moveTo(10, -9 - bob); ctx.lineTo(14.5, -9.8 - bob); ctx.lineTo(10.5, -7.6 - bob); ctx.fill();
      // reflet
      ctx.strokeStyle = c.light; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(9, -10 - bob); ctx.quadraticCurveTo(0, -12.5, -10, -9.5); ctx.stroke();
      if (c.dots) {
        ctx.fillStyle = c.dark;
        for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(8 - k * 2.1, -6.4 + Math.sin(k) * 0.4 - (k > 3 ? k * 0.12 : 0), 0.45, 0, TAU); ctx.fill(); }
      } else {
        ctx.fillStyle = "rgba(255,255,255,.18)";
        ctx.beginPath(); ctx.ellipse(-3, -9.4, 4, 1, 0, 0, TAU); ctx.fill();
      }
      // oeil
      ctx.fillStyle = "#0b0b0b";
      ctx.beginPath(); ctx.arc(10.2, -8.6 - bob, 1.05, 0, TAU); ctx.fill();
      // antennes
      ctx.strokeStyle = c.dark; ctx.lineWidth = 0.45; ctx.globalAlpha *= 0.85;
      for (let k = 0; k < 2; k++) {
        const sw = Math.sin(t * 1.8 + this.seed + k * 1.3) * 3;
        ctx.beginPath(); ctx.moveTo(11, -9 - bob);
        ctx.quadraticCurveTo(17, -15 - k * 2, 28 + k * 4, -11 - k * 5 + sw);
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(11.5, -9.4 - bob);
        ctx.quadraticCurveTo(14, -12, 16 + k, -12.5 + sw * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---------- Escargot assassin (Clea helena) ----------
  class Snail {
    constructor(tank) {
      this.tank = tank;
      this.x = rand(tank.w * 0.45, tank.w * 0.8);
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.depth = rand(16, 30);
      this.t0 = rand(0, 100);
    }
    update(dt) {
      this.x += this.dir * 0.05 * dt;
      if (this.x < this.tank.w * 0.3 || this.x > this.tank.w - 30) this.dir *= -1;
    }
    draw(ctx, t) {
      const y = this.tank.floorAt(this.x) + this.depth;
      const crawl = Math.sin(t * 1.5 + this.t0);
      ctx.save();
      ctx.translate(this.x, y);
      ctx.scale(this.dir * 1.1, 1.1);
      // pied
      ctx.beginPath();
      ctx.ellipse(1 + crawl * 0.4, -2, 10 + crawl * 0.6, 2.4, 0, 0, TAU);
      ctx.fillStyle = "#8f8a80"; ctx.fill();
      // tentacules
      ctx.strokeStyle = "#8f8a80"; ctx.lineWidth = 0.9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(9, -3); ctx.quadraticCurveTo(13, -6, 15 + crawl, -8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, -3); ctx.quadraticCurveTo(10, -7, 11, -9 - crawl * 0.5); ctx.stroke();
      // coquille conique à bandes
      ctx.translate(-1, -4);
      ctx.rotate(-0.55);
      const whorls = [[0, 0, 6.5], [-6, -1, 5], [-10.5, -1.6, 3.7], [-14, -2, 2.6], [-16.4, -2.3, 1.6]];
      for (const [x, yy, r] of whorls) {
        ctx.beginPath(); ctx.ellipse(x, yy, r * 1.05, r, 0, 0, TAU);
        const g = ctx.createLinearGradient(x, yy - r, x, yy + r);
        g.addColorStop(0, "#f2cf5a"); g.addColorStop(1, "#b98a24");
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, yy, r * 1.05, r * 0.42, 0, 0, TAU);
        ctx.fillStyle = "#4a2d14"; ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------- L'aquarium ----------
  const MODES = {
    hero: { neon: [10, 24], ramirezi: 2, cory: 3, shrimp: true, snail: true, floor: true, plants: true, rays: 7, plankton: 80, alpha: 1 },
    head: { neon: [7, 14], ramirezi: 1, cory: 0, shrimp: false, snail: false, floor: false, plants: false, rays: 5, plankton: 45, alpha: 1 },
    footer: { neon: [6, 11], ramirezi: 0, cory: 0, shrimp: false, snail: false, floor: false, plants: false, rays: 0, plankton: 30, alpha: 0.55 },
  };

  class Tank {
    constructor(host, mode) {
      this.host = host;
      this.mode = mode;
      this.cfg = MODES[mode];
      this.canvas = document.createElement("canvas");
      this.canvas.className = "tank tank-" + mode;
      this.canvas.setAttribute("aria-hidden", "true");
      host.prepend(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.pointer = { x: -999, y: -999, sx: 0.5, active: false };
      this.food = [];
      this.fx = [];
      this.bubbles = [];
      this.t = 0;
      this.visible = true;
      this.resize();
      this.populate();
      this.bind();
      setTimeout(() => this.measureText(), 1300);
      document.fonts?.ready.then(() => this.measureText());
      if (REDUCED) {
        for (let i = 0; i < 60; i++) this.update(1);
        this.draw();
      } else {
        this.last = performance.now();
        requestAnimationFrame((n) => this.frame(n));
      }
    }

    get top() { return 14; }
    get bottom() { return this.cfg.floor ? this.floorTop : this.h - 16; }

    floorAt(x) {
      return this.floorTop + Math.sin(x * 0.0042 + 1) * 12 + Math.sin(x * 0.013) * 4;
    }

    resize() {
      const r = this.host.getBoundingClientRect();
      this.w = Math.max(320, r.width);
      this.h = Math.max(160, r.height);
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.floorTop = this.h - (this.w < 700 ? 150 : 185);
      this.measureText();
      this.buildScenery();
      for (const f of this.fish || []) { f.x = clamp(f.x, 20, this.w - 20); f.y = clamp(f.y, 20, this.h - 20); }
    }

    // Zones de texte que les poissons évitent (grand écran seulement)
    measureText() {
      this.avoid = [];
      if (this.mode !== "hero" || this.w < 900) return;
      const c = this.host.getBoundingClientRect();
      this.host.querySelectorAll(".hero-inner h1, .hero-inner .lead, .hero-cta, .stats").forEach((el) => {
        const r = el.getBoundingClientRect(), pad = 26;
        this.avoid.push({ l: r.left - c.left - pad, r: r.right - c.left + pad, t: r.top - c.top - pad, b: r.bottom - c.top + pad });
      });
    }

    populate() {
      const c = this.cfg;
      const neons = Math.round(clamp(this.w / 62, c.neon[0], c.neon[1]));
      this.fish = [];
      for (let i = 0; i < neons; i++) this.fish.push(new Fish(this, "neon"));
      for (let i = 0; i < (this.w < 700 ? 0 : c.ramirezi); i++) this.fish.push(new Fish(this, "ramirezi"));
      for (let i = 0; i < c.cory; i++) this.fish.push(new Fish(this, "cory"));
      this.shrimps = [];
      if (c.shrimp) {
        const kinds = ["cherry", "cherry", "cherry", "velvet", "amano", "cherry", "amano", "velvet"];
        const n = this.w < 700 ? 4 : 8;
        for (let i = 0; i < n; i++) this.shrimps.push(new Shrimp(this, kinds[i]));
      }
      this.snails = c.snail ? [new Snail(this)] : [];
      this.plankton = Array.from({ length: c.plankton }, () => ({
        x: rand(0, this.w), y: rand(0, this.h), z: rand(0.2, 1), s: rand(0, TAU),
      }));
    }

    // Décor : plantes générées, sol pré-rendu dans un canvas hors écran
    buildScenery() {
      const W = this.w, H = this.h;
      this.rays = Array.from({ length: this.cfg.rays }, (_, i) => ({
        x: (i + rand(0.1, 0.9)) * (W / Math.max(1, this.cfg.rays)), w: rand(30, 110), a: rand(0.04, 0.09), s: rand(0, TAU), sp: rand(0.15, 0.35),
      }));
      this.blades = [];
      this.stems = [];
      this.floorLayer = null;
      if (!this.cfg.plants) return;

      const small = W < 700;
      const blade = (x, layer, hMin, hMax) => this.blades.push({
        x, layer, h: rand(hMin, hMax), w: rand(3, 6.5), s: rand(0, TAU), push: 0,
        col: layer === 2 ? `hsl(${rand(105, 125)} ${rand(40, 55)}% ${rand(14, 22)}%)` : `hsl(${rand(95, 130)} ${rand(40, 60)}% ${rand(layer ? 28 : 20, layer ? 40 : 30)}%)`,
      });
      // hauteurs plafonnées : sur mobile le bandeau est très haut et le texte occupe toute la largeur
      const PH = Math.min(H, small ? 420 : 820);
      for (let i = 0; i < (small ? 14 : 30); i++) blade(rand(W * 0.6, W), 0, PH * 0.25, PH * 0.62);
      for (let i = 0; i < 8; i++) blade(rand(0, W * 0.07), 0, PH * 0.15, PH * 0.4);
      for (let i = 0; i < (small ? 3 : 6); i++) blade(rand(W * 0.95, W + 10), 2, PH * 0.35, PH * 0.7);
      for (let i = 0; i < 4; i++) blade(rand(-10, W * 0.025), 2, PH * 0.2, PH * 0.45);

      const stem = (x, hMax, hue) => this.stems.push({ x, h: rand(hMax * 0.6, hMax), s: rand(0, TAU), hue, push: 0 });
      const bunch = (x, n, hMax, hue) => { for (let i = 0; i < n; i++) stem(x + rand(-14, 14), hMax, hue); };
      bunch(W * 0.69, small ? 3 : 5, PH * 0.42, 1);
      if (!small) bunch(W * 0.8, 4, PH * 0.36, 0);
      bunch(W * 0.9, small ? 2 : 4, PH * 0.3, 1);
      bunch(W * 0.05, 3, 120, 1);

      // ----- sol -----
      const off = document.createElement("canvas");
      off.width = Math.round(W * this.dpr);
      off.height = Math.round(H * this.dpr);
      const c = off.getContext("2d");
      c.scale(this.dpr, this.dpr);
      const floorPath = new Path2D();
      floorPath.moveTo(0, H);
      for (let x = 0; x <= W + 10; x += 10) floorPath.lineTo(x, this.floorAt(x));
      floorPath.lineTo(W, H);
      floorPath.closePath();
      this.floorPath = floorPath;

      // rochers (seiryu) derrière le sable
      const rock = (cx, rw, rh) => {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const a = Math.PI + (i / 12) * Math.PI;
          const k = rand(0.75, 1.1) * (i === 5 || i === 6 ? 1.15 : 1);
          pts.push([cx + Math.cos(a) * rw * k, this.floorAt(cx) + 14 + Math.sin(a) * rh * k]);
        }
        c.beginPath();
        c.moveTo(pts[0][0], pts[0][1]);
        pts.forEach((p) => c.lineTo(p[0], p[1]));
        c.closePath();
        const g = c.createLinearGradient(cx - rw, this.floorAt(cx) - rh, cx + rw * 0.6, this.floorAt(cx));
        g.addColorStop(0, "#9aa5a8"); g.addColorStop(0.5, "#5f6a6e"); g.addColorStop(1, "#2c3336");
        c.fillStyle = g;
        c.fill();
        c.save();
        c.clip();
        c.strokeStyle = "rgba(220,230,232,.22)";
        c.lineWidth = 1.2;
        for (let k = 0; k < 6; k++) {
          const yy = this.floorAt(cx) - rh * rand(0.1, 0.9);
          c.beginPath(); c.moveTo(cx - rw, yy); c.quadraticCurveTo(cx, yy - rand(-8, 8), cx + rw, yy + rand(-6, 6)); c.stroke();
        }
        c.restore();
      };
      rock(W * 0.74, small ? 40 : 70, small ? 55 : 95);
      rock(W * 0.86, small ? 25 : 45, small ? 35 : 60);
      if (!small) rock(W * 0.56, 38, 42);

      // bois flotté
      const branch = (x, y, ang, len, wdt, depth) => {
        if (depth > 3 || len < 12) return;
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        c.strokeStyle = "#3b2a1d";
        c.lineCap = "round";
        c.lineWidth = wdt;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + Math.cos(ang + 0.4) * len * 0.5, y + Math.sin(ang + 0.4) * len * 0.5, x2, y2);
        c.stroke();
        c.strokeStyle = "rgba(160,120,85,.35)";
        c.lineWidth = wdt * 0.25;
        c.stroke();
        branch(x2, y2, ang - rand(0.3, 0.7), len * rand(0.55, 0.75), wdt * 0.65, depth + 1);
        if (Math.random() < 0.8) branch(x2, y2, ang + rand(0.2, 0.6), len * rand(0.45, 0.65), wdt * 0.6, depth + 1);
      };
      if (!small) branch(W * 0.93, this.floorAt(W * 0.93) + 8, -2.3, 120, 11, 0);

      // sable
      const sg = c.createLinearGradient(0, this.floorTop - 15, 0, H);
      sg.addColorStop(0, "#c2a77c"); sg.addColorStop(0.35, "#d9c39c"); sg.addColorStop(1, "#f3ead8");
      c.fillStyle = sg;
      c.fill(floorPath);
      c.save();
      c.clip(floorPath);
      for (let i = 0; i < W * 1.6; i++) {
        const x = rand(0, W), y = rand(this.floorTop - 15, H);
        c.fillStyle = Math.random() < 0.5 ? "rgba(120,90,50,.22)" : "rgba(255,250,235,.4)";
        c.fillRect(x, y, rand(0.8, 2), rand(0.8, 1.6));
      }
      const shade = c.createLinearGradient(0, this.floorTop - 15, 0, this.floorTop + 25);
      shade.addColorStop(0, "rgba(10,40,50,.35)"); shade.addColorStop(1, "rgba(10,40,50,0)");
      c.fillStyle = shade;
      c.fillRect(0, this.floorTop - 20, W, 50);
      c.restore();

      // tapis de Monte Carlo
      const carpet = (x0, x1) => {
        for (let x = x0; x < x1; x += 2.4) {
          const n = 2 + Math.floor(Math.random() * 3);
          for (let k = 0; k < n; k++) {
            const y = this.floorAt(x) + rand(-7, 6);
            const r = rand(1.8, 3.3);
            c.beginPath();
            c.ellipse(x + rand(-2, 2), y, r * 1.15, r, rand(0, 3), 0, TAU);
            c.fillStyle = `hsl(${rand(92, 112)} ${rand(55, 72)}% ${rand(26, 46)}%)`;
            c.fill();
          }
        }
      };
      carpet(W * (small ? 0.35 : 0.45), W);
      carpet(0, W * 0.22);
      this.floorLayer = off;
    }

    bind() {
      const host = this.host;
      const toLocal = (e) => {
        const r = this.canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
      };
      host.addEventListener("pointermove", (e) => {
        const [x, y] = toLocal(e);
        Object.assign(this.pointer, { x, y, sx: x / this.w, active: true });
      });
      host.addEventListener("pointerleave", () => { this.pointer.active = false; });
      host.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button, input, textarea, select, label")) return;
        const [x, y] = toLocal(e);
        this.feed(x, y);
        if (e.pointerType !== "mouse") setTimeout(() => (this.pointer.active = false), 300);
      });
      new ResizeObserver(() => {
        const r = this.host.getBoundingClientRect();
        if (Math.abs(r.width - this.w) > 2 || Math.abs(r.height - this.h) > 2) {
          this.resize();
          if (REDUCED) this.draw();
        }
      }).observe(host);
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; }).observe(host);
    }

    // ---------- Nourriture ----------
    feed(x, y) {
      this.fx.push({ type: "ring", x, y, r: 2, a: 0.6 });
      const n = 7;
      for (let i = 0; i < n; i++) {
        this.food.push({
          x: x + rand(-22, 22), y: y + rand(-8, 8), vy: rand(0.25, 0.5), s: rand(0, TAU), rot: rand(0, TAU),
          size: rand(2.2, 3.6), col: ["#e86a2a", "#d8452f", "#f0a43a", "#7fa63a"][i % 4], settled: false, life: 900, taken: false,
        });
      }
      if (this.food.length > 80) this.food.splice(0, this.food.length - 80);
      this.host.dispatchEvent(new CustomEvent("aquarium:feed", { bubbles: true }));
    }

    closestFood(f) {
      let best = null, bd = 260 * 260;
      const [mx, my] = f.mouth();
      for (const p of this.food) {
        if (p.taken || (p.settled && !f.sp.bottom)) continue;
        const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }

    eat(p, who) {
      p.taken = true;
      for (let i = 0; i < 5; i++) {
        this.fx.push({ type: "crumb", x: p.x, y: p.y, vx: rand(-0.6, 0.6), vy: rand(-0.6, 0.3), a: 1, col: p.col });
      }
    }

    // ---------- Boucle ----------
    frame(now) {
      const dt = Math.min(3, (now - this.last) / 16.67);
      this.last = now;
      if (this.visible) {
        this.update(dt);
        this.draw();
      }
      requestAnimationFrame((n) => this.frame(n));
    }

    update(dt) {
      this.t += dt / 60;
      const t = this.t;
      for (const f of this.fish) f.update(dt, t);
      for (const s of this.shrimps) s.update(dt, t);
      for (const s of this.snails) s.update(dt, t);

      // nourriture qui coule en virevoltant
      for (const p of this.food) {
        if (!p.settled) {
          p.s += 0.05 * dt;
          p.x += Math.sin(p.s) * 0.25 * dt;
          p.y += p.vy * dt;
          p.rot += 0.03 * dt;
          const floor = this.cfg.floor ? this.floorAt(p.x) + 6 : this.h + 20;
          if (p.y >= floor) { p.y = floor; p.settled = true; }
        } else {
          p.life -= dt;
        }
      }
      this.food = this.food.filter((p) => !p.taken && p.life > 0);

      // bulles : diffuseur + perles d'oxygène des plantes
      if (Math.random() < (Math.sin(this.t * 0.8) > 0.3 ? 0.3 : 0.1) * dt) {
        const bx = this.cfg.floor ? this.w * 0.95 : this.w * 0.9;
        const by = this.cfg.floor ? this.floorAt(bx) : this.h;
        this.bubbles.push({ x: bx + rand(-4, 4), y: by, r: rand(1.2, 4), s: rand(0, TAU), vy: 0 });
      }
      if (this.stems.length && Math.random() < 0.03 * dt) {
        const st = this.stems[Math.floor(Math.random() * this.stems.length)];
        this.bubbles.push({ x: st.x + rand(-6, 6), y: this.floorAt(st.x) - st.h * rand(0.6, 1), r: rand(0.8, 1.6), s: rand(0, TAU), vy: 0 });
      }
      for (const b of this.bubbles) {
        b.vy = Math.min(b.vy + 0.02 * dt, 0.5 + b.r * 0.28);
        b.y -= b.vy * dt;
        b.s += 0.12 * dt;
        b.x += Math.sin(b.s) * 0.35 * dt * (b.r / 3);
        if (b.y < this.top - 6) {
          b.dead = true;
          this.fx.push({ type: "ring", x: b.x, y: this.top - 4, r: b.r, a: 0.35 });
        }
      }
      this.bubbles = this.bubbles.filter((b) => !b.dead);

      for (const p of this.plankton) {
        p.s += 0.01 * dt;
        p.x += (Math.sin(p.s) * 0.12 + 0.04) * p.z * dt;
        p.y += Math.cos(p.s * 0.7) * 0.08 * dt;
        if (p.x > this.w + 5) p.x = -5;
        if (p.y < 0) p.y = this.h; else if (p.y > this.h) p.y = 0;
      }

      for (const e of this.fx) {
        if (e.type === "ring") { e.r += 0.6 * dt; e.a -= 0.012 * dt; }
        else { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 0.01 * dt; e.a -= 0.03 * dt; }
      }
      this.fx = this.fx.filter((e) => e.a > 0);

      // les plantes s'écartent sous la souris
      const P = this.pointer;
      for (const b of [...this.blades, ...this.stems]) {
        const tipY = this.floorAt(b.x) - b.h * 0.7;
        let target = 0;
        if (P.active) {
          const dx = b.x - P.x, dy = tipY - P.y, d = Math.hypot(dx, dy);
          if (d < 150) target = Math.sign(dx || 1) * (1 - d / 150) * 40;
        }
        b.push = lerp(b.push, target, 0.04 * dt);
      }
    }

    draw() {
      const ctx = this.ctx, W = this.w, H = this.h, t = this.t;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = this.cfg.alpha;

      // rayons de lumière
      if (this.rays.length) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const r of this.rays) {
          const sway = Math.sin(t * r.sp + r.s) * 40;
          const a = r.a * (0.6 + 0.4 * Math.sin(t * r.sp * 2.3 + r.s));
          const g = ctx.createLinearGradient(0, 0, 0, H * 0.95);
          g.addColorStop(0, `rgba(170,240,255,${a})`);
          g.addColorStop(1, "rgba(170,240,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(r.x - r.w / 2, 0);
          ctx.lineTo(r.x + r.w / 2, 0);
          ctx.lineTo(r.x + r.w * 1.1 + H * 0.35 + sway, H);
          ctx.lineTo(r.x - r.w * 0.6 + H * 0.35 + sway, H);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      this.drawPlankton(ctx, 0, 0.6);
      this.drawBlades(ctx, 0);

      const far = this.fish.filter((f) => f.z < 0.72).sort((a, b) => a.z - b.z);
      const near = this.fish.filter((f) => f.z >= 0.72).sort((a, b) => a.z - b.z);
      for (const f of far) f.draw(ctx, t);

      if (this.floorLayer) {
        ctx.drawImage(this.floorLayer, 0, 0, W, H);
        this.drawCaustics(ctx);
      }
      for (const p of this.food) if (p.settled) this.drawFood(ctx, p, Math.min(1, p.life / 120));
      for (const s of this.snails) s.draw(ctx, t);
      for (const s of this.shrimps.slice().sort((a, b) => a.depth - b.depth)) s.draw(ctx, t);
      this.drawStems(ctx);
      for (const f of near) f.draw(ctx, t);
      for (const p of this.food) if (!p.settled) this.drawFood(ctx, p, 1);
      this.drawBubbles(ctx);
      this.drawFx(ctx);
      this.drawPlankton(ctx, 0.6, 1);
      this.drawBlades(ctx, 2);

      // surface de l'eau
      const sg = ctx.createLinearGradient(0, 0, 0, 34);
      sg.addColorStop(0, "rgba(190,245,255,.22)");
      sg.addColorStop(1, "rgba(190,245,255,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, 34);
      ctx.strokeStyle = "rgba(210,250,255,.28)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const y = 6 + Math.sin(x * 0.02 + t * 1.6) * 2 + Math.sin(x * 0.045 - t * 2.2) * 1.2;
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();

      // lueur autour du curseur
      if (this.pointer.active) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(this.pointer.x, this.pointer.y, 0, this.pointer.x, this.pointer.y, 170);
        g.addColorStop(0, "rgba(120,230,255,.09)");
        g.addColorStop(1, "rgba(120,230,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(this.pointer.x - 170, this.pointer.y - 170, 340, 340);
        ctx.restore();
      }
    }

    drawPlankton(ctx, z0, z1) {
      ctx.fillStyle = "rgba(210,240,250,1)";
      for (const p of this.plankton) {
        if (p.z < z0 || p.z >= z1) continue;
        ctx.globalAlpha = this.cfg.alpha * (0.12 + p.z * 0.35) * (0.6 + 0.4 * Math.sin(p.s * 3));
        const px = p.x - (this.pointer.sx - 0.5) * p.z * 20;
        const s = 0.6 + p.z * 1.4;
        ctx.fillRect(px, p.y, s, s);
      }
      ctx.globalAlpha = this.cfg.alpha;
    }

    // Vallisneria : rubans souples qui ondulent
    drawBlades(ctx, layer) {
      const t = this.t;
      for (const b of this.blades) {
        if (b.layer !== layer) continue;
        const by = this.floorAt(b.x) + (layer === 2 ? 30 : 8);
        const sway = Math.sin(t * 0.7 + b.s) * b.h * 0.09 + Math.sin(t * 1.7 + b.s * 2) * b.h * 0.025 + b.push;
        const cx = b.x + sway * 0.25, cy = by - b.h * 0.55;
        const tx = b.x + sway, ty = by - b.h;
        const left = [], right = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const x = (1 - u) ** 2 * b.x + 2 * (1 - u) * u * cx + u * u * tx;
          const y = (1 - u) ** 2 * by + 2 * (1 - u) * u * cy + u * u * ty;
          const dx = 2 * (1 - u) * (cx - b.x) + 2 * u * (tx - cx);
          const dy = 2 * (1 - u) * (cy - by) + 2 * u * (ty - cy);
          const n = Math.hypot(dx, dy) || 1;
          const w = b.w * (u < 0.92 ? 1 - u * 0.35 : (1 - u) * 8) * (layer === 2 ? 1.6 : 1);
          left.push([x - (dy / n) * w / 2, y + (dx / n) * w / 2]);
          right.push([x + (dy / n) * w / 2, y - (dx / n) * w / 2]);
        }
        ctx.beginPath();
        ctx.moveTo(left[0][0], left[0][1]);
        left.forEach((p) => ctx.lineTo(p[0], p[1]));
        right.reverse().forEach((p) => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fillStyle = b.col;
        ctx.fill();
        if (layer !== 2) {
          ctx.strokeStyle = "rgba(200,255,190,.12)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(b.x, by);
          ctx.quadraticCurveTo(cx, cy, tx, ty);
          ctx.stroke();
        }
      }
    }

    // Plantes à tiges (Rotala rouge, Ludwigia verte) : paires de feuilles opposées
    // qui pointent vers le haut, alternées de face / de profil pour donner du volume
    drawStems(ctx) {
      const t = this.t;
      for (const st of this.stems) {
        const by = this.floorAt(st.x) + 4;
        const sway = Math.sin(t * 0.6 + st.s) * st.h * 0.06 + st.push * 0.7;
        const cx = st.x + sway * 0.3, cy = by - st.h * 0.5, tx = st.x + sway, ty = by - st.h;
        ctx.strokeStyle = st.hue ? "#6b5a2a" : "#4f6b2c";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(st.x, by); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
        const step = st.hue ? 7 : 9;
        const nodes = Math.floor(st.h / step);
        for (let i = 2; i <= nodes; i++) {
          const u = i / nodes;
          const x = (1 - u) ** 2 * st.x + 2 * (1 - u) * u * cx + u * u * tx;
          const y = (1 - u) ** 2 * by + 2 * (1 - u) * u * cy + u * u * ty;
          const profile = i % 2 ? 1 : 0.45; // une paire sur deux vue de face
          const len = (st.hue ? 13 : 15) * (1 - u * 0.45) * profile;
          const wid = (st.hue ? 2.4 : 4.2) * (1 - u * 0.3);
          const hue = st.hue ? lerp(95, 6, u ** 1.2) : lerp(105, 82, u);
          const light = st.hue ? lerp(28, 50, u) : lerp(24, 46, u);
          ctx.fillStyle = `hsl(${hue} ${st.hue ? 72 : 58}% ${light}%)`;
          const lift = 0.5 + u * 0.22 + Math.sin(t * 1.8 + i * 0.7 + st.s) * 0.08;
          for (const side of [-1, 1]) {
            const ang = side > 0 ? -lift : Math.PI + lift;
            ctx.beginPath();
            ctx.ellipse(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5, len * 0.55, wid, ang, 0, TAU);
            ctx.fill();
          }
        }
        // bourgeon terminal
        ctx.fillStyle = st.hue ? "hsl(8 80% 55%)" : "hsl(85 60% 48%)";
        ctx.beginPath(); ctx.ellipse(tx, ty - 2, 2.2, 4, 0, 0, TAU); ctx.fill();
      }
    }

    drawCaustics(ctx) {
      const t = this.t;
      ctx.save();
      ctx.clip(this.floorPath);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 26; i++) {
        const x = ((i * 97.3) % this.w) + Math.sin(t * 0.5 + i * 1.7) * 30;
        const y = this.floorTop + 8 + ((i * 37) % 60) + Math.cos(t * 0.6 + i) * 5;
        const r = 26 + Math.sin(t * 0.9 + i * 2.3) * 10;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,220,.16)");
        g.addColorStop(1, "rgba(255,255,220,0)");
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.32);
        ctx.translate(-x, -y);
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
        ctx.restore();
      }
      ctx.restore();
    }

    drawFood(ctx, p, alpha) {
      ctx.save();
      ctx.globalAlpha = this.cfg.alpha * alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      ctx.restore();
    }

    drawBubbles(ctx) {
      for (const b of this.bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.fillStyle = "rgba(220,250,255,.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(225,250,255,.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, TAU);
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.fill();
      }
    }

    drawFx(ctx) {
      for (const e of this.fx) {
        ctx.globalAlpha = this.cfg.alpha * Math.max(0, e.a);
        if (e.type === "ring") {
          ctx.strokeStyle = "rgba(220,250,255,1)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(e.x, e.y, e.r, e.r * 0.4, 0, 0, TAU);
          ctx.stroke();
        } else {
          ctx.fillStyle = e.col;
          ctx.fillRect(e.x, e.y, 1.4, 1.4);
        }
      }
      ctx.globalAlpha = this.cfg.alpha;
    }
  }

  // ---------- Montage ----------
  const tanks = (window.__aquariums = []);
  const mount = (sel, mode) => document.querySelectorAll(sel).forEach((el) => tanks.push(new Tank(el, mode)));
  mount(".hero", "hero");
  mount(".page-head, .article-hero", "head");
  mount("footer", "footer");

  // indice "cliquez pour nourrir" qui disparaît au premier repas
  document.addEventListener("aquarium:feed", () => {
    document.querySelectorAll(".tank-hint").forEach((h) => h.classList.add("done"));
  });
})();
