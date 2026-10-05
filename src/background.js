// Adapted from the Orbs site's HeroFacetField: the same grid, gradient,
// influence radius, rotation, and spring response, without a React runtime.
const field = document.querySelector('.background-field');
const canvas = field.querySelector('canvas');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const radius = 162;
const spacing = 20.25;
const step = 1 / 120;
const gradientStops = [[0, '#CB7CDA'], [0.46, '#7764E8'], [1, '#6EAEE9']];
const spring = (frequency, damping) => ({
  stiffness: (2 * Math.PI * frequency) ** 2,
  damping: 2 * damping * 2 * Math.PI * frequency,
});
const presenceSpring = spring(2.4, 0.4);
const positionSpring = spring(1.1, 0.3);
const spinSpring = spring(0.8, 0.35);
const influence = (distance) => distance >= radius ? 0 : 1 - (distance / radius) ** 2;
let cleanup = () => {};

function start() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const particles = new Map();
  let pointer = null;
  let anchor = null;
  let previousPointer = null;
  let velocityX = 0;
  let velocityY = 0;
  let front = 0;
  let elapsed = 0;
  let remainder = 0;
  let width = 0;
  let height = 0;
  let frame = 0;
  let lastTime = 0;
  let mouseX = -1;
  let mouseY = -1;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (anchor && particles.size) {
      const gradient = ctx.createLinearGradient(0, anchor.y - radius, 0, anchor.y + radius);
      gradientStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
      ctx.fillStyle = gradient;
      for (const particle of particles.values()) {
        const presence = Math.max(particle.presence, 0);
        if (presence < 0.001) continue;
        const size = particle.size * presence;
        const circumradius = Math.max(size / Math.sqrt(3), 0.1);
        const corner = Math.min(size * 0.11, circumradius * 0.5);
        const points = [0, 1, 2].map((index) => {
          const angle = particle.angle + particle.spin + index * Math.PI * 2 / 3;
          return {
            x: particle.x + particle.offsetX + circumradius * Math.cos(angle),
            y: particle.y + particle.offsetY + circumradius * Math.sin(angle),
          };
        });
        ctx.globalAlpha = particle.opacity * Math.min(presence, 1);
        ctx.beginPath();
        ctx.moveTo((points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2);
        for (const [from, to] of [[1, 2], [2, 0], [0, 1]]) {
          ctx.arcTo(points[from].x, points[from].y, points[to].x, points[to].y, corner);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (anchor) {
      field.style.setProperty('--facet-x', `${anchor.x}px`);
      field.style.setProperty('--facet-y', `${anchor.y}px`);
    }
    field.style.setProperty('--facet-hole', `${front}px`);
  }

  function resize() {
    const bounds = field.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function seed() {
    const center = pointer ?? anchor;
    if (!center) return;
    if (pointer) particles.forEach((particle) => { particle.live = false; });
    const rotation = (elapsed % 2.6) / 2.6 * (2 * Math.PI / 3);
    for (let row = Math.ceil((center.y - radius) / spacing); row <= Math.floor((center.y + radius) / spacing); row++) {
      for (let col = Math.ceil((center.x - radius) / spacing); col <= Math.floor((center.x + radius) / spacing); col++) {
        const x = col * spacing;
        const y = row * spacing;
        const distance = Math.hypot(x - center.x, y - center.y);
        const weight = influence(distance);
        if (weight <= 0) continue;
        const key = `${col},${row}`;
        const rest = { x, y, size: 3.7 + 10.3 * weight, opacity: 0.17 + 0.72 * weight, angle: -Math.PI / 2 + rotation - distance * Math.PI / 180 };
        const existing = particles.get(key);
        if (existing) Object.assign(existing, rest, pointer ? { live: true } : {});
        else if (pointer) particles.set(key, { ...rest, live: true, presence: 0, presenceVelocity: 0, offsetX: 0, offsetY: 0, velocityX: 0, velocityY: 0, spin: 0, spinVelocity: 0 });
      }
    }
  }

  function update() {
    front = pointer ? Math.min(radius, front + 650 * step) : Math.max(0, front - 900 * step);
    const center = pointer ?? anchor;
    const speed = Math.hypot(velocityX, velocityY);
    for (const particle of particles.values()) {
      const dx = center ? particle.x - center.x : 0;
      const dy = center ? particle.y - center.y : 0;
      const distance = Math.hypot(dx, dy);
      const target = particle.live && distance < front ? 1 : 0;
      particle.presenceVelocity += (presenceSpring.stiffness * (target - particle.presence) - presenceSpring.damping * particle.presenceVelocity) * step;
      particle.presence += particle.presenceVelocity * step;
      const weight = pointer && speed > 0 ? influence(distance) : 0;
      const nx = distance > 0 ? dx / distance : 0;
      const ny = distance > 0 ? dy / distance : 0;
      particle.velocityX += (weight * (0.6 * velocityX + 0.5 * speed * nx) - positionSpring.stiffness * particle.offsetX - positionSpring.damping * particle.velocityX) * step;
      particle.velocityY += (weight * (0.6 * velocityY + 0.5 * speed * ny) - positionSpring.stiffness * particle.offsetY - positionSpring.damping * particle.velocityY) * step;
      particle.offsetX += particle.velocityX * step;
      particle.offsetY += particle.velocityY * step;
      const offset = Math.hypot(particle.offsetX, particle.offsetY);
      if (offset > 28) {
        for (const key of ['offsetX', 'offsetY', 'velocityX', 'velocityY']) particle[key] *= 28 / offset;
      }
      particle.spinVelocity += (0.04 * weight * (nx * velocityY - ny * velocityX) - spinSpring.stiffness * particle.spin - spinSpring.damping * particle.spinVelocity) * step;
      particle.spin += particle.spinVelocity * step;
    }
  }

  function tick(time) {
    const delta = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    if (pointer) anchor = { ...pointer };
    elapsed += delta;
    if (pointer && previousPointer && delta > 0) {
      let vx = (pointer.x - previousPointer.x) / delta;
      let vy = (pointer.y - previousPointer.y) / delta;
      const speed = Math.hypot(vx, vy);
      if (speed > 4000) { vx *= 4000 / speed; vy *= 4000 / speed; }
      const blend = 1 - Math.exp(-delta / 0.05);
      velocityX += (vx - velocityX) * blend;
      velocityY += (vy - velocityY) * blend;
    } else if (!pointer) { velocityX = 0; velocityY = 0; }
    previousPointer = pointer ? { ...pointer } : null;
    seed();
    remainder += delta;
    while (remainder >= step - 1e-9) { update(); remainder -= step; }
    for (const [key, particle] of particles) {
      if ((!particle.live || front === 0) && Math.abs(particle.presence) < 0.001 && Math.abs(particle.presenceVelocity) < 0.01) particles.delete(key);
    }
    draw();
    if (!pointer && front === 0 && particles.size === 0) { frame = 0; lastTime = 0; }
    else frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!frame && !document.hidden) { lastTime = 0; frame = requestAnimationFrame(tick); }
  }

  function locatePointer() {
    if (mouseX < 0) return;
    const bounds = field.getBoundingClientRect();
    pointer = mouseX >= bounds.left && mouseX <= bounds.right && mouseY >= bounds.top && mouseY <= bounds.bottom
      ? { x: mouseX - bounds.left, y: mouseY - bounds.top } : null;
    if (pointer || front || particles.size) wake();
  }

  function move(event) {
    if (event.pointerType !== 'mouse') return;
    mouseX = event.clientX;
    mouseY = event.clientY;
    locatePointer();
  }

  function leave() {
    pointer = null;
    previousPointer = null;
    velocityX = velocityY = 0;
    mouseX = mouseY = -1;
    if (front || particles.size) wake();
  }

  function visibility() {
    if (!document.hidden) return;
    cancelAnimationFrame(frame);
    frame = 0;
    leave();
    front = 0;
    particles.clear();
    draw();
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(field);
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('scroll', locatePointer, { passive: true, capture: true });
  window.addEventListener('blur', leave);
  document.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', visibility);

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener('pointermove', move);
    window.removeEventListener('scroll', locatePointer, { capture: true });
    window.removeEventListener('blur', leave);
    document.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', visibility);
    ctx.clearRect(0, 0, width, height);
    for (const key of ['--facet-x', '--facet-y', '--facet-hole']) field.style.removeProperty(key);
  };
}

function configure() {
  cleanup();
  cleanup = finePointer.matches && !reducedMotion.matches ? start() : () => {};
}

finePointer.addEventListener('change', configure);
reducedMotion.addEventListener('change', configure);
configure();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup();
    finePointer.removeEventListener('change', configure);
    reducedMotion.removeEventListener('change', configure);
  });
}
