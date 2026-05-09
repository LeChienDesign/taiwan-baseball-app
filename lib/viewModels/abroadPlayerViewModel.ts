

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
    hitter?: Record<string, any>;
    pitcher?: Record<string, any>;
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

export const ABROAD_FILTERS = ['全部', '投手', '野手', '今日出賽', '預告先發'] as const;

export type AbroadFilter = (typeof ABROAD_FILTERS)[number];

const LEAGUE_ORDER: Record<string, number> = {
  MLB: 0,
  NPB: 1,
  KBO: 2,
  MiLB: 3,
  MILB: 3,
  'Minor League': 3,
  '小聯盟': 3,
  '二軍': 4,
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

export function mergeAbroadPlayerViewModels(seed: AbroadPlayerLike[], live: AbroadPlayerLike[]) {
  const orderMap = new Map<string, number>();
  seed.forEach((player, index) => orderMap.set(player.id, index));

  const map = new Map<string, AbroadPlayerLike>();

  for (const player of seed) {
    map.set(player.id, player);
  }

  for (const player of live) {
    const prev = map.get(player.id);
    map.set(player.id, {
      ...prev,
      ...player,
      teamMeta: {
        ...(prev?.teamMeta ?? {}),
        ...(player.teamMeta ?? {}),
      },
      nextGame: player.nextGame ?? prev?.nextGame,
      seasonStats: player.seasonStats ?? prev?.seasonStats,
      recentGames: player.recentGames ?? prev?.recentGames,
      news: player.news ?? prev?.news,
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const ai = orderMap.get(a.id) ?? 9999;
    const bi = orderMap.get(b.id) ?? 9999;
    return ai - bi;
  });
}

function getLeagueSortRank(player: AbroadPlayerLike) {
  const league = player.league ?? '';
  const level = player.level ?? '';
  const normalizedLeague = league.trim();
  const normalizedLevel = level.trim();

  if (LEAGUE_ORDER[normalizedLeague] !== undefined) return LEAGUE_ORDER[normalizedLeague];

  const combined = `${normalizedLeague} ${normalizedLevel}`.toLowerCase();

  if (combined.includes('mlb')) return LEAGUE_ORDER.MLB;
  if (combined.includes('npb') || combined.includes('日職')) return LEAGUE_ORDER.NPB;
  if (combined.includes('kbo') || combined.includes('韓職')) return LEAGUE_ORDER.KBO;
  if (combined.includes('milb') || combined.includes('minor') || combined.includes('小聯盟')) return LEAGUE_ORDER.MiLB;
  if (combined.includes('二軍') || combined.includes('farm')) return LEAGUE_ORDER['二軍'];

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

    const teamDiff = getTeamGroupKey(a).localeCompare(getTeamGroupKey(b), 'zh-Hant');
    if (teamDiff !== 0) return teamDiff;

    const numberDiff = getNumberSortValue(a) - getNumberSortValue(b);
    if (numberDiff !== 0) return numberDiff;

    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'zh-Hant');
  });
}

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

export function formatAbroadLevelLine(player: AbroadPlayerLike) {
  return `${player.level ?? '—'} • ${player.position ?? '—'}`;
}

export function formatAbroadHandLine(player: AbroadPlayerLike) {
  return `${player.throws ?? '—'}投 / ${player.bats ?? '—'}打`;
}

export function getAbroadPlayerStatus(player: AbroadPlayerLike) {
  return player.status ?? '待命';
}
