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
  'spygram_dev_preview_lock',
  'spygram_dev_preview_lock_value',
  'spygram_dev_skip_analysis_pending',
] as const;

const DEV_PREVIEW_LOCK_KEY = 'spygram_dev_preview_lock';
const DEV_PREVIEW_LOCK_VALUE_KEY = 'spygram_dev_preview_lock_value';

export function isDevPreviewTimeLocked(): boolean {
  return import.meta.env.DEV && sessionStorage.getItem(DEV_PREVIEW_LOCK_KEY) === 'true';
}

export function getDevPreviewLockedSeconds(): number {
  const raw = sessionStorage.getItem(DEV_PREVIEW_LOCK_VALUE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Math.floor(PREVIEW_TRIAL_MS / 1000);
}

/** Congela o countdown da prévia em `seconds` (somente dev). */
export function setDevPreviewTimeLocked(locked: boolean, seconds?: number) {
  if (!import.meta.env.DEV) return;

  if (locked) {
    const secs = seconds ?? getDevPreviewLockedSeconds();
    sessionStorage.setItem(DEV_PREVIEW_LOCK_KEY, 'true');
    sessionStorage.setItem(DEV_PREVIEW_LOCK_VALUE_KEY, String(secs));
    sessionStorage.setItem('invasionEndTime', String(Date.now() + secs * 1000));
    localStorage.removeItem('spygram_trial_expired');
    return;
  }

  sessionStorage.removeItem(DEV_PREVIEW_LOCK_KEY);
  sessionStorage.removeItem(DEV_PREVIEW_LOCK_VALUE_KEY);
}

/** Limpa estado de invasão/trial para nova consulta (uso em dev). */
export function resetSpygramDevSession() {
  LOCAL_INVASION_KEYS.forEach((key) => localStorage.removeItem(key));
  SESSION_INVASION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}
