import type { ProfileData, SuggestedProfile, FetchResult, FeedPost } from '../../types';

// ===================================
// MOCK DATA GENERATION (Local)
// ===================================

const getMockData = (campo: string, username: string) => {
  const MOCK_PROFILE: ProfileData = {
    username: username,
    fullName: 'Neymar Jr (Exemplo)',
    profilePicUrl: '/perfil.jpg',
    biography: 'Este é um perfil de exemplo. A API original foi desativada e aguarda substituição.',
    followers: 222000000,
    following: 1750,
    postsCount: 5432,
    isVerified: true,
    isPrivate: false,
  };

  const MOCK_SUGGESTIONS: SuggestedProfile[] = [
    { username: 'leomessi', fullName: 'Lionel Messi', profile_pic_url: '/perfil.jpg', is_private: false },
    { username: 'cristiano', fullName: 'Cristiano Ronaldo', profile_pic_url: '/perfil.jpg', is_private: false },
    { username: 'gabigol', fullName: 'Gabi Gol', profile_pic_url: '/perfil.jpg', is_private: true },
    { username: 'anitta', fullName: 'Anitta', profile_pic_url: '/perfil.jpg', is_private: false },
  ];

  const MOCK_POSTS: FeedPost[] = [
    {
      de_usuario: { username: 'leomessi', full_name: 'Lionel Messi', profile_pic_url: '/perfil.jpg' },
      post: {
        id: '321',
        image_url: '/passo1.png',
        video_url: undefined,
        is_video: false,
        caption: 'Post de exemplo 1! #mock',
        like_count: 1500000,
        comment_count: 60000
      }
    },
    {
      de_usuario: { username: 'cristiano', full_name: 'Cristiano Ronaldo', profile_pic_url: '/perfil.jpg' },
      post: {
        id: '654',
        image_url: '/passo2.png',
        video_url: undefined,
        is_video: false,
        caption: 'Outro post de exemplo. #dadosfalsos',
        like_count: 2300000,
        comment_count: 85000
      }
    }
  ];

  switch (campo) {
    case 'perfil_completo':
      return { profile: MOCK_PROFILE, suggestions: [], posts: [] };
    case 'perfis_sugeridos':
      return { suggestions: MOCK_SUGGESTIONS };
    case 'lista_posts':
      return { posts: MOCK_POSTS };
    default:
      throw new Error('Campo inválido');
  }
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

const getProxyImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
        return imageUrl;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&q=80`;
};

const getProxyImageUrlLight = (imageUrl: string | undefined): string => {
    if (!imageUrl || imageUrl.trim() === '') return '/perfil.jpg';
    if (imageUrl.startsWith('/') || imageUrl.startsWith('data:')) {
        return imageUrl;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}&w=80&h=80&fit=cover&q=50`;
};

// Simula a latência da rede
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ===================================
// EXPORTED FUNCTIONS
// ===================================

export async function fetchProfileData(username: string): Promise<FetchResult> {
    console.log('🔍 Buscando perfil com dados MOCK locais:', username);
    await sleep(1000); // Simula a latência da rede
    
    const cleanUsername = username.replace(/^@+/, '').trim();
    if (!cleanUsername) throw new Error('Username inválido');

    const mockResult = getMockData('perfil_completo', cleanUsername) as FetchResult;
    
    mockResult.profile.profilePicUrl = getProxyImageUrl(mockResult.profile.profilePicUrl);

    return mockResult;
}

export async function fetchFullInvasionData(profileData: ProfileData): Promise<{ suggestions: SuggestedProfile[], posts: FeedPost[] }> {
    console.log('🔎 Buscando dados de invasão com dados MOCK locais:', profileData.username);
    await sleep(1500); // Simula a latência da rede

    const suggestionsResult = getMockData('perfis_sugeridos', profileData.username) as { suggestions: SuggestedProfile[] };
    const postsResult = getMockData('lista_posts', profileData.username) as { posts: FeedPost[] };

    const processedSuggestions = suggestionsResult.suggestions.map(p => ({
        ...p,
        profile_pic_url: getProxyImageUrlLight(p.profile_pic_url),
    }));

    const processedPosts = postsResult.posts.map(fp => ({
        ...fp,
        de_usuario: {
            ...fp.de_usuario,
            profile_pic_url: getProxyImageUrlLight(fp.de_usuario.profile_pic_url),
        },
        post: {
            ...fp.post,
            image_url: getProxyImageUrl(fp.post.image_url),
        }
    }));

    console.log(`✅ Dados MOCK locais carregados. Sugestões: ${processedSuggestions.length}, Posts: ${processedPosts.length}`);
    
    return { suggestions: processedSuggestions, posts: processedPosts };
}