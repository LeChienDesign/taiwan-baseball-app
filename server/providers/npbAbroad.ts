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

const EXTRA_NPB_NEWS_QUERIES: Record<string, string[]> = {
  'jo-hsi-hsu': [
    '徐若熙 軟銀',
    '徐若熙 福岡軟銀鷹',
    'Jo-Hsi Hsu SoftBank Hawks',
  ],
  'chia-hao-sung': [
    '宋家豪 樂天金鷲',
    '宋家豪 東北樂天',
    'Chia-Hao Sung Rakuten Eagles',
  ],
  'chia-cheng-lin': [
    '林家正 日本火腿',
    '林家正 北海道日本火腿鬥士',
    'Chia-Cheng Lin Nippon-Ham Fighters',
  ],
  'hsiang-sheng-hsu': [
    '徐翔聖 養樂多',
    '徐翔聖 東京養樂多燕子',
    'Hsiang-Sheng Hsu Yakult Swallows',
  ],
  'ruei-yang-gu-lin': [
    '古林睿煬 日本火腿',
    '古林睿煬 北海道日本火腿鬥士',
    'Ruei-Yang Gu Lin Nippon-Ham Fighters',
  ],
  'yi-lei-sun': [
    '孫易磊 日本火腿',
    '孫易磊 北海道日本火腿鬥士',
    'Yi-Lei Sun Nippon-Ham Fighters',
  ],
  'chun-wei-chang': [
    '張峻瑋 軟銀',
    '張峻瑋 福岡軟銀鷹',
    'Chun-Wei Chang SoftBank Hawks',
  ],
  'an-ko-lin': [
    '林安可 西武',
    '林安可 埼玉西武獅',
    'An-Ko Lin Seibu Lions',
  ],
};

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function htmlDecode(value?: string) {
  if (!value) return '';

  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .trim();
}

function stripHtml(value?: string) {
  return htmlDecode(value).replace(/<[^>]+>/g, '').trim();
}

async function fetchText(url?: string) {
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xml,text/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function googleNewsRssUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
}

function classifyNewsTag(title?: string, summary?: string) {
  const text = `${title ?? ''} ${summary ?? ''}`.toLowerCase();

  if (
    text.includes('支配下') ||
    text.includes('登錄') ||
    text.includes('登录') ||
    text.includes('升格') ||
    text.includes('升上一軍') ||
    text.includes('一軍') ||
    text.includes('二軍') ||
    text.includes('育成') ||
    text.includes('先發') ||
    text.includes('先发') ||
    text.includes('登板') ||
    text.includes('輪值') ||
    text.includes('轮值') ||
    text.includes('傷兵') ||
    text.includes('伤兵') ||
    text.includes('復出') ||
    text.includes('复出') ||
    text.includes('下放') ||
    text.includes('升降') ||
    text.includes('加盟') ||
    text.includes('簽約') ||
    text.includes('签约')
  ) {
    return '近期異動';
  }

  return '相關新聞';
}

function parseGoogleNewsRss(xml: string, playerId: string): AbroadNewsItem[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 5);

  return items.map((match, index) => {
    const block = match[1] ?? '';

    const title = stripHtml(block.match(/<title>([\s\S]*?)<\/title>/i)?.[1]) || '未命名新聞';
    const link = htmlDecode(block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]);
    const pubDateRaw = htmlDecode(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]);
    const source = stripHtml(block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]) || 'Google News';
    const description = stripHtml(block.match(/<description>([\s\S]*?)<\/description>/i)?.[1]);

    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : null;
    const date =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    return {
      id: `${playerId}-npb-news-${index + 1}`,
      title,
      date,
      tag: classifyNewsTag(title, description),
      summary: description || `${title}（${source}）`,
      url: link || undefined,
      source,
    };
  });
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

function newsPriority(item: AbroadNewsItem) {
  if (item.tag === '官網同步') return 5;
  if (item.tag === '官方頁') return 4;
  if (item.tag === '近期異動') return 3;
  if (item.tag === '相關新聞') return 2;
  return 1;
}

