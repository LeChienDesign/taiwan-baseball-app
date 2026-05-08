import { applyMlbOfficialAbroadPatches } from './mlbAbroad';
import { applyMlbAbroadFallbackPatches } from './mlbAbroadFallback';
import { applyNpbAbroadPatches } from './npbAbroad';
import { applyKboAbroadPatches } from './kboAbroad';
import { type AbroadPlayerLike, dedupePlayers } from '../merge/mergeAbroadPlayers';

export type AbroadProviderName = 'mlb' | 'npb' | 'kbo';

export type ProviderRunResult = {
  name: AbroadProviderName;
  ok: boolean;
  message: string;
  affectedPlayers: number;
};

export type AbroadProviderRunOptions = {
  retry?: number;
  timeoutMs?: number;
  fallback?: boolean;
};

function countAffectedPlayers(
  beforePlayers: AbroadPlayerLike[],
  afterPlayers: AbroadPlayerLike[]
) {
  const beforeMap = new Map(
    beforePlayers.map((player) => [player.id, JSON.stringify(player)])
  );
  let count = 0;

  for (const player of afterPlayers) {
    const before = beforeMap.get(player.id);
    const after = JSON.stringify(player);
    if (before !== after) count += 1;
  }

  return count;
}

async function runProviderOnce(
  name: AbroadProviderName,
  players: AbroadPlayerLike[],
  date: string
) {
  if (name === 'mlb') {
    let patched = await applyMlbOfficialAbroadPatches(players as any, { date });
    patched = await applyMlbAbroadFallbackPatches(patched, { date });
    return patched;
  }

  if (name === 'npb') {
    return applyNpbAbroadPatches(players as any, { date });
  }

  if (name === 'kbo') {
    return applyKboAbroadPatches(players as any, { date });
  }

  throw new Error('Unknown provider');
}

export async function runAbroadProvider(
  name: AbroadProviderName,
  players: AbroadPlayerLike[],
  date: string,
  options: AbroadProviderRunOptions = {}
): Promise<{ players: AbroadPlayerLike[]; result: ProviderRunResult }> {
  const maxAttempts = Math.max(1, (options.retry ?? 0) + 1);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const nextPlayers = await runProviderOnce(name, players, date);
      const affectedPlayers = countAffectedPlayers(players, nextPlayers);

      return {
        players: dedupePlayers(nextPlayers),
        result: {
          name,
          ok: true,
          message:
            attempt > 1
              ? `${name.toUpperCase()} provider applied after ${attempt} attempts`
              : `${name.toUpperCase()} provider applied`,
          affectedPlayers,
        },
      };
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : `Unknown ${name} provider error`;

      if (attempt < maxAttempts) {
        console.warn(
          `[fetch-abroad-data] ${name} provider attempt ${attempt}/${maxAttempts} failed: ${message}`
        );
        continue;
      }
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : `Unknown ${name} provider error`;

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
