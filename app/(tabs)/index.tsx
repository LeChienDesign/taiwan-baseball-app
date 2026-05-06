import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ScoreboardCard from '../../components/ScoreboardCard';
import TrackedAbroadSection from '../../components/TrackedAbroadSection';
import AppLoadingState from '../../components/AppLoadingState';
import AppEmptyState from '../../components/AppEmptyState';

import { fetchMlbGamesByDate } from '../../lib/mlb';
import { fetchCpblMajorGamesByDate } from '../../lib/cpbl';
import { fetchNpbGamesByDate } from '../../lib/npb';
import { fetchKboGamesByDate } from '../../lib/kbo';

type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logo: any;
};

type ScoreboardGame = {
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
};

type LeagueKey = 'CPBL' | 'MLB' | 'NPB' | 'KBO';

type FeaturedItem = {
  league: LeagueKey;
  game: ScoreboardGame;
};

type LeagueStats = Record<
  LeagueKey,
  {
    total: number;
    live: number;
  }
>;

const AUTO_REFRESH_LIVE_MS = 30000;
const AUTO_REFRESH_GAMES_MS = 60000;

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayDateKey() {
  return toDateKey(new Date());
}

function getPreviousDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

function getMlbDateKeyForTaipei(todayKey: string) {
  const taipeiHour = new Date().getHours();

  // MLB games shown in Taiwan morning/afternoon usually still belong to the previous US calendar date.
  return taipeiHour < 18 ? getPreviousDateKey(todayKey) : todayKey;
}

function mergeGamesById(games: ScoreboardGame[]) {
  const map = new Map<string, ScoreboardGame>();

  for (const game of games) {
    map.set(String(game.id), game);
  }

  return Array.from(map.values());
}

function getLiveGamesOnly(games: ScoreboardGame[]) {
  return games.filter((game) => game.status === 'LIVE');
}

function getLeagueOrder(league: LeagueKey) {
  const order: Record<LeagueKey, number> = {
    CPBL: 1,
    MLB: 2,
    NPB: 3,
    KBO: 4,
  };
  return order[league];
}

function getStatusOrder(status: ScoreboardGame['status']) {
  if (status === 'LIVE') return 1;
  if (status === 'SCHEDULED') return 2;
  if (status === 'FINAL') return 3;
  return 4;
}

