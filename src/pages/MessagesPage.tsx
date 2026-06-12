import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, SquarePen, Lock, Clock, Plus } from 'lucide-react';
import SmileyStarIcon from '../components/icons/SmileyStarIcon';
import MetaAIIcon from '../components/icons/MetaAIIcon';
import MessageItem from '../components/MessageItem';
import LockedFeatureModal from '../components/LockedFeatureModal';
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';
import { ProfileData, SuggestedProfile } from '../../types';
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES, MOCK_SUGGESTION_NAMES } from '../../constants';

export interface Story {
  id: string;
  name: string;
  note: string;
  avatar: string;
  isOwnStory?: boolean;
  isMusicNote?: boolean;
  music?: { title: string; artist: string };
  isLocked?: boolean;
}

export interface ChatMessage { // Changed name to ChatMessage to avoid conflict with MessageItemProps
  id: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  locked: boolean;
  avatar: string;
  chatIndex?: number;
}

const maskUsername = (username: string) => {
  if (username.length <= 4) return username;
  return `${username.substring(0, 3).toLowerCase()}****`;
};

// ===================================
// Story Components
// ===================================

interface StoryBubbleProps {
  children: React.ReactNode;
  isMusic?: boolean;
}

const StoryBubble: React.FC<StoryBubbleProps> = ({ children, isMusic = false }) => (
  <div
    className={`absolute z-30 flex justify-center items-end h-10 overflow-visible text-center`}
    style={{ top: '10px', left: 0, right: 0 }}
  >
    <div
      className={`relative z-10 p-1 rounded-lg text-sm font-semibold text-white max-w-[120px] ${
        isMusic ? 'bg-black/80' : 'bg-black/70'
      }`}
      style={{ overflow: 'visible', textAlign: isMusic ? 'left' : 'center', lineHeight: '1.2' }}
    >
      {children}
    </div>
  </div>
);

interface MusicNoteProps {
  title: string;
  artist: string;
}

const MusicNote: React.FC<MusicNoteProps> = ({ title, artist }) => {
  const scrollRef = useRef<HTMLSpanElement>(null);
  const animationId = useRef(`scrollText_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (scrollRef.current && title !== "APT.") {
      const scrollWidth = scrollRef.current.scrollWidth / 2 / 16.5; // Adjusted for font size
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        @keyframes ${animationId.current} {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `;
      document.head.appendChild(styleSheet);
      scrollRef.current.style.animation = `${animationId.current} ${scrollWidth}s linear infinite`;

      return () => {
        document.head.removeChild(styleSheet);
      };
    }
  }, [title]);

  const isAPT = title === "APT.";

  return (
    <div className="flex flex-col items-center gap-0.5 w-full">
      <div className="flex items-center gap-1 w-full justify-center">
        <svg
          fill="rgb(249, 249, 249)"
          viewBox="0 0 24 30"
          width="8"
          height="10"
          className="flex-shrink-0 text-white"
        >
          <title>Ícone representando ondas sonoras com três barras verticais que mudam de altura de maneira pulsante</title>
          <rect height="30" rx="2" ry="2" width="4" y="0" fill="rgb(249, 249, 249)"></rect>
          <rect height="10" rx="2" ry="2" width="4" x="10" y="10" fill="rgb(249, 249, 249)"></rect>
          <rect height="30" rx="2" ry="2" width="4" x="20" y="0" fill="rgb(249, 249, 249)"></rect>
        </svg>
        {isAPT ? (
          <span className="text-xs text-white font-bold leading-tight text-center">
            {title}
          </span>
        ) : (
          <div className="overflow-hidden whitespace-nowrap max-w-[60px] flex-1">
            <span
              ref={scrollRef}
              className="text-xs text-white font-bold leading-tight inline-block whitespace-nowrap"
              data-text={title}
            >
              {title} <span style={{ marginLeft: '20px' }}>{title}</span>
            </span>
          </div>
        )}
      </div>
      <span className="text-xs text-white/70 leading-tight whitespace-nowrap overflow-hidden text-ellipsis block w-full text-center">
        {artist}
      </span>
    </div>
  );
};

