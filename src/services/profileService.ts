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
    // Timeout de 8 segundos para evitar travamentos longos
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
        throw new Error('Perfil não encontrado.');
    } catch (error) {
        console.error('❌ Erro no fetchProfileData:', error);
        throw error;
    }
}

export async function fetchFullInvasionData(profileData: ProfileData): Promise<{ suggestions: SuggestedProfile[], posts: FeedPost[] }> {
    const cleanUsername = profileData.username.replace(/^@+/, '').trim();
    
    try {
        // Busca sugestões e inicia o processo
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

        // Limita a busca de posts para os 3 primeiros perfis públicos (mais rápido)
        const publicProfiles = suggestions.filter(p => !p.is_private).slice(0, 3);

        const postPromises = publicProfiles.map(async (profile) => {
            try {
                const postsResponse = await simpleFetch('lista_posts', profile.username);
                const postsData = postsResponse?.results?.[0]?.data;
                
                if (Array.isArray(postsData) && postsData.length > 0) {
                    const item = postsData[0]; 
                    return [{
                        de_usuario: {
                            username: profile.username,
                            full_name: profile.fullName || profile.username,
                            profile_pic_url: profile.profile_pic_url,
                        },
                        post: {
                            id: item.id || String(Math.random()),
                            image_url: getProxyImageUrl(item.image_url),
                            video_url: item.video_url ? getProxyImageUrl(item.video_url) : undefined,
                            is_video: !!item.video_url,
                            caption: item.caption || '',
                            like_count: item.like_count || 0,
                            comment_count: item.comment_count || 0,
                        }
                    }];
                }
                return [];
            } catch (error) {
                return [];
            }
        });

        const postsByProfile = await Promise.all(postPromises);
        return { suggestions, posts: postsByProfile.flat() };

    } catch (error) {
        return { suggestions: [], posts: [] };
    }
}