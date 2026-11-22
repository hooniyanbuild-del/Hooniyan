function compressCanvasSource(
  source: HTMLImageElement | HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension = 720,
  maxLength = 110000
): string {
  let width = sourceWidth;
  let height = sourceHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  // Prefer WebP for ~30% smaller storage size; fall back to JPEG if unsupported
  const webpProbe = canvas.toDataURL('image/webp', 0.62);
  const mimeType = webpProbe.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';

  let quality = 0.62;
  let compressed = mimeType === 'image/webp' ? webpProbe : canvas.toDataURL('image/jpeg', quality);

  while (compressed.length > maxLength && quality > 0.28) {
    quality -= 0.08;
    compressed = canvas.toDataURL(mimeType, quality);
  }

  let scaleAttempts = 0;
  while (compressed.length > maxLength && scaleAttempts < 3) {
    scaleAttempts += 1;
    canvas.width = Math.max(240, Math.round(canvas.width * 0.75));
    canvas.height = Math.max(240, Math.round(canvas.height * 0.75));
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    compressed = canvas.toDataURL(mimeType, 0.45);
  }

  return compressed;
}

export async function compressImageFile(
  file: File,
  maxDimension = 720,
  maxLength = 110000
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Gagal memproses file gambar'));
    image.src = dataUrl;
  });

  const compressed = compressCanvasSource(
    img,
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxDimension,
    maxLength
  );

  return compressed || dataUrl.slice(0, maxLength);
}

export function compressVideoFrame(
  video: HTMLVideoElement,
  maxDimension = 720,
  maxLength = 110000
): string {
  const width = video.videoWidth || 720;
  const height = video.videoHeight || 540;
  return compressCanvasSource(video, width, height, maxDimension, maxLength);
}

export function estimateDataUrlKb(dataUrl: string): number {
  const base64Part = dataUrl.split(',')[1] || '';
  const bytes = Math.round((base64Part.length * 3) / 4);
  return Math.max(1, Math.round(bytes / 1024));
}
