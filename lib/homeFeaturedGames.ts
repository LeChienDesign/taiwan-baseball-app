import { HOME_FOCUS_TAGS, HOME_PRIORITY_SCORES } from '../constants/focusPlayers';
import {
  TAIWAN_FOCUS_PLAYER_TEAMS,
  JAPAN_MLB_FOCUS_PLAYER_TEAMS,
} from '../constants/focusTeams';

export type FeaturedGame = {
  id: string;
  league: 'MLB' | 'NPB' | 'CPBL' | 'KBO' | 'OTHER';
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  startTime?: string;
  venue?: string;
  awayTeam: {
    name: string;
    short?: string;
    logo?: any;
  };
  homeTeam: {
    name: string;
    short?: string;
    logo?: any;
  };
  awayScore?: number;
  homeScore?: number;
  footerLeft?: string;
  footerRight?: string;
  tags: string[];
  priorityScore: number;
  reason: string;
};

type BasicGame = {
  id: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  venue?: string;
  awayTeam: {
    name: string;
    short?: string;
    logo?: any;
  };
  homeTeam: {
    name: string;
    short?: string;
    logo?: any;
  };
  awayScore?: number;
  homeScore?: number;
  footerLeft?: string;
  footerRight?: string;
};

type FocusPlayerEntry = {
  player: string;
  team: string;
  level: string;
  teamKeywords: readonly string[];
};

function guessStartTime(game: BasicGame) {
  if (game.status === 'SCHEDULED') return game.footerRight ?? '';
  return '';
}

function getLeagueBaseScore(league: FeaturedGame['league']) {
  switch (league) {
    case 'CPBL':
      return HOME_PRIORITY_SCORES.cpblMajor;
    case 'MLB':
      return HOME_PRIORITY_SCORES.international;
    case 'NPB':
      return HOME_PRIORITY_SCORES.npb;
    case 'KBO':
      return HOME_PRIORITY_SCORES.kbo;
    default:
      return HOME_PRIORITY_SCORES.default;
  }
}

function boostByStatus(status: FeaturedGame['status']) {
  if (status === 'LIVE') return 20;
  if (status === 'SCHEDULED') return 5;
  return -5;
}

