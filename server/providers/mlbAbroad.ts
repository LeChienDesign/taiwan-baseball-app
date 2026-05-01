import { abroadRegistry, type AbroadRegistryEntry } from '../../data/abroadRegistry';

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
};

const STATS_API_BASE = 'https://statsapi.mlb.com/api/v1';
const MLB_SPORT_IDS = '1,11,12,13,14,15,16';
const MILB_ONLY_SPORT_IDS = '11,12,13,14,15,16';

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

function yearsOld(birthDate?: string) {
  if (!birthDate) return undefined;

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function isTrackedMlbPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
  if (registry?.provider === 'mlb') return true;

  const league = normalizeText(player.league);
  return league === 'mlb' || league === 'milb';
}

function buildHeadshotUrl(personId?: number) {
  if (!personId) return undefined;
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_360,q_auto:best/v1/people/${personId}/headshot/67/current`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function dedupeNews(items: AbroadNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.title}|${item.date}|${item.url ?? ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortNews(items: AbroadNewsItem[]) {
  return [...items].sort((a, b) => {
    const priority = (tag?: string) => {
      if (tag === '官網同步') return 4;
      if (tag === '官方頁') return 3;
      if (tag === '近期異動') return 2;
      if (tag === '新聞追蹤') return 1;
      return 0;
    };

    const p = priority(b.tag) - priority(a.tag);
    if (p !== 0) return p;

    const aTime = Date.parse(a.date || '');
    const bTime = Date.parse(b.date || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function buildFallbackNews(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): AbroadNewsItem[] {
  const items: AbroadNewsItem[] = [
    {
      id: `${player.id}-mlb-sync`,
      title: `${player.name} 官方資料同步`,
      date: requestedDate,
      tag: '官網同步',
      summary: `已同步 ${registry.officialTeam} 官方球員資料、球季數據與近期追蹤欄位。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
      source: 'MLB',
    },
  ];

  if (registry.officialPlayerUrl) {
    items.push({
      id: `${player.id}-mlb-official-player`,
      title: `${player.name} 官方球員頁`,
      date: requestedDate,
      tag: '官方頁',
      summary: `開啟 ${registry.officialTeam} 官方球員頁。`,
      url: registry.officialPlayerUrl,
      source: 'MLB',
    });
  }

  if (registry.officialSearchUrl) {
    items.push({
      id: `${player.id}-mlb-search`,
      title: `${player.name} 相關新聞`,
      date: requestedDate,
      tag: '新聞追蹤',
      summary: `已建立 ${player.name} 的官方 / 新聞搜尋入口。`,
      url: registry.officialSearchUrl,
      source: 'Google News',
    });
  }

  return sortNews(dedupeNews(items));
}

function getStatsBlocks(statsResponse: any) {
  return Array.isArray(statsResponse?.stats) ? statsResponse.stats : [];
}

function hasAnySplits(statsResponse: any) {
  const groups = getStatsBlocks(statsResponse);
  return groups.some((group: any) => Array.isArray(group?.splits) && group.splits.length > 0);
}

function filterStatsResponseToPerson(statsResponse: any, personId: number) {
  const groups = getStatsBlocks(statsResponse);

  const filteredGroups = groups
    .map((group: any) => {
      const splits = Array.isArray(group?.splits)
        ? group.splits.filter((split: any) => Number(split?.player?.id) === personId)
        : [];

      return {
        ...group,
        splits,
      };
    })
    .filter((group: any) => Array.isArray(group?.splits) && group.splits.length > 0);

  return {
    ...(statsResponse ?? {}),
    stats: filteredGroups,
  };
}

async function fetchStatsFallbackFromStatsEndpoint(
  statType: 'season' | 'gameLog',
  personId: number,
  season: number
) {
  const url =
    `${STATS_API_BASE}/stats` +
    `?stats=${statType}` +
    `&group=hitting,pitching` +
    `&personIds=${personId}` +
    `&season=${season}` +
    `&sportIds=${MILB_ONLY_SPORT_IDS}` +
    `&playerPool=all`;

  const raw = await fetchJson<any>(url);
  if (!raw) return null;

  return filterStatsResponseToPerson(raw, personId);
}

function getSplitGroup(
  statsResponse: any,
  groupName: 'pitching' | 'hitting',
  statType?: 'season' | 'gameLog'
) {
  const groups = getStatsBlocks(statsResponse);

  return groups.find((group: any) => {
    const groupDisplay = normalizeText(group?.group?.displayName);
    const typeDisplay = normalizeText(group?.type?.displayName);

    const groupMatch =
      groupDisplay === groupName ||
      groupDisplay === (groupName === 'hitting' ? 'batting' : 'pitching');

    const typeMatch = statType ? typeDisplay === normalizeText(statType) : true;

    return groupMatch && typeMatch;
  });
}

