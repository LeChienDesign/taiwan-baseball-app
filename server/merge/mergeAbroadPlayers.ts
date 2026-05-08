

export type AbroadPlayerLike = {
  id: string;
  name?: string;
  league?: string;
  [key: string]: any;
};

export function normalizePlayers(input: any): AbroadPlayerLike[] {
  const players = Array.isArray(input?.players)
    ? input.players
    : Array.isArray(input)
      ? input
      : [];

  return players.filter((player: any): player is AbroadPlayerLike => {
    return !!player && typeof player.id === 'string' && player.id.length > 0;
  });
}

export function dedupePlayers(players: AbroadPlayerLike[]) {
  const seen = new Set<string>();

  return players.filter((player) => {
    if (seen.has(player.id)) {
      return false;
    }

    seen.add(player.id);
    return true;
  });
}
