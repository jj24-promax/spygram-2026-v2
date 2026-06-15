import type { ProfileData, SuggestedProfile } from '../../types';
import { getTargetDisplayName, maskContactName, personalizeText } from '../utils/targetName';
import {
  CHAT_PROFILE_INDEX,
  STORY_PROFILE_INDEX,
  getSuggestedAvatar,
  getSuggestedDisplayName,
} from '../utils/suggestedProfileAvatars';

export interface DirectStory {
  id: string;
  name: string;
  note: string;
  avatar: string;
}

export interface DirectMessagePreview {
  id: string;
  chatId: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  locked: boolean;
  avatar: string;
  stylizedName?: boolean;
}

export interface ChatMessage {
  id: number;
  type: 'sent' | 'received' | 'date' | 'divider' | 'video_call';
  zone: 'premium' | 'visible';
  content: string;
  reaction?: string;
  replyTo?: string;
  replyLabel?: string;
  isAudio?: boolean;
  audioDuration?: string;
  isBlurred?: boolean;
  isImage?: boolean;
  imageUrl?: string;
  imageLayout?: 'vertical' | 'horizontal' | 'stack';
  imageStackCount?: number;
  isViewOnce?: boolean;
  isHeart?: boolean;
  isReel?: boolean;
  reelImageUrl?: string;
  reelAuthor?: string;
  reelHandle?: string;
  callDuration?: string;
  callMissed?: boolean;
}

export interface ChatContact {
  chatId: string;
  name: string;
  avatar: string;
  onlineStatus: string;
  messages: ChatMessage[];
}

const REELS = {
  relacionamento: '/reels/reels_1.png',
  signodaputaria: '/reels/reels_4.png',
  tettrem: '/reels/reels_3.png',
  morimura: '/reels/reels_2.png',
  safadodesejo: '/reels/reels_8.png',
  jonas: '/reels/reels_7.png',
  traduzindo: '/reels/reels_6.png',
  amor: '/reels/reels_5.png',
};

function p(text: string, targetName: string): string {
  return personalizeText(text, targetName);
}

