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
  daysBack?: number;
  maxGames?: number;
};

type NpbGameLink = {
  url: string;
  date: string;
  isFarm: boolean;
};

const NPB_BASE = 'https://npb.jp';
const REQUEST_TIMEOUT_MS = 15000;

const NPB_PLAYER_ALIASES: Record<
  string,
  {
    aliases: string[];
    type?: 'pitcher' | 'hitter';
  }
> = {
  'ruei-yang-gu-lin': {
    aliases: ['Ruei-Yang Gu Lin', 'Gu Lin', '古林睿煬'],
    type: 'pitcher',
  },
  'yi-lei-sun': {
    aliases: ['Yi-Lei Sun', '孫易磊'],
    type: 'pitcher',
  },
  'chun-wei-chang': {
    aliases: ['Chun-Wei Chang', '張峻瑋'],
    type: 'pitcher',
  },
  'an-ko-lin': {
    aliases: ['An-Ko Lin', '林安可'],
    type: 'hitter',
  },
  'jo-hsi-hsu': {
    aliases: ['Jo-Hsi Hsu', '徐若熙'],
    type: 'pitcher',
  },
  'chia-hao-sung': {
    aliases: ['Chia-Hao Sung', 'Sung Chia-Hao', '宋家豪'],
    type: 'pitcher',
  },
  'chia-cheng-lin': {
    aliases: ['Lyle Lin', 'Chia-Cheng Lin', '林家正', 'ライル・リン'],
    type: 'hitter',
  },
  'hsiang-sheng-hsu': {
    aliases: ['Hsiang-Sheng Hsu', '徐翔聖'],
    type: 'pitcher',
  },
};

const htmlCache = new Map<string, string | null>();
const recentGameLinksCache = new Map<string, NpbGameLink[]>();

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

function isTrackedNpbPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
  if (registry?.provider === 'npb') return true;
  return normalizeText(player.league) === 'npb';
}

function hasRecentGames(player: AbroadPlayerLike) {
  return Array.isArray(player.recentGames) && player.recentGames.length > 0;
}

async function fetchText(url: string): Promise<string | null> {
  if (htmlCache.has(url)) {
    return htmlCache.get(url) ?? null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      htmlCache.set(url, null);
      return null;
    }

    const text = await response.text();
    htmlCache.set(url, text);
    return text;
  } catch {
    htmlCache.set(url, null);
    return null;
  }
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/h\d>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
  );
}

function compactWhitespace(input: string) {
  return input.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

function buildFallbackNews(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): AbroadNewsItem[] {
  const items: AbroadNewsItem[] = [
    {
      id: `${player.id}-npb-sync`,
      title: `${player.name} 官方資料同步`,
      date: requestedDate,
      tag: '官網同步',
      summary: `已同步 ${registry.officialTeam} 官方頁與 NPB 相關入口。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
      source: 'NPB / Team Site',
    },
  ];

  if (registry.officialPlayerUrl) {
    items.push({
      id: `${player.id}-npb-player`,
      title: `${player.name} 球員官網`,
      date: requestedDate,
      tag: '官方頁',
      summary: `開啟 ${registry.officialTeam} 官方球員頁。`,
      url: registry.officialPlayerUrl,
      source: 'NPB / Team Site',
    });
  }

  if (registry.officialNewsUrl) {
    items.push({
      id: `${player.id}-npb-news`,
      title: `${player.name} 相關新聞`,
      date: requestedDate,
      tag: '新聞追蹤',
      summary: `已建立 ${player.name} 的 NPB / 官方新聞入口。`,
      url: registry.officialNewsUrl,
      source: 'NPB / Team Site',
    });
  } else if (registry.officialSearchUrl) {
    items.push({
      id: `${player.id}-npb-search`,
      title: `${player.name} 相關新聞`,
      date: requestedDate,
      tag: '新聞追蹤',
      summary: `已建立 ${player.name} 的新聞搜尋入口。`,
      url: registry.officialSearchUrl,
      source: 'Google News',
    });
  }

  return items.sort((a, b) => {
    const aTime = Date.parse(a.date || '');
    const bTime = Date.parse(b.date || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function buildCalendarUrls(requestedDate: string) {
  const parsed = new Date(requestedDate);
  const season = parsed.getFullYear();
  const month = parsed.getUTCMonth() + 1;

  const previous = new Date(parsed);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const previousMonth = previous.getUTCMonth() + 1;

  const monthToken = String(month).padStart(2, '0');
  const prevToken = String(previousMonth).padStart(2, '0');

  const urls = new Set<string>();

  // Regular season calendar
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_${monthToken}.html`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_${prevToken}.html`);

  // Farm calendar
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_farm.html`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_farm_${monthToken}.html`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_farm_${prevToken}.html`);

  return Array.from(urls);
}

function extractGameLinksFromCalendarHtml(html: string) {
  const results: NpbGameLink[] = [];
  const regex = /href="(\/bis\/eng\/(\d{4})\/games\/([a-z0-9]+?(\d{8})\d*\.html))"/gi;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(html))) {
    const relative = match[1];
    const dateRaw = match[4];
    const slug = match[3];
    const date = `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`;
    const isFarm = slug.startsWith('f');

    results.push({
      url: `${NPB_BASE}${relative}`,
      date,
      isFarm,
    });
  }

  const map = new Map<string, NpbGameLink>();
  for (const item of results) {
    map.set(item.url, item);
  }
  return Array.from(map.values());
}

