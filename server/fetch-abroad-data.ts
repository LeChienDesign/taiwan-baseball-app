import fs from 'node:fs/promises';
import path from 'node:path';

import { applyMlbOfficialAbroadPatches } from './providers/mlbAbroad';
import { applyMlbAbroadFallbackPatches } from './providers/mlbAbroadFallback';
import { applyNpbAbroadPatches } from './providers/npbAbroad';
import { applyKboAbroadPatches } from './providers/kboAbroad';
import {
  applyManualAbroadOverrides,
  buildSummary,
  type AbroadLiveSummary,
  type AbroadManualPayload,
  type AbroadPlayerLike,
  dedupePlayers,
  normalizePlayers,
} from './merge/mergeAbroadPlayers';

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
      let patched = await applyMlbOfficialAbroadPatches(players as any, { date });
      patched = await applyMlbAbroadFallbackPatches(patched, { date });
      nextPlayers = patched;
    } else if (name === 'npb') {
      nextPlayers = await applyNpbAbroadPatches(players as any, { date });
    } else if (name === 'kbo') {
      nextPlayers = await applyKboAbroadPatches(players as any, { date });
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
  const manualPath = getEnvPath(
    'ABROAD_MANUAL_JSON_PATH',
    'server/data/manual/abroadPlayers.manual.json'
  );
  const date = getRequestedDate();

  let players = await readSeedPlayers(seedPath);
  const manualPayload = await readManualPayload(manualPath);
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

  players = dedupePlayers(applyManualAbroadOverrides(players, manualPayload));

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
