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
      id: `${playerId}-kbo-news-${index + 1}`,
      title,
      date,
      tag: '相關新聞',
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
  if (item.tag === '官網同步') return 4;
  if (item.tag === '官方頁') return 3;
  if (item.tag === '近期異動') return 2;
  if (item.tag === '相關新聞') return 1;
  return 0;
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

function isTrackedKboPlayer(player: AbroadPlayerLike) {
  const registry = abroadRegistry[player.id];
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
      title: `${player.name} 韓職資料同步`,
      date: requestedDate,
      tag: '官網同步',
      summary: `已同步 ${registry.officialTeam} 官方資料入口與球員資訊欄位。`,
      url: registry.officialPlayerUrl ?? registry.officialRosterUrl ?? registry.officialOrgUrl,
      source: 'KBO',
    },
  ];

  if (registry.officialPlayerUrl) {
    items.push({
      id: `${player.id}-kbo-official-page`,
      title: `${player.name} 官方球員頁`,
      date: requestedDate,
      tag: '官方頁',
      summary: `開啟 ${registry.officialTeam} 官方球員頁。`,
      url: registry.officialPlayerUrl,
      source: 'KBO',
    });
  }

  if (registry.officialSearchUrl) {
    items.push({
      id: `${player.id}-kbo-search`,
      title: `${player.name} 相關新聞`,
      date: requestedDate,
      tag: '相關新聞',
      summary: `已建立 ${player.name} 的新聞搜尋入口。`,
      url: registry.officialSearchUrl,
      source: 'Google News',
    });
  }

  return items;
}

function extractKboMetaValue(html: string, label: string) {
  const pattern = new RegExp(
    `${label}\\s*<\\/span>[^<]*<span[^>]*class=["'][^"']*player-info__value[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
    'i'
  );
  const match = html.match(pattern);
  return stripHtml(match?.[1]);
}

function extractOgImage(html: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return htmlDecode(match[1]);
  }

  return undefined;
}

function extractNumber(html: string) {
  const patterns = [
    /背號[^0-9]{0,10}(\d{1,3})/i,
    /No\.[^0-9]{0,10}(\d{1,3})/i,
    /player-info__number[^>]*>\s*#?\s*(\d{1,3})\s*</i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

function extractHandedness(text?: string) {
  const v = normalizeText(text);

  if (!v) return undefined;
  if (v.includes('left') || v.includes('좌') || v.includes('左')) return 'L';
  if (v.includes('right') || v.includes('우') || v.includes('右')) return 'R';
  if (v.includes('switch') || v.includes('양')) return 'S';

  return undefined;
}

function extractPosition(text?: string) {
  const v = normalizeText(text);

  if (!v) return undefined;
  if (v.includes('pitcher') || v.includes('투수') || v.includes('投手')) return 'LHP';
  if (v.includes('outfielder') || v.includes('외야') || v.includes('外野')) return 'OF';
  if (v.includes('infielder') || v.includes('내야') || v.includes('內野')) return 'IF';
  if (v.includes('catcher') || v.includes('포수') || v.includes('捕手')) return 'C';

  return undefined;
}

function deriveStatus(player: AbroadPlayerLike) {
  const level = normalizeText(player.level);

  if (level.includes('先發')) return player.status ?? '待命';
  if (level.includes('一軍')) return player.status ?? '待命';
  return player.status ?? '待命';
}

async function fetchGoogleNewsItems(registry: AbroadRegistryEntry) {
  const query =
    registry.officialSearchQuery ||
    registry.newsKeywords.join(' ') ||
    `${registry.name} ${registry.officialTeam}`;

  const rss = await fetchText(googleNewsRssUrl(query));
  if (!rss) return [];

  return parseGoogleNewsRss(rss, registry.id);
}

async function buildSingleKboPatch(
  player: AbroadPlayerLike,
  registry: AbroadRegistryEntry,
  requestedDate: string
): Promise<AbroadPatch> {
  const [playerHtml, googleNewsItems] = await Promise.all([
    fetchText(registry.officialPlayerUrl ?? registry.officialRosterUrl),
    fetchGoogleNewsItems(registry),
  ]);

  let officialPhotoUrl: string | undefined;
  let number = player.number;
  let bats = player.bats;
  let throws = player.throws;
  let position = player.position;

  if (playerHtml) {
    officialPhotoUrl = extractOgImage(playerHtml);

    number =
      extractNumber(playerHtml) ||
      extractKboMetaValue(playerHtml, '背號') ||
      extractKboMetaValue(playerHtml, 'No.') ||
      player.number;

    const batText =
      extractKboMetaValue(playerHtml, '타석') ||
      extractKboMetaValue(playerHtml, 'Bat') ||
      extractKboMetaValue(playerHtml, '타/투');
    const throwText =
      extractKboMetaValue(playerHtml, '투구') ||
      extractKboMetaValue(playerHtml, 'Throw') ||
      extractKboMetaValue(playerHtml, '타/투');
    const positionText =
      extractKboMetaValue(playerHtml, '포지션') ||
      extractKboMetaValue(playerHtml, 'Position');

    bats = extractHandedness(batText) ?? bats;
    throws = extractHandedness(throwText) ?? throws;
    position = extractPosition(positionText) ?? position;
  }

  const news = sortNews(
    dedupeNews([
      ...buildFallbackNews(player, registry, requestedDate),
      ...googleNewsItems,
      ...(player.news ?? []),
    ])
  );

  return {
    team: registry.officialTeam ?? player.team,
    league: 'KBO',
    level: player.level ?? '一軍 / 先發輪值',
    number,
    bats,
    throws,
    position,
    status: deriveStatus(player),
    teamMeta: {
      ...(player.teamMeta ?? {}),
      code: registry.officialTeamCode ?? player.teamMeta?.code,
      abbreviation: registry.officialTeamCode ?? player.teamMeta?.abbreviation,
      logoKey: registry.teamLogoKey ?? player.teamMeta?.logoKey,
      displayName: registry.officialTeam ?? player.teamMeta?.displayName,
      leagueGroup: 'KBO',
    },
    officialPlayerUrl: registry.officialPlayerUrl ?? player.officialPlayerUrl,
    officialPhotoUrl: officialPhotoUrl ?? player.officialPhotoUrl,
    news,
  };
}

export async function buildKboAbroadPatches(
  players: AbroadPlayerLike[],
  options: ApplyOptions = {}
): Promise<AbroadPatchMap> {
  const requestedDate = toDateOnly(options.date);
  const patches: AbroadPatchMap = {};

  for (const player of players) {
    if (!isTrackedKboPlayer(player)) continue;

    const registry = abroadRegistry[player.id];
    if (!registry || registry.provider !== 'kbo') continue;

    patches[player.id] = await buildSingleKboPatch(player, registry, requestedDate);
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
      nextGame: patch.nextGame ?? player.nextGame,
      seasonStats: patch.seasonStats ?? player.seasonStats,
      recentGames: patch.recentGames ?? player.recentGames,
      news: patch.news ?? player.news,
    };
  });
}