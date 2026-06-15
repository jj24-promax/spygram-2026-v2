import type { ProfileData, SuggestedProfile, FetchResult, FeedPost, PostUser, Post } from '../../types';
import { supabase } from '../integrations/supabase/client';
import { classifyGender } from '../utils/genderClassifier'; // Importando classificador
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES } from '../../constants';

// ===================================
// UTILITY FUNCTIONS
// ===================================

const getProxyImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.includes('weserv.nl')) {
        return imageUrl;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&q=80`;
};

const getProxyImageUrlLight = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:') || imageUrl.includes('weserv.nl')) {
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
 * Detecta se um perfil é estrangeiro (gringo) ou esquisito baseado em nomes comuns,
 * termos em inglês no username e padrões de caracteres não-latinos ou repetitivos.
 */
function isBrazilianProfile(fullName: string, username: string): boolean {
    const full = (fullName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const user = (username || '').toLowerCase();

    // 1. Rejeita nomes absurdamente curtos ou com caracteres repetidos repetitivos (ex: "AAA", "A", "BB")
    const cleanName = full.replace(/[^a-zA-Z]/g, '');
    if (cleanName.length > 0) {
        if (cleanName.length < 3) return false;
        // Se todos os caracteres forem iguais (ex: "AAA", "aaaa")
        if (/^(.)\1+$/.test(cleanName)) return false;
    }

    // 2. Rejeita caracteres não-latinos (árabe, cirílico, chinês, japonês, etc.)
    if (/[^\x00-\x7F\u00C0-\u017F]/.test(fullName || '')) {
        return false;
    }

    // 3. Padrões de sobrenomes estrangeiros/gringos claros (russos, eslavos, árabes, turcos, indianos, asiáticos)
    const foreignSuffixes = [
        'ov', 'ova', 'ev', 'eva', 'oglu', 'shvili', 'adze', 'ic', 'ich', 
        'yev', 'yeva', 'yan', 'ian', 'berg', 'stein', 'mann', 'sen', 
        'sson', 'sdottir', 'almat', 'maxsud', 'haad', 'dil', 'sky', 'ska'
    ];
    
    const nameWords = full.split(/\s+/);
    for (const word of nameWords) {
        if (foreignSuffixes.some(suffix => word.endsWith(suffix))) {
            return false;
        }
    }
    if (foreignSuffixes.some(suffix => user.includes(suffix))) {
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
        'lee', 'perez', 'thompson', 'white', 'sanchez', 'harris', 'ramirez', 'clark', 'lewis', 'robinson', 'walker',
        'dildora', 'maxsudova', 'almatov'
    ];

    if (nameWords.some(word => gringoNames.includes(word))) {
        return false;
    }

    // 4. Se o nome completo for vazio, o username não deve conter sequências incompreensíveis
    if (!fullName || fullName.trim() === '') {
        // Sequências estranhas de mais de 4 consoantes consecutivas (difíceis de pronunciar em PT-BR)
        if (/[bcdfghjklmnpqrstvwxyz]{4,}/.test(user)) {
            return false;
        }
    }

    return true;
}

/**
 * Filtra perfis estrangeiros (gringos) e reorganiza a lista para priorizar perfis brasileiros 
 * do sexo oposto ao do alvo no topo das sugestões, mas mantendo perfis brasileiros reais do mesmo sexo logo abaixo.
 */
function prioritizeOppositeGender(suggestions: SuggestedProfile[], targetGender?: 'male' | 'female' | 'unknown'): SuggestedProfile[] {
    const oppositeGender = targetGender === 'male' ? 'female' : targetGender === 'female' ? 'male' : (Math.random() > 0.5 ? 'female' : 'male');
    
    const oppositeNames = oppositeGender === 'female' ? MOCK_FEMALE_NAMES : MOCK_MALE_NAMES;

    // 1. Filtra a lista original mantendo apenas perfis legitimamente brasileiros
    const validBrazilianProfiles = suggestions.filter(p => isBrazilianProfile(p.fullName || '', p.username));

    const oppositeGenderProfiles = validBrazilianProfiles.filter(p => p.gender === oppositeGender);
    let result: SuggestedProfile[] = [...oppositeGenderProfiles];

    if (result.length < 12) {
        const neededCount = 12 - result.length;
        const shuffledOpposite = shuffleArray([...oppositeNames]);

        for (let i = 0; i < neededCount; i++) {
            const name = shuffledOpposite[i % shuffledOpposite.length];
            
            const separators = ['.', '_', ''];
            const sep = separators[Math.floor(Math.random() * separators.length)];
            const suffixes = ['', '_sp', '_rj', '12', '21', '_', '01'];
            const suf = suffixes[Math.floor(Math.random() * suffixes.length)];
            
            const username = `${name.toLowerCase()}${sep}${suf}`.replace(/\s+/g, '').substring(0, 15);

            result.push({
                username: username,
                fullName: name,
                profile_pic_url: '/perfil.jpg',
                is_private: Math.random() > 0.3,
                gender: oppositeGender
            });
        }
    }

    return result.slice(0, 12).map((profile) => ({ ...profile, gender: oppositeGender }));
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
            const usernameStem = cleanUsername.split(/[._]/)[0] || cleanUsername;
            const targetGender = classifyGender(fullName, usernameStem, bio);

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
        }

        // FILTRO: Identifica os perfis que NÃO são privados (Abertos)
        // Pegamos os 4 primeiros perfis abertos para buscar posts reais
        const openProfiles = suggestions.filter(p => p.is_private === false).slice(0, 4);

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
        return { suggestions: [], posts: [] };
    }
}