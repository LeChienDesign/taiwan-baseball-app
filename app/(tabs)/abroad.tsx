import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { abroadPlayers as seedAbroadPlayers } from '../../data/abroadPlayers';
import { useAbroadLiveData } from '../../hooks/useAbroadLiveData';
import AppLoadingState from '../../components/AppLoadingState';
import AppEmptyState from '../../components/AppEmptyState';
import AbroadPlayerAvatar from '../../components/AbroadPlayerAvatar';
import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../store/abroadFavorites';

import {
  ABROAD_FILTERS,
  type AbroadFilter,
  type AbroadPlayerLike,
  filterAndSortAbroadPlayers,
  formatAbroadHandLine,
  formatAbroadLevelLine,
  formatAbroadSyncLabel,
  formatAbroadTeamLine,
  getAbroadPlayerStatus,
  mergeAbroadPlayerViewModels,
} from '../../lib/viewModels/abroadPlayerViewModel';



export default function AbroadScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<AbroadFilter>('全部');
  const [searchText, setSearchText] = useState('');

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

  const mergedPlayers = useMemo(
    () =>
      mergeAbroadPlayerViewModels(
        seedAbroadPlayers as AbroadPlayerLike[],
        livePlayers as AbroadPlayerLike[]
      ),
    [livePlayers]
  );

  const sortedFilteredPlayers = useMemo(
    () => filterAndSortAbroadPlayers(mergedPlayers, searchText, activeFilter),
    [mergedPlayers, searchText, activeFilter]
  );

  const syncLabel = formatAbroadSyncLabel(updatedAt, isUsingFallback);

  if (loading && mergedPlayers.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppLoadingState text="正在讀取旅外資料..." variant="screen" />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#7fb0ff"
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>旅外球員</Text>
            <Text style={styles.pageSubtitle}>MLB、日職、韓職一次追蹤</Text>
          </View>

          <TouchableOpacity
            style={styles.headerRefreshBtn}
            activeOpacity={0.88}
            onPress={() => refresh()}
            disabled={refreshing}
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color={refreshing ? '#6d83a5' : '#eaf2ff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.syncRow}>
          <View style={[styles.syncBadge, isUsingFallback && styles.syncBadgeFallback]}>
            <Text style={styles.syncBadgeText}>{syncLabel}</Text>
          </View>
          {error ? <Text style={styles.syncError}>同步失敗，先顯示本機資料</Text> : null}
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={22} color="#8ea6c9" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜尋球員、球隊、層級"
            placeholderTextColor="#6f86a7"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {ABROAD_FILTERS.map((filter) => {
            const active = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.88}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>球員列表</Text>
          <Text style={styles.sectionCount}>{sortedFilteredPlayers.length} 位</Text>
        </View>

        {sortedFilteredPlayers.length === 0 ? (
          <AppEmptyState
            title="目前沒有符合條件的球員"
            description="可以試試其他篩選，或清空搜尋關鍵字。"
            icon="search-outline"
            compact
          />
        ) : (
          sortedFilteredPlayers.map((item) => {
            const favorite = isFavorite(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/abroad/${item.id}`)}
              >
                <AbroadPlayerAvatar
                  name={item.name}
                  team={item.team}
                  league={item.league}
                  level={item.level}
                  teamCode={item.teamMeta?.code ?? item.teamMeta?.abbreviation}
                  logoKey={item.teamMeta?.logoKey}
                  photoUri={item.officialPhotoUrl}
                  teamColor={item.teamColor}
                  size={86}
                  textSize={28}
                  borderRadius={26}
                />

                <View style={styles.cardBody}>
                  <View style={styles.nameRow}>
                    <Text style={styles.playerName}>{item.name}</Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{getAbroadPlayerStatus(item)}</Text>
                    </View>
                  </View>

                  <Text style={styles.teamText}>{`#${item.number ?? '—'} • ${formatAbroadTeamLine(item)}`}</Text>
                  <Text style={styles.metaText}>{formatAbroadLevelLine(item)}</Text>
                  <Text style={styles.metaText}>{formatAbroadHandLine(item)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.favoriteBtn}
                  activeOpacity={0.88}
                  onPress={() => toggleAbroadFavorite(item.id)}
                >
                  <Ionicons
                    name={favorite ? 'star' : 'star-outline'}
                    size={24}
                    color={favorite ? '#fbbf24' : '#d5e3fb'}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
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
  screen: {
    flex: 1,
    backgroundColor: '#09111f',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    color: '#f7fbff',
    fontSize: 28,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 4,
    color: '#8ea6c9',
    fontSize: 13,
    fontWeight: '700',
  },
  headerRefreshBtn: {
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
    flexWrap: 'wrap',
    marginBottom: 14,
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

  searchWrap: {
    height: 60,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1a2d48',
    backgroundColor: '#101a29',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#eef5ff',
    fontSize: 18,
    fontWeight: '700',
  },

  filterRow: {
    paddingBottom: 8,
    marginBottom: 8,
  },
  filterChip: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#22324b',
    backgroundColor: '#101a29',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#1f4d92',
    borderColor: '#4277c9',
  },
  filterChipText: {
    color: '#c7d7f0',
    fontSize: 16,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#f4f9ff',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#f8fbff',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionCount: {
    color: '#6cb2ff',
    fontSize: 18,
    fontWeight: '900',
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1c2d47',
    backgroundColor: '#101a29',
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 10,
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
    backgroundColor: '#113b73',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: '#9ec5ff',
    fontSize: 12,
    fontWeight: '900',
  },
  teamText: {
    marginTop: 8,
    color: '#a9bddb',
    fontSize: 16,
    fontWeight: '800',
  },
  metaText: {
    marginTop: 6,
    color: '#d4e2f6',
    fontSize: 16,
    fontWeight: '900',
  },

  favoriteBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#0d182a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
