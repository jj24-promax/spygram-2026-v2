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
  'spygram_free_consultation_used',
  'spygram_free_consultation_username',
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

const FREE_CONSULTATION_USED_KEY = 'spygram_free_consultation_used';
const FREE_CONSULTATION_USERNAME_KEY = 'spygram_free_consultation_username';

/** Consulta gratuita já consumida neste navegador (persiste após F5). */
export function hasUsedFreeConsultation(): boolean {
  return localStorage.getItem(FREE_CONSULTATION_USED_KEY) === 'true';
}

export function getFreeConsultationUsername(): string | null {
  return localStorage.getItem(FREE_CONSULTATION_USERNAME_KEY);
}

/** Marca a única consulta teste como usada — sobrevive a reload e nova aba no mesmo browser. */
export function markFreeConsultationUsed(username: string) {
  localStorage.setItem(FREE_CONSULTATION_USED_KEY, 'true');
  localStorage.setItem(FREE_CONSULTATION_USERNAME_KEY, username.replace(/^@/, '').trim().toLowerCase());
}

/**
 * Fluxo de invasão ainda em andamento (VSL ou prévia ativa).
 * Não conta invasão expirada — nesse caso bloqueia nova consulta.
 */
export function hasOngoingInvasionFlow(): boolean {
  if (!localStorage.getItem('spygram_active_invasion')) return false;
  if (sessionStorage.getItem('spygram_vsl_active') === 'true') return true;
  if (hasActiveInvasionTrial()) return true;
  return false;
}

/** Pode iniciar nova busca de @ na landing. Membros logados ignoram o limite. */
export function canStartFreeConsultation(isLoggedIn = false): boolean {
  if (isLoggedIn) return true;
  return !hasUsedFreeConsultation();
}

export function getFreeConsultationBlockedMessage(): string {
  const username = getFreeConsultationUsername();
  const targetHint = username ? ` (@${username})` : '';
  return `Você já utilizou sua única consulta gratuita neste navegador${targetHint}. Desbloqueie o acesso completo para continuar.`;
}

/** Limpa estado de invasão/trial para nova consulta (uso em dev). */
export function resetSpygramDevSession() {
  LOCAL_INVASION_KEYS.forEach((key) => localStorage.removeItem(key));
  SESSION_INVASION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}
