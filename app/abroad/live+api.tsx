import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  try {
    const filePath =
      process.env.ABROAD_OUTPUT_JSON_PATH ??
      path.resolve(process.cwd(), 'server/data/abroadPlayers.live.json');

    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    return Response.json(parsed);
  } catch (error: any) {
    return Response.json(
      {
        error: 'Failed to read abroad live data',
        detail: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}