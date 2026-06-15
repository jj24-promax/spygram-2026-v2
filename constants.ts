import { BRAZILIAN_FEMALE_NAMES, BRAZILIAN_MALE_NAMES } from './brazilianNames';

// As URLs da RapidAPI não são mais usadas diretamente pelo frontend
// export const API_BASE = 'https://instagram-scraper-stable-api.p.rapidapi.com';
// export const PROXY_FOLLOWERS_URL = `${API_BASE}/ig_get_fb_profile_hover.php`;
export const MIN_LOADING_DURATION = 3000; // 3 segundos, ajustado para uma experiência mais fluida

export const MOCK_MALE_NAMES = [...BRAZILIAN_MALE_NAMES];
export const MOCK_FEMALE_NAMES = [...BRAZILIAN_FEMALE_NAMES];

export const MOCK_SUGGESTION_NAMES = [
  ...MOCK_FEMALE_NAMES,
  ...MOCK_MALE_NAMES,
];
