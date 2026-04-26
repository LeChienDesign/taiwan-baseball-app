import AppLoadingState from '../../components/AppLoadingState';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { abroadPlayers, type PlayerStatus } from '../../data/abroadPlayers';
import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../store/abroadFavorites';

const tabs = ['總覽', '比賽紀錄', '新聞異動', '生涯'] as const;
type DetailTab = (typeof tabs)[number];

export default function AbroadPlayerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('總覽');
  const { isFavorite, isHydrated } = useAbroadFavorites();

  const player = useMemo(
    () => abroadPlayers.find((item) => item.id === id),
    [id]
  );

  if (!player) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundWrap}>
          <Ionicons name="alert-circle-outline" size={42} color="#60a5fa" />
          <Text style={styles.notFoundTitle}>找不到這位球員</Text>
          <Text style={styles.notFoundText}>
            可能是資料尚未建立，或路由 id 不正確。
          </Text>
          <TouchableOpacity style={styles.backMainBtn} onPress={() => router.back()}>
            <Text style={styles.backMainBtnText}>返回上一頁</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isHydrated) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLoadingState text="正在讀取收藏資料..." variant="screen" />
    </SafeAreaView>
  );
}

  const favorite = isFavorite(player.id);
  const isHitter = player.type === 'hitter';
  const hitterStats = player.seasonStats.hitter;
  const pitcherStats = player.seasonStats.pitcher;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#eaf2ff" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>球員詳情</Text>

          <TouchableOpacity style={styles.topBarBtn}>
            <Ionicons name="share-social-outline" size={18} color="#eaf2ff" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={[styles.avatarLarge, { backgroundColor: player.teamColor }]}>
              <Text style={styles.avatarText}>{player.name.slice(0, 1)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{player.name}</Text>
                <StatusBadge status={player.status} />
              </View>

              <Text style={styles.heroEnName}>{player.enName}</Text>
              <Text style={styles.heroMeta}>
                #{player.number}・{player.team}・{player.league} {player.level}
              </Text>
              <Text style={styles.heroMeta}>
                {player.position}・{player.throws}投 / {player.bats}打・{player.age} 歲
              </Text>
            </View>
          </View>

          <Text style={styles.heroIntro}>{player.intro}</Text>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Ionicons name="notifications-outline" size={16} color="#eaf2ff" />
              <Text style={styles.primaryBtnText}>追蹤通知</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                favorite && styles.secondaryBtnActive,
              ]}
              onPress={() => toggleAbroadFavorite(player.id)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={favorite ? 'star' : 'star-outline'}
                size={16}
                color={favorite ? '#fbbf24' : '#9ec5ff'}
              />
              <Text
                style={[
                  styles.secondaryBtnText,
                  favorite && styles.secondaryBtnTextActive,
                ]}
              >
                {favorite ? '已收藏球員' : '收藏球員'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {player.nextGame ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>下場比賽</Text>
              <Text style={styles.sectionHint}>{player.nextGame.venue}</Text>
            </View>

            <View style={styles.nextGameRow}>
              <View style={styles.nextGameMain}>
                <Text style={styles.nextGameDate}>{player.nextGame.date}</Text>
                <Text style={styles.nextGameOpponent}>{player.nextGame.opponent}</Text>
                <Text style={styles.nextGameStatus}>{player.nextGame.status}</Text>
              </View>

              <View style={styles.nextGameIconBox}>
                <Ionicons name="calendar-outline" size={20} color="#60a5fa" />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>本季數據</Text>
            <Text style={styles.sectionHint}>{player.level}</Text>
          </View>

          {isHitter && hitterStats ? (
            <>
              <View style={styles.statsGrid}>
                <StatBox label="AVG" value={hitterStats.avg} />
                <StatBox label="OBP" value={hitterStats.obp} />
                <StatBox label="SLG" value={hitterStats.slg} />
                <StatBox label="OPS" value={hitterStats.ops} />
              </View>

              <View style={styles.statsGrid}>
                <StatBox label="HR" value={String(hitterStats.hr)} />
                <StatBox label="RBI" value={String(hitterStats.rbi)} />
                <StatBox label="SB" value={String(hitterStats.sb)} />
                <StatBox label="H" value={String(hitterStats.hits)} />
              </View>
            </>
          ) : null}

          {!isHitter && pitcherStats ? (
            <>
              <View style={styles.statsGrid}>
                <StatBox label="ERA" value={pitcherStats.era} />
                <StatBox label="WHIP" value={pitcherStats.whip} />
                <StatBox label="IP" value={pitcherStats.ip} />
                <StatBox label="SO" value={String(pitcherStats.so)} />
              </View>

              <View style={styles.statsGrid}>
                <StatBox label="BB" value={String(pitcherStats.bb)} />
                <StatBox label="W" value={String(pitcherStats.wins)} />
                <StatBox label="SV" value={String(pitcherStats.saves)} />
                <StatBox label="角色" value="SP" />
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>近期觀察</Text>
            <Text style={styles.sectionHint}>最近 5 場</Text>
          </View>
          <Text style={styles.bodyText}>{player.recentNote}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((tab) => {
            const active = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === '總覽' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>總覽</Text>

            <View style={styles.overviewList}>
              <OverviewRow label="目前狀態" value={player.status} />
              <OverviewRow
                label="所屬球隊"
                value={`${player.team} / ${player.league} ${player.level}`}
              />
              <OverviewRow label="守備 / 角色" value={player.position} />
              <OverviewRow
                label="投打習慣"
                value={`${player.throws}投 / ${player.bats}打`}
              />
              <OverviewRow label="年齡" value={`${player.age} 歲`} />
              <OverviewRow label="個人摘要" value={player.intro} multiline />
            </View>
          </View>
        ) : null}

        {activeTab === '比賽紀錄' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>近期比賽紀錄</Text>

            <View style={styles.gameLogWrap}>
              {player.recentGames.length > 0 ? (
                player.recentGames.map((game, index) => (
                  <View
                    key={`${game.date}-${index}`}
                    style={[
                      styles.gameLogCard,
                      index !== player.recentGames.length - 1 && styles.gameLogCardMargin,
                    ]}
                  >
                    <View style={styles.gameLogTop}>
                      <Text style={styles.gameLogDate}>{game.date}</Text>
                      <Text style={styles.gameLogResult}>{game.result}</Text>
                    </View>

                    <Text style={styles.gameLogOpponent}>{game.opponent}</Text>
                    <Text style={styles.gameLogDetail}>{game.detail1}</Text>
                    <Text style={styles.gameLogSubDetail}>{game.detail2}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>目前還沒有比賽紀錄。</Text>
              )}
            </View>
          </View>
        ) : null}

        {activeTab === '新聞異動' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>新聞與異動</Text>

            <View style={styles.newsWrap}>
              {player.news.length > 0 ? (
                player.news.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.newsCard,
                      index !== player.news.length - 1 && styles.newsCardMargin,
                    ]}
                  >
                    <View style={styles.newsTop}>
                      <Text style={styles.newsTag}>{item.tag}</Text>
                      <Text style={styles.newsDate}>{item.date}</Text>
                    </View>

                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text style={styles.newsSummary}>{item.summary}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>目前還沒有新聞異動。</Text>
              )}
            </View>
          </View>
        ) : null}

        {activeTab === '生涯' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>生涯歷程</Text>

            <View style={styles.careerWrap}>
              {player.career.length > 0 ? (
                player.career.map((item, index) => (
                  <View
                    key={`${item.year}-${index}`}
                    style={[
                      styles.careerCard,
                      index !== player.career.length - 1 && styles.careerCardMargin,
                    ]}
                  >
                    <View style={styles.careerYearBox}>
                      <Text style={styles.careerYear}>{item.year}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.careerTeam}>
                        {item.team}・{item.level}
                      </Text>
                      <Text style={styles.careerNote}>{item.note}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>目前還沒有生涯資料。</Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OverviewRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={[styles.overviewRow, multiline && styles.overviewRowMulti]}>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={[styles.overviewValue, multiline && styles.overviewValueMulti]}>
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: PlayerStatus }) {
  const map = {
    今日出賽: { bg: '#0b2a4d', color: '#60a5fa' },
    預告先發: { bg: '#3a2306', color: '#fbbf24' },
    已完賽: { bg: '#0b2f1f', color: '#34d399' },
    傷兵: { bg: '#3b1111', color: '#f87171' },
    待命: { bg: '#1c2435', color: '#94a3b8' },
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: map[status].bg }]}>
      <Text style={[styles.statusBadgeText, { color: map[status].color }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09111f',
  },
  container: {
    flex: 1,
    backgroundColor: '#09111f',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 120,
  },

  topBar: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#121c2c',
    borderWidth: 1,
    borderColor: '#1b2940',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#f8fbff',
    fontSize: 17,
    fontWeight: '800',
  },

  heroCard: {
    backgroundColor: '#111b2a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 16,
    marginBottom: 14,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#09111f',
    fontSize: 30,
    fontWeight: '900',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    color: '#f8fbff',
    fontSize: 24,
    fontWeight: '900',
  },
  heroEnName: {
    marginTop: 4,
    color: '#9fb4d2',
    fontSize: 13,
    fontWeight: '600',
  },
  heroMeta: {
    marginTop: 5,
    color: '#8da2c0',
    fontSize: 12,
    fontWeight: '600',
  },
  heroIntro: {
    marginTop: 16,
    color: '#dbe7ff',
    fontSize: 13,
    lineHeight: 20,
  },
  heroActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#1f4f93',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryBtnText: {
    color: '#eef5ff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#27405f',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnActive: {
    backgroundColor: '#2f240a',
    borderColor: '#6d5412',
  },
  secondaryBtnText: {
    color: '#9ec5ff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtnTextActive: {
    color: '#fbbf24',
  },

  sectionCard: {
    backgroundColor: '#111b2a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 16,
    marginBottom: 14,
  },
  sectionTitleRow: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHint: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },

  nextGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextGameMain: {
    flex: 1,
    paddingRight: 12,
  },
  nextGameDate: {
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '900',
  },
  nextGameOpponent: {
    marginTop: 6,
    color: '#dbe7ff',
    fontSize: 14,
    fontWeight: '700',
  },
  nextGameStatus: {
    marginTop: 8,
    color: '#8da2c0',
    fontSize: 12,
    lineHeight: 18,
  },
  nextGameIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#0d1625',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#1a2b45',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statValue: {
    color: '#f8fbff',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 5,
    color: '#8da2c0',
    fontSize: 11,
    fontWeight: '700',
  },

  bodyText: {
    color: '#dbe7ff',
    fontSize: 13,
    lineHeight: 21,
  },

  tabRow: {
    paddingBottom: 6,
    gap: 8,
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
  },
  tabChipActive: {
    backgroundColor: '#173057',
    borderColor: '#28528f',
  },
  tabChipText: {
    color: '#9db0c9',
    fontSize: 12,
    fontWeight: '800',
  },
  tabChipTextActive: {
    color: '#e8f2ff',
  },

  overviewList: {
    gap: 12,
    marginTop: 14,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2639',
  },
  overviewRowMulti: {
    alignItems: 'flex-start',
  },
  overviewLabel: {
    width: 88,
    color: '#7f95b4',
    fontSize: 12,
    fontWeight: '700',
  },
  overviewValue: {
    flex: 1,
    color: '#e6eefc',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  overviewValueMulti: {
    textAlign: 'left',
    lineHeight: 20,
  },

  gameLogWrap: {
    marginTop: 14,
  },
  gameLogCard: {
    borderRadius: 16,
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#1a2b45',
    padding: 14,
  },
  gameLogCardMargin: {
    marginBottom: 10,
  },
  gameLogTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameLogDate: {
    color: '#f8fbff',
    fontSize: 14,
    fontWeight: '800',
  },
  gameLogResult: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '800',
  },
  gameLogOpponent: {
    marginTop: 8,
    color: '#dbe7ff',
    fontSize: 13,
    fontWeight: '700',
  },
  gameLogDetail: {
    marginTop: 10,
    color: '#f8fbff',
    fontSize: 14,
    fontWeight: '800',
  },
  gameLogSubDetail: {
    marginTop: 6,
    color: '#8da2c0',
    fontSize: 12,
  },

  newsWrap: {
    marginTop: 14,
  },
  newsCard: {
    borderRadius: 16,
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#1a2b45',
    padding: 14,
  },
  newsCardMargin: {
    marginBottom: 10,
  },
  newsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTag: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#0b2a4d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  newsDate: {
    color: '#8da2c0',
    fontSize: 11,
    fontWeight: '700',
  },
  newsTitle: {
    marginTop: 12,
    color: '#f8fbff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
  newsSummary: {
    marginTop: 8,
    color: '#9bb0cd',
    fontSize: 13,
    lineHeight: 20,
  },

  careerWrap: {
    marginTop: 14,
  },
  careerCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderRadius: 16,
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#1a2b45',
    padding: 14,
  },
  careerCardMargin: {
    marginBottom: 10,
  },
  careerYearBox: {
    width: 62,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#173057',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careerYear: {
    color: '#e8f2ff',
    fontSize: 13,
    fontWeight: '900',
  },
  careerTeam: {
    color: '#f8fbff',
    fontSize: 14,
    fontWeight: '800',
  },
  careerNote: {
    marginTop: 6,
    color: '#9bb0cd',
    fontSize: 13,
    lineHeight: 20,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },

  emptyText: {
    color: '#8da2c0',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
  },

  notFoundWrap: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09111f',
  },
  notFoundTitle: {
    marginTop: 14,
    color: '#f8fbff',
    fontSize: 22,
    fontWeight: '900',
  },
  notFoundText: {
    marginTop: 8,
    color: '#8da2c0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  backMainBtn: {
    marginTop: 18,
    backgroundColor: '#1f4f93',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backMainBtnText: {
    color: '#eef5ff',
    fontSize: 13,
    fontWeight: '800',
  },
});