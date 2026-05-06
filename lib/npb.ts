import { fetchNpbGamesByDate as fetchFallback } from './npb-real';

const NPB_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.npb.json';

const npbLiveSnapshot = require('../server/data/eventsCenter.npb.json');

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

function isClockText(value: any) {
  return /^\d{1,2}:\d{2}$/.test(String(value ?? '').trim());
}

function convertJapanTimeToTaiwanTime(value: any) {
  const text = String(value ?? '').trim();

  if (!isClockText(text)) {
    return value;
  }

  const [hourText, minuteText] = text.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const taiwanHour = (hour + 23) % 24;
  return `${String(taiwanHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizeNpbTaiwanDisplayTime(game: any) {
  const status = String(game?.status ?? '').toUpperCase();
  const shouldConvertTime = status === 'SCHEDULED' || status === 'PRE' || status === 'PREGAME' || status === '';

  if (!shouldConvertTime) {
    return game;
  }

  return {
    ...game,
    gameTime: isClockText(game?.gameTime) ? convertJapanTimeToTaiwanTime(game.gameTime) : game?.gameTime,
    displayTime: isClockText(game?.displayTime) ? convertJapanTimeToTaiwanTime(game.displayTime) : game?.displayTime,
    footerRight: isClockText(game?.footerRight) ? convertJapanTimeToTaiwanTime(game.footerRight) : game?.footerRight,
  };
}

function getSnapshotGamesByDate(snapshot: any, date: string) {
  const gamesByDate = snapshot?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    const games = gamesByDate[date];
    return Array.isArray(games) ? games : [];
  }

  return Array.isArray(snapshot?.games)
    ? snapshot.games.filter((game: any) => game.date === date || game.gameDate === date)
    : [];
}

export async function fetchNpbGamesByDate(date: string) {
  const fallbackGames = await fetchFallback(date);
  const logoMap = buildFallbackLogoMap(fallbackGames);

  try {
    const response = await fetch(
      `${NPB_REMOTE_EVENTS_URL}?t=${Date.now()}`,
    );

    if (response.ok) {
      const remoteSnapshot = await response.json();

      const remoteGames = getSnapshotGamesByDate(remoteSnapshot, date)
        .filter((game: any) => isUsableNpbLiveGame(game))
        .map((game: any) => attachFallbackLogos(game, logoMap))
        .map(normalizeNpbTaiwanDisplayTime);

      if (remoteGames.length > 0) {
        return remoteGames;
      }
    }
  } catch (error) {
    console.warn('Failed to load remote NPB snapshot', error);
  }

  const localGames = getSnapshotGamesByDate(npbLiveSnapshot, date)
    .filter((game: any) => isUsableNpbLiveGame(game))
    .map((game: any) => attachFallbackLogos(game, logoMap))
    .map(normalizeNpbTaiwanDisplayTime);

  if (localGames.length > 0) {
    return localGames;
  }

  return fallbackGames.map(normalizeNpbTaiwanDisplayTime);
}
