import type { FeedPost, ProfileData, SuggestedProfile } from '../../types';
import { getCitiesByState, getUserLocation } from '../services/geolocationService';
import { fetchFullInvasionData } from '../services/profileService';
import { enrichSuggestedProfilesWithPeoplePhotos } from './feedStockImages';
import { resolveTargetGender } from './genderClassifier';

export interface InvasionData {
  profileData: ProfileData;
  suggestedProfiles: SuggestedProfile[];
  posts: FeedPost[];
  userCity?: string;
  locations?: string[];
}

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export function readInvasionData(): InvasionData | null {
  const raw =
    sessionStorage.getItem('invasionData') ?? localStorage.getItem('spygram_active_invasion');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as InvasionData;
  } catch {
    return null;
  }
}

export function persistInvasionData(data: InvasionData) {
  const json = JSON.stringify(data);
  sessionStorage.setItem('invasionData', json);
  localStorage.setItem('spygram_active_invasion', json);
  window.dispatchEvent(new CustomEvent('spygram:invasion-data-updated'));
}

export function isInvasionDataComplete(data: InvasionData | null | undefined): boolean {
  return !!(
    data?.profileData &&
    data.suggestedProfiles?.length > 0 &&
    data.posts?.length > 0 &&
    data.locations?.length
  );
}

let prefetchPromise: Promise<InvasionData | null> | null = null;

export function resetInvasionPrefetchCache() {
  prefetchPromise = null;
}

export async function loadInvasionFeedData(
  profileData: ProfileData,
  existing?: InvasionData | null
): Promise<InvasionData> {
  const base =
    existing ??
    readInvasionData() ??
    ({
      profileData,
      suggestedProfiles: [],
      posts: [],
    } satisfies InvasionData);

  if (isInvasionDataComplete(base)) {
    return base;
  }

  let userCity = base.userCity || 'São Paulo';
  let cityList = base.locations || [];

  if (!cityList.length) {
    try {
      const locationData = await getUserLocation();
      cityList = getCitiesByState(locationData.city, locationData.state);
      userCity = locationData.city;
    } catch {
      cityList = getCitiesByState('São Paulo', 'São Paulo');
    }
  }

  let finalSuggestions = base.suggestedProfiles || [];
  let finalPosts = base.posts || [];

  if (!finalPosts.length) {
    const { suggestions, posts: fetchedPosts } = await fetchFullInvasionData(profileData);
    if (suggestions.length > 0) {
      finalSuggestions = suggestions;
    }
    if (fetchedPosts.length > 0) {
      finalPosts = shuffle(fetchedPosts);
    }
  }

  finalSuggestions = enrichSuggestedProfilesWithPeoplePhotos(
    finalSuggestions.length > 0 ? finalSuggestions : base.suggestedProfiles || [],
    resolveTargetGender(profileData)
  );

  const fullData: InvasionData = {
    profileData,
    suggestedProfiles: finalSuggestions,
    posts: finalPosts,
    userCity,
    locations: cityList,
  };

  persistInvasionData(fullData);
  return fullData;
}

/** Carrega feed/direct em background enquanto o usuário assiste ao VSL. */
export function prefetchInvasionFeedData(profileData: ProfileData): Promise<InvasionData | null> {
  if (!prefetchPromise) {
    prefetchPromise = loadInvasionFeedData(profileData)
      .then((data) => data)
      .catch((error) => {
        console.error('Erro no prefetch da invasão:', error);
        prefetchPromise = null;
        return readInvasionData();
      });
  }

  return prefetchPromise;
}
