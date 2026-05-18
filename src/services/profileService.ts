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

const simpleFetch = async (campo: string, username: string): Promise<any> => {
    // Timeout de 10 segundos para cada requisição individual
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const { data, error } = await supabase.functions.invoke('proxy-api', {
            body: { campo, username },
        });

        clearTimeout(timeoutId);

        if (error) throw new Error(`Erro ao contatar o servidor seguro: ${error.message}`);
        if (data.error) throw new Error(`Erro no servidor seguro: ${data.error}`);
        
        return data;
    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
};

// ===================================
// EXPORTED FUNCTIONS
// ===================================

/**
 * Busca o perfil básico usando a NOVA API da RapidAPI (endpoint userInfo).
 */
export async function fetchProfileData(username: string): Promise<FetchResult> {
    try {
        const cleanUsername = username.replace(/^@+/, '').trim();
        if (!cleanUsername) throw new Error('Username inválido');

        console.log('🔍 Buscando perfil via RapidAPI:', cleanUsername);
        
        const { data, error } = await supabase.functions.invoke('rapidapi-profile', {
            body: { username: cleanUsername },
        });

        if (error) {
            console.error('❌ Erro na Edge Function:', error);
            throw new Error(`Erro ao contatar a RapidAPI: ${error.message}`);
        }
        
        console.log('📦 Resposta bruta da RapidAPI:', data);

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

            // EXTRAÇÃO DOS PERFIS EM COMUM (FACEPILE)
            let suggestions: SuggestedProfile[] = [];
            if (Array.isArray(user.profile_context_facepile_users)) {
                suggestions = user.profile_context_facepile_users.map((p: any) => ({
                    username: p.username,
                    profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                    fullName: p.full_name,
                    is_private: p.is_private
                }));
            }

            return { profile, suggestions, posts: [] };
        }
        throw new Error('Perfil não encontrado. Verifique o nome de usuário.');
    } catch (error) {
        console.error('❌ Erro fatal no fetchProfileData:', error);
        if (error instanceof Error) throw error;
        throw new Error('Ocorreu um erro desconhecido ao buscar dados do backend.');
    }
}

/**
 * Busca os dados completos (posts e sugestões).
 * Otimizado para não travar se houver muitos perfis.
 */
export async function fetchFullInvasionData(profileData: ProfileData): Promise<{ suggestions: SuggestedProfile[], posts: FeedPost[] }> {
    const cleanUsername = profileData.username.replace(/^@+/, '').trim();
    
    try {
        // Busca sugestões (rápido)
        const suggestionsResponse = await simpleFetch('perfis_sugeridos', cleanUsername).catch(() => null);

        let suggestions: SuggestedProfile[] = [];
        const suggestionsData = suggestionsResponse?.results?.[0]?.data;
        if (Array.isArray(suggestionsData)) {
            suggestions = suggestionsData.map((p: any) => ({
                username: p.username || '',
                fullName: p.full_name || p.username,
                profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
                is_private: p.is_private,
            }));
        }

        // Filtra apenas perfis públicos e limita a 5 para não sobrecarregar a rede
        const publicProfiles = suggestions.filter(p => !p.is_private).slice(0, 5);

        const postPromises = publicProfiles.map(async (profile) => {
            try {
                const postsResponse = await simpleFetch('lista_posts', profile.username);
                const postsData = postsResponse?.results?.[0]?.data;
                
                if (Array.isArray(postsData) && postsData.length > 0) {
                    const item = postsData[0]; 

                    const postUser: PostUser = {
                        username: profile.username,
                        full_name: profile.fullName || profile.username,
                        profile_pic_url: profile.profile_pic_url,
                    };

                    const post: Post = {
                        id: item.id || String(Math.random()),
                        image_url: getProxyImageUrl(item.image_url),
                        video_url: item.video_url ? getProxyImageUrl(item.video_url) : undefined,
                        is_video: !!item.video_url,
                        caption: item.caption || '',
                        like_count: item.like_count || 0,
                        comment_count: item.comment_count || 0,
                    };
                    
                    return [{ de_usuario: postUser, post }];
                }
                return [];
            } catch (error) {
                console.warn(`⚠️ Não foi possível carregar posts de @${profile.username}`);
                return [];
            }
        });

        const postsByProfile = await Promise.all(postPromises);
        const allPosts = postsByProfile.flat().sort(() => Math.random() - 0.5);
        
        return { suggestions, posts: allPosts };

    } catch (error) {
        console.error('❌ Erro no fetchFullInvasionData:', error);
        return { suggestions: [], posts: [] };
    }
}