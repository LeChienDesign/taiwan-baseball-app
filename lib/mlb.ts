import { getMlbTeamLogo } from '../constants/mlbTeamLogos';

import localMlbPayload from '../server/data/eventsCenter.mlb.json';

export type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logo: any;
};

export type LineScoreRow = {
  team: string;
  innings: (number | string)[];
  r: number;
  h: number;
  e: number;
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
  return value.slice(0, 10);
}

function normalizeStatus(value?: string): 'SCHEDULED' | 'LIVE' | 'FINAL' {
  if (value === 'LIVE' || value === 'FINAL' || value === 'SCHEDULED') {
    return value;
  }
  return 'SCHEDULED';
}

function normalizeGame(game: any): ScoreboardGame {
  return {
    id: String(game.id ?? `mlb-${game.gamePk}`),
    gamePk: Number(game.gamePk ?? 0),
    status: normalizeStatus(game.status),
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

function getLocalGames(): ScoreboardGame[] {
  const payload = localMlbPayload as any;

  if (Array.isArray(payload)) {
    return payload.map(normalizeGame);
  }

  if (Array.isArray(payload.games)) {
    return payload.games.map(normalizeGame);
  }

  if (Array.isArray(payload.eventsCenter?.mlb)) {
    return payload.eventsCenter.mlb.map(normalizeGame);
  }

  return [];
}

function getLocalGamesByDate(date: string): ScoreboardGame[] | null {
  const payload = localMlbPayload as any;
  const gamesByDate = payload?.gamesByDate;

  if (!gamesByDate || typeof gamesByDate !== 'object') {
    return null;
  }

  const games = gamesByDate[date];

  if (!Array.isArray(games)) {
    return [];
  }

  return games.map(normalizeGame);
}

export async function fetchMlbGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const gamesFromDateMap = getLocalGamesByDate(date);

  if (gamesFromDateMap) {
    return gamesFromDateMap;
  }

  const games = getLocalGames();

  return games.filter((game) => {
    const key = getDateKey(game.gameDate);
    return key === date;
  });
}
