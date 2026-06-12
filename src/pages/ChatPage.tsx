import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Phone, Video, Mic, Camera, Smile, Heart, VolumeX, EyeOff, Lock, Play, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LockedFeatureModal from '../components/LockedFeatureModal';
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';
import ReelFullscreenView from '../components/ReelFullscreenView'; // Novo componente
import { supabase } from '../integrations/supabase/client'; // Importado para asset host

// Ícones SVG customizados
const PhoneIcon = () => <Phone size={24} />;
const VideoIcon = () => <Video size={24} />;
const CameraInputIcon = () => <Camera size={22} />;
const MicInputIcon = () => <Mic size={22} />;
const StickerInputIcon = () => <Smile size={22} />;
const HeartInputIcon = () => <Heart size={22} />;

const getCleanedImageUrl = (url: string): string => {
  if (!url) return '/perfil.jpg';
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  // Usar supabase storage para otimização ou weserv.nl
  // Exemplo com supabase storage se o bucket for 'chat-images' e a imagem estiver lá:
  // return supabase.storage.from('chat-images').getPublicUrl(url.split('/').pop() || url).data.publicUrl;
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&q=80&output=webp`;
};

function getMaskedUsername(username: string): string {
    if (!username || username.length === 0) return "xxx*****";
    if (username.includes("*")) return username;
    return (username.length >= 3 ? username.substring(0, 3) : username) + "*****";
}

const generateWaveformData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push(Math.floor(Math.random() * 21) + 12);
  }
  return data;
};

const viewedChatImagesKey = "viewedChatImages";

function hasViewedImage(imageId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return JSON.parse(localStorage.getItem(viewedChatImagesKey) || "[]").includes(imageId);
  } catch {
    return false;
  }
}

function markImageViewed(imageId: string): void {
  if (typeof window === "undefined") return;
  try {
    const viewed = JSON.parse(localStorage.getItem(viewedChatImagesKey) || "[]");
    if (!viewed.includes(imageId)) {
      viewed.push(imageId);
      localStorage.setItem(viewedChatImagesKey, JSON.stringify(viewed));
    }
  } catch {
    console.warn("Error saving viewed image");
  }
}

function getImageId(chatId: number, messageId: string, imageUrl: string, index: number = 0): string {
    const cleanedUrl = imageUrl.split('/').pop()?.split('?')[0] || '';
    const uniquePart = `${chatId}_${messageId}_${index}_${cleanedUrl}`;
    return btoa(uniquePart).substring(0, 80);
}


// Mapeamento de traduções (mantido simples para exemplo, idealmente viria de um hook de i18n)
const chatTranslations = {
  "pt-BR": {
    onlineNow: "Online agora",
    onlineMinutesAgo: "Online há {{count}} min",
    onlineHoursAgo: "Online há {{count}} h",
    videoCallLabel: "Chamada de vídeo",
    videoCallMissed: "Ligação de vídeo perdida",
    videoCallEnded: "Ligação de vídeo encerrada",
    callBack: "Retornar chamada",
    newMessages: "Novas mensagens",
    messagePlaceholder: "Mensagem...",
    failedToSend: "Não foi possível enviar a mensagem.",
    learnMore: "Saiba mais",
    audioCall: "fazer uma ligação de voz",
    videoCall: "fazer uma chamada de vídeo",
    reactToMessage: "reagir à mensagem",
    transcribeAudio: "transcrever áudio",
    viewFullHistory: "ver o histórico completo de mensagens",
    playAudio: "Reproduzir",
    pauseAudio: "Pausar",
    transcribing: "Transcrevendo...",
    transcriptionFailed: "Não foi possível transcrever a mensagem.",
    requiresVIP: "Requer acesso VIP",
    viewPhoto: "Ver foto",
    sensitiveContent: "Conteúdo confidencial",
    sensitiveContentDescription: "Esta mídia pode conter material sensível. Para visualizá-la, você precisa de acesso VIP.",
    blockedContent: "Conteúdo bloqueado",
    blockedContentDescription: "Você precisa ser um membro VIP para visualizar este material.",
    becomeVIP: "Seja um membro VIP",
    reply: "Responder",
    forward: "Encaminhar",
    download: "Baixar",
    deleteMessage: "Excluir",
    reportMessage: "Denunciar",
    deleteForYou: "Excluir para você",
    audioVIPMessage: "Seja membro VIP para liberar o volume"
  }
};

interface MessageItemProps {
  id: string;
  type: 'text' | 'image' | 'audio' | 'heart' | 'reply' | 'date' | 'unread_divider' | 'system_call' | 'forwarded_story';
  direction: 'sent' | 'received' | 'system';
  content?: string;
  blurredContent?: string;
  imageSrc?: string;
  isSensitive?: boolean;
  reaction?: string;
  audioDuration?: string;
  replyTo?: string;
  replyLabel?: string;
  callType?: 'video' | 'voice';
  callStatus?: 'missed' | 'normal' | 'ended';
  timeId?: string; // Para datas e chamadas
  dynamicType?: 'firstName' | 'userSpiedName' | 'date2WeeksAhead' | 'city';
  storyAvatar?: string;
  storyUsername?: string;
  hasPlayButton?: boolean;
  isPackImages?: boolean;
  packImages?: string[];
  showError?: boolean;
  showTime?: boolean;
  showExpanded?: boolean;
}

interface ChatConfig {
  id: number;
  sessionKey: string;
  storageTimeKey: string;
  readKey: string;
  defaultStatus: string;
  messages: MessageItemProps[];
}

interface MetaInfo {
    callTime1?: string;
    callTime2?: string;
    callTime3?: string;
    date27DaysAgo?: string;
    date2WeeksAhead?: string;
    firstName?: string;
    userSpiedName?: string;
    lastMessageTime?: string;
    city?: string;
}


// ===========================================
// SUBSIDIOS LOCAIS (MESSAGES)
// ===========================================

const DIALOGUES: { [key: number]: ChatConfig } = {
  1: {
    id: 1,
    sessionKey: "chat-1",
    storageTimeKey: "chat-time-start-15",
    readKey: "chat-1-read",
    defaultStatus: "Online",
    messages: [{
        id: "1", type: "date", direction: "system", content: "3 dias atrás, 11:12"
    }, {
        id: "2", type: "text", direction: "received", content: "Oi minha delícia"
    }, {
        id: "3", type: "text", direction: "sent", content: "Oi amor da minha vidq"
    }, {
        id: "4", type: "text", direction: "sent", content: "vida*"
    }, {
        id: "5", type: "text", direction: "sent", content: "To com saudade"
    }, {
        id: "6", type: "image", direction: "received", imageSrc: "/nudes1-chat1.jpg", isSensitive: true, reaction: "❤️"
    }, {
        id: "7", type: "text", direction: "received", content: "Disso??"
    }, {
        id: "8", type: "text", direction: "sent", content: "😍😍😍😍😍😍"
    }, {
        id: "9", type: "text", direction: "received", content: "Gostou amor?", blurredContent: "** * ** *?"
    }, {
        id: "10", type: "audio", direction: "sent", audioDuration: "0:11"
    }, {
        id: "11", type: "text", direction: "received", content: "Fala pra ela que tem sim em ", blurredContent: "**", dynamicType: "city"
    }, {
        id: "12", type: "text", direction: "sent", content: "Dboa, amanhã ou depois de amanhã", reaction: "👍🏻"
    }, {
        id: "13", type: "date", direction: "system", content: "ONTEM, 21:34"
    }, {
        id: "14", type: "text", direction: "received", content: "Amor"
    }, {
        id: "15", type: "text", direction: "received", content: "Ta podendo falar?"
    }, {
        id: "16", type: "reply", direction: "sent", content: "Oii bb", replyTo: "Amor", replyLabel: "Você respondeu"
    }, {
        id: "17", type: "text", direction: "received", content: "Perai que a ", blurredContent: "** ** *** ** **"
    }, {
        id: "18", type: "text", direction: "sent", content: "kkkkkkkkk"
    }, {
        id: "19", type: "text", direction: "received", content: "🦌🦌🦌 kkkk", reaction: "😂"
    }, {
        id: "20", type: "text", direction: "received", content: "Tô em ", blurredContent: "**", dynamicType: "city", reaction: "❤️"
    }, {
        id: "21", type: "heart", direction: "received"
    }, {
        id: "22", type: "text", direction: "sent", content: "Tá aonde"
    }, {
        id: "23", type: "text", direction: "sent", content: "Na sua prima?"
    }, {
        id: "24", type: "reply", direction: "received", content: "Não", replyTo: "Na sua prima?", replyLabel: "respondeu a você"
    }, {
        id: "25", type: "text", direction: "received", content: "Casa da ", blurredContent: "** ** ** **"
    }, {
        id: "26", type: "text", direction: "sent", content: "Tá bom 😘"
    }, {
        id: "27", type: "text", direction: "sent", content: "Vou dar uma fodida e depois passo aí blz??", blurredContent: "** ** * ** ** ** ** ** *", reaction: "❤️"
    }, {
        id: "28", type: "audio", direction: "received", audioDuration: "0:32"
    }, {
        id: "29", type: "audio", direction: "received", audioDuration: "0:07"
    }, {
        id: "30", type: "text", direction: "sent", content: "Pode deixar"
    }, {
        id: "31", type: "heart", direction: "received"
    }, {
        id: "32", type: "unread_divider", direction: "system"
    }, {
        id: "33", type: "date", direction: "system", content: "HOJE" // Isso será preenchido dinamicamente
    }, {
        id: "34", type: "text", direction: "received", content: "Oi delícia, adivinha o que vc esqueceu aqui? kkkk", dynamicType: "firstName"
    }]
  },
  2: {
    id: 2,
    sessionKey: "chat-2",
    storageTimeKey: "chat-time-start-16",
    readKey: "chat-2-read",
    defaultStatus: "Online há 2 h",
    messages: [
      { id: "1", type: "system_call", direction: "system", callType: "video", callStatus: "normal", content: "Chamada de vídeo", timeId: "callTime1" },
      { id: "2", type: "system_call", direction: "system", callType: "video", callStatus: "missed", content: "Ligação de vídeo perdida" },
      { id: "3", type: "text", direction: "sent", content: "Net tá ruim" },
      { id: "4", type: "text", direction: "sent", content: "To no 4G" },
      { id: "5", type: "text", direction: "sent", content: "Liga de novo" },
      { id: "6", type: "system_call", direction: "system", callType: "video", callStatus: "normal", content: "Chamada de vídeo", timeId: "callTime2" },
      { id: "7", type: "system_call", direction: "system", callType: "video", callStatus: "ended", content: "Ligação de vídeo encerrada", timeId: "callTime3" },
      { id: "8", type: "text", direction: "sent", content: "Delíciaaaaaaaaaaaa" },
      { id: "9", type: "text", direction: "sent", content: "🤤🤤🤤" },
      { id: "10", type: "text", direction: "received", content: "Olha como me deixou" },
      { id: "11", type: "image", direction: "received", imageSrc: "/nudes1-chat2.jpg", isSensitive: true, reaction: "❤️" },
      { id: "12", type: "text", direction: "received", content: "Kkkkk" },
      { id: "13", type: "text", direction: "sent", content: "CARALHOOOOO" },
      { id: "14", type: "text", direction: "sent", content: "Delícia demais" },
      { id: "15", type: "text", direction: "sent", content: "❤️❤️❤️" },
      { id: "16", type: "text", direction: "received", content: "Manda mais sua tbm" },
      { id: "17", type: "image", direction: "sent", isPackImages: true, packImages: ["/nudes1-chat2.jpg", "/pack1.1-chat2.png", "/fotoblur1.jpg"], isSensitive: true, reaction: "😈" },
      { id: "18", type: "text", direction: "received", content: "Pedi uma e mando 3" },
      { id: "19", type: "text", direction: "received", content: "Por isso que te amo" },
      { id: "20", type: "text", direction: "sent", content: "Vou ter que sair aqui ta perigoso" },
      { id: "21", type: "text", direction: "sent", content: "Não aguento mais tá chegando" },
      { id: "22", type: "text", direction: "received", content: "Calma que a gente se vê logo" },
      { id: "23", type: "text", direction: "sent", content: "Não aguento mais" },
      { id: "24", type: "text", direction: "sent", content: "Não amnda mais nada blz", reaction: "👍🏻" }
    ]
  },
  3: {
    id: 3,
    sessionKey: "chat-3",
    storageTimeKey: "chat-time-start-19",
    readKey: "chat-3-read",
    defaultStatus: "Online",
    messages: [
      { id: "1", type: "text", direction: "sent", content: "De tdas as coisas que fiz na vida e arrependi, se envolver com vc esta no topo delas" },
      { id: "2", type: "text", direction: "sent", content: "E pensar que quase te assumi" },
      { id: "3", type: "text", direction: "received", content: "Por favor ", dynamicType: "userSpiedName" },
      { id: "4", type: "text", direction: "received", content: "Vamos ser felizes a gente se ama" },
      { id: "5", type: "text", direction: "received", content: "É um desperdício jogar fora tudo isso" },
      { id: "6", type: "text", direction: "received", content: "Jamais eu me se sujeitaria a tudo isso se o sentimento nao tivesse no topo da minha vida." },
      { id: "7", type: "date", direction: "system", content: "22 DE OUT, 14:33" },
      { id: "8", type: "forwarded_story", direction: "received", storyAvatar: "/perfil.jpg", storyUsername: "relacionamenen...", imageSrc: "/chat3-story1.png", hasPlayButton: true },
      { id: "9", type: "forwarded_story", direction: "received", storyAvatar: "/perfil.jpg", storyUsername: "relacionamenen...", imageSrc: "/chat3-story2.png", hasPlayButton: true },
      { id: "10", type: "date", direction: "system", timeId: "date27DaysAgo" },
      { id: "11", type: "text", direction: "received", content: "Oi boa tarde" },
      { id: "12", type: "text", direction: "received", content: "Sei que esta evitando falar comigo" },
      { id: "13", type: "text", direction: "received", content: "Mais hj faz um mês do nosso último beijo" },
      { id: "14", type: "text", direction: "received", content: "Dia ", dynamicType: "date2WeeksAhead" },
      { id: "15", type: "date", direction: "system", content: "2 dias atrás, 18:45" },
      { id: "16", type: "forwarded_story", direction: "received", storyAvatar: "/perfil.jpg", storyUsername: "sentimentos_div...", imageSrc: "/chat3-story3.png", hasPlayButton: true },
      { id: "17", type: "date", direction: "system", content: "HOJE" }, // Isso será preenchido dinamicamente
      { id: "18", type: "unread_divider", direction: "system" },
      { id: "19", type: "text", direction: "received", content: "", dynamicType: "userSpiedName" },
      { id: "20", type: "text", direction: "received", content: "Bom dia." },
      { id: "21", type: "text", direction: "received", content: "Porque não me responde mais?????" },
      { id: "22", type: "text", direction: "received", content: "Estou na cidade e queria te ver" }
    ]
  },
  4: {
    id: 4,
    sessionKey: "chat-4",
    storageTimeKey: "chat-time-start-18",
    readKey: "chat-4-read",
    defaultStatus: "Online",
    messages: [
      { id: "1", type: "audio", direction: "sent", audioDuration: "0:13" },
      { id: "2", type: "audio", direction: "sent", audioDuration: "0:05" },
      { id: "3", type: "audio", direction: "received", audioDuration: "0:20" },
      { id: "4", type: "text", direction: "sent", content: "Tranquilo, vai lá" },
      { id: "5", type: "date", direction: "system", content: "2 dias atrás, 09:31" },
      { id: "6", type: "text", direction: "received", content: "Bom dia ", dynamicType: "userSpiedName" },
      { id: "7", type: "text", direction: "received", content: "Iai melhorou??" },
      { id: "8", type: "audio", direction: "sent", audioDuration: "4:25" },
      { id: "9", type: "text", direction: "sent", content: "Perdão pelo desafo" },
      { id: "10", type: "text", direction: "sent", content: "Mas n sei o que eu faço" },
      { id: "11", type: "text", direction: "received", content: "Imagina" },
      { id: "12", type: "audio", direction: "received", audioDuration: "0:41" },
      { id: "13", type: "audio", direction: "received", audioDuration: "0:12" },
      { id: "14", type: "audio", direction: "sent", audioDuration: "0:29" },
      { id: "15", type: "text", direction: "received", content: "Simm, vc sabe" },
      { id: "16", type: "text", direction: "received", content: "No rolo que eu tive com ", blurredContent: "** ** * ***" },
      { id: "17", type: "text", direction: "received", content: "Se apaixonar por amante é foda te entendo, ", blurredContent: "** ** * ** ** ** ** ** * ** ** ** **" },
      { id: "18", type: "audio", direction: "sent", audioDuration: "0:04" },
      { id: "19", type: "audio", direction: "sent", audioDuration: "0:11" },
      { id: "20", type: "text", direction: "received", content: "kkkkkkk" },
      { id: "21", type: "text", direction: "received", content: "Blz depois a gente se fala" }
    ]
  },
  5: {
    id: 5,
    sessionKey: "chat-5",
    storageTimeKey: "chat-time-start-17",
    readKey: "chat-5-read",
    defaultStatus: "Online há 33 min",
    messages: [
      { id: "1", type: "forwarded_story", direction: "received", storyAvatar: "/chat5.1a.png", storyUsername: "tinhooficial", imageSrc: "/chat5.1.png", hasPlayButton: true, reaction: "😂" },
      { id: "2", type: "date", direction: "system", content: "25 DE NOV, 15:22" },
      { id: "3", type: "forwarded_story", direction: "received", storyAvatar: "/chat5.2a.jpg", storyUsername: "ikarozets", imageSrc: "/chat5.2.png", hasPlayButton: true },
      { id: "4", type: "date", direction: "system", content: "27 DE NOV, 20:15" },
      { id: "5", type: "forwarded_story", direction: "received", storyAvatar: "/Chat5.a.png", storyUsername: "tettrem", imageSrc: "/chat5.3.png", hasPlayButton: true, reaction: "🥲" },
      { id: "6", type: "text", direction: "sent", content: "Esse achei triste" },
      { id: "7", type: "date", direction: "system", content: "29 DE NOV, 14:08" },
      { id: "8", type: "forwarded_story", direction: "sent", storyAvatar: "/Chat5.5a.png", storyUsername: "signodaputaria", imageSrc: "/Chat5.5.png", hasPlayButton: true },
      { id: "9", type: "forwarded_story", direction: "received", storyAvatar: "/Chat5.a.png", storyUsername: "tettrem", imageSrc: "/Chat5.4.png", hasPlayButton: true },
      { id: "10", type: "date", direction: "system", content: "ONTEM, 18:45" },
      { id: "11", type: "forwarded_story", direction: "sent", storyAvatar: "/Chat5.6a.png", storyUsername: "safadodesejo", imageSrc: "/chat5.6.png", hasPlayButton: true, reaction: "😂" },
      { id: "12", type: "text", direction: "sent", content: "kkkkkkkkkkkk" },
      { id: "13", type: "audio", direction: "received", audioDuration: "0:23", reaction: "😂" },
      { id: "14", type: "date", direction: "system", content: "ONTEM 22:11" },
      { id: "15", type: "forwarded_story", direction: "received", storyAvatar: "/chat5.7a.png", storyUsername: "morimura", imageSrc: "/Chat5.7.png", hasPlayButton: true },
      { id: "16", type: "unread_divider", direction: "system" },
      { id: "17", type: "date", direction: "system", content: "HOJE" }, // Isso será preenchido dinamicamente
      { id: "18", type: "forwarded_story", direction: "received", storyAvatar: "/chat5.8a.png", storyUsername: "jonas.milgrau", imageSrc: "/chat.5.8.png", hasPlayButton: true }
    ]
  }
};

const blurredHistoryDialogues: { [key: number]: MessageItemProps[] } = {
  1: [{
        id: "bh1", direction: "received", type: "text", content: "Amor vc viu ", blurredContent: "** ** *** ** ****" 
    }, {
        id: "bh2", direction: "sent", type: "text", content: "Siim vi agora kkkk" 
    }, {
        id: "bh3", direction: "received", type: "audio", audioDuration: "0:17" 
    }, {
        id: "bh4", direction: "sent", type: "text", content: "Que saudade ", blurredContent: "** ** ** ***" 
    }, {
        id: "bh5", direction: "received", type: "text", content: "Tbm to com sdd ", blurredContent: "** * ** ** ***" 
    }, {
        id: "bh6", direction: "sent", type: "audio", audioDuration: "0:23" 
    }, {
        id: "bh7", direction: "received", type: "heart" 
    }, {
        id: "bh8", direction: "sent", type: "text", content: "Vem cá então ", blurredContent: "** ** * ** ****" 
    }, {
        id: "bh9", direction: "received", type: "text", content: "", blurredContent: "** ** ** ** ** ** ** ** ***" 
    }, {
        id: "bh10", direction: "sent", type: "text", content: "😍😍" 
    }, {
        id: "bh11", direction: "received", type: "audio", audioDuration: "0:44" 
    }, {
        id: "bh12", direction: "sent", type: "text", content: "Pode deixar amor" 
    }
  ],
  2: [
    { id: "bh1", direction: "sent", type: "text", content: "Bom dia ", blurredContent: "** ** **" },
    { id: "bh2", direction: "received", type: "text", content: "Bom dia amor ❤️" },
    { id: "bh3", direction: "sent", type: "audio", audioDuration: "0:08" },
    { id: "bh4", direction: "received", type: "text", content: "Vamo fazer ligação ", blurredContent: "** ** ** **" },
    { id: "bh5", direction: "sent", type: "text", content: "Agoraaa??" },
    { id: "bh6", direction: "received", type: "text", content: "Sim vem logo" },
    { id: "bh7", direction: "sent", type: "text", content: "To ", blurredContent: "** ** ** ** *** **" },
    { id: "bh8", direction: "received", type: "audio", audioDuration: "0:31" },
    { id: "bh9", direction: "received", type: "text", content: "kkkkk ", blurredContent: "** ** ** ***" },
    { id: "bh10", direction: "sent", type: "heart" },
    { id: "bh11", direction: "sent", type: "text", content: "Liga de novo ", blurredContent: "** ** ***" },
    { id: "bh12", direction: "received", type: "text", content: "Perai ", blurredContent: "** ** ** ** ****" },
  ],
  3: [
    { id: "bh1", direction: "received", type: "text", content: "Oi ", blurredContent: "** ** ** ** ***" },
    { id: "bh2", direction: "sent", type: "text", content: "Oii" },
    { id: "bh3", direction: "received", type: "text", content: "Precisamos conversar" },
    { id: "bh4", direction: "sent", type: "audio", audioDuration: "1:12" },
    { id: "bh5", direction: "received", type: "text", content: "Sério ", blurredContent: "** ** ** ** ** ** ***" },
    { id: "bh6", direction: "received", type: "audio", audioDuration: "0:38" },
    { id: "bh7", direction: "sent", type: "text", content: "Ta bom ", blurredContent: "** ** ***" },
    { id: "bh8", direction: "received", type: "text", content: "", blurredContent: "** ** ** *** ** ** ** ***" },
    { id: "bh9", direction: "sent", type: "text", content: "Eu sei" },
    { id: "bh10", direction: "received", type: "heart" },
    { id: "bh11", direction: "sent", type: "text", content: "", blurredContent: "** ** ** *** ** **" },
    { id: "bh12", direction: "received", type: "text", content: "💔" },
  ],
  4: [
    { id: "bh1", direction: "received", type: "text", content: "Ei ", blurredContent: "** ** ** ***" },
    { id: "bh2", direction: "sent", type: "text", content: "Oi fala" },
    { id: "bh3", direction: "received", type: "audio", audioDuration: "0:52" },
    { id: "bh4", direction: "sent", type: "text", content: "Sério isso??" },
    { id: "bh5", direction: "received", type: "text", content: "Sim mano ", blurredContent: "** ** ** ** ***" },
    { id: "bh6", direction: "sent", type: "audio", audioDuration: "0:19" },
    { id: "bh7", direction: "received", type: "text", content: "Exato kkkk" },
    { id: "bh8", direction: "sent", type: "text", content: "Eu avisei ", blurredContent: "** ** ** *** **" },
    { id: "bh9", direction: "received", type: "text", content: "Eu sei eu sei" },
    { id: "bh10", direction: "sent", type: "text", content: "Dps a gente conversa" },
    { id: "bh11", direction: "received", type: "audio", audioDuration: "0:27" },
    { id: "bh12", direction: "sent", type: "text", content: "👍" },
  ],
  5: [
    { id: "bh1", direction: "received", type: "text", content: "Mano olha isso kkkkk" },
    { id: "bh2", direction: "sent", type: "text", content: "KKKKKKKK" },
    { id: "bh3", direction: "received", type: "text", content: "", blurredContent: "** ** ** *** ** ** **" },
    { id: "bh4", direction: "sent", type: "text", content: "Nem fala kkk" },
    { id: "bh5", direction: "received", type: "audio", audioDuration: "0:14" },
    { id: "bh6", direction: "sent", type: "text", content: "😂😂😂" },
    { id: "bh7", direction: "received", type: "text", content: "Tu viu ", blurredContent: "** ** *** ** ***" },
    { id: "bh8", direction: "sent", type: "text", content: "Vi sim kkkkkkk" },
    { id: "bh9", direction: "received", type: "text", content: "", blurredContent: "** ** ** ** ** ***" },
    { id: "bh10", direction: "sent", type: "audio", audioDuration: "0:06" },
    { id: "bh11", direction: "received", type: "heart" },
    { id: "bh12", direction: "sent", type: "text", content: "Dps me manda mais" },
  ],
};


// ===========================================
// COMPONENTES DE MENSAGEM (AUXILIARES)
// ===========================================

interface AudioMessageProps {
  message: MessageItemProps;
  isSent: boolean;
  onShowVIPPopup: () => void;
  onDismissVIPPopup: () => void;
  onBlockedAction: (feature: string) => void;
  audioIndex: number;
  chatId: number;
  chatTranslations: typeof chatTranslations["pt-BR"];
}

const AudioMessage: React.FC<AudioMessageProps> = ({
  message: t,
  isSent,
  onShowVIPPopup,
  onDismissVIPPopup,
  onBlockedAction,
  audioIndex,
  chatId,
  chatTranslations
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedProgress, setPlayedProgress] = useState(0);
  const [isWaveformAnimating, setIsWaveformAnimating] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<"idle" | "transcribing" | "failed">("idle");
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const playedTimeRef = useRef<number>(0);
  const waveformData = useRef(generateWaveformData());
  
  const totalDurationMs = (() => {
    const parts = (t.audioDuration || "0:30").split(":");
    const minutes = parseInt(parts[0] || "0");
    const seconds = parseInt(parts[1] || "0");
    return (minutes * 60 + seconds) * 1000;
  })();

  const formatRemainingTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const remainingTime = totalDurationMs - (playedProgress * totalDurationMs);
  const displayedTime = isPlaying || playedProgress > 0
    ? formatRemainingTime(remainingTime)
    : t.audioDuration;

  const audioStorageKey = `chat-${chatId}_audio-${audioIndex}-${t.audioDuration}`;
  const isListened = typeof window !== "undefined" && localStorage.getItem(audioStorageKey) === "listened";

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playedTimeRef.current += Date.now() - startTimeRef.current;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      onDismissVIPPopup(); // Dismiss VIP popup
    } else {
      setIsPlaying(true);
      setIsWaveformAnimating(true);
      startTimeRef.current = Date.now();
      
      if (transcriptionStatus === "idle" && playedProgress === 0) {
        setTranscriptionStatus("failed"); // Entra em VIP automaticamente
        onShowVIPPopup(); // Show VIP popup
      }
      
      if (typeof window !== "undefined") {
        localStorage.setItem(audioStorageKey, "listened");
      }

      const animate = () => {
        const elapsedTime = Date.now() - startTimeRef.current + playedTimeRef.current;
        const progress = Math.min(elapsedTime / totalDurationMs, 1);
        setPlayedProgress(progress);

        if (progress >= 1) {
          setIsPlaying(false);
          setPlayedProgress(0);
          setIsWaveformAnimating(false);
          playedTimeRef.current = 0;
          onDismissVIPPopup(); // Dismiss VIP popup
        } else {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  const handleTranscriptionClick = () => {
    if (transcriptionStatus === "idle") {
      setTranscriptionStatus("transcribing");
      setTimeout(() => {
        setTranscriptionStatus("failed");
        setTimeout(() => onBlockedAction(chatTranslations.transcribeAudio), 300);
      }, 1500);
    }
  };

  const progressIndex = Math.floor(playedProgress * waveformData.current.length);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded-full ${isListened ? 'bg-gray-700' : 'bg-blue-600'} text-white text-xs`}
          aria-label={isPlaying ? chatTranslations.pauseAudio : chatTranslations.playAudio}
          onClick={togglePlay}
        >
          {isPlaying ? <Play size={16} fill="white" className="rotate-90" /> : <Play size={16} fill="white" />}
        </button>
        <div className="flex items-center gap-0.5 w-[130px]">
          {waveformData.current.map((height, idx) => (
            <div
              key={idx}
              className={`w-0.5 rounded-full transition-colors duration-300 ${isWaveformAnimating ? (idx < progressIndex ? 'bg-white' : (isSent ? 'bg-gray-400' : 'bg-gray-600')) : (isSent ? 'bg-gray-400' : 'bg-gray-600')}`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-400">{displayedTime}</span>
      </div>
      <div
        className="text-xs text-gray-500 hover:underline cursor-pointer ml-10 p-1"
        onClick={handleTranscriptionClick}
      >
        {transcriptionStatus === "idle" && (chatTranslations.viewFullHistory || "Ver transcrição")}
        {transcriptionStatus === "transcribing" && (chatTranslations.transcribing || "Transcrevendo...")}
        {transcriptionStatus === "failed" && (
          <span className="text-red-400">
            {chatTranslations.transcriptionFailed || "Não foi possível transcrever."}
            <br />
            {chatTranslations.requiresVIP || "Requer acesso VIP"}
          </span>
        )}
      </div>
    </div>
  );
};

interface SystemCallMessageProps {
  message: MessageItemProps;
  metaInfo: MetaInfo;
  onBlockedAction: (feature: string) => void;
  chatTranslations: typeof chatTranslations["pt-BR"];
}

const SystemCallMessage: React.FC<SystemCallMessageProps> = ({
  message,
  metaInfo,
  onBlockedAction,
  chatTranslations
}) => {
  const statusClasses = {
    normal: "text-blue-400",
    missed: "text-red-400",
    ended: "text-gray-500"
  };
  const icon = message.callType === "video" ? <Video size={16} className="text-white" /> : <Phone size={16} className="text-white" />;
  const contentMap = {
    "Chamada de vídeo": chatTranslations.videoCallLabel,
    "Ligação de vídeo perdida": chatTranslations.videoCallMissed,
    "Ligação de vídeo encerrada": chatTranslations.videoCallEnded
  };
  const contentText = (message.content && contentMap[message.content as keyof typeof contentMap]) || message.content;

  return (
    <div className={`text-center py-2 text-xs text-gray-500 flex items-center justify-center gap-2 ${statusClasses[message.callStatus || 'normal']}`}>
      {message.callStatus === 'missed' && <Lock size={14} />}
      {icon}
      <span>{contentText}</span>
      {message.timeId && metaInfo[message.timeId as keyof MetaInfo] && (
        <span className="text-gray-600"> &bull; {metaInfo[message.timeId as keyof MetaInfo]}</span>
      )}
      {message.callStatus === 'missed' && (
        <button onClick={() => onBlockedAction(chatTranslations.callBack)} className="text-blue-400 hover:underline ml-2">
          {chatTranslations.callBack}
        </button>
      )}
    </div>
  );
};

interface ForwardedStoryMessageProps {
  message: MessageItemProps;
  onBlockedAction: (feature: string) => void;
  onReelClick: (path: string) => void;
}

const ForwardedStoryMessage: React.FC<ForwardedStoryMessageProps> = ({ message, onBlockedAction, onReelClick }) => {
  const isSensitive = !message.hasPlayButton; // Se não tem play button, é sensível (thumbnail)
  const imageUrl = getCleanedImageUrl(message.imageSrc || "");

  const handleClick = () => {
    if (message.hasPlayButton && message.imageSrc) {
      onReelClick(imageUrl);
    } else {
      onBlockedAction("ver stories encaminhados");
    }
  };

  return (
    <div className="relative w-48 h-64 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-lg cursor-pointer" onClick={handleClick}>
      <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full z-10">
        <img src={getCleanedImageUrl(message.storyAvatar || "")} alt={message.storyUsername} className="w-5 h-5 rounded-full object-cover" />
        <span className="text-white text-xs font-semibold">{message.storyUsername}</span>
      </div>
      <img src={imageUrl} alt="Story" className={`w-full h-full object-cover ${isSensitive ? 'blur-lg opacity-70' : ''}`} />
      {isSensitive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Lock size={32} className="text-red-500" />
        </div>
      )}
      {message.hasPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play size={48} fill="white" className="text-white/80" />
        </div>
      )}
      {message.reaction && <div className="absolute bottom-2 right-2 bg-gray-800 rounded-full px-2 py-1 text-sm">{message.reaction}</div>}
    </div>
  );
};


