import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const filePath =
      process.env.EVENTS_CENTER_OUTPUT_JSON_PATH ??
      path.resolve(process.cwd(), 'server/data/eventsCenter.mlb.json');

    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (date && parsed?.date && parsed.date !== date) {
      return Response.json({
        updatedAt: parsed.updatedAt,
        date: parsed.date,
        games: parsed.games ?? [],
        note: `目前本地快取日期為 ${parsed.date}，不是 ${date}`,
      });
    }

    return Response.json(parsed);
  } catch (error: any) {
    return Response.json(
      {
        error: 'Failed to read MLB events center data',
        detail: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}