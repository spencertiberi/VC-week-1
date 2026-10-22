// A short confetti burst across the screen, like the one admissions portals play when
// an acceptance opens. Purely decorative: hidden from screen readers, ignores clicks,
// and skipped entirely when the reader prefers reduced motion.

const DURATION_MS = 2800;
const FADE_MS = 700;
const PIECES = 170;

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function confetti(colors) {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  // Pieces start just above the top edge, spread across the full width, and get a small
  // upward kick so the burst "pops" before it falls.
  const pieces = Array.from({ length: PIECES }, () => ({
    x: Math.random() * width,
    y: -20 - Math.random() * height * 0.3,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 4,
    size: 6 + Math.random() * 6,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.3,
    wobble: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    round: Math.random() < 0.25,
  }));

  const start = performance.now();
  let last = start;
  function frame(now) {
    const elapsed = now - start;
    const step = Math.min(2, (now - last) / 16.7);
    last = now;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / FADE_MS));
    for (const p of pieces) {
      p.vy += 0.07 * step;
      p.vx *= 0.99;
      p.wobble += 0.1 * step;
      p.x += (p.vx + Math.sin(p.wobble) * 0.8) * step;
      p.y += p.vy * step;
      p.rotation += p.spin * step;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Scaling by the wobble makes the strips look like they flip as they fall.
        ctx.scale(1, Math.cos(p.wobble));
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    if (elapsed < DURATION_MS) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
