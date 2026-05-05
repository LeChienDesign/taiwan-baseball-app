type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logoKey?: string;
};

type LineScoreRow = {
  team: string;
  innings: (number | string)[];
  r: number;
  h: number;
  e: number;
};

export type NpbScoreboardGame = {
  id: string;
  source: 'npb-official';
  league: 'NPB';
  date: string;
  gamePk: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  statusText?: string;
  venue: string;
  awayTeam: TeamCardInfo;
  homeTeam: TeamCardInfo;
  awayScore: number;
  homeScore: number;
  innings: number[];
  awayLine: LineScoreRow;
  homeLine: LineScoreRow;
  footerLeft: string;
  footerRight: string;
  gameDate: string;
  officialUrl?: string;
};

const NPB_BASE = 'https://npb.jp';
const REQUEST_TIMEOUT_MS = 15000;

const TEAM_SHORT_MAP: Record<string, string> = {
  Yomiuri: 'YOM',
  Yakult: 'YAK',
  DeNA: 'DB',
  Hiroshima: 'CARP',
  Chunichi: 'CHU',
  Hanshin: 'HAN',
  Rakuten: 'E',
  'Nippon-Ham': 'F',
  Seibu: 'L',
  SoftBank: 'H',
  ORIX: 'B',
  Lotte: 'M',
};

const TEAM_LOGO_KEY_MAP: Record<string, string> = {
  Yomiuri: 'yomiuri-giants',
  Yakult: 'yakult-swallows',
  DeNA: 'dena-baystars',
  Hiroshima: 'hiroshima-carp',
  Chunichi: 'chunichi-dragons',
  Hanshin: 'hanshin-tigers',
  Rakuten: 'rakuten-eagles',
  'Nippon-Ham': 'nippon-ham-fighters',
  Seibu: 'seibu-lions',
  SoftBank: 'softbank-hawks',
  ORIX: 'orix-buffaloes',
  Lotte: 'lotte-marines',
};

const JP_TEAM_NAME_MAP: Record<string, string> = {
  読売ジャイアンツ: 'Yomiuri',
  東京ヤクルトスワローズ: 'Yakult',
  横浜DeNAベイスターズ: 'DeNA',
  広島東洋カープ: 'Hiroshima',
  中日ドラゴンズ: 'Chunichi',
  阪神タイガース: 'Hanshin',
  東北楽天ゴールデンイーグルス: 'Rakuten',
  北海道日本ハムファイターズ: 'Nippon-Ham',
  埼玉西武ライオンズ: 'Seibu',
  福岡ソフトバンクホークス: 'SoftBank',
  オリックス・バファローズ: 'ORIX',
  千葉ロッテマリーンズ: 'Lotte',
};

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
      .replace(/<[^>]+>/g, ' ')
      .replace(/\r/g, '')
  );
}

function compactWhitespace(value: string) {
  return value.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
}

function cleanCell(value: string) {
  return compactWhitespace(stripHtml(value));
}

function stripFullWidthSpaces(value: string) {
  return value.replace(/　/g, ' ').trim();
}

function formatDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
}

