import npbLiveSnapshot from '../server/data/eventsCenter.npb.json';
import { fetchNpbGamesByDate as fetchFallback } from './npb-real';

function isUsableNpbLiveGame(game: any) {
  const awayName = String(game?.awayTeam?.name ?? '').trim();
  const homeName = String(game?.homeTeam?.name ?? '').trim();

  if (!awayName || !homeName) return false;
  if (awayName === 'Away' || homeName === 'Home') return false;
  if (!game?.awayLine || !game?.homeLine) return false;

  return true;
}

function getCanonicalNpbTeamName(name: string) {
  const value = String(name ?? '').toLowerCase();

  if (value.includes('yomiuri') || value.includes('giants') || value.includes('讀賣') || value.includes('読売') || value.includes('巨人')) return 'Yomiuri';
  if (value.includes('yakult') || value.includes('swallows') || value.includes('養樂多') || value.includes('ヤクルト')) return 'Yakult';
  if (value.includes('dena') || value.includes('baystars') || value.includes('橫濱') || value.includes('横浜')) return 'DeNA';
  if (value.includes('hiroshima') || value.includes('carp') || value.includes('廣島') || value.includes('広島')) return 'Hiroshima';
  if (value.includes('chunichi') || value.includes('dragons') || value.includes('中日')) return 'Chunichi';
  if (value.includes('hanshin') || value.includes('tigers') || value.includes('阪神')) return 'Hanshin';
  if (value.includes('rakuten') || value.includes('eagles') || value.includes('樂天') || value.includes('楽天')) return 'Rakuten';
  if (value.includes('nippon-ham') || value.includes('fighters') || value.includes('火腿') || value.includes('日本ハム')) return 'Nippon-Ham';
  if (value.includes('seibu') || value.includes('lions') || value.includes('西武')) return 'Seibu';
  if (value.includes('softbank') || value.includes('hawks') || value.includes('軟銀') || value.includes('ソフトバンク')) return 'SoftBank';
  if (value.includes('orix') || value.includes('buffaloes') || value.includes('歐力士') || value.includes('オリックス')) return 'ORIX';
  if (value.includes('lotte') || value.includes('marines') || value.includes('羅德') || value.includes('ロッテ')) return 'Lotte';

  return name;
}

function buildFallbackLogoMap(fallbackGames: any[]) {
  const map = new Map<string, any>();

  for (const game of fallbackGames) {
    const teams = [game?.awayTeam, game?.homeTeam];

    for (const team of teams) {
      const canonical = getCanonicalNpbTeamName(team?.name ?? team?.short ?? '');
      if (canonical && team?.logo && !map.has(canonical)) {
        map.set(canonical, team.logo);
      }
    }
  }

  return map;
}

function attachFallbackLogos(game: any, logoMap: Map<string, any>) {
  const awayCanonical = getCanonicalNpbTeamName(game?.awayTeam?.name ?? '');
  const homeCanonical = getCanonicalNpbTeamName(game?.homeTeam?.name ?? '');

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
  const snapshot = npbLiveSnapshot as any;
  const gamesByDate = snapshot?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    const games = gamesByDate[date];
    return Array.isArray(games) ? games : [];
  }

  return Array.isArray(snapshot?.games)
    ? snapshot.games.filter((game: any) => game.date === date)
    : [];
}

export async function fetchNpbGamesByDate(date: string) {
  const fallbackGames = await fetchFallback(date);
  const logoMap = buildFallbackLogoMap(fallbackGames);

  const liveGames = getSnapshotGamesByDate(date)
    .filter((game: any) => isUsableNpbLiveGame(game))
    .map((game: any) => attachFallbackLogos(game, logoMap));

  if (liveGames.length > 0) {
    return liveGames;
  }

  return fallbackGames;
}
