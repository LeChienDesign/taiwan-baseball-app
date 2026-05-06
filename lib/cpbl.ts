import snapshot from '../server/data/eventsCenter.cpbl.json';
import {
  fetchCpblMajorGamesByDate as fetchCpblMajorFallback,
  fetchCpblMinorGamesByDate,
} from './cpbl-real';
import { CPBL_TEAM_LOGOS } from '../constants/cpblTeamLogos';

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
  const games = ((snapshot as any).games || [])
    .filter((game: any) => game.gameDate === date || game.date === date)
    .map(attachCpblLogos);

  if (games.length > 0) {
    return games;
  }

  return fetchCpblMajorFallback(date);
}

export { fetchCpblMinorGamesByDate };
