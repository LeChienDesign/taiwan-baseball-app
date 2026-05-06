import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchMlbScoreboardByDate } from './providers/mlbOfficial';

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

function resolveMlbEventsDate() {
  return (
    process.env.MLB_EVENTS_DATE ||
    process.argv[2] ||
    formatDateInTimeZone(new Date(), 'America/New_York')
  );
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
    const raw = await fs.readFile(outputPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function flattenGamesByDate(
  gamesByDate: Record<string, Awaited<ReturnType<typeof fetchMlbScoreboardByDate>>>
) {
  return Object.keys(gamesByDate)
    .sort()
    .flatMap((date) => gamesByDate[date] ?? []);
}

function resolveMlbEventsDateRange() {
  const singleDate = resolveMlbEventsDate();
  const startDate = process.env.MLB_EVENTS_START_DATE || process.argv[2] || singleDate;
  const endDate = process.env.MLB_EVENTS_END_DATE || process.argv[3] || startDate;

  return { startDate, endDate };
}

async function main() {
  const { startDate, endDate } = resolveMlbEventsDateRange();
  const outputPath =
    process.env.EVENTS_CENTER_OUTPUT_JSON_PATH ??
    path.resolve('server/data/eventsCenter.mlb.json');

  const existingPayload = await readExistingPayload(outputPath);
  const gamesByDate: Record<string, Awaited<ReturnType<typeof fetchMlbScoreboardByDate>>> =
    existingPayload?.gamesByDate && typeof existingPayload.gamesByDate === 'object'
      ? { ...existingPayload.gamesByDate }
      : {};
  const delayMs = Number(process.env.MLB_EVENTS_FETCH_DELAY_MS ?? 120);

  for (
    let cursor = new Date(`${startDate}T00:00:00.000Z`);
    cursor <= new Date(`${endDate}T00:00:00.000Z`);
    cursor = addDays(cursor, 1)
  ) {
    const date = toDateString(cursor);
    const mlb = await fetchMlbScoreboardByDate(date);

    gamesByDate[date] = mlb;

    console.log(`Fetched MLB schedule date: ${date} (${mlb.length} games)`);

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
      mlb: allGames,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote MLB events center data to ${outputPath}`);
  console.log(`MLB updated range: ${startDate} → ${endDate}`);
  console.log(`MLB stored range: ${payloadStartDate} → ${payloadEndDate}`);
  console.log(`Games: ${allGames.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
