import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, MoreHorizontal, ChevronDown, Plus } from 'lucide-react';
import { ProfileData, SuggestedProfile, FeedPost } from '../../types';
import { assignUniqueFeedStockImages } from '../utils/feedStockImages';
import { resolveTargetGender } from '../utils/genderClassifier';

const MOCK_CAPTIONS = [
  "Finalmente um tempo para mim... ✨",
  "Que dia incrível! 📸",
  "Sabadou do melhor jeito. 🍷",
  "Trabalhando em algo novo. 🤫",
  "Saudades desse lugar. 🏖️",
  "A vida é curta demais para não aproveitar.",
  "Mais um dia, mais uma meta. 💪",
  "Mood de hoje: gratidão. 🙏",
  "Coisas boas acontecem para quem espera.",
  "Apenas vivendo o momento. 🍃"
];

// Helper function to mask usernames
const maskUsername = (username: string) => {
  if (username.length <= 4) return username; 
  if (username.length <= 3) return '*******';
  return `${username.substring(0, 3).toLowerCase()}****`;
};

interface ClickableProps {
  onLockedFeatureClick: (featureName: string) => void;
}

const BlurredFeedMedia: React.FC<{
  imageUrl: string;
  onClick: () => void;
}> = ({ imageUrl, onClick }) => (
  <div
    className="relative w-full aspect-square overflow-hidden cursor-pointer bg-[#1a1a1a]"
    onClick={onClick}
  >
    <img
      src={imageUrl}
      alt=""
      className="absolute inset-0 w-full h-full object-cover scale-[1.18] select-none pointer-events-none"
      style={{ filter: 'blur(22px)' }}
      draggable={false}
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
      <Lock className="w-14 h-14 text-red-500 mb-3 animate-pulse drop-shadow-lg" />
      <p className="text-lg font-bold text-white uppercase tracking-tight drop-shadow-md">
        CONTEÚDO BLOQUEADO
      </p>
      <p className="text-[10px] text-gray-300 mt-1 uppercase font-black tracking-widest">
        Acesso Premium Requerido
      </p>
    </div>
  </div>
);

const InstagramHeader: React.FC<ClickableProps> = ({ onLockedFeatureClick }) => {
  const navigate = useNavigate();

  return (
  <header className="grid grid-cols-3 items-center px-4 py-2 border-b border-gray-800 bg-black flex-shrink-0 md:hidden">
    <button onClick={() => onLockedFeatureClick('criar uma publicação')} className="flex justify-start">
      <img src="/icons/add-content.png" alt="Criar" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
    </button>
    <div onClick={() => onLockedFeatureClick('trocar de conta')} className="flex justify-center items-center gap-1 cursor-pointer">
      <img src="/instagram-logo.png" alt="Instagram Logo" className="h-8" style={{ filter: 'invert(1)' }} />
      <ChevronDown className="w-5 h-5 text-white mt-1" />
    </div>
    <button onClick={() => navigate('/notifications')} className="flex justify-end" type="button">
      <img src="/icons/heart.png" alt="Notificações" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
    </button>
  </header>
  );
};

const InstagramFooter: React.FC<{ profileData: ProfileData } & ClickableProps> = ({ profileData, onLockedFeatureClick }) => {
  const navigate = useNavigate();
  return (
    <footer className="flex justify-around items-center pt-3 pb-6 border-t border-gray-800 bg-black flex-shrink-0 md:hidden">
      <button onClick={() => onLockedFeatureClick('acessar a página inicial')}>
        <img src="/icons/home.png" alt="Página Inicial" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
      <button onClick={() => onLockedFeatureClick('fazer uma pesquisa')}>
        <img src="/icons/search.png" alt="Pesquisa" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
      <button onClick={() => onLockedFeatureClick('ver os Reels')}>
        <img src="/icons/reels.png" alt="Reels" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
      </button>
      <button onClick={() => navigate('/messages')} className="relative">
        <img src="/icons/send.png" alt="Mensagens" className="w-7 h-7" style={{ filter: 'brightness(0) invert(1)' }} />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-black"></div>
      </button>
      <button onClick={() => onLockedFeatureClick('ver o seu perfil')}>
        <img src={profileData.profilePicUrl} alt={profileData.username} className="w-7 h-7 rounded-full object-cover" />
      </button>
    </footer>
  );
};