async function fetchRecentGameLinks(requestedDate: string, daysBack: number) {
  const cacheKey = `${requestedDate}:${daysBack}`;
  const cached = recentGameLinksCache.get(cacheKey);
  if (cached) return cached;

  const startDate = addDays(requestedDate, -daysBack);
  const urls = buildCalendarUrls(requestedDate);

  const htmlList = await Promise.all(urls.map((url) => fetchText(url)));
  const merged = new Map<string, NpbGameLink>();

  for (const html of htmlList) {
    if (!html) continue;

    for (const item of extractGameLinksFromCalendarHtml(html)) {
      if (item.date < startDate || item.date > requestedDate) continue;
      merged.set(item.url, item);
    }
  }

  const sorted = Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    return bTime - aTime;
  });

  recentGameLinksCache.set(cacheKey, sorted);
  return sorted;
}

function getAliasesForPlayer(player: AbroadPlayerLike) {
  const configured = NPB_PLAYER_ALIASES[player.id]?.aliases ?? [];
  const dynamic = [player.enName, player.name].filter((v): v is string => !!v && !!v.trim());

  return Array.from(new Set([...configured, ...dynamic].map((v) => v.trim()).filter(Boolean)));
}

function getConfiguredType(player: AbroadPlayerLike) {
  return NPB_PLAYER_ALIASES[player.id]?.type ?? player.type ?? 'pitcher';
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return compactWhitespace(decodeHtml(titleMatch?.[1] ?? ''));
}

function extractGameMeta(html: string, fallbackDate: string) {
  const title = extractTitle(html);

  let home = '—';
  let away = '—';

  const versusMatch = title.match(/\(Scores\)\s*(.+?)\s+vs\s+(.+?)\s+\|/i);
  if (versusMatch) {
    away = versusMatch[1].trim();
    home = versusMatch[2].trim();
  }

  let date = fallbackDate;
  const stripped = stripHtml(html);
  const dateMatch = stripped.match(
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i
  );

  if (dateMatch) {
    const monthMap: Record<string, string> = {
      january: '01',
      february: '02',
      march: '03',
      april: '04',
      may: '05',
      june: '06',
      july: '07',
      august: '08',
      september: '09',
      october: '10',
      november: '11',
      december: '12',
    };
    const mm = monthMap[dateMatch[1].toLowerCase()];
    const dd = String(Number(dateMatch[2])).padStart(2, '0');
    const yyyy = dateMatch[3];
    if (mm) {
      date = `${yyyy}-${mm}-${dd}`;
    }
  }

  return {
    date,
    title,
    away,
    home,
    text: compactWhitespace(stripped),
  };
}

function findMatchingAlias(text: string, aliases: string[]) {
  const lowered = text.toLowerCase();

  for (const alias of aliases) {
    const needle = alias.toLowerCase().trim();
    if (!needle) continue;
    if (lowered.includes(needle)) return alias;
  }

  return null;
}

function collectContextLines(text: string, aliases: string[]) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const hits: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    const matched = aliases.some((alias) => alias && lower.includes(alias.toLowerCase()));
    if (matched) {
      hits.push(line);
    }
  }

  return hits;
}

