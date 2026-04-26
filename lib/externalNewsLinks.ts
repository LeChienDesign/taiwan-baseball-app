export const GOOGLE_NEWS_LINKS: Record<string, string> = {
  'kai-wei-teng':
    'https://www.google.com/search?newwindow=1&tbm=nws&q=%E9%84%A7%E6%84%B7%E5%A8%81',
  'tsung-che-cheng':
    'https://www.google.com/search?newwindow=1&tbm=nws&q=%E9%84%AD%E5%AE%97%E5%93%B2',
};

export const OFFICIAL_PLAYER_LINKS: Record<string, string> = {
  'kai-wei-teng': 'https://www.mlb.com/astros/player/kai-wei-teng-678906',
  'tsung-che-cheng': 'https://www.mlb.com/player/tsung-che-cheng-805779',
};

export function getExternalNewsLink(playerId?: string | null) {
  if (!playerId) return undefined;
  return GOOGLE_NEWS_LINKS[playerId] ?? undefined;
}

export function getOfficialPlayerProfileLink(playerId?: string | null) {
  if (!playerId) return undefined;
  return OFFICIAL_PLAYER_LINKS[playerId] ?? undefined;
}