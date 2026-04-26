import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ScoreboardCard from '../../components/ScoreboardCard';
import TrackedAbroadSection from '../../components/TrackedAbroadSection';
import AppLoadingState from '../../components/AppLoadingState';
import AppEmptyState from '../../components/AppEmptyState';

import { fetchMlbGamesByDate } from '../../lib/mlb';
import { fetchCpblMajorGamesByDate } from '../../lib/cpbl-real';
import { fetchNpbGamesByDate } from '../../lib/npb-real';
import { fetchKboGamesByDate } from '../../lib/kbo-real';

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
type LeagueFilter = 'ALL' | LeagueKey;

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

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  return games.filter(hasMeaningfulGameContent).map((game) => ({ league, game }));
}

function buildLeagueStat(games: ScoreboardGame[]) {
  const meaningful = games.filter(hasMeaningfulGameContent);
  return {
    total: meaningful.length,
    live: meaningful.filter((g) => g.status === 'LIVE').length,
  };
}

export default function HomePage() {
  const router = useRouter();
  const todayKey = useMemo(() => getTodayDateKey(), []);

  const [featuredGames, setFeaturedGames] = useState<FeaturedItem[]>([]);
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('ALL');
  const [leagueStats, setLeagueStats] = useState<LeagueStats>({
    CPBL: { total: 0, live: 0 },
    MLB: { total: 0, live: 0 },
    NPB: { total: 0, live: 0 },
    KBO: { total: 0, live: 0 },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);

      const [cpblGames, mlbGames, npbGames, kboGames] = await Promise.all([
        fetchCpblMajorGamesByDate(todayKey).catch(() => []),
        fetchMlbGamesByDate(todayKey).catch(() => []),
        fetchNpbGamesByDate(todayKey).catch(() => []),
        fetchKboGamesByDate(todayKey).catch(() => []),
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
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayKey]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHomeData();
  }, [loadHomeData]);

  const displayedGames = useMemo(() => {
    const filtered =
      leagueFilter === 'ALL'
        ? featuredGames
        : featuredGames.filter((item) => item.league === leagueFilter);

    return filtered.slice(0, 4);
  }, [featuredGames, leagueFilter]);

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

  function openLeague(league: LeagueKey) {
    if (league === 'CPBL') {
      router.push('/league/cpbl-major');
      return;
    }
    if (league === 'MLB') {
      router.push('/league/mlb');
      return;
    }
    if (league === 'NPB') {
      router.push('/league/npb');
      return;
    }
    if (league === 'KBO') {
      router.push('/league/kbo');
      return;
    }
  }

  function handleSeeMore() {
    if (leagueFilter === 'CPBL') {
      router.push('/league/cpbl-major');
      return;
    }
    if (leagueFilter === 'MLB') {
      router.push('/league/mlb');
      return;
    }
    if (leagueFilter === 'NPB') {
      router.push('/league/npb');
      return;
    }
    if (leagueFilter === 'KBO') {
      router.push('/league/kbo');
      return;
    }

    router.push('/events/pro');
  }

  const filterOptions: { key: LeagueFilter; label: string }[] = [
    { key: 'ALL', label: '全部' },
    { key: 'CPBL', label: 'CPBL' },
    { key: 'MLB', label: 'MLB' },
    { key: 'NPB', label: 'NPB' },
    { key: 'KBO', label: 'KBO' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Taiwan Baseball Hub</Text>
              <Text style={styles.heroSubtitle}>台灣棒球總入口</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            從中職、日職、韓職到美職，一個首頁整合每日賽程、焦點比賽與聯盟入口。
          </Text>
        </View>

        <TrackedAbroadSection />

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>今日總場次 {totalGamesToday}</Text>
            </View>
            <View style={[styles.summaryPill, styles.summaryPillLive]}>
              <Text style={styles.summaryPillText}>LIVE {totalLiveToday}</Text>
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

            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.85}
              onPress={onRefresh}
            >
              <Text style={styles.refreshButtonText}>更新</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filterOptions.map((option) => {
            const active = leagueFilter === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.85}
                onPress={() => setLeagueFilter(option.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
              <View style={styles.leagueTagRow}>
                <View style={styles.leagueTag}>
                  <Text style={styles.leagueTagText}>{item.league}</Text>
                </View>
              </View>

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

        <Text style={styles.sectionTitle}>聯盟入口</Text>

        <View style={styles.leagueGrid}>
          <TouchableOpacity
            style={styles.leagueCard}
            activeOpacity={0.88}
            onPress={() => router.push('/league/cpbl-major')}
          >
            <View style={styles.badgesWrap}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{leagueStats.CPBL.total}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE {leagueStats.CPBL.live}</Text>
              </View>
            </View>
            <Image
              source={require('../../assets/league/cpbl.png')}
              style={styles.leagueLogo}
              resizeMode="contain"
            />
            <Text style={styles.leagueCardTitle}>CPBL</Text>
            <Text style={styles.leagueCardSubtitle}>中華職棒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leagueCard}
            activeOpacity={0.88}
            onPress={() => router.push('/league/npb')}
          >
            <View style={styles.badgesWrap}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{leagueStats.NPB.total}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE {leagueStats.NPB.live}</Text>
              </View>
            </View>
            <Image
              source={require('../../assets/league/npb.png')}
              style={styles.leagueLogo}
              resizeMode="contain"
            />
            <Text style={styles.leagueCardTitle}>NPB</Text>
            <Text style={styles.leagueCardSubtitle}>日本職棒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leagueCard}
            activeOpacity={0.88}
            onPress={() => router.push('/league/mlb')}
          >
            <View style={styles.badgesWrap}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{leagueStats.MLB.total}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE {leagueStats.MLB.live}</Text>
              </View>
            </View>
            <Image
              source={require('../../assets/league/mlb.png')}
              style={styles.leagueLogo}
              resizeMode="contain"
            />
            <Text style={styles.leagueCardTitle}>MLB</Text>
            <Text style={styles.leagueCardSubtitle}>美國職棒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leagueCard}
            activeOpacity={0.88}
            onPress={() => router.push('/league/kbo')}
          >
            <View style={styles.badgesWrap}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{leagueStats.KBO.total}</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE {leagueStats.KBO.live}</Text>
              </View>
            </View>
            <Image
              source={require('../../assets/league/kbo.png')}
              style={styles.leagueLogo}
              resizeMode="contain"
            />
            <Text style={styles.leagueCardTitle}>KBO</Text>
            <Text style={styles.leagueCardSubtitle}>韓國職棒</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#020f24',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#283352',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLogo: {
    width: 54,
    height: 54,
    marginRight: 10,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: '#aab6ca',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  heroDesc: {
    color: '#d7e0ee',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 17,
  },

  summaryCard: {
    backgroundColor: '#071536',
    borderWidth: 1,
    borderColor: '#26314d',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryPill: {
    backgroundColor: '#22304a',
    borderWidth: 1,
    borderColor: '#41506e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  summaryPillLive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#b91c1c',
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
  refreshButton: {
    backgroundColor: '#313c5b',
    borderRadius: 20,
    minWidth: 74,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#e6ebf5',
    fontSize: 11,
    fontWeight: '800',
  },

  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#22304a',
    borderWidth: 1,
    borderColor: '#41506e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#72a9ff',
  },
  filterChipText: {
    color: '#dce6f7',
    fontSize: 10,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  featuredWrap: {
    marginBottom: 10,
  },
  leagueTagRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  leagueTag: {
    backgroundColor: '#22304a',
    borderWidth: 1,
    borderColor: '#41506e',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  leagueTagText: {
    color: '#dce6f7',
    fontSize: 10,
    fontWeight: '800',
  },

  leagueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  leagueCard: {
    width: '48.3%',
    backgroundColor: '#121b34',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#283352',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badgesWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'flex-end',
    gap: 4,
  },
  totalBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  liveBadge: {
    minWidth: 46,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  leagueLogo: {
    width: 44,
    height: 44,
    marginBottom: 8,
  },
  leagueCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  leagueCardSubtitle: {
    color: '#aab6ca',
    fontSize: 10,
    fontWeight: '700',
  },
});