function normalizeLineForDisplay(line: string) {
  return compactWhitespace(
    line
      .replace(/\s+\|\s+/g, ' | ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

function buildPitcherRecentGame(meta: ReturnType<typeof extractGameMeta>, line: string) {
  const normalized = normalizeLineForDisplay(line);

  return {
    date: meta.date,
    opponent: meta.away === '—' && meta.home === '—' ? '—' : `${meta.away} vs ${meta.home}`,
    result: '登板',
    detail1: normalized,
    detail2: 'NPB 官方比分頁',
  };
}

function buildHitterRecentGame(meta: ReturnType<typeof extractGameMeta>, line: string) {
  const normalized = normalizeLineForDisplay(line);

  return {
    date: meta.date,
    opponent: meta.away === '—' && meta.home === '—' ? '—' : `${meta.away} vs ${meta.home}`,
    result: '出賽',
    detail1: normalized,
    detail2: 'NPB 官方比分頁',
  };
}

async function buildRecentGamesFromOfficialScores(
  player: AbroadPlayerLike,
  requestedDate: string,
  daysBack: number,
  maxGames: number
) {
  const aliases = getAliasesForPlayer(player);
  const configuredType = getConfiguredType(player);

  if (aliases.length === 0) return [];

  const links = await fetchRecentGameLinks(requestedDate, daysBack);
  const results: Array<Record<string, any>> = [];

  for (const item of links) {
    if (results.length >= maxGames) break;

    const html = await fetchText(item.url);
    if (!html) continue;

    const meta = extractGameMeta(html, item.date);
    const matchedAlias = findMatchingAlias(meta.text, aliases);
    if (!matchedAlias) continue;

    const hitLines = collectContextLines(meta.text, aliases);
    const targetLine =
      hitLines.find((line) => line.toLowerCase().includes(matchedAlias.toLowerCase())) ??
      hitLines[0];

    if (!targetLine) continue;

    const entry =
      configuredType === 'pitcher'
        ? buildPitcherRecentGame(meta, targetLine)
        : buildHitterRecentGame(meta, targetLine);

    results.push(entry);
  }

  return results;
}

function inferRecentNote(recentGames: Array<Record<string, any>>) {
  if (recentGames.length > 0) {
    return 'NPB 官方比分頁補充來源';
  }
  return '近 45 日尚無可用官方比分頁逐場紀錄';
}

function buildOfficialUrlsPatch(player: AbroadPlayerLike, registry: AbroadRegistryEntry) {
  return {
    team: registry.officialTeam ?? player.team,
    league: 'NPB',
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    news: buildFallbackNews(player, registry, toDateOnly()),
    teamMeta: {
      ...(player.teamMeta ?? {}),
      code: registry.officialTeamCode ?? player.teamMeta?.code,
      abbreviation: registry.officialTeamCode ?? player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName: registry.officialTeam ?? player.teamMeta?.displayName,
      leagueGroup: 'NPB' as const,
    },
  };
}

async function buildSingleNpbPatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  daysBack: number,
  maxGames: number
): Promise<AbroadPatch> {
  const basePatch = buildOfficialUrlsPatch(player, registry);
  const recentGames = hasRecentGames(player)
    ? player.recentGames ?? []
    : await buildRecentGamesFromOfficialScores(player, requestedDate, daysBack, maxGames);

  return {
    ...basePatch,
    recentGames: recentGames.length > 0 ? recentGames : player.recentGames,
    recentNote: inferRecentNote(recentGames),
    news: buildFallbackNews(player, registry, requestedDate),
  };
}

export async function buildNpbAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const daysBack = typeof options.daysBack === 'number' ? options.daysBack : 45;
  const maxGames = typeof options.maxGames === 'number' ? options.maxGames : 5;

  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedNpbPlayer(player)) continue;

    const registry = abroadRegistry[player.id];
    if (!registry || registry.provider !== 'npb') continue;

    patches[player.id] = await buildSingleNpbPatch(
      player,
      registry,
      requestedDate,
      daysBack,
      maxGames
    );
  }

  return patches;
}

export async function applyNpbAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPlayerLike[]> {
  const patches = await buildNpbAbroadPatches(players, options);

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
      recentGames: patch.recentGames ?? player.recentGames,
      news: patch.news ?? player.news,
    };
  });
}