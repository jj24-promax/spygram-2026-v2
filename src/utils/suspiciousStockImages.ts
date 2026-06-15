/** Imagens íntimas/sensíveis — sempre exibidas com blur forte no CSS */
export const SUSPICIOUS_STOCK_POOL = [
  '/suspicious-stock/suspicious-01.jpg',
  '/suspicious-stock/suspicious-02.jpg',
  '/suspicious-stock/suspicious-03.jpg',
  '/suspicious-stock/suspicious-04.jpg',
  '/suspicious-stock/suspicious-05.jpg',
  '/suspicious-stock/suspicious-06.jpg',
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
