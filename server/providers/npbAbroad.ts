import { abroadRegistry, type AbroadRegistryEntry } from '../../data/abroadRegistry';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

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
  contextText?: string;
};

type OfficialSupplement = {
  recentGames: Array<Record<string, any>>;
  news: AbroadNewsItem[];
  recentNote?: string;
};

const NPB_BASE = 'https://npb.jp';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_LINKS_PER_PLAYER = 30;
const FALLBACK_LINKS_PER_PLAYER = 12;

const DEBUG_ABROAD_TIMING = process.env.DEBUG_ABROAD_TIMING === '1';
const DEBUG_PLAYER_ID = process.env.DEBUG_PLAYER_ID?.trim();

const NPB_PLAYER_ALIASES: Record<
  string,
  {
    aliases: string[];
    type?: 'pitcher' | 'hitter';
  }
> = {
    'ruei-yang-gu-lin': {
      aliases: ['Ruei-Yang Gu Lin', 'Gu Lin', '古林睿煬', '古林 睿煬', 'ぐーりん・るぇやん'],
      type: 'pitcher',
    },
    'yi-lei-sun': {
      aliases: ['Yi-Lei Sun', '孫易磊', '孫 易磊', 'すん・いーれい'],
      type: 'pitcher',
    },
    'chun-wei-chang': {
      aliases: ['Chun-Wei Chang', '張峻瑋'],
      type: 'pitcher',
    },
    'an-ko-lin': {
      aliases: ['An-Ko Lin', '林安可', 'りん・あんこー'],
      type: 'hitter',
    },
    'jo-hsi-hsu': {
      aliases: ['Jo-Hsi Hsu', '徐若熙', 'しゅー・るおしー'],
      type: 'pitcher',
    },
    'chia-hao-sung': {
      aliases: ['Chia-Hao Sung', 'Sung Chia-Hao', '宋家豪', '宋　家豪'],
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

function debugLog(...args: any[]) {
  if (DEBUG_ABROAD_TIMING) {
    console.log('[npb-debug]', ...args);
  }
}

function debugPlayerLog(playerId: string, ...args: any[]) {
  if (!DEBUG_ABROAD_TIMING) return;
  if (DEBUG_PLAYER_ID && DEBUG_PLAYER_ID !== playerId) return;
  console.log(`[npb-debug:${playerId}]`, ...args);
}

async function timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  debugLog(`${label} start`);
  try {
    const result = await fn();
    const elapsed = Date.now() - startedAt;
    debugLog(`${label} done in ${elapsed}ms`);
    return result;
  } catch (error) {
    const elapsed = Date.now() - startedAt;
    debugLog(`${label} failed in ${elapsed}ms`);
    throw error;
  }
}
function normalizeLooseText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .trim();
}
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

function isTrackedNpbPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
  if (registry?.provider === 'npb') return true;
  return normalizeText(player.league) === 'npb';
}

