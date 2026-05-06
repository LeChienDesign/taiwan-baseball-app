import localLivePayload from '../server/data/abroadPlayers.live.json';

export type AbroadLivePlayer = {
  id: string;
  name?: string;
  nameEn?: string;
  league?: string;
  team?: string;
  teamLogo?: string;
  position?: string;
  status?: string;
  statusLabel?: string;
  statusType?: string;
  recentGames?: any[];
  news?: any[];
  recentNote?: string;
  teamMeta?: {
    id?: number;
    abbreviation?: string;
    logoKey?: string;
  };
  [key: string]: any;
};

export type AbroadLiveSummary = {
  todayGames: number;
  finals: number;
  probableStarters: number;
  injured: number;
  [key: string]: any;
};

export type AbroadLivePayload = {
  updatedAt: string;
  summary: AbroadLiveSummary;
  players: AbroadLivePlayer[];
};

function calcSummary(players: AbroadLivePlayer[]): AbroadLiveSummary {
  return {
    todayGames: players.filter((p) => p.status === '今日出賽' || p.todayGame).length,
    finals: players.filter((p) => p.status === '已完賽' || p.isFinal).length,
    probableStarters: players.filter((p) => p.status === '預告先發' || p.probableStarter).length,
    injured: players.filter((p) => p.status === '傷兵' || p.injured).length,
  };
}

export function buildFallbackAbroadPayload(): AbroadLivePayload {
  const payload = localLivePayload as Partial<AbroadLivePayload>;
  const players = Array.isArray(payload.players) ? payload.players : [];

  return {
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : '',
    summary: payload.summary ?? calcSummary(players),
    players,
  };
}

export async function fetchAbroadLiveData(_signal?: AbortSignal): Promise<AbroadLivePayload> {
  return buildFallbackAbroadPayload();
}