const DirectStoryItem: React.FC<{
  avatarUrl: string;
  name: string;
  note?: string;
  isOwnStory?: boolean;
  isMusicNote?: boolean;
  music?: MusicNoteProps;
  isLocked?: boolean;
  onClick: () => void;
  index: number; // Added index for fallback avatars
}> = ({ avatarUrl, name, note, isOwnStory = false, isMusicNote = false, music, isLocked = false, onClick, index }) => {
  const safeAvatarUrl = avatarUrl || '/perfil.jpg'; // Fallback for empty strings
  const fallbackAvatar = `/images/avatars/fallback/av-fallback-${(index % 14) + 1}.jpg`;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (!target.src.includes('av-fallback-') && !target.src.includes('perfil-sem-foto') && !target.src.includes('perfil-espionado')) {
      target.src = isOwnStory ? "/perfil.jpg" : fallbackAvatar;
      target.classList.add('blur-sm'); // Apply blur to fallback images
    }
  };

  return (
    <div className="flex-shrink-0 text-center relative max-w-[70px]">
      <button
        type="button"
        onClick={onClick}
        className="relative w-fit mx-auto cursor-pointer p-0 pt-[45px] bg-none border-none overflow-visible"
      >
        {!isLocked && (note || isMusicNote) && (
          <StoryBubble isMusic={isMusicNote}>
            {isMusicNote && music ? (
              <MusicNote title={music.title} artist={music.artist} />
            ) : (
              <span className={`${isOwnStory ? 'text-gray-400' : 'text-white'} text-xs font-bold`}>
                {note}
              </span>
            )}
          </StoryBubble>
        )}
        <div
          className={`mx-auto rounded-full overflow-hidden relative ${
            isOwnStory ? 'p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600' : 'bg-gray-800'
          }`}
          style={{ width: '69px', height: '69px', zIndex: 1, display: 'block', transform: 'translateZ(0)', WebkitTransform: 'translateZ(0)' }}
        >
          <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center bg-gray-700/50">
            {isLocked ? (
              <Lock size={20} className="text-white absolute z-10" />
            ) : (
              <img
                alt={name}
                src={safeAvatarUrl}
                onError={handleError}
                className={`w-full h-full object-cover block rounded-full ${isLocked ? 'blur-sm opacity-80' : 'opacity-90'} `}
                style={{ backgroundColor: 'transparent' }} // Override background set by onError for initial load
              />
            )}
            {isOwnStory && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs mt-1 w-16 mx-auto whitespace-nowrap overflow-hidden text-ellipsis text-gray-300">
          {isOwnStory ? "Sua nota" : name}
        </p>
      </button>
    </div>
  );
};


