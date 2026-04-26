import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchMlbScoreboardByDate } from './providers/mlbOfficial';

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});