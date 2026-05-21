// src/pages/HomePageScene.tsx  — Three.js golden-card homepage
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import logoSrc from '../assets/logo.png';

/* ── Category data ─────────────────────────────────────────── */
const CATS = [
  { slug: 'standard-collection',  label: 'Standard Collection',  count: 0, icon: '📦' },
  { slug: 'business-collection',  label: 'Business Collection',  count: 0, icon: '💼' },
  { slug: 'signature-collection', label: 'Signature Collection', count: 0, icon: '✒️' },
  { slug: 'preferred-collection', label: 'Preferred Collection', count: 0, icon: '⭐' },
  { slug: 'premium-collection',   label: 'Premium Collection',   count: 0, icon: '💎' },
  { slug: 'executive-collection', label: 'Executive Collection', count: 0, icon: '🎩' },
  { slug: 'chairman-collection',  label: 'Chairman Collection',  count: 0, icon: '🏆' },
  { slug: 'legacy-collection',    label: 'Legacy Collection',    count: 0, icon: '👑' },
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
  ctx.fillText(cat.label.toUpperCase(), W / 2, H - 22);

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
  const [isZoomingOut, setIsZoomingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cards: THREE.Group[];
    fillLight: THREE.PointLight;
    rimLight: THREE.PointLight;
    clock?: never;
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
    }, 200);
  }, []);

  const goTo = useCallback((next: number) => {
    if (!sceneRef.current) return;
    const { cards } = sceneRef.current;
    if (isAnimatingRef.current || next === currentRef.current) return;

    isAnimatingRef.current = true;
    setLabelVisible(false);

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
      // Returning from category page — card rises from flat to upright, fading in
      const HALF_H_R     = 2.0;
      const FALL_ANGLE_R = 0.85;
      const retCard = cards[initialIndex];
      // Start at flat/fallen position at natural scale, initially invisible
      retCard.rotation.x = FALL_ANGLE_R;                                    // positive: bottom was toward camera
      retCard.position.y = -HALF_H_R + HALF_H_R * Math.cos(FALL_ANGLE_R);
      retCard.position.z = HALF_H_R * Math.sin(FALL_ANGLE_R);               // positive: was toward camera
      retCard.scale.setScalar(1);
      const riseMats = retCard.children
        .filter(c => c instanceof THREE.Mesh)
        .map(c => (c as THREE.Mesh).material as THREE.MeshStandardMaterial);
      riseMats.forEach(m => { m.transparent = true; m.opacity = 0; });
      isAnimatingRef.current = true;
      const riseStart = performance.now();
      const RISE_DUR = 750;
      function riseTick(now: number) {
        const raw = Math.min((now - riseStart) / RISE_DUR, 1);
        const t   = easeOutBack(raw);  // slight overshoot gives a satisfying "settle"
        const θ   = FALL_ANGLE_R * (1 - t);
        retCard.rotation.x = θ;
        retCard.position.y = -HALF_H_R + HALF_H_R * Math.cos(θ);
        retCard.position.z = HALF_H_R * Math.sin(θ);
        riseMats.forEach(m => { m.opacity = Math.min(raw / 0.7, 1); }); // fade in over first 70%
        if (raw < 1) {
          requestAnimationFrame(riseTick);
        } else {
          retCard.rotation.x = 0;
          retCard.position.set(0, 0, 0);
          retCard.scale.setScalar(1);
          riseMats.forEach(m => { m.opacity = 1; m.transparent = false; });
          isAnimatingRef.current = false;
          showLabel(initialIndex);
        }
      }
      requestAnimationFrame(riseTick);
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

    const loopStart = performance.now();
    let mouseX = 0, mouseY = 0;

    /* ── Animation loop ── */
    renderer.setAnimationLoop(() => {
      const t = (performance.now() - loopStart) / 1000;
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

    sceneRef.current = { renderer, scene, camera, cards, fillLight, rimLight };

    /* Show label after intro (normal entry only; return entry calls showLabel at zoom-out end) */
    if (!returnSlug) setTimeout(() => showLabel(initialIndex), 600);

    /* ── Mouse move ── */
    function onMouseMove(e: MouseEvent) {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }

    /* ── Mouse swipe (desktop drag) ── */
    let mx = 0, my = 0;
    function onMouseDown(e: MouseEvent) { mx = e.clientX; my = e.clientY; isDragRef.current = false; }
    function onMouseUp(e: MouseEvent) {
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        isDragRef.current = true;
        if (dx < 0) goTo((currentRef.current + 1) % CATS.length);
        else        goTo((currentRef.current - 1 + CATS.length) % CATS.length);
      }
    }

    /* ── Touch ── */
    let tx = 0, ty = 0;
    function onTouchStart(e: TouchEvent) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 50) {
        if (dx < 0) goTo((currentRef.current + 1) % CATS.length);
        else        goTo((currentRef.current - 1 + CATS.length) % CATS.length);
      } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        zoomNavigateRef.current(CATS[currentRef.current].slug);
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
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
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

  /* Card fall → navigate to category */
  /*
   * Card fall-flat animation:
   * The active card pivots around its BOTTOM EDGE (y = -HALF_H).
   * As rotation.x → FALL_ANGLE (~49°) the card tips backward away from the camera,
   * and its material opacity fades to 0 so it dissolves into the floor.
   */
  const HALF_H     = 2.0;   // half of card height (4.0 units tall)
  const FALL_ANGLE = 0.85;  // radians ≈ 49° – card tips backward away from camera

  function handleZoomNavigate(targetSlug: string) {
    if (!sceneRef.current || isZoomingOut) return;
    const { cards } = sceneRef.current;

    setIsZoomingOut(true);
    setLabelVisible(false);
    isAnimatingRef.current = true;

    const activeCard = cards[currentRef.current];
    const sideStartY = cards.map(c => c.position.y);
    const FALL_DUR   = 650;
    const fallStart  = performance.now();

    function fallTick(now: number) {
      const raw = Math.min((now - fallStart) / FALL_DUR, 1);
      const t   = easeInQuart(raw);
      const θ   = FALL_ANGLE * t;

      // Pivot around bottom edge: bottom tips TOWARD camera (falls forward, becomes floor)
      activeCard.rotation.x = θ;
      activeCard.position.y = -HALF_H + HALF_H * Math.cos(θ);
      activeCard.position.z = HALF_H * Math.sin(θ);            // positive = moves toward camera

      // Side cards fall away and vanish
      if (raw > 0.05) {
        const sideT = Math.min((raw - 0.05) / 0.95, 1);
        const st = easeInQuart(sideT);
        cards.forEach((card, i) => {
          if (i !== currentRef.current) {
            card.position.y = sideStartY[i] - 14 * st;
            card.scale.setScalar(Math.max(0.01, 0.82 - st * 0.82));
          }
        });
      }

      if (raw < 1) {
        requestAnimationFrame(fallTick);
      } else {
        navigate(`/category/${targetSlug}`, { state: { dealIn: true } });
      }
    }
    requestAnimationFrame(fallTick);
  }

  const zoomNavigateRef = useRef(handleZoomNavigate);
  zoomNavigateRef.current = handleZoomNavigate;
  const isDragRef = useRef(false);

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

      {/* Canvas container — clicking the active card navigates to its category */}
      <div
        ref={containerRef}
        style={{ position: 'fixed', inset: 0 }}
        onClick={(e) => {
          if (isDragRef.current) { isDragRef.current = false; return; }
          if (!sceneRef.current || isAnimatingRef.current || isZoomingOut) return;
          const { camera, cards } = sceneRef.current;
          const x = (e.clientX / window.innerWidth) * 2 - 1;
          const y = -(e.clientY / window.innerHeight) * 2 + 1;
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
          const activeCard = cards[currentRef.current];
          if (raycaster.intersectObject(activeCard, true).length > 0) {
            handleZoomNavigate(CATS[currentRef.current].slug);
          }
        }}
      />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '1.25rem 2.5rem',
        background: 'linear-gradient(to bottom, rgba(13,4,20,0.92) 0%, transparent 100%)',
      }}>
        {/* Left slot — hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          style={{ background: 'none', border: 'none', color: '#faf5ff', cursor: 'pointer', padding: '0.4rem', justifySelf: 'start', display: 'flex', flexDirection: 'column', gap: '4px' }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'transform 220ms, opacity 220ms', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'opacity 220ms', opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: 'block', width: 22, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'transform 220ms', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
        </button>
        {/* Center — logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <img src={logoSrc} alt="Arvi logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.5rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #e9d5ff, #fde68a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Arvi
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
          position: 'fixed', top: '50%', left: 'max(0.75rem, calc(50% - 350px))',
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
          position: 'fixed', top: '50%', right: 'max(0.75rem, calc(50% - 350px))',
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



      {/* ── Menu backdrop ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.45)' }} />
      )}

      {/* ── Filter / Browse panel ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100dvh', width: 290,
        background: 'rgba(10,3,18,0.97)', backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(168,85,247,0.2)',
        zIndex: 100,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 320ms cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        padding: '1.5rem', overflowY: 'auto',
        fontFamily: "'DM Sans', system-ui, sans-serif", color: '#faf5ff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Browse</span>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#faf5ff', cursor: 'pointer', opacity: 0.6, padding: '0.25rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f0b429', marginBottom: '0.6rem' }}>Collections</div>
        {CATS.map(cat => (
          <button
            key={cat.slug}
            onClick={() => { navigate(`/category/${cat.slug}`); setMenuOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: CATS[current]?.slug === cat.slug ? 'rgba(168,85,247,0.2)' : 'transparent',
              border: 'none', color: '#faf5ff',
              padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
              cursor: 'pointer', width: '100%', textAlign: 'left',
              fontSize: '0.88rem', fontWeight: CATS[current]?.slug === cat.slug ? 600 : 400,
              marginBottom: '0.15rem', transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (CATS[current]?.slug !== cat.slug) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.1)'; }}
            onMouseLeave={e => { if (CATS[current]?.slug !== cat.slug) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f0b429', marginBottom: '0.6rem' }}>Price Range</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'rgba(250,245,255,0.65)', marginBottom: '0.75rem' }}>
            <span>₹{priceRange[0].toLocaleString()}</span>
            <span>₹{priceRange[1].toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(250,245,255,0.45)', marginBottom: '0.3rem' }}>Min</div>
              <input type="range" min={0} max={10000} step={100} value={priceRange[0]}
                onChange={e => setPriceRange([Math.min(+e.target.value, priceRange[1] - 100), priceRange[1]])}
                style={{ accentColor: '#a855f7', width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(250,245,255,0.45)', marginBottom: '0.3rem' }}>Max</div>
              <input type="range" min={0} max={10000} step={100} value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Math.max(+e.target.value, priceRange[0] + 100)])}
                style={{ accentColor: '#a855f7', width: '100%' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Orb keyframes injected via style tag */}
      <style>{`
        @keyframes hpDrift1 { from { transform: translate(0,0); } to { transform: translate(50px,40px); } }
        @keyframes hpDrift2 { from { transform: translate(0,0); } to { transform: translate(-40px,-30px); } }
      `}</style>
    </div>
  );
}
