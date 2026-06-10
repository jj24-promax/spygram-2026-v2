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
 * Garante 100% de perfis do sexo oposto ao do alvo, convertendo perfis inadequados.
 */
function prioritizeOppositeGender(suggestions: SuggestedProfile[], targetGender?: 'male' | 'female' | 'unknown'): SuggestedProfile[] {
    if (!targetGender || targetGender === 'unknown') return suggestions;
    
    const oppositeGender = targetGender === 'male' ? 'female' : 'male';
    const oppositeNames = targetGender === 'male' ? MOCK_FEMALE_NAMES : MOCK_MALE_NAMES;

    // Filtra somente os que já são naturalmente do gênero oposto
    const opposites = suggestions.filter(p => p.gender === oppositeGender);
    const result = [...opposites];
    
    // Converte os perfis restantes de mesmo sexo em clones perfeitos do sexo oposto
    suggestions.forEach(p => {
      if (p.gender !== oppositeGender && result.length < 12) {
        const randomName = oppositeNames[Math.floor(Math.random() * oppositeNames.length)];
        const newUsername = randomName.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100);
        result.push({
          ...p,
          username: newUsername,
          fullName: randomName,
          gender: oppositeGender
        });
      }
    });

    // Se ainda faltar perfis para preencher a grade, gera novos mockups femininos/masculinos
    while (result.length < 12) {
      const randomName = oppositeNames[Math.floor(Math.random() * oppositeNames.length)];
      const newUsername = randomName.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100);
      result.push({
        username: newUsername,
        fullName: randomName,
        profile_pic_url: '/perfil.jpg',
        is_private: Math.random() > 0.3,
        gender: oppositeGender
      });
    }

    return result;
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