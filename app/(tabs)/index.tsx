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
          <View style={styles.heroTicketMetaRow}>
            <Text style={styles.heroTicketMeta}>YAREN ONE BASEBALL</Text>
            <Text style={styles.heroTicketNo}>NO. 01</Text>
          </View>

          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>LIVE LOVE BASEBALL</Text>
              <Text style={styles.heroTitle}>野人1號</Text>
              <Text style={styles.heroSubtitle}>TAIWAN BASEBALL FIELD GUIDE</Text>
            </View>

            <Animated.View style={[styles.brandLogoGlow, { transform: [{ scale: logoPulse }] }]}> 
              <Image
                source={require('../../assets/brand/yaren-one-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottomRow}>
            <View style={styles.heroStamp}>
              <Text style={styles.heroStampText}>GAME DAY</Text>
            </View>
            <Text style={styles.heroDesc}>
              CPBL / MLB / NPB / KBO 即時賽程、Live 戰況與旅外球員動態。
            </Text>
          </View>
        </View>

        <View style={styles.playerWatchWrap}>
          <TrackedAbroadSection />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryLabelRow}>
            <Text style={styles.summaryLabel}>TODAY SCOREBOARD</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillNumber}>{totalGamesToday}</Text>
              <Text style={styles.summaryPillText}>今日場次</Text>
            </View>
            <View style={[styles.summaryPill, styles.summaryPillLive]}>
              <Text style={styles.summaryPillNumber}>{totalLiveToday}</Text>
              <Text style={styles.summaryPillText}>LIVE</Text>
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
              <Text style={styles.sectionTitle}>LIVE GAMES</Text>
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
          <Text style={styles.sectionTitle}>TODAY FOCUS</Text>

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
    backgroundColor: '#F2E4CF',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 34,
  },

  heroCard: {
    backgroundColor: '#FFF7E9',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#0B2346',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 20,
    shadowColor: '#7B4F2A',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTicketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroTicketMeta: {
    color: '#0B2346',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  heroTicketNo: {
    color: '#F0642B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextWrap: {
    flex: 1,
  },
  brandLogoGlow: {
    width: 78,
    height: 78,
    marginLeft: 10,
    borderRadius: 26,
    backgroundColor: '#F0642B',
    borderWidth: 2,
    borderColor: '#0B2346',
    shadowColor: '#F0642B',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  heroEyebrow: {
    color: '#F0642B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#0B2346',
    fontSize: 35,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -1.2,
  },
  heroSubtitle: {
    color: '#2F4668',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 4,
  },
  heroDivider: {
    height: 2,
    backgroundColor: '#0B2346',
    marginTop: 11,
    marginBottom: 9,
    opacity: 0.9,
  },
  playerWatchWrap: {
    marginBottom: 4,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStamp: {
    borderWidth: 2,
    borderColor: '#F0642B',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    transform: [{ rotate: '-4deg' }],
  },
  heroStampText: {
    color: '#F0642B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroDesc: {
    flex: 1,
    color: '#344761',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
  },

  summaryCard: {
    backgroundColor: '#0B2346',
    borderWidth: 2,
    borderColor: '#0B2346',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
    marginBottom: 18,
  },
  summaryLabelRow: {
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#F7D9B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: '#FFF7E9',
    borderWidth: 2,
    borderColor: '#F7D9B8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryPillLive: {
    backgroundColor: '#F0642B',
    borderColor: '#F7D9B8',
  },
  summaryPillNumber: {
    color: '#0B2346',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  summaryPillText: {
    color: '#0B2346',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  summaryMiniText: {
    color: '#F7D9B8',
    fontSize: 10,
    fontWeight: '800',
  },
  summaryMiniDivider: {
    color: '#F0642B',
    fontSize: 10,
    marginHorizontal: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0B2346',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeMoreButton: {
    backgroundColor: '#FFF7E9',
    borderWidth: 2,
    borderColor: '#0B2346',
    borderRadius: 999,
    minWidth: 86,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreButtonText: {
    color: '#0B2346',
    fontSize: 11,
    fontWeight: '900',
  },
  // removed: refreshButton, refreshButtonText, filterRow, filterChip, filterChipActive, filterChipText, filterChipTextActive

  featuredWrap: {
    marginBottom: 10,
  },
  expandLiveButton: {
    backgroundColor: '#FFF7E9',
    borderWidth: 2,
    borderColor: '#0B2346',
    borderRadius: 18,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  expandLiveButtonText: {
    color: '#0B2346',
    fontSize: 11,
    fontWeight: '900',
  },
  // removed: leagueTagRow, leagueTag, leagueTagText

});
