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
    const games = payload.games ?? [];

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
