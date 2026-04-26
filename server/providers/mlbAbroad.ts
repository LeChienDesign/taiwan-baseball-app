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
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

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
      title: `${player.name} MLB 官方資料同步`,
      date: requestedDate,
      tag: '官網同步',
      summary: `已同步 ${registry.officialTeam} 官方球員資料、球季數據與近期比賽紀錄。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
      source: 'MLB',
    },
  ];

  if (registry.officialNewsUrl) {
    items.push({
      id: `${player.id}-mlb-official-news`,
      title: `${player.name} 官方頁面`,
      date: requestedDate,
      tag: '官網頁',
      summary: `開啟 ${registry.officialTeam} 官方頁面或球員頁。`,
      url: registry.officialNewsUrl,
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

function getSplitGroup(statsResponse: any, groupName: 'pitching' | 'hitting') {
  const groups = Array.isArray(statsResponse?.stats) ? statsResponse.stats : [];
  return groups.find(
    (group: any) =>
      normalizeText(group?.group?.displayName) === groupName ||
      normalizeText(group?.group?.displayName) ===
        (groupName === 'hitting' ? 'batting' : 'pitching') ||
      normalizeText(group?.group?.displayName) ===
        (groupName === 'hitting' ? 'hitting' : 'pitching')
  );
}

function parsePitcherSeasonStats(statsResponse: any) {
  const group = getSplitGroup(statsResponse, 'pitching');
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
  const group = getSplitGroup(statsResponse, 'hitting');
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

function parsePitcherGameLogs(gameLogResponse: any) {
  const group = getSplitGroup(gameLogResponse, 'pitching');
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
        result: stat?.gamesStarted ? '先發' : '登板',
        detail1: `${stat?.inningsPitched ?? '—'}局 / ${stat?.earnedRuns ?? 0}ER / ${stat?.strikeOuts ?? 0}K / ${stat?.baseOnBalls ?? 0}BB`,
        detail2: `H ${stat?.hits ?? 0} / 用球 ${stat?.pitchesThrown ?? '—'}`,
      };
    });
}

function parseHitterGameLogs(gameLogResponse: any) {
  const group = getSplitGroup(gameLogResponse, 'hitting');
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
        result: split?.isHome ? '主場' : '客場',
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
    if (detailedState.includes('Final')) {
      return '已完賽';
    }

    return '今日出賽';
  }

  const nextGame = upcomingSchedule.find((game) => {
    const gameDate = String(game?.gameDate ?? '').slice(0, 10);
    return !!gameDate;
  });

  if (nextGame) {
    const probableHome = nextGame?.teams?.home?.probablePitcher?.id;
    const probableAway = nextGame?.teams?.away?.probablePitcher?.id;
    if (personId && (personId === probableHome || personId === probableAway)) {
      return '預告先發';
    }
  }

  return player.status ?? '待命';
}

function buildNextGame(todaySchedule: any[], upcomingSchedule: any[], personId?: number) {
  const allGames = [...todaySchedule, ...upcomingSchedule];
  const game = allGames.find(Boolean);
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

async function fetchSeasonStats(personId: number, season: number) {
  return fetchJson<any>(
    `${STATS_API_BASE}/people/${personId}/stats?stats=season&group=hitting,pitching&season=${season}`
  );
}

async function fetchGameLogs(personId: number, season: number) {
  return fetchJson<any>(
    `${STATS_API_BASE}/people/${personId}/stats?stats=gameLog&group=hitting,pitching&season=${season}`
  );
}

async function fetchTransactions(personId: number, requestedDate: string) {
  const startDate = addDays(requestedDate, -60);
  return fetchJson<any>(
    `${STATS_API_BASE}/transactions?playerId=${personId}&startDate=${startDate}&endDate=${requestedDate}&sportId=1`
  );
}

async function fetchSchedule(teamId: number, startDate: string, endDate: string) {
  return fetchJson<any>(
    `${STATS_API_BASE}/schedule?sportId=1&teamId=${teamId}&startDate=${startDate}&endDate=${endDate}`
  );
}

function flattenScheduleDates(scheduleResponse: any) {
  const dates = Array.isArray(scheduleResponse?.dates) ? scheduleResponse.dates : [];
  return dates.flatMap((date: any) => (Array.isArray(date?.games) ? date.games : []));
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
      fetchSeasonStats(personId, season),
      fetchGameLogs(personId, season),
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
  const recentPitchingGames = parsePitcherGameLogs(gameLogResponse);
  const recentHittingGames = parseHitterGameLogs(gameLogResponse);

  const recentGames =
    player.type === 'hitter'
      ? recentHittingGames.length
        ? recentHittingGames
        : player.recentGames ?? []
      : recentPitchingGames.length
      ? recentPitchingGames
      : player.recentGames ?? [];

  const nextGame = buildNextGame(todaySchedule, upcomingSchedule, personId);
  const status = deriveStatusFromData({
    player,
    personId,
    todaySchedule,
    upcomingSchedule,
    transactions,
  });

  const news = buildFallbackNews(player, registry, requestedDate);

  return {
    team: person?.currentTeam?.name ?? player.team,
    position:
      person?.primaryPosition?.abbreviation ??
      player.position,
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
      code: registry.officialTeamCode ?? person?.currentTeam?.abbreviation ?? player.teamMeta?.code,
      abbreviation:
        registry.officialTeamCode ?? person?.currentTeam?.abbreviation ?? player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName: registry.officialTeam ?? person?.currentTeam?.name ?? player.teamMeta?.displayName,
      leagueGroup: registry.league === 'MLB' ? 'MLB' : 'MiLB',
    },
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    officialPhotoUrl: buildHeadshotUrl(personId) ?? player.officialPhotoUrl,
    officialPersonId: personId,
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