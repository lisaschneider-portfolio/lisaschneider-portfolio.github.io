/**
 * Particle Text Effect - "LISA SCHNEIDER"
 * Renders text and hero accent shapes as scattered particles with mouse repulsion physics.
 */

(function () {
  'use strict';

  const TEXT = 'LISA SCHNEIDER';
  const FONT_FAMILY = 'Inter';
  const FONT_WEIGHT = 800;
  const LETTER_SPACING = 1.6;
  const NAV_LETTER_SPACING = 0.8;
  const COLOR = '#16a34a';
  const ACCESSIBLE_COLOR = '#ffffff';
  const TEXT_PADDING_X = 20;
  const TEXT_PADDING_Y = 12;
  const NAV_TEXT_PADDING_X = 8;
  const NAV_TEXT_PADDING_Y = 6;
  const PARTICLE_RADIUS = 1.3;
  const SCATTER_AMOUNT = 2.6;
  const REPULSION_RADIUS = 72;
  const REPULSION_FORCE = 15;
  const SPRING_STIFFNESS = 0.075;
  const DAMPING = 0.88;
  const MAX_SPEED = 2.8;
  const MOUSE_LERP = 0.48;
  const SHAPE_PADDING = 10;
  const FLASH_DECAY = 0.9;
  const FLASH_RADIUS = 58;
  const FLASH_ALPHA = 0.3;

  class Particle {
    constructor(x, y) {
      this.baseX = x;
      this.baseY = y;
      this.x = x + (Math.random() - 0.5) * SCATTER_AMOUNT * 2;
      this.y = y + (Math.random() - 0.5) * SCATTER_AMOUNT * 2;
      this.vx = 0;
      this.vy = 0;
      this.radius = PARTICLE_RADIUS + Math.random() * 0.18;
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
        const easedForce = force * force;
        const normX = mdx / dist;
        const normY = mdy / dist;
        this.vx += normX * easedForce * REPULSION_FORCE;
        this.vy += normY * easedForce * REPULSION_FORCE;
      }

      this.vx *= DAMPING;
      this.vy *= DAMPING;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > MAX_SPEED) {
        const ratio = MAX_SPEED / speed;
        this.vx *= ratio;
        this.vy *= ratio;
      }

      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      const isAccessibleMode = document.body && document.body.getAttribute('data-theme') === 'accessible';
      ctx.fillStyle = isAccessibleMode ? ACCESSIBLE_COLOR : COLOR;
      ctx.fill();
    }
  }

  function scanTextPixels(fontSize, paddingX = TEXT_PADDING_X, paddingY = TEXT_PADDING_Y, letterSpacing = LETTER_SPACING) {
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    offCtx.font = `${FONT_WEIGHT} ${fontSize}px "${FONT_FAMILY}", cursive`;
    const metrics = offCtx.measureText(TEXT);
    const textWidth = measureTrackedTextWidth(offCtx, TEXT, letterSpacing);
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    offscreen.width = Math.ceil(textWidth) + paddingX * 2;
    offscreen.height = Math.ceil(textHeight) + paddingY * 2;
    offCtx.font = `${FONT_WEIGHT} ${fontSize}px "${FONT_FAMILY}", cursive`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = '#000';
    const drawX = paddingX;
    const drawY = paddingY + metrics.actualBoundingBoxAscent;
    drawTrackedText(offCtx, TEXT, drawX, drawY, letterSpacing);
    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;
    const result = [];
    const stride = 2;
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

  function measureTrackedTextWidth(ctx, text, letterSpacing = LETTER_SPACING) {
    let width = 0;
    for (let i = 0; i < text.length; i += 1) {
      width += ctx.measureText(text[i]).width;
      if (i < text.length - 1) width += letterSpacing;
    }
    return width;
  }

  function drawTrackedText(ctx, text, startX, baselineY, letterSpacing = LETTER_SPACING) {
    let cursorX = startX;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      ctx.fillText(char, cursorX, baselineY);
      cursorX += ctx.measureText(char).width + letterSpacing;
    }
  }

  function drawLightFlash(ctx, centerX, centerY, strength) {
    if (strength <= 0.01) return;
    const isAccessibleMode = document.body && document.body.getAttribute('data-theme') === 'accessible';
    const alpha = FLASH_ALPHA * strength;
    const radius = FLASH_RADIUS * (0.75 + strength * 0.5);
    const glowColor = isAccessibleMode ? '255,255,255' : '220,252,231';

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(${glowColor}, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(${glowColor}, ${alpha * 0.45})`);
    gradient.addColorStop(1, `rgba(${glowColor}, 0)`);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSmileyShape(ctx, cx, cy, size) {
    const faceRadius = size * 0.44;

    ctx.beginPath();
    ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);
    ctx.fill();

    const eyeRadius = size * 0.055;
    const eyeOffsetX = size * 0.15;
    const eyeOffsetY = size * 0.12;

    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.arc(cx - eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.02, size * 0.2, 0.18 * Math.PI, 0.82 * Math.PI, false);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
  }

  function drawHeartShape(ctx, cx, cy, size) {
    const topCurveHeight = size * 0.28;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(
      cx - size * 0.55,
      cy - size * 0.02,
      cx - size * 0.45,
      cy - size * 0.5,
      cx,
      cy - topCurveHeight
    );
    ctx.bezierCurveTo(
      cx + size * 0.45,
      cy - size * 0.5,
      cx + size * 0.55,
      cy - size * 0.02,
      cx,
      cy + size * 0.3
    );
    ctx.closePath();
    ctx.fill();
  }

  function drawStarShape(ctx, cx, cy, size) {
    const spikes = 5;
    const outerRadius = size * 0.46;
    const innerRadius = outerRadius * 0.48;
    let angle = -Math.PI / 2;
    const step = Math.PI / spikes;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i += 1) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      angle += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawFlashShape(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.05, cy - size * 0.48);
    ctx.lineTo(cx - size * 0.32, cy - size * 0.02);
    ctx.lineTo(cx - size * 0.07, cy - size * 0.02);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.48);
    ctx.lineTo(cx + size * 0.3, cy - size * 0.1);
    ctx.lineTo(cx + size * 0.06, cy - size * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  function drawFlowerShape(ctx, cx, cy, size) {
    const unit = Math.max(2, Math.round(size * 0.075));

    const drawCell = (gx, gy, w = 1, h = 1) => {
      const x = Math.round(cx + gx * unit - (w * unit) / 2);
      const y = Math.round(cy + gy * unit - (h * unit) / 2);
      ctx.fillRect(x, y, w * unit, h * unit);
    };

    const stampPetal = (gx, gy) => {
      drawCell(gx, gy);
      drawCell(gx - 1, gy);
      drawCell(gx + 1, gy);
      drawCell(gx, gy - 1);
      drawCell(gx, gy + 1);
    };

    [
      [0, -4],
      [3, -3],
      [4, 0],
      [3, 3],
      [0, 4],
      [-3, 3],
      [-4, 0],
      [-3, -3]
    ].forEach(([gx, gy]) => stampPetal(gx, gy));

    drawCell(0, 0, 2, 2);
    drawCell(0, -1);
    drawCell(0, 1);
    drawCell(-1, 0);
    drawCell(1, 0);
  }

  function drawSunShape(ctx, cx, cy, size) {
    const coreRadius = size * 0.2;
    const rayInner = size * 0.3;
    const rayOuter = size * 0.47;
    const rayCount = 12;

    for (let i = 0; i < rayCount; i += 1) {
      const angle = (Math.PI * 2 * i) / rayCount;
      const x1 = cx + Math.cos(angle) * rayInner;
      const y1 = cy + Math.sin(angle) * rayInner;
      const x2 = cx + Math.cos(angle) * rayOuter;
      const y2 = cy + Math.sin(angle) * rayOuter;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = Math.max(2, size * 0.06);
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function scanShapePixels(shape, size) {
    const shapePadding = Math.max(SHAPE_PADDING, Math.round(size * 0.6));
    const offscreen = document.createElement('canvas');
    offscreen.width = size + shapePadding * 2;
    offscreen.height = size + shapePadding * 2;
    const offCtx = offscreen.getContext('2d');
    offCtx.fillStyle = '#000';

    const cx = shapePadding + size / 2;
    const cy = shapePadding + size / 2;
    if (shape === 'smiley') {
      drawSmileyShape(offCtx, cx, cy, size * 0.92);
    } else if (shape === 'heart') {
      drawHeartShape(offCtx, cx, cy, size * 0.92);
    } else if (shape === 'flash') {
      drawFlashShape(offCtx, cx, cy, size * 0.92);
    } else if (shape === 'flower') {
      drawFlowerShape(offCtx, cx, cy, size * 0.92);
    } else if (shape === 'sun') {
      drawSunShape(offCtx, cx, cy, size * 0.92);
    } else {
      drawStarShape(offCtx, cx, cy, size * 0.92);
    }

    const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;
    const result = [];
    const stride = 2;

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

  function createHeartVertices(scale = 1) {
    return [
      { x: 0, y: -20 * scale },
      { x: 15 * scale, y: -35 * scale },
      { x: 30 * scale, y: -20 * scale },
      { x: 30 * scale, y: 0 },
      { x: 0, y: 40 * scale },
      { x: -30 * scale, y: 0 },
      { x: -30 * scale, y: -20 * scale },
      { x: -15 * scale, y: -35 * scale }
    ];
  }

  function createFlowerParts(x, y, radius = 14) {
    const center = Matter.Bodies.circle(x, y, radius * 0.5, {
      restitution: 0.5,
      friction: 0.02,
      density: 0.0012
    });
    const petalRadius = radius * 0.45;
    const spacing = radius * 0.9;
    const petals = [
      { x: spacing, y: 0 },
      { x: -spacing, y: 0 },
      { x: 0, y: spacing },
      { x: 0, y: -spacing }
    ].map(offset => Matter.Bodies.circle(x + offset.x, y + offset.y, petalRadius, {
      restitution: 0.5,
      friction: 0.02,
      density: 0.001
    }));

    return Matter.Body.create({
      parts: [center, ...petals],
      friction: 0.02,
      restitution: 0.55,
      density: 0.0011,
      render: { fillStyle: '#16a34a' }
    });
  }

  class ParticleTextCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: -9999, y: -9999 };
      this.targetMouse = { x: -9999, y: -9999 };
      this.dpr = window.devicePixelRatio || 1;
      this.animFrameId = null;
      this.isNavCanvas = this.canvas.id === 'nav-particle-canvas';
      this.flashStrength = 0;
      this.flashX = -9999;
      this.flashY = -9999;
    }

    getFontSize() {
      const vw = window.innerWidth;
      if (this.isNavCanvas) {
        if (vw < 480) return 20;
        if (vw < 640) return 24;
        if (vw < 768) return 28;
        return 36;
      }

      if (vw < 480) return 34;
      if (vw < 640) return 40;
      if (vw < 768) return 40;
      return 44;
    }

    resizeCanvas() {
      const fontSize = this.getFontSize();
      const paddingX = this.isNavCanvas ? NAV_TEXT_PADDING_X : TEXT_PADDING_X;
      const paddingY = this.isNavCanvas ? NAV_TEXT_PADDING_Y : TEXT_PADDING_Y;
      const letterSpacing = this.isNavCanvas ? NAV_LETTER_SPACING : LETTER_SPACING;
      const scan = scanTextPixels(fontSize, paddingX, paddingY, letterSpacing);
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
      this.mouse.x += (this.targetMouse.x - this.mouse.x) * MOUSE_LERP;
      this.mouse.y += (this.targetMouse.y - this.mouse.y) * MOUSE_LERP;
      this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      this.particles.forEach(p => {
        p.update(this.mouse);
        p.draw(this.ctx);
      });
      drawLightFlash(this.ctx, this.flashX, this.flashY, this.flashStrength);
      this.flashStrength *= FLASH_DECAY;
      this.animFrameId = requestAnimationFrame(this.render);
    };

    onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouse.x = event.clientX - rect.left;
      this.targetMouse.y = event.clientY - rect.top;
      if (this.flashStrength > 0.06) {
        this.flashX = this.targetMouse.x;
        this.flashY = this.targetMouse.y;
      }
    };

    onMouseEnter = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.targetMouse.x = x;
      this.targetMouse.y = y;
      this.mouse.x = x;
      this.mouse.y = y;
      this.flashX = x;
      this.flashY = y;
      this.flashStrength = 1;
    };

    onMouseLeave = () => {
      this.targetMouse.x = -9999;
      this.targetMouse.y = -9999;
    };

    init() {
      this.resizeCanvas();
      this.render();
      this.canvas.addEventListener('mouseenter', this.onMouseEnter);
      this.canvas.addEventListener('mousemove', this.onMouseMove);
      this.canvas.addEventListener('mouseleave', this.onMouseLeave);
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  class ParticleShapeCanvas {
    constructor(canvas, shape) {
      this.canvas = canvas;
      this.shape = shape;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: -9999, y: -9999 };
      this.targetMouse = { x: -9999, y: -9999 };
      this.dpr = window.devicePixelRatio || 1;
      this.animFrameId = null;
      this.flashStrength = 0;
      this.flashX = -9999;
      this.flashY = -9999;
    }

    getShapeSize() {
      const vw = window.innerWidth;
      if (vw < 480) return 40;
      if (vw < 640) return 46;
      if (vw < 768) return 52;
      return 58;
    }

    resizeCanvas() {
      const scan = scanShapePixels(this.shape, this.getShapeSize());
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
      this.mouse.x += (this.targetMouse.x - this.mouse.x) * MOUSE_LERP;
      this.mouse.y += (this.targetMouse.y - this.mouse.y) * MOUSE_LERP;
      this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      this.particles.forEach(p => {
        p.update(this.mouse);
        p.draw(this.ctx);
      });
      drawLightFlash(this.ctx, this.flashX, this.flashY, this.flashStrength);
      this.flashStrength *= FLASH_DECAY;
      this.animFrameId = requestAnimationFrame(this.render);
    };

    onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouse.x = event.clientX - rect.left;
      this.targetMouse.y = event.clientY - rect.top;
      if (this.flashStrength > 0.06) {
        this.flashX = this.targetMouse.x;
        this.flashY = this.targetMouse.y;
      }
    };

    onMouseEnter = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.targetMouse.x = x;
      this.targetMouse.y = y;
      this.mouse.x = x;
      this.mouse.y = y;
      this.flashX = x;
      this.flashY = y;
      this.flashStrength = 1;
    };

    onMouseLeave = () => {
      this.targetMouse.x = -9999;
      this.targetMouse.y = -9999;
    };

    init() {
      this.resizeCanvas();
      this.render();
      this.canvas.addEventListener('mouseenter', this.onMouseEnter);
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

  function initShapeCanvasById(id, shape) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    new ParticleShapeCanvas(canvas, shape).init();
  }

  function init() {
    document.fonts.load(`${FONT_WEIGHT} 48px "${FONT_FAMILY}"`).then(() => {
      initCanvasById('nav-particle-canvas');
      initCanvasById('footer-particle-canvas');
      initShapeCanvasById('hero-left-particle-canvas', 'smiley');
      initShapeCanvasById('hero-right-particle-canvas', 'star');
      initShapeCanvasById('carousel-left-flash-canvas', 'flash');
      initShapeCanvasById('about-right-flower-canvas', 'sun');
    }).catch(() => {
      initCanvasById('nav-particle-canvas');
      initCanvasById('footer-particle-canvas');
      initShapeCanvasById('hero-left-particle-canvas', 'smiley');
      initShapeCanvasById('hero-right-particle-canvas', 'star');
      initShapeCanvasById('carousel-left-flash-canvas', 'flash');
      initShapeCanvasById('about-right-flower-canvas', 'sun');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
