import { getAbroadRegistry, type AbroadRegistryEntry } from '../../data/abroadRegistry';

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

const REQUEST_TIMEOUT_MS = 15000;
const KBO_MAX_DAYS_BACK = 7;
const htmlCache = new Map<string, string | null>();

const KBO_PLAYER_ALIASES: Record<
  string,
  {
    aliases: string[];
    type?: 'pitcher' | 'hitter';
  }
> = {
  'yen-cheng-wang': {
    aliases: ['王彥程', 'Yen-Cheng Wang', 'Wang Yen-Cheng'],
    type: 'pitcher',
  },
};

const MANUAL_KBO_PLAYER_PATCHES: Record<string, Partial<AbroadPlayerLike>> = {
  'yen-cheng-wang': {
    recentGames: [
      {
        date: '近期出賽',
        opponent: 'Samsung Lions',
        result: '登板',
        detail1: '投球局數 5 / 三振 2 / 保送 3',
        detail2: '被安打 5 / 自責分 1 / 被打擊率 0.238',
      },
    ],
    recentNote: 'KBO 官方逐場紀錄尚未完整解析，先保留近期投球內容作為追蹤摘要。',
  },
};

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function addDays(dateString: string, days: number) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  parsed.setDate(parsed.getDate() + days);
  return parsed.toISOString().slice(0, 10);
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