function sortNews(items: AbroadNewsItem[]) {
  return [...items].sort((a, b) => {
    const p = newsPriority(b) - newsPriority(a);
    if (p !== 0) return p;

    const aTime = Date.parse(a.date || '');
    const bTime = Date.parse(b.date || '');
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
}

function isTrackedNpbPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
  if (registry?.provider === 'npb') return true;

  return normalizeText(player.league) === 'npb';
}

function buildOfficialNewsEntries(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): AbroadNewsItem[] {
  const entries: AbroadNewsItem[] = [];

  if (registry.officialPlayerUrl || registry.officialRosterUrl) {
    entries.push({
      id: `${player.id}-npb-official-player-page`,
      title: `${player.name} 官方球員頁`,
      date: requestedDate,
      tag: '官方頁',
      summary: `優先開啟 ${registry.officialTeam} 官方球員頁。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl,
      source: '球團官網',
    });
  }

  entries.push({
    id: `${player.id}-npb-sync`,
    title: `${player.name} 日職資料同步`,
    date: requestedDate,
    tag: '官網同步',
    summary: `已同步 ${registry.officialTeam} 官方資料入口與球員資訊欄位。`,
    url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
    source: 'NPB',
  });

  if (registry.officialOrgUrl) {
    entries.push({
      id: `${player.id}-npb-team-page`,
      title: `${player.name} 所屬球隊官網`,
      date: requestedDate,
      tag: '官方頁',
      summary: `開啟 ${registry.officialTeam} 球隊官網。`,
      url: registry.officialOrgUrl,
      source: '球團官網',
    });
  }

  return entries;
}

function buildSearchQueries(player: AbroadPlayerLike, registry: AbroadRegistryEntry) {
  const queries = new Set<string>();

  if (registry.officialSearchQuery) {
    queries.add(registry.officialSearchQuery);
  }

  if (registry.newsKeywords?.length) {
    queries.add(registry.newsKeywords.join(' '));
  }

  queries.add(`${player.name} ${registry.officialTeam}`);
  queries.add(`${player.name} 日職`);
  if (player.enName) {
    queries.add(`${player.enName} ${registry.officialTeam}`);
  }

  for (const q of EXTRA_NPB_NEWS_QUERIES[player.id] ?? []) {
    queries.add(q);
  }

  return Array.from(queries).filter(Boolean).slice(0, 4);
}

async function fetchGoogleNewsItems(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry
) {
  const queries = buildSearchQueries(player, registry);
  const collected: AbroadNewsItem[] = [];

  for (const query of queries) {
    const rss = await fetchText(googleNewsRssUrl(query));
    if (!rss) continue;

    collected.push(...parseGoogleNewsRss(rss, player.id));
  }

  return dedupeNews(collected).slice(0, 10);
}

function deriveStatus(player: AbroadPlayerLike) {
  const level = normalizeText(player.level);

  if (level.includes('育成')) return player.status ?? '待命';
  if (level.includes('支配下')) return player.status ?? '待命';
  if (level.includes('一軍')) return player.status ?? '待命';
  if (level.includes('二軍')) return player.status ?? '待命';
  return player.status ?? '待命';
}

function extractMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`,
      'i'
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return htmlDecode(match[1]);
  }

  return undefined;
}

async function fetchOfficialPhotoFromPage(registry: AbroadRegistryEntry) {
  const pageUrl = registry.officialPlayerUrl ?? registry.officialRosterUrl;
  const html = await fetchText(pageUrl);
  if (!html) return undefined;

  return (
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'twitter:image') ||
    extractMetaContent(html, 'og:image:url')
  );
}

async function buildSingleNpbPatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): Promise<AbroadPatch> {
  const [officialPhotoUrl, googleNewsItems] = await Promise.all([
    fetchOfficialPhotoFromPage(registry),
    fetchGoogleNewsItems(player, registry),
  ]);

  const fallbackNews = buildOfficialNewsEntries(player, registry, requestedDate);

  const news = sortNews(
    dedupeNews([
      ...fallbackNews,
      ...googleNewsItems,
      ...(player.news ?? []),
    ])
  );

  return {
    team: registry.officialTeam ?? player.team,
    league: 'NPB',
    status: deriveStatus(player),
    teamMeta: {
      ...(player.teamMeta ?? {}),
      code: registry.officialTeamCode ?? player.teamMeta?.code,
      abbreviation: registry.officialTeamCode ?? player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName: registry.officialTeam ?? player.teamMeta?.displayName,
      leagueGroup: 'NPB',
    },
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    officialPhotoUrl: officialPhotoUrl ?? player.officialPhotoUrl,
    news,
  };
}

export async function buildNpbAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedNpbPlayer(player)) continue;

    const registry = abroadRegistry[player.id];
    if (!registry || registry.provider !== 'npb') continue;

    patches[player.id] = await buildSingleNpbPatch(player, registry, requestedDate);
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
      nextGame: patch.nextGame ?? player.nextGame,
      seasonStats: patch.seasonStats ?? player.seasonStats,
      recentGames: patch.recentGames ?? player.recentGames,
      news: patch.news ?? player.news,
    };
  });
}