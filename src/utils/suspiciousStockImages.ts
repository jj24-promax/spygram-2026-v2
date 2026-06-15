/** Imagens recuperadas — sempre exibidas com blur forte no CSS */
export const SUSPICIOUS_STOCK_POOL = [
  '/recovered/img_1.jpg',
  '/recovered/img_2.png',
  '/recovered/img_3.jpg',
  '/recovered/img_4.jpg',
  '/recovered/img_5.jpg',
  '/recovered/img_6.jpeg',
  '/recovered/img_7.jpg',
  '/recovered/img_8.jpg',
  '/recovered/img_9.jpg',
  '/recovered/img_10.jpg',
  '/recovered/img_11.jpg',
  '/recovered/img_12.jpg',
  '/recovered/img_13.jpg',
] as const;

function hashToIndex(seed: string | number, length: number): number {
  if (length <= 0) return 0;
  if (typeof seed === 'number') return Math.abs(seed) % length;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % length;
  }
  return hash;
}

export function getSuspiciousStockImage(seed: string | number): string {
  return SUSPICIOUS_STOCK_POOL[hashToIndex(seed, SUSPICIOUS_STOCK_POOL.length)];
}

export function getRandomSuspiciousPreviewImages(count = 3): string[] {
  const pool = [...SUSPICIOUS_STOCK_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** Retorna até `count` imagens distintas para o tracker de análise */
export function getSuspiciousPreviewImages(username: string, count: number): string[] {
  const limit = Math.min(count, SUSPICIOUS_STOCK_POOL.length);
  const used = new Set<number>();
  const images: string[] = [];

  for (let i = 0; i < limit; i++) {
    let idx = hashToIndex(`${username}-suspicious-${i}`, SUSPICIOUS_STOCK_POOL.length);
    let guard = 0;
    while (used.has(idx) && guard < SUSPICIOUS_STOCK_POOL.length) {
      idx = (idx + 1) % SUSPICIOUS_STOCK_POOL.length;
      guard++;
    }
    used.add(idx);
    images.push(SUSPICIOUS_STOCK_POOL[idx]);
  }

  return images;
}
