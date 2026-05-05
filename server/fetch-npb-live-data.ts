import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchNpbScoreboardByDate } from './providers/npbOfficial';

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

async function main() {
  const date = resolveNpbEventsDate();
  const outputPath = path.resolve(process.cwd(), 'server/data/eventsCenter.npb.json');
  const payload = await fetchNpbScoreboardByDate(date);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote NPB events center data to ${outputPath}`);
  console.log(`NPB schedule date: ${date}`);
  console.log(`Games: ${payload.games.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
