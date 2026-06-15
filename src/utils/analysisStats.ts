function hashSeed(username: string): number {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = (h + username.charCodeAt(i) * (i + 1)) % 997;
  }
  return h;
}

const LOCATION_LABELS = [
  'Motel / hospedagem discreta',
  'Residência visitada com frequência',
  'Local de encontro recorrente',
  'Estabelecimento noturno',
  'Endereço fora da rotina habitual',
  'Imóvel acessado em horários suspeitos',
  'Pousada / local de passagem',
  'Ponto de parada incomum',
];

export function getAnalysisStats(username: string) {
  const seed = hashSeed(username);
  const locIdx = seed % LOCATION_LABELS.length;
  return {
    messages: 52 + (seed % 28),
    images: 2 + (seed % 4),
    locations: 2 + (seed % 4),
    locationLabel: LOCATION_LABELS[locIdx],
    locationDays: 14 + (seed % 20),
  };
}

export type TrackerCategory = 'messages' | 'images' | 'locations';

export interface TrackerCategoryProgress {
  progress: number;
  count: number;
  isScanning: boolean;
  isDone: boolean;
}

const TRACKER_WINDOWS: Record<
  TrackerCategory,
  { start: number; end: number; progressStart: number; progressEnd: number }
> = {
  messages: { start: 0.04, end: 0.62, progressStart: 0.02, progressEnd: 0.65 },
  images: { start: 0.22, end: 0.78, progressStart: 0.18, progressEnd: 0.82 },
  locations: { start: 0.42, end: 0.96, progressStart: 0.38, progressEnd: 0.98 },
};

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function progressiveCount(
  ratio: number,
  start: number,
  end: number,
  target: number,
  forceComplete: boolean
): number {
  if (forceComplete) return target;
  if (ratio < start || target === 0) return 0;
  if (ratio >= end) return target;

  const local = (ratio - start) / (end - start);
  const eased = easeOutQuad(local);

  if (target === 1) return 1;

  return Math.max(1, Math.min(target, Math.floor(eased * target)));
}

function categoryProgress(
  ratio: number,
  window: (typeof TRACKER_WINDOWS)[TrackerCategory],
  forceComplete: boolean
): number {
  if (forceComplete) return 100;
  if (ratio < window.progressStart) return 0;

  const local = Math.min(
    1,
    (ratio - window.progressStart) / (window.progressEnd - window.progressStart)
  );
  return Math.min(98, Math.round(easeOutQuad(local) * 100));
}

export function getTrackerProgress(
  elapsedMs: number,
  totalMs: number,
  isComplete: boolean,
  targets: { messages: number; images: number; locations: number }
): Record<TrackerCategory, TrackerCategoryProgress> {
  const ratio = Math.min(1, elapsedMs / totalMs);

  return (['messages', 'images', 'locations'] as const).reduce(
    (acc, key) => {
      const window = TRACKER_WINDOWS[key];
      const target = targets[key];
      const count = progressiveCount(ratio, window.start, window.end, target, isComplete);
      const progress = categoryProgress(ratio, window, isComplete);
      const isScanning = !isComplete && ratio >= window.progressStart && ratio < window.end;
      const isDone = isComplete || (ratio >= window.end && count >= target);

      acc[key] = { progress, count, isScanning, isDone };
      return acc;
    },
    {} as Record<TrackerCategory, TrackerCategoryProgress>
  );
}
