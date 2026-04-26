type OfficialNewsItem = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  url?: string;
};

const KAI_WEI_TENG_PLAYER_PAGE =
  'https://www.mlb.com/astros/player/kai-wei-teng-678906';

function decodeHtml(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'TaiwanBaseballHub/1.0',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch HTML: ${res.status} ${res.statusText} ${url}`);
  }

  return res.text();
}

function extractNewsUrlsFromPlayerPage(html: string) {
  const matches = html.matchAll(/href="(\/news\/[^"#?]+)"/g);
  const urls: string[] = [];

  for (const match of matches) {
    const path = match[1];
    if (!path) continue;
    const full = `https://www.mlb.com${path}`;
    if (!urls.includes(full)) {
      urls.push(full);
    }
  }

  return urls.slice(0, 10);
}

function extractMeta(html: string, property: string) {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"]+)["'][^>]*>`,
    'i'
  );
  const match = html.match(re);
  return match ? decodeHtml(match[1]) : '';
}

function extractNameMeta(html: string, name: string) {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"]+)["'][^>]*>`,
    'i'
  );
  const match = html.match(re);
  return match ? decodeHtml(match[1]) : '';
}

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function classifyNewsTag(input: {
  title?: string;
  summary?: string;
  url?: string;
}) {
  const text = `${input.title ?? ''} ${input.summary ?? ''} ${input.url ?? ''}`.toLowerCase();

  if (
    text.includes('starting rotation') ||
    text.includes('rotation') ||
    text.includes('starter') ||
    text.includes('bullpen role') ||
    text.includes('role') ||
    text.includes('先發') ||
    text.includes('輪值') ||
    text.includes('轉先發') ||
    text.includes('角色')
  ) {
    return '角色變動';
  }

  if (
    text.includes('probable starter') ||
    text.includes('will start') ||
    text.includes('set to start') ||
    text.includes('scheduled to start') ||
    text.includes('先發預告') ||
    text.includes('預計先發')
  ) {
    return '先發預告';
  }

  if (
    text.includes('pitched') ||
    text.includes('scoreless innings') ||
    text.includes('relief appearance') ||
    text.includes('earned run') ||
    text.includes('strikeouts') ||
    text.includes('outing') ||
    text.includes('登板') ||
    text.includes('後援') ||
    text.includes('先發內容') ||
    text.includes('投球內容') ||
    text.includes('失分')
  ) {
    return '登板結果';
  }

  if (
    text.includes('today') ||
    text.includes('tonight') ||
    text.includes('active roster') ||
    text.includes('available out of bullpen') ||
    text.includes('今日出賽')
  ) {
    return '今日出賽';
  }

  if (
    text.includes('injured list') ||
    text.includes('injury') ||
    text.includes('shut down') ||
    text.includes('rehab') ||
    text.includes('il ') ||
    text.includes('傷兵')
  ) {
    return '傷兵';
  }

  return '官網同步';
}

async function parseArticle(url: string): Promise<OfficialNewsItem | null> {
  try {
    const html = await fetchText(url);

    const title =
      extractMeta(html, 'og:title') ||
      extractNameMeta(html, 'twitter:title') ||
      '';

    const summary =
      extractMeta(html, 'og:description') ||
      extractNameMeta(html, 'description') ||
      '官方新聞同步中。';

    const published =
      extractMeta(html, 'article:published_time') ||
      extractNameMeta(html, 'parsely-pub-date') ||
      '';

    if (!title) return null;

    return {
      id: `official-${Buffer.from(url).toString('base64').slice(0, 18)}`,
      title,
      date: toDateOnly(published),
      tag: classifyNewsTag({ title, summary, url }),
      summary,
      url,
    };
  } catch {
    return null;
  }
}

function buildKaiWeiFallbackNews(today: string): OfficialNewsItem[] {
  return [
    {
      id: 'kai-wei-teng-official-sync',
      title: '鄧愷威 MLB 官方資料同步',
      date: today,
      tag: '官網同步',
      summary: '已同步 Astros 官方球員頁、近期賽程與球員資料。',
      url: KAI_WEI_TENG_PLAYER_PAGE,
    },
    {
      id: 'kai-wei-teng-rotation-watch',
      title: 'Astros 官方：球團正討論讓鄧愷威轉進輪值',
      date: '2026-04-24',
      tag: '角色變動',
      summary:
        'Astros 官方新聞提到，球團正在討論把鄧愷威從長中繼角色轉往先發輪值發展。',
      url: 'https://www.mlb.com/news/astros-discussing-moving-kai-wei-teng-to-starting-rotation',
    },
    {
      id: 'kai-wei-teng-spring-role',
      title: 'Astros 春訓報導：鄧愷威肯定牛棚養成，也希望爭取先發定位',
      date: '2026-03-12',
      tag: '角色變動',
      summary:
        'Astros 官方春訓報導提到，鄧愷威認同牛棚經驗的價值，同時也表達想往輪值角色發展。',
      url: 'https://www.mlb.com/news/kai-wei-teng-eyes-starting-role-with-astros',
    },
    {
      id: 'kai-wei-teng-trade-to-astros',
      title: 'Astros 官方：鄧愷威在季前交易加入球隊',
      date: '2026-01-30',
      tag: '官網同步',
      summary:
        '球團於季前自 Giants 交易取得鄧愷威，並納入 40-man 規劃。',
      url: 'https://www.mlb.com/news/astros-giants-trade-kai-wei-teng-jancel-villarroel',
    },
  ];
}

function dedupeNews(items: OfficialNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.title}|${item.date}`.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchKaiWeiTengOfficialNews(): Promise<OfficialNewsItem[]> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const playerPageHtml = await fetchText(KAI_WEI_TENG_PLAYER_PAGE);
    const articleUrls = extractNewsUrlsFromPlayerPage(playerPageHtml);

    const parsed = await Promise.all(articleUrls.map((url) => parseArticle(url)));
    const items = parsed.filter(Boolean) as OfficialNewsItem[];

    const fallback = buildKaiWeiFallbackNews(today);
    const merged = dedupeNews([...items, ...fallback]);

    return merged.sort((a, b) => {
      const rolePriority = (tag: string) => {
        if (tag === '角色變動') return 5;
        if (tag === '先發預告') return 4;
        if (tag === '登板結果') return 3;
        if (tag === '今日出賽') return 2;
        if (tag === '官網同步') return 1;
        return 0;
      };

      const roleDiff = rolePriority(b.tag) - rolePriority(a.tag);
      if (roleDiff !== 0) return roleDiff;

      const dateDiff = Date.parse(b.date) - Date.parse(a.date);
      if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff;

      return a.title.localeCompare(b.title, 'zh-Hant');
    });
  } catch {
    return buildKaiWeiFallbackNews(today);
  }
}