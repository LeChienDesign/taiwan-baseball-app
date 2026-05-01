import { abroadRegistry } from '../../data/abroadRegistry';

type AbroadNewsItem = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  url?: string;
  source?: string;
};

type AbroadTeamMeta = {
  id?: number;
  code?: string;
  abbreviation?: string;
  logoKey?: string;
  logoUrl?: string;
  displayName?: string;
  leagueGroup?: 'MLB' | 'MiLB' | 'NPB' | 'KBO' | 'Farm' | 'Other';
};

type AbroadPlayerLike = {
  id: string;
  name: string;
  enName?: string;
  team?: string;
  league?: string;
  level?: string;
  position?: string;
  bats?: string;
  throws?: string;
  age?: number;
  number?: string;
  status?: string;
  intro?: string;
  type?: 'pitcher' | 'hitter';
  teamColor?: string;
  trending?: boolean;
  line1?: string;
  line2?: string;
  recentNote?: string;
  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };
  seasonStats?: {
    hitter?: Record<string, any>;
    pitcher?: Record<string, any>;
    [key: string]: any;
  };
  recentGames?: Array<Record<string, any>>;
  news?: AbroadNewsItem[];
  career?: Array<Record<string, any>>;
  teamMeta?: AbroadTeamMeta;
  officialPlayerUrl?: string;
  officialPhotoUrl?: string;
  officialPersonId?: number;
  [key: string]: any;
};

type AbroadPatch = Partial<AbroadPlayerLike>;
type AbroadPatchMap = Record<string, AbroadPatch>;

type ApplyOptions = {
  date?: string;
  daysBack?: number;
  maxGames?: number;
};

type NormalizedAffiliateTeam = {
  id: number;
  name: string;
  sportId: number;
  parentOrgId?: number;
};

type NormalizedScheduledGame = {
  gamePk: number;
  gameDate?: string;
  detailedState?: string;
  homeTeamId?: number;
  awayTeamId?: number;
  homeTeamName?: string;
  awayTeamName?: string;
};

type PlayerGameHit = {
  side: 'home' | 'away';
  opponentName: string;
  playerEntry: any;
};

const STATS_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MILB_SPORT_IDS = [11, 12, 13, 14, 15, 16];

const allMiLbTeamsCache = new Map<number, NormalizedAffiliateTeam[]>();
const orgAffiliateTeamsCache = new Map<string, NormalizedAffiliateTeam[]>();
const orgRecentGamesCache = new Map<string, NormalizedScheduledGame[]>();
const boxscoreCache = new Map<number, any | null>();

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function toDisplayDate(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function isTrackedMiLbPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
  if (registry?.provider !== 'mlb') return false;
  return normalizeText(registry.league) === 'milb' || normalizeText(player.league) === 'milb';
}

