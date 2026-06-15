/** Fotos genéricas locais — exibidas sempre com blur no CSS */
export const BLURRED_AVATAR_POOL = [
  '/recovered/img_1.jpg',
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

const CHAT_AVATAR_INDEX: Record<string, number> = {
  fer: 0,
  itx: 1,
  toh: 2,
  and: 3,
  bru: 4,
  rog: 5,
  bab: 6,
  dee: 0,
  swi: 2,
};

export function getBlurredAvatar(seed: number | string): string {
  if (typeof seed === 'number') {
    return BLURRED_AVATAR_POOL[Math.abs(seed) % BLURRED_AVATAR_POOL.length];
  }

  const mapped = CHAT_AVATAR_INDEX[seed];
  if (mapped !== undefined) {
    return BLURRED_AVATAR_POOL[mapped % BLURRED_AVATAR_POOL.length];
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % BLURRED_AVATAR_POOL.length;
  }
  return BLURRED_AVATAR_POOL[hash];
}
