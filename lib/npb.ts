import { fetchNpbGamesByDate as fetchFallback } from './npb-real';
import { applyGameManualOverrides } from './manual/applyGameManualOverrides';

const NPB_REMOTE_EVENTS_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/eventsCenter.npb.json';


const npbLiveSnapshot = require('../server/data/eventsCenter.npb.json');
const npbManualSnapshot = require('../server/data/manual/npb.manual.json');

let remoteNpbSnapshotCache: any = null;
let remoteNpbSnapshotFetchedAt = 0;
const REMOTE_NPB_CACHE_MS = 60 * 1000;
async function getRemoteNpbSnapshot() {
  const now = Date.now();

  if (
    remoteNpbSnapshotCache &&
    now - remoteNpbSnapshotFetchedAt < REMOTE_NPB_CACHE_MS
  ) {
    return remoteNpbSnapshotCache;
  }

  const response = await fetch(`${NPB_REMOTE_EVENTS_URL}?t=${now}`);

  if (!response.ok) {
    throw new Error(`NPB remote snapshot failed: ${response.status}`);
  }

  remoteNpbSnapshotCache = await response.json();
  remoteNpbSnapshotFetchedAt = now;

  return remoteNpbSnapshotCache;
}

const NPB_TEAM_LOGOS: Record<string, any> = {
  Yomiuri: require('../assets/npb/Yomiuri Giants.png'),
  Yakult: require('../assets/npb/Tokyo Yakult Swal.png'),
  DeNA: require('../assets/npb/Yokohama DeNA Bay.png'),
  Hiroshima: require('../assets/npb/Hiroshima Toyo Ca.png'),
  Chunichi: require('../assets/npb/Chunichi Dragons.png'),
  Hanshin: require('../assets/npb/Hanshin Tigers.png'),
  Rakuten: require('../assets/npb/Tohoku Rakuten Go.png'),
  'Nippon-Ham': require('../assets/npb/Hokkaido Nippon-H.png'),
  Seibu: require('../assets/npb/Saitama Seibu Lio.png'),
  SoftBank: require('../assets/npb/Fukuoka SoftBank.png'),
  ORIX: require('../assets/npb/Orix Buffaloes.png'),
  Lotte: require('../assets/npb/Lotte Marines.png'),
};

// 2026 NPB official May schedule: dates with no games.
// Keep these dates as empty even when local fallback schedule data exists.
const NPB_CONFIRMED_NO_GAME_DATES = new Set([
  '2026-05-07',
  '2026-05-11',
  '2026-05-18',
  '2026-05-25',
]);


function getTodayKeyTaipei() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isFutureOrTodayInTaipei(date: string) {
  const today = getTodayKeyTaipei();
  return date >= today;
}

function getNpbGameDate(game: any) {
  return String(game?.gameDate ?? game?.date ?? '').slice(0, 10);
}

function getEffectiveNpbStatus(game: any) {
  const status = String(game?.status ?? '').toUpperCase();
  const gameDate = getNpbGameDate(game);
  const today = getTodayKeyTaipei();

  if (status === 'LIVE' && gameDate && gameDate < today) {
    return 'FINAL';
  }

  const awayInnings = Array.isArray(game?.awayLine?.innings) ? game.awayLine.innings : [];
  const homeInnings = Array.isArray(game?.homeLine?.innings) ? game.homeLine.innings : [];
  const hasNineInnings =
    awayInnings.length >= 9 &&
    homeInnings.length >= 9 &&
    awayInnings.slice(0, 9).every((value: any) => value !== '-' && value !== '' && value != null) &&
    homeInnings.slice(0, 9).every((value: any) => value !== '-' && value !== '' && value != null);

  const statusText = String(game?.statusText ?? '').toUpperCase();
  const footerLeft = String(game?.footerLeft ?? '').toUpperCase();
  const footerRight = String(game?.footerRight ?? '').toUpperCase();

  const hasFinalText =
    statusText.includes('FINAL') ||
    statusText.includes('GAMEOVER') ||
    statusText.includes('試合終了') ||
    footerLeft.includes('FINAL') ||
    footerLeft.includes('GAMEOVER') ||
    footerLeft.includes('試合終了') ||
    footerRight.includes('FINAL') ||
    footerRight.includes('GAMEOVER') ||
    footerRight.includes('試合終了');

  if (status === 'LIVE' && (hasNineInnings || hasFinalText)) {
    return 'FINAL';
  }

  return status;
}

