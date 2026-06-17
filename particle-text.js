/**
 * Particle Text Effect — "lisa schneider"
 * Renders cursive text as scattered particles with mouse repulsion physics.
 */

(function () {
  'use strict';

  const TEXT = 'lisa schneider';
  const FONT_FAMILY = 'Caveat';
  const FONT_WEIGHT = 700;
  const COLOR = '#de1c1c';
  const PARTICLE_RADIUS = 2.2;
  const SCATTER_AMOUNT = 4;
  const REPULSION_RADIUS = 45;
  const REPULSION_FORCE = 18;
  const SPRING_STIFFNESS = 0.1;
  const DAMPING = 0.82;

  class Particle {
    constructor(x, y) {
      this.baseX = x;
      this.baseY = y;
      this.x = x + (Math.random() - 0.5) * SCATTER_AMOUNT * 2;
      this.y = y + (Math.random() - 0.5) * SCATTER_AMOUNT * 2;
      this.vx = 0;
      this.vy = 0;
      this.radius = PARTICLE_RADIUS + Math.random() * 0.8;
    }

    update(mouse) {
      const dx = this.baseX - this.x;
      const dy = this.baseY - this.y;
      this.vx += dx * SPRING_STIFFNESS;
      this.vy += dy * SPRING_STIFFNESS;

      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const dist = Math.sqrt(mdx * mdx + mdy * mdy);

      if (dist < REPULSION_RADIUS && dist > 0.01) {
        const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
        const normX = mdx / dist;
        const normY = mdy / dist;
        this.vx += normX * force * REPULSION_FORCE;
        this.vy += normY * force * REPULSION_FORCE;
      }

      this.vx *= DAMPING;
      this.vy *= DAMPING;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = COLOR;
      ctx.fill();
    }
  }

  function scanTextPixels(fontSize) {
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    offCtx.font = `${FONT_WEIGHT} ${fontSize}px "${FONT_FAMILY}", cursive`;
    const metrics = offCtx.measureText(TEXT);
    const textWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    offscreen.width = Math.ceil(textWidth) + 8;
    offscreen.height = Math.ceil(textHeight) + 8;
    offCtx.font = `${FONT_WEIGHT} ${fontSize}px "${FONT_FAMILY}", cursive`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = '#000';
    offCtx.fillText(TEXT, 4, offscreen.height - metrics.actualBoundingBoxDescent - 4);
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;
    const result = [];
    const stride = 3;
    for (let y = 0; y < offscreen.height; y += stride) {
      for (let x = 0; x < offscreen.width; x += stride) {
        const alphaIndex = (y * offscreen.width + x) * 4 + 3;
        if (data[alphaIndex] > 128) {
          result.push({ x, y });
        }
      }
    }
    return { points: result, width: offscreen.width, height: offscreen.height };
  }

  class ParticleTextCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: -9999, y: -9999 };
      this.dpr = window.devicePixelRatio || 1;
      this.animFrameId = null;
    }

    getFontSize() {
      const vw = window.innerWidth;
      if (vw < 480) return 42;
      if (vw < 640) return 48;
      if (vw < 768) return 48;
      return 52;
    }

    resizeCanvas() {
      const fontSize = this.getFontSize();
      const scan = scanTextPixels(fontSize);
      const logicalWidth = scan.width;
      const logicalHeight = scan.height;
      this.dpr = window.devicePixelRatio || 1;
      this.canvas.width = logicalWidth * this.dpr;
      this.canvas.height = logicalHeight * this.dpr;
      this.canvas.style.width = `${logicalWidth}px`;
      this.canvas.style.height = `${logicalHeight}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
      this.particles = scan.points.map(point => new Particle(point.x, point.y));
    }

    render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      this.particles.forEach(p => {
        p.update(this.mouse);
        p.draw(this.ctx);
      });
      this.animFrameId = requestAnimationFrame(this.render);
    };

    onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    };

    onMouseLeave = () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    };

    init() {
      this.resizeCanvas();
      this.render();
      this.canvas.addEventListener('mousemove', this.onMouseMove);
      this.canvas.addEventListener('mouseleave', this.onMouseLeave);
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  function initCanvasById(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    new ParticleTextCanvas(canvas).init();
  }

  function init() {
    document.fonts.load(`${FONT_WEIGHT} 48px "${FONT_FAMILY}"`).then(() => {
      initCanvasById('nav-particle-canvas');
      initCanvasById('footer-particle-canvas');
    }).catch(() => {
      initCanvasById('nav-particle-canvas');
      initCanvasById('footer-particle-canvas');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