function parsePitcherSeasonStats(statsResponse: any) {
  const group = getSplitGroup(statsResponse, 'pitching', 'season');
  const split = Array.isArray(group?.splits) ? group.splits[0] : undefined;
  const stat = split?.stat ?? {};

  if (!split) return undefined;

  return {
    era: String(stat?.era ?? '—'),
    whip: String(stat?.whip ?? '—'),
    ip: String(stat?.inningsPitched ?? '—'),
    so: Number(stat?.strikeOuts ?? 0),
    bb: Number(stat?.baseOnBalls ?? 0),
    wins: Number(stat?.wins ?? 0),
    saves: Number(stat?.saves ?? 0),
  };
}

function parseHitterSeasonStats(statsResponse: any) {
  const group = getSplitGroup(statsResponse, 'hitting', 'season');
  const split = Array.isArray(group?.splits) ? group.splits[0] : undefined;
  const stat = split?.stat ?? {};

  if (!split) return undefined;

  return {
    avg: String(stat?.avg ?? '—'),
    obp: String(stat?.obp ?? '—'),
    slg: String(stat?.slg ?? '—'),
    ops: String(stat?.ops ?? '—'),
    hr: Number(stat?.homeRuns ?? 0),
    rbi: Number(stat?.rbi ?? 0),
    sb: Number(stat?.stolenBases ?? 0),
    hits: Number(stat?.hits ?? 0),
  };
}

function inferPlayerType(
  player: AbroadPlayerLike,
  pitcherStats?: Record<string, any>,
  hitterStats?: Record<string, any>
) {
  if (player.type) return player.type;
  if (pitcherStats) return 'pitcher';
  if (hitterStats) return 'hitter';
  return 'pitcher';
}

function parsePitcherGameLogs(gameLogResponse: any) {
  const group = getSplitGroup(gameLogResponse, 'pitching', 'gameLog');
  const splits = Array.isArray(group?.splits) ? group.splits : [];

  return splits
    .slice()
    .sort((a: any, b: any) => Date.parse(b?.date ?? '') - Date.parse(a?.date ?? ''))
    .slice(0, 5)
    .map((split: any) => {
      const stat = split?.stat ?? {};

      return {
        date: toDisplayDate(split?.date),
        opponent: split?.opponent?.name ?? '—',
        result: Number(stat?.gamesStarted ?? 0) > 0 ? '先發' : '登板',
        detail1: `${stat?.inningsPitched ?? '—'}局 / ${stat?.earnedRuns ?? 0}ER / ${stat?.strikeOuts ?? 0}K / ${stat?.baseOnBalls ?? 0}BB`,
        detail2: `H ${stat?.hits ?? 0} / 用球 ${stat?.numberOfPitches ?? stat?.pitchesThrown ?? '—'}`,
      };
    });
}

function parseHitterGameLogs(gameLogResponse: any) {
  const group = getSplitGroup(gameLogResponse, 'hitting', 'gameLog');
  const splits = Array.isArray(group?.splits) ? group.splits : [];

  return splits
    .slice()
    .sort((a: any, b: any) => Date.parse(b?.date ?? '') - Date.parse(a?.date ?? ''))
    .slice(0, 5)
    .map((split: any) => {
      const stat = split?.stat ?? {};

      return {
        date: toDisplayDate(split?.date),
        opponent: split?.opponent?.name ?? '—',
        result: Number(stat?.gamesPlayed ?? 0) > 0 ? '出賽' : '待命',
        detail1: `${stat?.atBats ?? 0}AB / ${stat?.hits ?? 0}H / ${stat?.rbi ?? 0}RBI`,
        detail2: `HR ${stat?.homeRuns ?? 0} / BB ${stat?.baseOnBalls ?? 0} / SO ${stat?.strikeOuts ?? 0}`,
      };
    });
}

function parseTransactions(transactionsResponse: any) {
  const transactions = Array.isArray(transactionsResponse?.transactions)
    ? transactionsResponse.transactions
    : [];

  return transactions
    .slice()
    .sort(
      (a: any, b: any) =>
        Date.parse(b?.transactionDate ?? b?.date ?? '') -
        Date.parse(a?.transactionDate ?? a?.date ?? '')
    );
}

function flattenScheduleDates(scheduleResponse: any) {
  const dates = Array.isArray(scheduleResponse?.dates) ? scheduleResponse.dates : [];
  return dates.flatMap((date: any) => (Array.isArray(date?.games) ? date.games : []));
}