function buildFerChat(targetName: string, avatar: string): ChatContact {
  return {
    chatId: 'fer',
    name: maskContactName('Fernanda'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '3 DIAS ATRÁS, 11:32' },
      { id: 2, type: 'received', zone: 'premium', content: 'Oi minha delícia' },
      { id: 3, type: 'sent', zone: 'premium', content: 'Oi amor da minha vidq' },
      { id: 4, type: 'sent', zone: 'premium', content: 'vida*' },
      { id: 5, type: 'received', zone: 'premium', content: 'To com saudade' },
      { id: 6, type: 'received', zone: 'premium', content: '', isImage: true, imageUrl: '/nudes1-chat1.jpg', reaction: '❤️' },
      { id: 7, type: 'received', zone: 'premium', content: 'Disse??' },
      { id: 8, type: 'sent', zone: 'premium', content: '😍😍😍😍😍😍' },
      { id: 9, type: 'received', zone: 'premium', content: 'Gostou amor?', isBlurred: true },
      { id: 10, type: 'sent', zone: 'premium', content: 'Áudio', isAudio: true, audioDuration: '0:11' },
      { id: 11, type: 'received', zone: 'premium', content: 'Fala pra ela que tem sim em São Paulo.', isBlurred: true },
      { id: 12, type: 'sent', zone: 'visible', content: 'Beleza, amanhã ou depois do amanhã', reaction: '👍🏻' },
      { id: 13, type: 'date', zone: 'visible', content: 'ONTEM, 20:21' },
      { id: 14, type: 'received', zone: 'visible', content: 'Amor' },
      { id: 15, type: 'received', zone: 'visible', content: 'Ta podendo falar?' },
      { id: 16, type: 'sent', zone: 'visible', content: 'Oii bb', replyTo: 'Amor', replyLabel: 'Você respondeu' },
      { id: 17, type: 'received', zone: 'visible', content: 'Perai que a vaca da Bruna tá aqui do lado', isBlurred: true },
      { id: 18, type: 'sent', zone: 'visible', content: 'kkkkkkkkk' },
      { id: 19, type: 'received', zone: 'visible', content: '🦌🦌🦌 kkkk', reaction: '😂' },
      { id: 20, type: 'received', zone: 'visible', content: 'Tô em São Paulo aqui já, só pra avisar mesmo', isBlurred: true, reaction: '❤️' },
      { id: 21, type: 'sent', zone: 'visible', content: 'Tô onde' },
      { id: 22, type: 'sent', zone: 'visible', content: 'Na sua prima?' },
      { id: 23, type: 'received', zone: 'visible', content: 'Não', replyTo: 'Na sua prima?', replyLabel: 'respondeu a você' },
      { id: 24, type: 'received', zone: 'visible', content: 'Casa da Fernanda', isBlurred: true },
      { id: 25, type: 'sent', zone: 'visible', content: 'Tá bom 🥰' },
      { id: 26, type: 'sent', zone: 'visible', content: 'Vou dar uma fodida e depois passo aí blz??', isBlurred: true, reaction: '❤️' },
      { id: 27, type: 'received', zone: 'visible', content: 'Áudio', isAudio: true, audioDuration: '0:32' },
      { id: 28, type: 'received', zone: 'visible', content: 'Áudio', isAudio: true, audioDuration: '0:07' },
      { id: 29, type: 'sent', zone: 'visible', content: 'Pode deixar' },
      { id: 30, type: 'divider', zone: 'visible', content: 'Novas mensagens' },
      { id: 31, type: 'date', zone: 'visible', content: 'HOJE, 17:22' },
      { id: 32, type: 'received', zone: 'visible', content: p('{{target}} adivinha o que vc esqueceu aqui? kkkk', targetName) },
    ],
  };
}

function buildItxChat(avatar: string): ChatContact {
  return {
    chatId: 'itx',
    name: maskContactName('Italo'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '23 DE NOV. 15:23' },
      { id: 2, type: 'received', zone: 'premium', content: '', isReel: true, reelImageUrl: REELS.tettrem, reelAuthor: 'tettrem', reelHandle: '@tettrem' },
      { id: 3, type: 'date', zone: 'premium', content: '27 DE NOV. 22:12' },
      { id: 4, type: 'sent', zone: 'premium', content: '', isReel: true, reelImageUrl: REELS.signodaputaria, reelAuthor: 'signodaputaria', reelHandle: '@signodaputaria' },
      { id: 5, type: 'date', zone: 'visible', content: '28 DE NOV. 14:35' },
      { id: 6, type: 'received', zone: 'visible', content: '', isReel: true, reelImageUrl: REELS.morimura, reelAuthor: 'morimura', reelHandle: '@morimura', reaction: '😂' },
      { id: 7, type: 'sent', zone: 'visible', content: 'eu achei triste o video' },
      { id: 9, type: 'date', zone: 'visible', content: 'ONTEM, 16:45' },
      { id: 10, type: 'received', zone: 'visible', content: 'Áudio', isAudio: true, audioDuration: '0:17', reaction: '❤️' },
      { id: 11, type: 'divider', zone: 'visible', content: 'Novas mensagens' },
      { id: 12, type: 'date', zone: 'visible', content: '01:02' },
      { id: 13, type: 'received', zone: 'visible', content: '', isReel: true, reelImageUrl: REELS.jonas, reelAuthor: 'Jonas.milgrau', reelHandle: '@Jonas.milgrau' },
    ],
  };
}

