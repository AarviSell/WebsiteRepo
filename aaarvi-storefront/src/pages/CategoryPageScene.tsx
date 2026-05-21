// src/pages/CategoryPageScene.tsx — Three.js cube-grid category scene
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { loadCategoryProducts } from '@/data/loader';
import { getPrimaryImage, resolveImageUrl } from '@/utils/image';
import type { Product } from '@/types/product';
import logoSrc from '@/assets/logo.png';

/* ── Constants ─────────────────────────────────────────────── */
const BG        = 0x0d0414;
const TABLE_W   = 5;
const TABLE_H   = 3;
const CUBE_SIZE = 2.15;
const SPACING   = 2.9;
const FLOOR_GRID  = 40;  // 40×40 = 1 600 tiles – fog hides anything beyond ~30 units
const FLOOR_COUNT = FLOOR_GRID * FLOOR_GRID;
const PAGE_SIZE   = TABLE_W * TABLE_H; // 15

/**
 * BoxGeometry face order: [+X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)]
 * Camera is at +Z. With Y-rotation (RIGHT button = +PI/2 each click):
 *   page 0  rotation.y = 0      → +Z face (4) faces camera
 *   page 1  rotation.y = +π/2   → -X face (1) faces camera
 *   page 2  rotation.y = +π     → -Z face (5) faces camera
 *   page 3  rotation.y = +3π/2  → +X face (0) faces camera
 */
const PAGE_FACE_IDX = [4, 1, 5, 0] as const;
const MAX_PAGES = PAGE_FACE_IDX.length; // 4 → up to 60 products

/* ── Easing ─────────────────────────────────────────────────── */
function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInQuart(t: number) { return t * t * t * t; }

/* ── Scene ref type ─────────────────────────────────────────── */
interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  floorMesh: THREE.InstancedMesh;
  floorData: Array<{ x: number; z: number; speed: number; offset: number; amplitude: number }>;
  cubes: THREE.Mesh[];
  entryDone: { value: boolean };
  isRotating: { value: boolean };
  isExiting: { value: boolean };
  exitStart: { value: number };
}

/* ── Gold material factory ──────────────────────────────────── */
function goldMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xffd54a,
    metalness: 0.95,
    roughness: 0.18,
    emissive: new THREE.Color(0x140900),
    emissiveIntensity: 0.02,
  });
}

/* Product face uses MeshBasicMaterial so it is completely unaffected by scene lights */
function productMat(tex: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map: tex });
}

/* ── Collection catalogue ───────────────────────────────────────── */
const CATS = [
  { slug: 'standard-collection',  label: 'Standard Collection',  icon: '📦' },
  { slug: 'business-collection',  label: 'Business Collection',  icon: '💼' },
  { slug: 'signature-collection', label: 'Signature Collection', icon: '✒️' },
  { slug: 'preferred-collection', label: 'Preferred Collection', icon: '⭐' },
  { slug: 'premium-collection',   label: 'Premium Collection',   icon: '💎' },
  { slug: 'executive-collection', label: 'Executive Collection', icon: '🎩' },
  { slug: 'chairman-collection',  label: 'Chairman Collection',  icon: '🏆' },
  { slug: 'legacy-collection',    label: 'Legacy Collection',    icon: '👑' },
];

