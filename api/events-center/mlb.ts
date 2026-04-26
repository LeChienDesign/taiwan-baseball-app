import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req: any, res: any) {
  try {
    const date = String(req?.query?.date || '');
    const filePath =
      process.env.EVENTS_CENTER_OUTPUT_JSON_PATH ??
      path.resolve(process.cwd(), 'server/data/eventsCenter.mlb.json');

    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (date && parsed?.date && parsed.date !== date) {
      return res.status(200).json({
        updatedAt: parsed.updatedAt,
        date: parsed.date,
        games: parsed.games ?? [],
        note: `目前本地快取日期為 ${parsed.date}，不是 ${date}`,
      });
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to read MLB events center data',
      detail: error?.message ?? 'Unknown error',
    });
  }
}