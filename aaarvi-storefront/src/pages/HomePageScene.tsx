// src/pages/HomePageScene.tsx  — Three.js golden-card homepage
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';

/* ── Category data ─────────────────────────────────────────── */
const CATS = [
  { slug: 'home-and-kitchen', label: 'Home & Kitchen',  count: 32, icon: '🏠' },
  { slug: 'cleaning-product', label: 'Cleaning',         count: 12, icon: '✨' },
  { slug: 'in-the-spotlight', label: 'In The Spotlight', count: 9,  icon: '⭐' },
  { slug: 'essentials',       label: 'Essentials',        count: 8,  icon: '🛒' },
  { slug: 'best-sellers',     label: 'Best Sellers',      count: 4,  icon: '🔥' },
];

/* ── Helpers ────────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInQuart(t: number) { return t * t * t * t; }

/** Shortest circular direction: returns +1 (next is visually to the right) or -1 */
function circularDir(prev: number, next: number, length: number): 1 | -1 {
  const raw = next - prev;
  if (Math.abs(raw) > length / 2) return raw > 0 ? -1 : 1;
  return raw >= 0 ? 1 : -1;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number | [number, number, number, number],
) {
  const [r0, r1, r2, r3] = typeof r === 'number' ? [r, r, r, r] : r;
  ctx.moveTo(x + r0, y);
  ctx.lineTo(x + w - r1, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r1);
  ctx.lineTo(x + w, y + h - r2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
  ctx.lineTo(x + r3, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r3);
  ctx.lineTo(x, y + r0);
  ctx.quadraticCurveTo(x, y, x + r0, y);
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, corner: 1 | 2 | 3 | 4,
) {
  const s = 18;
  ctx.strokeStyle = 'rgba(255,240,160,0.55)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  const sx = (corner === 2 || corner === 4) ? -1 : 1;
  const sy = (corner === 3 || corner === 4) ? -1 : 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy + sy * s);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + sx * s, cy);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,160,0.6)';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}

function makeGoldTexture(cat: { slug: string; icon: string }) {
  const W = 512, H = 720;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,    '#7a5200');
  bg.addColorStop(0.3,  '#c8860a');
  bg.addColorStop(0.6,  '#f0b429');
  bg.addColorStop(0.85, '#fde68a');
  bg.addColorStop(1,    '#c8860a');
  ctx.fillStyle = bg;
  ctx.beginPath();
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.fill();

  const sheen = ctx.createLinearGradient(0, 0, W, H * 0.6);
  sheen.addColorStop(0,   'rgba(255,255,220,0.22)');
  sheen.addColorStop(0.4, 'rgba(255,255,200,0.06)');
  sheen.addColorStop(1,   'rgba(255,200,100,0.0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  roundRectPath(ctx, 0, 0, W, H, 28);
  ctx.fill();

  const flare = ctx.createRadialGradient(80, 80, 0, 80, 80, 220);
  flare.addColorStop(0, 'rgba(255,255,210,0.28)');
  flare.addColorStop(1, 'rgba(255,255,210,0)');
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,220,100,0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,240,160,0.45)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRectPath(ctx, 10, 10, W - 20, H - 20, 22);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,240,160,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  roundRectPath(ctx, 22, 22, W - 44, H - 44, 16);
  ctx.stroke();

  drawCornerFlourish(ctx, 36, 36, 1);
  drawCornerFlourish(ctx, W - 36, 36, 2);
  drawCornerFlourish(ctx, 36, H - 36, 3);
  drawCornerFlourish(ctx, W - 36, H - 36, 4);

  ctx.globalAlpha = 0.18;
  ctx.font = '140px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff8dc';
  ctx.fillText(cat.icon, W / 2, H / 2 - 20);
  ctx.globalAlpha = 1;

  const strip = ctx.createLinearGradient(0, H - 90, 0, H);
  strip.addColorStop(0, 'rgba(80,40,0,0)');
  strip.addColorStop(1, 'rgba(80,40,0,0.55)');
  ctx.fillStyle = strip;
  ctx.beginPath();
  roundRectPath(ctx, 0, H - 100, W, 100, [0, 0, 28, 28]);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,240,160,0.3)';
  ctx.font = '600 14px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(cat.slug.toUpperCase(), W / 2, H - 22);

  return new THREE.CanvasTexture(cv);
}

