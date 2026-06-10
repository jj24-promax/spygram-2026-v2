import type { ProfileData, SuggestedProfile, FetchResult, FeedPost, PostUser, Post } from '../../types';
import { supabase } from '../integrations/supabase/client';
import { classifyGender } from '../utils/genderClassifier'; // Importando classificador
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES } from '../../constants';

// ===================================
// REAL ACTIVE BRAZILIAN PROFILES (Fallback real, sem mockups)
// ===================================

const REAL_FEMALE_PROFILES: SuggestedProfile[] = [
  { username: 'jadepicon', fullName: 'Jade Picon', profile_pic_url: 'https://unavatar.io/instagram/jadepicon', is_private: false, gender: 'female' },
  { username: 'rafakalimann', fullName: 'Rafa Kalimann', profile_pic_url: 'https://unavatar.io/instagram/rafakalimann', is_private: false, gender: 'female' },
  { username: 'gabiluthai', fullName: 'Gabi Luthai', profile_pic_url: 'https://unavatar.io/instagram/gabiluthai', is_private: false, gender: 'female' },
  { username: 'larissamanoela', fullName: 'Larissa Manoela', profile_pic_url: 'https://unavatar.io/instagram/larissamanoela', is_private: false, gender: 'female' },
  { username: 'maisa', fullName: 'Maisa Silva', profile_pic_url: 'https://unavatar.io/instagram/maisa', is_private: false, gender: 'female' },
  { username: 'brunamarquezine', fullName: 'Bruna Marquezine', profile_pic_url: 'https://unavatar.io/instagram/brunamarquezine', is_private: false, gender: 'female' },
  { username: 'marinaruybarbosa', fullName: 'Marina Ruy Barbosa', profile_pic_url: 'https://unavatar.io/instagram/marinaruybarbosa', is_private: false, gender: 'female' },
  { username: 'virginia', fullName: 'Virginia Fonseca', profile_pic_url: 'https://unavatar.io/instagram/virginia', is_private: false, gender: 'female' },
  { username: 'luisasonza', fullName: 'Luísa Sonza', profile_pic_url: 'https://unavatar.io/instagram/luisasonza', is_private: false, gender: 'female' },
  { username: 'bocarosa', fullName: 'Bianca Andrade', profile_pic_url: 'https://unavatar.io/instagram/bocarosa', is_private: false, gender: 'female' },
  { username: 'yasminbrunet', fullName: 'Yasmin Brunet', profile_pic_url: 'https://unavatar.io/instagram/yasminbrunet', is_private: false, gender: 'female' },
  { username: 'gisele', fullName: 'Gisele Bündchen', profile_pic_url: 'https://unavatar.io/instagram/gisele', is_private: false, gender: 'female' }
];

const REAL_MALE_PROFILES: SuggestedProfile[] = [
  { username: 'neymarjr', fullName: 'Neymar Jr', profile_pic_url: 'https://unavatar.io/instagram/neymarjr', is_private: false, gender: 'male' },
  { username: 'whinderssonnunes', fullName: 'Whindersson Nunes', profile_pic_url: 'https://unavatar.io/instagram/whinderssonnunes', is_private: false, gender: 'male' },
  { username: 'felipeneto', fullName: 'Felipe Neto', profile_pic_url: 'https://unavatar.io/instagram/felipeneto', is_private: false, gender: 'male' },
  { username: 'alok', fullName: 'Alok', profile_pic_url: 'https://unavatar.io/instagram/alok', is_private: false, gender: 'male' },
  { username: 'gusttavolima', fullName: 'Gusttavo Lima', profile_pic_url: 'https://unavatar.io/instagram/gusttavolima', is_private: false, gender: 'male' },
  { username: 'luansantana', fullName: 'Luan Santana', profile_pic_url: 'https://unavatar.io/instagram/luansantana', is_private: false, gender: 'male' },
  { username: 'gabrielmedina', fullName: 'Gabriel Medina', profile_pic_url: 'https://unavatar.io/instagram/gabrielmedina', is_private: false, gender: 'male' },
  { username: 'caiocastro', fullName: 'Caio Castro', profile_pic_url: 'https://unavatar.io/instagram/caiocastro', is_private: false, gender: 'male' },
  { username: 'lucaslucco', fullName: 'Lucas Lucco', profile_pic_url: 'https://unavatar.io/instagram/lucaslucco', is_private: false, gender: 'male' },
  { username: 'rodrigofaro', fullName: 'Rodrigo Faro', profile_pic_url: 'https://unavatar.io/instagram/rodrigofaro', is_private: false, gender: 'male' },
  { username: 'carlinhos', fullName: 'Carlinhos Maia', profile_pic_url: 'https://unavatar.io/instagram/carlinhos', is_private: false, gender: 'male' },
  { username: 'arthuraguiar', fullName: 'Arthur Aguiar', profile_pic_url: 'https://unavatar.io/instagram/arthuraguiar', is_private: false, gender: 'male' }
];

