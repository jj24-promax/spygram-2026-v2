import type { ProfileData, SuggestedProfile } from '../../types';
import { MOCK_FEMALE_NAMES, MOCK_MALE_NAMES } from '../../constants';
import { classifyGender } from './genderClassifier';

export type AppGender = ProfileData['gender'];

export function getOppositeGender(gender?: AppGender): AppGender {
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return 'unknown';
}

export function resolveProfileGender(profile: SuggestedProfile): AppGender {
  if (profile.gender && profile.gender !== 'unknown') {
    return profile.gender;
  }
  return classifyGender(profile.fullName || '', profile.username, '');
}

/** Gênero dos contatos/interações (sempre oposto ao alvo quando conhecido). */
export function getInteractionGender(
  targetGender?: AppGender,
  contactGender?: AppGender
): AppGender {
  const opposite = getOppositeGender(targetGender);
  if (opposite !== 'unknown') return opposite;
  if (contactGender && contactGender !== 'unknown') return contactGender;
  return 'unknown';
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return hash;
}

function buildSyntheticProfiles(gender: 'male' | 'female', count: number): SuggestedProfile[] {
  const names = gender === 'male' ? MOCK_MALE_NAMES : MOCK_FEMALE_NAMES;

  return Array.from({ length: count }, (_, index) => {
    const name = names[index % names.length];
    const suffix = hashSeed(`${name}-${index}`) % 100;

    return {
      username: `${name.toLowerCase().replace(/\s+/g, '')}${suffix}`,
      fullName: name,
      profile_pic_url: '/perfil.jpg',
      is_private: true,
      gender,
    };
  });
}

/**
 * Garante perfis apenas do sexo oposto ao alvo.
 * Se a API não trouxer ninguém do sexo oposto, gera contatos sintéticos.
 */
export function filterInteractionProfiles(
  profiles: SuggestedProfile[],
  targetGender?: AppGender
): SuggestedProfile[] {
  const opposite = getOppositeGender(targetGender);
  if (opposite === 'unknown') return profiles;

  const fromApi = profiles.filter((profile) => resolveProfileGender(profile) === opposite);

  const pool =
    fromApi.length > 0
      ? fromApi.slice(0, 12)
      : buildSyntheticProfiles(opposite, 12);

  return pool.map((profile) => ({
    ...profile,
    gender: opposite,
  }));
}

/** Frase do contato conforme o sexo oposto ao alvo (ex.: sozinha/sozinho). */
export function genderizeContactPhrase(
  feminine: string,
  masculine: string,
  targetGender?: AppGender
): string {
  if (targetGender === 'female') return masculine;
  if (targetGender === 'male') return feminine;
  return feminine;
}