function normalizeExpiredNpbLiveStatus(game: any) {
  const effectiveStatus = getEffectiveNpbStatus(game);

  if (effectiveStatus !== 'FINAL') {
    return game;
  }

  const rawStatus = String(game?.status ?? '').toUpperCase();
  if (rawStatus !== 'LIVE') {
    return game;
  }

  return {
    ...game,
    status: 'FINAL',
    statusText: game?.statusText ?? 'FINAL',
    footerLeft: 'FINAL',
    footerRight: game?.footerRight === 'LIVE' ? '' : game?.footerRight,
  };
}

function isUsableNpbLiveGame(game: any) {
  const awayName = String(game?.awayTeam?.name ?? '').trim();
  const homeName = String(game?.homeTeam?.name ?? '').trim();
  const status = getEffectiveNpbStatus(game);

  if (!awayName || !homeName) return false;
  if (awayName === 'Away' || homeName === 'Home') return false;

  const isScheduled =
    status === 'SCHEDULED' || status === 'PRE' || status === 'PREGAME' || status === '';

  if (isScheduled) {
    return true;
  }

  return Boolean(game?.awayLine && game?.homeLine);
}

function getCanonicalNpbTeamName(name: string) {
  const value = String(name ?? '').toLowerCase().trim();

  if (
    value.includes('yomiuri') ||
    value.includes('giants') ||
    value.includes('讀賣') ||
    value.includes('読売') ||
    value.includes('巨人') ||
    value === 'yom'
  ) {
    return 'Yomiuri';
  }

  if (
    value.includes('yakult') ||
    value.includes('swallows') ||
    value.includes('養樂多') ||
    value.includes('ヤクルト') ||
    value === 'yak'
  ) {
    return 'Yakult';
  }

  if (
    value.includes('dena') ||
    value.includes('baystars') ||
    value.includes('橫濱') ||
    value.includes('横浜') ||
    value === 'db'
  ) {
    return 'DeNA';
  }

  if (
    value.includes('hiroshima') ||
    value.includes('carp') ||
    value.includes('廣島') ||
    value.includes('広島') ||
    value === 'carp'
  ) {
    return 'Hiroshima';
  }

  if (
    value.includes('chunichi') ||
    value.includes('dragons') ||
    value.includes('中日') ||
    value === 'chu'
  ) {
    return 'Chunichi';
  }

  if (
    value.includes('hanshin') ||
    value.includes('tigers') ||
    value.includes('阪神') ||
    value === 'han'
  ) {
    return 'Hanshin';
  }

  if (
    value.includes('rakuten') ||
    value.includes('eagles') ||
    value.includes('樂天') ||
    value.includes('楽天') ||
    value === 'e'
  ) {
    return 'Rakuten';
  }

  if (
    value.includes('nippon-ham') ||
    value.includes('fighters') ||
    value.includes('火腿') ||
    value.includes('日本ハム') ||
    value === 'f'
  ) {
    return 'Nippon-Ham';
  }

  if (
    value.includes('seibu') ||
    value.includes('lions') ||
    value.includes('西武') ||
    value === 'l'
  ) {
    return 'Seibu';
  }

  if (
    value.includes('softbank') ||
    value.includes('hawks') ||
    value.includes('軟銀') ||
    value.includes('ソフトバンク') ||
    value === 'h'
  ) {
    return 'SoftBank';
  }

  if (
    value.includes('orix') ||
    value.includes('buffaloes') ||
    value.includes('歐力士') ||
    value.includes('オリックス') ||
    value === 'b'
  ) {
    return 'ORIX';
  }

  if (
    value.includes('lotte') ||
    value.includes('marines') ||
    value.includes('羅德') ||
    value.includes('ロッテ') ||
    value === 'm'
  ) {
    return 'Lotte';
  }

  return name;
}

