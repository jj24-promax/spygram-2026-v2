import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import LockedFeatureModal from '../components/LockedFeatureModal';
import DirectPreviewBanner from '../components/DirectPreviewBanner';
import {
  buildNotificationsData,
  getNotificationSectionLabel,
  getNotificationThumbnail,
  type AppNotification,
  type NotificationSection,
} from '../data/notificationsData';
import type { ProfileData, SuggestedProfile } from '../../types';
import { enrichSuggestedProfilesWithPeoplePhotos } from '../utils/feedStockImages';
import './NotificationsPage.css';

const SECTION_ORDER: NotificationSection[] = ['today', 'yesterday', 'week'];

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFeatureName, setModalFeatureName] = useState('');

  useEffect(() => {
    const storedDataRaw = sessionStorage.getItem('invasionData');
    if (!storedDataRaw) {
      navigate('/');
      return;
    }

    const data = JSON.parse(storedDataRaw);
    const profile: ProfileData = data.profileData;
    const suggestions = enrichSuggestedProfilesWithPeoplePhotos(
      (data.suggestedProfiles || []) as SuggestedProfile[]
    );

    setProfileData(profile);
    setNotifications(buildNotificationsData(profile, suggestions));
  }, [navigate]);

  const handleLockedClick = (feature: string = 'ver esta notificação') => {
    setModalFeatureName(feature);
    setIsModalOpen(true);
  };

  const renderAvatars = (item: AppNotification) => {
    if (item.avatars.length === 1 && item.avatars[0].locked) {
      return (
        <div className="notification-avatar-locked">
          <Lock size={18} strokeWidth={2} />
        </div>
      );
    }

    if (item.avatars.length > 1) {
      return (
        <div className="notification-avatar-stack">
          {item.avatars.slice(0, 2).map((avatar, index) =>
            avatar.src ? (
              <img
                key={index}
                src={avatar.src}
                alt=""
                className={`notification-avatar-stack-item ${avatar.blurred ? 'blurred' : ''}`}
              />
            ) : (
              <div key={index} className="notification-avatar-stack-item notification-avatar-locked">
                <Lock size={12} />
              </div>
            )
          )}
        </div>
      );
    }

    const avatar = item.avatars[0];
    if (!avatar?.src) {
      return (
        <div className="notification-avatar-locked">
          <Lock size={18} strokeWidth={2} />
        </div>
      );
    }

    return (
      <img
        src={avatar.src}
        alt=""
        className={`notification-avatar-single ${avatar.blurred ? 'blurred' : ''}`}
      />
    );
  };

  const renderButton = (button: AppNotification['button']) => {
    if (button === 'following') {
      return <button type="button" className="notification-btn notification-btn-following">Seguindo</button>;
    }
    if (button === 'follow') {
      return <button type="button" className="notification-btn notification-btn-follow">Seguir</button>;
    }
    if (button === 'test') {
      return <button type="button" className="notification-btn notification-btn-test">Testar</button>;
    }
    return null;
  };

  const renderRow = (item: AppNotification) => (
    <div
      key={item.id}
      className="notification-row"
      onClick={() => handleLockedClick('ver todas as notificações')}
    >
      <div className="notification-avatars">{renderAvatars(item)}</div>
      <p className="notification-body">
        {item.body}
        <span className="notification-time">{item.time}</span>
      </p>
      {(item.button || item.thumbnailSeed) && (
        <div className="notification-action">
          {item.button ? (
            renderButton(item.button)
          ) : item.thumbnailSeed ? (
            <div className={`notification-thumbnail ${item.thumbnailTall ? 'tall' : ''}`}>
              <img src={getNotificationThumbnail(item.thumbnailSeed)} alt="" draggable={false} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <div className="notifications-page-container">
      <LockedFeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        featureName={modalFeatureName}
      />
      <DirectPreviewBanner />

      <header className="notifications-header">
        <button type="button" onClick={() => navigate('/instagram')} aria-label="Voltar">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <span className="notifications-header-title">{profileData?.username || 'notificações'}</span>
      </header>

      <main className="notifications-main">
        {SECTION_ORDER.map((section) => {
          const sectionItems = notifications.filter((item) => item.section === section);
          if (!sectionItems.length) return null;

          return (
            <section key={section}>
              <h2 className="notifications-section-title">{getNotificationSectionLabel(section)}</h2>
              {sectionItems.map(renderRow)}
            </section>
          );
        })}

        <div className="notifications-vip-banner">
          <span className="notifications-vip-icon">i</span>
          <p className="notifications-vip-text">
            Somente algumas notificações estão disponíveis para visualização, adquira o plano VIP do{' '}
            <strong>Spygram</strong> para liberar todas as atividades.
          </p>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
