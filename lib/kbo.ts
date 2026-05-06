import snapshot from '../server/data/eventsCenter.kbo.json';
import { fetchKboGamesByDate as fallback } from './kbo-real';

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

function getSnapshotGamesByDate(date: string) {
  const payload = snapshot as any;
  const gamesByDate = payload?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    const games = gamesByDate[date];
    return Array.isArray(games) ? games : [];
  }

  return Array.isArray(payload?.games)
    ? payload.games.filter((game: any) => game.date === date)
    : [];
}

export async function fetchKboGamesByDate(date: string) {
  const fallbackGames = await fallback(date);
  const logoMap = buildFallbackLogoMap(fallbackGames);

  const games = getSnapshotGamesByDate(date).map((g: any) =>
    attachFallbackLogos(g, logoMap)
  );

  if (games.length > 0) {
    return games;
  }

  return fallbackGames;
}