function buildTohChat(targetName: string, avatar: string): ChatContact {
  return {
    chatId: 'toh',
    name: maskContactName('Toh'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '2 MAR 20:43, 08:31' },
      { id: 2, type: 'received', zone: 'premium', content: 'Áudio', isAudio: true, audioDuration: '0:24' },
      { id: 3, type: 'sent', zone: 'premium', content: 'Áudio', isAudio: true, audioDuration: '0:18' },
      { id: 4, type: 'received', zone: 'premium', content: p('Bom dia {{target}}', targetName) },
      { id: 5, type: 'received', zone: 'premium', content: 'Iai melhorou??' },
      { id: 6, type: 'sent', zone: 'premium', content: 'Tranquilo, vai lá' },
      { id: 7, type: 'sent', zone: 'premium', content: 'Perdão pelo desabafo' },
      { id: 8, type: 'sent', zone: 'premium', content: 'Mas n sei o que eu faço' },
      { id: 9, type: 'received', zone: 'premium', content: 'Imagina' },
      { id: 10, type: 'received', zone: 'premium', content: 'Simm, vc sabe' },
      { id: 11, type: 'received', zone: 'premium', content: 'No rolo que eu tive com ela...', isBlurred: true },
      { id: 12, type: 'received', zone: 'premium', content: 'Se apaixonar por amante é foda te entendo', isBlurred: true },
      { id: 13, type: 'sent', zone: 'visible', content: 'kkkkkkk' },
      { id: 14, type: 'received', zone: 'visible', content: 'Blz depois a gente se fala' },
    ],
  };
}

function buildAndChat(avatar: string): ChatContact {
  return {
    chatId: 'and',
    name: maskContactName('Andressa'),
    avatar,
    onlineStatus: 'Online há 2 h',
    messages: [
      { id: 1, type: 'video_call', zone: 'premium', content: 'Chamada de vídeo', callDuration: '14:59' },
      { id: 2, type: 'video_call', zone: 'premium', content: 'Ligação de vídeo perdida', callMissed: true },
      { id: 3, type: 'video_call', zone: 'premium', content: 'Ligação de vídeo encerrada', callDuration: '15:15' },
      { id: 4, type: 'sent', zone: 'premium', content: 'Net tá ruim' },
      { id: 5, type: 'sent', zone: 'premium', content: 'To no 4G' },
      { id: 6, type: 'sent', zone: 'premium', content: 'Liga de novo' },
      { id: 7, type: 'received', zone: 'visible', content: 'Olha como me deixou' },
      {
        id: 8,
        type: 'received',
        zone: 'visible',
        content: '',
        isImage: true,
        imageUrl: '/recovered/img_3.jpg',
        imageLayout: 'vertical',
        isViewOnce: true,
        reaction: '❤️',
      },
      { id: 9, type: 'received', zone: 'visible', content: 'Kkkkk' },
      { id: 10, type: 'sent', zone: 'visible', content: 'CARALHOOOOO' },
      { id: 11, type: 'sent', zone: 'visible', content: 'Delícia demais' },
      { id: 12, type: 'sent', zone: 'visible', content: '❤️❤️❤️' },
      {
        id: 13,
        type: 'sent',
        zone: 'visible',
        content: '',
        isImage: true,
        imageUrl: '/recovered/img_5.jpg',
        imageLayout: 'horizontal',
        isViewOnce: true,
      },
      { id: 14, type: 'received', zone: 'visible', content: 'Manda mais sua tbm' },
      {
        id: 15,
        type: 'sent',
        zone: 'visible',
        content: '',
        isImage: true,
        imageUrl: '/recovered/img_6.jpeg',
        imageLayout: 'stack',
        imageStackCount: 3,
      },
      { id: 16, type: 'sent', zone: 'visible', content: '😈' },
      { id: 17, type: 'received', zone: 'visible', content: 'Pedi uma e mando 3' },
      { id: 18, type: 'received', zone: 'visible', content: 'Por isso que te amo ❤️' },
      { id: 19, type: 'sent', zone: 'visible', content: 'Vou ter que sair aqui ta perigoso' },
      { id: 20, type: 'sent', zone: 'visible', content: 'Não aguento mais tá chegando' },
      { id: 21, type: 'received', zone: 'visible', content: 'Calma que a gente se vê logo' },
      { id: 22, type: 'sent', zone: 'visible', content: 'Não aguento mais' },
      { id: 23, type: 'sent', zone: 'visible', content: 'Não manda mais nada blz', reaction: '👍🏻' },
    ],
  };
}

