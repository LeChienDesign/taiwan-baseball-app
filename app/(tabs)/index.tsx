import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import ScoreboardCard from '../../components/ScoreboardCard';
import TrackedAbroadSection from '../../components/TrackedAbroadSection';
import AppLoadingState from '../../components/AppLoadingState';
import AppEmptyState from '../../components/AppEmptyState';

import { useHomeGames, type LeagueKey } from '../../hooks/useHomeGames';
import { buildLeagueHref } from '../../lib/homeGameSelector';


export default function HomePage() {
  const router = useRouter();
  const logoPulse = useRef(new Animated.Value(1)).current;
  const [showAllLiveGames, setShowAllLiveGames] = useState(false);

  const {
    todayKey,
    mlbTodayKey,
    displayedGames,
    liveGames,
    leagueStats,
    loading,
    refreshing,
    refresh,
  } = useHomeGames();



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

  function openLeague(league: LeagueKey) {
    router.push(buildLeagueHref(league, league === 'MLB' ? mlbTodayKey : todayKey) as any);
  }

  function handleSeeMore() {
    router.push(`/events/pro?date=${todayKey}`);
  }


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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
                LIVE {totalLiveToday}
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
            title="未來 12 小時沒有即將開賽的焦點賽事"
            description="目前比賽中會顯示在上方 LIVE 區塊，焦點賽事只顯示即將開賽的比賽。"
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
