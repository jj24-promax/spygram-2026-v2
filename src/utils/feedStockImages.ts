import type { SuggestedProfile } from '../../types';
import { classifyGender } from './genderClassifier';
import {
  filterInteractionProfiles,
  getInteractionGender,
  getOppositeGender,
  resolveProfileGender,
  type AppGender,
} from './interactionGender';

const PEOPLE_BASE = '/people-stock';

/** Retratos femininos reais — banco local */
const FEED_STOCK_FEMALE = [
  '/people-stock/female-01.jpg',
  '/people-stock/female-02.jpg',
  '/people-stock/female-03.jpg',
  '/people-stock/female-04.jpg',
  '/people-stock/female-05.jpg',
  '/people-stock/female-06.jpg',
  '/people-stock/female-07.jpg',
  '/people-stock/female-08.jpg',
  '/people-stock/female-09.jpg',
  '/people-stock/female-10.jpg',
  '/people-stock/female-11.jpg',
  '/people-stock/female-12.jpg',
  '/people-stock/female-13.jpg',
  '/people-stock/female-14.jpg',
  '/people-stock/female-15.jpg',
  '/people-stock/female-16.jpg',
  '/people-stock/female-17.jpg',
  '/people-stock/female-18.jpg',
  '/people-stock/female-19.jpg',
  '/people-stock/female-20.webp',
  '/people-stock/female-21.webp',
  '/people-stock/female-22.webp',
  '/people-stock/female-23.webp',
  '/people-stock/female-24.webp',
  '/people-stock/female-25.webp',
  '/people-stock/female-26.webp',
  '/people-stock/female-27.webp',
  '/people-stock/female-28.webp',
] as const;

/** Retratos masculinos reais — banco local */
const FEED_STOCK_MALE = [
  '/people-stock/male-01.jpg',
  '/people-stock/male-02.jpg',
  '/people-stock/male-03.jpg',
  '/people-stock/male-04.jpg',
  '/people-stock/male-05.jpg',
  '/people-stock/male-06.jpg',
  '/people-stock/male-07.jpg',
  '/people-stock/male-08.jpg',
  '/people-stock/male-09.jpg',
  '/people-stock/male-10.webp',
  '/people-stock/male-11.webp',
  '/people-stock/male-12.webp',
  '/people-stock/male-13.webp',
  '/people-stock/male-14.webp',
  '/people-stock/male-15.webp',
  '/people-stock/male-16.webp',
  '/people-stock/male-17.webp',
  '/people-stock/male-18.webp',
] as const;

export const FEED_STOCK_POOL = [...FEED_STOCK_FEMALE, ...FEED_STOCK_MALE] as const;

function hashToIndex(seed: string | number, length: number): number {
  if (length <= 0) return 0;
  if (typeof seed === 'number') return Math.abs(seed) % length;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % length;
  }
  return hash;
}

function pickFromPool(pool: readonly string[], seed: string | number): string {
  return pool[hashToIndex(seed, pool.length)];
}

export function resolveFeedGender(
  username: string,
  fullName: string | undefined,
  suggestedProfiles: SuggestedProfile[] = []
): 'male' | 'female' | 'unknown' {
  const match = suggestedProfiles.find(
    (profile) => profile.username.toLowerCase() === username.toLowerCase()
  );

  if (match?.gender && match.gender !== 'unknown') {
    return match.gender;
  }

  const nameSource = fullName?.trim() || username;
  return classifyGender(nameSource, username, '');
}

function resolveGenderPool(
  seed: string | number,
  gender: 'male' | 'female' | 'unknown'
): readonly string[] {
  if (gender === 'female') return FEED_STOCK_FEMALE;
  if (gender === 'male') return FEED_STOCK_MALE;
  return hashToIndex(seed, 2) === 0 ? FEED_STOCK_MALE : FEED_STOCK_FEMALE;
}

function pickUniqueFromPool(
  pool: readonly string[],
  seed: string | number,
  used: Set<string>
): string {
  if (pool.length === 0) return FEED_STOCK_POOL[0];

  const start = hashToIndex(seed, pool.length);
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(start + i) % pool.length];
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  // Pool esgotado para este gênero — tenta qualquer foto ainda não usada no feed
  for (const candidate of FEED_STOCK_POOL) {
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }

  // Mais posts do que fotos disponíveis: reutiliza com menor colisão possível
  return pool[start];
}

/**
 * Atribui uma foto diferente para cada slot do feed (sem repetir dentro da lista).
 */
export function assignUniqueFeedStockImages(
  slots: ReadonlyArray<{
    seed: string;
    username: string;
    fullName?: string;
  }>,
  suggestedProfiles: SuggestedProfile[] = [],
  targetGender?: AppGender
): string[] {
  const used = new Set<string>();

  return slots.map((slot, index) => {
    const contactGender = resolveFeedGender(slot.username, slot.fullName, suggestedProfiles);
    const gender = targetGender
      ? getInteractionGender(targetGender, contactGender)
      : contactGender;
    const pool = resolveGenderPool(`${slot.seed}-${index}`, gender);
    return pickUniqueFromPool(pool, slot.seed, used);
  });
}

/**
 * Retrato real conforme gênero do nome.
 * Feminino → mulher; masculino → homem; desconhecido → sorteio estável entre os dois.
 */
export function getFeedStockImage(
  seed: string | number,
  gender: 'male' | 'female' | 'unknown' = 'unknown'
): string {
  return pickFromPool(resolveGenderPool(seed, gender), seed);
}

export function getFeedStockImageForUser(
  seed: string | number,
  username: string,
  fullName: string | undefined,
  suggestedProfiles: SuggestedProfile[] = [],
  targetGender?: AppGender
): string {
  const contactGender = resolveFeedGender(username, fullName, suggestedProfiles);
  const gender = targetGender
    ? getInteractionGender(targetGender, contactGender)
    : contactGender;
  return getFeedStockImage(seed, gender);
}

/** Alias semântico para avatares (notas, stories, cabeçalho do feed) */
export const getPeoplePortraitForUser = getFeedStockImageForUser;

export function isLocalStockAvatar(url?: string): boolean {
  if (!url) return true;
  return url === '/perfil.jpg' || url.startsWith('/people-stock/');
}

/** Mantém miniaturas da API; stock local segue o sexo oposto ao alvo. */
export function enrichSuggestedProfilesWithPeoplePhotos(
  profiles: SuggestedProfile[],
  targetGender?: AppGender
): SuggestedProfile[] {
  const interactionProfiles = filterInteractionProfiles(profiles, targetGender);
  const interactionGender = getOppositeGender(targetGender);

  return interactionProfiles.map((profile, index) => {
    const isOppositeContact =
      !targetGender ||
      targetGender === 'unknown' ||
      resolveProfileGender(profile) === interactionGender;

    const shouldUseStock =
      isLocalStockAvatar(profile.profile_pic_url) || !isOppositeContact;

    return {
      ...profile,
      gender: interactionGender !== 'unknown' ? interactionGender : profile.gender,
      profile_pic_url: shouldUseStock
        ? getFeedStockImageForUser(
            `${profile.username}-suggested-${index}`,
            profile.username,
            profile.fullName,
            interactionProfiles,
            targetGender
          )
        : profile.profile_pic_url,
    };
  });
}

export { PEOPLE_BASE };
