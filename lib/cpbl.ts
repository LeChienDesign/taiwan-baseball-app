import {
  fetchCpblMajorGamesByDate as fetchCpblMajorFallback,
  fetchCpblMinorGamesByDate,
} from './cpbl-real';
import { CPBL_TEAM_LOGOS } from '../constants/cpblTeamLogos';

const CPBL_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.cpbl.json';

const localSnapshot = require('../server/data/eventsCenter.cpbl.json');
const cpblManualSnapshot = require('../server/data/manual/cpbl.manual.json');

let remoteCpblSnapshotCache: any = null;
let remoteCpblSnapshotFetchedAt = 0;
const REMOTE_CPBL_CACHE_MS = 60 * 1000;
async function getRemoteCpblSnapshot() {
  const now = Date.now();

  if (
    remoteCpblSnapshotCache &&
    now - remoteCpblSnapshotFetchedAt < REMOTE_CPBL_CACHE_MS
  ) {
    return remoteCpblSnapshotCache;
  }

  const response = await fetch(`${CPBL_REMOTE_EVENTS_URL}?t=${now}`);

  if (!response.ok) {
    throw new Error(`CPBL remote snapshot failed: ${response.status}`);
  }

  remoteCpblSnapshotCache = await response.json();
  remoteCpblSnapshotFetchedAt = now;

  return remoteCpblSnapshotCache;
}

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

function buildManualGameKey(game: any) {
  const gameDate = game.gameDate ?? game.date;
  const awayName = game.awayTeam?.name ?? game.awayTeam?.short ?? '';
  const homeName = game.homeTeam?.name ?? game.homeTeam?.short ?? '';

  if (!gameDate || !awayName || !homeName) return undefined;

  return `${gameDate}-${awayName}-${homeName}`;
}

function getManualGameOverride(game: any) {
  const manualGames = cpblManualSnapshot?.games ?? {};
  const manualKey = buildManualGameKey(game);

  return (
    manualGames[game.id] ??
    manualGames[game.gamePk] ??
    (manualKey ? manualGames[manualKey] : undefined)
  );
}

function applyCpblManualOverrides(games: any[]) {
  return games.map((game) => {
    const override = getManualGameOverride(game);

    if (!override) return game;

    return {
      ...game,
      ...override,
      awayTeam: {
        ...(game.awayTeam ?? {}),
        ...(override.awayTeam ?? {}),
      },
      homeTeam: {
        ...(game.homeTeam ?? {}),
        ...(override.homeTeam ?? {}),
      },
      awayLine: override.awayLine ?? game.awayLine,
      homeLine: override.homeLine ?? game.homeLine,
    };
  });
}

export async function fetchCpblMajorGamesByDate(date: string) {
  try {
    const remoteSnapshot = await getRemoteCpblSnapshot();

    const remoteGames = ((remoteSnapshot as any).games || [])
      .filter((game: any) => game.gameDate === date || game.date === date)
      .map(attachCpblLogos);

    if (remoteGames.length > 0) {
      return applyCpblManualOverrides(remoteGames);
    }
  } catch (error) {
    console.warn('Failed to load remote CPBL snapshot', error);
  }

  const localGames = ((localSnapshot as any).games || [])
    .filter((game: any) => game.gameDate === date || game.date === date)
    .map(attachCpblLogos);

  if (localGames.length > 0) {
    return applyCpblManualOverrides(localGames);
  }

  const fallbackGames = await fetchCpblMajorFallback(date);
  return applyCpblManualOverrides(fallbackGames);
}

export { fetchCpblMinorGamesByDate };
