import mlb2026 from '../data/mlb-2026.json';
import { getMlbTeamLogo } from '../constants/mlbTeamLogos';
import type { ScoreboardGame } from './mlb';

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
  const awayTeam = game?.awayTeam ?? {};
  const homeTeam = game?.homeTeam ?? {};

  return {
    id: String(game.id ?? `mlb-${game.gamePk ?? ''}`),
    gamePk: Number(game.gamePk ?? 0),
    status: normalizeStatus(game.status),
    venue: game.venue ?? '待更新',
    awayTeam: {
      name: awayTeam.name ?? 'Away',
      short: awayTeam.short ?? 'AWY',
      record: awayTeam.record ?? '',
      logo: awayTeam.logo ?? getMlbTeamLogo(awayTeam.name),
    },
    homeTeam: {
      name: homeTeam.name ?? 'Home',
      short: homeTeam.short ?? 'HME',
      record: homeTeam.record ?? '',
      logo: homeTeam.logo ?? getMlbTeamLogo(homeTeam.name),
    },
    awayScore: Number(game.awayScore ?? 0),
    homeScore: Number(game.homeScore ?? 0),
    innings: Array.isArray(game.innings) ? game.innings : [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine: game.awayLine ?? {
      team: awayTeam.short ?? 'AWY',
      innings: Array.from({ length: 9 }, () => ''),
      r: Number(game.awayScore ?? 0),
      h: '',
      e: '',
    },
    homeLine: game.homeLine ?? {
      team: homeTeam.short ?? 'HME',
      innings: Array.from({ length: 9 }, () => ''),
      r: Number(game.homeScore ?? 0),
      h: '',
      e: '',
    },
    footerLeft: game.footerLeft ?? 'SCHEDULED',
    footerRight: game.footerRight ?? game.gameTime ?? '待定',
    gameDate: game.gameDate,
  };
}

function getGamesForDate(payload: any, date: string): ScoreboardGame[] {
  const gamesByDate = payload?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    const games = gamesByDate[date];
    return Array.isArray(games) ? games.map(normalizeGame) : [];
  }

  if (Array.isArray(payload?.games)) {
    return payload.games
      .filter((game: any) => game.gameDate === date || game.date === date)
      .map(normalizeGame);
  }

  return [];
}

export async function fetchMlbRealGamesByDate(date: string): Promise<ScoreboardGame[]> {
  return getGamesForDate(mlb2026, date);
}

export { fetchMlbRealGamesByDate as fetchMlbGamesByDate };