function makeBackTexture() {
  const W = 256, H = 360;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#5a3a00');
  bg.addColorStop(1, '#2a1a00');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,210,80,0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  return new THREE.CanvasTexture(cv);
}

function makeRoundedBoxGeo(w: number, h: number, d: number, r: number, segs: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true,
    bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: segs,
    steps: 1, curveSegments: segs,
  });
}

function buildCard(cat: { slug: string; icon: string }) {
  const group = new THREE.Group();
  const geo = makeRoundedBoxGeo(2.8, 4.0, 0.09, 0.14, 8);

  const frontTex = makeGoldTexture(cat);
  frontTex.colorSpace = THREE.SRGBColorSpace;

  const backTex = makeBackTexture();
  backTex.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.18, metalness: 0.55, envMapIntensity: 1.2,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.geometry.center();
  group.add(mesh);

  const backGeo = new THREE.PlaneGeometry(2.8, 4.0);
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.3, metalness: 0.45, side: THREE.BackSide,
  });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.z = -0.046;
  group.add(back);

  const haloGeo = new THREE.PlaneGeometry(3.8, 5.2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xf0b429, transparent: true, opacity: 0.07,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.z = -0.25;
  group.add(halo);

  const ringGeo = new THREE.RingGeometry(1.55, 1.9, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfde68a, transparent: true, opacity: 0.06,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.z = -0.05;
  group.add(ring);

  return group;
}

/* ── React Component ────────────────────────────────────────── */
export function HomePageScene() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnSlug = (location.state as { returnTo?: string } | null)?.returnTo;
  const initialIndex = returnSlug ? Math.max(0, CATS.findIndex(c => c.slug === returnSlug)) : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(initialIndex);
  const [labelVisible, setLabelVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [isZoomingOut, setIsZoomingOut] = useState(false);

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cards: THREE.Group[];
    fillLight: THREE.PointLight;
    rimLight: THREE.PointLight;
    clock: THREE.Clock;
  } | null>(null);

  const currentRef = useRef(0);
  const isAnimatingRef = useRef(false);

  const OFF_X  = 10;
  const OFF_Z  = -4;
  const OFF_RY = 0.55;

  function placeCard(group: THREE.Group, state: 'active' | 'left' | 'right') {
    if (state === 'active') {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(1);
    } else if (state === 'right') {
      group.position.set(OFF_X, 0, OFF_Z);
      group.rotation.set(0, -OFF_RY, 0);
      group.scale.setScalar(0.82);
    } else {
      group.position.set(-OFF_X, 0, OFF_Z);
      group.rotation.set(0, OFF_RY, 0);
      group.scale.setScalar(0.82);
    }
  }

  /** Snap all 5 cards to their correct positions for a given active index. */
  const restoreCarousel = useCallback((activeIdx: number) => {
    if (!sceneRef.current) return;
    const { cards } = sceneRef.current;
    const n = CATS.length;
    cards.forEach((card, i) => {
      if (i === activeIdx) {
        placeCard(card, 'active');
      } else if (i === (activeIdx - 1 + n) % n) {
        placeCard(card, 'left');
      } else if (i === (activeIdx + 1) % n) {
        placeCard(card, 'right');
      } else {
        // Park off-screen so they never appear
        card.position.set(0, -80, -20);
        card.rotation.set(0, 0, 0);
        card.scale.setScalar(0);
      }
    });
  }, []);

  const showLabel = useCallback((idx: number) => {
    setLabelVisible(false);
    setCurrent(idx);
    setTimeout(() => {
      setLabelVisible(true);
      setCtaVisible(true);
    }, 200);
  }, []);

  const goTo = useCallback((next: number) => {
    if (!sceneRef.current) return;
    const { cards } = sceneRef.current;
    if (isAnimatingRef.current || next === currentRef.current) return;

    isAnimatingRef.current = true;
    setLabelVisible(false);
    setCtaVisible(false);

    const prev = currentRef.current;
    currentRef.current = next;

    const prevCard = cards[prev];
    const nextCard = cards[next];
    const dir = circularDir(prev, next, CATS.length);

    // Hide the card on the side we're moving AWAY from so it doesn't linger
    const oppositeIdx = dir > 0
      ? (prev - 1 + CATS.length) % CATS.length
      : (prev + 1) % CATS.length;
    if (oppositeIdx !== next) {
      cards[oppositeIdx].position.set(0, -80, -20);
      cards[oppositeIdx].scale.setScalar(0);
    }

    // Snap the incoming card to its start position
    nextCard.position.set(dir * OFF_X, 0, OFF_Z);
    nextCard.rotation.y = -dir * OFF_RY;
    nextCard.scale.setScalar(0.82);

    const start = performance.now();
    const DURATION = 780;

    function tick(now: number) {
      const raw = Math.min((now - start) / DURATION, 1);
      const t   = easeInOutQuart(raw);
      const tIn = easeOutBack(raw);

      prevCard.position.x = lerp(0, -dir * OFF_X, t);
      prevCard.position.z = lerp(0, OFF_Z, t);
      prevCard.position.y = Math.sin(raw * Math.PI) * -0.6;
      prevCard.rotation.y = lerp(0, dir * OFF_RY, t);
      prevCard.rotation.z = lerp(0, -dir * 0.05, t);
      prevCard.scale.setScalar(lerp(1, 0.82, t));

      nextCard.position.x = lerp(dir * OFF_X, 0, tIn);
      nextCard.position.z = lerp(OFF_Z, 0, t);
      nextCard.position.y = lerp(0, 0, t);
      nextCard.rotation.y = lerp(-dir * OFF_RY, 0, t);
      nextCard.rotation.z = lerp(dir * 0.04, 0, t);
      nextCard.scale.setScalar(lerp(0.82, 1, t));

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        // Snap all cards to canonical positions for the new active index
        restoreCarousel(next);
        isAnimatingRef.current = false;
        showLabel(next);
      }
    }
    requestAnimationFrame(tick);
  }, [showLabel, restoreCarousel]);

  const goPrev = useCallback(() => goTo((currentRef.current - 1 + CATS.length) % CATS.length), [goTo]);
  const goNext = useCallback(() => goTo((currentRef.current + 1) % CATS.length), [goTo]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    /* ── Lighting ── */
    scene.add(new THREE.AmbientLight(0x3d1060, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffd580, 2.2);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x9333ea, 3.5, 18);
    fillLight.position.set(-4, 2, 4);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xf0b429, 2.8, 18);
    rimLight.position.set(4, -3, 3);
    scene.add(rimLight);
    const backLight = new THREE.PointLight(0xa855f7, 2, 15);
    backLight.position.set(0, 0, -3);
    scene.add(backLight);

    /* ── Cards ── */
    const cards = CATS.map(cat => {
      const g = buildCard(cat);
      scene.add(g);
      return g;
    });

    // Place only the active card + its two neighbors; park the rest off-screen
    const n = CATS.length;
    cards.forEach((g, i) => {
      if (i === initialIndex) placeCard(g, 'active');
      else if (i === (initialIndex - 1 + n) % n) placeCard(g, 'left');
      else if (i === (initialIndex + 1) % n) placeCard(g, 'right');
      else { g.position.set(0, -80, -20); g.scale.setScalar(0); }
    });
    currentRef.current = initialIndex;

    /* ── Intro / return animation ── */
    if (returnSlug) {
      // Returning from category page — zoom out from card face
      camera.position.z = 0.6;
      const retCard = cards[initialIndex];
      retCard.scale.setScalar(1.18);
      const zoomOutStart = performance.now();
      const ZOOM_OUT_DUR = 650;
      function zoomOutTick(now: number) {
        const raw = Math.min((now - zoomOutStart) / ZOOM_OUT_DUR, 1);
        const t = easeInOutQuart(raw);
        camera.position.z = lerp(0.6, 6, t);
        retCard.scale.setScalar(lerp(1.18, 1, t));
        if (raw < 1) requestAnimationFrame(zoomOutTick);
        else { camera.position.z = 6; retCard.scale.setScalar(1); showLabel(initialIndex); }
      }
      requestAnimationFrame(zoomOutTick);
    } else {
      const c0 = cards[0];
      c0.position.set(0, -7, 0);
      c0.rotation.x = -0.3;
      c0.scale.setScalar(0.7);
      const introStart = performance.now();
      function introTick(now: number) {
        const t = Math.min((now - introStart) / 1000, 1);
        const e = easeOutBack(t);
        c0.position.y = -7 + 7 * e;
        c0.rotation.x = -0.3 + 0.3 * e;
        c0.scale.setScalar(0.7 + 0.3 * e);
        if (t < 1) requestAnimationFrame(introTick);
        else { c0.position.set(0, 0, 0); c0.rotation.x = 0; c0.scale.setScalar(1); }
      }
      requestAnimationFrame(introTick);
    }

    const clock = new THREE.Clock();
    let mouseX = 0, mouseY = 0;

    /* ── Animation loop ── */
    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime();
      if (!isAnimatingRef.current) {
        const cc = cards[currentRef.current];
        cc.position.y = Math.sin(t * 0.75) * 0.07;
        cc.rotation.y = mouseX * 0.08;
        cc.rotation.x = -mouseY * 0.04 - 0.01;
      }
      fillLight.position.x = Math.sin(t * 0.5) * 5;
      fillLight.position.y = Math.cos(t * 0.4) * 3;
      rimLight.position.x  = Math.cos(t * 0.55) * 5;
      rimLight.position.y  = Math.sin(t * 0.45) * 3;
      renderer.render(scene, camera);
    });

    sceneRef.current = { renderer, scene, camera, cards, fillLight, rimLight, clock };

    /* Show label after intro (normal entry only; return entry calls showLabel at zoom-out end) */
    if (!returnSlug) setTimeout(() => showLabel(initialIndex), 600);

    /* ── Mouse move ── */
    function onMouseMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    /* ── Touch ── */
    let tx = 0;
    function onTouchStart(e: TouchEvent) { tx = e.touches[0].clientX; }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goTo((currentRef.current + 1) % CATS.length);
        else        goTo((currentRef.current - 1 + CATS.length) % CATS.length);
      }
    }

    /* ── Resize ── */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keyboard */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [goPrev, goNext]);

  /* Zoom camera then navigate — shared by all homepage→category links */
  function handleZoomNavigate(targetSlug: string) {
    if (!sceneRef.current || isZoomingOut) return;
    const { camera, cards } = sceneRef.current;

    setIsZoomingOut(true);
    setLabelVisible(false);
    setCtaVisible(false);
    isAnimatingRef.current = true;

    const isSameCat = targetSlug === CATS[currentRef.current].slug;
    const activeCard = cards[currentRef.current];
    const startZ = camera.position.z;
    // Same-category: zoom all the way into the face; different: just push forward
    const targetZ = isSameCat ? 0.6 : 2.5;
    const ZOOM_DUR = isSameCat ? 620 : 380;
    const zoomStart = performance.now();

    function zoomTick(now: number) {
      const raw = Math.min((now - zoomStart) / ZOOM_DUR, 1);
      const t = easeInQuart(raw);
      camera.position.z = lerp(startZ, targetZ, t);
      if (isSameCat) activeCard.scale.setScalar(lerp(1, 1.18, t));
      if (raw < 1) {
        requestAnimationFrame(zoomTick);
      } else {
        navigate(`/category/${targetSlug}`, { state: { dealIn: true } });
      }
    }
    requestAnimationFrame(zoomTick);
  }

  function handleShop() {
    handleZoomNavigate(CATS[currentRef.current].slug);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: '#0d0414',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: '#faf5ff',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div style={{
        position: 'fixed', width: 550, height: 550, borderRadius: '50%',
        background: 'radial-gradient(circle, #7c3aed, transparent 70%)',
        top: -120, left: -120, filter: 'blur(90px)', opacity: 0.15, pointerEvents: 'none',
        animation: 'hpDrift1 10s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, #a855f7, transparent 70%)',
        bottom: -90, right: -90, filter: 'blur(90px)', opacity: 0.15, pointerEvents: 'none',
        animation: 'hpDrift2 12s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'fixed', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, #f0b429, transparent 70%)',
        top: '40%', right: '10%', filter: 'blur(90px)', opacity: 0.08, pointerEvents: 'none',
        animation: 'hpDrift1 9s ease-in-out infinite alternate',
      }} />

      {/* Canvas container */}
      <div ref={containerRef} style={{ position: 'fixed', inset: 0 }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '1.25rem 2.5rem',
        background: 'linear-gradient(to bottom, rgba(13,4,20,0.92) 0%, transparent 100%)',
      }}>
        {/* Left slot — empty */}
        <div />
        {/* Center — logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-label="Aarvi">
            <circle cx="17" cy="17" r="16" stroke="url(#hpLg)" strokeWidth="1.5" />
            <path d="M17 7 L26 25 H8 Z" fill="url(#hpLg2)" opacity="0.92" />
            <path d="M12 19 H22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
            <defs>
              <linearGradient id="hpLg" x1="0" y1="0" x2="34" y2="34">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f0b429" />
              </linearGradient>
              <linearGradient id="hpLg2" x1="17" y1="7" x2="17" y2="25">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f0b429" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.5rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #e9d5ff, #fde68a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            AArvi
          </span>
        </div>
        {/* Right — nav */}
        <nav style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-end' }}>
          {(['Deals', 'Spotlight'] as const).map(link => (
            <a
              key={link}
              href="#"
              onClick={e => {
                e.preventDefault();
                if (link === 'Deals') handleZoomNavigate('best-sellers');
                else if (link === 'Spotlight') handleZoomNavigate('in-the-spotlight');
              }}
              style={{
                fontSize: '0.875rem', fontWeight: 500,
                color: 'rgba(250,245,255,0.7)', textDecoration: 'none',
                letterSpacing: '0.04em', transition: 'color 180ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#faf5ff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,245,255,0.7)')}
            >
              {link}
            </a>
          ))}
        </nav>
      </header>

      {/* Category display */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none', zIndex: 5,
        width: 520,
      }}>
        <div style={{
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#f0b429',
          marginBottom: '0.4rem',
          opacity: labelVisible ? 1 : 0,
          transform: labelVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 350ms ease, transform 350ms ease',
        }}>
          Category
        </div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 40%, #e9d5ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          opacity: labelVisible ? 1 : 0,
          transform: labelVisible ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 350ms ease 80ms, transform 350ms ease 80ms',
        }}>
          {CATS[current]?.label}
        </div>
        <div style={{
          fontSize: '0.875rem', color: 'rgba(250,245,255,0.7)',
          marginTop: '0.4rem',
          opacity: labelVisible ? 1 : 0,
          transform: labelVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 350ms ease 150ms, transform 350ms ease 150ms',
        }}>
          {CATS[current]?.count} items
        </div>
      </div>

      {/* Prev button */}
      <button
        onClick={goPrev}
        aria-label="Previous category"
        style={{
          position: 'fixed', top: '50%', left: '2rem',
          transform: 'translateY(-50%)',
          zIndex: 10, width: 52, height: 52, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.55)',
          backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = '#a855f7';
          b.style.background = 'rgba(124,58,237,0.4)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(168,85,247,0.4)';
          b.style.background = 'rgba(42,16,64,0.55)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Next button */}
      <button
        onClick={goNext}
        aria-label="Next category"
        style={{
          position: 'fixed', top: '50%', right: '2rem',
          transform: 'translateY(-50%)',
          zIndex: 10, width: 52, height: 52, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.55)',
          backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = '#a855f7';
          b.style.background = 'rgba(124,58,237,0.4)';
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = 'rgba(168,85,247,0.4)';
          b.style.background = 'rgba(42,16,64,0.55)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Dots */}
      <div style={{
        position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '0.5rem', zIndex: 10,
      }}>
        {CATS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to ${CATS[i].label}`}
            style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: i === current ? '#a855f7' : 'rgba(168,85,247,0.3)',
              transform: i === current ? 'scale(1.45)' : 'scale(1)',
              transition: 'background 300ms, transform 300ms',
            }}
          />
        ))}
      </div>

      {/* Shop CTA */}
      <div style={{
        position: 'fixed', bottom: '4.5rem', left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        opacity: ctaVisible ? 1 : 0,
        pointerEvents: ctaVisible ? 'auto' : 'none',
        transition: 'opacity 400ms ease 250ms',
      }}>
        <button
          onClick={handleShop}
          style={{
            padding: '0.7rem 2.2rem', borderRadius: 9999, border: 'none',
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '0.875rem', fontWeight: 600,
            letterSpacing: '0.05em', color: '#1a0a00',
            background: 'linear-gradient(135deg, #fde68a, #f0b429)',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(240,180,41,0.4)',
            transition: 'transform 180ms ease, box-shadow 180ms ease',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.transform = 'scale(1.06)';
            b.style.boxShadow = '0 8px 30px rgba(240,180,41,0.55)';
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.transform = 'scale(1)';
            b.style.boxShadow = '0 4px 20px rgba(240,180,41,0.4)';
          }}
        >
          Shop This Category
        </button>
      </div>

      {/* Orb keyframes injected via style tag */}
      <style>{`
        @keyframes hpDrift1 { from { transform: translate(0,0); } to { transform: translate(50px,40px); } }
        @keyframes hpDrift2 { from { transform: translate(0,0); } to { transform: translate(-40px,-30px); } }
      `}</style>
    </div>
  );
}