function deriveStatusFromData(input: {
  player: AbroadPlayerLike;
  personId?: number;
  todaySchedule?: any[];
  upcomingSchedule?: any[];
  transactions?: any[];
}) {
  const { player, personId, todaySchedule = [], upcomingSchedule = [], transactions = [] } = input;

  const latestTransactionText = transactions
    .map((tx) =>
      String(
        tx?.description ??
          tx?.typeDesc ??
          tx?.toTeam?.name ??
          tx?.fromTeam?.name ??
          ''
      ).toLowerCase()
    )
    .join(' | ');

  if (
    latestTransactionText.includes('injured list') ||
    latestTransactionText.includes('injury') ||
    latestTransactionText.includes('7-day il') ||
    latestTransactionText.includes('15-day il') ||
    latestTransactionText.includes('60-day il')
  ) {
    return '傷兵';
  }

  const todayGame = todaySchedule[0];
  if (todayGame) {
    const probableHome = todayGame?.teams?.home?.probablePitcher?.id;
    const probableAway = todayGame?.teams?.away?.probablePitcher?.id;
    if (personId && (personId === probableHome || personId === probableAway)) {
      return '預告先發';
    }

    const detailedState = String(todayGame?.status?.detailedState ?? '');
    if (detailedState.includes('Final')) return '已完賽';
    return '今日出賽';
  }

  const nextGame = upcomingSchedule[0];
  if (nextGame) {
    const probableHome = nextGame?.teams?.home?.probablePitcher?.id;
    const probableAway = nextGame?.teams?.away?.probablePitcher?.id;
    if (personId && (personId === probableHome || personId === probableAway)) {
      return '預告先發';
    }
  }

  return player.status ?? '待命';
}

function buildNextGame(games: any[], personId?: number) {
  const game = games.find(Boolean);
  if (!game) return undefined;

  const home = game?.teams?.home?.team?.name ?? '—';
  const away = game?.teams?.away?.team?.name ?? '—';
  const venue = game?.venue?.name ?? '—';
  const gameDate = String(game?.gameDate ?? '').slice(0, 10) || undefined;

  const probableHome = game?.teams?.home?.probablePitcher?.id;
  const probableAway = game?.teams?.away?.probablePitcher?.id;
  const probable =
    personId && (personId === probableHome || personId === probableAway) ? '預告先發' : undefined;

  return {
    date: gameDate,
    opponent: `${away} vs ${home}`,
    status: probable ?? game?.status?.detailedState ?? '待更新',
    venue,
  };
}

async function fetchPersonData(personId: number) {
  return fetchJson<any>(`${STATS_API_BASE}/people/${personId}`);
}

async function fetchSeasonStats(personId: number, season: number, league?: string) {
  const fromPeople = await fetchJson<any>(
    `${STATS_API_BASE}/people/${personId}/stats?stats=season&group=hitting,pitching&season=${season}`
  );

  if (hasAnySplits(fromPeople)) {
    return fromPeople;
  }

  if (league === 'MiLB') {
    const fromStatsFallback = await fetchStatsFallbackFromStatsEndpoint('season', personId, season);
    if (hasAnySplits(fromStatsFallback)) {
      return fromStatsFallback;
    }
  }

  return fromPeople;
}

async function fetchGameLogs(personId: number, season: number, league?: string) {
  const fromPeople = await fetchJson<any>(
    `${STATS_API_BASE}/people/${personId}/stats?stats=gameLog&group=hitting,pitching&season=${season}`
  );

  if (hasAnySplits(fromPeople)) {
    return fromPeople;
  }

  if (league === 'MiLB') {
    const fromStatsFallback = await fetchStatsFallbackFromStatsEndpoint('gameLog', personId, season);
    if (hasAnySplits(fromStatsFallback)) {
      return fromStatsFallback;
    }
  }

  return fromPeople;
}

async function fetchTransactions(personId: number, requestedDate: string) {
  const startDate = addDays(requestedDate, -60);
  return fetchJson<any>(
    `${STATS_API_BASE}/transactions?playerId=${personId}&startDate=${startDate}&endDate=${requestedDate}&sportId=${MLB_SPORT_IDS}`
  );
}

async function fetchSchedule(teamId: number, startDate: string, endDate: string) {
  return fetchJson<any>(
    `${STATS_API_BASE}/schedule?sportId=${MLB_SPORT_IDS}&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}&hydrate=team,probablePitcher`
  );
}