function parseTimeValue(text?: string) {
  if (!text) return 9999;
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getGameTimeValue(game: ScoreboardGame) {
  return parseTimeValue(game.footerRight);
}

function getLiveInningValue(game: ScoreboardGame) {
  const text = `${game.footerLeft ?? ''} ${game.footerRight ?? ''}`;
  const match = text.match(/(\d{1,2})\s*(?:局|回|th|st|nd|rd)/i);
  if (!match) return 0;
  return Number(match[1]) || 0;
}

function sortLiveGames(items: FeaturedItem[]) {
  return [...items].sort((a, b) => {
    const inningDiff = getLiveInningValue(b.game) - getLiveInningValue(a.game);
    if (inningDiff !== 0) return inningDiff;

    const leagueDiff = getLeagueOrder(a.league) - getLeagueOrder(b.league);
    if (leagueDiff !== 0) return leagueDiff;

    return String(a.game.id).localeCompare(String(b.game.id));
  });
}

function hasMeaningfulGameContent(game: ScoreboardGame) {
  const hasVenue = !!String(game.venue || '').trim();
  const hasTime = !!String(game.footerRight || '').trim();
  const hasStatus = !!String(game.status || '').trim();
  const hasTeams = !!game.awayTeam?.name && !!game.homeTeam?.name;

  if (!hasTeams || !hasStatus) return false;

  if (game.status === 'LIVE' || game.status === 'FINAL') {
    return true;
  }

  return hasVenue || hasTime;
}

function sortFeatured(items: FeaturedItem[]) {
  return [...items].sort((a, b) => {
    const statusDiff = getStatusOrder(a.game.status) - getStatusOrder(b.game.status);
    if (statusDiff !== 0) return statusDiff;

    const leagueDiff = getLeagueOrder(a.league) - getLeagueOrder(b.league);
    if (leagueDiff !== 0) return leagueDiff;

    const timeDiff = getGameTimeValue(a.game) - getGameTimeValue(b.game);
    if (timeDiff !== 0) return timeDiff;

    return String(a.game.id).localeCompare(String(b.game.id));
  });
}

function buildFeaturedItems(league: LeagueKey, games: ScoreboardGame[]) {
  return games
    .filter((game) => game.status !== 'FINAL')
    .filter(hasMeaningfulGameContent)
    .map((game) => ({ league, game }));
}

function buildLeagueStat(games: ScoreboardGame[]) {
  const meaningful = games
    .filter((game) => game.status !== 'FINAL')
    .filter(hasMeaningfulGameContent);

  return {
    total: meaningful.length,
    live: meaningful.filter((g) => g.status === 'LIVE').length,
  };
}

function buildLeagueHref(league: LeagueKey, date: string) {
  if (league === 'CPBL') return `/league/cpbl-major?date=${date}`;
  if (league === 'MLB') return `/league/mlb?date=${date}`;
  if (league === 'NPB') return `/league/npb?date=${date}`;
  return `/league/kbo?date=${date}`;
}

export default function HomePage() {
  const router = useRouter();
  const todayKey = useMemo(() => getTodayDateKey(), []);
  const mlbTodayKey = useMemo(() => getMlbDateKeyForTaipei(todayKey), [todayKey]);
  const logoPulse = useRef(new Animated.Value(1)).current;

  const [featuredGames, setFeaturedGames] = useState<FeaturedItem[]>([]);
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({
    CPBL: { total: 0, live: 0 },
    MLB: { total: 0, live: 0 },
    NPB: { total: 0, live: 0 },
    KBO: { total: 0, live: 0 },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAllLiveGames, setShowAllLiveGames] = useState(false);

  const loadHomeData = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
      }

      const [cpblGames, mlbGamesByMlbDate, mlbGamesByTaipeiDate, npbGames, kboGames] = await Promise.all([
        fetchCpblMajorGamesByDate(todayKey).catch(() => []),
        fetchMlbGamesByDate(mlbTodayKey).catch(() => []),
        mlbTodayKey === todayKey ? Promise.resolve([]) : fetchMlbGamesByDate(todayKey).catch(() => []),
        fetchNpbGamesByDate(todayKey).catch(() => []),
        fetchKboGamesByDate(todayKey).catch(() => []),
      ]);

      const mlbExtraTaipeiGames = getLiveGamesOnly(mlbGamesByTaipeiDate as ScoreboardGame[]);
      const mlbGames = mergeGamesById([
        ...(mlbGamesByMlbDate as ScoreboardGame[]),
        ...mlbExtraTaipeiGames,
      ]);

      setLeagueStats({
        CPBL: buildLeagueStat(cpblGames as ScoreboardGame[]),
        MLB: buildLeagueStat(mlbGames as ScoreboardGame[]),
        NPB: buildLeagueStat(npbGames as ScoreboardGame[]),
        KBO: buildLeagueStat(kboGames as ScoreboardGame[]),
      });

      const merged = [
        ...buildFeaturedItems('CPBL', cpblGames as ScoreboardGame[]),
        ...buildFeaturedItems('MLB', mlbGames as ScoreboardGame[]),
        ...buildFeaturedItems('NPB', npbGames as ScoreboardGame[]),
        ...buildFeaturedItems('KBO', kboGames as ScoreboardGame[]),
      ];

      setFeaturedGames(sortFeatured(merged));
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [mlbTodayKey, todayKey]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
      logoPulse.setValue(1);
    };
  }, [logoPulse]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, [loadHomeData]);

  const displayedGames = useMemo(() => {
    const liveIds = new Set(
      featuredGames
        .filter((item) => item.game.status === 'LIVE')
        .map((item) => String(item.game.id))
    );

    const withoutLiveOrFinal = featuredGames.filter(
      (item) =>
        item.game.status !== 'FINAL' && !liveIds.has(String(item.game.id))
    );

    return withoutLiveOrFinal.slice(0, 4);
  }, [featuredGames]);

  const liveGames = useMemo(() => {
    return sortLiveGames(featuredGames.filter((item) => item.game.status === 'LIVE'));
  }, [featuredGames]);

  const visibleLiveGames = showAllLiveGames ? liveGames : liveGames.slice(0, 6);
  const hasMoreLiveGames = liveGames.length > 6;

  const totalGamesToday =
    leagueStats.CPBL.total +
    leagueStats.MLB.total +
    leagueStats.NPB.total +
    leagueStats.KBO.total;

  const totalLiveToday =
    leagueStats.CPBL.live +
    leagueStats.MLB.live +
    leagueStats.NPB.live +
    leagueStats.KBO.live;

  const hasAutoRefreshTarget = totalGamesToday > 0 || totalLiveToday > 0;
  const autoRefreshMs = totalLiveToday > 0 ? AUTO_REFRESH_LIVE_MS : AUTO_REFRESH_GAMES_MS;

  useEffect(() => {
    if (!hasAutoRefreshTarget) return;

    const timer = setInterval(() => {
      loadHomeData({ silent: true });
    }, autoRefreshMs);

    return () => {
      clearInterval(timer);
    };
  }, [autoRefreshMs, hasAutoRefreshTarget, loadHomeData]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        loadHomeData({ silent: true });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadHomeData]);

  function openLeague(league: LeagueKey) {
    router.push(buildLeagueHref(league, league === 'MLB' ? mlbTodayKey : todayKey));
  }

  function handleSeeMore() {
    router.push(`/events/pro?date=${todayKey}`);
  }


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Animated.View style={[styles.brandLogoGlow, { transform: [{ scale: logoPulse }] }]}>
              <Image
                source={require('../../assets/brand/yaren-one-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </Animated.View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>BASEBALL CONTROL ROOM</Text>
              <Text style={styles.heroTitle}>野人1號</Text>
              <Text style={styles.heroSubtitle}>台灣棒球即時情報站</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <Text style={styles.heroDesc}>
            整合 CPBL、MLB、NPB、KBO 每日賽程、比賽中戰況與旅外球員動態。
          </Text>
        </View>

        <TrackedAbroadSection />

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>今日總場次 {totalGamesToday}</Text>
            </View>
            <View style={[styles.summaryPill, styles.summaryPillLive]}>
              <Text style={styles.summaryPillText}>
                LIVE {totalLiveToday}{hasAutoRefreshTarget ? ` · ${autoRefreshMs / 1000}s 自動更新` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.summaryMiniRow}>
            <Text style={styles.summaryMiniText}>CPBL {leagueStats.CPBL.total} 場</Text>
            <Text style={styles.summaryMiniDivider}>·</Text>
            <Text style={styles.summaryMiniText}>MLB {leagueStats.MLB.total} 場</Text>
            <Text style={styles.summaryMiniDivider}>·</Text>
            <Text style={styles.summaryMiniText}>NPB {leagueStats.NPB.total} 場</Text>
            <Text style={styles.summaryMiniDivider}>·</Text>
            <Text style={styles.summaryMiniText}>KBO {leagueStats.KBO.total} 場</Text>
          </View>
        </View>

        {liveGames.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔴 目前比賽中</Text>
            </View>

            {visibleLiveGames.map((item, index) => (
              <View key={`live-${item.league}-${item.game.id}-${index}`} style={styles.featuredWrap}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => openLeague(item.league)}>
                  <ScoreboardCard
                    status={item.game.status}
                    venue={item.game.venue}
                    awayTeam={item.game.awayTeam}
                    homeTeam={item.game.homeTeam}
                    awayScore={item.game.awayScore}
                    homeScore={item.game.homeScore}
                    innings={item.game.innings}
                    awayLine={item.game.awayLine}
                    homeLine={item.game.homeLine}
                    footerLeft={item.game.footerLeft}
                    footerRight={item.game.footerRight}
                  />
                </TouchableOpacity>
              </View>
            ))}

            {hasMoreLiveGames && (
              <TouchableOpacity
                style={styles.expandLiveButton}
                activeOpacity={0.85}
                onPress={() => setShowAllLiveGames((value) => !value)}
              >
                <Text style={styles.expandLiveButtonText}>
                  {showAllLiveGames ? '收合比賽中' : `展開全部 ${liveGames.length} 場 LIVE`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>今日焦點賽事</Text>

          <View style={styles.sectionActions}>
            <TouchableOpacity
              style={styles.seeMoreButton}
              activeOpacity={0.85}
              onPress={handleSeeMore}
            >
              <Text style={styles.seeMoreButtonText}>查看更多</Text>
            </TouchableOpacity>
          </View>
        </View>



        {loading ? (
          <AppLoadingState text="載入今日焦點中…" />
        ) : displayedGames.length === 0 ? (
          <AppEmptyState
            title="這個分類今天沒有焦點賽事"
            description="換個聯盟篩選看看，或稍後再回來更新。"
            icon="calendar-outline"
            compact
          />
        ) : (
          displayedGames.map((item, index) => (
            <View key={`${item.league}-${item.game.id}-${index}`} style={styles.featuredWrap}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => openLeague(item.league)}>
                <ScoreboardCard
                  status={item.game.status}
                  venue={item.game.venue}
                  awayTeam={item.game.awayTeam}
                  homeTeam={item.game.homeTeam}
                  awayScore={item.game.awayScore}
                  homeScore={item.game.homeScore}
                  innings={item.game.innings}
                  awayLine={item.game.awayLine}
                  homeLine={item.game.homeLine}
                  footerLeft={item.game.footerLeft}
                  footerRight={item.game.footerRight}
                />
              </TouchableOpacity>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#061124',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 28,
  },

  heroCard: {
    backgroundColor: '#071226',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#20304a',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  brandLogoGlow: {
    width: 92,
    height: 92,
    marginRight: 12,
    borderRadius: 28,
    shadowColor: '#f97316',
    shadowOpacity: 0.34,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  heroEyebrow: {
    color: '#60a5fa',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 33,
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: '#aab6ca',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#1f2d45',
    marginTop: 12,
    marginBottom: 10,
  },
  heroDesc: {
    color: '#c7d2e5',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
  },

  summaryCard: {
    backgroundColor: '#071226',
    borderWidth: 1,
    borderColor: '#20304a',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryPill: {
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryPillLive: {
    backgroundColor: '#3b1016',
    borderColor: '#ef4444',
  },
  summaryPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryMiniText: {
    color: '#aab6ca',
    fontSize: 10,
    fontWeight: '700',
  },
  summaryMiniDivider: {
    color: '#5f6d88',
    fontSize: 10,
    marginHorizontal: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeMoreButton: {
    backgroundColor: '#22304a',
    borderWidth: 1,
    borderColor: '#41506e',
    borderRadius: 20,
    minWidth: 86,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreButtonText: {
    color: '#dce6f7',
    fontSize: 11,
    fontWeight: '800',
  },
  // removed: refreshButton, refreshButtonText, filterRow, filterChip, filterChipActive, filterChipText, filterChipTextActive

  featuredWrap: {
    marginBottom: 10,
  },
  expandLiveButton: {
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  expandLiveButtonText: {
    color: '#dbeafe',
    fontSize: 11,
    fontWeight: '900',
  },
  // removed: leagueTagRow, leagueTag, leagueTagText

});
