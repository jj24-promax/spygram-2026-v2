import { PREVIEW_TRIAL_MS } from '../constants/analysisFlow';

export const INVASION_TRIAL_DURATION_MS = 120 * 1000;

export const INVASION_DEMO_PATHS = ['/instagram', '/messages', '/notifications', '/chat'];

export function startInvasionTrialSession(durationMs = INVASION_TRIAL_DURATION_MS) {
  localStorage.removeItem('spygram_trial_expired');
  sessionStorage.setItem('invasionEndTime', String(Date.now() + durationMs));
}

/** Prévia de 1 minuto no feed / direct / notificações */
export function startPreviewTrialSession() {
  startInvasionTrialSession(PREVIEW_TRIAL_MS);
}

export function hasActiveInvasionTrial(): boolean {
  const endTime = sessionStorage.getItem('invasionEndTime');
  if (!endTime) return false;
  return Date.now() < parseInt(endTime, 10);
}

export function isPreviewTrialExpired(): boolean {
  return localStorage.getItem('spygram_trial_expired') === 'true';
}

export function expireInvasionTrial() {
  sessionStorage.removeItem('invasionEndTime');
  localStorage.setItem('spygram_trial_expired', 'true');
  markInstagramDemoSeen();
}

export function markInstagramDemoSeen() {
  sessionStorage.setItem('spygram_saw_instagram_demo', 'true');
}

export function hasSeenInstagramDemo(): boolean {
  return sessionStorage.getItem('spygram_saw_instagram_demo') === 'true';
}

export function clearInvasionTrialState() {
  localStorage.removeItem('spygram_trial_expired');
  sessionStorage.removeItem('invasionEndTime');
  sessionStorage.removeItem('spygram_saw_instagram_demo');
}

export function isInvasionDemoPath(pathname: string): boolean {
  return INVASION_DEMO_PATHS.some((path) => pathname.startsWith(path));
}

const LOCAL_INVASION_KEYS = [
  'spygram_active_invasion',
  'spygram_trial_expired',
  'spygram_banned_session',
] as const;

const SESSION_INVASION_KEYS = [
  'invasionData',
  'current_lead_id',
  'invasionEndTime',
  'spygram_saw_instagram_demo',
  'spygram_warning_seen',
  'spygram_vsl_active',
  'spygram_instant_login',
] as const;

/** Limpa estado de invasão/trial para nova consulta (uso em dev). */
export function resetSpygramDevSession() {
  LOCAL_INVASION_KEYS.forEach((key) => localStorage.removeItem(key));
  SESSION_INVASION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}
