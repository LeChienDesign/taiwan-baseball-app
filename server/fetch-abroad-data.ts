import fs from 'node:fs/promises';
import path from 'node:path';

import { applyMlbOfficialAbroadPatches } from './providers/mlbAbroad';
import { applyNpbAbroadPatches } from './providers/npbAbroad';
import { applyKboAbroadPatches } from './providers/kboAbroad';

type AbroadPlayerLike = {
  id: string;
  name?: string;
  league?: string;
  level?: string;
  status?: string;
  team?: string;
  teamMeta?: {
    leagueGroup?: string;
    code?: string;
    abbreviation?: string;
    logoKey?: string;
    displayName?: string;
  };
  news?: Array<any>;
  recentGames?: Array<any>;
  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };
  [key: string]: any;
};

type AbroadLiveSummary = {
  totalPlayers: number;
  mlb: number;
  milb: number;
  npb: number;
  kbo: number;
  other: number;
  todayGames: number;
  finals: number;
  probableStarters: number;
  injured: number;
  withNews: number;
  withRecentGames: number;
};

type ProviderRunResult = {
  name: 'mlb' | 'npb' | 'kbo';
  ok: boolean;
  message: string;
  affectedPlayers: number;
};

type AbroadLivePayload = {
  updatedAt: string;
  requestedDate: string;
  summary: AbroadLiveSummary;
  providers: ProviderRunResult[];
  players: AbroadPlayerLike[];
};

function resolveProjectPath(inputPath: string) {
  if (path.isAbsolute(inputPath)) return inputPath;
  return path.resolve(process.cwd(), inputPath);
}

function getEnvPath(name: string, fallback: string) {
  return resolveProjectPath(process.env[name] ?? fallback);
}

function getArgValue(flag: string) {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getRequestedDate() {
  const fromArg = getArgValue('--date');
  if (!fromArg) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(fromArg);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid --date value: ${fromArg}`);
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePlayers(raw: unknown): AbroadPlayerLike[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => item as AbroadPlayerLike);
  }

  if (raw && typeof raw === 'object') {
    const maybePlayers = (raw as any).players;
    if (Array.isArray(maybePlayers)) {
      return maybePlayers.map((item) => item as AbroadPlayerLike);
    }
  }

  throw new Error('Seed JSON must be an array of players or an object with players[]');
}

function dedupePlayers(players: AbroadPlayerLike[]) {
  const map = new Map<string, AbroadPlayerLike>();

  for (const player of players) {
    if (!player?.id) continue;

    const prev = map.get(player.id);
    if (!prev) {
      map.set(player.id, player);
      continue;
    }

    map.set(player.id, {
      ...prev,
      ...player,
      teamMeta: {
        ...(prev.teamMeta ?? {}),
        ...(player.teamMeta ?? {}),
      },
      nextGame: player.nextGame ?? prev.nextGame,
      seasonStats: player.seasonStats ?? prev.seasonStats,
      recentGames: player.recentGames ?? prev.recentGames,
      news: player.news ?? prev.news,
    });
  }

  return Array.from(map.values());
}

function buildSummary(players: AbroadPlayerLike[]): AbroadLiveSummary {
  const leagues = players.map((player) => normalizeText(player.league));

  return {
    totalPlayers: players.length,
    mlb: leagues.filter((league) => league === 'mlb').length,
    milb: leagues.filter((league) => league === 'milb').length,
    npb: leagues.filter((league) => league === 'npb').length,
    kbo: leagues.filter((league) => league === 'kbo').length,
    other: leagues.filter(
      (league) => !['mlb', 'milb', 'npb', 'kbo'].includes(league)
    ).length,
    todayGames: players.filter((player) => player.status === '今日出賽').length,
    finals: players.filter((player) => player.status === '已完賽').length,
    probableStarters: players.filter((player) => player.status === '預告先發').length,
    injured: players.filter((player) => player.status === '傷兵').length,
    withNews: players.filter((player) => Array.isArray(player.news) && player.news.length > 0)
      .length,
    withRecentGames: players.filter(
      (player) => Array.isArray(player.recentGames) && player.recentGames.length > 0
    ).length,
  };
}

async function readSeedPlayers(seedPath: string) {
  const raw = await fs.readFile(seedPath, 'utf8');
  const parsed = JSON.parse(raw);
  return dedupePlayers(normalizePlayers(parsed));
}

async function writeLivePayload(outputPath: string, payload: AbroadLivePayload) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
}

function countAffectedPlayers(beforePlayers: AbroadPlayerLike[], afterPlayers: AbroadPlayerLike[]) {
  const beforeMap = new Map(beforePlayers.map((player) => [player.id, JSON.stringify(player)]));
  let count = 0;

  for (const player of afterPlayers) {
    const before = beforeMap.get(player.id);
    const after = JSON.stringify(player);
    if (before !== after) count += 1;
  }

  return count;
}

async function runProvider(
  name: ProviderRunResult['name'],
  players: AbroadPlayerLike[],
  date: string
): Promise<{ players: AbroadPlayerLike[]; result: ProviderRunResult }> {
  try {
    let nextPlayers = players;

    if (name === 'mlb') {
      nextPlayers = await applyMlbOfficialAbroadPatches(players, { date });
    } else if (name === 'npb') {
      nextPlayers = await applyNpbAbroadPatches(players, { date });
    } else if (name === 'kbo') {
      nextPlayers = await applyKboAbroadPatches(players, { date });
    } else {
      return {
        players,
        result: {
          name,
          ok: false,
          message: 'Unknown provider',
          affectedPlayers: 0,
        },
      };
    }

    const affectedPlayers = countAffectedPlayers(players, nextPlayers);

    return {
      players: dedupePlayers(nextPlayers),
      result: {
        name,
        ok: true,
        message: `${name.toUpperCase()} provider applied`,
        affectedPlayers,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Unknown ${name} provider error`;

    console.warn(`[fetch-abroad-data] ${name} provider failed: ${message}`);

    return {
      players,
      result: {
        name,
        ok: false,
        message,
        affectedPlayers: 0,
      },
    };
  }
}

