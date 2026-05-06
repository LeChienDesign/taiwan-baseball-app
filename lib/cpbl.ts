import {
  fetchCpblMajorGamesByDate as fetchCpblMajorFallback,
  fetchCpblMinorGamesByDate,
} from './cpbl-real';
import { CPBL_TEAM_LOGOS } from '../constants/cpblTeamLogos';

const CPBL_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.cpbl.json';

const localSnapshot = require('../server/data/eventsCenter.cpbl.json');

function getTeamLogo(name?: string) {
  if (!name) return require('../assets/league/cpbl.png');
  return CPBL_TEAM_LOGOS[name] ?? require('../assets/league/cpbl.png');
}

function attachCpblLogos(game: any) {
  return {
    ...game,
    awayTeam: {
      ...game.awayTeam,
      record: game.awayTeam?.record ?? '',
      logo: game.awayTeam?.logo ?? getTeamLogo(game.awayTeam?.name),
    },
    homeTeam: {
      ...game.homeTeam,
      record: game.homeTeam?.record ?? '',
      logo: game.homeTeam?.logo ?? getTeamLogo(game.homeTeam?.name),
    },
    innings: game.innings ?? [1, 2, 3, 4, 5, 6, 7, 8, 9],
  };
}

export async function fetchCpblMajorGamesByDate(date: string) {
  try {
    const response = await fetch(
      `${CPBL_REMOTE_EVENTS_URL}?t=${Date.now()}`,
    );

    if (response.ok) {
      const remoteSnapshot = await response.json();

      const remoteGames = ((remoteSnapshot as any).games || [])
        .filter((game: any) => game.gameDate === date || game.date === date)
        .map(attachCpblLogos);

      if (remoteGames.length > 0) {
        return remoteGames;
      }
    }
  } catch (error) {
    console.warn('Failed to load remote CPBL snapshot', error);
  }

  const localGames = ((localSnapshot as any).games || [])
    .filter((game: any) => game.gameDate === date || game.date === date)
    .map(attachCpblLogos);

  if (localGames.length > 0) {
    return localGames;
  }

  return fetchCpblMajorFallback(date);
}

export { fetchCpblMinorGamesByDate };
