// As URLs da RapidAPI não são mais usadas diretamente pelo frontend
// export const API_BASE = 'https://instagram-scraper-stable-api.p.rapidapi.com';
// export const PROXY_FOLLOWERS_URL = `${API_BASE}/ig_get_fb_profile_hover.php`;
export const MIN_LOADING_DURATION = 3000; // 3 segundos, ajustado para uma experiência mais fluida

export const MOCK_MALE_NAMES = [
  'Pedro', 'Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Rafael', 'Felipe', 'Bruno',
  'Leonardo', 'Vinicius', 'Thiago', 'Rodrigo', 'Carlos', 'Eduardo', 'Daniel', 'Joaquim',
  'Enzo', 'Arthur', 'Gustavo', 'Henrique', 'Murilo', 'Otavio', 'Victor', 'Samuel'
];

export const MOCK_FEMALE_NAMES = [
  'Ana', 'Gabriela', 'Mariana', 'Juliana', 'Beatriz', 'Larissa', 'Camila', 'Amanda',
  'Fernanda', 'Isabela', 'Laura', 'Leticia', 'Sofia', 'Manuela', 'Clara', 'Valentina',
  'Giovanna', 'Beatriz', 'Carolina', 'Juliana', 'Alice', 'Julia', 'Bianca', 'Luana'
];

export const MOCK_SUGGESTION_NAMES = [
  ...MOCK_FEMALE_NAMES,
  ...MOCK_MALE_NAMES
];