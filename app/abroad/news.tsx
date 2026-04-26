import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAbroadLiveData } from '../../hooks/useAbroadLiveData';
import AppLoadingState from '../../components/AppLoadingState';
import AppEmptyState from '../../components/AppEmptyState';

const filters = ['全部', '官網同步', '先發預告', '今日出賽', '近況', '傷兵'] as const;
type FilterType = (typeof filters)[number];

type AbroadNewsItem = {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  league: string;
  title: string;
  date: string;
  tag: string;
  summary: string;
};

const PAGE_REFRESH_MS = 2 * 60 * 1000;

function toDateValue(date?: string) {
  if (!date) return 0;
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}

function formatUpdatedAt(text: string) {
  if (!text) return '本機資料';

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '已同步';

  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Taipei',
  }).format(date);
}

function isRoleChangeNews(item: {
  id?: string;
  title?: string;
  summary?: string;
  tag?: string;
}) {
  const text = `${item.id ?? ''} ${item.title ?? ''} ${item.summary ?? ''} ${item.tag ?? ''}`.toLowerCase();

  return (
    text.includes('rotation') ||
    text.includes('starting rotation') ||
    text.includes('starter') ||
    text.includes('先發') ||
    text.includes('輪值') ||
    text.includes('轉進輪值') ||
    text.includes('轉先發') ||
    text.includes('role')
  );
}

function sortNews(items: AbroadNewsItem[]) {
  return [...items].sort((a, b) => {
    const aRole = isRoleChangeNews(a);
    const bRole = isRoleChangeNews(b);
    if (aRole !== bRole) return Number(bRole) - Number(aRole);

    const aOfficial = a.tag === '官網同步';
    const bOfficial = b.tag === '官網同步';
    if (aOfficial !== bOfficial) return Number(bOfficial) - Number(aOfficial);

    const dateDiff = toDateValue(b.date) - toDateValue(a.date);
    if (dateDiff !== 0) return dateDiff;

    return a.playerName.localeCompare(b.playerName, 'zh-Hant');
  });
}

