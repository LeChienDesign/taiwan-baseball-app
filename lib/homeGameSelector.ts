import type { FeaturedItem, LeagueKey, ScoreboardGame } from '../hooks/useHomeGames';

const HOME_FETCH_TIMEOUT_MS = 2500;
const SCORE_REFRESH_BEFORE_START_MINUTES = 10;
const SCORE_REFRESH_AFTER_START_MINUTES = 240;

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function getNextDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 1);
  return toDateKey(date);
}

export function getGameDateKey(game: any) {
  const value = game?.gameDate || game?.date || game?.startDate || game?.startTime || '';
  return String(value).slice(0, 10);
}

export function getMlbDateKeyForTaipei(todayKey: string) {
  const taipeiHour = new Date().getHours();

  // MLB games shown in Taiwan morning/afternoon usually still belong to the previous US calendar date.
  return taipeiHour < 18 ? getPreviousDateKey(todayKey) : todayKey;
}

export function mergeGamesById(games: ScoreboardGame[]) {
  const map = new Map<string, ScoreboardGame>();

  for (const game of games) {
    map.set(String(game.id), game);
  }

  return Array.from(map.values());
}

export function getLiveGamesOnly(games: ScoreboardGame[]) {
  return games.filter((game) => game.status === 'LIVE');
}

export async function withHomeFetchTimeout<T>(promise: Promise<T>, fallback: T) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), HOME_FETCH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function normalizeHomeGameStatus(
  game: any,
  todayKeyForLeague: string
): ScoreboardGame['status'] {
  const raw = String(game?.status ?? game?.statusText ?? game?.footerLeft ?? '').toUpperCase();
  const footerRaw = `${game?.footerLeft ?? ''} ${game?.footerRight ?? ''}`;
  const footer = footerRaw.toUpperCase();
  const gameDate = getGameDateKey(game);
  const isPastGameDate = Boolean(gameDate && gameDate < todayKeyForLeague);
  const isPostponed = raw.includes('POSTPONED') || raw.includes('延賽') || footer.includes('延賽');
  const hasScore = Number(game?.awayScore ?? 0) > 0 || Number(game?.homeScore ?? 0) > 0;
  const hasLineScore =
    Array.isArray(game?.awayLine?.innings) &&
    Array.isArray(game?.homeLine?.innings) &&
    (game.awayLine.innings.some(
      (value: any) => String(value ?? '').trim() !== '' && String(value ?? '').trim() !== '-'
    ) ||
      game.homeLine.innings.some(
        (value: any) => String(value ?? '').trim() !== '' && String(value ?? '').trim() !== '-'
      ));
  const explicitFinal =
    raw === 'FINAL' ||
    raw.includes('FINAL') ||
    raw.includes('GAME_OVER') ||
    raw.includes('GAME OVER') ||
    raw.includes('COMPLETED') ||
    raw.includes('CLOSED') ||
    raw.includes('結束') ||
    raw.includes('比賽結束') ||
    raw.includes('試合終了') ||
    raw.includes('終了') ||
    raw.includes('已完賽') ||
    footer.includes('FINAL') ||
    footer.includes('GAME_OVER') ||
    footer.includes('GAME OVER') ||
    footer.includes('比賽結束') ||
    footer.includes('試合終了') ||
    footer.includes('終了');
  const explicitLive =
    raw === 'LIVE' ||
    raw.includes('LIVE') ||
    raw.includes('比賽中') ||
    raw.includes('比賽進行中') ||
    raw.includes('IN PROGRESS') ||
    raw.includes('IN_PROGRESS') ||
    raw.includes('PROGRESS') ||
    raw.includes('PLAYING') ||
    raw.includes('경기중') ||
    footer.includes('LIVE') ||
    footer.includes('比賽中') ||
    footer.includes('경기중');
  const inningLikeLive =
    footer.includes('局') ||
    footer.includes('回') ||
    footer.includes('회') ||
    /\b(?:TOP|BOT|BOTTOM)\s*\d+/i.test(footerRaw) ||
    /\d+\s*(?:ST|ND|RD|TH)/i.test(footerRaw);

  if (explicitFinal) {
    return 'FINAL';
  }

  if (explicitLive) {
    return 'LIVE';
  }

  // Home is grouped by Taiwan date. After Taiwan 23:59, prior-date games should leave home
  // unless they are explicitly marked LIVE by the provider. This also prevents finals like
  // "11局 延長賽" from being treated as live just because the footer contains "局".
  if (isPastGameDate && !isPostponed) {
    return 'FINAL';
  }

  if (inningLikeLive && !isPastGameDate) {
    return 'LIVE';
  }

  if (!isPastGameDate && !isPostponed && (hasScore || hasLineScore)) {
    return 'LIVE';
  }

  return 'SCHEDULED';
}

export function normalizeHomeGames(games: ScoreboardGame[], todayKeyForLeague: string) {
  return games.map((game: any) => ({
    ...game,
    status: normalizeHomeGameStatus(game, todayKeyForLeague),
  })) as ScoreboardGame[];
}

export function getLeagueOrder(league: LeagueKey) {
  const order: Record<LeagueKey, number> = {
    CPBL: 1,
    MLB: 2,
    NPB: 3,
    KBO: 4,
  };
  return order[league];
}

export function getStatusOrder(status: ScoreboardGame['status']) {
  if (status === 'LIVE') return 1;
  if (status === 'SCHEDULED') return 2;
  if (status === 'FINAL') return 3;
  return 4;
}