// ===================================
// UTILITY FUNCTIONS
// ===================================

const getProxyImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.includes('weserv.nl') || imageUrl.includes('unavatar.io')) {
        return imageUrl;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&q=80`;
};

const getProxyImageUrlLight = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.includes('weserv.nl') || imageUrl.includes('unavatar.io')) {
        return imageUrl;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=80&h=80&fit=cover&q=50`;
};

function shuffleArray(array: any[]): any[] {
    return [...array].sort(() => Math.random() - 0.5);
}

const simpleFetch = async (campo: string, username: string): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const { data, error } = await supabase.functions.invoke('proxy-api', {
            body: { campo, username },
        });

        clearTimeout(timeoutId);

        if (error) throw new Error(`Erro ao contatar o servidor: ${error.message}`);
        if (data.error) throw new Error(`Erro no servidor: ${data.error}`);
        
        return data;
    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
};

/**
 * Detecta se um perfil é estrangeiro (gringo) baseado em nomes comuns,
 * termos em inglês no username e caracteres especiais não-latinos.
 */
function isBrazilianProfile(fullName: string, username: string): boolean {
    const full = (fullName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const user = (username || '').toLowerCase();

    // Caracteres não-latinos (árabe, cirílico, chinês, japonês, etc.)
    if (/[^\x00-\x7F\u00C0-\u017F]/.test(fullName || '')) {
        return false;
    }

    // Termos muito comuns em usernames gringos comerciais ou fakes
    const gringoUserTerms = ['official', 'the', 'real', 'iam', 'its', 'mr', 'mrs', 'miss', 'model', 'fit', 'fitness', 'private', 'agency', 'page'];
    if (gringoUserTerms.some(term => user.startsWith(term) || user.endsWith(term))) {
        return false;
    }

    // Lista de nomes e sobrenomes gringos muito comuns
    const gringoNames = [
        'john', 'david', 'michael', 'james', 'robert', 'mary', 'patricia', 'linda', 'elizabeth', 'sarah', 'william',
        'emily', 'jessica', 'ashley', 'taylor', 'kevin', 'karen', 'brian', 'steven', 'alex', 'chris', 'mike', 'kim',
        'ali', 'mohamed', 'youssef', 'smith', 'johnson', 'williams', 'brown', 'jones', 'miller', 'davis', 'garcia',
        'rodriguez', 'wilson', 'martinez', 'anderson', 'taylor', 'thomas', 'hernandez', 'moore', 'martin', 'jackson',
        'lee', 'perez', 'thompson', 'white', 'sanchez', 'harris', 'ramirez', 'clark', 'lewis', 'robinson', 'walker'
    ];

    const words = full.split(/\s+/);
    if (words.some(word => gringoNames.includes(word))) {
        return false;
    }

    return true;
}

/**
 * Filtra e remove completamente perfis estrangeiros (gringos),
 * mantendo apenas perfis brasileiros do sexo oposto.
 * Se houver menos que 12 perfis legítimos restantes, preenche com novos perfis brasileiros REAIS e ATIVOS de famosos.
 */
function prioritizeOppositeGender(suggestions: SuggestedProfile[], targetGender?: 'male' | 'female' | 'unknown'): SuggestedProfile[] {
    const oppositeGender = targetGender === 'male' ? 'female' : targetGender === 'female' ? 'male' : (Math.random() > 0.5 ? 'female' : 'male');
    const fallbackProfiles = oppositeGender === 'female' ? REAL_FEMALE_PROFILES : REAL_MALE_PROFILES;

    // 1. Filtra a lista original mantendo brasileiros e excluindo apenas os que são explicitamente do MESMO gênero que o alvo
    const validBrazilianProfiles = suggestions.filter(p => {
        const isBraz = isBrazilianProfile(p.fullName || '', p.username);
        // Exclui apenas se for do mesmo gênero que o alvo. Se for desconhecido ou sexo oposto, mantém!
        const isSameGender = targetGender && p.gender && p.gender === targetGender;
        return isBraz && !isSameGender;
    });

    const result: SuggestedProfile[] = [...validBrazilianProfiles];

    // 2. Completa com perfis brasileiros reais e verificados do sexo oposto se faltar
    if (result.length < 12) {
        const neededCount = 12 - result.length;
        const shuffledFallback = shuffleArray([...fallbackProfiles]);

        for (let i = 0; i < neededCount; i++) {
            result.push(shuffledFallback[i % shuffledFallback.length]);
        }
    }

    // Retorna exatamente as 12 sugestões limpas e 100% brasileiras
    return result.slice(0, 12);
}

// ===================================
// EXPORTED FUNCTIONS
// ===================================

export async function fetchProfileData(username: string): Promise<FetchResult> {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();
        if (!cleanUsername) throw new Error('Username inválido');

        const { data, error } = await supabase.functions.invoke('rapidapi-profile', {
            body: { username: cleanUsername },
        });

        if (error) throw new Error(`Erro na RapidAPI: ${error.message}`);

        const resultItem = data?.result?.[0];
        const user = resultItem?.user;

        if (user && user.username) {
            const bio = user.biography || '';
            const fullName = user.full_name || '';
            const targetGender = classifyGender(fullName, user.username, bio);

            const profile: ProfileData = {
                username: user.username,
                fullName: fullName,
                profilePicUrl: getProxyImageUrl(user.hd_profile_pic_url_info?.url || user.profile_pic_url),
                biography: bio,
                followers: user.follower_count || 0,
                following: user.following_count || 0,
                postsCount: user.media_count || 0,
                isVerified: user.is_verified || false,
                isPrivate: user.is_private || false,
                gender: targetGender, // Inteligência de gênero do Alvo
            };

            let suggestions: SuggestedProfile[] = [];
            
            const facepile = user.profile_context_facepile_users;
            const chaining = user.chaining_results || user.chaining_suggestions;

            const sourceArray = (Array.isArray(facepile) && facepile.length > 0) ? facepile : chaining;

            if (Array.isArray(sourceArray)) {
                suggestions = sourceArray.map((p: any) => ({
                    username: p.username,
                    profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                    fullName: p.full_name || '',
                    is_private: p.is_private === true,
                    gender: classifyGender(p.full_name || '', p.username, ''), // Inteligência de gênero das conexões
                }));
                
                // Embaralha e depois prioriza e força o gênero oposto
                suggestions = shuffleArray(suggestions);
                suggestions = prioritizeOppositeGender(suggestions, targetGender);
            } else {
                // Se a API falhar em trazer conexões do perfil (muito comum em contas privadas novas), injeta conexões reais brasileiras
                suggestions = prioritizeOppositeGender([], targetGender);
            }

            return { profile, suggestions, posts: [] };
        }
        throw new Error('Perfil não encontrado.');
    } catch (error) {
        console.error('❌ Erro no fetchProfileData:', error);
        throw error;
    }
}

