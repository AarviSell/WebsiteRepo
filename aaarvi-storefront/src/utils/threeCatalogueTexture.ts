import * as THREE from 'three';

interface CatalogueTextureOptions {
  imageUrl: string;
  title: string;
  missingLabel?: string;
}

const FALLBACK_TEXTURE_W = 1600;
const FALLBACK_TEXTURE_H = 1100;

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFallback(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, title: string, missingLabel?: string) {
  ctx.fillStyle = '#f7f1e6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#7c4a11';
  ctx.lineWidth = 5;
  drawRoundRect(ctx, 86, 72, canvas.width - 172, canvas.height - 144, 28);
  ctx.stroke();

  ctx.fillStyle = '#7c4a11';
  ctx.font = '800 46px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PDF page image missing', canvas.width / 2, canvas.height / 2 - 110, canvas.width - 280);

  ctx.fillStyle = '#27112f';
  ctx.font = '700 62px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.slice(0, 42), canvas.width / 2, canvas.height / 2, canvas.width - 300);

  if (!missingLabel) return;
  ctx.fillStyle = '#5f2d0c';
  ctx.font = '600 34px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(missingLabel, canvas.width / 2, canvas.height / 2 + 95, canvas.width - 340);
}

/** Keep catalogue textures sharp — no mip chain, no canvas resampling when possible. */
export function applySharpCatalogueSampling(texture: THREE.Texture, maxAnisotropy = 8): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
}

function makeFallbackCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = FALLBACK_TEXTURE_W;
  canvas.height = FALLBACK_TEXTURE_H;
  return canvas;
}

function loadImage(url: string | undefined): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!url) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0 ? image : null);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function makeCataloguePageTexture(
  options: CatalogueTextureOptions,
  maxAnisotropy = 8,
): Promise<THREE.Texture> {
  const pageImage = await loadImage(options.imageUrl);
  if (pageImage) {
    const texture = new THREE.Texture(pageImage);
    applySharpCatalogueSampling(texture, maxAnisotropy);
    return texture;
  }

  const canvas = makeFallbackCanvas();
  const ctx = canvas.getContext('2d')!;
  drawFallback(ctx, canvas, options.title, options.missingLabel);
  const texture = new THREE.CanvasTexture(canvas);
  applySharpCatalogueSampling(texture, maxAnisotropy);
  return texture;
}