async function fetchText(url: string): Promise<string | null> {
  if (htmlCache.has(url)) return htmlCache.get(url) ?? null;

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

function isTrackedKboPlayer(player: AbroadPlayerLike) {
  const registry = getAbroadRegistry(player.id);
  if (registry?.provider === 'kbo') return true;
  return normalizeText(player.league) === 'kbo';
}


function buildFallbackNews(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): AbroadNewsItem[] {
  const items: AbroadNewsItem[] = [
    {
      id: `${player.id}-kbo-sync`,
      title: `${player.name} 官方資料同步`,
      date: requestedDate,
      tag: '官網同步',
      summary: `已同步 ${registry.officialTeam} 官方頁與相關入口。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
      source: 'KBO / Team Site',
    },
  ];

  if (registry.officialPlayerUrl) {
    items.push({
      id: `${player.id}-kbo-player`,
      title: `${player.name} 球員官網`,
      date: requestedDate,
      tag: '官方頁',
      summary: `開啟 ${registry.officialTeam} 官方球員頁。`,
      url: registry.officialPlayerUrl,
      source: 'KBO / Team Site',
    });
  }

  if (registry.officialNewsUrl) {
    items.push({
      id: `${player.id}-kbo-news`,
      title: `${player.name} 相關新聞`,
      date: requestedDate,
      tag: '新聞追蹤',
      summary: `已建立 ${player.name} 的官方 / 球隊新聞入口。`,
      url: registry.officialNewsUrl,
      source: 'KBO / Team Site',
    });
  } else if (registry.officialSearchUrl) {
    items.push({
      id: `${player.id}-kbo-search`,
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

function getAliasesForPlayer(player: AbroadPlayerLike) {
  const configured = KBO_PLAYER_ALIASES[player.id]?.aliases ?? [];
  const dynamic = [player.enName, player.name].filter((v): v is string => !!v && !!v.trim());
  return Array.from(new Set([...configured, ...dynamic].map((v) => v.trim()).filter(Boolean)));
}

function getConfiguredType(player: AbroadPlayerLike) {
  return KBO_PLAYER_ALIASES[player.id]?.type ?? player.type ?? 'pitcher';
}

function candidateUrlsFromRegistry(registry: AbroadRegistryEntry) {
  return Array.from(
    new Set(
      [
        registry.officialPlayerUrl,
        registry.officialNewsUrl,
        registry.officialRosterUrl,
        registry.officialOrgUrl,
        registry.officialSearchUrl,
      ].filter((v): v is string => !!v && !!v.trim())
    )
  );
}

function resolveUrl(baseUrl: string, value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function extractKboPhotoUrl(html: string, pageUrl: string) {
  const metaPatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
  ];

  for (const pattern of metaPatterns) {
    const match = html.match(pattern);
    const resolved = resolveUrl(pageUrl, match?.[1]);
    if (resolved) return resolved;
  }

  const imageMatches = Array.from(html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi));
  const candidates = imageMatches
    .map((match) => resolveUrl(pageUrl, match[1]))
    .filter((value): value is string => !!value)
    .filter((url) => !/ico_|icon|logo|common|lang|flag|banner|btn|sns/i.test(url))
    .filter((url) => /player|profile|photo|upload|person|member/i.test(url));

  return candidates[0];
}

async function fetchKboOfficialPhotoUrl(registry: AbroadRegistryEntry) {
  const urls = [registry.officialPlayerUrl, registry.officialRosterUrl].filter(
    (value): value is string => !!value && !!value.trim()
  );

  for (const url of urls) {
    const html = await fetchText(url);
    if (!html) continue;

    const photoUrl = extractKboPhotoUrl(html, url);
    if (photoUrl) return photoUrl;
  }

  return undefined;
}

function parseDateFromLine(line: string, requestedDate: string) {
  const normalized = line.replace(/\s+/g, ' ');

  const ymd = normalized.match(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = String(Number(ymd[2])).padStart(2, '0');
    const dd = String(Number(ymd[3])).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const md = normalized.match(/\b(\d{1,2})[./-](\d{1,2})\b/);
  if (md) {
    const yyyy = requestedDate.slice(0, 4);
    const mm = String(Number(md[1])).padStart(2, '0');
    const dd = String(Number(md[2])).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function parseOpponentFromLine(line: string) {
  const match = line.match(/vs\.?\s*([A-Za-z\u3131-\u318E\uAC00-\uD7A3 ]+)/i);
  if (match) return compactWhitespace(match[1]);

  const versusMatch = line.match(/([A-Za-z\u3131-\u318E\uAC00-\uD7A3 ]+)\s+vs\.?\s+([A-Za-z\u3131-\u318E\uAC00-\uD7A3 ]+)/i);
  if (versusMatch) {
    return `${compactWhitespace(versusMatch[1])} vs ${compactWhitespace(versusMatch[2])}`;
  }

  return '—';
}

function dedupeRecentGames(items: Array<Record<string, any>>) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.date}|${item.opponent}|${item.detail1}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function buildRecentGamesFromOfficialSources(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  daysBack: number,
  maxGames: number
) {
  const aliases = getAliasesForPlayer(player);
  const configuredType = getConfiguredType(player);
  const urls = candidateUrlsFromRegistry(registry);

  if (aliases.length === 0 || urls.length === 0) return [];

  const startDate = addDays(requestedDate, -daysBack);
  const results: Array<Record<string, any>> = [];

  for (const url of urls) {
    const html = await fetchText(url);
    if (!html) continue;

    const text = stripHtml(html);
    const lines = text
      .split('\n')
      .map((line) => compactWhitespace(line))
      .filter(Boolean);

    for (const line of lines) {
      const lower = line.toLowerCase();
      const matched = aliases.some((alias) => lower.includes(alias.toLowerCase()));
      if (!matched) continue;

      const parsedDate = parseDateFromLine(line, requestedDate);
      if (!parsedDate) continue;
      if (parsedDate < startDate || parsedDate > requestedDate) continue;

      const opponent = parseOpponentFromLine(line);

      results.push({
        date: parsedDate,
        opponent,
        result: configuredType === 'pitcher' ? '登板' : '出賽',
        detail1: line,
        detail2: 'KBO 官方頁 / 新聞頁',
      });

      if (results.length >= maxGames) break;
    }

    if (results.length >= maxGames) break;
  }

  return dedupeRecentGames(results)
    .sort((a, b) => Date.parse(b.date ?? '') - Date.parse(a.date ?? ''))
    .slice(0, maxGames)
    .map((item) => ({
      ...item,
      date: item.date ? item.date : '—',
    }));
}

function inferRecentNote(recentGames: Array<Record<string, any>>, fallbackNote?: string) {
  if (recentGames.length > 0) {
    return 'KBO 官方頁補充近 5 場比賽資料';
  }
  return fallbackNote ?? '近 7 日尚無可用官方逐場紀錄';
}

function buildBasePatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): AbroadPatch {
  return {
    team: player.team ?? registry.officialTeam,
    league: 'KBO',
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    officialPhotoUrl: player.officialPhotoUrl,
    news: buildFallbackNews(player, registry, requestedDate),
    teamMeta: {
      ...(player.teamMeta ?? {}),
      code: registry.officialTeamCode ?? player.teamMeta?.code,
      abbreviation: registry.officialTeamCode ?? player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName: player.teamMeta?.displayName ?? player.team ?? registry.officialTeam,
      leagueGroup: 'KBO',
    },
  };
}

async function buildSingleKboPatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  daysBack: number,
  maxGames: number
): Promise<AbroadPatch> {
  const basePatch = buildBasePatch(player, registry, requestedDate);
  const manualPatch = MANUAL_KBO_PLAYER_PATCHES[player.id] ?? {};

  const fetchedRecentGames = await buildRecentGamesFromOfficialSources(
    player,
    registry,
    requestedDate,
    daysBack,
    maxGames
  );
  const recentGames =
    fetchedRecentGames.length > 0
      ? fetchedRecentGames
      : player.recentGames && player.recentGames.length > 0
        ? player.recentGames
        : manualPatch.recentGames ?? [];

  const officialPhotoUrl = player.officialPhotoUrl ?? (await fetchKboOfficialPhotoUrl(registry));

  return {
    ...basePatch,
    recentGames: recentGames.length > 0 ? recentGames : player.recentGames,
    recentNote: inferRecentNote(recentGames, manualPatch.recentNote ?? player.recentNote),
    officialPhotoUrl,
    news: buildFallbackNews(player, registry, requestedDate),
  };
}

export async function buildKboAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const rawDaysBack = typeof options.daysBack === 'number' ? options.daysBack : 3;
  const daysBack = Math.min(Math.max(rawDaysBack, 1), KBO_MAX_DAYS_BACK);
  const maxGames = typeof options.maxGames === 'number' ? options.maxGames : 5;

  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedKboPlayer(player)) continue;

    const registry = getAbroadRegistry(player.id);
    if (!registry || registry.provider !== 'kbo') continue;

    patches[player.id] = await buildSingleKboPatch(
      player,
      registry,
      requestedDate,
      daysBack,
      maxGames
    );
  }

  return patches;
}

export async function applyKboAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPlayerLike[]> {
  const patches = await buildKboAbroadPatches(players, options);

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
