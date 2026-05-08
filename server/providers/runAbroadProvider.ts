

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

export async function runAbroadProvider(
  name: AbroadProviderName,
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
