import { PREVIEW_TRIAL_MS } from '../constants/analysisFlow';

export const INVASION_TRIAL_DURATION_MS = 120 * 1000;

export const INVASION_DEMO_PATHS = ['/instagram', '/messages', '/notifications', '/chat'];

const INVASION_END_TIME_KEY = 'spygram_invasion_end_time';

function readInvasionEndTimeRaw(): string | null {
  return localStorage.getItem(INVASION_END_TIME_KEY) ?? sessionStorage.getItem('invasionEndTime');
}

export function getInvasionTrialEndTime(): number | null {
  const raw = readInvasionEndTimeRaw();
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return null;
  if (!localStorage.getItem(INVASION_END_TIME_KEY) && sessionStorage.getItem('invasionEndTime')) {
    localStorage.setItem(INVASION_END_TIME_KEY, raw);
  }
  return parsed;
}

function persistInvasionEndTime(endMs: number) {
  const value = String(endMs);
  localStorage.setItem(INVASION_END_TIME_KEY, value);
  sessionStorage.setItem('invasionEndTime', value);
}

/** Atualiza o fim do trial (ex.: lock de dev no countdown). */
export function setInvasionTrialEndTime(endMs: number) {
  persistInvasionEndTime(endMs);
}

function clearInvasionEndTime() {
  localStorage.removeItem(INVASION_END_TIME_KEY);
  sessionStorage.removeItem('invasionEndTime');
}

export function startInvasionTrialSession(durationMs = INVASION_TRIAL_DURATION_MS) {
  localStorage.removeItem('spygram_trial_expired');
  persistInvasionEndTime(Date.now() + durationMs);
}

/** Prévia de 1 minuto no feed / direct / notificações */
export function startPreviewTrialSession(force = false) {
  if (!force && hasActiveInvasionTrial()) return;
  startInvasionTrialSession(PREVIEW_TRIAL_MS);
}

/** Inicia a prévia só se ainda não existir timer válido (não reseta no F5). */
export function ensurePreviewTrialSession() {
  if (hasActiveInvasionTrial() || isPreviewTrialExpired()) return;
  startPreviewTrialSession(true);
}

export function hasActiveInvasionTrial(): boolean {
  const endTime = getInvasionTrialEndTime();
  if (!endTime) return false;
  return Date.now() < endTime;
}

export function isPreviewTrialExpired(): boolean {
  return localStorage.getItem('spygram_trial_expired') === 'true';
}

export function expireInvasionTrial() {
  clearInvasionEndTime();
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
  clearInvasionEndTime();
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
  'spygram_invasion_end_time',
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
    persistInvasionEndTime(Date.now() + secs * 1000);
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
