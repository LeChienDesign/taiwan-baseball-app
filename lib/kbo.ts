import { fetchKboGamesByDate as fallback } from './kbo-real';
import { applyGameManualOverrides } from './manual/applyGameManualOverrides';

const KBO_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.kbo.json';

const snapshot = require('../server/data/eventsCenter.kbo.json');
const kboManualSnapshot = require('../server/data/manual/kbo.manual.json');

let remoteKboSnapshotCache: any = null;
let remoteKboSnapshotFetchedAt = 0;
const REMOTE_KBO_CACHE_MS = 60 * 1000;

function getTodayKeyTaipei() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getCanonicalKboTeamName(name: string) {
  const value = String(name ?? '').toLowerCase();

  if (value.includes('hanwha') || value.includes('韓華') || value.includes('한화')) return '韓華鷹';
  if (value.includes('doosan') || value.includes('斗山') || value.includes('두산')) return '斗山熊';
  if (value.includes('kia') || value.includes('kia虎')) return 'KIA虎';
  if (value.includes('kiwoom') || value.includes('培證') || value.includes('키움')) return '培證英雄';
  if (value.includes('kt') || value.includes('巫師')) return 'KT巫師';
  if (value.includes('lg') || value.includes('雙子')) return 'LG雙子';
  if (value.includes('lotte') || value.includes('樂天巨人') || value.includes('롯데')) return '樂天巨人';
  if (value.includes('nc') || value.includes('恐龍')) return 'NC恐龍';
  if (value.includes('samsung') || value.includes('三星') || value.includes('삼성')) return '三星獅';
  if (value.includes('ssg') || value.includes('登陸者')) return 'SSG登陸者';

  return name;
}

function buildFallbackLogoMap(fallbackGames: any[]) {
  const map = new Map<string, any>();

  for (const game of fallbackGames) {
    const teams = [game?.awayTeam, game?.homeTeam];

    for (const team of teams) {
      const canonical = getCanonicalKboTeamName(team?.name ?? team?.short ?? '');
      if (canonical && team?.logo && !map.has(canonical)) {
        map.set(canonical, team.logo);
      }
    }
  }

  return map;
}

function attachFallbackLogos(game: any, logoMap: Map<string, any>) {
  const awayCanonical = getCanonicalKboTeamName(game?.awayTeam?.name ?? '');
  const homeCanonical = getCanonicalKboTeamName(game?.homeTeam?.name ?? '');

  return {
    ...game,
    awayTeam: {
      ...game.awayTeam,
      logo: game.awayTeam?.logo ?? logoMap.get(awayCanonical),
    },
    homeTeam: {
      ...game.homeTeam,
      logo: game.homeTeam?.logo ?? logoMap.get(homeCanonical),
    },
  };
}


function applyKboManualOverrides(games: any[]) {
  return applyGameManualOverrides(games, kboManualSnapshot);
}

function getSnapshotGamesByDate(snapshotPayload: any, date: string) {
  const payload = snapshotPayload as any;
  const gamesByDate = payload?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    const games = gamesByDate[date];
    return Array.isArray(games) ? games : [];
  }

  return Array.isArray(payload?.games)
    ? payload.games.filter(
        (game: any) => game.date === date || game.gameDate === date,
      )
    : [];
}

async function getRemoteKboSnapshot() {
  const now = Date.now();

  if (
    remoteKboSnapshotCache &&
    now - remoteKboSnapshotFetchedAt < REMOTE_KBO_CACHE_MS
  ) {
    return remoteKboSnapshotCache;
  }

  const response = await fetch(`${KBO_REMOTE_EVENTS_URL}?t=${now}`);

  if (!response.ok) {
    throw new Error(`KBO remote snapshot failed: ${response.status}`);
  }

  remoteKboSnapshotCache = await response.json();
  remoteKboSnapshotFetchedAt = now;

  return remoteKboSnapshotCache;
}

export async function fetchKboGamesByDate(date: string, options?: { localOnly?: boolean }) {
  const fallbackGames = await fallback(date);
  const logoMap = buildFallbackLogoMap(fallbackGames);
  const todayTaipei = getTodayKeyTaipei();
  const shouldFetchRemote = date === todayTaipei;

  const localGames = getSnapshotGamesByDate(snapshot, date).map((g: any) =>
    attachFallbackLogos(g, logoMap),
  );

  if (options?.localOnly || !shouldFetchRemote) {
    if (localGames.length > 0) {
      return applyKboManualOverrides(localGames);
    }

    return applyKboManualOverrides(fallbackGames);
  }

  try {
    const remoteSnapshot = await getRemoteKboSnapshot();

    const remoteGames = getSnapshotGamesByDate(remoteSnapshot, date).map(
      (g: any) => attachFallbackLogos(g, logoMap),
    );

    if (remoteGames.length > 0) {
      return applyKboManualOverrides(remoteGames);
    }
  } catch (error) {
    console.warn('Failed to load remote KBO snapshot', error);
  }

  if (localGames.length > 0) {
    return applyKboManualOverrides(localGames);
  }

  return applyKboManualOverrides(fallbackGames);
}
