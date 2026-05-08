export type AbroadPlayerLike = {
  id: string;
  name?: string;
  league?: string;
  level?: string;
  status?: string;
  team?: string;
  teamMeta?: {
    leagueGroup?: string;
    code?: string;
    abbreviation?: string;
    logoKey?: string;
    displayName?: string;
  };
  news?: Array<any>;
  recentGames?: Array<any>;
  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };
  [key: string]: any;
};

export function normalizePlayers(raw: unknown): AbroadPlayerLike[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => item as AbroadPlayerLike);
  }

  if (raw && typeof raw === 'object') {
    const maybePlayers = (raw as any).players;
    if (Array.isArray(maybePlayers)) {
      return maybePlayers.map((item) => item as AbroadPlayerLike);
    }
  }

  throw new Error('Seed JSON must be an array of players or an object with players[]');
}

export function dedupePlayers(players: AbroadPlayerLike[]) {
  const map = new Map<string, AbroadPlayerLike>();

  for (const player of players) {
    if (!player?.id) continue;

    const prev = map.get(player.id);
    if (!prev) {
      map.set(player.id, player);
      continue;
    }

    map.set(player.id, {
      ...prev,
      ...player,
      teamMeta: {
        ...(prev.teamMeta ?? {}),
        ...(player.teamMeta ?? {}),
      },
      nextGame: player.nextGame ?? prev.nextGame,
      seasonStats: player.seasonStats ?? prev.seasonStats,
      recentGames: player.recentGames ?? prev.recentGames,
      news: player.news ?? prev.news,
    });
  }

  return Array.from(map.values());
}