interface ImageMessageProps {
  message: MessageItemProps;
  onOpenFullscreen: (imageSrc: string, imageId: string) => void;
  chatId: number;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ message, onOpenFullscreen, chatId }) => {
  if (message.isPackImages && message.packImages) {
    return (
      <div className="flex flex-wrap -space-x-4">
        {message.packImages.map((imgSrc, idx) => {
          const imgId = getImageId(chatId, message.id, imgSrc, idx);
          return (
            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800 shadow-xl cursor-pointer" onClick={() => onOpenFullscreen(imgSrc, imgId)}>
              <img src={getCleanedImageUrl(imgSrc)} alt="Sensitive content" className="w-full h-full object-cover blur-lg opacity-70" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <EyeOff size={24} className="text-white" />
              </div>
            </div>
          );
        })}
        {message.reaction && <div className="absolute bottom-1 right-1 bg-gray-800 rounded-full px-2 py-0.5 text-xs">{message.reaction}</div>}
      </div>
    );
  }

  const imgId = getImageId(chatId, message.id, message.imageSrc || "");
  return (
    <div className="relative w-48 h-auto rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800 shadow-xl cursor-pointer" onClick={() => onOpenFullscreen(message.imageSrc || "", imgId)}>
      <img src={getCleanedImageUrl(message.imageSrc || "")} alt="Sensitive content" className="w-full h-full object-cover blur-lg opacity-70" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <EyeOff size={24} className="text-white" />
      </div>
      {message.reaction && <div className="absolute bottom-1 right-1 bg-gray-800 rounded-full px-2 py-0.5 text-xs">{message.reaction}</div>}
    </div>
  );
};


