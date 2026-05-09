import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { abroadPlayers as seedAbroadPlayers } from '../../../data/abroadPlayers';
import { useAbroadLiveData } from '../../../hooks/useAbroadLiveData';
import AppLoadingState from '../../../components/AppLoadingState';
import AppEmptyState from '../../../components/AppEmptyState';
import AbroadPlayerAvatar from '../../../components/AbroadPlayerAvatar';
import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../../store/abroadFavorites';

import {
  type AbroadPlayerLike,
  formatAbroadHandLine,
  formatAbroadLevelLine,
  formatAbroadSyncLabel,
  formatAbroadTeamLine,
  getAbroadPlayerStatus,
  mergeAbroadPlayerViewModels,
  normalizeAbroadPlayerId,
} from '../../../lib/viewModels/abroadPlayerViewModel';



function openExternalUrl(url?: string) {
  if (!url) return;
  WebBrowser.openBrowserAsync(url);
}

export default function AbroadPlayerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = normalizeAbroadPlayerId(params.id);

  const {
    players: livePlayers,
    updatedAt,
    loading,
    refreshing,
    error,
    isUsingFallback,
    refresh,
  } = useAbroadLiveData();

  const { isFavorite, isHydrated } = useAbroadFavorites();

  const goBackToAbroadList = () => {
    router.replace('/(tabs)/abroad');
  };

  const mergedPlayers = useMemo(
    () =>
      mergeAbroadPlayerViewModels(
        seedAbroadPlayers as AbroadPlayerLike[],
        livePlayers as AbroadPlayerLike[]
      ),
    [livePlayers]
  );

  const currentIndex = useMemo(
    () => mergedPlayers.findIndex((player) => normalizeAbroadPlayerId(player.id) === routeId),
    [mergedPlayers, routeId]
  );

  const player = currentIndex >= 0 ? mergedPlayers[currentIndex] : null;
  const prevPlayer = currentIndex > 0 ? mergedPlayers[currentIndex - 1] : null;
  const nextPlayer =
    currentIndex >= 0 && currentIndex < mergedPlayers.length - 1
      ? mergedPlayers[currentIndex + 1]
      : null;

  const favorite = player ? isFavorite(player.id) : false;
  const syncLabel = formatAbroadSyncLabel(updatedAt, isUsingFallback);

  if (loading && mergedPlayers.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppLoadingState text="正在讀取球員資料..." variant="screen" />
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

  if (!player) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.85}
              onPress={goBackToAbroadList}
            >
              <Ionicons name="chevron-back" size={24} color="#eaf2ff" />
            </TouchableOpacity>
          </View>

          <AppEmptyState
            title="找不到這位球員"
            description="可能是最新資料尚未同步完成，或路由 id 不一致。"
            icon="alert-circle-outline"
            compact
          />

          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={goBackToAbroadList}
            >
              <Text style={styles.primaryBtnText}>回旅外列表</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.88}
              onPress={() => refresh()}
            >
              <Text style={styles.secondaryBtnText}>重新同步</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const officialUrl = player.officialPlayerUrl;
  const newsItems = player.news ?? [];
  const recentGames = player.recentGames ?? [];
  const pitcherStats = player.seasonStats?.pitcher;
  const hitterStats = player.seasonStats?.hitter;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.85}
            onPress={goBackToAbroadList}
          >
            <Ionicons name="chevron-back" size={24} color="#eaf2ff" />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>球員詳情</Text>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.85}
              onPress={() => refresh()}
              disabled={refreshing}
            >
              <Ionicons
                name="refresh-outline"
                size={22}
                color={refreshing ? '#6f829f' : '#eaf2ff'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.85}
              onPress={() => router.push(`/abroad/news?playerId=${player.id}`)}
            >
              <Ionicons name="newspaper-outline" size={22} color="#eaf2ff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.syncRow}>
          <View style={[styles.syncBadge, isUsingFallback && styles.syncBadgeFallback]}>
            <Text style={styles.syncBadgeText}>{syncLabel}</Text>
          </View>
          {error ? <Text style={styles.syncError}>同步失敗，先顯示本機資料</Text> : null}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <AbroadPlayerAvatar
              name={player.name}
              team={player.team}
              league={player.league}
              level={player.level}
              teamCode={player.teamMeta?.code ?? player.teamMeta?.abbreviation}
              logoKey={player.teamMeta?.logoKey}
              photoUri={player.officialPhotoUrl}
              teamColor={player.teamColor}
              size={92}
              textSize={30}
              borderRadius={28}
            />

            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.age ? (
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageBadgeText}>{player.age}歲</Text>
                  </View>
                ) : null}
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{getAbroadPlayerStatus(player)}</Text>
                </View>
              </View>

              <Text style={styles.playerEnName}>{player.enName ?? ''}</Text>
              <Text style={styles.heroMeta}>{`#${player.number ?? '—'} • ${formatAbroadTeamLine(player)}`}</Text>
              <Text style={styles.heroMeta}>{formatAbroadLevelLine(player)}</Text>
              <Text style={styles.heroMeta}>{formatAbroadHandLine(player)}</Text>
            </View>
          </View>


          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.actionBtn, favorite && styles.actionBtnActive]}
              activeOpacity={0.88}
              onPress={() => toggleAbroadFavorite(player.id)}
            >
              <Ionicons
                name={favorite ? 'star' : 'star-outline'}
                size={20}
                color={favorite ? '#fbbf24' : '#cfe0ff'}
              />
              <Text style={styles.actionBtnText}>
                {favorite ? ' 已收藏球員' : ' 收藏球員'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              activeOpacity={0.88}
              onPress={() => router.push(`/abroad/news?playerId=${player.id}`)}
            >
              <Ionicons name="newspaper-outline" size={20} color="#eef5ff" />
              <Text style={styles.actionBtnTextPrimary}> 相關新聞</Text>
            </TouchableOpacity>
          </View>
        </View>


        <Section
          title="近期觀察"
          rightText={officialUrl ? '球員官網' : undefined}
          onPressRight={officialUrl ? () => openExternalUrl(officialUrl) : undefined}
        >
          <View style={styles.infoBox}>
            {pitcherStats ? (
              <Text style={styles.infoText}>
                本季目前 ERA {pitcherStats.era ?? '—'} / WHIP {pitcherStats.whip ?? '—'} /{' '}
                {pitcherStats.ip ?? '—'} 局 / {pitcherStats.so ?? '—'}K。
              </Text>
            ) : null}

            {hitterStats ? (
              <Text style={styles.infoText}>
                本季目前 AVG {hitterStats.avg ?? '—'} / OBP {hitterStats.obp ?? '—'} / SLG{' '}
                {hitterStats.slg ?? '—'} / OPS {hitterStats.ops ?? '—'}。
              </Text>
            ) : null}

          </View>
        </Section>



        <Section title="比賽紀錄整理" rightText={recentGames.length ? '近期追蹤' : undefined}>
          {recentGames.length > 0 ? (
            recentGames.slice(0, 5).map((game, index) => (
              <View key={`${game.date ?? 'game'}-${index}`} style={styles.gameCard}>
                <View style={styles.gameTop}>
                  <Text style={styles.gameDate}>{game.date ?? '—'}</Text>
                  <Text style={styles.gameResult}>{game.result ?? '—'}</Text>
                </View>
                <Text style={styles.gameLine}>{game.opponent ?? '—'}</Text>
                {game.detail1 ? <Text style={styles.gameSub}>{game.detail1}</Text> : null}
                {game.detail2 ? <Text style={styles.gameSub}>{game.detail2}</Text> : null}
              </View>
            ))
          ) : (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>目前尚未同步到近 5 場內容。</Text>
            </View>
          )}
        </Section>

        <Section
          title="新聞異動"
          rightText={newsItems.length ? '相關新聞' : undefined}
          onPressRight={() => router.push(`/abroad/news?playerId=${player.id}`)}
        >
          {newsItems.length > 0 ? (
            newsItems.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={item.id ?? `${player.id}-news-${index}`}
                style={styles.newsCard}
                activeOpacity={item.url ? 0.88 : 1}
                onPress={() => openExternalUrl(item.url)}
                disabled={!item.url}
              >
                <View style={styles.newsTop}>
                  <View style={styles.newsTag}>
                    <Text style={styles.newsTagText}>{item.tag ?? '新聞'}</Text>
                  </View>
                  <Text style={styles.newsDate}>{item.date ?? '—'}</Text>
                </View>

                <Text style={styles.newsTitle}>{item.title ?? '未命名新聞'}</Text>

                {item.summary ? <Text style={styles.newsSummary}>{item.summary}</Text> : null}

                <Text style={styles.newsSource}>
                  {item.source ?? '來源未標示'}
                  {item.url ? ' • 點擊查看' : ''}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>目前尚未同步到相關新聞。</Text>
            </View>
          )}
        </Section>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navCard, !prevPlayer && styles.navCardDisabled]}
            activeOpacity={0.88}
            disabled={!prevPlayer}
            onPress={() => prevPlayer && router.replace(`/abroad/${prevPlayer.id}`)}
          >
            <Text style={styles.navLabel}>上一位球員</Text>
            <Text style={styles.navName}>{prevPlayer?.name ?? '已經是第一位'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navCard, !nextPlayer && styles.navCardDisabled]}
            activeOpacity={0.88}
            disabled={!nextPlayer}
            onPress={() => nextPlayer && router.replace(`/abroad/${nextPlayer.id}`)}
          >
            <Text style={styles.navLabel}>下一位球員</Text>
            <Text style={styles.navName}>{nextPlayer?.name ?? '已經是最後一位'}</Text>
          </TouchableOpacity>
        </View>

        <Section title="重點追蹤">
          <View style={styles.gridRow}>
            <MiniCard
              title="角色焦點"
              value={player.line1 ?? '待更新'}
              subValue={player.line2 ?? '—'}
              accent
            />
            <MiniCard
              title="官方隊別"
              value={player.team ?? '—'}
              subValue={player.teamMeta?.code ?? player.teamMeta?.abbreviation ?? '—'}
            />
            <MiniCard
              title="下場同步"
              value={player.nextGame?.status ?? getAbroadPlayerStatus(player)}
              subValue={player.nextGame?.date ?? '—'}
            />
          </View>

          {player.recentNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>{player.name}專屬觀察</Text>
              <Text style={styles.noteText}>{player.recentNote}</Text>
            </View>
          ) : null}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  rightText,
  onPressRight,
}: {
  title: string;
  children: React.ReactNode;
  rightText?: string;
  onPressRight?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightText ? (
          <TouchableOpacity activeOpacity={0.85} onPress={onPressRight}>
            <Text style={styles.sectionRight}>{rightText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function MiniCard({
  title,
  value,
  subValue,
  accent,
}: {
  title: string;
  value: string;
  subValue?: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.miniCard, accent && styles.miniCardAccent]}>
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={styles.miniValue}>{value}</Text>
      {subValue ? <Text style={styles.miniSub}>{subValue}</Text> : null}
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09111f',
  },
  screen: {
    flex: 1,
    backgroundColor: '#09111f',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    color: '#f8fbff',
    fontSize: 22,
    fontWeight: '900',
  },
  iconBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1d2b42',
    backgroundColor: '#101a29',
    alignItems: 'center',
    justifyContent: 'center',
  },

  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  syncBadge: {
    borderRadius: 999,
    backgroundColor: '#143768',
    borderWidth: 1,
    borderColor: '#2a5ea1',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  syncBadgeFallback: {
    backgroundColor: '#3b2506',
    borderColor: '#7c5b17',
  },
  syncBadgeText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '800',
  },
  syncError: {
    marginLeft: 10,
    color: '#fda4af',
    fontSize: 12,
    fontWeight: '700',
  },

  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1c2d47',
    backgroundColor: '#101a29',
    padding: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  playerName: {
    color: '#f8fbff',
    fontSize: 28,
    fontWeight: '900',
  },
  statusBadge: {
    marginLeft: 10,
    borderRadius: 999,
    backgroundColor: '#7a5200',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: '#ffe59a',
    fontSize: 12,
    fontWeight: '900',
  },
  ageBadge: {
    marginLeft: 10,
    borderRadius: 999,
    backgroundColor: '#12294a',
    borderWidth: 1,
    borderColor: '#2457a7',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ageBadgeText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: '900',
  },
  playerEnName: {
    marginTop: 4,
    color: '#b7c8e6',
    fontSize: 15,
    fontWeight: '700',
  },
  heroMeta: {
    marginTop: 6,
    color: '#9cb1ce',
    fontSize: 14,
    fontWeight: '700',
  },
  introText: {
    marginTop: 16,
    color: '#eef5ff',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  heroActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#284b83',
    backgroundColor: '#0f1b2f',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionBtnActive: {
    backgroundColor: '#3b2b05',
    borderColor: '#8a6919',
  },
  actionBtnPrimary: {
    marginLeft: 12,
    backgroundColor: '#2457a7',
    borderColor: '#2457a7',
  },
  actionBtnText: {
    color: '#d8e7ff',
    fontSize: 14,
    fontWeight: '800',
  },
  actionBtnTextPrimary: {
    color: '#eef5ff',
    fontSize: 14,
    fontWeight: '900',
  },

  navRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  navCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#18273c',
    backgroundColor: '#0f1827',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  navCardDisabled: {
    opacity: 0.45,
  },
  navLabel: {
    color: '#7f93b0',
    fontSize: 13,
    fontWeight: '700',
  },
  navName: {
    marginTop: 6,
    color: '#f8fbff',
    fontSize: 15,
    fontWeight: '900',
  },

  section: {
    marginBottom: 18,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionRight: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '800',
  },

  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    minHeight: 148,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#173158',
    backgroundColor: '#0f1a2d',
    padding: 14,
  },
  miniCardAccent: {
    backgroundColor: '#241d05',
    borderColor: '#8a6919',
  },
  miniTitle: {
    color: '#8db3ea',
    fontSize: 13,
    fontWeight: '800',
  },
  miniValue: {
    marginTop: 14,
    color: '#f7fbff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 28,
  },
  miniSub: {
    marginTop: 8,
    color: '#a7bbd8',
    fontSize: 13,
    fontWeight: '700',
  },

  noteBox: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1a355f',
    backgroundColor: '#0e1829',
    padding: 16,
  },
  noteTitle: {
    color: '#f8fbff',
    fontSize: 15,
    fontWeight: '900',
  },
  noteText: {
    marginTop: 10,
    color: '#aebfda',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },

  infoBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1a355f',
    backgroundColor: '#101a29',
    padding: 16,
  },
  infoText: {
    color: '#d7e4f7',
    fontSize: 15,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 8,
  },


  gameCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c2d47',
    backgroundColor: '#101a29',
    padding: 14,
    marginBottom: 10,
  },
  gameTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gameDate: {
    color: '#7fa0cf',
    fontSize: 12,
    fontWeight: '800',
  },
  gameResult: {
    color: '#9ec5ff',
    fontSize: 12,
    fontWeight: '800',
  },
  gameLine: {
    color: '#f5f9ff',
    fontSize: 15,
    fontWeight: '900',
  },
  gameSub: {
    marginTop: 6,
    color: '#a8bdd8',
    fontSize: 13,
    fontWeight: '700',
  },

  newsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1c2d47',
    backgroundColor: '#101a29',
    padding: 14,
    marginBottom: 10,
  },
  newsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTag: {
    borderRadius: 999,
    backgroundColor: '#7a5200',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newsTagText: {
    color: '#ffe59a',
    fontSize: 11,
    fontWeight: '900',
  },
  newsDate: {
    color: '#8ca5c7',
    fontSize: 12,
    fontWeight: '800',
  },
  newsTitle: {
    marginTop: 12,
    color: '#f6fbff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 26,
  },
  newsSummary: {
    marginTop: 8,
    color: '#b1c3dd',
    fontSize: 14,
    lineHeight: 24,
    fontWeight: '600',
  },
  newsSource: {
    marginTop: 10,
    color: '#79a8f5',
    fontSize: 12,
    fontWeight: '800',
  },

  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtn: {
    minWidth: 128,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2457a7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: '#eef5ff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryBtn: {
    minWidth: 128,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#234374',
    backgroundColor: '#0f1b2f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginLeft: 10,
  },
  secondaryBtnText: {
    color: '#d8e7ff',
    fontSize: 14,
    fontWeight: '800',
  },
});