function hasRecentGames(player: AbroadPlayerLike) {
  return Array.isArray(player.recentGames) && player.recentGames.length > 0;
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

  return sortNewsItems(dedupeNewsItems(items));
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

  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_${monthToken}.html`);
  urls.add(`${NPB_BASE}/bis/eng/${season}/calendar/index_${prevToken}.html`);

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

    const start = Math.max(0, (match.index ?? 0) - 320);
    const end = Math.min(html.length, regex.lastIndex + 320);
    const contextHtml = html.slice(start, end);
    const contextText = compactWhitespace(stripHtml(contextHtml));

    results.push({
      url: `${NPB_BASE}${relative}`,
      date,
      isFarm,
      contextText,
    });
  }

  const deduped = new Map<string, NpbGameLink>();
  for (const item of results) {
    deduped.set(item.url, item);
  }

  return Array.from(deduped.values());
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

function tokenizeTeamName(value?: string) {
  const normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return [];

  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function getTeamKeywords(player: AbroadPlayerLike, registry: AbroadRegistryEntry) {
  const rawNames = [player.team, registry.officialTeam].filter((v): v is string => !!v && !!v.trim());
  const keywords = new Set<string>();

  for (const name of rawNames) {
    for (const token of tokenizeTeamName(name)) {
      keywords.add(token);
    }
  }

  const joined = rawNames.join(' | ').toLowerCase();

  if (joined.includes('fighters')) {
    ['fighters', 'nippon-ham', 'hokkaido', '日本ハム'].forEach((k) => keywords.add(k));
  }
  if (joined.includes('hawks')) {
    ['hawks', 'softbank', 'fukuoka', 'ソフトバンク'].forEach((k) => keywords.add(k));
  }
  if (joined.includes('lions')) {
    ['lions', 'seibu', 'saitama', '西武'].forEach((k) => keywords.add(k));
  }
  if (joined.includes('eagles')) {
    ['eagles', 'rakuten', 'tohoku', '楽天'].forEach((k) => keywords.add(k));
  }
  if (joined.includes('swallows')) {
    ['swallows', 'yakult', 'tokyo', 'ヤクルト'].forEach((k) => keywords.add(k));
  }

  return Array.from(keywords).filter(Boolean);
}

function filterLinksByTeamKeywords(
  playerId: string,
  links: NpbGameLink[],
  teamKeywords: string[]
) {
  if (teamKeywords.length === 0) {
    debugPlayerLog(playerId, 'team keywords empty, filtered links = 0');
    return [];
  }

  const filtered = links.filter((item) => {
    const hay = `${item.contextText ?? ''} ${item.url}`.toLowerCase();
    return teamKeywords.some((keyword) => hay.includes(keyword.toLowerCase()));
  });

  debugPlayerLog(
    playerId,
    'team keywords =',
    teamKeywords,
    `filtered links = ${filtered.length}/${links.length}`
  );

  return filtered;
}

function getAliasesForPlayer(player: AbroadPlayerLike) {
  const configured = NPB_PLAYER_ALIASES[player.id]?.aliases ?? [];
  const dynamic = [player.enName, player.name].filter((v): v is string => !!v && !!v.trim());

  return Array.from(new Set([...configured, ...dynamic].map((v) => v.trim()).filter(Boolean)));
}

function getConfiguredType(player: AbroadPlayerLike) {
  return NPB_PLAYER_ALIASES[player.id]?.type ?? player.type ?? 'pitcher';
}

function dedupeNewsItems(items: AbroadNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.title}|${item.date}|${item.url ?? ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortNewsItems(items: AbroadNewsItem[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.date || '');
    const bTime = Date.parse(b.date || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function isRakutenPlayer(player: AbroadPlayerLike, registry: AbroadRegistryEntry) {
  const joined = `${player.team ?? ''} ${registry.officialTeam ?? ''}`.toLowerCase();

  return (
    joined.includes('rakuten') ||
    joined.includes('eagles') ||
    joined.includes('tohoku') ||
    joined.includes('楽天')
  );
}

function absoluteUrl(baseUrl: string, href?: string) {
  if (!href) return undefined;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.origin}${href}`;
  }
  return new URL(href, baseUrl).toString();
}

