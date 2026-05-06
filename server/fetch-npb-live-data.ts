import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchNpbScoreboardByDate } from './providers/npbOfficial';

type NpbPayload = Awaited<ReturnType<typeof fetchNpbScoreboardByDate>>;
type NpbGame = NpbPayload extends { games: infer Games }
  ? Games extends Array<infer Game>
    ? Game
    : never
  : never;

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

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function resolveNpbEventsDate() {
  return (
    process.env.NPB_EVENTS_DATE ||
    process.argv[2] ||
    formatDateInTimeZone(new Date(), 'Asia/Tokyo')
  );
}

function resolveNpbEventsDateRange() {
  const singleDate = resolveNpbEventsDate();
  const startDate = process.env.NPB_EVENTS_START_DATE || process.argv[2] || singleDate;
  const endDate = process.env.NPB_EVENTS_END_DATE || process.argv[3] || startDate;

  return { startDate, endDate };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const NPB_KNOWN_SCHEDULE_OVERRIDES: Record<string, Array<[string, string, string, string, string]>> = {
  '2026-05-04': [
    ['Yomiuri', 'Yakult', '讀賣巨人', '養樂多燕子', '17:00'],
    ['DeNA', 'Hiroshima', '橫濱DeNA灣星', '廣島東洋鯉魚', '14:00'],
    ['Chunichi', 'Hanshin', '中日龍', '阪神虎', '13:30'],
    ['Rakuten', 'Nippon-Ham', '東北樂天金鷲', '北海道日本火腿鬥士', '17:00'],
    ['Seibu', 'SoftBank', '埼玉西武獅', '福岡軟銀鷹', '17:00'],
    ['ORIX', 'Lotte', '歐力士猛牛', '千葉羅德海洋', '17:00'],
  ],
  '2026-05-05': [
    ['Yomiuri', 'Yakult', '讀賣巨人', '養樂多燕子', '13:00'],
    ['DeNA', 'Hiroshima', '橫濱DeNA灣星', '廣島東洋鯉魚', '13:00'],
    ['Chunichi', 'Hanshin', '中日龍', '阪神虎', '13:00'],
    ['Rakuten', 'Nippon-Ham', '東北樂天金鷲', '北海道日本火腿鬥士', '13:00'],
    ['Seibu', 'SoftBank', '埼玉西武獅', '福岡軟銀鷹', '13:00'],
    ['ORIX', 'Lotte', '歐力士猛牛', '千葉羅德海洋', '13:00'],
  ],
};

const NPB_LOGO_KEY_MAP: Record<string, string> = {
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

function buildKnownNpbScheduleFallback(date: string): NpbGame[] {
  const schedule = NPB_KNOWN_SCHEDULE_OVERRIDES[date];
  if (!schedule) return [];

  return schedule.map(([awayKey, homeKey, awayName, homeName, time], index) => {
    const awayTeam = {
      name: awayName,
      short: awayKey.slice(0, 4).toUpperCase(),
      record: '',
      logoKey: NPB_LOGO_KEY_MAP[awayKey],
    };
    const homeTeam = {
      name: homeName,
      short: homeKey.slice(0, 4).toUpperCase(),
      record: '',
      logoKey: NPB_LOGO_KEY_MAP[homeKey],
    };

    return {
      id: `npb-${date}-known-${index + 1}`,
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
      officialUrl: `https://npb.jp/bis/eng/2026/games/gm${date.replace(/-/g, '')}.html`,
    } as NpbGame;
  });
}

async function readExistingPayload(outputPath: string) {
  try {
    const raw = await readFile(outputPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function flattenGamesByDate(gamesByDate: Record<string, NpbGame[]>) {
  return Object.keys(gamesByDate)
    .sort()
    .flatMap((date) => gamesByDate[date] ?? []);
}

async function main() {
  const { startDate, endDate } = resolveNpbEventsDateRange();
  const outputPath = path.resolve(process.cwd(), 'server/data/eventsCenter.npb.json');
  const existingPayload = await readExistingPayload(outputPath);
  const gamesByDate: Record<string, NpbGame[]> =
    existingPayload?.gamesByDate && typeof existingPayload.gamesByDate === 'object'
      ? { ...existingPayload.gamesByDate }
      : {};
  const delayMs = Number(process.env.NPB_EVENTS_FETCH_DELAY_MS ?? 120);

  for (
    let cursor = new Date(`${startDate}T00:00:00.000Z`);
    cursor <= new Date(`${endDate}T00:00:00.000Z`);
    cursor = addDays(cursor, 1)
  ) {
    const date = toDateString(cursor);
    const payload = await fetchNpbScoreboardByDate(date);
    const providerGames = payload.games ?? [];
    const games = providerGames.length > 0 ? providerGames : buildKnownNpbScheduleFallback(date);

    gamesByDate[date] = games;

    console.log(`Fetched NPB schedule date: ${date} (${games.length} games)`);

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const allGames = flattenGamesByDate(gamesByDate);
  const storedDates = Object.keys(gamesByDate).sort();
  const payloadStartDate = storedDates[0] ?? startDate;
  const payloadEndDate = storedDates[storedDates.length - 1] ?? endDate;

  const payload = {
    updatedAt: new Date().toISOString(),
    date: startDate === endDate ? startDate : undefined,
    startDate: payloadStartDate,
    endDate: payloadEndDate,
    games: allGames,
    gamesByDate,
    eventsCenter: {
      npb: allGames,
    },
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote NPB events center data to ${outputPath}`);
  console.log(`NPB updated range: ${startDate} → ${endDate}`);
  console.log(`NPB stored range: ${payloadStartDate} → ${payloadEndDate}`);
  console.log(`Games: ${allGames.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
