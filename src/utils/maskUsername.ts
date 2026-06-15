export function maskNotificationUsername(username: string): string {
  const trimmed = username.replace(/^@/, '');
  const prefix = trimmed.startsWith('_') ? '_' : '';
  const base = prefix ? trimmed.slice(1) : trimmed;

  if (base.length <= 3) {
    return `${prefix}${base}${'*'.repeat(5)}`;
  }

  return `${prefix}${base.substring(0, 3)}${'*'.repeat(5)}`;
}

export function maskUsernameList(usernames: string[]): string {
  if (usernames.length === 1) return maskNotificationUsername(usernames[0]);
  if (usernames.length === 2) {
    return `${maskNotificationUsername(usernames[0])}, ${maskNotificationUsername(usernames[1])}`;
  }
  const first = maskNotificationUsername(usernames[0]);
  const second = maskNotificationUsername(usernames[1]);
  const others = usernames.length - 2;
  return `${first}, ${second} e outras ${others} pessoas`;
}
