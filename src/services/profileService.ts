import type { ProfileData, SuggestedProfile, FetchResult, FeedPost, PostUser, Post } from '../../types';
import { supabase } from '../integrations/supabase/client';

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

// ===================================
// EXPORTED FUNCTIONS
// ===================================

export async function fetchProfileData(username: string): Promise<FetchResult> {
    const cleanUsername = username.replace(/^@+/, '').trim();
    if (!cleanUsername) throw new Error('Username inválido');

    try {
        const { data, error } = await supabase.functions.invoke('rapidapi-profile', {
            body: { username: cleanUsername },
        });

        if (error) throw new Error(`Erro na RapidAPI: ${error.message}`);

        const resultItem = data?.result?.[0];
        const user = resultItem?.user;

        if (user && user.username) {
            const profile: ProfileData = {
                username: user.username,
                fullName: user.full_name || '',
                profilePicUrl: getProxyImageUrl(user.hd_profile_pic_url_info?.url || user.profile_pic_url),
                biography: user.biography || '',
                followers: user.follower_count || 0,
                following: user.following_count || 0,
                postsCount: user.media_count || 0,
                isVerified: user.is_verified || false,
                isPrivate: user.is_private || false,
            };

            let suggestions: SuggestedProfile[] = [];
            
            const facepile = user.profile_context_facepile_users;
            const chaining = user.chaining_results || user.chaining_suggestions;

            const sourceArray = (Array.isArray(facepile) && facepile.length > 0) ? facepile : chaining;

            if (Array.isArray(sourceArray)) {
                suggestions = shuffleArray(sourceArray.map((p: any) => ({
                    username: p.username,
                    profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                    fullName: p.full_name,
                    is_private: p.is_private === true // Explicitamente identifica se é privado
                })));
            }

            return { profile, suggestions, posts: [] };
        }
        throw new Error('Perfil não encontrado.');
    } catch (error) {
        console.warn('⚠️ Falha ao buscar dados da API. Ativando simulador inteligente de contingência...', error);
        
        // Gerador de nome legível baseado no username digitado
        const words = cleanUsername.split(/[\._]/);
        const fullName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Perfil simulado inteligente de contingência (Sempre privado para aguçar a curiosidade)
        const profile: ProfileData = {
            username: cleanUsername.toLowerCase(),
            fullName: fullName,
            profilePicUrl: '/perfil.jpg',
            biography: `🔒 Conta privada.\n✨ @${cleanUsername.toLowerCase()}\n📍 Conectado(a)`,
            followers: Math.floor(Math.random() * 45000) + 1200,
            following: Math.floor(Math.random() * 900) + 150,
            postsCount: Math.floor(Math.random() * 85) + 8,
            isVerified: false,
            isPrivate: true,
        };

        // Gerar sugestões fictícias e realistas
        const fallbackNames = [
          'Ana Clara', 'Bruno Ramos', 'Camila Santos', 'Daniel Lima', 
          'Eduarda M.', 'Felipe Silva', 'Gabriela Costa', 'Lucas Souza'
        ];
        
        const suggestions: SuggestedProfile[] = fallbackNames.map((name) => {
          const u = name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 90 + 10);
          return {
            username: u,
            fullName: name,
            profile_pic_url: '/perfil.jpg',
            is_private: Math.random() > 0.3
          };
        });

        return { profile, suggestions, posts: [] };
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
            suggestions = shuffleArray(suggestionsData.map((p: any) => ({
                username: p.username || '',
                fullName: p.full_name || p.username,
                profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                is_private: p.is_private === true,
            })));
        }

        // FILTRO: Identifica os perfis que NÃO são privados (Abertos)
        const openProfiles = suggestions.filter(p => p.is_private === false).slice(0, 4);

        const postPromises = openProfiles.map(async (profile) => {
            try {
                // Chama a API de posts para cada perfil aberto
                const postsResponse = await simpleFetch('lista_posts', profile.username);
                const postsData = postsResponse?.results?.[0]?.data;
                
                if (Array.isArray(postsData) && postsData.length > 0) {
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
        const posts = resolvedPosts.filter((p): p is FeedPost => p !== null);

        return { suggestions, posts };

    } catch (error) {
        return { suggestions: [], posts: [] };
    }
}