import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(_req: any, res: any) {
  try {
    const filePath =
      process.env.ABROAD_OUTPUT_JSON_PATH ??
      path.resolve(process.cwd(), 'server/data/abroadPlayers.live.json');

    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to read abroad live data',
      detail: error?.message ?? 'Unknown error',
    });
  }
}