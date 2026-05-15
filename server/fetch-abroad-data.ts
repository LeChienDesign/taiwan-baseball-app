import fs from 'node:fs/promises';
import path from 'node:path';

import {
  applyManualAbroadOverrides,
  type AbroadManualPayload,
  type AbroadPlayerLike,
  dedupePlayers,
  normalizePlayers,
} from './merge/mergeAbroadPlayers';
import { buildAbroadPayload, type AbroadLivePayload } from './builders/buildAbroadPayload';
import {
  runAbroadProvider,
  type AbroadProviderName,
  type ProviderRunResult,
} from './providers/runAbroadProvider';

const PROVIDERS = [
  {
    name: 'mlb',
    enabled: true,
    retry: 2,
    timeoutMs: 10000,
    fallback: true,
  },
  {
    name: 'milb',
    enabled: true,
    retry: 2,
    timeoutMs: 10000,
    fallback: true,
  },
  {
    name: 'npb',
    enabled: true,
    retry: 1,
    timeoutMs: 8000,
    fallback: false,
  },
  {
    name: 'kbo',
    enabled: true,
    retry: 1,
    timeoutMs: 8000,
    fallback: false,
  },
] as const satisfies ReadonlyArray<{
  name: AbroadProviderName;
  enabled: boolean;
  retry: number;
  timeoutMs: number;
  fallback: boolean;
}>;

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

async function readSeedPlayers(seedPath: string) {
  const raw = await fs.readFile(seedPath, 'utf8');
  const parsed = JSON.parse(raw);
  return dedupePlayers(normalizePlayers(parsed));
}

async function readManualPayload(manualPath: string): Promise<AbroadManualPayload> {
  try {
    const raw = await fs.readFile(manualPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return { players: {}, notes: [] };
    }

    return {
      players:
        parsed.players && typeof parsed.players === 'object' && !Array.isArray(parsed.players)
          ? parsed.players
          : {},
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { players: {}, notes: [] };
    }

    throw error;
  }
}

function shouldBackfillMlbMilbNumber(player: AbroadPlayerLike) {
  const league = String((player as any).league ?? '').toUpperCase();
  const hasOfficialPersonId = typeof (player as any).officialPersonId === 'number';
  return hasOfficialPersonId && (league === 'MLB' || league === 'MILB');
}

async function fetchMlbRosterPlayerNumber(teamId: number, officialPersonId: number) {
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`;

  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;

    const payload = await response.json();
    const roster = Array.isArray(payload?.roster) ? payload.roster : [];
    const rosterPlayer = roster.find((entry: any) => entry?.person?.id === officialPersonId);
    const number = rosterPlayer?.jerseyNumber;

    if (typeof number !== 'string') return undefined;

    const trimmed = number.trim();
    return trimmed ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

async function fetchMlbOfficialPlayerNumber(officialPersonId: number, league: string) {
  const url = `https://statsapi.mlb.com/api/v1/people/${officialPersonId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;

    const payload = await response.json();
    const person = Array.isArray(payload?.people) ? payload.people[0] : undefined;
    const currentTeamId = person?.currentTeam?.id;

    if (typeof currentTeamId === 'number') {
      const rosterNumber = await fetchMlbRosterPlayerNumber(currentTeamId, officialPersonId);
      if (rosterNumber) return rosterNumber;
    }

    if (league.toUpperCase() !== 'MILB') {
      const primaryNumber = person?.primaryNumber;

      if (typeof primaryNumber === 'string') {
        const trimmed = primaryNumber.trim();
        if (trimmed) return trimmed;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

async function backfillMlbMilbOfficialNumbers(players: AbroadPlayerLike[]) {
  const nextPlayers = [...players];

  await Promise.all(
    nextPlayers.map(async (player, index) => {
      if (!shouldBackfillMlbMilbNumber(player)) return;

      const currentNumber = (player as any).number;
      const officialPersonId = (player as any).officialPersonId as number;
      const league = String((player as any).league ?? '').toUpperCase();
      const officialNumber = await fetchMlbOfficialPlayerNumber(officialPersonId, league);

      if (!officialNumber) return;
      if (currentNumber === officialNumber) return;

      nextPlayers[index] = {
        ...player,
        number: officialNumber,
      };
    })
  );

  return nextPlayers;
}

async function writeLivePayload(outputPath: string, payload: AbroadLivePayload) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
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
  const manualPath = getEnvPath(
    'ABROAD_MANUAL_JSON_PATH',
    'server/data/manual/abroadPlayers.manual.json'
  );
  const date = getRequestedDate();

  let players = await readSeedPlayers(seedPath);
  const manualPayload = await readManualPayload(manualPath);
  const providerResults: ProviderRunResult[] = [];

  for (const provider of PROVIDERS) {
    if (!provider.enabled) continue;

    const run = await runAbroadProvider(provider.name, players, date);
    players = run.players;
    providerResults.push(run.result);
  }

  players = await backfillMlbMilbOfficialNumbers(players);
  players = dedupePlayers(applyManualAbroadOverrides(players, manualPayload));

  const payload = buildAbroadPayload(players, providerResults, date);

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