async function buildSingleMlbPatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): Promise<AbroadPatch> {
  const season = Number.parseInt(requestedDate.slice(0, 4), 10);
  const personId = registry.personId;

  if (!personId) {
    return {
      teamMeta: {
        ...(player.teamMeta ?? {}),
        code: registry.officialTeamCode ?? player.teamMeta?.code,
        abbreviation: registry.officialTeamCode ?? player.teamMeta?.abbreviation,
        logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
        displayName: registry.officialTeam,
        leagueGroup: registry.league === 'MLB' ? 'MLB' : 'MiLB',
      },
      officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
      news: buildFallbackNews(player, registry, requestedDate),
    };
  }

  const [personResponse, seasonStatsResponse, gameLogResponse, transactionsResponse] =
    await Promise.all([
      fetchPersonData(personId),
      fetchSeasonStats(personId, season, registry.league),
      fetchGameLogs(personId, season, registry.league),
      fetchTransactions(personId, requestedDate),
    ]);

  const person = Array.isArray(personResponse?.people) ? personResponse.people[0] : undefined;
  const currentTeamId = person?.currentTeam?.id as number | undefined;

  let todaySchedule: any[] = [];
  let upcomingSchedule: any[] = [];

  if (currentTeamId) {
    const [todayResponse, upcomingResponse] = await Promise.all([
      fetchSchedule(currentTeamId, requestedDate, requestedDate),
      fetchSchedule(currentTeamId, requestedDate, addDays(requestedDate, 7)),
    ]);

    todaySchedule = flattenScheduleDates(todayResponse);
    upcomingSchedule = flattenScheduleDates(upcomingResponse);
  }

  const transactions = parseTransactions(transactionsResponse);

  const pitcherSeason = parsePitcherSeasonStats(seasonStatsResponse);
  const hitterSeason = parseHitterSeasonStats(seasonStatsResponse);
  const inferredType = inferPlayerType(player, pitcherSeason, hitterSeason);

  const recentPitchingGames = parsePitcherGameLogs(gameLogResponse);
  const recentHittingGames = parseHitterGameLogs(gameLogResponse);

  const recentGames =
    inferredType === 'hitter'
      ? recentHittingGames.length
        ? recentHittingGames
        : player.recentGames ?? []
      : recentPitchingGames.length
      ? recentPitchingGames
      : player.recentGames ?? [];

  const allUpcomingGames = [...todaySchedule, ...upcomingSchedule].filter(Boolean);
  const nextGame = buildNextGame(allUpcomingGames, personId);

  const status = deriveStatusFromData({
    player,
    personId,
    todaySchedule,
    upcomingSchedule,
    transactions,
  });

  const news = buildFallbackNews(player, registry, requestedDate);

  const officialPosition =
    person?.primaryPosition?.abbreviation ??
    person?.primaryPosition?.name ??
    player.position;

  return {
    team: person?.currentTeam?.name ?? registry.officialTeam ?? player.team,
    league: registry.league,
    position: officialPosition,
    bats: person?.batSide?.code ?? player.bats,
    throws: person?.pitchHand?.code ?? player.throws,
    age: yearsOld(person?.birthDate) ?? player.age,
    number: person?.primaryNumber ?? player.number,
    status,
    nextGame,
    seasonStats: {
      ...(player.seasonStats ?? {}),
      ...(pitcherSeason ? { pitcher: pitcherSeason } : {}),
      ...(hitterSeason ? { hitter: hitterSeason } : {}),
    },
    recentGames,
    news,
    teamMeta: {
      ...(player.teamMeta ?? {}),
      id: person?.currentTeam?.id ?? player.teamMeta?.id,
      code: registry.officialTeamCode ?? person?.currentTeam?.abbreviation ?? player.teamMeta?.code,
      abbreviation:
        registry.officialTeamCode ??
        person?.currentTeam?.abbreviation ??
        player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName:
        registry.officialTeam ??
        person?.currentTeam?.name ??
        player.teamMeta?.displayName,
      leagueGroup: registry.league === 'MLB' ? 'MLB' : 'MiLB',
    },
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    officialPhotoUrl: buildHeadshotUrl(personId) ?? player.officialPhotoUrl,
    officialPersonId: personId,
    type: inferredType,
  };
}

export async function buildMlbOfficialAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedMlbPlayer(player)) continue;

    const registry = abroadRegistry[player.id];
    if (!registry || registry.provider !== 'mlb') continue;

    patches[player.id] = await buildSingleMlbPatch(player, registry, requestedDate);
  }

  return patches;
}

export async function applyMlbOfficialAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPlayerLike[]> {
  const patches = await buildMlbOfficialAbroadPatches(players, options);

  return players.map((player) => {
    const patch = patches[player.id];
    if (!patch) return player;

    return {
      ...player,
      ...patch,
      teamMeta: {
        ...(player.teamMeta ?? {}),
        ...(patch.teamMeta ?? {}),
      },
      nextGame: patch.nextGame ?? player.nextGame,
      seasonStats: patch.seasonStats ?? player.seasonStats,
      recentGames: patch.recentGames ?? player.recentGames,
      news: patch.news ?? player.news,
    };
  });
}