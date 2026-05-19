// View model helpers for abroad-player list/detail screens.
// Keep data shaping here so UI components stay focused on rendering.

export type AbroadStatValue = string | number | null | undefined;

export type AbroadPlayerLike = {
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
  teamMeta?: {
    code?: string;
    abbreviation?: string;
    logoKey?: string;
    logoUrl?: string;
    displayName?: string;
  };
  officialPhotoUrl?: string;
  photoKey?: string;
  officialPlayerUrl?: string;
  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };
  recentGames?: Array<{
    date?: string;
    opponent?: string;
    result?: string;
    detail1?: string;
    detail2?: string;
  }>;
  seasonStats?: {
    hitter?: Record<string, AbroadStatValue>;
    pitcher?: Record<string, AbroadStatValue>;
  };
  news?: Array<{
    id?: string;
    title?: string;
    date?: string;
    tag?: string;
    summary?: string;
    url?: string;
    source?: string;
  }>;
};

// Filters / constants

export const ABROAD_FILTERS = ['全部', '投手', '野手', '今日出賽', '預告先發'] as const;

export type AbroadFilter = (typeof ABROAD_FILTERS)[number];

const RECENT_GAME_STAT_LABELS: Record<string, string> = {
  IP: '投球局數',
  SO: '三振',
  K: '三振',
  BB: '保送',
  H: '被安打',
  HR: '被全壘打',
  R: '失分',
  ER: '自責分',
  NP: '用球數',
  ERA: '防禦率',
  WHIP: '每局被上壘率',
  AB: '打數',
  RBI: '打點',
  AVG: '打擊率',
  OBP: '上壘率',
  SLG: '長打率',
  OPS: '攻擊指數',
};

// Normalization helpers

const LEAGUE_ORDER: Record<string, number> = {
  MLB: 0,
  NPB: 1,
  KBO: 2,
  MiLB: 3,
  MILB: 3,
  'Minor League': 3,
  '小聯盟': 3,
  Farm: 8,
  FARM: 8,
  '日職二軍': 8,
  '二軍': 8,
  '2軍': 8,
};

const MILB_LEVEL_ORDER: Record<string, number> = {
  AAA: 0,
  'TRIPLE-A': 0,
  TRIPLEA: 0,
  AA: 1,
  'DOUBLE-A': 1,
  DOUBLEA: 1,
  'HIGH-A': 2,
  HIGHA: 2,
  'HIGH A': 2,
  A: 3,
  'SINGLE-A': 3,
  SINGLEA: 3,
  '育成選手': 4,
  '育成': 4,
  ROOKIE: 5,
  RK: 5,
};

