type TaiwanSportsNewsItem = {
  id: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
  url?: string;
  source: 'Yahoo運動' | '自由體育' | 'TSNA';
};

const SOURCES = [
  {
    source: 'Yahoo運動' as const,
    domain: 'tw.sports.yahoo.com',
  },
  {
    source: '自由體育' as const,
    domain: 'sports.ltn.com.tw',
  },
  {
    source: 'TSNA' as const,
    domain: 'tsna.com.tw',
  },
];

function decodeHtml(text: string) {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function stripHtml(text: string) {
  return decodeHtml(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toDateOnly(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function getBetween(text: string, start: string, end: string) {
  const s = text.indexOf(start);
  if (s === -1) return '';
  const e = text.indexOf(end, s + start.length);
  if (e === -1) return '';
  return text.slice(s + start.length, e);
}

function classifyNewsTag(input: {
  title?: string;
  summary?: string;
}) {
  const text = `${input.title ?? ''} ${input.summary ?? ''}`.toLowerCase();

  if (
    text.includes('先發') ||
    text.includes('輪值') ||
    text.includes('轉先發') ||
    text.includes('rotation') ||
    text.includes('starter') ||
    text.includes('角色')
  ) {
    return '角色變動';
  }

  if (
    text.includes('登板') ||
    text.includes('中繼') ||
    text.includes('後援') ||
    text.includes('失分') ||
    text.includes('三振') ||
    text.includes('救援') ||
    text.includes('勝投') ||
    text.includes('防禦率') ||
    text.includes('局無失分')
  ) {
    return '登板結果';
  }

  if (
    text.includes('預告先發') ||
    text.includes('預計先發') ||
    text.includes('先發預告')
  ) {
    return '先發預告';
  }

  if (
    text.includes('傷兵') ||
    text.includes('injury') ||
    text.includes('injured')
  ) {
    return '傷兵';
  }

  return '台媒報導';
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/rss+xml,application/xml,text/xml,text/html',
      'User-Agent': 'TaiwanBaseballHub/1.0',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText} ${url}`);
  }

  return res.text();
}

function parseRssItems(xml: string, source: TaiwanSportsNewsItem['source']) {
  const matches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  return matches
    .map((item) => {
      const title = stripHtml(getBetween(item, '<title>', '</title>'));
      const link = stripHtml(getBetween(item, '<link>', '</link>'));
      const pubDate = stripHtml(getBetween(item, '<pubDate>', '</pubDate>'));
      const description = stripHtml(getBetween(item, '<description>', '</description>'));

      if (!title || !link) return null;

      return {
        id: `tw-${source}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
        title,
        date: toDateOnly(pubDate),
        tag: classifyNewsTag({ title, summary: description }),
        summary: description || `${source} 報導同步中。`,
        url: link,
        source,
      } satisfies TaiwanSportsNewsItem;
    })
    .filter(Boolean) as TaiwanSportsNewsItem[];
}

function dedupe(items: TaiwanSportsNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.title}|${item.date}|${item.source}`.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortItems(items: TaiwanSportsNewsItem[]) {
  const priority = (tag: string) => {
    if (tag === '角色變動') return 5;
    if (tag === '先發預告') return 4;
    if (tag === '登板結果') return 3;
    if (tag === '傷兵') return 2;
    return 1;
  };

  return [...items].sort((a, b) => {
    const p = priority(b.tag) - priority(a.tag);
    if (p !== 0) return p;

    const d = Date.parse(b.date) - Date.parse(a.date);
    if (!Number.isNaN(d) && d !== 0) return d;

    return a.title.localeCompare(b.title, 'zh-Hant');
  });
}

async function fetchGoogleNewsRss(args: {
  query: string;
  domain: string;
  source: TaiwanSportsNewsItem['source'];
}) {
  const q = encodeURIComponent(`${args.query} site:${args.domain}`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  const xml = await fetchText(url);
  return parseRssItems(xml, args.source);
}

export async function fetchTaiwanSportsMediaNewsForKaiWeiTeng() {
  const query = '"鄧愷威" OR "Kai-Wei Teng" OR "鄧愷威 太空人"';

  const groups = await Promise.all(
    SOURCES.map((source) =>
      fetchGoogleNewsRss({
        query,
        domain: source.domain,
        source: source.source,
      }).catch(() => [])
    )
  );

  return sortItems(dedupe(groups.flat())).slice(0, 12);
}