async function main() {
  const seedPath = getEnvPath(
    'ABROAD_SEED_JSON_PATH',
    'server/data/abroadPlayers.seed.json'
  );
  const outputPath = getEnvPath(
    'ABROAD_OUTPUT_JSON_PATH',
    'server/data/abroadPlayers.live.json'
  );
  const date = getRequestedDate();

  let players = await readSeedPlayers(seedPath);
  const providerResults: ProviderRunResult[] = [];

  const mlbRun = await runProvider('mlb', players, date);
  players = mlbRun.players;
  providerResults.push(mlbRun.result);

  const npbRun = await runProvider('npb', players, date);
  players = npbRun.players;
  providerResults.push(npbRun.result);

  const kboRun = await runProvider('kbo', players, date);
  players = kboRun.players;
  providerResults.push(kboRun.result);

  const payload: AbroadLivePayload = {
    updatedAt: new Date().toISOString(),
    requestedDate: date,
    summary: buildSummary(players),
    providers: providerResults,
    players,
  };

  await writeLivePayload(outputPath, payload);

  console.log(`Wrote abroad live data to ${outputPath}`);
  console.log(
    `Summary: total=${payload.summary.totalPlayers}, mlb=${payload.summary.mlb}, milb=${payload.summary.milb}, npb=${payload.summary.npb}, kbo=${payload.summary.kbo}, other=${payload.summary.other}, todayGames=${payload.summary.todayGames}, finals=${payload.summary.finals}, probableStarters=${payload.summary.probableStarters}, injured=${payload.summary.injured}, withNews=${payload.summary.withNews}, withRecentGames=${payload.summary.withRecentGames}`
  );

  for (const provider of providerResults) {
    console.log(
      `[provider:${provider.name}] ${provider.ok ? 'OK' : 'WARN'} - ${provider.message} (affected=${provider.affectedPlayers})`
    );
  }
}

main().catch((error) => {
  console.error('Failed to fetch abroad live data');
  console.error(error);
  process.exit(1);
});