const RealPost: React.FC<{
  postData: FeedPost;
  location?: string;
  feedImage: string;
} & ClickableProps> = ({
  postData,
  location,
  feedImage,
  onLockedFeatureClick,
}) => {
  const { de_usuario, post } = postData;
  const maskedUsername = maskUsername(de_usuario.username);
  const authorAvatar = de_usuario.profile_pic_url || '/perfil.jpg';

  return (
    <div className="border-b border-gray-800 mb-4">
      <div className="flex items-center justify-between p-3">
        <div onClick={() => onLockedFeatureClick(`ver o perfil de @${de_usuario.username}`)} className="flex items-center space-x-3 cursor-pointer">
          <img src={authorAvatar} alt={de_usuario.username} className="w-8 h-8 rounded-full object-cover blur-[2px]" />
          <div>
            <p className="text-sm font-semibold text-white">{maskedUsername}</p>
            {location && <p className="text-xs text-gray-400">{location}</p>}
          </div>
        </div>
        <button onClick={() => onLockedFeatureClick('ver as opções da publicação')}><MoreHorizontal className="w-5 h-5 text-white" /></button>
      </div>

      <BlurredFeedMedia
        imageUrl={feedImage}
        onClick={() => onLockedFeatureClick('ver esta publicação')}
      />

      <div className="flex justify-between items-center p-3">
        <div className="flex space-x-4">
          <button onClick={() => onLockedFeatureClick('curtir publicações')}>
            <img src="/icons/heart.png" alt="Curtir" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={() => onLockedFeatureClick('ver os comentários')}>
            <img src="/icons/comment.png" alt="Comentar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={() => onLockedFeatureClick('enviar esta publicação')}>
            <img src="/icons/send.png" alt="Enviar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
        </div>
        <button onClick={() => onLockedFeatureClick('salvar publicações')}>
          <img src="/icons/bookmark.png" alt="Salvar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      </div>
      <div className="px-3 pb-3 text-xs">
        <p onClick={() => onLockedFeatureClick('ver as curtidas')} className="font-semibold text-white mb-1 cursor-pointer">{new Intl.NumberFormat().format(post.like_count)} curtidas</p>
        {post.caption && (
          <p className="text-white"><span className="font-semibold mr-1">{maskedUsername}</span><span>{post.caption}</span></p>
        )}
        <p onClick={() => onLockedFeatureClick('ver os comentários')} className="text-gray-500 mt-1 cursor-pointer">Ver todos os {post.comment_count} comentários</p>
      </div>
    </div>
  );
};

const LockedPost: React.FC<{
  username: string;
  fullName?: string;
  profilePicUrl?: string;
  location?: string;
  index: number;
  feedImage: string;
  onLockedFeatureClick: (featureName: string) => void;
}> = ({
  username,
  profilePicUrl,
  location,
  index,
  feedImage,
  onLockedFeatureClick,
}) => {
  const maskedUsername = maskUsername(username);
  const caption = MOCK_CAPTIONS[index % MOCK_CAPTIONS.length];
  const likes = Math.floor(Math.random() * 2000) + 120;
  const comments = Math.floor(Math.random() * 60) + 5;
  const headerAvatar = profilePicUrl || '/perfil.jpg';

  return (
    <div className="border-b border-gray-800 mb-4">
      <div className="flex items-center justify-between p-3">
        <div onClick={() => onLockedFeatureClick(`ver o perfil de @${username}`)} className="flex items-center space-x-3 cursor-pointer">
          <img src={headerAvatar} alt={username} className="w-8 h-8 rounded-full object-cover border border-gray-800 blur-[2px]" />
          <div>
            <p className="text-sm font-semibold text-white">{maskedUsername}</p>
            {location && <p className="text-xs text-gray-400">{location}</p>}
          </div>
        </div>
        <button onClick={() => onLockedFeatureClick('ver as opções da publicação')}><MoreHorizontal className="w-5 h-5 text-white" /></button>
      </div>
      <BlurredFeedMedia
        imageUrl={feedImage}
        onClick={() => onLockedFeatureClick('ver esta publicação')}
      />
      <div className="flex justify-between items-center p-3">
        <div className="flex space-x-4">
          <button onClick={() => onLockedFeatureClick('curtir publicações')}>
            <img src="/icons/heart.png" alt="Curtir" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={() => onLockedFeatureClick('ver os comentários')}>
            <img src="/icons/comment.png" alt="Comentar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
          <button onClick={() => onLockedFeatureClick('enviar esta publicação')}>
            <img src="/icons/send.png" alt="Enviar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
          </button>
        </div>
        <button onClick={() => onLockedFeatureClick('salvar publicações')}>
          <img src="/icons/bookmark.png" alt="Salvar" className="w-6 h-6" style={{ filter: 'brightness(0) invert(1)' }} />
        </button>
      </div>
      <div className="px-3 pb-3 text-xs space-y-1 blur-sm select-none pointer-events-none">
        <p className="font-semibold text-white mb-1">{likes} curtidas</p>
        <p className="text-white"><span className="font-semibold mr-1">{maskedUsername}</span><span>{caption}</span></p>
        <p className="text-gray-500 mt-1">Ver todos os {comments} comentários</p>
      </div>
    </div>
  );
};

