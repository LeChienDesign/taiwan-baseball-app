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

async function main() {
  const date = resolveMlbEventsDate();
  const outputPath =
    process.env.EVENTS_CENTER_OUTPUT_JSON_PATH ??
    path.resolve('server/data/eventsCenter.mlb.json');

  const mlb = await fetchMlbScoreboardByDate(date);

  const payload = {
    updatedAt: new Date().toISOString(),
    date,
    games: mlb,
    eventsCenter: {
      mlb,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote MLB events center data to ${outputPath}`);
  console.log(`MLB schedule date: ${date}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