const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Changed type to ChatMessage[]
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

  // Mock translations (simplified for direct use, ideally from a context/hook)
  const mockTranslations = {
    chatMessages: {
      guessWhatYouForgot: "Oi delícia, adivinha o que vc esqueceu aqui? kkkk",
      forwardedReel: "Reel encaminhado: 'Pra rir!'",
      talkLater: "Blz, depois a gente se fala",
      reactedThumbsUp: "Reagiu com 👍🏻",
      newMessages: "Novas mensagens", // Used in ChatPage actually
    },
    lockedMessages: {
      sentReelFrom: "Reel de ",
      sentFriday: "Sextou... 🍹",
      sentVoiceMessage: "Mensagem de voz",
      likedYourMessage: "Curtiu sua mensagem",
      sent: "Enviou uma mensagem",
      sentMonday: "Segundou com S de Saudade",
      deliciaMessage: "Delícia... me liga!",
      sentThursday: "Quinta é quase sexta",
      understoodMessage: "Entendi perfeitamente",
    },
    time: {
      now: "agora",
      minutesAgo: "{{count}} min",
      hoursAgo: "{{count}} h",
      daysAgo: "{{count}} d",
      weeksAgo: "{{count}} sem",
    },
    yourNote: "Sua nota",
    storyLabels: {
      tellNews: "Conte as novidades",
      lazyToday: "Preguiça Hoje 🥱🥱",
      swingLabel: "Coração Partido (Ao Vivo)",
      anyoneBored: "Alguém entediado?",
      cantTakeIt: "Não aguento mais",
    }
  };


  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');

    let currentProfileData: ProfileData | null = null;
    let currentSuggestedProfiles: SuggestedProfile[] = [];

    if (storedDataRaw) {
      const data = JSON.parse(storedDataRaw);
      currentProfileData = data.profileData;
      currentSuggestedProfiles = data.suggestedProfiles || [];

      // Se já houver mensagens geradas para este lead, usamos elas
      if (data.generatedStories && data.generatedMessages) {
        setStories(data.generatedStories);
        setMessages(data.generatedMessages);
        setProfileData(currentProfileData);
        return;
      }
    }

    // Fallback para profileData se não estiver presente ou inválido
    if (!currentProfileData) {
      currentProfileData = {
        username: 'desconhecido',
        fullName: 'Usuário Desconhecido',
        profilePicUrl: '/perfil.jpg',
        followers: 0,
        following: 0,
        postsCount: 0,
        isVerified: false,
        isPrivate: false,
        gender: 'unknown'
      };
    }
    setProfileData(currentProfileData);

    // Se suggestedProfiles estiver vazio, geramos mockados
    if (currentSuggestedProfiles.length === 0) {
      const targetGender = currentProfileData?.gender;
      let namesToUse = MOCK_SUGGESTION_NAMES;
      if (targetGender === 'male') {
        namesToUse = MOCK_FEMALE_NAMES;
      } else if (targetGender === 'female') {
        namesToUse = MOCK_MALE_NAMES;
      }

      const shuffledNames = [...namesToUse].sort(() => 0.5 - Math.random());
      currentSuggestedProfiles = shuffledNames.slice(0, 12).map((name) => ({
        username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
        fullName: name,
        profile_pic_url: '/perfil.jpg',
      }));
    }

    // Gerar histórias
    const generateStories = (profiles: SuggestedProfile[], translations: any) => {
        const today = new Date();
        const r = today.getDate().toString().padStart(2, "0");
        const s = (today.getMonth() + 1).toString().padStart(2, "0");
        const specialDate = `${r}/${s}❤️`;

        const i = [translations.storyLabels.tellNews, translations.storyLabels.lazyToday, translations.storyLabels.swingLabel, specialDate, translations.storyLabels.anyoneBored, translations.storyLabels.cantTakeIt, "👀"];
        const d = [
          {title: "Coração Partido (Ao Vivo)", artist: "Grupo Menos É Mais"},
          {title: "365 Dias (Vida Mansa)", artist: "MC Marks, MC Ryan SP, MC Jvila, MC Bruno MS, MC Magal"},
          {title: "APT.", artist: "Rosé & Bruno Mars"},
          {title: "What's I've Done", artist: "Link Park"},
          {title: "Oh Garota Eu Quero Você Só Pra Mim", artist: "Oruam, Zé Felipe, MC Tuto, MC Rodrigo Do CN"},
        ];
        
        const storiesList: Story[] = [];

        storiesList.push({
          id: currentProfileData?.username || "user",
          name: translations.yourNote.replace("...", "Sua nota"),
          avatar: currentProfileData?.profilePicUrl || "/perfil.jpg",
          isOwnStory: true,
          note: i[0],
        });

        const nProfiles = profiles.filter(p => p.username).slice(0, 9);
        let y = 0; // Music index
        let x = 1; // Note index offset

        nProfiles.forEach((p, h) => {
          const isSpecialMusicNote = h === 1 || h === 4 || h === 6 || h === 7 || h === nProfiles.length - 1;
          let currentNote = i[x % i.length];
          if (currentNote === translations.storyLabels.swingLabel) {
            x++;
            currentNote = i[x % i.length];
          }

          storiesList.push({
            id: p.username,
            name: maskUsername(p.username),
            avatar: p.profile_pic_url || "/perfil.jpg",
            isMusicNote: isSpecialMusicNote,
            music: isSpecialMusicNote ? d[y++ % d.length] : undefined,
            note: isSpecialMusicNote ? undefined : currentNote,
            isLocked: true, // All generated stories are locked
          });

          if (h === 1) { // Insert special swing story after the second generated profile
            storiesList.push({
              id: "swing_special",
              name: "Swi*******",
              avatar: "/images/screenshots/StorySwing.png",
              note: translations.storyLabels.swingLabel,
              isLocked: true,
            });
          }
          if (!isSpecialMusicNote) x++;
        });

        let userCity = "Sua localização";
        try {
          const storedCity = localStorage.getItem("user_city");
          if (storedCity) userCity = storedCity;
        } catch {} // Fallback if local storage is not available or parsing fails
        const locationNote = userCity && userCity !== "Sua localização" ? `📍💦 ${userCity}` : "📍💦 São Paulo";

        storiesList.push({
          id: "loc_special",
          name: "Marc*******",
          avatar: "/images/screenshots/playboy.jpg",
          note: locationNote,
          isLocked: true,
        });

        return storiesList;
      };

    // Gerar mensagens
    const generateMessages = (profiles: SuggestedProfile[], translations: any) => {
      const timeCalculations = {
          now: translations.time.now,
          minutesAgo: translations.time.minutesAgo,
          hoursAgo: translations.time.hoursAgo,
          daysAgo: translations.time.daysAgo,
          weeksAgo: translations.time.weeksAgo,
      };
      
      const formatTime = (format: string, count: number) => format.replace("{{count}}", String(count));
    
      const chatMessages = [
        {id: "chat_15", displayName: "Fer*****", profilePic: "/images/screenshots/chat1.png", lastMessage: translations.chatMessages.guessWhatYouForgot.replace("{{name}}", currentProfileData?.fullName?.split(" ")[0] || currentProfileData?.username || "vc"), time: ` • ${timeCalculations.now}`, unread: true, chatIndex: 1},
        {id: "chat_17", displayName: maskUsername(profiles[0]?.username || "user"), profilePic: profiles[0]?.profile_pic_url || "/perfil.jpg", lastMessage: translations.chatMessages.forwardedReel, time: ` • ${formatTime(timeCalculations.minutesAgo, 33)}`, unread: true, chatIndex: 5},
        {id: "chat_18", displayName: maskUsername(profiles[1]?.username || "user"), profilePic: profiles[1]?.profile_pic_url || "/perfil.jpg", lastMessage: translations.chatMessages.talkLater, time: ` • ${formatTime(timeCalculations.hoursAgo, 2)}`, unread: false, chatIndex: 4},
        {id: "chat_16", displayName: "And*****", profilePic: "/images/screenshots/chat2.png", lastMessage: translations.chatMessages.reactedThumbsUp, time: ` • ${formatTime(timeCalculations.hoursAgo, 6)}`, unread: false, chatIndex: 2},
        {id: "chat_19", displayName: "𝕭𝖗𝖚****", profilePic: "/images/screenshots/chat3.png", lastMessage: translations.chatMessages.newMessages, time: ` • ${formatTime(timeCalculations.hoursAgo, 22)}`, unread: true, chatIndex: 3},
      ];
    
      const x = [translations.lockedMessages.sentReelFrom, translations.lockedMessages.sentFriday, translations.lockedMessages.sentVoiceMessage, "kkkkkkkkkk", translations.lockedMessages.likedYourMessage, "🔥🔥", translations.lockedMessages.sent, translations.lockedMessages.sentMonday, translations.lockedMessages.deliciaMessage, translations.lockedMessages.likedYourMessage, translations.lockedMessages.sentThursday, translations.lockedMessages.understoodMessage, "😈😈"];
      const u = [formatTime(timeCalculations.daysAgo, 2), formatTime(timeCalculations.daysAgo, 2), formatTime(timeCalculations.daysAgo, 2), formatTime(timeCalculations.daysAgo, 2), formatTime(timeCalculations.daysAgo, 2), formatTime(timeCalculations.daysAgo, 3), formatTime(timeCalculations.daysAgo, 3), formatTime(timeCalculations.daysAgo, 3), formatTime(timeCalculations.daysAgo, 4), formatTime(timeCalculations.daysAgo, 4), formatTime(timeCalculations.daysAgo, 6), formatTime(timeCalculations.weeksAgo, 1), formatTime(timeCalculations.weeksAgo, 2)];
      const mProfiles = profiles.slice(2);
      const lockedMessages: ChatMessage[] = [];
    
      for (let c = 0; c < x.length; c++) {
        const C = c < mProfiles.length ? mProfiles[c] : null;
        lockedMessages.push({
          id: `locked_${c}`,
          name: C ? maskUsername(C.username) : "*****",
          avatar: C?.profile_pic_url || "/perfil.jpg",
          message: x[c % x.length],
          time: ` • ${u[c % u.length]}`,
          unread: false,
          locked: true,
        });
      }
    
      return [...chatMessages.map(msg => ({ 
        id: msg.id,
        name: msg.displayName,
        avatar: msg.profilePic,
        message: msg.lastMessage,
        time: msg.time,
        unread: msg.unread,
        locked: false, // Pre-set chats are not locked for now
        chatIndex: msg.chatIndex
      })), ...lockedMessages];
    };

    const generatedStories = generateStories(currentSuggestedProfiles, mockTranslations);
    const generatedMessages = generateMessages(currentSuggestedProfiles, mockTranslations);
    
    // Salva no sessionStorage dentro do objeto de invasão atual
    if (storedDataRaw) {
      const updatedData = {
        ...JSON.parse(storedDataRaw),
        generatedStories: generatedStories,
        generatedMessages: generatedMessages
      };
      sessionStorage.setItem('invasionData', JSON.stringify(updatedData));
    } else {
       // Se não havia invasionData, cria um com os dados gerados
       sessionStorage.setItem('invasionData', JSON.stringify({
         profileData: currentProfileData,
         suggestedProfiles: currentSuggestedProfiles,
         generatedStories: generatedStories,
         generatedMessages: generatedMessages
       }));
    }

    setStories(generatedStories);
    setMessages(generatedMessages);

  }, [navigate]);

  const handleLockedClick = (feature: string = 'acessar este conteúdo') => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  };

  const handleChatClick = useCallback((chat: ChatMessage) => {
    if (chat.locked) {
      handleLockedClick(`desbloquear a conversa com ${chat.name}`);
    } else if (chat.chatIndex) { // Assuming chatIndex exists on unlocked chats
      localStorage.setItem(`read_chat_${chat.id}`, 'true'); // Mark as read
      setMessages(prev => prev.map(m => m.id === chat.id ? { ...m, unread: false } : m));
      navigate(`/chat/${chat.chatIndex}`);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-gray-50 font-sans border-x border-gray-800">
      <LockedFeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        featureName={modalFeatureName} 
      />
      <FreeTimeFloatingButton />

      <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/instagram')} className="p-1 text-white">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-white">{profileData?.username || 'mensagens'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          <SmileyStarIcon size={28} strokeWidth={1.5} onClick={() => handleLockedClick('ver os melhores amigos')} />
          <SquarePen size={24} strokeWidth={1.5} onClick={() => handleLockedClick('escrever uma nova mensagem')} />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-2">
          <div className="relative">
            <MetaAIIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Interaja com a Meta AI ou pesquise" 
              className="w-full pl-10 pr-3 py-2.5 rounded-full text-sm bg-gray-800 text-gray-300 border-none outline-none focus:outline-none focus:ring-1 focus:ring-gray-600"
              readOnly 
              onClick={() => handleLockedClick('pesquisar nas mensagens')} 
            />
          </div>
        </div>

        <div className="flex space-x-4 overflow-x-auto px-4 mt-4 pb-2 scrollbar-hide">
          {stories.map((story, index) => (
            <DirectStoryItem
              key={story.id}
              avatarUrl={story.avatar}
              name={story.name}
              note={story.note}
              isOwnStory={story.isOwnStory}
              isMusicNote={story.isMusicNote}
              music={story.music}
              isLocked={story.isLocked}
              onClick={() => handleLockedClick(`ver a nota de ${story.name}`)}
              index={index}
            />
          ))}
        </div>

        <div className="flex justify-between items-center py-3 px-4 mt-2 border-t border-gray-800">
          <h2 className="text-lg font-semibold text-white">Mensagens</h2>
          <span className="text-sm text-blue-400 cursor-pointer" onClick={() => handleLockedClick('ver as solicitações de mensagem')}>
            Solicitações (4)
          </span>
        </div>

        <div className="px-4">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              avatarUrl={msg.avatar}
              name={msg.name}
              message={msg.message}
              time={msg.time}
              unread={msg.unread}
              locked={msg.locked}
              onClick={() => handleChatClick(msg)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;