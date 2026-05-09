

import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchMlbGamesByDate } from '../lib/mlb';
import { fetchCpblMajorGamesByDate } from '../lib/cpbl-real';
import { fetchNpbGamesByDate } from '../lib/npb';
import { fetchKboGamesByDate } from '../lib/kbo';

import {
  buildFeaturedItems,
  buildLeagueStat,
  getLiveGamesOnly,
  getMlbDateKeyForTaipei,
  getNextDateKey,
  getTodayDateKey,
  getUpcomingGamesWithinHours,
  mergeGamesById,
  normalizeHomeGames,
  shouldAutoRefreshScores,
  sortFeatured,
  sortLiveGames,
  withHomeFetchTimeout,
} from '../lib/homeGameSelector';

import { useSmartLeagueRefresh } from './useSmartLeagueRefresh';

export type LeagueKey = 'CPBL' | 'MLB' | 'NPB' | 'KBO';

export type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logo: any;
};

export type ScoreboardGame = {
  id: string | number;
  status: 'FINAL' | 'LIVE' | 'SCHEDULED';
  venue: string;
  awayTeam: TeamCardInfo;
  homeTeam: TeamCardInfo;
  awayScore: number;
  homeScore: number;
  innings: number[];
  awayLine: {
    team: string;
    innings: (number | string)[];
    r: number;
    h: number;
    e: number;
  };
  homeLine: {
    team: string;
    innings: (number | string)[];
    r: number;
    h: number;
    e: number;
  };
  footerLeft?: string;
  footerRight?: string;
  gameDate?: string;
  date?: string;
};

export type FeaturedItem = {
  league: LeagueKey;
  game: ScoreboardGame;
};

export type LeagueStats = Record<
  LeagueKey,
  {
    total: number;
    live: number;
  }
>;

export function useHomeGames() {
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const nextDateKey = useMemo(() => getNextDateKey(todayKey), [todayKey]);
  const mlbTodayKey = useMemo(() => getMlbDateKeyForTaipei(todayKey), [todayKey]);

  const [featuredGames, setFeaturedGames] = useState<FeaturedItem[]>([]);
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({
    CPBL: { total: 0, live: 0 },
    MLB: { total: 0, live: 0 },
    NPB: { total: 0, live: 0 },
    KBO: { total: 0, live: 0 },
  });

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHomeGames = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }

      const localOnly = !options?.silent && !refreshing;

      const [
        cpblGames,
        mlbGamesByMlbDate,
        mlbGamesByTaipeiDate,
        npbGames,
        kboGames,
        cpblNextGames,
        mlbNextGames,
        npbNextGames,
        kboNextGames,
      ] = await Promise.all([
        withHomeFetchTimeout(
          fetchCpblMajorGamesByDate(todayKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchMlbGamesByDate(mlbTodayKey, { localOnly } as any).catch(() => []),
          []
        ),
        mlbTodayKey === todayKey
          ? Promise.resolve([])
          : withHomeFetchTimeout(
              fetchMlbGamesByDate(todayKey, { localOnly } as any).catch(() => []),
              []
            ),
        withHomeFetchTimeout(
          fetchNpbGamesByDate(todayKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchKboGamesByDate(todayKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchCpblMajorGamesByDate(nextDateKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchMlbGamesByDate(nextDateKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchNpbGamesByDate(nextDateKey, { localOnly } as any).catch(() => []),
          []
        ),
        withHomeFetchTimeout(
          fetchKboGamesByDate(nextDateKey, { localOnly } as any).catch(() => []),
          []
        ),
      ]);

      const mlbExtraTaipeiGames = getLiveGamesOnly(
        normalizeHomeGames(mlbGamesByTaipeiDate as ScoreboardGame[], todayKey)
      );

      const mlbGames = mergeGamesById([
        ...(mlbGamesByMlbDate as ScoreboardGame[]),
        ...mlbExtraTaipeiGames,
      ]);

      const normalizedCpblGames = normalizeHomeGames(
        cpblGames as ScoreboardGame[],
        todayKey
      );

      const normalizedMlbGames = normalizeHomeGames(
        mlbGames as ScoreboardGame[],
        todayKey
      );

      const normalizedNpbGames = normalizeHomeGames(
        npbGames as ScoreboardGame[],
        todayKey
      );

      const normalizedKboGames = normalizeHomeGames(
        kboGames as ScoreboardGame[],
        todayKey
      );

      const normalizedCpblNextGames = normalizeHomeGames(
        cpblNextGames as ScoreboardGame[],
        nextDateKey
      );

      const normalizedMlbNextGames = normalizeHomeGames(
        mlbNextGames as ScoreboardGame[],
        nextDateKey
      );

      const normalizedNpbNextGames = normalizeHomeGames(
        npbNextGames as ScoreboardGame[],
        nextDateKey
      );

      const normalizedKboNextGames = normalizeHomeGames(
        kboNextGames as ScoreboardGame[],
        nextDateKey
      );

      setLeagueStats({
        CPBL: buildLeagueStat(normalizedCpblGames),
        MLB: buildLeagueStat(normalizedMlbGames),
        NPB: buildLeagueStat(normalizedNpbGames),
        KBO: buildLeagueStat(normalizedKboGames),
      });

      const merged = [
        ...buildFeaturedItems('CPBL', normalizedCpblGames),
        ...buildFeaturedItems('MLB', normalizedMlbGames),
        ...buildFeaturedItems('NPB', normalizedNpbGames),
        ...buildFeaturedItems('KBO', normalizedKboGames),
        ...buildFeaturedItems('CPBL', normalizedCpblNextGames),
        ...buildFeaturedItems('MLB', normalizedMlbNextGames),
        ...buildFeaturedItems('NPB', normalizedNpbNextGames),
        ...buildFeaturedItems('KBO', normalizedKboNextGames),
      ];

      setFeaturedGames(sortFeatured(merged));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }

      setRefreshing(false);
    }
  }, [mlbTodayKey, nextDateKey, refreshing, todayKey]);

  useEffect(() => {
    loadHomeGames();

    const timer = setTimeout(() => {
      loadHomeGames({ silent: true });
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [loadHomeGames]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadHomeGames({ silent: true });
  }, [loadHomeGames]);

  useSmartLeagueRefresh({
    enabled: shouldAutoRefreshScores(featuredGames),
    onRefresh: () => loadHomeGames({ silent: true }),
  });

  const liveGames = useMemo(() => {
    return sortLiveGames(
      featuredGames.filter((item) => item.game.status === 'LIVE')
    );
  }, [featuredGames]);

  const displayedGames = useMemo(() => {
    return getUpcomingGamesWithinHours(featuredGames, 12).slice(0, 4);
  }, [featuredGames]);

  return {
    todayKey,
    nextDateKey,
    mlbTodayKey,
    featuredGames,
    displayedGames,
    liveGames,
    leagueStats,
    loading,
    refreshing,
    refresh,
    reload: loadHomeGames,
  };
}
