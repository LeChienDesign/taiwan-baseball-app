import fs from 'node:fs/promises';
import path from 'node:path';

type LeagueKey = 'cpbl' | 'mlb' | 'npb' | 'kbo';

const leagueFileNames: Record<LeagueKey, string> = {
  cpbl: 'eventsCenter.cpbl.json',
  mlb: 'eventsCenter.mlb.json',
  npb: 'eventsCenter.npb.json',
  kbo: 'eventsCenter.kbo.json',
};

async function readLeagueData(league: LeagueKey) {
  const envPath = process.env[`EVENTS_CENTER_${league.toUpperCase()}_JSON_PATH`];
  const filePath = envPath ?? path.resolve(process.cwd(), 'server/data', leagueFileNames[league]);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const leagueParam = `${url.searchParams.get('league') ?? 'mlb'}`.toLowerCase();

    if (leagueParam === 'all') {
      const [cpbl, mlb, npb, kbo] = await Promise.all([
        readLeagueData('cpbl'),
        readLeagueData('mlb'),
        readLeagueData('npb'),
        readLeagueData('kbo'),
      ]);

      return Response.json({
        updatedAt: new Date().toISOString(),
        cpbl,
        mlb,
        npb,
        kbo,
      });
    }

    if (!['cpbl', 'mlb', 'npb', 'kbo'].includes(leagueParam)) {
      return Response.json(
        {
          error: 'Unsupported league',
          supported: ['cpbl', 'mlb', 'npb', 'kbo', 'all'],
        },
        { status: 400 }
      );
    }

    const parsed = await readLeagueData(leagueParam as LeagueKey);
    return Response.json(parsed);
  } catch (error: unknown) {
    return Response.json(
      {
        error: 'Failed to read events center data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