function normalizeSortText(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[／/]/g, '')
    .replace(/[\s\-_'.]/g, '');
}

export function normalizeAbroadPlayerId(value?: string | string[] | null) {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return '';
  return decodeURIComponent(String(v)).trim().toLowerCase();
}

// Data merging

export function mergeAbroadPlayerViewModels(seed: AbroadPlayerLike[], live: AbroadPlayerLike[]) {
  const orderMap = new Map<string, number>();
  seed.forEach((player, index) => orderMap.set(player.id, index));

  const playerMap = new Map<string, AbroadPlayerLike>();

  for (const player of seed) {
    playerMap.set(player.id, player);
  }

  for (const livePlayer of live) {
    const seedPlayer = playerMap.get(livePlayer.id);

    playerMap.set(livePlayer.id, {
      ...seedPlayer,
      ...livePlayer,
      level: seedPlayer?.level ?? livePlayer.level,
      position: seedPlayer?.position ?? livePlayer.position,
      age: seedPlayer?.age ?? livePlayer.age,
      number: String(seedPlayer?.number ?? '').trim() || livePlayer.number,
      teamMeta: {
        ...(seedPlayer?.teamMeta ?? {}),
        ...(livePlayer.teamMeta ?? {}),
      },
      nextGame: livePlayer.nextGame ?? seedPlayer?.nextGame,
      seasonStats: livePlayer.seasonStats ?? seedPlayer?.seasonStats,
      recentGames: livePlayer.recentGames ?? seedPlayer?.recentGames,
      news: livePlayer.news ?? seedPlayer?.news,
    });
  }

  return Array.from(playerMap.values()).sort((a, b) => {
    const ai = orderMap.get(a.id) ?? 9999;
    const bi = orderMap.get(b.id) ?? 9999;
    return ai - bi;
  });
}

// List filtering / sorting

function getLeagueSortRank(player: AbroadPlayerLike) {
  const league = player.league ?? '';
  const level = player.level ?? '';
  const normalizedLeague = league.trim();
  const normalizedLevel = level.trim();

  const combined = `${normalizedLeague} ${normalizedLevel}`.toLowerCase();

  if (combined.includes('日職二軍') || combined.includes('二軍') || combined.includes('2軍') || combined.includes('farm')) return LEAGUE_ORDER['二軍'];
  if (combined.includes('育成選手') || combined.includes('育成')) return LEAGUE_ORDER.MiLB;

  if (LEAGUE_ORDER[normalizedLeague] !== undefined) return LEAGUE_ORDER[normalizedLeague];

  return 99;
}

function getMilbLevelSortRank(player: AbroadPlayerLike) {
  const leagueRank = getLeagueSortRank(player);
  if (leagueRank !== LEAGUE_ORDER.MiLB) return 0;

  const combined = `${player.level ?? ''} ${player.league ?? ''}`.toUpperCase();
  const chineseCombined = `${player.level ?? ''} ${player.league ?? ''}`;
  const normalized = combined.replace(/[\s_]+/g, '-');

  if (normalized.includes('TRIPLE-A') || normalized.includes('AAA')) return MILB_LEVEL_ORDER.AAA;
  if (normalized.includes('DOUBLE-A') || normalized.includes('AA')) return MILB_LEVEL_ORDER.AA;
  if (normalized.includes('HIGH-A') || normalized.includes('HIGHA')) return MILB_LEVEL_ORDER['HIGH-A'];
  if (normalized.includes('SINGLE-A') || normalized === 'A' || normalized.includes('-A-')) return MILB_LEVEL_ORDER.A;
  if (chineseCombined.includes('育成選手') || chineseCombined.includes('育成')) return MILB_LEVEL_ORDER['育成選手'];
  if (normalized.includes('ROOKIE') || normalized.includes('RK')) return MILB_LEVEL_ORDER.ROOKIE;

  return 99;
}

function getTeamGroupKey(player: AbroadPlayerLike) {
  return normalizeSortText(
    player.teamMeta?.displayName ||
      player.teamMeta?.code ||
      player.teamMeta?.abbreviation ||
      player.team ||
      ''
  );
}

function getNumberSortValue(player: AbroadPlayerLike) {
  const parsed = Number.parseInt(String(player.number ?? '').replace(/[^\d]/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : 9999;
}

export function filterAndSortAbroadPlayers(
  players: AbroadPlayerLike[],
  searchText: string,
  activeFilter: AbroadFilter
) {
  const keyword = searchText.trim().toLowerCase();

  const filtered = players.filter((player) => {
    const matchesSearch =
      !keyword ||
      String(player.name ?? '').toLowerCase().includes(keyword) ||
      String(player.enName ?? '').toLowerCase().includes(keyword) ||
      String(player.team ?? '').toLowerCase().includes(keyword) ||
      String(player.level ?? '').toLowerCase().includes(keyword) ||
      String(player.teamMeta?.code ?? '').toLowerCase().includes(keyword);

    const isPitcher = player.type === 'pitcher';
    const isHitter = player.type === 'hitter';

    const matchesFilter =
      activeFilter === '全部' ||
      (activeFilter === '投手' && isPitcher) ||
      (activeFilter === '野手' && isHitter) ||
      (activeFilter === '今日出賽' && player.status === '今日出賽') ||
      (activeFilter === '預告先發' && player.status === '預告先發');

    return matchesSearch && matchesFilter;
  });

  return [...filtered].sort((a, b) => {
    const leagueDiff = getLeagueSortRank(a) - getLeagueSortRank(b);
    if (leagueDiff !== 0) return leagueDiff;

    const milbLevelDiff = getMilbLevelSortRank(a) - getMilbLevelSortRank(b);
    if (milbLevelDiff !== 0) return milbLevelDiff;

    const teamDiff = getTeamGroupKey(a).localeCompare(getTeamGroupKey(b), 'zh-Hant');
    if (teamDiff !== 0) return teamDiff;

    const numberDiff = getNumberSortValue(a) - getNumberSortValue(b);
    if (numberDiff !== 0) return numberDiff;

    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'zh-Hant');
  });
}

// Display formatting

export function formatAbroadSyncLabel(updatedAt?: string, isUsingFallback?: boolean) {
  if (isUsingFallback) return '本機資料';
  if (!updatedAt) return '已同步';

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return '已同步';

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');

  return `同步 ${mm}/${dd} ${hh}:${mi}`;
}

export function formatAbroadTeamLine(player: AbroadPlayerLike) {
  const code = player.teamMeta?.code ?? player.teamMeta?.abbreviation;
  const team = player.team ?? '未設定球隊';
  return code ? `${team} (${code})` : team;
}

function hideFortyManText(value?: string | null) {
  return String(value ?? '')
    .replace(/40\s*-?\s*man/gi, '')
    .replace(/^[\s・／/|｜,，()（）-]+|[\s・／/|｜,，()（）-]+$/g, '')
    .trim();
}

export function formatAbroadLevelLine(player: AbroadPlayerLike) {
  const level = hideFortyManText(player.level) || '—';
  const position = hideFortyManText(player.position) || '—';
  return `${level} • ${position}`;
}

export function formatAbroadHandLine(player: AbroadPlayerLike) {
  return `${player.throws ?? '—'}投 / ${player.bats ?? '—'}打`;
}

function formatRecentGameDetailToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/^([A-Za-z]+)\s+(.+)$/);
  if (!match) return trimmed;

  const key = match[1].toUpperCase();
  const value = match[2].trim();
  const label = RECENT_GAME_STAT_LABELS[key];

  return label ? `${label} ${value}` : trimmed;
}

export function formatAbroadRecentGameDetail(value?: string | null) {
  if (!value) return undefined;

  const formatted = String(value)
    .split('/')
    .map(formatRecentGameDetailToken)
    .filter(Boolean)
    .join(' / ');

  return formatted || undefined;
}

export function getAbroadPlayerStatus(player: AbroadPlayerLike) {
  return player.status ?? '待命';
}
