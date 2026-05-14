import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ImageBackground,
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
import VintagePlayerCard from '../../components/vintage/VintagePlayerCard';
import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../store/abroadFavorites';

import {
  ABROAD_FILTERS,
  type AbroadFilter,
  type AbroadPlayerLike,
  filterAndSortAbroadPlayers,
  formatAbroadSyncLabel,
  mergeAbroadPlayerViewModels,
} from '../../lib/viewModels/abroadPlayerViewModel';

const APP_FONT = 'CityBurn';
const CN_FONT = 'ZaoZiGongFangXingHei';

const abroadImages = {
  paperBg: require('../../assets/yaren_one_icons_png_pack/paper_bg.png'),
};

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
      <ImageBackground
        source={abroadImages.paperBg}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#9B5A30"
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
              color={refreshing ? '#9B7B56' : '#10213D'}
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
          <Ionicons name="search-outline" size={22} color="#9B5A30" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜尋球員、球隊、層級"
            placeholderTextColor="#9B7B56"
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
              <VintagePlayerCard
                key={item.id}
                player={item}
                favorite={favorite}
                onPress={() => router.push(`/abroad/${item.id}`)}
                onToggleFavorite={() => toggleAbroadFavorite(item.id)}
              />
            );
          })
        )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3E1BE',
  },
  backgroundImage: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pageTitle: {
    color: '#10213D',
    fontFamily: CN_FONT,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1,
  },
  pageSubtitle: {
    marginTop: 4,
    color: '#6E5131',
    fontFamily: APP_FONT,
    fontSize: 13,
    fontWeight: '800',
  },
  headerRefreshBtn: {
    width: 48,
    height: 48,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#B77945',
    backgroundColor: 'rgba(255, 248, 232, 0.68)',
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
    borderRadius: 0,
    backgroundColor: 'rgba(255, 248, 232, 0.72)',
    borderWidth: 1,
    borderColor: '#B77945',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  syncBadgeFallback: {
    backgroundColor: 'rgba(179, 109, 49, 0.16)',
    borderColor: '#B77945',
  },
  syncBadgeText: {
    color: '#10213D',
    fontFamily: APP_FONT,
    fontSize: 12,
    fontWeight: '900',
  },
  syncError: {
    marginLeft: 10,
    color: '#9B3D2E',
    fontFamily: CN_FONT,
    fontSize: 12,
    fontWeight: '800',
  },

  searchWrap: {
    height: 54,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#B77945',
    backgroundColor: 'rgba(255, 248, 232, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#10213D',
    fontFamily: CN_FONT,
    fontSize: 16,
    fontWeight: '800',
  },

  filterRow: {
    paddingBottom: 8,
    marginBottom: 8,
  },
  filterChip: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#B77945',
    backgroundColor: 'rgba(255, 248, 232, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#10213D',
    borderColor: '#10213D',
  },
  filterChipText: {
    color: '#6E5131',
    fontFamily: CN_FONT,
    fontSize: 15,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#F8E7C7',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#10213D',
    fontFamily: CN_FONT,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionCount: {
    color: '#9B5A30',
    fontFamily: CN_FONT,
    fontSize: 18,
    fontWeight: '900',
  },
});
