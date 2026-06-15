import React from 'react';

interface DirectStoryItemProps {
  avatarUrl: string;
  name: string;
  note: string;
  isOwnStory?: boolean;
}

const DirectStoryItem: React.FC<DirectStoryItemProps> = ({ avatarUrl, name, note, isOwnStory = false }) => {
  const safeAvatarUrl = avatarUrl || '/perfil.jpg';

  return (
    <div className={`story-item ${isOwnStory ? 'story-own' : ''}`}>
      <div className="story-bubble">{note}</div>
      <div className="story-avatar-wrap">
        <img src={safeAvatarUrl} alt={name} className="story-avatar" />
      </div>
      <span className="story-name">{isOwnStory ? 'Sua nota' : name}</span>
    </div>
  );
};

export default DirectStoryItem;