import type { SuggestedProfile } from '../../types';
import { getFeedStockImageForUser, isLocalStockAvatar } from './feedStockImages';
import type { AppGender } from './interactionGender';
import { maskContactName } from './targetName';

/** Índice do perfil sugerido para cada slot do Direct (lista de conversas) */
export const CHAT_PROFILE_INDEX: Record<string, number> = {
  fer: 0,
  itx: 1,
  toh: 2,
  and: 3,
  bru: 4,
  rog: 5,
  bab: 6,
};

/** Índice do perfil sugerido para cada nota (stories do Direct) */
export const STORY_PROFILE_INDEX: Record<string, number> = {
  dee: 7,
  bab: 8,
  swi: 9,
};

export function getSuggestedProfileAt(
  profiles: SuggestedProfile[],
  index: number
): SuggestedProfile | null {
  if (!profiles.length) return null;
  return profiles[Math.abs(index) % profiles.length];
}

export function getSuggestedAvatar(
  profiles: SuggestedProfile[],
  index: number,
  targetGender?: AppGender
): string {
  const profile = getSuggestedProfileAt(profiles, index);
  if (!profile) {
    return getFeedStockImageForUser(
      `direct-fallback-${index}`,
      'contato',
      'Contato',
      profiles,
      targetGender
    );
  }

  if (!isLocalStockAvatar(profile.profile_pic_url)) {
    return profile.profile_pic_url;
  }

  return getFeedStockImageForUser(
    `${profile.username}-direct-avatar-${index}`,
    profile.username,
    profile.fullName,
    profiles,
    targetGender
  );
}

export function getSuggestedDisplayName(profiles: SuggestedProfile[], index: number): string {
  const profile = getSuggestedProfileAt(profiles, index);
  if (!profile) return 'Contato*****';

  const raw = profile.fullName?.trim() || profile.username.replace(/^@/, '');
  const firstName = raw.split(/\s+/)[0] || profile.username;
  return maskContactName(firstName);
}
