import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, SquarePen } from 'lucide-react';
import SmileyStarIcon from '../components/icons/SmileyStarIcon';
import MetaAIIcon from '../components/icons/MetaAIIcon';
import DirectStoryItem from '../components/DirectStoryItem';
import MessageItem from '../components/MessageItem';
import LockedFeatureModal from '../components/LockedFeatureModal';
import DirectPreviewBanner from '../components/DirectPreviewBanner';
import './MessagesPage.css';
import { ProfileData, SuggestedProfile } from '../../types';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import { resolveTargetGender } from '../utils/genderClassifier';
import {
  buildDirectData,
  directPreviewToMessage,
  LOCKED_DIRECT_CHAT_IDS,
  type DirectMessagePreview,
  type DirectStory,
} from '../data/directConversations';

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stories, setStories] = useState<DirectStory[]>([]);
  const [messages, setMessages] = useState<DirectMessagePreview[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (!storedDataRaw) {
      navigate('/');
      return;
    }

    const data = JSON.parse(storedDataRaw);
    setProfileData(data.profileData);

    const targetGender = resolveTargetGender(data.profileData);
    const suggestedProfiles = enrichSuggestedProfilesWithPeoplePhotos(
      (data.suggestedProfiles || []) as SuggestedProfile[],
      targetGender
    );
    const directData = buildDirectData(data.profileData, suggestedProfiles);

    setStories(directData.stories);
    setMessages(directData.messages);

    sessionStorage.setItem(
      'invasionData',
      JSON.stringify({
        ...data,
        suggestedProfiles,
        generatedStories: directData.stories,
        generatedMessages: directData.messages,
        targetDisplayName: directData.targetName,
      })
    );
  }, [navigate]);

  useEffect(() => {
    const lockedFeature = (location.state as { lockedFeature?: string } | null)?.lockedFeature;
    if (!lockedFeature) return;
    setModalFeatureName(lockedFeature);
    setIsModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleLockedClick = (feature: string = 'acessar este conteúdo') => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  };

  const openChat = (preview: DirectMessagePreview) => {
    navigate(`/chat/${preview.chatId}`, {
      state: { user: directPreviewToMessage(preview) },
    });
  };

  const handleMessageClick = (preview: DirectMessagePreview) => {
    if (preview.locked || LOCKED_DIRECT_CHAT_IDS.has(preview.chatId)) {
      handleLockedClick('abrir esta conversa');
      return;
    }
    openChat(preview);
  };

  return (
    <div className="messages-page-container">
      <LockedFeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureName={modalFeatureName}
      />
      <DirectPreviewBanner />

      <header className="messages-header">
        <div className="header-left-content">
          <button onClick={() => navigate('/instagram')} className="p-1" type="button">
            <ChevronLeft size={28} strokeWidth={2.5} />
          </button>
          <div className="header-title">
            <span>{profileData?.username || 'mensagens'}</span>
          </div>
        </div>
        <div className="header-actions">
          <SmileyStarIcon size={28} strokeWidth={1.5} onClick={() => handleLockedClick('ver os melhores amigos')} />
          <SquarePen size={24} strokeWidth={1.5} onClick={() => handleLockedClick('escrever uma nova mensagem')} />
        </div>
      </header>

      <main className="messages-main">
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <MetaAIIcon size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Pergunte à Meta AI ou pesquise"
              className="search-input"
              readOnly
              onClick={() => handleLockedClick('pesquisar nas mensagens')}
            />
          </div>
        </div>

        <div className="stories-container">
          <DirectStoryItem
            avatarUrl={profileData?.profilePicUrl || ''}
            name="Sua nota"
            note="Conte as novidades"
            isOwnStory
          />
          {stories.map((story) => (
            <DirectStoryItem
              key={story.id}
              avatarUrl={story.avatar}
              name={story.name}
              note={story.note}
            />
          ))}
        </div>

        <div className="messages-section-header">
          <h2>Mensagens</h2>
          <span className="requests-link" onClick={() => handleLockedClick('ver as solicitações de mensagem')}>
            Pedidos (4)
          </span>
        </div>

        <div className="messages-list">
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              avatarUrl={msg.avatar}
              name={msg.name}
              message={msg.message}
              time={msg.time}
              unread={msg.unread}
              locked={msg.locked}
              stylizedName={msg.stylizedName}
              onClick={() => handleMessageClick(msg)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
