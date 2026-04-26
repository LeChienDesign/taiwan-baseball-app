type PlayerLike =
  | {
      id?: string;
      officialPhotoUrl?: string;
    }
  | string
  | null
  | undefined;

const LEGACY_FALLBACKS: Record<string, string> = {
  'kai-wei-teng':
    'https://img.mlbstatic.com/mlb-photos/image/upload/v1745596800/people/678906/headshot/67/current.png',
  'tsung-che-cheng':
    'https://img.mlbstatic.com/mlb-photos/image/upload/v1745596800/people/805779/headshot/67/current.png',
};

export function getOfficialPlayerPhoto(player?: PlayerLike) {
  if (!player) return undefined;

  if (typeof player === 'string') {
    return LEGACY_FALLBACKS[player];
  }

  if (player.officialPhotoUrl) {
    return player.officialPhotoUrl;
  }

  if (player.id) {
    return LEGACY_FALLBACKS[player.id];
  }

  return undefined;
}