function gameSearchText(game: BasicGame) {
  return [
    game.awayTeam.name,
    game.awayTeam.short ?? '',
    game.homeTeam.name,
    game.homeTeam.short ?? '',
    game.venue ?? '',
    game.footerLeft ?? '',
    game.footerRight ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

function findFocusPlayers(game: BasicGame, pool: readonly FocusPlayerEntry[]) {
  const text = gameSearchText(game);

  return pool.filter((item) =>
    item.teamKeywords.some((keyword) => text.includes(keyword.toLowerCase()))
  );
}

function findTaiwanFocusPlayers(game: BasicGame) {
  return findFocusPlayers(game, TAIWAN_FOCUS_PLAYER_TEAMS);
}

function findJapanFocusPlayers(game: BasicGame) {
  return findFocusPlayers(game, JAPAN_MLB_FOCUS_PLAYER_TEAMS);
}

function buildFallbackReason(
  league: FeaturedGame['league'],
  isTaiwanFocus: boolean,
  isJapanFocus: boolean
) {
  if (isTaiwanFocus) return HOME_FOCUS_TAGS.taiwan;
  if (isJapanFocus) return HOME_FOCUS_TAGS.japanMlb;
  if (league === 'CPBL') return HOME_FOCUS_TAGS.cpbl;
  if (league === 'NPB') return '日職焦點';
  if (league === 'KBO') return '韓職焦點';
  return '今日賽事';
}

function buildReason(
  league: FeaturedGame['league'],
  taiwanPlayers: FocusPlayerEntry[],
  japanPlayers: FocusPlayerEntry[]
) {
  if (taiwanPlayers.length > 0) {
    return `台灣焦點：${taiwanPlayers.map((p) => p.player).join('、')}`;
  }

  if (japanPlayers.length > 0) {
    return `日本旅美焦點：${japanPlayers.map((p) => p.player).join('、')}`;
  }

  return buildFallbackReason(league, false, false);
}

export function toFeaturedGames(
  league: FeaturedGame['league'],
  games: BasicGame[]
): FeaturedGame[] {
  return games.map((game) => {
    const taiwanPlayers = findTaiwanFocusPlayers(game);
    const japanPlayers = findJapanFocusPlayers(game);

    const taiwanFocus = taiwanPlayers.length > 0;
    const japanFocus = japanPlayers.length > 0;

    let priorityScore = getLeagueBaseScore(league) + boostByStatus(game.status);
    const tags: string[] = [];

    if (taiwanFocus) {
      priorityScore += HOME_PRIORITY_SCORES.taiwanFocus;
      tags.push(HOME_FOCUS_TAGS.taiwan);
    }

    if (japanFocus) {
      priorityScore += HOME_PRIORITY_SCORES.japanMlbFocus;
      tags.push(HOME_FOCUS_TAGS.japanMlb);
    }

    if (league === 'CPBL') {
      tags.push(HOME_FOCUS_TAGS.cpbl);
    }

    return {
      id: `${league}-${game.id}`,
      league,
      status: game.status,
      startTime: guessStartTime(game),
      venue: game.venue,
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      awayScore: game.awayScore,
      homeScore: game.homeScore,
      footerLeft: game.footerLeft,
      footerRight: game.footerRight,
      tags,
      priorityScore,
      reason: buildReason(league, taiwanPlayers, japanPlayers),
    };
  });
}

export function sortFeaturedGames(games: FeaturedGame[]) {
  return [...games].sort((a, b) => b.priorityScore - a.priorityScore);
}

function featuredGameKey(game: FeaturedGame) {
  const away = game.awayTeam.name.trim().toLowerCase();
  const home = game.homeTeam.name.trim().toLowerCase();
  const time = (game.startTime || game.footerRight || '').trim().toLowerCase();

  return `${game.league}__${away}__${home}__${time}`;
}

function extractReasonNames(reason: string) {
  const parts = reason.split('：');
  if (parts.length < 2) return [];
  return parts[1]
    .split('、')
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeReasons(a: string, b: string) {
  const aIsTaiwan = a.startsWith('台灣焦點：');
  const bIsTaiwan = b.startsWith('台灣焦點：');

  if (aIsTaiwan && bIsTaiwan) {
    const names = Array.from(new Set([...extractReasonNames(a), ...extractReasonNames(b)]));
    return names.length > 0 ? `台灣焦點：${names.join('、')}` : a;
  }

  const aIsJapan = a.startsWith('日本旅美焦點：');
  const bIsJapan = b.startsWith('日本旅美焦點：');

  if (aIsJapan && bIsJapan) {
    const names = Array.from(new Set([...extractReasonNames(a), ...extractReasonNames(b)]));
    return names.length > 0 ? `日本旅美焦點：${names.join('、')}` : a;
  }

  if (a.length >= b.length) return a;
  return b;
}

export function dedupeFeaturedGames(games: FeaturedGame[]) {
  const sorted = sortFeaturedGames(games);
  const map = new Map<string, FeaturedGame>();

  for (const game of sorted) {
    const key = featuredGameKey(game);

    if (!map.has(key)) {
      map.set(key, game);
      continue;
    }

    const existing = map.get(key)!;

    map.set(key, {
      ...existing,
      tags: Array.from(new Set([...existing.tags, ...game.tags])),
      priorityScore: Math.max(existing.priorityScore, game.priorityScore),
      reason: mergeReasons(existing.reason, game.reason),
    });
  }

  return Array.from(map.values());
}

export function pickTopFeaturedGames(games: FeaturedGame[], limit = 6) {
  return sortFeaturedGames(dedupeFeaturedGames(games)).slice(0, limit);
}