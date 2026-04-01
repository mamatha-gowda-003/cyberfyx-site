export function initHeroGrid() {
  const canvas = document.getElementById('hero-grid-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes: any[] = [];
  const nodeCount = 18;
  let width = 0;
  let height = 0;
  let animationId = 0;
  let sweepOffset = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(320, Math.floor(rect.width));
    height = Math.max(320, Math.floor(rect.height));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    seedNodes();
  }

  function seedNodes() {
    nodes.length = 0;
    for (let i = 0; i < nodeCount; i += 1) {
      nodes.push({
        x: width * (0.35 + Math.random() * 0.58),
        y: height * (0.1 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 1.8 + Math.random() * 2.2,
        hue: i % 4 === 0 ? "orange" : "purple"
      });
    }
  }

  function drawBackdrop() {
    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, 'rgba(255,255,255,0.008)');
    bg.addColorStop(1, 'rgba(53,29,117,0.012)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(90,74,147,0.055)';
    ctx.lineWidth = 1;

    const gap = 28;
    for (let x = 0; x <= width; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 120) continue;

        const alpha = (1 - distance / 120) * 0.28;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = a.hue === 'orange' || b.hue === 'orange'
          ? `rgba(231, 135, 49, ${alpha * 0.8})`
          : `rgba(90, 74, 147, ${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
  }

  function drawNodes() {
    nodes.forEach(node => {
      const color = node.hue === 'orange'
        ? 'rgba(231, 135, 49, 1)'
        : 'rgba(53, 29, 117, 1)';

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 5.5, 0, Math.PI * 2);
      ctx.fillStyle = node.hue === 'orange'
        ? 'rgba(231, 135, 49, 0.12)'
        : 'rgba(90, 74, 147, 0.13)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function drawSweep() {
    const primarySweep = (sweepOffset % (width * 1.4)) - width * 0.4;
    const secondarySweep = ((sweepOffset + width * 0.55) % (width * 1.6)) - width * 0.6;

    const gradientA = ctx.createLinearGradient(primarySweep - 80, 0, primarySweep + 120, 0);
    gradientA.addColorStop(0, 'rgba(231, 135, 49, 0)');
    gradientA.addColorStop(0.5, 'rgba(231, 135, 49, 0.08)');
    gradientA.addColorStop(1, 'rgba(231, 135, 49, 0)');
    ctx.fillStyle = gradientA;
    ctx.fillRect(primarySweep - 80, 0, 200, height);

    const gradientB = ctx.createLinearGradient(secondarySweep - 120, 0, secondarySweep + 140, 0);
    gradientB.addColorStop(0, 'rgba(53, 29, 117, 0)');
    gradientB.addColorStop(0.5, 'rgba(53, 29, 117, 0.07)');
    gradientB.addColorStop(1, 'rgba(53, 29, 117, 0)');
    ctx.fillStyle = gradientB;
    ctx.fillRect(secondarySweep - 120, 0, 260, height);

    ctx.strokeStyle = 'rgba(231, 135, 49, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(primarySweep, height * 0.08);
    ctx.lineTo(primarySweep + 30, height * 0.92);
    ctx.stroke();
  }

  function updateNodes() {
    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < width * 0.32 || node.x > width * 0.97) node.vx *= -1;
      if (node.y < height * 0.05 || node.y > height * 0.95) node.vy *= -1;
    });
  }

  function render() {
    drawBackdrop();
    drawSweep();
    drawConnections();
    drawNodes();

    if (!prefersReducedMotion) {
      updateNodes();
      sweepOffset += 0.6;
      animationId = window.requestAnimationFrame(render);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    render();
  });

  resizeObserver.observe(canvas);
  resizeCanvas();
  render();

  window.addEventListener('beforeunload', () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId);
    }
    resizeObserver.disconnect();
  }, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroGrid();
});

document.addEventListener('astro:page-load', () => {
  initHeroGrid();
});