function buildBruChat(targetName: string, avatar: string): ChatContact {
  return {
    chatId: 'bru',
    name: maskContactName('Bruna'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '16 DE DEZ. 12:11' },
      { id: 2, type: 'sent', zone: 'premium', content: 'De todas as coisas que fiz na vida e arrependi, se envolver com vc esta no topo delas' },
      { id: 3, type: 'sent', zone: 'premium', content: 'E pensar que quase te assumi' },
      { id: 4, type: 'received', zone: 'premium', content: p('Por favor {{target}}', targetName) },
      { id: 5, type: 'received', zone: 'premium', content: 'Vamos ser felizes a gente se ama' },
      { id: 6, type: 'received', zone: 'premium', content: 'É um desperdício jogar fora tudo isso' },
      { id: 7, type: 'received', zone: 'premium', content: '', isReel: true, reelImageUrl: REELS.amor, reelAuthor: 'relacionamenton...', reelHandle: '@relacionamentoadois2' },
      { id: 8, type: 'date', zone: 'visible', content: '2 DIAS ATRÁS, 18:40' },
      { id: 9, type: 'divider', zone: 'visible', content: 'Novas mensagens' },
      { id: 10, type: 'received', zone: 'visible', content: p('{{target}}???', targetName) },
      { id: 11, type: 'received', zone: 'visible', content: 'Bom dia.' },
      { id: 12, type: 'received', zone: 'visible', content: 'Porque não me responde mais?????' },
      { id: 13, type: 'received', zone: 'visible', content: 'Estou na cidade e queria te ver' },
    ],
  };
}

function buildRogChat(targetName: string, avatar: string): ChatContact {
  return {
    chatId: 'rog',
    name: maskContactName('Roger'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '1 SEM' },
      { id: 2, type: 'received', zone: 'premium', content: p('{{target}}, preciso falar contigo urgente', targetName) },
      { id: 3, type: 'received', zone: 'premium', content: 'Não conta pra ninguém o que a gente fez', isBlurred: true },
      { id: 4, type: 'received', zone: 'visible', content: '4 novas mensagens' },
    ],
  };
}

function buildBabChat(avatar: string): ChatContact {
  return {
    chatId: 'bab',
    name: maskContactName('Babi'),
    avatar,
    onlineStatus: 'Online',
    messages: [
      { id: 1, type: 'date', zone: 'premium', content: '3 D' },
      { id: 2, type: 'received', zone: 'premium', content: 'Vem aqui logo, tô sozinha... 😈' },
      { id: 3, type: 'received', zone: 'premium', content: 'Precisamos conversar sobre ontem 😬', isBlurred: true },
      { id: 4, type: 'received', zone: 'visible', content: 'Enviou um anexo' },
    ],
  };
}

const CHAT_BUILDERS: Record<string, (targetName: string, avatar: string) => ChatContact> = {
  fer: buildFerChat,
  itx: buildItxChat,
  toh: buildTohChat,
  and: buildAndChat,
  bru: buildBruChat,
  rog: buildRogChat,
  bab: buildBabChat,
};