/* ═══════════════════════════════════════════════════════════ */
export function CategoryPageScene() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();

  const wrapperRef     = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const sceneRef       = useRef<SceneState | null>(null);
  const productsRef    = useRef<Product[]>([]);
  const pageRef        = useRef(0);
  const texCache       = useRef(new Map<string, THREE.Texture>());
  const isAnimatingRef = useRef(false);
  /** Records clientX at last pointerdown so click handler can reject drag events */
  const mouseDragStartX = useRef(-1);

  const [products,  setProducts]  = useState<Product[]>([]);
  const [page,      setPage]      = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [catLabel,  setCatLabel]  = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);

  /* ── Load products ────────────────────────────────────────── */
  useEffect(() => {
    if (!slug) return;
    loadCategoryProducts(slug).then(p => {
      productsRef.current = p;
      setProducts(p);
      if (p.length > 0) setCatLabel(p[0].category_label ?? slug.replace(/-/g, ' '));
    });
  }, [slug]);

  /* ── Build Three.js scene ─────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* Renderer — alpha:true so the CSS gradient wrapper shows through the sky */
    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.0 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping      = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled   = false;
    container.appendChild(renderer.domElement);

    /* Scene */
    const scene = new THREE.Scene();
    // No scene.background — transparent canvas lets the CSS gradient show in the sky
    scene.fog = new THREE.FogExp2(BG, 0.028);

    /* Camera — matches provided HTML */
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5.5, 12);

    /* Lighting */
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const floorLight = new THREE.DirectionalLight(0xffd977, 1.0);
    floorLight.position.set(0, 8, -15);
    scene.add(floorLight);
    /* Single warm point light above the table – replaces the 15 per-cube lights */
    const tableLight = new THREE.PointLight(0xffd977, 4.0, 40);
    tableLight.position.set(0, 14, 5);
    scene.add(tableLight);

    /* ── Floor grid (70×70 instanced cubes) ── */
    const floorGeo = new THREE.BoxGeometry(1, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffd54a,
      metalness: 0.95,
      roughness: 0.20,
      emissive: new THREE.Color(0x2a1600),
      emissiveIntensity: 0.02,
    });
    const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, FLOOR_COUNT);
    scene.add(floorMesh);

    const floorData: SceneState['floorData'] = [];
    const floorDummy = new THREE.Object3D();
    let fi = 0;
    for (let x = -FLOOR_GRID / 2; x < FLOOR_GRID / 2; x++) {
      for (let z = -FLOOR_GRID / 2; z < FLOOR_GRID / 2; z++) {
        floorData.push({
          x, z,
          speed:     0.35 + Math.random() * 0.2,
          offset:    Math.random() * Math.PI * 2,
          amplitude: 0.08 + Math.random() * 0.06,
        });
        floorDummy.position.set(x, 0.5, z);
        floorDummy.scale.set(1, 1, 1);
        floorDummy.updateMatrix();
        floorMesh.setMatrixAt(fi++, floorDummy.matrix);
      }
    }

    /* ── Product table (5×3 cubes) ── */
    const cubeGeo   = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    const cubes: THREE.Mesh[] = [];

    let cubeIdx = 0;
    for (let x = 0; x < TABLE_W; x++) {
      for (let y = 0; y < TABLE_H; y++) {
        const mats = Array.from({ length: 6 }, goldMat);
        const mesh  = new THREE.Mesh(cubeGeo, mats);

        const posX = (x - 2) * SPACING;
        const posY = (1 - y) * SPACING + 5.2;

        // Start below floor; entry animation will raise them
        mesh.position.set(posX, -10, 0);
        mesh.userData = {
          baseY:       posY,
          targetRotX:  0,
          targetRotY:  0,
          floatOffset: Math.random() * Math.PI * 2,
          cubeIdx,
        };

        cubeGroup.add(mesh);
        cubes.push(mesh);
        cubeIdx++;
      }
    }

    /* ── Shared mutable flags passed by reference ── */
    const entryDone  = { value: false };
    const isRotating = { value: false };
    const isExiting  = { value: false };
    const exitStart  = { value: 0 };

    /* ── Animation loop ── */
    const ENTRY_DELAY   = 300;  // ms before first cube rises
    const ENTRY_STAGGER = 55;   // ms between each cube
    const ENTRY_DUR     = 700;  // ms per cube rise animation
    const startMs       = performance.now();
    let   frameCounter  = 0;
    let   lastFrameMs   = performance.now();

    renderer.setAnimationLoop(() => {
      const now  = performance.now();
      const time = (now - startMs) / 1000;
      const dt   = Math.min((now - lastFrameMs) / 1000, 0.05); // delta-time, capped at 50 ms
      lastFrameMs = now;
      frameCounter++;

      /* Floor wave – updated every 2nd frame to halve instanced-matrix upload cost */
      if (frameCounter % 2 === 0) {
        for (let i = 0; i < FLOOR_COUNT; i++) {
          const d      = floorData[i];
          const wave   = Math.sin(d.x * 0.12 + d.z * 0.12 + time * d.speed + d.offset);
          const height = 1 + wave * d.amplitude;
          floorDummy.position.set(d.x, height * 0.5, d.z);
          floorDummy.scale.set(1, height, 1);
          floorDummy.updateMatrix();
          floorMesh.setMatrixAt(i, floorDummy.matrix);
        }
        floorMesh.instanceMatrix.needsUpdate = true;
      }

      /* Entry animation: cubes fly up with stagger */
      if (!entryDone.value) {
        let allDone = true;
        cubes.forEach((cube, i) => {
          const cubeStart = startMs + ENTRY_DELAY + i * ENTRY_STAGGER;
          const elapsed   = now - cubeStart;
          if (elapsed <= 0) { allDone = false; return; }
          const raw = Math.min(elapsed / ENTRY_DUR, 1);
          const t   = easeOutBack(raw);
          cube.position.y = -10 + (cube.userData.baseY + 10) * t;
          if (raw < 1) allDone = false;
        });
        if (allDone) entryDone.value = true;
      }

      /* Cube animations: dt-based rotation lerp (frame-rate independent) + float */
      const rotLerp = Math.min(1, 10 * dt); // ~0.17 at 60 fps, consistent at any fps
      cubes.forEach(cube => {
        cube.rotation.x += (cube.userData.targetRotX - cube.rotation.x) * rotLerp;
        cube.rotation.y += (cube.userData.targetRotY - cube.rotation.y) * rotLerp;
        if (entryDone.value && !isExiting.value) {
          cube.position.y = cube.userData.baseY
            + Math.sin(time * 0.5 + cube.userData.floatOffset) * 0.12;
        }
      });

      /* Exit animation: cubes drop below floor */
      if (isExiting.value) {
        const exitElapsed = now - exitStart.value;
        const exitRaw = Math.min(exitElapsed / 520, 1);
        const exitT   = easeInQuart(exitRaw);
        cubes.forEach(cube => {
          cube.position.y = cube.userData.baseY - (cube.userData.baseY + 14) * exitT;
        });
      }

      renderer.render(scene, camera);
    });

    sceneRef.current = { renderer, scene, camera, floorMesh, floorData, cubes, entryDone, isRotating, isExiting, exitStart };
    setSceneReady(true);

    /* Resize */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      window.removeEventListener('resize', onResize);
      texCache.current.forEach(t => t.dispose());
      texCache.current.clear();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load textures for a page ─────────────────────────────── */
  const loadPageTextures = useCallback((pageIdx: number) => {
    const state = sceneRef.current;
    const prods = productsRef.current;
    if (!state || prods.length === 0) return;

    const faceIdx = PAGE_FACE_IDX[pageIdx];
    const loader  = new THREE.TextureLoader();

    // First pass: reset ALL non-current page faces back to plain gold on every cube
    state.cubes.forEach(cube => {
      const mats = (cube.material as THREE.Material[]).slice();
      PAGE_FACE_IDX.forEach((fi, pi) => {
        if (pi === pageIdx) return; // leave current face alone for now
        (mats[fi] as THREE.Material).dispose();
        mats[fi] = goldMat();
      });
      cube.material = mats;
    });

    // Second pass: apply product image ONLY to the face that now faces the camera
    state.cubes.forEach((cube, i) => {
      const prodIdx = pageIdx * PAGE_SIZE + i;
      if (prodIdx >= prods.length) return;

      const img = getPrimaryImage(prods[prodIdx]);
      if (!img) return;
      const url = resolveImageUrl(img.local_path);

      const apply = (tex: THREE.Texture) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const mats = (cube.material as THREE.Material[]).slice();
        mats[faceIdx] = productMat(tex);
        cube.material = mats;
      };

      if (texCache.current.has(url)) {
        apply(texCache.current.get(url)!);
        return;
      }
      loader.load(url, tex => {
        texCache.current.set(url, tex);
        apply(tex);
      });
    });
  }, []);

  /* ── Fade the scene in on mount ── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.transition = 'opacity 300ms ease';
    requestAnimationFrame(() => { if (el) el.style.opacity = '1'; });
  }, []);

  /* ── Trigger texture load once both scene + products are ready ── */
  useEffect(() => {
    if (sceneReady && products.length > 0) {
      loadPageTextures(0);
    }
  }, [sceneReady, products, loadPageTextures]);

  /* ── Computed values ─────────────────────────────────────────── */
  const maxPages = Math.min(MAX_PAGES, Math.ceil(products.length / PAGE_SIZE));

  /* ── Cube rotation helpers ────────────────────────────────── */
  function rotateCubes(yAmount: number) {
    const state = sceneRef.current;
    if (!state || state.isRotating.value) return;
    state.isRotating.value = true;
    state.cubes.forEach(cube => { cube.userData.targetRotY += yAmount; });
    // Unlock after animation settles (~700ms)
    setTimeout(() => { if (sceneRef.current) sceneRef.current.isRotating.value = false; }, 720);
  }

  /* Stable refs so touch handler inside useEffect can call these */
  const goNextRef = useRef<() => void>(() => {});
  const goPrevRef = useRef<() => void>(() => {});

  const goNext = useCallback(() => {
    const next = pageRef.current + 1;
    if (next >= maxPages) return;
    pageRef.current = next;
    setPage(next);
    loadPageTextures(next);
    rotateCubes(Math.PI / 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPages, loadPageTextures]);

  const goPrev = useCallback(() => {
    const prev = pageRef.current - 1;
    if (prev < 0) return;
    pageRef.current = prev;
    setPage(prev);
    rotateCubes(-Math.PI / 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { goNextRef.current = goNext; }, [goNext]);
  useEffect(() => { goPrevRef.current = goPrev; }, [goPrev]);

  /* Touch swipe — 4-directional */
  useEffect(() => {
    let tx = 0, ty = 0;
    function onTouchStart(e: TouchEvent) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical dominant: up = next, down = prev
        if (dy < 0) goNextRef.current();
        else        goPrevRef.current();
      } else {
        // Horizontal dominant: left = next, right = prev
        if (dx < 0) goNextRef.current();
        else        goPrevRef.current();
      }
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd);
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  /* PC mouse-drag swipe — 4-directional */
  useEffect(() => {
    let mx = 0, my = 0;
    function onMouseDown(e: MouseEvent) { mx = e.clientX; my = e.clientY; }
    function onMouseUp(e: MouseEvent) {
      if ((e.target as Element).tagName === 'BUTTON') return;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Vertical dominant: up = next, down = prev
        if (dy < 0) goNextRef.current();
        else        goPrevRef.current();
      } else {
        // Horizontal dominant: left = next, right = prev
        if (dx < 0) goNextRef.current();
        else        goPrevRef.current();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup',   onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  /* Keyboard */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNextRef.current();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goPrevRef.current();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ── Canvas click → product navigation ───────────────────── */
  function handleCanvasClick(e: React.MouseEvent) {
    const state = sceneRef.current;
    if (!state || isAnimatingRef.current) return;
    // Ignore header/button area (top 90px)
    if (e.clientY < 90) return;    // Reject if this was actually a drag (pointer moved more than 10 px since mousedown)
    if (Math.abs(e.clientX - mouseDragStartX.current) > 10) return;
    const nx = (e.clientX / window.innerWidth)  *  2 - 1;
    const ny = (e.clientY / window.innerHeight) * -2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), state.camera);
    const hits = raycaster.intersectObjects(state.cubes);
    if (hits.length === 0) return;

    const cubeI    = (hits[0].object as THREE.Mesh).userData.cubeIdx as number;
    const prodIdx  = pageRef.current * PAGE_SIZE + cubeI;
    if (prodIdx < productsRef.current.length) {
      const product = productsRef.current[prodIdx];
      navigate(`/product/${product.id}`, { state: { fromCategory: slug } });
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */
  const displayLabel = catLabel || (slug ?? '').replace(/-/g, ' ');

  return (
    <div ref={wrapperRef} style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at top left, rgba(168,85,247,0.18), transparent 26%), radial-gradient(circle at bottom right, rgba(240,180,41,0.14), transparent 28%), linear-gradient(180deg, #0d0414, #16081f 42%, #0f0518)',
      overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", opacity: 0 }}>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{ position: 'fixed', inset: 0, cursor: 'pointer' }}
        onMouseDown={(e) => { mouseDragStartX.current = e.clientX; }}
        onClick={handleCanvasClick}
      />

      {/* ── Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'linear-gradient(to bottom, rgba(13,4,20,0.96) 0%, transparent 100%)',
        gap: '1rem',
      }}>
        {/* Left — hamburger + back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifySelf: 'start' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{ background: 'none', border: 'none', color: '#faf5ff', cursor: 'pointer', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}
          >
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'transform 220ms, opacity 220ms', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'opacity 220ms', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(250,245,255,0.85)', borderRadius: 1, transition: 'transform 220ms', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
          </button>
          <button
            onClick={() => {
              if (sceneRef.current && !sceneRef.current.isExiting.value) {
                sceneRef.current.isExiting.value = true;
                sceneRef.current.exitStart.value = performance.now();
                const el = wrapperRef.current;
                if (el) { el.style.transition = 'opacity 350ms ease'; el.style.opacity = '0'; }
                setTimeout(() => navigate('/', { state: { returnTo: slug } }), 380);
              } else {
                navigate('/', { state: { returnTo: slug } });
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(168,85,247,0.35)',
              borderRadius: '999px', padding: '0.45rem 1rem',
              color: '#faf5ff', cursor: 'pointer',
              fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.02em',
              transition: 'background 180ms, border-color 180ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </button>
        </div>

        {/* Centre — logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <img src={logoSrc} alt="Arvi logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #e9d5ff, #fde68a)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1,
          }}>Arvi</span>
        </div>

        {/* Right — collection name */}
        <div style={{ justifySelf: 'end', textAlign: 'right' }}>
          <div style={{
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#f0b429', marginBottom: '0.15rem',
          }}>Collection</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', fontWeight: 600,
            color: '#faf5ff', lineHeight: 1.1,
          }}>{displayLabel}</div>
        </div>
      </header>

      {/* ── Prev / Next arrows (always visible) ── */}
      <button
        onClick={page > 0 ? goPrev : undefined}
        aria-label="Previous page"
        style={{
          position: 'fixed', top: '50%', left: '1.25rem',
          transform: 'translateY(-50%)', zIndex: 15,
          width: 50, height: 50, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.6)', backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: page > 0 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms, opacity 200ms',
          opacity: page > 0 ? 1 : 0.3,
        }}
        onMouseEnter={e => { if (page > 0) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#a855f7'; b.style.background = 'rgba(124,58,237,0.4)'; }}}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(168,85,247,0.4)'; b.style.background = 'rgba(42,16,64,0.6)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={page < maxPages - 1 ? goNext : undefined}
        aria-label="Next page"
        style={{
          position: 'fixed', top: '50%', right: '1.25rem',
          transform: 'translateY(-50%)', zIndex: 15,
          width: 50, height: 50, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.6)', backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: page < maxPages - 1 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms, opacity 200ms',
          opacity: page < maxPages - 1 ? 1 : 0.3,
        }}
        onMouseEnter={e => { if (page < maxPages - 1) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#a855f7'; b.style.background = 'rgba(124,58,237,0.4)'; }}}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(168,85,247,0.4)'; b.style.background = 'rgba(42,16,64,0.6)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Page dots ── */}
      {maxPages > 1 && (
        <div style={{
          position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.5rem', zIndex: 15,
        }}>
          {Array.from({ length: maxPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === pageRef.current) return;
                const direction = i > pageRef.current ? 1 : -1;
                // Step one page at a time toward target
                const steps = Math.abs(i - pageRef.current);
                let step = 0;
                function doStep() {
                  if (step >= steps) return;
                  if (direction > 0) goNextRef.current();
                  else goPrevRef.current();
                  step++;
                  if (step < steps) setTimeout(doStep, 750);
                }
                doStep();
              }}
              aria-label={`Page ${i + 1}`}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none',
                padding: 0, cursor: 'pointer',
                background: i === page ? '#a855f7' : 'rgba(168,85,247,0.3)',
                transform: i === page ? 'scale(1.45)' : 'scale(1)',
                transition: 'background 300ms, transform 300ms',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Bottom hint ── */}
      <div style={{
        position: 'fixed',
        bottom: maxPages > 1 ? '4.5rem' : '1.5rem',
        left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(250,245,255,0.85)', fontSize: '0.72rem',
        letterSpacing: '0.08em', zIndex: 15, whiteSpace: 'nowrap',
        pointerEvents: 'none',
        background: 'rgba(13,4,20,0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: '999px',
        padding: '0.35rem 1rem',
        border: '1px solid rgba(168,85,247,0.25)',
      }}>
        {products.length === 0
          ? 'Loading products…'
          : 'Tap a cube to view · swipe or use arrows to browse pages'}
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
            onClick={() => {
              setMenuOpen(false);
              if (cat.slug === slug) return;
              const el = wrapperRef.current;
              if (el) { el.style.transition = 'opacity 300ms ease'; el.style.opacity = '0'; }
              setTimeout(() => navigate(`/category/${cat.slug}`), 320);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: slug === cat.slug ? 'rgba(168,85,247,0.22)' : 'transparent',
              border: 'none', color: '#faf5ff',
              padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
              cursor: 'pointer', width: '100%', textAlign: 'left',
              fontSize: '0.88rem', fontWeight: slug === cat.slug ? 600 : 400,
              marginBottom: '0.15rem', transition: 'background 150ms',
            }}
            onMouseEnter={e => { if (slug !== cat.slug) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.1)'; }}
            onMouseLeave={e => { if (slug !== cat.slug) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
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

    </div>
  );
}
