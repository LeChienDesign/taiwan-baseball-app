import { getMlbTeamLogo } from '../constants/mlbTeamLogos';
import { getTodayKeyTaipei } from './date';
import { fetchMlbRealGamesByDate } from './mlb-real';

const MLB_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.mlb.json';

const USE_REMOTE_MLB_EVENTS = process.env.EXPO_PUBLIC_USE_REMOTE_MLB_EVENTS === '1';

const localMlbPayload = require('../server/data/eventsCenter.mlb.json');

let remoteMlbPayloadCache: any = null;
let remoteMlbPayloadFetchedAt = 0;
const REMOTE_MLB_CACHE_MS = 60 * 1000;

export type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logo: any;
};

export type LineScoreRow = {
  team: string;
  innings: (number | string)[];
  r: number | string;
  h: number | string;
  e: number | string;
};

export type ScoreboardGame = {
  id: string;
  gamePk?: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'SUSPENDED';
  venue: string;
  awayTeam: TeamCardInfo;
  homeTeam: TeamCardInfo;
  awayScore: number;
  homeScore: number;
  innings: number[];
  awayLine: LineScoreRow;
  homeLine: LineScoreRow;
  footerLeft: string;
  footerRight: string;
  gameDate?: string;
};

function getTaipeiDateKey(value?: string) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function getTodayKeyNewYork() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getSnapshotGames(payload: any): ScoreboardGame[] {
  const gamesByDate = payload?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    return Object.values(gamesByDate)
      .flatMap((games: any) => (Array.isArray(games) ? games : []))
      .map(normalizeGame);
  }

  if (Array.isArray(payload)) {
    return payload.map(normalizeGame);
  }

  if (Array.isArray(payload?.games)) {
    return payload.games.map(normalizeGame);
  }

  if (Array.isArray(payload?.eventsCenter?.mlb)) {
    return payload.eventsCenter.mlb.map(normalizeGame);
  }

  return [];
}

function getGamesForDateFromPayload(payload: any, date: string): ScoreboardGame[] {
  const gamesForDate = payload?.gamesByDate?.[date];

  if (Array.isArray(gamesForDate)) {
    return gamesForDate.map(normalizeGame);
  }

  return getSnapshotGames(payload).filter((game) => {
    const key = getTaipeiDateKey(game.gameDate);
    return key === date;
  });
}

function getLocalGamesForDate(date: string): ScoreboardGame[] {
  return getGamesForDateFromPayload(localMlbPayload, date);
}

async function getRemoteMlbPayload() {
  const now = Date.now();

  if (remoteMlbPayloadCache && now - remoteMlbPayloadFetchedAt < REMOTE_MLB_CACHE_MS) {
    return remoteMlbPayloadCache;
  }

  const response = await fetch(`${MLB_REMOTE_EVENTS_URL}?t=${now}`);

  if (!response.ok) {
    throw new Error(`MLB remote snapshot failed: ${response.status}`);
  }

  remoteMlbPayloadCache = await response.json();
  remoteMlbPayloadFetchedAt = now;

  return remoteMlbPayloadCache;
}

function normalizeStatus(value?: string): ScoreboardGame['status'] {
  if (
    value === 'LIVE' ||
    value === 'FINAL' ||
    value === 'SCHEDULED' ||
    value === 'POSTPONED' ||
    value === 'SUSPENDED'
  ) {
    return value;
  }
  return 'SCHEDULED';
}

function normalizeGame(game: any): ScoreboardGame {
  const status = normalizeStatus(game.status);
  const gameTaipeiDate = getTaipeiDateKey(game.gameDate);
  const todayTaipei = getTodayKeyTaipei();
  const safeStatus =
    status === 'LIVE' && gameTaipeiDate && gameTaipeiDate < todayTaipei ? 'FINAL' : status;

  return {
    id: String(game.id ?? `mlb-${game.gamePk}`),
    gamePk: Number(game.gamePk ?? 0),
    status: safeStatus,
    venue: game.venue ?? '待更新',
    awayTeam: {
      name: game.awayTeam?.name ?? 'Away',
      short: game.awayTeam?.short ?? 'AWY',
      record: game.awayTeam?.record ?? '',
      logo: game.awayTeam?.logo ?? getMlbTeamLogo(game.awayTeam),
    },
    homeTeam: {
      name: game.homeTeam?.name ?? 'Home',
      short: game.homeTeam?.short ?? 'HME',
      record: game.homeTeam?.record ?? '',
      logo: game.homeTeam?.logo ?? getMlbTeamLogo(game.homeTeam),
    },
    awayScore: Number(game.awayScore ?? 0),
    homeScore: Number(game.homeScore ?? 0),
    innings: Array.isArray(game.innings) ? game.innings : [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine: game.awayLine ?? {
      team: game.awayTeam?.short ?? 'AWY',
      innings: Array.from({ length: 9 }, () => '-'),
      r: Number(game.awayScore ?? 0),
      h: 0,
      e: 0,
    },
    homeLine: game.homeLine ?? {
      team: game.homeTeam?.short ?? 'HME',
      innings: Array.from({ length: 9 }, () => '-'),
      r: Number(game.homeScore ?? 0),
      h: 0,
      e: 0,
    },
    footerLeft: game.footerLeft ?? '待更新',
    footerRight: game.footerRight ?? '待更新',
    gameDate: game.gameDate,
  };
}

export async function fetchMlbGamesByDate(
  date: string,
  options?: {
    localOnly?: boolean;
    payload?: any;
  }
): Promise<ScoreboardGame[]> {
  const todayTaipei = getTodayKeyTaipei();
  const todayNewYork = getTodayKeyNewYork();

  if (options?.localOnly) {
    return fetchMlbRealGamesByDate(date);
  }

  if (options?.payload) {
    const payloadGames = getGamesForDateFromPayload(options.payload, date);

    if (payloadGames.length > 0) {
      return payloadGames;
    }
  }

  const localLiveGames = getLocalGamesForDate(date);

  if (localLiveGames.length > 0) {
    return localLiveGames;
  }

  const shouldFetchRemote = USE_REMOTE_MLB_EVENTS && (date === todayTaipei || date === todayNewYork);

  if (shouldFetchRemote) {
    try {
      const remotePayload = await getRemoteMlbPayload();
      const filteredRemoteGames = getGamesForDateFromPayload(remotePayload, date);

      if (filteredRemoteGames.length > 0) {
        return filteredRemoteGames;
      }
    } catch (error) {
      console.warn('Failed to load remote MLB snapshot', error);
    }
  }

  return fetchMlbRealGamesByDate(date);
}