function buildFallbackLogoMap(fallbackGames: any[]) {
  const map = new Map<string, any>();

  const addLogo = (key: any, logo: any) => {
    const text = String(key ?? '').trim();
    if (!text || !logo) return;

    if (!map.has(text)) {
      map.set(text, logo);
    }

    const lowerText = text.toLowerCase();
    if (!map.has(lowerText)) {
      map.set(lowerText, logo);
    }
  };

  for (const game of fallbackGames) {
    const teams = [game?.awayTeam, game?.homeTeam];

    for (const team of teams) {
      const logo = team?.logo;
      const name = team?.name ?? '';
      const short = team?.short ?? '';
      const canonical = getCanonicalNpbTeamName(name || short);

      addLogo(name, logo);
      addLogo(short, logo);
      addLogo(canonical, logo);
    }
  }

  return map;
}

function attachFallbackLogos(game: any, logoMap: Map<string, any>) {
  const getLogo = (team: any) => {
    const name = team?.name ?? '';
    const short = team?.short ?? '';
    const canonical = getCanonicalNpbTeamName(name || short);

    return (
      team?.logo ??
      logoMap.get(name) ??
      logoMap.get(String(name).toLowerCase()) ??
      logoMap.get(short) ??
      logoMap.get(String(short).toLowerCase()) ??
      logoMap.get(canonical) ??
      logoMap.get(String(canonical).toLowerCase()) ??
      NPB_TEAM_LOGOS[canonical]
    );
  };

  return {
    ...game,
    awayTeam: {
      ...game.awayTeam,
      logo: getLogo(game.awayTeam),
    },
    homeTeam: {
      ...game.homeTeam,
      logo: getLogo(game.homeTeam),
    },
  };
}


function applyNpbManualOverrides(games: any[]) {
  return applyGameManualOverrides(games, npbManualSnapshot);
}

