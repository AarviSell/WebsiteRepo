// src/pages/CategoryPageScene.tsx — Three.js cube-grid category scene
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Search, X } from 'lucide-react';
import { loadCategoryProducts, loadCategories } from '@/data/loader';
import { useProductData } from '@/hooks/useProductData';
import { SceneSearchBar } from '@/components/search/SceneSearchBar';
import { getPrimaryImage, resolveImageUrl } from '@/utils/image';
import { getCataloguePageSource, getProductCode } from '@/utils/catalogue';
import { makeCataloguePageTexture } from '@/utils/threeCatalogueTexture';
import { searchProductsByName } from '@/utils/productSearch';
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
const PRODUCT_FOCUS_RETURN_DUR = 860;
const SEARCH_DROP_DUR = 560;

function getPageRotationY(pageIdx: number) {
  return pageIdx * (Math.PI / 2);
}

/* ── Easing ─────────────────────────────────────────────────── */
function easeOutBack(t: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInQuart(t: number) { return t * t * t * t; }

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(value: number) { return Math.max(0, Math.min(1, value)); }

function getFocusTargetScale(faceIdx: number) {
  return faceIdx === 0 || faceIdx === 1
    ? new THREE.Vector3(0.28, 1.55, 2.55)
    : new THREE.Vector3(2.55, 1.55, 0.28);
}

interface ProductFocusState {
  active: boolean;
  returning: boolean;
  selectedIdx: number;
  startMs: number;
  returnStartMs: number;
  startCamera: THREE.Vector3;
  targetCamera: THREE.Vector3;
  returnStartCamera: THREE.Vector3;
  returnTargetCamera: THREE.Vector3;
  startPosition: THREE.Vector3;
  targetPosition: THREE.Vector3;
  startScale: THREE.Vector3;
  targetScale: THREE.Vector3;
  startRotation: THREE.Euler;
  targetRotationY: number;
}

/* ── Scene ref type ─────────────────────────────────────────── */
interface SceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  floorMesh: THREE.InstancedMesh;
  floorData: Array<{ x: number; z: number; speed: number; offset: number; amplitude: number }>;
  cubes: THREE.Mesh[];
  labels: THREE.Sprite[];
  entryDone: { value: boolean };
  isRotating: { value: boolean };
  isExiting: { value: boolean };
  exitStart: { value: number };
  searchDrop: { active: boolean; startMs: number };
  productFocus: ProductFocusState;
}

interface CategoryRouteState {
  focusProductId?: string;
  searchQuery?: string;
  searchProductId?: string;
  searchOrigin?: 'home' | 'category';
  returnCategorySlug?: string;
  reopenSearch?: boolean;
  searchGlobal?: boolean;
}

interface SearchReturnTarget {
  origin: 'home' | 'category';
  query: string;
  categorySlug?: string;
}

/* ── Label sprite factory: golden plaque with black text ───── */
/* Label sits just above the cube. Width derives from the horizontal cube
   spacing so the plaque always fits the column above its block and squeezes
   automatically if cubes move closer together. The background canvas itself
   does NOT redraw on resize — only the sprite's X scale tracks spacing. */
const LABEL_OFFSET_Y     = CUBE_SIZE / 2 + 0.18;
const LABEL_OFFSET_Z     = CUBE_SIZE / 2 + 0.05; // sit just in front of front face
const LABEL_MAX_WIDTH    = CUBE_SIZE;        // upper bound = cube footprint
const LABEL_HEIGHT       = 0.32;             // fixed visual height
const LABEL_CANVAS_W     = 512;
const LABEL_CANVAS_H     = Math.round(LABEL_CANVAS_W * (LABEL_HEIGHT / LABEL_MAX_WIDTH));
const LABEL_PADDING_PX   = 30;

/** Truncate `text` with an ellipsis so it fits within `maxWidth` pixels under
 *  the current ctx.font. Returns the original string if it already fits. */
function fitTextWithEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ell = '…';
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid).trimEnd() + ell).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + ell;
}

/** Heuristically shorten a long product name into a compact label suitable
 *  for the cube plaque. Keeps the head noun phrase and drops trailing
 *  descriptors (colors, dimensions, sub-component lists). The canvas itself
 *  applies an ellipsis if the result is still too wide. */
function shortenProductName(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();
  // 1. Drop everything after an em/en dash, colon, or vertical bar — these
  //    introduce descriptors ("— Black, Gunmetal, Rose Gold", ": 375Ml").
  s = s.split(/\s+[—–|:]\s+/)[0];
  // 2. Drop " - " sub-descriptors (ASCII hyphen surrounded by spaces).
  s = s.split(/\s+-\s+/)[0];
  // 3. Drop "with …" and "for …" tails that describe accessories.
  //    Keep "in" phrases so names like "4 in 1 Pen" stay meaningful.
  s = s.replace(/\s+(?:with|for)\s+.*$/i, '');
  // 4. Drop trailing parentheticals like "(Set of 2)".
  s = s.replace(/\s*\([^)]*\)\s*$/, '');
  // 5. Collapse whitespace and an awkward trailing "&".
  s = s.replace(/\s+&\s*$/, '').replace(/\s+/g, ' ').trim();
  return s || raw.trim();
}