export async function fetchFullInvasionData(profileData: ProfileData): Promise<{ suggestions: SuggestedProfile[], posts: FeedPost[] }> {
    const cleanUsername = profileData.username.replace(/^@+/, '').trim();
    
    try {
        // Busca sugestões (perfis em comum)
        const suggestionsResponse = await simpleFetch('perfis_sugeridos', cleanUsername).catch(() => null);

        let suggestions: SuggestedProfile[] = [];
        const suggestionsData = suggestionsResponse?.results?.[0]?.data;
        
        if (Array.isArray(suggestionsData)) {
            suggestions = suggestionsData.map((p: any) => ({
                username: p.username || '',
                fullName: p.full_name || p.username,
                profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                is_private: p.is_private === true,
                gender: classifyGender(p.full_name || '', p.username, ''), // Inteligência de gênero das conexões secundárias
            }));

            // Embaralha e depois prioriza e força o gênero oposto
            suggestions = shuffleArray(suggestions);
            suggestions = prioritizeOppositeGender(suggestions, profileData.gender);
        } else {
            // Se falhar (perfil privado), preenche com conexões de famosos brasileiros ativos
            suggestions = prioritizeOppositeGender([], profileData.gender);
        }

        // FILTRO: Identifica os perfis que NÃO são privados (Abertos)
        // Pegamos os 4 primeiros perfis abertos para buscar posts reais
        let openProfiles = suggestions.filter(p => p.is_private === false).slice(0, 4);

        // Se o perfil do alvo for privado e não trouxer perfis abertos nativos, mescla com os fallbacks reais públicos famosos
        if (openProfiles.length < 3) {
            const oppositeGender = profileData.gender === 'male' ? 'female' : profileData.gender === 'female' ? 'male' : 'female';
            const fallbackProfiles = oppositeGender === 'female' ? REAL_FEMALE_PROFILES : REAL_MALE_PROFILES;
            openProfiles = [...openProfiles, ...fallbackProfiles].slice(0, 4);
        }

        const postPromises = openProfiles.map(async (profile) => {
            try {
                // Chama a API de posts para cada perfil aberto
                const postsResponse = await simpleFetch('lista_posts', profile.username);
                const postsData = postsResponse?.results?.[0]?.data;
                
                if (Array.isArray(postsData) && postsData.length > 0) {
                    // Pegamos apenas o post mais recente de cada perfil para compor a timeline
                    const item = postsData[0]; 
                    return {
                        de_usuario: {
                            username: profile.username,
                            full_name: profile.fullName || profile.username,
                            profile_pic_url: profile.profile_pic_url,
                        },
                        post: {
                            id: item.id || String(Math.random()),
                            image_url: getProxyImageUrl(item.image_url || item.display_url),
                            video_url: item.video_url ? getProxyImageUrl(item.video_url) : undefined,
                            is_video: !!item.video_url || item.media_type === 2,
                            caption: item.caption || '',
                            like_count: item.like_count || Math.floor(Math.random() * 500) + 50,
                            comment_count: item.comment_count || Math.floor(Math.random() * 30) + 5,
                        }
                    };
                }
                return null;
            } catch (error) {
                return null;
            }
        });

        const resolvedPosts = await Promise.all(postPromises);
        // Remove nulos e retorna a lista de posts reais encontrados
        const posts = resolvedPosts.filter((p): p is FeedPost => p !== null);

        return { suggestions, posts };

    } catch (error) {
        // Se der qualquer erro geral, reconstrói com sugestões reais fallbacks
        const suggestions = prioritizeOppositeGender([], profileData.gender);
        return { suggestions, posts: [] };
    }
}