function getSnapshotUpdatedAtMs(snapshotPayload: any) {
  const timestamp = snapshotPayload?.updatedAt;
  if (!timestamp) return 0;

  const parsed = Date.parse(String(timestamp));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSnapshotLivePriority(snapshotPayload: any, date: string) {
  const games = getSnapshotGamesByDate(snapshotPayload, date);

  return games.reduce((score: number, game: any) => {
    const status = getEffectiveNpbStatus(game);

    if (status === 'LIVE') return score + 100;
    if (status === 'FINAL' || status === 'GAMEOVER') return score + 10;
    return score;
  }, 0);
}

function choosePreferredSnapshot(firstSnapshot: any, secondSnapshot: any, date: string) {
  const firstPriority = getSnapshotLivePriority(firstSnapshot, date);
  const secondPriority = getSnapshotLivePriority(secondSnapshot, date);

  if (firstPriority !== secondPriority) {
    return firstPriority > secondPriority ? firstSnapshot : secondSnapshot;
  }

  const firstUpdatedAt = getSnapshotUpdatedAtMs(firstSnapshot);
  const secondUpdatedAt = getSnapshotUpdatedAtMs(secondSnapshot);

  return firstUpdatedAt >= secondUpdatedAt ? firstSnapshot : secondSnapshot;
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
  const status = getEffectiveNpbStatus(game);
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

function snapshotHasDate(snapshot: any, date: string) {
  const gamesByDate = snapshot?.gamesByDate;

  if (gamesByDate && typeof gamesByDate === 'object') {
    return Object.prototype.hasOwnProperty.call(gamesByDate, date);
  }

  if (Array.isArray(snapshot?.games)) {
    return snapshot.games.some((game: any) => game.date === date || game.gameDate === date);
  }

  return false;
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

export async function fetchNpbGamesByDate(
  date: string,
  options?: {
    localOnly?: boolean;
    payload?: any;
  }
) {
  const fallbackGames = await fetchFallback(date);
  const logoMap = buildFallbackLogoMap(fallbackGames);
  const todayTaipei = getTodayKeyTaipei();
  const shouldFetchRemote = isFutureOrTodayInTaipei(date);

  const localGames = getSnapshotGamesByDate(npbLiveSnapshot, date)
    .filter((game: any) => isUsableNpbLiveGame(game))
    .map(normalizeExpiredNpbLiveStatus)
    .map((game: any) => attachFallbackLogos(game, logoMap))
    .map(normalizeNpbTaiwanDisplayTime);

  const localSnapshotHasDate = snapshotHasDate(npbLiveSnapshot, date);

  if (NPB_CONFIRMED_NO_GAME_DATES.has(date)) {
    return [];
  }

  if (options?.localOnly) {
    if (localGames.length > 0) {
      return applyNpbManualOverrides(localGames);
    }

    return applyNpbManualOverrides(
      fallbackGames
        .map((game: any) => attachFallbackLogos(game, logoMap))
        .map(normalizeNpbTaiwanDisplayTime)
    );
  }

  if (options?.payload) {
    const preferredSnapshot = choosePreferredSnapshot(options.payload, npbLiveSnapshot, date);
    const preferredSnapshotHasDate = snapshotHasDate(preferredSnapshot, date);

    const payloadGames = getSnapshotGamesByDate(preferredSnapshot, date)
      .filter((game: any) => isUsableNpbLiveGame(game))
      .map(normalizeExpiredNpbLiveStatus)
      .map((game: any) => attachFallbackLogos(game, logoMap))
      .map(normalizeNpbTaiwanDisplayTime);

    if (preferredSnapshotHasDate && payloadGames.length > 0) {
      return applyNpbManualOverrides(payloadGames);
    }
  }

  if (localSnapshotHasDate && localGames.length > 0) {
    return applyNpbManualOverrides(localGames);
  }

  if (!shouldFetchRemote) {
    const finishedLocalGames = localGames.filter((game: any) => {
      const status = getEffectiveNpbStatus(game);
      return status === 'FINAL' || status === 'GAMEOVER';
    });

    if (finishedLocalGames.length > 0) {
      return applyNpbManualOverrides(finishedLocalGames);
    }

    return applyNpbManualOverrides(
      fallbackGames
        .filter((game: any) => {
          const status = getEffectiveNpbStatus(game);
          return status === 'FINAL' || status === 'GAMEOVER';
        })
        .map((game: any) => attachFallbackLogos(game, logoMap))
        .map(normalizeNpbTaiwanDisplayTime)
    );
  }

  try {
    const remoteSnapshot = await getRemoteNpbSnapshot();
    const preferredSnapshot = choosePreferredSnapshot(remoteSnapshot, npbLiveSnapshot, date);
    const preferredSnapshotHasDate = snapshotHasDate(preferredSnapshot, date);

    const remoteGames = getSnapshotGamesByDate(preferredSnapshot, date)
      .filter((game: any) => isUsableNpbLiveGame(game))
      .map(normalizeExpiredNpbLiveStatus)
      .map((game: any) => attachFallbackLogos(game, logoMap))
      .map(normalizeNpbTaiwanDisplayTime);

    if (preferredSnapshotHasDate && remoteGames.length > 0) {
      return applyNpbManualOverrides(remoteGames);
    }
  } catch (error) {
    console.warn('Failed to load remote NPB snapshot', error);
  }

  return applyNpbManualOverrides(
    fallbackGames
      .map((game: any) => attachFallbackLogos(game, logoMap))
      .map(normalizeNpbTaiwanDisplayTime)
  );
}
