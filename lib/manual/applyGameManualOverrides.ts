
export function buildManualGameKey(game: any) {
  const gameDate = game.gameDate ?? game.date;
  const awayName = game.awayTeam?.name ?? game.awayTeam?.short ?? '';
  const homeName = game.homeTeam?.name ?? game.homeTeam?.short ?? '';

  if (!gameDate || !awayName || !homeName) {
    return undefined;
  }

  return `${gameDate}-${awayName}-${homeName}`;
}

export function getManualGameOverride(game: any, manualSnapshot: any) {
  const manualGames = manualSnapshot?.games ?? {};
  const manualKey = buildManualGameKey(game);

  return (
    manualGames[game.id] ??
    manualGames[game.gamePk] ??
    (manualKey ? manualGames[manualKey] : undefined)
  );
}

export function applyGameManualOverrides<T extends Record<string, any>>(
  games: T[],
  manualSnapshot: any,
): T[] {
  return games.map((game) => {
    const override = getManualGameOverride(game, manualSnapshot);

    if (!override) {
      return game;
    }

    return {
      ...game,
      ...override,
      awayTeam: {
        ...(game.awayTeam ?? {}),
        ...(override.awayTeam ?? {}),
      },
      homeTeam: {
        ...(game.homeTeam ?? {}),
        ...(override.homeTeam ?? {}),
      },
      awayLine: override.awayLine ?? game.awayLine,
      homeLine: override.homeLine ?? game.homeLine,
    };
  });
}
