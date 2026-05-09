import type { AbroadPlayerLike } from './mergeAbroadPlayers';

export type AbroadLiveSummary = {
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

function normalizeText(value?: string) {
  return String(value ?? '').trim().toLowerCase();
}

export function buildSummary(
  players: AbroadPlayerLike[]
): AbroadLiveSummary {
  const leagues = players.map((player) =>
    normalizeText(player.league)
  );

  return {
    totalPlayers: players.length,

    mlb: leagues.filter((league) => league === 'mlb').length,

    milb: leagues.filter((league) => league === 'milb').length,

    npb: leagues.filter((league) => league === 'npb').length,

    kbo: leagues.filter((league) => league === 'kbo').length,

    other: leagues.filter(
      (league) =>
        !['mlb', 'milb', 'npb', 'kbo'].includes(league)
    ).length,

    todayGames: players.filter(
      (player) => player.status === '今日出賽'
    ).length,

    finals: players.filter(
      (player) => player.status === '已完賽'
    ).length,

    probableStarters: players.filter(
      (player) => player.status === '預告先發'
    ).length,

    injured: players.filter(
      (player) => player.status === '傷兵'
    ).length,

    withNews: players.filter(
      (player) =>
        Array.isArray(player.news) &&
        player.news.length > 0
    ).length,

    withRecentGames: players.filter(
      (player) =>
        Array.isArray(player.recentGames) &&
        player.recentGames.length > 0
    ).length,
  };
}
