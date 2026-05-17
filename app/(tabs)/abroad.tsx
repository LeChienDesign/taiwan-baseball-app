import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react';
import { useRouter } from 'expo-router';
import {
  FlatList,
  ImageBackground,
  InteractionManager,
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

import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../store/abroadFavorites';

import {
  ABROAD_FILTERS,
  type AbroadFilter,
  type AbroadPlayerLike,
  filterAndSortAbroadPlayers,
  mergeAbroadPlayerViewModels,
} from '../../lib/viewModels/abroadPlayerViewModel';

const APP_FONT = 'CityBurn';
const CN_FONT = 'FangZhengHei';

const abroadImages = {
  paperBg: require('../../assets/yaren_one_icons_png_pack/paper_bg.png'),
};

type VintagePlayerCardComponent = ComponentType<{
  player: AbroadPlayerLike;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}>;

export default function AbroadScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<AbroadFilter>('全部');
  const [searchText, setSearchText] = useState('');
  const [VintagePlayerCard, setVintagePlayerCard] = useState<VintagePlayerCardComponent | null>(null);

  const {
    players: livePlayers,
    loading,
    refreshing,
    refresh,
  } = useAbroadLiveData();

  const { isFavorite, isHydrated } = useAbroadFavorites();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const cardModule = require('../../components/vintage/VintagePlayerCard') as {
        default: VintagePlayerCardComponent;
      };
      setVintagePlayerCard(() => cardModule.default);
    });

    return () => {
      task.cancel();
    };
  }, []);

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

  const renderPlayerItem = useCallback(
    ({ item }: { item: AbroadPlayerLike }) => {
      if (!VintagePlayerCard) {
        return <View style={styles.cardPlaceholder} />;
      }
      const favorite = isHydrated ? isFavorite(item.id) : false;
      return (
        <VintagePlayerCard
          player={item}
          favorite={favorite}
          onPress={() => router.push(`/abroad/${item.id}`)}
          onToggleFavorite={() => toggleAbroadFavorite(item.id)}
        />
      );
    },
    [VintagePlayerCard, isFavorite, isHydrated, router]
  );

  const listHeaderComponent = useMemo(
    () => (
      <>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.pageTitle}>旅外球員</Text>
              <Text style={styles.titleCount}>{sortedFilteredPlayers.length} 位</Text>
            </View>
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
      </>
    ),
    [activeFilter, refresh, refreshing, searchText, sortedFilteredPlayers.length]
  );

  if (loading && mergedPlayers.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppLoadingState text="正在讀取旅外資料..." variant="screen" />
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
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.content}
          data={sortedFilteredPlayers}
          keyExtractor={(item) => item.id}
          initialNumToRender={5}
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={80}
          windowSize={3}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#9B5A30"
            />
          }
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={
            <AppEmptyState
              title="目前沒有符合條件的球員"
              description="可以試試其他篩選，或清空搜尋關鍵字。"
              icon="search-outline"
              compact
            />
          }
          renderItem={renderPlayerItem}
        />
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
    paddingTop: 8,
    paddingBottom: 120,
  },

  cardPlaceholder: {
    width: '100%',
    aspectRatio: 2.45,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 248, 232, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(183, 121, 69, 0.32)',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pageTitle: {
    color: '#10213D',
    fontFamily: CN_FONT,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  titleCount: {
    marginLeft: 8,
    color: '#9B5A30',
    fontFamily: CN_FONT,
    fontSize: 15,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 2,
    color: '#6E5131',
    fontFamily: CN_FONT,
    fontSize: 11,
    fontWeight: '800',
  },
  headerRefreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#B77945',
    backgroundColor: 'rgba(255, 248, 232, 0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    height: 46,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#B77945',
    backgroundColor: 'rgba(255, 248, 232, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#10213D',
    fontFamily: CN_FONT,
    fontSize: 14,
    fontWeight: '800',
  },

  filterRow: {
    paddingBottom: 6,
    marginBottom: 6,
  },
  filterChip: {
    height: 38,
    paddingHorizontal: 14,
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
    fontSize: 13,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#F8E7C7',
  },
});