export function buildDirectData(
  profileData: ProfileData,
  suggestedProfiles: SuggestedProfile[] = []
) {
  const targetName = getTargetDisplayName(profileData);

  const storySlots = [
    { id: 'dee', note: 'Preguiça Hoje 🥱🥱' },
    { id: 'bab', note: 'Coração Pi... Grupo Men...' },
    { id: 'swi', note: 'O vontde fudê a 3 😈' },
  ] as const;

  const stories: DirectStory[] = storySlots.map((slot) => {
    const index = STORY_PROFILE_INDEX[slot.id] ?? 0;
    return {
      id: slot.id,
      name: getSuggestedDisplayName(suggestedProfiles, index),
      note: slot.note,
      avatar: getSuggestedAvatar(suggestedProfiles, index),
    };
  });

  const chatSlots = [
    {
      id: 'fer',
      chatId: 'fer',
      fallbackName: 'Fernanda',
      message: p('{{target}} adivinha o que vc esqueceu a...', targetName),
      time: '9 min',
      unread: true,
      locked: false,
    },
    {
      id: 'itx',
      chatId: 'itx',
      fallbackName: 'Italo',
      message: 'Encaminhou um reel de jonas.milgrau',
      time: '42 min',
      unread: true,
      locked: false,
    },
    {
      id: 'toh',
      chatId: 'toh',
      fallbackName: 'Toh',
      message: 'Blz depois a gente se fala',
      time: '2 h',
      unread: false,
      locked: false,
    },
    {
      id: 'and',
      chatId: 'and',
      fallbackName: 'Andressa',
      message: 'Reagiu com 👍 à sua mensagem',
      time: '6 h',
      unread: false,
      locked: false,
    },
    {
      id: 'bru',
      chatId: 'bru',
      fallbackName: 'Bruna',
      message: '4 novas mensagens',
      time: '22 h',
      unread: true,
      locked: false,
      stylizedName: true,
    },
    {
      id: 'rog',
      chatId: 'rog',
      fallbackName: 'Roger',
      message: '4 novas mensagens',
      time: '1 sem',
      unread: true,
      locked: true,
    },
    {
      id: 'bab',
      chatId: 'bab',
      fallbackName: 'Babi',
      message: 'Vem aqui logo, tô sozinha... 😈',
      time: '3 d',
      unread: true,
      locked: true,
    },
  ] as const;

  const messages: DirectMessagePreview[] = chatSlots.map((slot) => {
    const index = CHAT_PROFILE_INDEX[slot.chatId] ?? 0;
    const hasApiProfile = suggestedProfiles.length > 0;
    return {
      id: slot.id,
      chatId: slot.chatId,
      name: hasApiProfile
        ? getSuggestedDisplayName(suggestedProfiles, index)
        : maskContactName(slot.fallbackName),
      message: slot.message,
      time: slot.time,
      unread: slot.unread,
      locked: slot.locked,
      avatar: getSuggestedAvatar(suggestedProfiles, index),
      ...('stylizedName' in slot && slot.stylizedName ? { stylizedName: true } : {}),
    };
  });

  return { targetName, stories, messages };
}

export function getChatContact(
  chatId: string,
  profileData: ProfileData,
  suggestedProfiles: SuggestedProfile[] = []
): ChatContact | null {
  const builder = CHAT_BUILDERS[chatId];
  if (!builder) return null;

  const targetName = getTargetDisplayName(profileData);
  const index = CHAT_PROFILE_INDEX[chatId] ?? 0;
  const avatar = getSuggestedAvatar(suggestedProfiles, index);
  const contact = builder(targetName, avatar);

  if (suggestedProfiles.length > 0) {
    return {
      ...contact,
      name: getSuggestedDisplayName(suggestedProfiles, index),
      avatar,
    };
  }

  return contact;
}

export function directPreviewToMessage(preview: DirectMessagePreview) {
  return {
    id: preview.chatId,
    name: preview.name,
    message: preview.message,
    time: preview.time,
    unread: preview.unread,
    locked: preview.locked,
    avatar: preview.avatar,
    chatId: preview.chatId,
    onlineStatus:
      preview.chatId === 'and' ? 'Online há 2 h' : 'Online',
  };
}
