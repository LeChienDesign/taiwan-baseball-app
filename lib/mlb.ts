import { getMlbTeamLogo } from '../constants/mlbTeamLogos';

const MLB_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.mlb.json';

const localMlbPayload = require('../server/data/eventsCenter.mlb.json');

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
  gamePk: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
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

function getDateKey(value?: string) {
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

function getTodayKeyTaipei() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
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

function getLocalGamesForDate(date: string): ScoreboardGame[] {
  return getSnapshotGames(localMlbPayload).filter((game) => {
    const key = getDateKey(game.gameDate);
    return key === date;
  });
}

function normalizeStatus(value?: string): 'SCHEDULED' | 'LIVE' | 'FINAL' {
  if (value === 'LIVE' || value === 'FINAL' || value === 'SCHEDULED') {
    return value;
  }
  return 'SCHEDULED';
}

function normalizeGame(game: any): ScoreboardGame {
  const status = normalizeStatus(game.status);
  const gameTaipeiDate = getDateKey(game.gameDate);
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
  options?: { localOnly?: boolean }
): Promise<ScoreboardGame[]> {
  const todayTaipei = getTodayKeyTaipei();
  if (options?.localOnly) {
    return getLocalGamesForDate(date);
  }
  const shouldFetchRemote = date === todayTaipei;

  if (!shouldFetchRemote) {
    return getLocalGamesForDate(date);
  }

  try {
    const response = await fetch(`${MLB_REMOTE_EVENTS_URL}?t=${Date.now()}`);

    if (response.ok) {
      const remotePayload = await response.json();

      const filteredRemoteGames = getSnapshotGames(remotePayload).filter((game) => {
        const key = getDateKey(game.gameDate);
        return key === date;
      });

      if (filteredRemoteGames.length > 0) {
        return filteredRemoteGames;
      }
    }
  } catch (error) {
    console.warn('Failed to load remote MLB snapshot', error);
  }

  return getLocalGamesForDate(date);
}
