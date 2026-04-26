import fs from 'node:fs/promises';
import path from 'node:path';
import { abroadPlayers } from '../data/abroadPlayers';

async function main() {
  const outputPath =
    process.env.ABROAD_SEED_JSON_PATH ??
    path.resolve(process.cwd(), 'server/data/abroadPlayers.seed.json');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(abroadPlayers, null, 2), 'utf8');

  console.log(`Wrote abroad seed data to ${outputPath}`);
  console.log(`Players: ${abroadPlayers.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});