function extractDateFromText(text: string, fallbackDate: string) {
  const normalized = compactWhitespace(text);

  const ymdSlash = normalized.match(/\b(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/);
  if (ymdSlash) {
    const yyyy = ymdSlash[1];
    const mm = String(Number(ymdSlash[2])).padStart(2, '0');
    const dd = String(Number(ymdSlash[3])).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const jp = normalized.match(/\b(20\d{2})年(\d{1,2})月(\d{1,2})日/);
  if (jp) {
    const yyyy = jp[1];
    const mm = String(Number(jp[2])).padStart(2, '0');
    const dd = String(Number(jp[3])).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return fallbackDate;
}

function extractRakutenArticleCandidates(
  html: string,
  baseUrl: string,
  aliases: string[],
  fallbackDate: string,
  playerId: string
) {
  const results: Array<{
    title: string;
    url?: string;
    date: string;
    summary: string;
  }> = [];

  const anchorRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;

  while ((match = anchorRegex.exec(html))) {
    const href = match[1];
    const anchorHtml = match[2];
    const title = compactWhitespace(stripHtml(anchorHtml));
    if (!title || title.length < 6) continue;

    const start = Math.max(0, (match.index ?? 0) - 500);
    const end = Math.min(html.length, (match.index ?? 0) + 1200);
    const contextHtml = html.slice(start, end);
    const contextText = compactWhitespace(stripHtml(contextHtml));
      const normalizedContext = normalizeLooseText(contextText);
      const aliasHit = aliases.some((alias) =>
        normalizedContext.includes(normalizeLooseText(alias))
      );
    if (!aliasHit) continue;

    const date = extractDateFromText(contextText, fallbackDate);
    const url = absoluteUrl(baseUrl, href);

    results.push({
      title,
      url,
      date,
      summary: contextText.slice(0, 160),
    });
  }

  debugPlayerLog(playerId, `rakuten article candidates = ${results.length}`);
  return results;
}

async function buildRakutenOfficialSupplement(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  maxGames: number
): Promise<OfficialSupplement> {
  const aliases = getAliasesForPlayer(player);
  const sources = [registry.officialPlayerUrl, registry.officialNewsUrl].filter(
    (v): v is string => !!v
  );

  if (sources.length === 0) {
    return { recentGames: [], news: [] };
  }

  debugPlayerLog(player.id, 'rakuten supplement sources =', sources);

  const htmlResults = await Promise.all(
    sources.map((url) => timeAsync(`player:${player.id}:rakuten:${url}`, () => fetchText(url)))
  );
    if (DEBUG_PLAYER_ID === 'chia-hao-sung') {
        const { writeFile } = await import('node:fs/promises');
        const path = await import('node:path');

        await writeFile(
          path.resolve(process.cwd(), 'server/data/rakuten-player-page.html'),
          htmlResults[0] ?? '',
          'utf8'
        );

        await writeFile(
          path.resolve(process.cwd(), 'server/data/rakuten-home-page.html'),
          htmlResults[1] ?? '',
          'utf8'
        );
      }
  const candidates: Array<{
    title: string;
    url?: string;
    date: string;
    summary: string;
  }> = [];

  htmlResults.forEach((html, index) => {
    if (!html) return;
    candidates.push(
      ...extractRakutenArticleCandidates(
        html,
        sources[index],
        aliases,
        requestedDate,
        player.id
      )
    );
  });

  const deduped = new Map<string, { title: string; url?: string; date: string; summary: string }>();
  for (const item of candidates) {
    const key = `${item.title}|${item.date}|${item.url ?? ''}`.toLowerCase();
    deduped.set(key, item);
  }

  const sorted = Array.from(deduped.values()).sort((a, b) => {
    const aTime = Date.parse(a.date || '');
    const bTime = Date.parse(b.date || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });

  const top = sorted.slice(0, maxGames);

  const news: AbroadNewsItem[] = top.map((item, index) => ({
    id: `${player.id}-rakuten-official-${index}`,
    title: item.title,
    date: item.date,
    tag: '官網追蹤',
    summary: item.summary,
    url: item.url,
    source: 'Rakuten Eagles',
  }));

  const recentGames = top.map((item) => ({
    date: item.date,
    opponent: 'Rakuten 官方頁',
    result: '官網更新',
    detail1: item.title,
    detail2: 'Rakuten 官方頁補充來源',
  }));

  return {
    recentGames,
    news,
    recentNote: top.length > 0 ? 'Rakuten 官方頁補充來源' : undefined,
  };
}

function isFightersPlayer(player: AbroadPlayerLike, registry: AbroadRegistryEntry) {
  const joined = `${player.team ?? ''} ${registry.officialTeam ?? ''}`.toLowerCase();

  return (
    joined.includes('fighters') ||
    joined.includes('nippon-ham') ||
    joined.includes('hokkaido') ||
    joined.includes('日本ハム') ||
    joined.includes('ファイターズ')
  );
}
function extractFightersGameRows(html: string, requestedDate: string, maxGames: number) {
  const year = requestedDate.slice(0, 4);
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);

  function cleanCell(value: string) {
    return decodeHtml(
      value
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, '')
        .trim()
    );
  }

  return rows
    .map((row) => {
      const cells = [...row[1].matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map((m) =>
        cleanCell(m[1])
      );

      if (cells.length < 15) return null;

      const dateText = cells[0].match(/(\d{2})\/(\d{2})/);
      if (!dateText) return null;

      const date = `${year}-${dateText[1]}-${dateText[2]}`;
      const appearance = cells[3] || '登板';
      const ip = cells[5] || '—';
      const era = cells[6] || '—';
      const er = cells[7] || '0';
      const r = cells[8] || '0';
      const so = cells[9] || '0';
      const bb = cells[10] || '0';
      const h = cells[13] || '0';

      return {
        date,
        opponent: 'Fighters 官方逐場',
        result: cells[2] || '官網紀錄',
        detail1: `${appearance} / IP ${ip} / SO ${so} / BB ${bb}`,
        detail2: `H ${h} / R ${r} / ER ${er} / ERA ${era}`,
      };
    })
    .filter((item): item is Record<string, any> => !!item)
    .slice(0, maxGames);
}
async function buildFightersOfficialSupplement(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  maxGames: number
): Promise<OfficialSupplement> {
  const sourceUrl = registry.officialPlayerUrl ?? registry.officialNewsUrl;

  if (!sourceUrl) {
    return { recentGames: [], news: [] };
  }

    const playerPageHtml = await fetchText(sourceUrl);

    const detailUrlMatch = playerPageHtml.match(
      /https:\/\/www\.fighters\.co\.jp\/team\/player\/detail\/\d+_\d+\.html/
    );

    const detailUrl = detailUrlMatch?.[0] ?? sourceUrl;
    const html = await fetchText(detailUrl);

  const configMatch = html.match(/var result_by_game = (\{[\s\S]*?\});/);
  if (!configMatch) {
    return { recentGames: [], news: [] };
  }

  let config: any;
  try {
    config = JSON.parse(configMatch[1]);
  } catch {
    return { recentGames: [], news: [] };
  }

  const body = new URLSearchParams({
    action: 'player_result_by_game',
    bis_code: config.bis_code,
    year: config.archive_year ?? requestedDate.slice(0, 4),
    lang: config.lang ?? 'jp',
    nonce: config.nonce,
    is_pitcher: config.is_pitcher ?? '1',
  });

  const res = await fetch(config.ajax_url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
    },
    body,
  });

  const gameHtml = await res.text();

    const gameLogDateBase = `${config.archive_year ?? requestedDate.slice(0, 4)}-01-01`;
    const recentGames = extractFightersGameRows(gameHtml, gameLogDateBase, maxGames);
  const news: AbroadNewsItem[] = [
    {
      id: `${player.id}-fighters-official`,
      title: `${player.name ?? player.id} Fighters 官方頁`,
      date: requestedDate,
      tag: '官方頁',
      summary: `已同步 ${registry.officialTeam ?? 'Fighters'} 官方球員頁。`,
      url: detailUrl,
      source: 'Fighters Official',
    },
  ];

  return {
    recentGames,
    news,
    recentNote: recentGames.length > 0 ? 'Fighters 官方逐場紀錄' : undefined,
  };
}
function buildJapaneseGameUrl(url: string) {
  return url.replace('/bis/eng/', '/bis/');
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
  const normalizedHay = normalizeLooseText(text);

  for (const alias of aliases) {
    const needle = normalizeLooseText(alias);
    if (!needle) continue;
    if (normalizedHay.includes(needle)) return alias;
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

async function findEntryFromGamePage(
  player: AbroadPlayerLike,
  item: NpbGameLink,
  aliases: string[],
  configuredType: 'pitcher' | 'hitter'
) {
  const html = await timeAsync(`player:${player.id}:fetchGamePage`, () => fetchText(item.url));
  if (!html) {
    debugPlayerLog(player.id, 'skip: no english html');
    return null;
  }

  const meta = extractGameMeta(html, item.date);
  let activeMeta = meta;
  let matchedAlias = findMatchingAlias(activeMeta.text, aliases);

  if (!matchedAlias) {
    const jpUrl = buildJapaneseGameUrl(item.url);

    if (jpUrl !== item.url) {
      debugPlayerLog(player.id, 'english page miss, trying jp page =', jpUrl);

      const jpHtml = await timeAsync(`player:${player.id}:fetchGamePageJp`, () => fetchText(jpUrl));
      if (jpHtml) {
        const jpMeta = extractGameMeta(jpHtml, item.date);
        const jpAlias = findMatchingAlias(jpMeta.text, aliases);

        if (jpAlias) {
          activeMeta = jpMeta;
          matchedAlias = jpAlias;
          debugPlayerLog(player.id, `matched alias on jp page = ${matchedAlias}`);
        }
      }
    }
  }

  if (!matchedAlias) {
    debugPlayerLog(player.id, 'skip: alias not found in game page');
    return null;
  }

  const hitLines = collectContextLines(activeMeta.text, aliases);
  const targetLine =
    hitLines.find((line) => line.toLowerCase().includes(matchedAlias!.toLowerCase())) ??
    hitLines[0];

  if (!targetLine) {
    debugPlayerLog(player.id, 'skip: no target line');
    return null;
  }

  debugPlayerLog(player.id, 'target line =', targetLine);

  return configuredType === 'pitcher'
    ? buildPitcherRecentGame(activeMeta, targetLine)
    : buildHitterRecentGame(activeMeta, targetLine);
}

async function buildRecentGamesFromOfficialScores(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string,
  daysBack: number,
  maxGames: number
) {
  const aliases = getAliasesForPlayer(player);
  const configuredType = getConfiguredType(player);

  if (aliases.length === 0) {
    debugPlayerLog(player.id, 'no aliases configured');
    return [];
  }

  debugPlayerLog(player.id, 'aliases =', aliases, 'type =', configuredType);

  const allLinks = await timeAsync(`player:${player.id}:calendarLinks`, () =>
    fetchRecentGameLinks(requestedDate, daysBack)
  );

  debugPlayerLog(player.id, `calendar links found = ${allLinks.length}`);

  const teamKeywords = getTeamKeywords(player, registry);
  const filteredLinks = filterLinksByTeamKeywords(player.id, allLinks, teamKeywords);
  const prioritizedFilteredLinks =
    filteredLinks.length > 0
      ? [
          ...filteredLinks.filter((item) => item.isFarm),
          ...filteredLinks.filter((item) => !item.isFarm),
        ]
      : [];

  const fallbackLinks = allLinks.slice(0, FALLBACK_LINKS_PER_PLAYER);
  const linksToScan =
    prioritizedFilteredLinks.length > 0
      ? prioritizedFilteredLinks.slice(0, MAX_LINKS_PER_PLAYER)
      : fallbackLinks;

  debugPlayerLog(
    player.id,
    `links to scan after limit = ${linksToScan.length}/${
      prioritizedFilteredLinks.length || fallbackLinks.length
    }`
  );

  if (prioritizedFilteredLinks.length === 0) {
    debugPlayerLog(
      player.id,
      `team filter miss, fallback to latest ${fallbackLinks.length} links only`
    );
  }

  const results: Array<Record<string, any>> = [];

  for (const item of linksToScan) {
    if (results.length >= maxGames) break;

    debugPlayerLog(
      player.id,
      `checking game: date=${item.date} farm=${item.isFarm} url=${item.url}`
    );

    const entry = await findEntryFromGamePage(player, item, aliases, configuredType);
    if (entry) {
      results.push(entry);
    }
  }

  debugPlayerLog(player.id, `recent games built = ${results.length}`);
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

  debugPlayerLog(player.id, 'buildSingleNpbPatch start', {
    team: player.team,
    recentGames: player.recentGames?.length ?? 0,
    officialPlayerUrl: registry.officialPlayerUrl,
    officialNewsUrl: registry.officialNewsUrl,
  });

  let recentGames = hasRecentGames(player)
    ? player.recentGames ?? []
    : await buildRecentGamesFromOfficialScores(player, registry, requestedDate, daysBack, maxGames);

  let officialSupplement: OfficialSupplement | null = null;

    if (recentGames.length === 0) {
      if (isRakutenPlayer(player, registry)) {
        debugPlayerLog(player.id, 'score pages miss, trying Rakuten official supplement');
        officialSupplement = await buildRakutenOfficialSupplement(
          player,
          registry,
          requestedDate,
          maxGames
        );
      } else if (isFightersPlayer(player, registry)) {
        debugPlayerLog(player.id, 'score pages miss, trying Fighters official supplement');
        officialSupplement = await buildFightersOfficialSupplement(
          player,
          registry,
          requestedDate
        );
      }

      if (officialSupplement?.recentGames.length) {
        const existingRecentGames = recentGames.length > 0 ? recentGames : player.recentGames ?? [];

        recentGames =
          existingRecentGames.length >= officialSupplement.recentGames.length
            ? existingRecentGames
            : officialSupplement.recentGames;
      }
    }

    debugPlayerLog(player.id, 'final recentGames count =', recentGames.length);

  const news = sortNewsItems(
    dedupeNewsItems([
      ...(officialSupplement?.news ?? []),
      ...buildFallbackNews(player, registry, requestedDate),
    ])
  );

  return {
    ...basePatch,
    recentGames: recentGames.length > 0 ? recentGames : player.recentGames,
    recentNote: officialSupplement?.recentNote ?? inferRecentNote(recentGames),
    news,
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
    if (DEBUG_PLAYER_ID && player.id !== DEBUG_PLAYER_ID) continue;

    const registry = abroadRegistry[player.id];
    if (!registry || registry.provider !== 'npb') continue;

    patches[player.id] = await timeAsync(`player:${player.id}`, () =>
      buildSingleNpbPatch(player, registry, requestedDate, daysBack, maxGames)
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