interface FullscreenImageModalProps {
  isOpen: boolean;
  imageSrc: string;
  imageId: string;
  onClose: () => void;
  onGoToCTA: () => void;
  onShowBlockedPopup: (feature: string) => void;
}

const FullscreenImageModal: React.FC<FullscreenImageModalProps> = ({
  isOpen,
  imageSrc,
  imageId,
  onClose,
  onGoToCTA,
  onShowBlockedPopup
}) => {
  const [stage, setStage] = useState<"initial" | "revealing" | "blocked">("initial");
  const [isShaking, setIsShaking] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (hasViewedImage(imageId)) {
        onClose();
        setTimeout(() => onShowBlockedPopup("Seja um membro VIP para poder rever as imagens do chat"), 100);
      } else {
        setStage("initial");
        setIsShaking(false);
      }
    }
  }, [isOpen, imageId, onClose, onShowBlockedPopup]);

  const handleAction = useCallback(() => {
    if (stage === "initial") {
      setStage("revealing");
      setIsShaking(true);
      setTimeout(() => {
        if (mounted.current) setIsShaking(false);
      }, 600);
      setTimeout(() => {
        if (mounted.current) {
          markImageViewed(imageId);
          setStage("blocked");
        }
      }, 3000);
    } else if (stage === "blocked") {
      onClose();
      onGoToCTA();
    }
  }, [stage, imageId, onClose, onGoToCTA]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      if (mounted.current) {
        setStage("initial");
        setIsShaking(false);
      }
    }, 300);
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  const isRevealing = stage === "revealing";
  const isBlocked = stage === "blocked";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[99998] flex items-center justify-center p-4 transition-opacity duration-300"
      ref={modalRef}
      onClick={handleBackdropClick}
    >
      <div className={`relative bg-gray-900 rounded-lg shadow-xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col transition-all duration-300 ${isShaking ? 'animate-shake' : ''}`}>
        <img
          src={getCleanedImageUrl(imageSrc)}
          alt="Conteúdo sensível"
          className={`w-full h-auto object-contain ${isRevealing ? '' : 'blur-lg opacity-70'} transition-all duration-500`}
        />

        <button
          className="absolute top-4 left-4 text-white p-2 bg-black/50 rounded-full hover:bg-black/70 z-10"
          onClick={handleClose}
          aria-label="Voltar"
        >
          <ChevronLeft size={24} />
        </button>

        <div className={`absolute inset-0 flex flex-col items-center justify-center text-white text-center transition-opacity duration-500 ${isRevealing ? 'opacity-0' : 'opacity-100'}`}>
          <div className="p-4">
            {isBlocked ? (
              <Lock size={48} className="mx-auto mb-4 text-red-500" />
            ) : (
              <EyeOff size={48} className="mx-auto mb-4 text-white/70" />
            )}
            <p className="font-bold text-lg mb-2">
              {isBlocked ? "Conteúdo Bloqueado" : "Conteúdo Confidencial"}
            </p>
            <p className="text-sm text-gray-400">
              {isBlocked
                ? "Você precisa ser um membro VIP para visualizar este material."
                : "Esta mídia pode conter material sensível. Para visualizá-la, você precisa de acesso VIP."}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-800 flex justify-center">
          <button
            onClick={handleAction}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-colors flex items-center gap-2"
          >
            {isBlocked ? "Seja um Membro VIP" : "Ver Foto"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


interface GeneralMessageProps {
  message: MessageItemProps;
  userPhoto: string;
  onBlockedAction: (feature: string) => void;
  onShowVIPPopup: () => void;
  onDismissVIPPopup: () => void;
  onOpenFullscreen: (imageSrc: string, imageId: string) => void;
  onReelClick: (path: string) => void;
  metaInfo: MetaInfo;
  dynamicContent: Record<string, string>;
  audioIndex: number;
  chatId: number;
  chatTranslations: typeof chatTranslations["pt-BR"];
  onTouchStart: ((event: React.TouchEvent<HTMLDivElement>) => void) | undefined;
  onTouchEnd: ((event: React.TouchEvent<HTMLDivElement>) => void) | undefined;
  onTouchMove: ((event: React.TouchEvent<HTMLDivElement>) => void) | undefined;
  onContextMenu: ((event: React.MouseEvent<HTMLDivElement>) => void) | undefined;
}

const GeneralMessage: React.FC<GeneralMessageProps> = ({
  message,
  userPhoto,
  onBlockedAction,
  onShowVIPPopup,
  onDismissVIPPopup,
  onOpenFullscreen,
  onReelClick,
  metaInfo,
  dynamicContent,
  audioIndex,
  chatId,
  chatTranslations,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onContextMenu
}) => {
  if (message.type === "date") {
    let content = message.content;
    const today = new Date();
    if (content === "HOJE") {
      content = today.toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' }).toUpperCase();
    }
    if (message.timeId && metaInfo[message.timeId as keyof MetaInfo]) {
      content = metaInfo[message.timeId as keyof MetaInfo];
    }
    return <div className="text-center py-2 text-xs text-gray-500">{content}</div>;
  }
  if (message.type === "unread_divider")
    return (
      <div className="flex items-center gap-2 my-4">
        <div className="flex-grow border-t border-gray-700" />
        <span className="text-xs text-blue-400 font-semibold">{chatTranslations.newMessages}</span>
        <div className="flex-grow border-t border-gray-700" />
      </div>
    );
  if (message.type === "system_call")
    return <SystemCallMessage message={message} metaInfo={metaInfo} onBlockedAction={onBlockedAction} chatTranslations={chatTranslations} />;

  const isSent = message.direction === "sent";
  const isHeart = message.type === "heart";
  
  let displayedContent = message.content || "";

  if (message.dynamicType && dynamicContent && typeof dynamicContent === 'object') {
      const dynamicValue = dynamicContent[message.dynamicType];
      if (dynamicValue) {
          if (message.dynamicType === 'firstName') {
              displayedContent = `${dynamicValue} ${displayedContent}`;
          } else if (message.dynamicType === 'userSpiedName') {
              if (message.content === "Por favor ") {
                  displayedContent = `Por favor ${dynamicValue}`;
              } else if (message.content === "") {
                  displayedContent = `${dynamicValue}???`;
              } else if (message.content === "Bom dia ") {
                  displayedContent = `Bom dia ${dynamicValue || "bb"}`;
              } else {
                  displayedContent = `${displayedContent} ${dynamicValue}`;
              }
          } else if (message.dynamicType === 'date2WeeksAhead') {
              displayedContent = `${displayedContent} ${dynamicValue}`;
          } else if (message.dynamicType === 'city') {
              const city = dynamicValue || "casa";
              displayedContent = displayedContent.replace("**", city)
              .replace("em aqui", `em ${city} aqui`)
              .replace("in here", `in ${city} here`)
              .replace("en aquí", `en ${city} aquí`);
            displayedContent = displayedContent.replace("To em ", `Tô em ${city} `).replace("Tô em ", `Tô em ${city} `)
          }
      }
  }


  const isEmoji = isHeart || (!message.imageSrc && !message.audioDuration && !message.blurredContent && displayedContent.match(/^(?:[\u2700-\u27bf]|\ud83c[\udde6-\uddff]{2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udf00-\uffff]|\ud83d[\udc00-\uffff]|\ud83e[\udc00-\uffff])[\s\ufe0f]*$/) && displayedContent.length < 10);

  return (
    <div
      className={`flex mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      onContextMenu={onContextMenu}
    >
      {!isSent && (
        <img
          src={getCleanedImageUrl(userPhoto)}
          alt="Avatar"
          className="w-7 h-7 rounded-full object-cover mr-2 flex-shrink-0"
        />
      )}
      <div className={`flex flex-col max-w-[75%] ${isSent ? 'items-end' : 'items-start'}`}>
        {message.replyTo && (message.type === 'reply' || isSent) && ( // Só mostra reply se for o tipo reply ou se for mensagem enviada que está respondendo
          <div className={`px-3 py-1 text-xs rounded-t-lg ${isSent ? 'bg-purple-900/50 text-white rounded-bl-lg' : 'bg-gray-800/50 text-gray-300 rounded-br-lg'} mb-1`}>
            <div className="text-gray-400">{message.replyLabel}</div>
            <div className="flex items-center gap-1">
              <div className={`w-0.5 h-4 ${isSent ? 'bg-purple-500' : 'bg-blue-500'}`} />
              <span className="truncate">{message.replyTo}</span>
            </div>
          </div>
        )}
        <div
          className={`relative px-4 py-2 rounded-2xl ${isSent ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-800 text-white rounded-bl-none'} ${isEmoji ? 'text-4xl px-2 py-0' : 'text-sm'}`}
        >
          {message.type === "image" && message.isSensitive ? (
            <ImageMessage message={message} onOpenFullscreen={onOpenFullscreen} chatId={chatId} />
          ) : message.type === "audio" ? (
            <AudioMessage {...{ message, isSent, onShowVIPPopup, onDismissVIPPopup, onBlockedAction, audioIndex, chatId, chatTranslations }} />
          ) : message.type === "forwarded_story" ? (
            <ForwardedStoryMessage message={message} onBlockedAction={onBlockedAction} onReelClick={onReelClick} />
          ) : (
            <span className={`${message.blurredContent ? 'blur-sm select-none pointer-events-none' : ''}`}>
              {displayedContent}{message.blurredContent}
            </span>
          )}
          {message.reaction && (message.type !== 'forwarded_story' && message.type !== 'image') && (
            <div className="absolute -bottom-2 -right-2 bg-gray-700 text-xs px-2 py-0.5 rounded-full border border-gray-800" onClick={(e) => { e.stopPropagation(); onBlockedAction(chatTranslations.reactToMessage); }}>
              {message.reaction}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const BlurredHistoryMessage: React.FC<BlurredHistoryMessageProps> = ({ msg }) => {
  const waveformData = useRef(generateWaveformData());

  if (msg.type === "heart")
    return (
      <div className={`flex mb-2 ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
        {msg.direction === "received" && <div className="w-7 h-7 rounded-full bg-gray-700 mr-2" />}
        <div className="text-4xl">❤️</div>
      </div>
    );
  if (msg.type === "audio")
    return (
      <div className={`flex mb-2 ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
        {msg.direction === "received" && <div className="w-7 h-7 rounded-full bg-gray-700 mr-2" />}
        <div className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1">
          <Play size={16} fill="white" className="text-gray-400" />
          <div className="flex items-center gap-0.5 w-[80px]">
            {waveformData.current.map((height, idx) => (
              <div key={idx} className="w-0.5 bg-gray-500 rounded-full" style={{ height: `${Math.floor(height / 2)}px` }} />
            ))}
          </div>
          <span className="text-xs text-gray-500">{msg.audioDuration || "0:12"}</span>
        </div>
      </div>
    );

  const content = (msg.content || "") + (msg.blurredContent ? msg.blurredContent : "");
  return (
    <div className={`flex mb-2 ${msg.direction === 'sent' ? 'justify-end' : 'justify-start'}`}>
      {msg.direction === "received" && <div className="w-7 h-7 rounded-full bg-gray-700 mr-2" />}
      <div className={`px-4 py-2 rounded-2xl ${msg.direction === 'sent' ? 'bg-purple-600/50' : 'bg-gray-800/50'} text-gray-300 text-sm blur-sm select-none pointer-events-none`}>
        {content}
        {msg.reaction && <div className="absolute -bottom-2 -right-2 bg-gray-700 text-xs px-2 py-0.5 rounded-full border border-gray-800">{msg.reaction}</div>}
      </div>
    </div>
  );
};


// ===========================================
// MAIN CHAT PAGE
// ===========================================

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const chatId = parseInt(id || '1', 10);
  const chatConfig = DIALOGUES[chatId] || DIALOGUES[1];
  const translations = chatTranslations["pt-BR"];

  const [chatUser, setChatUser] = useState<{ name: string; avatar: string } | null>(null);
  const [messages, setMessages] = useState<MessageItemProps[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');
  const [showVIPPopup, setShowVIPPopup] = useState(false);
  const [inputText, setInputText] = useState("");
  const [metaInfo, setMetaInfo] = useState<MetaInfo>({});
  const [dynamicContent, setDynamicContent] = useState<Record<string, string>>({}); // Changed from any to proper type
  const [showImageFullscreen, setShowImageFullscreen] = useState({ isOpen: false, imageSrc: "", imageId: "" });
  const [showReelFullscreen, setShowReelFullscreen] = useState({ isOpen: false, videoSrc: "" });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const blurredHistoryRef = useRef<HTMLDivElement>(null);
  const chatMessagesContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledToBlurredDivider = useRef(false);

  // Context Menu States
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [reactionsMenuPosition, setReactionsMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedMessageContent, setSelectedMessageContent] = useState<string | null>(null);
  const [selectedMessageIsSent, setSelectedMessageIsSent] = useState(false);


  useEffect(() => {
    const invasionDataRaw = sessionStorage.getItem('invasionData');
    if (invasionDataRaw) {
      const invasionData = JSON.parse(invasionDataRaw);

      if (invasionData.generatedMessages && invasionData.generatedMessages.length > 0) {
        const currentUserData = invasionData.generatedMessages.find((msg: any) => msg.id === id);
        if (currentUserData) {
          setChatUser({ name: getMaskedUsername(currentUserData.name), avatar: currentUserData.avatar });
        }
      } else {
        setChatUser({ name: getMaskedUsername(invasionData.profileData?.username || ''), avatar: invasionData.profileData?.profilePicUrl || '' });
      }

      const profile = invasionData.profileData;
      let firstName = profile?.fullName ? profile.fullName.split(" ")[0] : profile?.username;
      if (firstName) firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

      const userSpiedName = profile?.fullName || profile?.username || "alvo";
      
      let currentCity = "São Paulo";
      if (invasionData.userCity) {
        currentCity = invasionData.userCity;
      } else {
        const storedCity = localStorage.getItem("user_city");
        if (storedCity) currentCity = storedCity;
      }

      const today = new Date();
      const twoWeeksAhead = new Date(today);
      twoWeeksAhead.setDate(today.getDate() + 14);
      const date2WeeksAheadFormatted = twoWeeksAhead.toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' });
      
      const lastMessageDate = new Date();
      const lastMessageTime = `${String(lastMessageDate.getHours()).padStart(2, '0')}:${String(lastMessageDate.getMinutes()).padStart(2, '0')}`;
      
      const date27DaysAgo = new Date();
      date27DaysAgo.setDate(date27DaysAgo.getDate() - 27);
      const date27DaysAgoFormatted = date27DaysAgo.toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' }).toUpperCase();
      
      const callTime1Date = new Date(Date.now() - 660 * 1000); // 11 min atrás
      const callTime2Date = new Date(Date.now() - 540 * 1000); // 9 min atrás
      const callTime3Date = new Date(Date.now() - 6900 * 1000); // 115 min atrás
      
      const formatCallTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

      setMetaInfo({
        firstName: firstName,
        userSpiedName: userSpiedName,
        city: currentCity,
        date2WeeksAhead: `Dia ${date2WeeksAheadFormatted}`,
        lastMessageTime: lastMessageTime,
        date27DaysAgo: `${date27DaysAgoFormatted}, ${formatCallTime(date27DaysAgo)}`,
        callTime1: formatCallTime(callTime1Date), // Changed from `formatCallTime(callTime1Date)`
        callTime2: formatCallTime(callTime2Date), // Changed from `formatCallTime(callTime2Date)`
        callTime3: formatCallTime(callTime3Date) // Changed from `formatCallTime(callTime3Date)`
      });
      // Atualizar o 'HOJE' das mensagens
      const updatedMessages = chatConfig.messages.map(msg => {
          if (msg.type === "date" && msg.content === "HOJE") {
              return { ...msg, content: today.toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' }).toUpperCase() };
          }
          return msg;
      });
      setMessages(updatedMessages);

    } else {
      navigate('/instagram');
    }
  }, [id, chatConfig, navigate]);

  // Scroll to bottom on mount
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  // Handle Blurred History Section visibility
  const updateBlurredHistoryVisibility = useCallback(() => {
    if (chatMessagesContainerRef.current && blurredHistoryRef.current) {
      const containerRect = chatMessagesContainerRef.current.getBoundingClientRect();
      const blurredRect = blurredHistoryRef.current.getBoundingClientRect();

      // Check if the blurred history section is within the viewport
      if (blurredRect.top < containerRect.bottom && blurredRect.bottom > containerRect.top) {
        if (!hasScrolledToBlurredDivider.current) {
          handleBlockedAction(translations.viewFullHistory);
          hasScrolledToBlurredDivider.current = true; // Mark as shown
        }
      }
    }
  }, [translations.viewFullHistory]);

  useEffect(() => {
    const container = chatMessagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateBlurredHistoryVisibility);
      updateBlurredHistoryVisibility(); // Initial check
      return () => container.removeEventListener('scroll', updateBlurredHistoryVisibility);
    }
  }, [updateBlurredHistoryVisibility]);


  const handleBlockedAction = (feature: string) => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  };

  const handleShowVIPPopup = useCallback(() => {
    setShowVIPPopup(true);
    // Auto-dismiss after 2.5 seconds
    setTimeout(() => setShowVIPPopup(false), 2500);
  }, []);

  const handleDismissVIPPopup = useCallback(() => {
    setShowVIPPopup(false);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputText.trim()) {
      // Simulate sending a message
      const newMessage = {
        id: `sent-${Date.now()}`,
        type: 'text' as const,
        direction: 'sent' as const,
        content: inputText.trim(),
        showError: true, // Adicionado para simular erro de envio
      };
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      setTimeout(() => navigate('/invasion-concluded'), 1000); // Redireciona
    }
  }, [inputText, navigate]);

  const handleSendHeart = useCallback(() => {
      const newHeart = {
        id: `sent-heart-${Date.now()}`,
        type: 'heart' as const,
        direction: 'sent' as const,
        showError: true,
      };
      setMessages(prev => [...prev, newHeart]);
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      setTimeout(() => navigate('/invasion-concluded'), 1000); // Redireciona
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputText.trim()) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const blurredHistoryMessages = blurredHistoryDialogues[chatId] || []; // Get relevant blurred history

  // Context menu logic
  const handleMessageLongPress = useCallback((event: React.MouseEvent | React.TouchEvent, messageContent: string, isSent: boolean) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setSelectedMessageContent(messageContent);
    setSelectedMessageIsSent(isSent);

    let top = 0;
    let left = 0;

    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const menuWidth = 180; // Approximate width of context menu
    const menuHeight = 250; // Approximate height of context menu

    if (event.type === 'contextmenu') {
      const mouseEvent = event as React.MouseEvent;
      top = mouseEvent.clientY;
      left = mouseEvent.clientX;
    } else { // Touch event
      const touchEvent = event as React.TouchEvent;
      top = touchEvent.touches[0].clientY;
      left = touchEvent.touches[0].clientX;
    }

    // Adjust position to keep menu within viewport
    if (top + menuHeight > windowHeight) {
      top = windowHeight - menuHeight - 10; // 10px padding from bottom
    }
    if (left + menuWidth > windowWidth) {
      left = windowWidth - menuWidth - 10; // 10px padding from right
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;

    setContextMenuPosition({ top, left });
    setShowContextMenu(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setShowReactionsMenu(false);
    setSelectedMessageContent(null);
  }, []);

  const handleReactionClick = (reaction: string) => {
    handleBlockedAction(`reagir com ${reaction}`);
    handleCloseContextMenu();
  };

  const handleContextMenuAction = (action: string) => {
    if (action === "Reagir") {
        setShowReactionsMenu(true);
        // Position reactions menu relative to context menu
        setReactionsMenuPosition({top: contextMenuPosition.top, left: contextMenuPosition.left + 190});
    } else {
        handleBlockedAction(action);
    }
    handleCloseContextMenu();
  };


  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black text-gray-50 font-sans border-x border-gray-800">
      <LockedFeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureName={modalFeatureName}
      />
      <FreeTimeFloatingButton />
      <AnimatePresence>
        {showVIPPopup && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-gray-900 rounded-2xl p-6 text-center shadow-lg border border-gray-700"
            >
              <VolumeX size={48} className="mx-auto mb-4 text-purple-400" />
              <p className="text-white text-lg font-semibold mb-2">{translations.audioVIPMessage}</p>
              <button
                onClick={() => handleBlockedAction(translations.audioVIPMessage.toLowerCase())}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
              >
                Seja Membro VIP
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FullscreenImageModal
        isOpen={showImageFullscreen.isOpen}
        imageSrc={showImageFullscreen.imageSrc}
        imageId={showImageFullscreen.imageId}
        onClose={() => setShowImageFullscreen({ isOpen: false, imageSrc: "", imageId: "" })}
        onGoToCTA={() => navigate('/invasion-concluded')}
        onShowBlockedPopup={handleBlockedAction}
      />

      <ReelFullscreenView
        isOpen={showReelFullscreen.isOpen}
        videoSrc={showReelFullscreen.videoSrc}
        onClose={() => setShowReelFullscreen({ isOpen: false, videoSrc: "" })}
      />

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/messages')} className="p-1 text-white">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleBlockedAction("ver o perfil do usuário")}>
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={chatUser?.avatar || '/perfil.jpg'} alt={chatUser?.name} className="w-full h-full object-cover blur-sm" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white">{chatUser?.name}</span>
              <span className="text-xs text-gray-500">{translations.onlineNow}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => handleBlockedAction(translations.audioCall)} className="p-1 text-white">
            <PhoneIcon />
          </button>
          <button onClick={() => handleBlockedAction(translations.videoCall)} className="p-1 text-white">
            <VideoIcon />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main ref={chatMessagesContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide">
        <div ref={blurredHistoryRef} className="blurred-history-section">
          {blurredHistoryMessages.map((msg, index) => (
            <BlurredHistoryMessage key={`bh-${index}`} msg={msg} />
          ))}
        </div>
        {messages.map((message, index) => {
          const isSent = message.direction === 'sent';
          const isInteractable = !['date', 'unread_divider', 'system_call'].includes(message.type);
          const audioMsgCount = messages.slice(0, index + 1).filter(msg => msg.type === "audio").length -1
          return (
            <GeneralMessage
              key={message.id}
              message={message}
              userPhoto={chatUser?.avatar || '/perfil.jpg'}
              onBlockedAction={handleBlockedAction}
              onShowVIPPopup={handleShowVIPPopup}
              onDismissVIPPopup={handleDismissVIPPopup}
              onOpenFullscreen={(src, id) => setShowImageFullscreen({ isOpen: true, imageSrc: src, imageId: id })}
              onReelClick={(path) => setShowReelFullscreen({ isOpen: true, videoSrc: path })}
              metaInfo={metaInfo}
              dynamicContent={dynamicContent}
              audioIndex={audioMsgCount}
              chatId={chatId}
              chatTranslations={translations}
              onTouchStart={isInteractable ? (e) => handleMessageLongPress(e, `${message.content || ''}${message.blurredContent || ''}`, isSent) : undefined}
              onTouchEnd={undefined}
              onTouchMove={undefined}
              onContextMenu={isInteractable ? (e) => handleMessageLongPress(e, `${message.content || ''}${message.blurredContent || ''}`, isSent) : undefined}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Context Menu (Long Press) Overlay */}
      <AnimatePresence>
        {(showContextMenu || showReactionsMenu) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
            onClick={handleCloseContextMenu}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-lg z-30 flex flex-col text-sm"
            style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
          >
            {selectedMessageContent && (
              <div className={`p-2 mb-2 text-gray-300 max-w-[150px] truncate ${selectedMessageIsSent ? 'text-right' : 'text-left'}`}>
                {selectedMessageContent}
              </div>
            )}
            <button onClick={() => handleContextMenuAction("Reagir")} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-white">
              <Heart size={16} /> Reagir
            </button>
            <button onClick={() => handleContextMenuAction(translations.reply)} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-white">
              <ChevronLeft size={16} /> {translations.reply}
            </button>
            <button onClick={() => handleContextMenuAction(translations.forward)} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-white">
              <Play size={16} /> {translations.forward}
            </button>
            <button onClick={() => handleContextMenuAction(translations.download)} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-white">
              <Camera size={16} /> {translations.download}
            </button>
            <button onClick={() => handleContextMenuAction(translations.deleteMessage)} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-white">
              <Trash2 size={16} /> {translations.deleteForYou}
            </button>
            <button onClick={() => handleContextMenuAction(translations.reportMessage)} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md text-red-400">
              <Flag size={16} /> {translations.reportMessage}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showReactionsMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bg-gray-900 border border-gray-700 rounded-full p-1 shadow-lg z-40 flex text-2xl"
            style={{ top: reactionsMenuPosition.top, left: reactionsMenuPosition.left }}
          >
            <span role="img" aria-label="heart" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('❤️')}>❤️</span>
            <span role="img" aria-label="laughing" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('😂')}>😂</span>
            <span role="img" aria-label="devil" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('😈')}>😈</span>
            <span role="img" aria-label="drooling" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('🤤')}>🤤</span>
            <span role="img" aria-label="angry" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('😡')}>😡</span>
            <span role="img" aria-label="fire" className="p-2 cursor-pointer hover:bg-gray-800 rounded-full" onClick={() => handleReactionClick('🔥')}>🔥</span>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Input Area */}
      <footer className="p-3 border-t border-gray-800 bg-black sticky bottom-0 z-10">
        <div className="flex items-center gap-2 bg-gray-800 rounded-full pl-4 pr-1 py-1">
          <button onClick={() => handleBlockedAction("abrir câmera")} className="p-1 text-white">
            <CameraInputIcon />
          </button>
          <input
            type="text"
            placeholder={translations.messagePlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-sm py-2"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1">
            {inputText.trim() ? (
              <button onClick={handleSendMessage} className="p-2 text-blue-500 font-semibold text-sm">
                Enviar
              </button>
            ) : (
              <>
                <button onClick={() => handleBlockedAction("enviar áudio")} className="p-2 text-gray-400">
                  <MicInputIcon />
                </button>
                <button onClick={() => handleBlockedAction("enviar figurinha")} className="p-2 text-gray-400">
                  <StickerInputIcon />
                </button>
                <button onClick={handleSendHeart} className="p-2 text-red-500">
                  <HeartInputIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;