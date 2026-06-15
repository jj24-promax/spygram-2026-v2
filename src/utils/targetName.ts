import type { ProfileData } from '../../types';

export function getTargetDisplayName(profile: ProfileData | null | undefined): string {
  if (!profile) return 'Amor';

  if (profile.fullName?.trim()) {
    const first = profile.fullName.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }

  const cleaned = profile.username.replace(/[^a-zA-Z0-9._]/g, '');
  const alpha = cleaned.match(/^([a-zA-Z]+)/)?.[1] ?? cleaned;
  if (!alpha) return profile.username;

  return alpha.charAt(0).toUpperCase() + alpha.slice(1).toLowerCase();
}

export function personalizeText(text: string, targetName: string): string {
  return text.replace(/\{\{target\}\}/g, targetName);
}

export function maskContactName(name: string): string {
  if (name.length <= 4) return `${name}*****`;
  const visible = name.substring(0, 3);
  return `${visible}${'*'.repeat(Math.max(5, name.length - 3))}`;
}
