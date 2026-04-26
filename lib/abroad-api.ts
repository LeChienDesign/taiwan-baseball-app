import { abroadPlayers, abroadSummary, type AbroadPlayer } from '../data/abroadPlayers';

export type AbroadLivePlayer = AbroadPlayer & {
  teamMeta?: {
    id?: number;
    abbreviation?: string;
    logoKey?: string;
  };
};

export type AbroadLiveSummary = {
  todayGames: number;
  finals: number;
  probableStarters: number;
  injured: number;
};

export type AbroadLivePayload = {
  updatedAt: string;
  summary: AbroadLiveSummary;
  players: AbroadLivePlayer[];
};

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function resolveApiBase() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return process.env.EXPO_PUBLIC_BASEBALL_API_URL ?? '';
}

function calcSummary(players: AbroadLivePlayer[]): AbroadLiveSummary {
  return {
    todayGames: players.filter((p) => p.status === '今日出賽').length,
    finals: players.filter((p) => p.status === '已完賽').length,
    probableStarters: players.filter((p) => p.status === '預告先發').length,
    injured: players.filter((p) => p.status === '傷兵').length,
  };
}

export function buildFallbackAbroadPayload(): AbroadLivePayload {
  return {
    updatedAt: '',
    summary: abroadSummary ?? calcSummary(abroadPlayers as AbroadLivePlayer[]),
    players: abroadPlayers as AbroadLivePlayer[],
  };
}

export async function fetchAbroadLiveData(signal?: AbortSignal): Promise<AbroadLivePayload> {
  const API_BASE = resolveApiBase();

  if (!API_BASE) {
    throw new Error('Missing API base');
  }

  const url = `${stripTrailingSlash(API_BASE)}/abroad/live`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Failed to fetch abroad live data: ${res.status} ${res.statusText} ${text.slice(0, 120)}`
    );
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Abroad API did not return JSON: ${text.slice(0, 120)}`);
  }

  const data = (await res.json()) as Partial<AbroadLivePayload>;

  const players = Array.isArray(data?.players)
    ? (data.players as AbroadLivePlayer[])
    : buildFallbackAbroadPayload().players;

  const summary =
    data?.summary &&
    typeof data.summary.todayGames === 'number' &&
    typeof data.summary.finals === 'number' &&
    typeof data.summary.probableStarters === 'number' &&
    typeof data.summary.injured === 'number'
      ? data.summary
      : calcSummary(players);

  return {
    updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : '',
    summary,
    players,
  };
}