/** Redraw a label canvas with the given text (or leave it blank for empty). */
function drawLabelCanvas(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Golden background with subtle vertical gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#ffe27a');
  grad.addColorStop(0.5, '#ffd54a');
  grad.addColorStop(1, '#c9962a');
  ctx.fillStyle = grad;
  // Rounded rect
  const r = Math.min(20, canvas.height / 2);
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Dark gold border
  ctx.strokeStyle = '#5a3d05';
  ctx.lineWidth   = 4;
  ctx.stroke();

  if (!text) return;

  // Black text — truncate with ellipsis if it overflows
  ctx.fillStyle = '#0a0a0a';
  const fontPx = Math.floor(canvas.height * 0.6);
  ctx.font = `bold ${fontPx}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const display = fitTextWithEllipsis(ctx, text, canvas.width - LABEL_PADDING_PX * 2);
  ctx.fillText(display, canvas.width / 2, canvas.height / 2 + 2);
}

function makeLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width  = LABEL_CANVAS_W;
  canvas.height = LABEL_CANVAS_H;
  drawLabelCanvas(canvas, text);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  // Initial scale uses max width; the animation loop may shrink X to fit spacing.
  sprite.scale.set(LABEL_MAX_WIDTH, LABEL_HEIGHT, 1);
  // Stash canvas + texture so we can repaint when the page changes.
  sprite.userData.canvas  = canvas;
  sprite.userData.texture = tex;
  return sprite;
}

/** Update an existing label sprite's text in place (no new GPU allocation). */
function setLabelSpriteText(sprite: THREE.Sprite, text: string): void {
  const canvas = sprite.userData.canvas as HTMLCanvasElement | undefined;
  const tex    = sprite.userData.texture as THREE.CanvasTexture | undefined;
  if (!canvas || !tex) return;
  drawLabelCanvas(canvas, text);
  tex.needsUpdate = true;
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

/* Parallax: amplitude of UV drift per axis. Must be <= (1 - PARALLAX_REPEAT) / 2
   so the texture never samples past the cropped image edge. */
const PARALLAX_REPEAT    = 0.92;
const PARALLAX_AMPLITUDE = (1 - PARALLAX_REPEAT) / 2;  // 0.04

interface ParallaxEntry {
  tex: THREE.Texture;
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
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

function formatWhatsAppNumber(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/(\+\d{1,3})(\d{5})(\d+)/, '$1 $2 $3');
}

function buildWhatsAppHref(number: string, productName: string, productCode?: string): string {
  const digits = number.replace(/[^\d]/g, '');
  const codeText = productCode ? ` (code ${productCode})` : '';
  const message = `Hi AArvi, I am interested in ${productName}${codeText}. Please share pricing and availability.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function makeCaptchaChallenge(seed: string) {
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  const leftOperand = 2 + (hash % 7);
  const rightOperand = 3 + (Math.floor(hash / 7) % 6);
  return { leftOperand, rightOperand, total: leftOperand + rightOperand };
}

function CubeContactReveal({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const challenge = useMemo(() => makeCaptchaChallenge(product.id), [product.id]);
  const productCode = getProductCode(product);
  const whatsappNumber = (import.meta.env.VITE_AARVI_WHATSAPP_NUMBER ?? '').trim();
  const formattedNumber = formatWhatsAppNumber(whatsappNumber);
  const whatsappHref = whatsappNumber ? buildWhatsAppHref(whatsappNumber, product.name, productCode) : '';

  function verifyAnswer(event: React.FormEvent) {
    event.preventDefault();
    if (Number(answer.trim()) === challenge.total) {
      setVerified(true);
      setError('');
      return;
    }
    setError('Try again');
  }

  const shellStyle: React.CSSProperties = {
    border: '1px solid rgba(250,245,255,0.2)',
    background: 'rgba(17,7,24,0.82)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.32)',
    backdropFilter: 'blur(18px)',
    color: '#faf5ff',
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          ...shellStyle,
          minHeight: 44,
          borderRadius: 999,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: '0.72rem 1.1rem',
          fontSize: '0.9rem',
          fontWeight: 700,
        }}
      >
        Contact us for purchase
      </button>
    );
  }

  return (
    <div style={{ ...shellStyle, width: '100%', borderRadius: '0.75rem', padding: '0.72rem' }}>
      {verified ? (
        <div role="status" aria-live="polite" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '0.35rem', color: '#8ddf6b', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}>
          {formattedNumber ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" style={{ color: '#8ddf6b', textDecoration: 'none', minHeight: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {formattedNumber}
            </a>
          ) : (
            <span>WhatsApp number not configured</span>
          )}
        </div>
      ) : (
        <form onSubmit={verifyAnswer} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(4rem, 1fr) auto', gap: '0.5rem', alignItems: 'center' }}>
          <label htmlFor="cube-whatsapp-captcha" style={{ color: '#fde68a', fontSize: '0.82rem', fontWeight: 700 }}>{challenge.leftOperand} + {challenge.rightOperand}</label>
          <input
            id="cube-whatsapp-captcha"
            inputMode="numeric"
            value={answer}
            onChange={event => setAnswer(event.target.value)}
            autoComplete="off"
            style={{ width: '100%', minHeight: 38, borderRadius: '0.45rem', border: '1px solid rgba(250,245,255,0.18)', background: 'rgba(250,245,255,0.08)', color: '#faf5ff', textAlign: 'center', font: 'inherit' }}
          />
          <button type="submit" style={{ minHeight: 38, border: 'none', borderRadius: '0.45rem', background: '#a855f7', color: '#fff', cursor: 'pointer', fontWeight: 700, padding: '0 0.8rem' }}>Verify</button>
          {error && <span role="alert" style={{ gridColumn: '1 / -1', color: '#ff8c7c', fontSize: '0.75rem', textAlign: 'center' }}>{error}</span>}
        </form>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function CategoryPageScene() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const location = useLocation();
  const { allProducts, isLoaded } = useProductData();
  const routeState = location.state as CategoryRouteState | null;
  const incomingSearchQuery = routeState?.searchQuery?.trim() ?? '';
  const incomingSearchProductId = routeState?.searchProductId ?? null;

  const wrapperRef     = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);
  const sceneRef       = useRef<SceneState | null>(null);
  const productsRef    = useRef<Product[]>([]);
  const pageRef        = useRef(0);
  const texCache       = useRef(new Map<string, THREE.Texture>());
  const parallaxRef    = useRef<ParallaxEntry[]>([]);
  const texturePageRequestRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const consumedFocusRequestRef = useRef<string | null>(null);
  const finishProductReturnRef = useRef<() => void>(() => {});
  const searchReturnRef = useRef<SearchReturnTarget | null>(null);
  /** Records clientX at last pointerdown so click handler can reject drag events */
  const mouseDragStartX = useRef(-1);

  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [page,      setPage]      = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [catLabel,  setCatLabel]  = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [openingProductName, setOpeningProductName] = useState('');
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState(incomingSearchQuery);
  const [selectedSearchProductId, setSelectedSearchProductId] = useState<string | null>(incomingSearchProductId);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const focusProductId = routeState?.focusProductId;
  const shouldReopenSearch = Boolean(routeState?.reopenSearch) && !focusProductId;
  const focusRequestKey = focusProductId ? `${location.key}:${focusProductId}` : '';
  const trimmedSearchQuery = searchQuery.trim();
  const isSearchMode = trimmedSearchQuery.length >= 2 || Boolean(selectedSearchProductId);

  const setVisibleProducts = useCallback((nextProducts: Product[]) => {
    productsRef.current = nextProducts;
    setProducts(nextProducts);
    pageRef.current = 0;
    setPage(0);
  }, []);

  /* ── Load products ────────────────────────────────────────── */
  useEffect(() => {
    if (!slug) return;
    setIsCategoryLoading(true);
    setSearchQuery(incomingSearchQuery);
    setSelectedSearchProductId(incomingSearchProductId);
    setSearchOpen(shouldReopenSearch);
    pageRef.current = 0;
    const resetTimer = window.setTimeout(() => {
      setPage(0);
      setOpeningProductName('');
      setFocusedProduct(null);
    }, 0);
    isAnimatingRef.current = false;
    const state = sceneRef.current;
    const el = wrapperRef.current;
    if (el) {
      el.style.transition = 'opacity 300ms ease';
      requestAnimationFrame(() => { if (wrapperRef.current) wrapperRef.current.style.opacity = '1'; });
    }
    if (state) {
      state.productFocus.active = false;
      state.productFocus.returning = false;
      state.isRotating.value = false;
      state.searchDrop.active = false;
      state.searchDrop.startMs = Number.NEGATIVE_INFINITY;
      state.camera.position.set(0, 5.5, 12);
      state.cubes.forEach((cube, cubeIndex) => {
        const columnIndex = Math.floor(cubeIndex / TABLE_H);
        const posX = (columnIndex - 2) * SPACING;
        cube.position.set(posX, cube.userData.baseY, 0);
        cube.rotation.set(0, 0, 0);
        cube.scale.set(1, 1, 1);
        cube.userData.targetRotX = 0;
        cube.userData.targetRotY = 0;
        delete cube.userData.searchDropStartY;
        delete cube.userData.searchDropStartRotX;
        delete cube.userData.searchDropStartRotZ;
        delete cube.userData.searchDropStartScale;
      });
      state.labels.forEach(label => {
        const material = label.material as THREE.SpriteMaterial;
        material.opacity = 1;
      });
    }
    // Title-cased slug as a guaranteed fallback (e.g. "standard-collection" -> "Standard Collection").
    const fallbackLabel = slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    // Resolve the collection's display label from categories.json first so the
    // header always shows the collection name (e.g. "Signature Collection")
    // rather than the per-product `category_label` (e.g. "Drinkware").
    loadCategories().then(cats => {
      const node = cats.find(c => c.slug === slug);
      setCatLabel(node?.label ?? fallbackLabel);
    }).catch(() => setCatLabel(fallbackLabel));

    loadCategoryProducts(slug).then(p => {
      setCategoryProducts(p);
      if (!incomingSearchQuery && !incomingSearchProductId) setVisibleProducts(p);
    }).finally(() => setIsCategoryLoading(false));

    return () => window.clearTimeout(resetTimer);
  }, [incomingSearchProductId, incomingSearchQuery, setVisibleProducts, shouldReopenSearch, slug]);

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
    const tableLight = new THREE.PointLight(0xffd977, 8.0, 60);
    tableLight.position.set(0, 8, -15);
    scene.add(tableLight);

    /* Hemisphere light positioned behind the center cube, shining forward onto
       the floating cubes from behind. The light's "up" axis is set from its
       position vector, so placing it at -Z makes the warm sky tint hit the back
       faces of the cube grid while a cooler ground tint fills the front. */
    const backHemi = new THREE.HemisphereLight(0xffd28a, 0x2a1240, 2.1);
    backHemi.position.set(0, 5.2, -8);
    scene.add(backHemi);

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
    const labels: THREE.Sprite[] = [];

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

        // Label sprite above the cube — tracks cube Y in animation loop.
        // Starts blank; populated by loadPageTextures once products load.
        const label = makeLabelSprite('');
        label.position.set(posX, -10 + LABEL_OFFSET_Y, LABEL_OFFSET_Z);
        scene.add(label);
        labels.push(label);

        cubeIdx++;
      }
    }

    /* ── Shared mutable flags passed by reference ── */
    const entryDone  = { value: false };
    const isRotating = { value: false };
    const isExiting  = { value: false };
    const exitStart  = { value: 0 };
    const searchDrop = { active: false, startMs: Number.NEGATIVE_INFINITY };
    const productFocus: ProductFocusState = {
      active: false,
      returning: false,
      selectedIdx: -1,
      startMs: 0,
      returnStartMs: 0,
      startCamera: new THREE.Vector3(),
      targetCamera: new THREE.Vector3(),
      returnStartCamera: new THREE.Vector3(),
      returnTargetCamera: new THREE.Vector3(),
      startPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      startScale: new THREE.Vector3(1, 1, 1),
      targetScale: new THREE.Vector3(1, 1, 1),
      startRotation: new THREE.Euler(),
      targetRotationY: 0,
    };

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
      const searchDropElapsed = now - searchDrop.startMs;
      const searchDropTransitioning = Number.isFinite(searchDropElapsed) && searchDropElapsed >= 0 && searchDropElapsed < SEARCH_DROP_DUR;
      const searchDropBlocksCubes = searchDrop.active || searchDropTransitioning;

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
        if (entryDone.value && !isExiting.value && !productFocus.active && !productFocus.returning && !searchDropBlocksCubes) {
          cube.position.y = cube.userData.baseY
            + Math.sin(time * 0.5 + cube.userData.floatOffset) * 0.12;
        }
      });

      if (searchDropBlocksCubes && !productFocus.active && !productFocus.returning && !isExiting.value) {
        const rawDropT = clamp01(searchDropElapsed / SEARCH_DROP_DUR);
        const dropT = searchDrop.active ? easeInQuart(rawDropT) : easeInOutCubic(rawDropT);

        cubes.forEach((cube, cubeIndex) => {
          const startY = (cube.userData.searchDropStartY as number | undefined) ?? cube.position.y;
          const startRotX = (cube.userData.searchDropStartRotX as number | undefined) ?? cube.rotation.x;
          const startRotZ = (cube.userData.searchDropStartRotZ as number | undefined) ?? cube.rotation.z;
          const startScale = (cube.userData.searchDropStartScale as number | undefined) ?? cube.scale.x;
          const floatY = cube.userData.baseY + Math.sin(time * 0.5 + cube.userData.floatOffset) * 0.12;
          const targetY = searchDrop.active ? -16 - (cubeIndex % TABLE_H) * 0.45 : floatY;
          const targetRotX = searchDrop.active ? (cubeIndex % 2 === 0 ? 1.2 : -1.1) : 0;
          const targetRotZ = searchDrop.active ? (cubeIndex % 3 === 0 ? -0.85 : 0.85) : 0;
          const targetScale = searchDrop.active ? 0.82 : 1;

          cube.position.y = THREE.MathUtils.lerp(startY, targetY, dropT);
          cube.rotation.x = THREE.MathUtils.lerp(startRotX, targetRotX, dropT);
          cube.rotation.z = THREE.MathUtils.lerp(startRotZ, targetRotZ, dropT);
          cube.scale.setScalar(THREE.MathUtils.lerp(startScale, targetScale, dropT));

          const labelMat = labels[cubeIndex]?.material as THREE.SpriteMaterial | undefined;
          if (labelMat) labelMat.opacity = searchDrop.active ? 1 - dropT : dropT;

          if (!searchDrop.active && rawDropT >= 1) {
            delete cube.userData.searchDropStartY;
            delete cube.userData.searchDropStartRotX;
            delete cube.userData.searchDropStartRotZ;
            delete cube.userData.searchDropStartScale;
          }
        });

        if (!searchDrop.active && rawDropT >= 1) {
          searchDrop.startMs = Number.NEGATIVE_INFINITY;
        }
      }

      /* Product focus: selected cube becomes the catalogue-page slab while all others fall away */
      if (productFocus.active) {
        const focusElapsed = now - productFocus.startMs;
        const selectedCube = cubes[productFocus.selectedIdx];
        const moveT = easeInOutCubic(clamp01(focusElapsed / 1080));
        selectedCube.position.lerpVectors(productFocus.startPosition, productFocus.targetPosition, moveT);
        selectedCube.scale.lerpVectors(productFocus.startScale, productFocus.targetScale, moveT);
        selectedCube.rotation.x = THREE.MathUtils.lerp(productFocus.startRotation.x, 0, moveT);
        selectedCube.rotation.y = THREE.MathUtils.lerp(productFocus.startRotation.y, productFocus.targetRotationY, moveT);
        selectedCube.rotation.z = THREE.MathUtils.lerp(productFocus.startRotation.z, 0, moveT);

        camera.position.lerpVectors(productFocus.startCamera, productFocus.targetCamera, moveT);
        camera.lookAt(productFocus.targetPosition.x, productFocus.targetPosition.y, productFocus.targetPosition.z);

        cubes.forEach((cube, cubeIndex) => {
          const labelMat = labels[cubeIndex]?.material as THREE.SpriteMaterial | undefined;
          if (cubeIndex === productFocus.selectedIdx) {
            if (labelMat) labelMat.opacity = 1 - clamp01(focusElapsed / 240);
            return;
          }

          const dropT = easeInQuart(clamp01((focusElapsed - cubeIndex * 22) / 760));
          const startY = (cube.userData.focusStartY as number | undefined) ?? cube.position.y;
          const startRotX = (cube.userData.focusStartRotX as number | undefined) ?? cube.rotation.x;
          const startRotZ = (cube.userData.focusStartRotZ as number | undefined) ?? cube.rotation.z;
          cube.position.y = startY + (-16 - startY) * dropT;
          cube.rotation.x = startRotX + dropT * (cubeIndex % 2 === 0 ? 1.65 : -1.35);
          cube.rotation.z = startRotZ + dropT * (cubeIndex % 3 === 0 ? -0.9 : 0.9);
          const scale = THREE.MathUtils.lerp(1, 0.82, dropT);
          cube.scale.setScalar(scale);
          if (labelMat) labelMat.opacity = 1 - dropT;
        });
      }

      if (productFocus.returning) {
        const returnElapsed = now - productFocus.returnStartMs;
        const rawReturnT = clamp01(returnElapsed / PRODUCT_FOCUS_RETURN_DUR);
        const returnT = easeInOutCubic(rawReturnT);
        const targetRotY = getPageRotationY(pageRef.current);

        camera.position.lerpVectors(productFocus.returnStartCamera, productFocus.returnTargetCamera, returnT);
        camera.lookAt(0, 5.2, 0);

        cubes.forEach((cube, cubeIndex) => {
          const columnIndex = Math.floor(cubeIndex / TABLE_H);
          const targetX = (columnIndex - 2) * SPACING;
          const targetY = cube.userData.baseY as number;
          const startPosition = cube.userData.returnStartPosition as THREE.Vector3 | undefined;
          const startRotation = cube.userData.returnStartRotation as THREE.Euler | undefined;
          const startScale = cube.userData.returnStartScale as THREE.Vector3 | undefined;

          if (startPosition) {
            cube.position.set(
              THREE.MathUtils.lerp(startPosition.x, targetX, returnT),
              THREE.MathUtils.lerp(startPosition.y, targetY, returnT),
              THREE.MathUtils.lerp(startPosition.z, 0, returnT),
            );
          } else {
            cube.position.set(targetX, targetY, 0);
          }

          if (startRotation) {
            cube.rotation.x = THREE.MathUtils.lerp(startRotation.x, 0, returnT);
            cube.rotation.y = THREE.MathUtils.lerp(startRotation.y, targetRotY, returnT);
            cube.rotation.z = THREE.MathUtils.lerp(startRotation.z, 0, returnT);
          } else {
            cube.rotation.set(0, targetRotY, 0);
          }

          if (startScale) {
            cube.scale.set(
              THREE.MathUtils.lerp(startScale.x, 1, returnT),
              THREE.MathUtils.lerp(startScale.y, 1, returnT),
              THREE.MathUtils.lerp(startScale.z, 1, returnT),
            );
          } else {
            cube.scale.set(1, 1, 1);
          }

          const labelMat = labels[cubeIndex]?.material as THREE.SpriteMaterial | undefined;
          if (labelMat) labelMat.opacity = returnT;

          if (rawReturnT >= 1) {
            cube.position.set(targetX, targetY, 0);
            cube.rotation.set(0, targetRotY, 0);
            cube.scale.set(1, 1, 1);
            cube.userData.targetRotX = 0;
            cube.userData.targetRotY = targetRotY;
            delete cube.userData.focusStartY;
            delete cube.userData.focusStartRotX;
            delete cube.userData.focusStartRotZ;
            delete cube.userData.returnStartPosition;
            delete cube.userData.returnStartRotation;
            delete cube.userData.returnStartScale;
          }
        });

        if (rawReturnT >= 1) {
          productFocus.returning = false;
          productFocus.selectedIdx = -1;
          finishProductReturnRef.current();
        }
      }

      /* Labels follow their cube's Y position (entry, float, and exit) */
      for (let li = 0; li < labels.length; li++) {
        labels[li].position.y = cubes[li].position.y + LABEL_OFFSET_Y;
      }

      /* Parallax: slow per-texture UV drift on the visible product faces */
      const parallax = parallaxRef.current;
      for (let pi = 0; pi < parallax.length; pi++) {
        const p = parallax[pi];
        p.tex.offset.x = Math.sin(time * p.speedX + p.phaseX) * PARALLAX_AMPLITUDE;
        p.tex.offset.y = Math.cos(time * p.speedY + p.phaseY) * PARALLAX_AMPLITUDE;
      }

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

    sceneRef.current = { renderer, scene, camera, floorMesh, floorData, cubes, labels, entryDone, isRotating, isExiting, exitStart, searchDrop, productFocus };
    setSceneReady(true);

    /* Resize */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);
    const textureCache = texCache.current;

    return () => {
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      window.removeEventListener('resize', onResize);
      textureCache.forEach(t => t.dispose());
      textureCache.clear();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = sceneRef.current;
    if (!state || state.searchDrop.active === searchOpen) return;

    state.searchDrop.active = searchOpen;
    state.searchDrop.startMs = performance.now();
    state.cubes.forEach(cube => {
      cube.userData.searchDropStartY = cube.position.y;
      cube.userData.searchDropStartRotX = cube.rotation.x;
      cube.userData.searchDropStartRotZ = cube.rotation.z;
      cube.userData.searchDropStartScale = cube.scale.x;
    });
  }, [sceneReady, searchOpen]);

  /* ── Load textures for a page ─────────────────────────────── */
  const loadPageTextures = useCallback((pageIdx: number) => {
    const state = sceneRef.current;
    const prods = productsRef.current;
    if (!state || pageIdx < 0 || pageIdx >= MAX_PAGES) return;

    const requestId = ++texturePageRequestRef.current;
    const faceIdx = PAGE_FACE_IDX[pageIdx];
    const loader  = new THREE.TextureLoader();
    const hideUnpaintedSearchCubes = isSearchMode;

    // Reset active parallax list for the new page; entries get re-pushed below.
    parallaxRef.current = [];

    // First pass: reset all page faces back to plain gold on every cube.
    // The current face is repainted below only for slots that have a product.
    state.cubes.forEach(cube => {
      const mats = (cube.material as THREE.Material[]).slice();
      PAGE_FACE_IDX.forEach(fi => {
        (mats[fi] as THREE.Material).dispose();
        mats[fi] = goldMat();
      });
      cube.material = mats;
      cube.visible = !hideUnpaintedSearchCubes;
    });

    // Clear all labels first; we'll repopulate only the slots that have a product.
    state.labels.forEach(lbl => {
      lbl.visible = !hideUnpaintedSearchCubes;
      setLabelSpriteText(lbl, '');
    });

    if (prods.length === 0) return;

    // Second pass: apply product image ONLY to the face that now faces the camera
    state.cubes.forEach((_, i) => {
      const prodIdx = pageIdx * PAGE_SIZE + i;
      if (prodIdx >= prods.length) return;

      const product = prods[prodIdx];
      const img = getPrimaryImage(product);
      if (hideUnpaintedSearchCubes && !img) {
        state.cubes[i].visible = false;
        if (state.labels[i]) state.labels[i].visible = false;
        return;
      }

      state.cubes[i].visible = true;
      if (state.labels[i]) state.labels[i].visible = true;

      // Update the label above this cube with the shortened product name.
      const label = state.labels[i];
      if (label) setLabelSpriteText(label, shortenProductName(product.name || ''));

      if (!img) return;
      const url = resolveImageUrl(img.local_path);

      const apply = (tex: THREE.Texture) => {
        const activeState = sceneRef.current;
        if (!activeState || pageRef.current !== pageIdx || texturePageRequestRef.current !== requestId) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.center.set(0.5, 0.5);
        tex.repeat.set(PARALLAX_REPEAT, PARALLAX_REPEAT);
        tex.offset.set(0, 0);
        const activeCube = activeState.cubes[i];
        const mats = (activeCube.material as THREE.Material[]).slice();
        mats[faceIdx] = productMat(tex);
        activeCube.material = mats;
        parallaxRef.current.push({
          tex,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          speedX: 0.55 + Math.random() * 0.35,
          speedY: 0.50 + Math.random() * 0.35,
        });
      };

      if (texCache.current.has(url)) {
        apply(texCache.current.get(url)!);
        return;
      }
      loader.load(
        url,
        tex => {
          // Guard: skip textures that loaded but have no decodable image data —
          // applying them produces a solid-black face.
          const img = tex.image as HTMLImageElement | ImageBitmap | undefined;
          const w = (img as HTMLImageElement)?.naturalWidth ?? (img as ImageBitmap)?.width ?? 0;
          const h = (img as HTMLImageElement)?.naturalHeight ?? (img as ImageBitmap)?.height ?? 0;
          if (!img || w === 0 || h === 0) {
            tex.dispose();
            return;
          }
          texCache.current.set(url, tex);
          apply(tex);
        },
        undefined,
        // onError: leave the face as the default gold material.
        () => { /* swallow — face stays gold */ },
      );
    });
  }, [isSearchMode]);

  useEffect(() => {
    if (!isSearchMode) {
      setVisibleProducts(categoryProducts);
      return;
    }

    const searchPool = allProducts.length > 0 ? allProducts : categoryProducts;
    const nextProducts = selectedSearchProductId
      ? searchPool.filter(product => product.id === selectedSearchProductId)
      : searchProductsByName(searchPool, trimmedSearchQuery).filter(product => Boolean(getPrimaryImage(product)));
    setVisibleProducts(nextProducts);
  }, [allProducts, categoryProducts, isSearchMode, selectedSearchProductId, setVisibleProducts, trimmedSearchQuery]);

  /* ── Fade the scene in on mount ── */
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.transition = 'opacity 300ms ease';
    requestAnimationFrame(() => { if (el) el.style.opacity = '1'; });
  }, []);

  /* ── Trigger texture load once both scene + products are ready ── */
  useEffect(() => {
    if (sceneReady) {
      loadPageTextures(0);
    }
  }, [sceneReady, products, loadPageTextures]);

  useEffect(() => {
    finishProductReturnRef.current = () => {
      setOpeningProductName('');
      isAnimatingRef.current = false;
      loadPageTextures(pageRef.current);
    };
  }, [loadPageTextures]);

  /* ── Computed values ─────────────────────────────────────────── */
  const maxPages = Math.min(MAX_PAGES, Math.ceil(products.length / PAGE_SIZE));
  const isProductOpening = openingProductName.length > 0;

  /* ── Cube rotation helpers ────────────────────────────────── */
  const startPageRotation = useCallback((targetPage: number) => {
    const state = sceneRef.current;
    if (!state || state.isRotating.value || isAnimatingRef.current) return false;
    state.isRotating.value = true;
    const targetRotY = getPageRotationY(targetPage);
    state.cubes.forEach(cube => { cube.userData.targetRotY = targetRotY; });
    // Unlock after animation settles (~700ms)
    setTimeout(() => { if (sceneRef.current) sceneRef.current.isRotating.value = false; }, 720);
    return true;
  }, []);

  /* Stable refs so touch handler inside useEffect can call these */
  const goNextRef = useRef<() => void>(() => {});
  const goPrevRef = useRef<() => void>(() => {});

  const goToPage = useCallback((targetPage: number) => {
    if (isAnimatingRef.current) return;
    const next = Math.max(0, Math.min(targetPage, maxPages - 1));
    if (next === pageRef.current) return;
    if (!startPageRotation(next)) return;
    pageRef.current = next;
    setPage(next);
    loadPageTextures(next);
  }, [loadPageTextures, maxPages, startPageRotation]);

  const goNext = useCallback(() => {
    goToPage(pageRef.current + 1);
  }, [goToPage]);

  const goPrev = useCallback(() => {
    goToPage(pageRef.current - 1);
  }, [goToPage]);

  const syncSceneToPage = useCallback((targetPage: number) => {
    const state = sceneRef.current;
    if (!state) return;

    const targetRotY = getPageRotationY(targetPage);
    state.isRotating.value = false;
    state.cubes.forEach(cube => {
      cube.rotation.y = targetRotY;
      cube.userData.targetRotY = targetRotY;
    });
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

  /* ── Canvas click → in-scene product focus ───────────────── */
  const beginProductFocus = useCallback((cubeIdx: number, product: Product) => {
    const state = sceneRef.current;
    if (!state) return;
    const cube = state.cubes[cubeIdx];
    const faceIdx = PAGE_FACE_IDX[pageRef.current];
    const focusY = window.innerWidth < 768 ? 3.9 : 4.35;
    const focus = state.productFocus;

    setMenuOpen(false);
    setOpeningProductName(shortenProductName(product.name));
    setFocusedProduct(product);
    isAnimatingRef.current = true;
    parallaxRef.current = [];

    state.cubes.forEach(fallingCube => {
      fallingCube.userData.focusStartY = fallingCube.position.y;
      fallingCube.userData.focusStartRotX = fallingCube.rotation.x;
      fallingCube.userData.focusStartRotZ = fallingCube.rotation.z;
    });

    focus.active = true;
    focus.returning = false;
    focus.selectedIdx = cubeIdx;
    focus.startMs = performance.now();
    focus.startCamera.copy(state.camera.position);
    focus.targetCamera.set(0, focusY + 0.12, window.innerWidth < 768 ? 6.6 : 5.35);
    focus.startPosition.copy(cube.position);
    focus.targetPosition.set(0, focusY, 0);
    focus.startScale.copy(cube.scale);
    focus.targetScale.copy(getFocusTargetScale(faceIdx));
    focus.startRotation.copy(cube.rotation);
    focus.targetRotationY = cube.userData.targetRotY;

    const source = getCataloguePageSource(product);
    if (!source) return;

    const cacheKey = `catalogue:${source.imageUrl}`;
    const applyCatalogueTexture = (tex: THREE.Texture) => {
      const activeState = sceneRef.current;
      if (!activeState || !activeState.productFocus.active || activeState.productFocus.selectedIdx !== cubeIdx) return;
      const activeCube = activeState.cubes[cubeIdx];
      const mats = (activeCube.material as THREE.Material[]).slice();
      (mats[faceIdx] as THREE.Material).dispose();
      mats[faceIdx] = productMat(tex);
      activeCube.material = mats;
    };

    if (texCache.current.has(cacheKey)) {
      applyCatalogueTexture(texCache.current.get(cacheKey)!);
      return;
    }

    makeCataloguePageTexture({
      imageUrl: source.imageUrl,
      title: product.name,
      missingLabel: source.isPdfPage ? `${source.pdfName ?? 'Catalogue'} page ${source.pageNumber ?? ''}`.trim() : undefined,
    }).then(tex => {
      texCache.current.set(cacheKey, tex);
      applyCatalogueTexture(tex);
    });
  }, []);

  function handleCanvasClick(e: React.MouseEvent) {
    const state = sceneRef.current;
    if (!state) return;
    // Ignore header/button area (top 90px)
    if (e.clientY < 90) return;    // Reject if this was actually a drag (pointer moved more than 10 px since mousedown)
    if (Math.abs(e.clientX - mouseDragStartX.current) > 10) return;
    const nx = (e.clientX / window.innerWidth)  *  2 - 1;
    const ny = (e.clientY / window.innerHeight) * -2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(nx, ny), state.camera);

    if (state.productFocus.active) {
      const selectedCube = state.cubes[state.productFocus.selectedIdx];
      const hits = selectedCube ? raycaster.intersectObject(selectedCube) : [];
      if (hits.length === 0) resetProductFocus();
      return;
    }

    if (isAnimatingRef.current || state.isRotating.value || state.productFocus.returning) return;
    const hits = raycaster.intersectObjects(state.cubes);
    if (hits.length === 0) return;

    const cubeI    = (hits[0].object as THREE.Mesh).userData.cubeIdx as number;
    const prodIdx  = pageRef.current * PAGE_SIZE + cubeI;
    if (prodIdx < productsRef.current.length) {
      const product = productsRef.current[prodIdx];
      beginProductFocus(cubeI, product);
    }
  }

  const resetProductFocus = useCallback(() => {
    setFocusedProduct(null);

    const state = sceneRef.current;
    if (!state || state.productFocus.returning) return;

    isAnimatingRef.current = true;
    state.productFocus.active = false;
    state.productFocus.returning = true;
    state.productFocus.returnStartMs = performance.now();
    state.productFocus.returnStartCamera.copy(state.camera.position);
    state.productFocus.returnTargetCamera.set(0, 5.5, 12);
    state.isRotating.value = false;
    const targetRotY = getPageRotationY(pageRef.current);

    state.cubes.forEach(cube => {
      cube.userData.returnStartPosition = cube.position.clone();
      cube.userData.returnStartRotation = cube.rotation.clone();
      cube.userData.returnStartScale = cube.scale.clone();
      cube.userData.targetRotX = 0;
      cube.userData.targetRotY = targetRotY;
    });
  }, []);

  const returnFromFocusedProduct = useCallback(() => {
    const fallbackQuery = trimmedSearchQuery || focusedProduct?.name || '';
    const routeReturnTarget: SearchReturnTarget | null = routeState?.searchOrigin
      ? {
          origin: routeState.searchOrigin,
          query: routeState.searchQuery?.trim() || fallbackQuery,
          categorySlug: routeState.returnCategorySlug,
        }
      : null;
    const localReturnTarget = searchReturnRef.current;
    const selectedReturnTarget: SearchReturnTarget | null = selectedSearchProductId
      ? { origin: 'category', query: fallbackQuery, categorySlug: slug }
      : null;
    const target = localReturnTarget ?? routeReturnTarget ?? selectedReturnTarget;

    if (!target || !target.query.trim()) {
      resetProductFocus();
      return;
    }

    searchReturnRef.current = null;

    if (target.origin === 'home') {
      navigate('/interactive', {
        state: {
          returnTo: slug,
          searchQuery: target.query,
          reopenSearch: true,
        },
      });
      return;
    }

    const targetSlug = target.categorySlug ?? slug ?? focusedProduct?.category;
    if (!targetSlug) {
      resetProductFocus();
      return;
    }

    navigate(`/category/${targetSlug}`, {
      state: {
        searchQuery: target.query,
        reopenSearch: true,
        searchOrigin: 'category',
      },
    });
  }, [focusedProduct?.category, focusedProduct?.name, navigate, resetProductFocus, routeState?.returnCategorySlug, routeState?.searchOrigin, routeState?.searchQuery, selectedSearchProductId, slug, trimmedSearchQuery]);

  useEffect(() => {
    if (!focusProductId || !focusRequestKey || !sceneReady || products.length === 0) return;
    if (consumedFocusRequestRef.current === focusRequestKey) return;

    const productIndex = products.findIndex(product => product.id === focusProductId);
    if (productIndex < 0) return;

    const targetPage = Math.floor(productIndex / PAGE_SIZE);
    const cubeIndex = productIndex % PAGE_SIZE;
    const product = products[productIndex];
    if (targetPage >= MAX_PAGES) return;

    pageRef.current = targetPage;
    const pageTimer = window.setTimeout(() => setPage(targetPage), 0);
    loadPageTextures(targetPage);

    syncSceneToPage(targetPage);

    const timer = window.setTimeout(() => {
      if (consumedFocusRequestRef.current === focusRequestKey) return;
      consumedFocusRequestRef.current = focusRequestKey;
      beginProductFocus(cubeIndex, product);
    }, 360);
    return () => {
      window.clearTimeout(pageTimer);
      window.clearTimeout(timer);
    };
  }, [beginProductFocus, focusProductId, focusRequestKey, loadPageTextures, products, sceneReady, syncSceneToPage]);

  const focusProductFromSearch = useCallback((product: Product, query: string) => {
    const nextQuery = query.trim() || product.name;

    if (product.category !== slug) {
      navigate(`/category/${product.category}`, {
        state: {
          searchQuery: nextQuery,
          searchProductId: product.id,
          focusProductId: product.id,
          searchOrigin: 'category',
          returnCategorySlug: slug,
          searchGlobal: true,
        },
      });
      return;
    }

    searchReturnRef.current = { origin: 'category', query: nextQuery, categorySlug: slug };
    setSearchOpen(false);
    setMenuOpen(false);
    setOpeningProductName('');
    setFocusedProduct(null);
    setSearchQuery(nextQuery);
    setSelectedSearchProductId(product.id);
    setVisibleProducts([product]);
    syncSceneToPage(0);
    loadPageTextures(0);
    window.setTimeout(() => beginProductFocus(0, product), 160);
  }, [beginProductFocus, loadPageTextures, navigate, setVisibleProducts, slug, syncSceneToPage]);

  const handleCategorySearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;

    searchReturnRef.current = { origin: 'category', query: trimmedQuery, categorySlug: slug };
    setMenuOpen(false);
    setSelectedSearchProductId(null);
    setSearchQuery(trimmedQuery);
  }, [slug]);

  const handleCategoryProductSelect = useCallback((product: Product) => {
    focusProductFromSearch(product, product.name);
  }, [focusProductFromSearch]);

  const clearCategorySearch = useCallback(() => {
    searchReturnRef.current = null;
    setSearchQuery('');
    setSelectedSearchProductId(null);
  }, []);

  /* ── Render ─────────────────────────────────────────────────── */
  const displayLabel = isSearchMode ? 'Search Results' : catLabel || (slug ?? '').replace(/-/g, ' ');
  const searchResultLabel = selectedSearchProductId
    ? 'Selected product'
    : trimmedSearchQuery
      ? `Results for "${trimmedSearchQuery}"`
      : 'Search results';

  return (
    <div ref={wrapperRef} style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(circle at top left, rgba(168,85,247,0.18), transparent 26%), radial-gradient(circle at bottom right, rgba(240,180,41,0.14), transparent 28%), linear-gradient(180deg, #0d0414, #16081f 42%, #0f0518)',
      overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif", opacity: 0 }}>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{ position: 'fixed', inset: 0, cursor: 'pointer' }}
        onPointerDown={(e) => { mouseDragStartX.current = e.clientX; }}
        onClick={handleCanvasClick}
      />

      {/* ── Header ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'linear-gradient(to bottom, rgba(13,4,20,0.96) 0%, transparent 100%)',
        gap: '1rem',
      }}>
        {/* Left — hamburger + back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', justifySelf: 'stretch', minWidth: 0 }}>
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
                setTimeout(() => navigate('/interactive', { state: { returnTo: slug } }), 380);
              } else {
                navigate('/interactive', { state: { returnTo: slug } });
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
          {searchOpen ? (
            <div style={{ flex: '1 1 auto', minWidth: 0, maxWidth: '25rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.45rem', alignItems: 'center' }}>
              <SceneSearchBar
                value={searchQuery}
                onChange={value => {
                  setSearchQuery(value);
                  if (value.trim().length < 2) setSelectedSearchProductId(null);
                }}
                onSearch={handleCategorySearch}
                onProductSelect={handleCategoryProductSelect}
                onClear={clearCategorySearch}
                placeholder={isLoaded ? 'Name, code, or type' : 'Loading search'}
                disabled={!isLoaded}
                autoFocus
              />
              <button
                type="button"
                aria-label="Close search"
                title="Close search"
                onClick={() => setSearchOpen(false)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid rgba(240,180,41,0.36)',
                  background: 'rgba(17,7,24,0.82)',
                  color: '#faf5ff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 16px 42px rgba(0,0,0,0.28)',
                  backdropFilter: 'blur(18px)',
                  flexShrink: 0,
                }}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              aria-label="Open search"
              title="Search products"
              onClick={() => {
                setMenuOpen(false);
                setSearchOpen(true);
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(240,180,41,0.42)',
                background: 'rgba(17,7,24,0.8)',
                color: '#fde68a',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 16px 42px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(18px)',
                flexShrink: 0,
              }}
            >
              <Search size={18} aria-hidden="true" />
            </button>
          )}
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
        onClick={!isProductOpening && page > 0 ? goPrev : undefined}
        aria-label="Previous page"
        style={{
          position: 'fixed', top: '50%', left: '1.25rem',
          transform: 'translateY(-50%)', zIndex: 15,
          width: 50, height: 50, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.6)', backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: !isProductOpening && page > 0 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms, opacity 200ms',
          opacity: isProductOpening ? 0 : page > 0 ? 1 : 0.3,
          pointerEvents: isProductOpening ? 'none' : 'auto',
        }}
        onMouseEnter={e => { if (page > 0) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#a855f7'; b.style.background = 'rgba(124,58,237,0.4)'; }}}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(168,85,247,0.4)'; b.style.background = 'rgba(42,16,64,0.6)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={!isProductOpening && page < maxPages - 1 ? goNext : undefined}
        aria-label="Next page"
        style={{
          position: 'fixed', top: '50%', right: '1.25rem',
          transform: 'translateY(-50%)', zIndex: 15,
          width: 50, height: 50, borderRadius: '50%',
          border: '1px solid rgba(168,85,247,0.4)',
          background: 'rgba(42,16,64,0.6)', backdropFilter: 'blur(10px)',
          color: '#faf5ff', cursor: !isProductOpening && page < maxPages - 1 ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 200ms, background 200ms, opacity 200ms',
          opacity: isProductOpening ? 0 : page < maxPages - 1 ? 1 : 0.3,
          pointerEvents: isProductOpening ? 'none' : 'auto',
        }}
        onMouseEnter={e => { if (page < maxPages - 1) { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#a855f7'; b.style.background = 'rgba(124,58,237,0.4)'; }}}
        onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = 'rgba(168,85,247,0.4)'; b.style.background = 'rgba(42,16,64,0.6)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* ── Page dots ── */}
      {maxPages > 1 && !isProductOpening && (
        <div style={{
          position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.5rem', zIndex: 15,
        }}>
          {Array.from({ length: maxPages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                goToPage(i);
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

      {/* ── Status hint ── */}
      <div style={{
        position: 'fixed',
        top: isProductOpening ? undefined : '4.15rem',
        bottom: isProductOpening ? (maxPages > 1 ? '4.5rem' : '1.5rem') : undefined,
        left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(250,245,255,0.85)', fontSize: '0.72rem',
        letterSpacing: '0.08em', zIndex: 15,
        maxWidth: 'calc(100vw - 2rem)',
        whiteSpace: 'normal',
        textAlign: 'center',
        pointerEvents: 'none',
        background: 'rgba(13,4,20,0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: '999px',
        padding: '0.35rem 1rem',
        border: '1px solid rgba(168,85,247,0.25)',
      }}>
        {isProductOpening
          ? `Viewing ${openingProductName}`
          : isCategoryLoading || (isSearchMode && !isLoaded)
            ? 'Loading products…'
            : isSearchMode && products.length === 0
              ? `No products found for "${trimmedSearchQuery}"`
              : isSearchMode
                ? `${products.length} ${products.length === 1 ? 'product' : 'products'} · ${searchResultLabel}`
                : products.length === 0
                  ? 'No products in this collection'
                  : 'Tap a cube to view · swipe or use arrows to browse pages'}
      </div>

      {focusedProduct && (() => {
        const focusedCode = getProductCode(focusedProduct);
        return (
          <div
            aria-label="Product purchase actions"
            style={{
              position: 'fixed',
              top: '50%',
              right: 'clamp(1rem, 4vw, 3rem)',
              transform: 'translateY(-50%)',
              zIndex: 34,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '0.75rem',
              width: 'min(15.5rem, calc(100vw - 2rem))',
              padding: '0.9rem 1.05rem',
              borderRadius: '0.85rem',
              border: '1px solid rgba(240,180,41,0.45)',
              background: 'rgba(17,7,24,0.78)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.32)',
              backdropFilter: 'blur(16px)',
              pointerEvents: 'auto',
            }}
          >
            {focusedCode && (
              <div
                aria-label={`Product code ${focusedCode}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.3rem',
                }}
              >
                <span style={{
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#f0b429',
                }}>Product Code</span>
                <span style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1rem, 2.2vw, 1.35rem)',
                  fontWeight: 700,
                  color: '#faf5ff',
                  lineHeight: 1.1,
                  letterSpacing: '0.04em',
                }}>{focusedCode}</span>
              </div>
            )}
            <CubeContactReveal key={focusedProduct.id} product={focusedProduct} />
            <button
              type="button"
              onClick={returnFromFocusedProduct}
              style={{
                minHeight: 40,
                border: '1px solid rgba(250,245,255,0.18)',
                borderRadius: 999,
                background: 'rgba(250,245,255,0.06)',
                color: '#faf5ff',
                cursor: 'pointer',
                padding: '0.62rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              {routeState?.searchOrigin || selectedSearchProductId ? 'Back to search' : 'Back to cubes'}
            </button>
          </div>
        );
      })()}

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
              clearCategorySearch();
              if (cat.slug === slug) return;
              const el = wrapperRef.current;
              if (el) { el.style.transition = 'opacity 300ms ease'; el.style.opacity = '0'; }
              setTimeout(() => navigate(`/category/${cat.slug}`, { state: null }), 320);
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
