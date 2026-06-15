import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Phone,
  Video,
  Mic,
  Camera,
  Sticker,
  Heart,
  VolumeX,
  EyeOff,
  Play,
  Image as ImageIcon,
  Send,
  Scissors,
  Clapperboard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatPage.css';
import LockedFeatureModal from '../components/LockedFeatureModal';
import DirectPreviewBanner from '../components/DirectPreviewBanner';
import { ProfileData, SuggestedProfile } from '../../types';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import { getChatContact, type ChatMessage } from '../data/directConversations';

export interface ChatUser {
  id: string;
  chatId: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  locked: boolean;
  avatar: string;
  onlineStatus: string;
}

const shouldShowAvatar = (messages: ChatMessage[], index: number): boolean => {
  const msg = messages[index];
  if (msg.type !== 'received') return false;

  const next = messages[index + 1];
  if (!next) return true;
  if (next.type === 'date' || next.type === 'divider' || next.type === 'video_call') return true;
  return next.type !== 'received';
};

const isConsecutiveSameSender = (messages: ChatMessage[], index: number): boolean => {
  const msg = messages[index];
  if (msg.type !== 'sent' && msg.type !== 'received') return false;
  const prev = messages[index - 1];
  if (!prev || prev.type === 'date' || prev.type === 'divider' || prev.type === 'video_call') {
    return false;
  }
  return prev.type === msg.type;
};

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: chatIdParam } = useParams<{ id: string }>();
  const chatUser = location.state?.user as ChatUser | undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contactName, setContactName] = useState('');
  const [contactAvatar, setContactAvatar] = useState('/perfil.jpg');
  const [onlineStatus, setOnlineStatus] = useState('Online');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [premiumBlurActive, setPremiumBlurActive] = useState(true);
  const messagesRef = useRef<HTMLElement>(null);
  const premiumZoneRef = useRef<HTMLDivElement>(null);
  const vipTriggeredRef = useRef(false);

  const handleLockedFeature = useCallback((feature: string) => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  }, []);

  const triggerVipFromScroll = useCallback(() => {
    if (vipTriggeredRef.current) return;
    vipTriggeredRef.current = true;
    handleLockedFeature('ler o histórico completo desta conversa');
    setTimeout(() => {
      vipTriggeredRef.current = false;
    }, 1500);
  }, [handleLockedFeature]);

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (!storedDataRaw) {
      navigate('/');
      return;
    }

    const data = JSON.parse(storedDataRaw);
    const profileData: ProfileData = data.profileData;
    const suggestedProfiles = enrichSuggestedProfilesWithPeoplePhotos(
      (data.suggestedProfiles || []) as SuggestedProfile[]
    );
    const chatId = chatUser?.chatId || chatIdParam;

    if (!chatId) {
      navigate('/messages');
      return;
    }

    const contact = getChatContact(chatId, profileData, suggestedProfiles);
    if (!contact) {
      navigate('/messages');
      return;
    }

    setContactName(chatUser?.name || contact.name);
    setContactAvatar(chatUser?.avatar || contact.avatar);
    setOnlineStatus(chatUser?.onlineStatus || contact.onlineStatus);
    setMessages(contact.messages);

    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [chatUser, chatIdParam, navigate]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    const handleScroll = () => {
      const premiumEl = premiumZoneRef.current;
      if (!premiumEl) {
        setPremiumBlurActive(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const premiumRect = premiumEl.getBoundingClientRect();
      const premiumVisible = premiumRect.bottom > containerRect.top + 20;

      setPremiumBlurActive(premiumVisible);

      if (container.scrollTop <= 12) {
        triggerVipFromScroll();
      }
    };

    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages, triggerVipFromScroll]);

  const handleAudioClick = () => {
    if (showVolumePopup) return;
    setShowVolumePopup(true);
    setTimeout(() => setShowVolumePopup(false), 2500);
  };

  const renderImageContent = (msg: ChatMessage) => {
    if (msg.imageLayout === 'stack') {
      const count = msg.imageStackCount || 3;
      const stackImages = [
        msg.imageUrl || '/recovered/img_6.jpeg',
        '/recovered/img_7.jpg',
        '/recovered/img_8.jpg',
      ];

      return (
        <div
          className="message-image-stack"
          onClick={() => handleLockedFeature('ver fotos e vídeos censurados')}
        >
          {stackImages.slice(0, count).map((url, i) => (
            <div
              key={i}
              className="message-image-stack-item"
              style={{ zIndex: count - i, transform: `rotate(${i === 0 ? -4 : i === 1 ? 2 : 5}deg)` }}
            >
              <img src={url} alt="" className="message-image" />
              <div className="sensitive-overlay sensitive-overlay-minimal">
                <EyeOff size={22} strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        className={`message-image-container message-image-${msg.imageLayout || 'vertical'} ${msg.isViewOnce ? 'view-once' : ''}`}
        onClick={() => handleLockedFeature('ver fotos e vídeos censurados')}
      >
        <img src={msg.imageUrl} alt="Conteúdo" className="message-image" />
        <div className="sensitive-overlay sensitive-overlay-minimal">
          <EyeOff size={22} strokeWidth={2} />
        </div>
      </div>
    );
  };

  const renderMessage = (msg: ChatMessage, index: number, list: ChatMessage[]) => {
    const firstPremiumId = list.find((m) => m.zone === 'premium')?.id;
    const isPremiumLocked = msg.zone === 'premium';
    const premiumRef = msg.id === firstPremiumId ? premiumZoneRef : undefined;

    if (msg.type === 'date') {
      return (
        <div
          key={msg.id}
          ref={premiumRef}
          className={isPremiumLocked ? 'message-premium-locked message-premium-meta' : 'message-premium-meta'}
          onClick={() => isPremiumLocked && handleLockedFeature('ler o histórico completo desta conversa')}
        >
          <div className="message-date">{msg.content}</div>
        </div>
      );
    }

    if (msg.type === 'divider') {
      return (
        <div
          key={msg.id}
          className={isPremiumLocked ? 'message-premium-locked message-premium-meta' : 'message-premium-meta'}
          onClick={() => isPremiumLocked && handleLockedFeature('ler o histórico completo desta conversa')}
        >
          <div className="message-unread-divider">
            <div className="message-unread-line"></div>
            <span className="message-unread-text">{msg.content}</span>
            <div className="message-unread-line"></div>
          </div>
        </div>
      );
    }

    if (msg.type === 'video_call') {
      return (
        <div
          key={msg.id}
          ref={premiumRef}
          className={`video-call-message ${isPremiumLocked ? 'message-premium-locked' : ''}`}
          onClick={() => isPremiumLocked && handleLockedFeature('ler o histórico completo desta conversa')}
        >
          <div className={`video-call-card ${msg.callMissed ? 'missed' : ''}`}>
            <Video size={22} />
            <div className="video-call-info">
              <span>{msg.content}</span>
              {msg.callDuration && <small>{msg.callDuration}</small>}
            </div>
            {msg.callMissed && (
              <button type="button" className="video-call-back">
                Ligar de volta
              </button>
            )}
          </div>
        </div>
      );
    }

    const isSent = msg.type === 'sent';
    const consecutive = isConsecutiveSameSender(list, index);
    const showAvatar = shouldShowAvatar(list, index);
    const isEmojiOnly =
      !msg.isAudio &&
      !msg.isImage &&
      !msg.isHeart &&
      !msg.isReel &&
      msg.content.match(
        /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udf00-\uffff]|\ud83d[\udc00-\udfff]|\ud83e[\udc00-\udfff])[\s\ufe0f]*$/
      ) &&
      msg.content.length < 16;

    return (
      <div
        key={msg.id}
        ref={msg.id === firstPremiumId ? premiumZoneRef : undefined}
        className={`message ${isSent ? 'sent' : 'received'} ${isPremiumLocked ? 'message-premium-locked' : ''} ${consecutive ? 'message-consecutive' : ''} ${msg.isImage ? 'message-has-image' : ''} ${msg.isReel ? 'message-has-reel' : ''}`}
        onClick={() => isPremiumLocked && handleLockedFeature('ler o histórico completo desta conversa')}
      >
        {!isSent && (
          <div className="message-avatar-slot">
            {showAvatar ? (
              <img src={contactAvatar} alt={contactName} className="message-avatar" />
            ) : (
              <span className="message-avatar-spacer" />
            )}
          </div>
        )}
        <div className="message-bubble-container">
          {msg.replyTo && (
            <div className={`message-reply ${isSent ? 'sent' : 'received'}`}>
              <div className="reply-label">{msg.replyLabel}</div>
              <div className="reply-content-wrapper">
                <div className="reply-line"></div>
                <div className="reply-content">{msg.replyTo}</div>
              </div>
            </div>
          )}
          <div
            className={`message-bubble ${isEmojiOnly ? 'emoji-bubble' : ''} ${msg.isHeart ? 'heart-bubble' : ''} ${msg.isReel ? 'reel-bubble' : ''} ${msg.isImage ? 'image-bubble' : ''}`}
          >
            {msg.isReel && msg.reelImageUrl && (
              <div
                className={`reel-forward-row ${isSent ? 'reel-forward-row-sent' : 'reel-forward-row-received'}`}
              >
                {isSent && (
                  <div className="reel-side-actions">
                    <button
                      type="button"
                      className="reel-side-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockedFeature('compartilhar reels');
                      }}
                    >
                      <Send size={14} />
                    </button>
                    <button
                      type="button"
                      className="reel-side-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockedFeature('remixar reels');
                      }}
                    >
                      <Scissors size={14} />
                    </button>
                  </div>
                )}
                <div
                  className="reel-forward-card"
                  onClick={() => handleLockedFeature('ver reels encaminhados')}
                >
                  <div className="reel-forward-image-wrap">
                    <img src={msg.reelImageUrl} alt="Reel" className="reel-forward-image" />
                    <div className="reel-forward-top-overlay">
                      <img src="/perfil.jpg" alt="" className="reel-forward-creator-avatar" />
                      <span className="reel-forward-author">{msg.reelAuthor}</span>
                    </div>
                    <div className="reel-forward-play">
                      <Play size={26} fill="white" strokeWidth={0} />
                    </div>
                    <div className="reel-forward-badge" aria-hidden="true">
                      <Clapperboard size={13} fill="white" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                {!isSent && (
                  <div className="reel-side-actions">
                    <button
                      type="button"
                      className="reel-side-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockedFeature('compartilhar reels');
                      }}
                    >
                      <Send size={14} />
                    </button>
                    <button
                      type="button"
                      className="reel-side-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockedFeature('remixar reels');
                      }}
                    >
                      <Scissors size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {msg.isImage && msg.imageUrl && renderImageContent(msg)}

            {msg.isAudio && (
              <div className="audio-message" onClick={handleAudioClick}>
                <Play size={16} fill="white" />
                <div className="audio-waveform">
                  {[...Array(isSent ? 28 : 38)].map((_, i) => (
                    <div
                      key={i}
                      className="audio-waveform-bar"
                      style={{ height: `${Math.floor(Math.random() * 16) + 3}px` }}
                    />
                  ))}
                </div>
                <span className="audio-duration">{msg.audioDuration}</span>
              </div>
            )}

            {!msg.isImage && !msg.isAudio && !msg.isReel && (
              <span className={msg.isBlurred ? 'blurred-text' : ''}>{msg.content}</span>
            )}

            {msg.isAudio && (
              <button type="button" className="audio-transcription-link" onClick={handleAudioClick}>
                Ver transcrição
              </button>
            )}

            {msg.reaction && (
              <div className={`message-reaction ${msg.isImage ? 'message-reaction-on-image' : ''}`}>
                {msg.reaction}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMessageList = (list: ChatMessage[]) =>
    list.map((msg, index) => renderMessage(msg, index, list));

  if (!messages.length) return null;

  return (
    <div className="chat-container">
      <LockedFeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureName={modalFeatureName}
      />
      <DirectPreviewBanner />

      <AnimatePresence>
        {showVolumePopup && (
          <motion.div
            className="volume-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="volume-popup-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <p>Seja membro VIP para liberar o volume</p>
              <VolumeX className="volume-popup-icon" size={48} strokeWidth={1.5} />
              <div className="volume-popup-bar">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="volume-popup-bar-segment" />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="chat-header-sticky">
        <div className="chat-header-left">
          <button onClick={() => navigate('/messages')} className="back-button" type="button">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div
            className="chat-user-info"
            onClick={() => handleLockedFeature('ver o perfil do usuário')}
          >
            <div className="chat-avatar-wrapper-header">
              <img src={contactAvatar} alt={contactName} className="chat-avatar-img" />
            </div>
            <div className="chat-name-wrapper">
              <span className="chat-user-name">{contactName}</span>
              <span className="chat-user-status">{onlineStatus}</span>
            </div>
          </div>
        </div>
        <div className="chat-header-right">
          <button type="button" onClick={() => handleLockedFeature('fazer uma ligação')}>
            <Phone size={24} />
          </button>
          <button type="button" onClick={() => handleLockedFeature('fazer uma chamada de vídeo')}>
            <Video size={24} />
          </button>
        </div>
      </header>

      <main className="chat-messages" ref={messagesRef}>
        {premiumBlurActive && messages.some((m) => m.zone === 'premium') && (
          <div className="chat-premium-fade-top" aria-hidden="true" />
        )}
        <div className="chat-messages-list">{renderMessageList(messages)}</div>
      </main>

      <footer className="message-input-container">
        <button
          type="button"
          className="input-camera-outside"
          onClick={() => handleLockedFeature('enviar fotos')}
        >
          <Camera size={22} strokeWidth={2} />
        </button>
        <div className="message-input-wrapper" onClick={() => handleLockedFeature('enviar mensagens')}>
          <input type="text" placeholder="Mensagem..." className="message-input" readOnly />
          <div className="message-input-actions">
            <button type="button" className="input-icon-button">
              <Mic size={22} />
            </button>
            <button type="button" className="input-icon-button">
              <ImageIcon size={22} />
            </button>
            <button type="button" className="input-icon-button">
              <Sticker size={22} />
            </button>
            <button type="button" className="input-icon-button">
              <Heart size={22} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