export function parseTimeValue(text?: string) {
  if (!text) return 9999;
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getGameTimeValue(game: ScoreboardGame) {
  return parseTimeValue(game.footerRight);
}

function getScheduledGameStartMs(game: ScoreboardGame) {
  const dateKey = getGameDateKey(game);
  const timeText = game.footerRight || '';
  const match = timeText.match(/(\d{1,2}):(\d{2})/);

  if (!dateKey || !match) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const hour = Number(match[1]);
  const minute = Number(match[2]);

  return new Date(year, month - 1, day, hour, minute).getTime();
}

export function getLiveInningValue(game: ScoreboardGame) {
  const text = `${game.footerLeft ?? ''} ${game.footerRight ?? ''}`;
  const match = text.match(/(\d{1,2})\s*(?:局|回|th|st|nd|rd)/i);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

export function shouldRefreshScoresForGame(game: ScoreboardGame) {
  if (game.status === 'LIVE') return true;
  if (game.status === 'FINAL') return false;

  const scheduledMinutes = getGameTimeValue(game);
  if (scheduledMinutes === 9999) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesToStart = scheduledMinutes - nowMinutes;

  return (
    minutesToStart <= SCORE_REFRESH_BEFORE_START_MINUTES &&
    minutesToStart >= -SCORE_REFRESH_AFTER_START_MINUTES
  );
}

export function shouldAutoRefreshScores(items: FeaturedItem[]) {
  return items.some((item) => shouldRefreshScoresForGame(item.game));
}

export function sortLiveGames(items: FeaturedItem[]) {
  return [...items].sort((a, b) => {
    const leagueDiff = getLeagueOrder(a.league) - getLeagueOrder(b.league);
    if (leagueDiff !== 0) return leagueDiff;

    const inningDiff = getLiveInningValue(b.game) - getLiveInningValue(a.game);
    if (inningDiff !== 0) return inningDiff;

    const timeDiff = getGameTimeValue(a.game) - getGameTimeValue(b.game);
    if (timeDiff !== 0) return timeDiff;

    return String(a.game.id).localeCompare(String(b.game.id));
  });
}

export function hasMeaningfulGameContent(game: ScoreboardGame) {
  const hasVenue = !!String(game.venue || '').trim();
  const hasTime = !!String(game.footerRight || '').trim();
  const hasStatus = !!String(game.status || '').trim();
  const hasTeams = !!game.awayTeam?.name && !!game.homeTeam?.name;

  if (!hasTeams || !hasStatus) return false;

  if (game.status === 'LIVE' || game.status === 'FINAL') {
    return true;
  }

  return hasVenue || hasTime;
}

export function sortFeatured(items: FeaturedItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff = getStatusOrder(a.game.status) - getStatusOrder(b.game.status);
    if (statusDiff !== 0) return statusDiff;

    const timeDiff = getGameTimeValue(a.game) - getGameTimeValue(b.game);
    if (timeDiff !== 0) return timeDiff;

    const leagueDiff = getLeagueOrder(a.league) - getLeagueOrder(b.league);
    if (leagueDiff !== 0) return leagueDiff;

    return String(a.game.id).localeCompare(String(b.game.id));
  });
}

export function getUpcomingGamesWithinHours(items: FeaturedItem[], hours = 12) {
  const now = Date.now();
  const end = now + hours * 60 * 60 * 1000;

  return items
    .map((item) => ({
      item,
      startMs: getScheduledGameStartMs(item.game),
    }))
    .filter(({ item, startMs }) => {
      return (
        item.game.status === 'SCHEDULED' &&
        startMs != null &&
        startMs > now &&
        startMs <= end
      );
    })
    .sort((a, b) => {
      if (a.startMs !== b.startMs) {
        return Number(a.startMs) - Number(b.startMs);
      }

      return getLeagueOrder(a.item.league) - getLeagueOrder(b.item.league);
    })
    .map(({ item }) => item);
}

export function getHomeDisplayedGames(items: FeaturedItem[], limit = 4) {
  const liveItems = sortLiveGames(items.filter((item) => item.game.status === 'LIVE'));
  const upcomingItems = getUpcomingGamesWithinHours(items, 12);
  const scheduledFallback = sortFeatured(
    items.filter((item) => item.game.status === 'SCHEDULED')
  );

  const merged = [...liveItems, ...upcomingItems, ...scheduledFallback];
  const seen = new Set<string>();

  return merged
    .filter((item) => {
      const key = `${item.league}:${item.game.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function buildFeaturedItems(league: LeagueKey, games: ScoreboardGame[]) {
  return games
    .filter((game) => game.status !== 'FINAL')
    .filter(hasMeaningfulGameContent)
    .map((game) => ({ league, game }));
}

export function buildLeagueStat(games: ScoreboardGame[]) {
  const meaningful = games
    .filter((game) => game.status !== 'FINAL')
    .filter(hasMeaningfulGameContent);

  return {
    total: meaningful.length,
    live: meaningful.filter((game) => game.status === 'LIVE').length,
  };
}

export function buildLeagueHref(league: LeagueKey, date: string) {
  if (league === 'CPBL') return `/league/cpbl-major?date=${date}`;
  if (league === 'MLB') return `/league/mlb?date=${date}`;
  if (league === 'NPB') return `/league/npb?date=${date}`;
  return `/league/kbo?date=${date}`;
}
