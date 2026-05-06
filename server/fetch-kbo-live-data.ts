import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchKboScoreboardByDate } from './providers/kboOfficial';

type KboPayload = Awaited<ReturnType<typeof fetchKboScoreboardByDate>>;
type KboGame = KboPayload extends { games: infer Games }
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

function resolveKboEventsDate() {
  return (
    process.env.KBO_EVENTS_DATE ||
    process.argv[2] ||
    formatDateInTimeZone(new Date(), 'Asia/Seoul')
  );
}

function resolveKboEventsDateRange() {
  const singleDate = resolveKboEventsDate();
  const startDate = process.env.KBO_EVENTS_START_DATE || process.argv[2] || singleDate;
  const endDate = process.env.KBO_EVENTS_END_DATE || process.argv[3] || startDate;

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

async function readExistingPayload(outputPath: string) {
  try {
    const raw = await readFile(outputPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function flattenGamesByDate(gamesByDate: Record<string, KboGame[]>) {
  return Object.keys(gamesByDate)
    .sort()
    .flatMap((date) => gamesByDate[date] ?? []);
}

async function main() {
  const { startDate, endDate } = resolveKboEventsDateRange();
  const outputPath = path.resolve(process.cwd(), 'server/data/eventsCenter.kbo.json');
  const existingPayload = await readExistingPayload(outputPath);
  const gamesByDate: Record<string, KboGame[]> =
    existingPayload?.gamesByDate && typeof existingPayload.gamesByDate === 'object'
      ? { ...existingPayload.gamesByDate }
      : {};
  const delayMs = Number(process.env.KBO_EVENTS_FETCH_DELAY_MS ?? 120);

  for (
    let cursor = new Date(`${startDate}T00:00:00.000Z`);
    cursor <= new Date(`${endDate}T00:00:00.000Z`);
    cursor = addDays(cursor, 1)
  ) {
    const date = toDateString(cursor);
    const payload = await fetchKboScoreboardByDate(date);
    const games = payload.games ?? [];

    gamesByDate[date] = games;

    console.log(`Fetched KBO schedule date: ${date} (${games.length} games)`);

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
      kbo: allGames,
    },
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote KBO events center data to ${outputPath}`);
  console.log(`KBO updated range: ${startDate} → ${endDate}`);
  console.log(`KBO stored range: ${payloadStartDate} → ${payloadEndDate}`);
  console.log(`Games: ${allGames.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
