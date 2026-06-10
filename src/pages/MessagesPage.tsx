import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, SquarePen } from 'lucide-react';
import SmileyStarIcon from '../components/icons/SmileyStarIcon';
import MetaAIIcon from '../components/icons/MetaAIIcon';
import DirectStoryItem from '../components/DirectStoryItem';
import MessageItem from '../components/MessageItem';
import LockedFeatureModal from '../components/LockedFeatureModal';
import FreeTimeFloatingButton from '../components/FreeTimeFloatingButton';
import './MessagesPage.css';
import { ProfileData, SuggestedProfile } from '../../types';
import { MOCK_MALE_NAMES, MOCK_FEMALE_NAMES, MOCK_SUGGESTION_NAMES } from '../../constants';

export interface Story {
  id: string;
  name: string;
  note: string;
  avatar: string;
}

export interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: boolean;
  locked: boolean;
  avatar: string;
}

const maskUsername = (username: string) => {
  if (username.length <= 4) return username;
  return `${username.substring(0, 3).toLowerCase()}****`;
};

const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (storedDataRaw) {
      const data = JSON.parse(storedDataRaw);
      setProfileData(data.profileData);

      const targetGender = data.profileData?.gender;

      // Se já houver mensagens geradas para este lead, usamos elas
      if (data.generatedStories && data.generatedMessages) {
        setStories(data.generatedStories);
        setMessages(data.generatedMessages);
        return;
      }

      // Caso contrário, geramos uma vez e salvamos
      let suggestedProfiles: SuggestedProfile[] = data.suggestedProfiles || [];
      
      if (suggestedProfiles.length === 0) {
        // Determina os nomes baseados no sexo oposto ao do alvo
        let namesToUse = MOCK_SUGGESTION_NAMES;
        if (targetGender === 'male') {
          namesToUse = MOCK_FEMALE_NAMES;
        } else if (targetGender === 'female') {
          namesToUse = MOCK_MALE_NAMES;
        }

        const shuffledNames = [...namesToUse].sort(() => 0.5 - Math.random());
        suggestedProfiles = shuffledNames.slice(0, 12).map((name) => ({
          username: name.toLowerCase().replace(' ', '') + Math.floor(Math.random() * 100),
          fullName: name,
          profile_pic_url: '/perfil.jpg',
        }));
      }
      
      const suggestedStories: Story[] = suggestedProfiles.slice(0, 4).map((profile: SuggestedProfile, index: number) => ({
        id: profile.username,
        name: maskUsername(profile.username),
        note: ['Preguiça Hoje 🥱🥱', 'Coração Partido (Ao Vivo)', 'O vontde fudê a 3 😈', '📍💦 São Paulo'][index % 4],
        avatar: profile.profile_pic_url,
      }));

      const messagePreviews = [
        '4 novas mensagens',
        'Vem aqui logo, tô sozinha... 😈',
        'Não conta pra ninguém o que a gente fez',
        '4 novas mensagens',
        'Precisamos conversar sobre ontem 😬',
        'Enviou um anexo',
        '4 novas mensagens',
        'Foto temporária',
        'Curtiu uma mensagem',
        'Onde você está??',
        '4 novas mensagens',
        'Isso é verdade?? 😱',
        'Mencionei você no meu close friends'
      ].sort(() => 0.5 - Math.random());

      const suggestedMessages: Message[] = suggestedProfiles.slice(0, 10).map((profile: SuggestedProfile, index: number) => {
        const preview = messagePreviews[index % messagePreviews.length];
        const time = ['22 h', '3 d', '4 d', '1 sem'][index % 4];
        const unread = index % 3 === 0 || preview === '4 novas mensagens';

        return {
          id: profile.username,
          name: maskUsername(profile.username),
          message: preview,
          time: time,
          unread: unread,
          locked: true, 
          avatar: profile.profile_pic_url,
        };
      });
      
      // Salva no sessionStorage dentro do objeto de invasão atual
      const updatedData = {
        ...data,
        generatedStories: suggestedStories,
        generatedMessages: suggestedMessages
      };
      sessionStorage.setItem('invasionData', JSON.stringify(updatedData));

      setStories(suggestedStories);
      setMessages(suggestedMessages);

    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLockedClick = (feature: string = 'acessar este conteúdo') => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  };

  return (
    <div className="messages-page-container">
      <LockedFeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        featureName={modalFeatureName} 
      />
      <FreeTimeFloatingButton />

      <header className="messages-header">
        <div className="header-left-content">
          <button onClick={() => navigate('/instagram')} className="p-1">
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

      <main>
        <div className="search-bar-container">
          <div className="search-input-wrapper">
            <MetaAIIcon size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Interaja com a Meta AI ou pesquise" 
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
          {stories.map(story => (
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
              onClick={() => handleLockedClick(`ler a conversa secreta com ${msg.name}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;