function toDateOnly(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function safeShort(name: string) {
  return TEAM_SHORT_MAP[name] ?? name.slice(0, 4).toUpperCase();
}

function buildTeamInfo(name: string): TeamCardInfo {
  return {
    name,
    short: safeShort(name),
    record: '',
    logoKey: TEAM_LOGO_KEY_MAP[name],
  };
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0',
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

function findMatchingBrace(html: string, startIndex: number) {
  const nextScoreBox = html.indexOf('<div class="score_box">', startIndex + 1);
  if (nextScoreBox >= 0) return nextScoreBox;

  const scoreWrapEnd = html.indexOf('<div id="header_nav">', startIndex);
  return scoreWrapEnd >= 0 ? scoreWrapEnd : html.length;
}

function extractImgAltByClass(block: string, className: string) {
  const imgTags = block.match(/<img[^>]*>/gi) ?? [];

  for (const imgTag of imgTags) {
    if (!imgTag.includes(className)) continue;
    return decodeHtml(imgTag.match(/alt="([^"]+)"/i)?.[1] ?? '');
  }

  return '';
}

function extractHeaderScoreGames(html: string, date: string) {
  const games: NpbScoreboardGame[] = [];
  const seen = new Set<string>();
  const scoreBoxRegex = /<div class="score_box">/gi;
  let match: RegExpExecArray | null = null;

  while ((match = scoreBoxRegex.exec(html))) {
    const start = match.index;
    const end = findMatchingBrace(html, start);
    const block = html.slice(start, end);

    if (!block.includes('/scores/') || !block.includes('class="score"')) continue;

    const href = block.match(/href="(\/scores\/[^"]+\/)"/i)?.[1] ?? '';
    const awayAlt = extractImgAltByClass(block, 'logo_left');
    const homeAlt = extractImgAltByClass(block, 'logo_right');
    const away = JP_TEAM_NAME_MAP[awayAlt];
    const home = JP_TEAM_NAME_MAP[homeAlt];

    if (!href || !away || !home) continue;

    const key = `${away}-${home}-${href}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const scoreText = cleanCell(block.match(/<div class="score">([\s\S]*?)<\/div>/i)?.[1] ?? '');
    const stateText = cleanCell(block.match(/<div class="state">([\s\S]*?)<\/div>/i)?.[1] ?? '');
    const scoreMatch = scoreText.match(/(\d+)\s*-\s*(\d+)/);
    const awayScore = scoreMatch ? Number(scoreMatch[1]) : 0;
    const homeScore = scoreMatch ? Number(scoreMatch[2]) : 0;
    const venueMatch = stateText.match(/（([^）]+)）/);
    const inningMatch = stateText.match(/(\d+回[表裏])/);
    const isFinal = stateText.includes('終了') || stateText.includes('試合終了');
    const isLive = !!scoreMatch && !!inningMatch && !isFinal;
    const status = isFinal ? 'FINAL' : isLive ? 'LIVE' : 'SCHEDULED';
    const awayTeam = buildTeamInfo(away);
    const homeTeam = buildTeamInfo(home);
    const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    games.push({
      id: `npb-${date}-${games.length + 1}`,
      source: 'npb-official',
      league: 'NPB',
      date,
      gamePk: games.length + 1,
      status,
      statusText: status === 'LIVE' ? 'Live' : status === 'FINAL' ? 'Final' : 'Scheduled',
      venue: stripFullWidthSpaces(venueMatch?.[1] ?? '待更新'),
      awayTeam,
      homeTeam,
      awayScore,
      homeScore,
      innings,
      awayLine: {
        team: awayTeam.short,
        innings: Array.from({ length: 9 }, () => '-'),
        r: awayScore,
        h: 0,
        e: 0,
      },
      homeLine: {
        team: homeTeam.short,
        innings: Array.from({ length: 9 }, () => '-'),
        r: homeScore,
        h: 0,
        e: 0,
      },
      footerLeft: status === 'LIVE' ? 'Live' : status === 'FINAL' ? 'Final' : 'Scheduled',
      footerRight: inningMatch?.[1] ?? (stateText.replace(/（[^）]+）/g, '').trim() || '待更新'),
      gameDate: date,
      officialUrl: `${NPB_BASE}${href}`,
    });
  }

  return games.slice(0, 6);
}

function buildFallbackScheduledGames(date: string): NpbScoreboardGame[] {
  const teams: Array<[string, string, string]> = [
    ['Yomiuri', 'Yakult', '14:00'],
    ['DeNA', 'Hiroshima', '14:00'],
    ['Chunichi', 'Hanshin', '14:00'],
    ['Rakuten', 'Nippon-Ham', '14:00'],
    ['Seibu', 'SoftBank', '14:00'],
    ['ORIX', 'Lotte', '14:00'],
  ];

  return teams.map(([away, home, time], index) => {
    const awayTeam = buildTeamInfo(away);
    const homeTeam = buildTeamInfo(home);

    return {
      id: `npb-${date}-fallback-${index + 1}`,
      source: 'npb-official',
      league: 'NPB',
      date,
      gamePk: index + 1,
      status: 'SCHEDULED',
      statusText: 'Scheduled',
      venue: '待更新',
      awayTeam,
      homeTeam,
      awayScore: 0,
      homeScore: 0,
      innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      awayLine: {
        team: awayTeam.short,
        innings: Array.from({ length: 9 }, () => '-'),
        r: 0,
        h: 0,
        e: 0,
      },
      homeLine: {
        team: homeTeam.short,
        innings: Array.from({ length: 9 }, () => '-'),
        r: 0,
        h: 0,
        e: 0,
      },
      footerLeft: 'Scheduled',
      footerRight: time,
      gameDate: date,
      officialUrl: NPB_BASE,
    };
  });
}

export async function fetchNpbScoreboardByDate(date: string) {
  const requestedDate = toDateOnly(date);
  const todayTokyo = formatDateInTimeZone(new Date(), 'Asia/Tokyo');
  const html = await fetchText(NPB_BASE);

  if (html) {
    const games = extractHeaderScoreGames(html, requestedDate);

    if (games.length > 0) {
      return {
        updatedAt: new Date().toISOString(),
        date: requestedDate,
        games,
        eventsCenter: {
          npb: games,
        },
      };
    }
  }

  const fallbackGames = requestedDate === todayTokyo ? buildFallbackScheduledGames(requestedDate) : [];

  return {
    updatedAt: new Date().toISOString(),
    date: requestedDate,
    games: fallbackGames,
    eventsCenter: {
      npb: fallbackGames,
    },
  };
}