interface InstagramFeedContentProps {
  profileData: ProfileData;
  suggestedProfiles: SuggestedProfile[];
  posts: FeedPost[];
  locations: string[];
  onLockedFeatureClick: (featureName: string) => void;
}

const InstagramFeedContent: React.FC<InstagramFeedContentProps> = ({ profileData, suggestedProfiles, posts, locations, onLockedFeatureClick }) => {
  const hasRealPosts = posts && posts.length > 0;
  const targetGender = resolveTargetGender(profileData);

  const feedImages = useMemo(() => {
    if (hasRealPosts) {
      return assignUniqueFeedStockImages(
        posts.map((post, index) => ({
          seed: `${post.de_usuario.username}-feed-${post.post.id ?? index}`,
          username: post.de_usuario.username,
          fullName: post.de_usuario.full_name,
        })),
        suggestedProfiles,
        targetGender
      );
    }

    return assignUniqueFeedStockImages(
      suggestedProfiles.slice(0, 5).map((profile, index) => ({
        seed: `${profile.username}-feed-${index}`,
        username: profile.username,
        fullName: profile.fullName,
      })),
      suggestedProfiles,
      targetGender
    );
  }, [hasRealPosts, posts, suggestedProfiles, targetGender]);

  return (
    <>
      <InstagramHeader onLockedFeatureClick={onLockedFeatureClick} />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="flex p-3 space-x-4 border-b border-gray-800 overflow-x-auto flex-shrink-0 scrollbar-hide">
          <div onClick={() => onLockedFeatureClick('criar um story')} className="flex flex-col items-center flex-shrink-0 space-y-1 cursor-pointer">
            <div className="relative">
              <img src={profileData.profilePicUrl} alt="Seu story" className="w-16 h-16 rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
            </div>
            <span className="text-xs text-gray-400">Seu story</span>
          </div>
          {suggestedProfiles.map((story, index) => {
            const isCloseFriend = index < 3;
            const ringClasses = isCloseFriend
              ? 'bg-green-500'
              : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600';
            const storyAvatar = story.profile_pic_url || '/perfil.jpg';

            return (
              <div key={index} onClick={() => onLockedFeatureClick(`ver os stories de @${story.username}`)} className="flex flex-col items-center flex-shrink-0 space-y-1 text-center relative cursor-pointer">
                <div className={`w-[70px] h-[70px] rounded-full flex items-center justify-center p-[2px] shrink-0 ${ringClasses}`}>
                  <div className="relative w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                    <img
                      src={storyAvatar}
                      alt={story.username}
                      className="absolute inset-0 w-full h-full rounded-full object-cover blur-[3px] scale-[1.06] brightness-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Lock className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
                <span className="text-xs text-white mt-1 truncate w-16">{maskUsername(story.username)}</span>
              </div>
            );
          })}
        </div>
        
        {hasRealPosts ? posts.map((post, index) => (
          <RealPost
            key={post.post.id || index}
            postData={post}
            feedImage={feedImages[index] ?? feedImages[0]}
            location={locations.length > 0 ? locations[index % locations.length] : undefined}
            onLockedFeatureClick={onLockedFeatureClick}
          />
        )) : suggestedProfiles.slice(0, 5).map((profile, index) => (
          <LockedPost
            key={profile.username || index}
            index={index}
            username={profile.username}
            fullName={profile.fullName}
            profilePicUrl={profile.profile_pic_url}
            feedImage={feedImages[index] ?? feedImages[0]}
            location={locations.length > 0 ? locations[index % locations.length] : undefined}
            onLockedFeatureClick={onLockedFeatureClick}
          />
        ))}

        <div className="text-center p-4 text-gray-500 text-sm">Fim do feed por enquanto.</div>
      </div>
      <InstagramFooter profileData={profileData} onLockedFeatureClick={onLockedFeatureClick} />
    </>
  );
};

export default InstagramFeedContent;