function hasRecentGames(player: AbroadPlayerLike) {
  return Array.isArray(player.recentGames) && player.recentGames.length > 0;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractParentOrgId(team: any): number | undefined {
  const direct =
    team?.parentOrgId ??
    team?.parentOrg?.id ??
    team?.parentOrg?.teamId ??
    team?.parentOrg?.mlbamId;

  return typeof direct === 'number' ? direct : undefined;
}

function normalizeAffiliateTeam(team: any): NormalizedAffiliateTeam | null {
  const id = team?.id;
  const sportId = team?.sport?.id;

  if (typeof id !== 'number') return null;
  if (typeof sportId !== 'number') return null;
  if (!MILB_SPORT_IDS.includes(sportId)) return null;

  return {
    id,
    name: team?.name ?? `Team ${id}`,
    sportId,
    parentOrgId: extractParentOrgId(team),
  };
}

async function fetchAllMiLbTeams(season: number) {
  const cached = allMiLbTeamsCache.get(season);
  if (cached) return cached;

  const url =
    `${STATS_API_BASE}/teams` +
    `?sportIds=${MILB_SPORT_IDS.join(',')}` +
    `&season=${season}` +
    `&hydrate=parentOrgId`;

  const json = await fetchJson<any>(url);
  const rawTeams = Array.isArray(json?.teams) ? json.teams : [];
  const teams = rawTeams
    .map(normalizeAffiliateTeam)
    .filter((item): item is NormalizedAffiliateTeam => !!item);

  allMiLbTeamsCache.set(season, teams);
  return teams;
}

async function getAffiliateTeamsForOrg(orgId: number, season: number) {
  const cacheKey = `${orgId}:${season}`;
  const cached = orgAffiliateTeamsCache.get(cacheKey);
  if (cached) return cached;

  const allTeams = await fetchAllMiLbTeams(season);
  const filtered = allTeams.filter((team) => team.parentOrgId === orgId);

  orgAffiliateTeamsCache.set(cacheKey, filtered);
  return filtered;
}

function flattenScheduleDates(scheduleResponse: any) {
  const dates = Array.isArray(scheduleResponse?.dates) ? scheduleResponse.dates : [];
  return dates.flatMap((date: any) => (Array.isArray(date?.games) ? date.games : []));
}

function normalizeScheduledGame(game: any): NormalizedScheduledGame | null {
  const gamePk = game?.gamePk;
  if (typeof gamePk !== 'number') return null;

  return {
    gamePk,
    gameDate: game?.gameDate,
    detailedState: game?.status?.detailedState,
    homeTeamId: game?.teams?.home?.team?.id,
    awayTeamId: game?.teams?.away?.team?.id,
    homeTeamName: game?.teams?.home?.team?.name,
    awayTeamName: game?.teams?.away?.team?.name,
  };
}

async function fetchScheduleForAffiliate(
  affiliate: NormalizedAffiliateTeam,
  startDate: string,
  endDate: string
) {
  const cacheKey = `${affiliate.id}:${startDate}:${endDate}`;
  const cached = orgRecentGamesCache.get(cacheKey);
  if (cached) return cached;

  const url =
    `${STATS_API_BASE}/schedule` +
    `?sportId=${affiliate.sportId}` +
    `&teamId=${affiliate.id}` +
    `&startDate=${startDate}` +
    `&endDate=${endDate}`;

  const json = await fetchJson<any>(url);
  const games = flattenScheduleDates(json)
    .map(normalizeScheduledGame)
    .filter((item): item is NormalizedScheduledGame => !!item);

  orgRecentGamesCache.set(cacheKey, games);
  return games;
}

async function getRecentGamesForOrg(
  orgId: number,
  season: number,
  requestedDate: string,
  daysBack: number
) {
  const startDate = addDays(requestedDate, -daysBack);
  const cacheKey = `${orgId}:${season}:${startDate}:${requestedDate}`;
  const cached = orgRecentGamesCache.get(cacheKey);
  if (cached) return cached;

  const affiliates = await getAffiliateTeamsForOrg(orgId, season);
  const gameArrays = await Promise.all(
    affiliates.map((affiliate) => fetchScheduleForAffiliate(affiliate, startDate, requestedDate))
  );

  const deduped = new Map<number, NormalizedScheduledGame>();
  for (const games of gameArrays) {
    for (const game of games) {
      deduped.set(game.gamePk, game);
    }
  }

  const merged = Array.from(deduped.values()).sort((a, b) => {
    const aTime = Date.parse(a.gameDate ?? '');
    const bTime = Date.parse(b.gameDate ?? '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  orgRecentGamesCache.set(cacheKey, merged);
  return merged;
}

async function fetchBoxscore(gamePk: number) {
  const cached = boxscoreCache.get(gamePk);
  if (cached !== undefined) return cached;

  const json = await fetchJson<any>(`${STATS_API_BASE}/game/${gamePk}/boxscore`);
  boxscoreCache.set(gamePk, json);
  return json;
}

function getPlayerEntryFromSide(playersMap: Record<string, any> | undefined, personId: number) {
  if (!playersMap || typeof playersMap !== 'object') return undefined;

  const direct = playersMap[`ID${personId}`];
  if (direct) return direct;

  return Object.values(playersMap).find((entry: any) => Number(entry?.person?.id) === personId);
}

function extractPlayerGameHit(
  boxscore: any,
  scheduledGame: NormalizedScheduledGame,
  personId: number
): PlayerGameHit | null {
  const homePlayers = boxscore?.teams?.home?.players;
  const awayPlayers = boxscore?.teams?.away?.players;

  const homeEntry = getPlayerEntryFromSide(homePlayers, personId);
  if (homeEntry) {
    return {
      side: 'home',
      opponentName: scheduledGame.awayTeamName ?? '—',
      playerEntry: homeEntry,
    };
  }

  const awayEntry = getPlayerEntryFromSide(awayPlayers, personId);
  if (awayEntry) {
    return {
      side: 'away',
      opponentName: scheduledGame.homeTeamName ?? '—',
      playerEntry: awayEntry,
    };
  }

  return null;
}

function numericStat(value: any) {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasPitchingAppearance(stats: any) {
  if (!stats || typeof stats !== 'object') return false;

  return (
    numericStat(stats.gamesPitched) > 0 ||
    numericStat(stats.outs) > 0 ||
    numericStat(stats.battersFaced) > 0 ||
    String(stats.inningsPitched ?? '').trim() !== ''
  );
}

function hasHittingAppearance(stats: any) {
  if (!stats || typeof stats !== 'object') return false;

  return (
    numericStat(stats.gamesPlayed) > 0 ||
    numericStat(stats.plateAppearances) > 0 ||
    numericStat(stats.atBats) > 0 ||
    numericStat(stats.baseOnBalls) > 0 ||
    numericStat(stats.hitByPitch) > 0 ||
    numericStat(stats.sacFlies) > 0 ||
    numericStat(stats.sacBunts) > 0
  );
}

function buildPitcherRecentGame(
  scheduledGame: NormalizedScheduledGame,
  hit: PlayerGameHit
) {
  const stat = hit.playerEntry?.stats?.pitching ?? {};

  if (!hasPitchingAppearance(stat)) return null;

  return {
    date: toDisplayDate(scheduledGame.gameDate),
    opponent: hit.opponentName,
    result: numericStat(stat?.gamesStarted) > 0 ? '先發' : '登板',
    detail1: `${stat?.inningsPitched ?? '—'}局 / ${numericStat(stat?.earnedRuns)}ER / ${numericStat(stat?.strikeOuts)}K / ${numericStat(stat?.baseOnBalls)}BB`,
    detail2: `H ${numericStat(stat?.hits)} / 用球 ${stat?.numberOfPitches ?? stat?.pitchesThrown ?? '—'}`,
  };
}

function buildHitterRecentGame(
  scheduledGame: NormalizedScheduledGame,
  hit: PlayerGameHit
) {
  const stat = hit.playerEntry?.stats?.batting ?? {};

  if (!hasHittingAppearance(stat)) return null;

  return {
    date: toDisplayDate(scheduledGame.gameDate),
    opponent: hit.opponentName,
    result: '出賽',
    detail1: `${numericStat(stat?.atBats)}AB / ${numericStat(stat?.hits)}H / ${numericStat(stat?.rbi)}RBI`,
    detail2: `HR ${numericStat(stat?.homeRuns)} / BB ${numericStat(stat?.baseOnBalls)} / SO ${numericStat(stat?.strikeOuts)}`,
  };
}

function inferTypeFromGameEntry(player: AbroadPlayerLike, hit: PlayerGameHit) {
  const pitching = hit.playerEntry?.stats?.pitching;
  const batting = hit.playerEntry?.stats?.batting;

  if (player.type) return player.type;
  if (hasPitchingAppearance(pitching)) return 'pitcher';
  if (hasHittingAppearance(batting)) return 'hitter';

  const positionType = normalizeText(hit.playerEntry?.position?.type);
  if (positionType === 'pitcher') return 'pitcher';

  return 'hitter';
}

async function buildFallbackRecentGamesForPlayer(
  player: AbroadPlayerLike,
  requestedDate: string,
  daysBack: number,
  maxGames: number
) {
  const registry = abroadRegistry[player.id];
  if (!registry || registry.provider !== 'mlb') return [];

  const personId = registry.personId ?? player.officialPersonId;
  const orgId = player.teamMeta?.id;

  if (!personId || !orgId) return [];

  const season = Number.parseInt(requestedDate.slice(0, 4), 10);
  const recentOrgGames = await getRecentGamesForOrg(orgId, season, requestedDate, daysBack);

  const results: Array<Record<string, any>> = [];

  for (const scheduledGame of recentOrgGames) {
    if (results.length >= maxGames) break;

    const boxscore = await fetchBoxscore(scheduledGame.gamePk);
    if (!boxscore) continue;

    const hit = extractPlayerGameHit(boxscore, scheduledGame, personId);
    if (!hit) continue;

    const inferredType = inferTypeFromGameEntry(player, hit);
    const entry =
      inferredType === 'pitcher'
        ? buildPitcherRecentGame(scheduledGame, hit)
        : buildHitterRecentGame(scheduledGame, hit);

    if (entry) {
      results.push(entry);
    }
  }

  return results;
}

export async function buildMlbAbroadFallbackPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const daysBack = typeof options.daysBack === 'number' ? options.daysBack : 45;
  const maxGames = typeof options.maxGames === 'number' ? options.maxGames : 5;

  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedMiLbPlayer(player)) continue;
    if (hasRecentGames(player)) continue;

    const recentGames = await buildFallbackRecentGamesForPlayer(
      player,
      requestedDate,
      daysBack,
      maxGames
    );

    if (recentGames.length > 0) {
  patches[player.id] = {
    recentGames,
    recentNote: 'MiLB 補充來源',
  };
} else {
  patches[player.id] = {
    recentNote: '近 45 日尚無可用官方出賽紀錄',
  };
}
  }

  return patches;
}

export async function applyMlbAbroadFallbackPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPlayerLike[]> {
  const patches = await buildMlbAbroadFallbackPatches(players, options);

  return players.map((player) => {
    const patch = patches[player.id];
    if (!patch) return player;

    return {
      ...player,
      ...patch,
      recentGames: patch.recentGames ?? player.recentGames,
    };
  });
}