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

export type AbroadManualPayload = {
  players?: Record<string, Partial<AbroadPlayerLike>>;
  notes?: Array<any>;
};

export function applyManualAbroadOverrides(
  players: AbroadPlayerLike[],
  manualPayload: AbroadManualPayload
) {
  const manualPlayers = manualPayload.players ?? {};

  return players.map((player) => {
    const override = manualPlayers[player.id];

    if (!override) return player;

    return {
      ...player,
      ...override,
      teamMeta: {
        ...(player.teamMeta ?? {}),
        ...(override.teamMeta ?? {}),
      },
      nextGame: override.nextGame ?? player.nextGame,
      seasonStats: override.seasonStats ?? player.seasonStats,
      recentGames: override.recentGames ?? player.recentGames,
      news: override.news ?? player.news,
    };
  });
}

export type AbroadLiveSummary = {
  totalPlayers: number;
  mlb: number;
  milb: number;
  npb: number;
  kbo: number;
  other: number;
  todayGames: number;
  finals: number;
  probableStarters: number;
  injured: number;
  withNews: number;
  withRecentGames: number;
};

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

export function buildSummary(players: AbroadPlayerLike[]): AbroadLiveSummary {
  const leagues = players.map((player) => normalizeText(player.league));

  return {
    totalPlayers: players.length,
    mlb: leagues.filter((league) => league === 'mlb').length,
    milb: leagues.filter((league) => league === 'milb').length,
    npb: leagues.filter((league) => league === 'npb').length,
    kbo: leagues.filter((league) => league === 'kbo').length,
    other: leagues.filter(
      (league) => !['mlb', 'milb', 'npb', 'kbo'].includes(league)
    ).length,
    todayGames: players.filter((player) => player.status === '今日出賽').length,
    finals: players.filter((player) => player.status === '已完賽').length,
    probableStarters: players.filter((player) => player.status === '預告先發').length,
    injured: players.filter((player) => player.status === '傷兵').length,
    withNews: players.filter(
      (player) => Array.isArray(player.news) && player.news.length > 0
    ).length,
    withRecentGames: players.filter(
      (player) => Array.isArray(player.recentGames) && player.recentGames.length > 0
    ).length,
  };
}
