import type { ProfileData, SuggestedProfile } from '../../types';
import { getFeedStockImage } from '../utils/feedStockImages';
import { maskNotificationUsername, maskUsernameList } from '../utils/maskUsername';

export type NotificationSection = 'today' | 'yesterday' | 'week';
export type NotificationButton = 'following' | 'follow' | 'test';

export interface NotificationAvatar {
  src?: string;
  locked?: boolean;
  blurred?: boolean;
}

export interface AppNotification {
  id: string;
  section: NotificationSection;
  avatars: NotificationAvatar[];
  body: string;
  time: string;
  button?: NotificationButton;
  thumbnailSeed?: string;
  thumbnailTall?: boolean;
}

const SECTION_LABELS: Record<NotificationSection, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: 'Últimos 7 dias',
};

export function getNotificationSectionLabel(section: NotificationSection): string {
  return SECTION_LABELS[section];
}

function avatarFromSuggestion(
  suggestions: SuggestedProfile[],
  index: number,
  options?: { blurred?: boolean }
): NotificationAvatar {
  const profile = suggestions[index % Math.max(suggestions.length, 1)];
  return {
    src: profile?.profile_pic_url,
    blurred: options?.blurred,
  };
}

export function buildNotificationsData(
  _profile: ProfileData,
  suggestions: SuggestedProfile[] = []
): AppNotification[] {
  const bruSuggestion =
    suggestions.find((s) => s.username.toLowerCase().includes('bru')) ??
    suggestions[0];

  const bruMasked = bruSuggestion
    ? maskNotificationUsername(
        bruSuggestion.username.startsWith('_')
          ? bruSuggestion.username
          : `_${bruSuggestion.username}`
      )
    : '_bru*******';

  return [
    {
      id: 'n1',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 0)],
      body: `${maskNotificationUsername('Kauana')} curtiu seu comentário: Delíciaaaa 😍😍😍`,
      time: '48 min',
      thumbnailSeed: 'notif-today-1',
    },
    {
      id: 'n2',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 1)],
      body: `${maskNotificationUsername('modesto')} começou a seguir você.`,
      time: '9 h',
      button: 'following',
    },
    {
      id: 'n3',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 2)],
      body: `${maskNotificationUsername('raissa')} curtiu seu comentário: 😮`,
      time: '10 h',
      thumbnailSeed: 'notif-today-2',
    },
    {
      id: 'n4',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 3)],
      body: `${maskNotificationUsername('david')} curtiu seu comentário: Quero`,
      time: '10 h',
      thumbnailSeed: 'notif-today-3',
    },
    {
      id: 'n5',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 4)],
      body: `${maskNotificationUsername('marcos')} curtiu seu comentário: Nossa`,
      time: '11 h',
      thumbnailSeed: 'notif-today-4',
    },
    {
      id: 'n6',
      section: 'today',
      avatars: [avatarFromSuggestion(suggestions, 5)],
      body: `${maskNotificationUsername('lilian')} curtiu seu comentário: Gataaaa`,
      time: '11 h',
      thumbnailSeed: 'notif-today-5',
    },
    {
      id: 'n7',
      section: 'yesterday',
      avatars: [
        avatarFromSuggestion(suggestions, 6),
        avatarFromSuggestion(suggestions, 7),
      ],
      body: `${maskNotificationUsername('ravi')}, ${maskNotificationUsername('rrafael')} e outras 1 pessoas estão no app Meta AI. Junte-se a elas agora.`,
      time: '16 h',
      button: 'test',
    },
    {
      id: 'n8',
      section: 'yesterday',
      avatars: [{ locked: true }],
      body: `Nova sugestão para seguir: ${bruMasked}.`,
      time: '1 d',
      button: 'follow',
    },
    {
      id: 'n9',
      section: 'yesterday',
      avatars: [
        avatarFromSuggestion(suggestions, 8, { blurred: true }),
        avatarFromSuggestion(suggestions, 9, { blurred: true }),
      ],
      body: `${maskUsernameList(['Alice', 'luis', 'ana', 'bia', 'carla'])} curtiram seu comentário: Pegava muito`,
      time: '1 d',
      thumbnailSeed: 'notif-yesterday-1',
    },
    {
      id: 'n10',
      section: 'week',
      avatars: [avatarFromSuggestion(suggestions, 10)],
      body: `${maskNotificationUsername('jisoo')} começou a seguir você.`,
      time: '2 d',
      button: 'following',
    },
    {
      id: 'n11',
      section: 'week',
      avatars: [avatarFromSuggestion(suggestions, 11, { blurred: true })],
      body: `${maskNotificationUsername('girls')} adicionou 2 novos stories.`,
      time: '3 d',
      thumbnailSeed: 'notif-week-1',
      thumbnailTall: true,
    },
    {
      id: 'n12',
      section: 'week',
      avatars: [avatarFromSuggestion(suggestions, 12)],
      body: `${maskNotificationUsername('prado')} mencionou você em um comentário.`,
      time: '7 d',
      thumbnailSeed: 'notif-week-2',
    },
    {
      id: 'n13',
      section: 'week',
      avatars: [avatarFromSuggestion(suggestions, 13)],
      body: `${maskNotificationUsername('jorge')} curtiu seu comentário: 😊`,
      time: '3 d',
      thumbnailSeed: 'notif-week-3',
    },
    {
      id: 'n14',
      section: 'week',
      avatars: [avatarFromSuggestion(suggestions, 14)],
      body: `${maskNotificationUsername('carla')} curtiu seu comentário: 😍`,
      time: '4 d',
      thumbnailSeed: 'notif-week-4',
    },
  ];
}

export function getNotificationThumbnail(seed: string): string {
  return getFeedStockImage(seed);
}