export default function AbroadNewsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('全部');
  const [query, setQuery] = useState('');

  const {
    players,
    updatedAt,
    loading,
    refreshing,
    error,
    isUsingFallback,
    refresh,
  } = useAbroadLiveData();

  useFocusEffect(
    useCallback(() => {
      refresh();

      const timer = setInterval(() => {
        refresh();
      }, PAGE_REFRESH_MS);

      return () => {
        clearInterval(timer);
      };
    }, [refresh])
  );

  const newsItems = useMemo<AbroadNewsItem[]>(() => {
    const flattened = players.flatMap((player) =>
      (player.news ?? []).map((item) => ({
        id: item.id,
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        league: player.league,
        title: item.title,
        date: item.date,
        tag: item.tag,
        summary: item.summary,
      }))
    );

    return sortNews(flattened);
  }, [players]);

  const filteredNews = useMemo(() => {
    const q = query.trim().toLowerCase();

    return newsItems.filter((item) => {
      const matchFilter =
        activeFilter === '全部'
          ? true
          : activeFilter === '官網同步'
            ? item.tag === '官網同步'
            : activeFilter === '先發預告'
              ? item.tag === '先發預告'
              : activeFilter === '今日出賽'
                ? item.tag === '今日出賽'
                : activeFilter === '近況'
                  ? item.tag === '近況'
                  : activeFilter === '傷兵'
                    ? item.tag === '傷兵'
                    : true;

      if (!matchFilter) return false;
      if (!q) return true;

      return (
        item.playerName.toLowerCase().includes(q) ||
        item.team.toLowerCase().includes(q) ||
        item.league.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    });
  }, [newsItems, activeFilter, query]);

  const syncLabel = isUsingFallback
    ? '本機資料'
    : updatedAt
      ? `同步 ${formatUpdatedAt(updatedAt)}`
      : '遠端同步';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#eaf2ff" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>旅外新聞</Text>

          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.topBarBtn}
              onPress={() => refresh()}
              activeOpacity={0.85}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#eaf2ff" />
              ) : (
                <Ionicons name="refresh-outline" size={18} color="#eaf2ff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.syncRow}>
          <View style={[styles.syncBadge, isUsingFallback && styles.syncBadgeFallback]}>
            <Text style={styles.syncBadgeText}>{syncLabel}</Text>
          </View>

          {!isUsingFallback ? (
            <View style={styles.autoBadge}>
              <Text style={styles.autoBadgeText}>自動更新</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.syncError}>同步失敗，先顯示本機資料</Text> : null}
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#8da2c0" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="搜尋球員、球隊、新聞標題"
            placeholderTextColor="#6f829f"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearSearchBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={18} color="#8da2c0" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((item) => {
            const active = activeFilter === item;

            return (
              <TouchableOpacity
                key={item}
                onPress={() => setActiveFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最新旅外消息</Text>
          <Text style={styles.sectionHint}>{filteredNews.length} 則</Text>
        </View>

        {loading ? (
          <AppLoadingState text="正在讀取旅外新聞..." />
        ) : filteredNews.length > 0 ? (
          <View style={styles.newsList}>
            {filteredNews.map((item, index) => {
              const pinned = index === 0 && isRoleChangeNews(item);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.newsCard,
                    pinned && styles.newsCardPinned,
                    index !== filteredNews.length - 1 && styles.newsCardMargin,
                  ]}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/abroad/${item.playerId}`)}
                >
                  <View style={styles.newsTop}>
                    <View style={styles.newsTopLeft}>
                      <View style={styles.newsTagWrap}>
                        <Text style={styles.newsTag}>{item.tag}</Text>
                      </View>

                      {pinned ? (
                        <View style={styles.pinnedBadge}>
                          <Text style={styles.pinnedBadgeText}>置頂</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.newsDate}>{item.date}</Text>
                  </View>

                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsMeta}>
                    {item.playerName}・{item.team}・{item.league}
                  </Text>
                  <Text style={styles.newsSummary}>{item.summary}</Text>

                  <View style={styles.newsFooter}>
                    <Text style={styles.newsFooterText}>查看球員頁</Text>
                    <Ionicons name="chevron-forward" size={16} color="#8da2c0" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <AppEmptyState
            title="目前沒有符合條件的旅外新聞"
            description="試著切換分類或更換搜尋關鍵字。"
            icon="newspaper-outline"
            compact
          />
        )}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
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

  syncRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  syncBadge: {
    backgroundColor: '#0b2a4d',
    borderColor: '#28528f',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  syncBadgeFallback: {
    backgroundColor: '#3a2306',
    borderColor: '#775313',
  },
  syncBadgeText: {
    color: '#dcecff',
    fontSize: 11,
    fontWeight: '800',
  },
  autoBadge: {
    backgroundColor: '#0b2f1f',
    borderColor: '#1f7a50',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  autoBadgeText: {
    color: '#8ff0b3',
    fontSize: 11,
    fontWeight: '800',
  },
  syncError: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
  },

  searchBox: {
    marginBottom: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#eef4ff',
    marginLeft: 8,
    fontSize: 14,
  },
  clearSearchBtn: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: {
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
  },
  filterChipActive: {
    backgroundColor: '#173057',
    borderColor: '#28528f',
  },
  filterChipText: {
    color: '#9db0c9',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#dcecff',
  },

  sectionHeader: {
    marginTop: 6,
    marginBottom: 12,
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

  newsList: {
    gap: 12,
  },
  newsCard: {
    borderRadius: 18,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 16,
  },
  newsCardPinned: {
    borderColor: '#6d5412',
    backgroundColor: '#161204',
  },
  newsCardMargin: {
    marginBottom: 12,
  },
  newsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsTagWrap: {
    backgroundColor: '#0b2a4d',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  newsTag: {
    color: '#9ec5ff',
    fontSize: 11,
    fontWeight: '800',
  },
  pinnedBadge: {
    backgroundColor: '#3a2306',
    borderWidth: 1,
    borderColor: '#6d5412',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pinnedBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
  },
  newsDate: {
    color: '#8da2c0',
    fontSize: 11,
    fontWeight: '700',
  },
  newsTitle: {
    marginTop: 12,
    color: '#f8fbff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  newsMeta: {
    marginTop: 8,
    color: '#8da2c0',
    fontSize: 12,
    fontWeight: '600',
  },
  newsSummary: {
    marginTop: 10,
    color: '#dbe7ff',
    fontSize: 13,
    lineHeight: 20,
  },
  newsFooter: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  newsFooterText: {
    color: '#8da2c0',
    fontSize: 12,
    fontWeight: '700',
  },
});