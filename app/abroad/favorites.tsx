import AppEmptyState from '../../components/AppEmptyState';
import AppLoadingState from '../../components/AppLoadingState';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { abroadPlayers, type PlayerStatus } from '../../data/abroadPlayers';
import {
  toggleAbroadFavorite,
  useAbroadFavorites,
} from '../../store/abroadFavorites';

export default function AbroadFavoritesScreen() {
  const router = useRouter();
  const { favoriteIds, isFavorite, isHydrated } = useAbroadFavorites();

  const favoritePlayers = abroadPlayers.filter((player) =>
    favoriteIds.includes(player.id)
  );

  if (!isHydrated) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLoadingState text="正在讀取收藏資料..." variant="screen" />
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="#eaf2ff" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>收藏旅外</Text>

          <View style={styles.topBarRight}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.topBarCount}>{favoritePlayers.length}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="star" size={20} color="#fbbf24" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>我的旅外追蹤名單</Text>
            <Text style={styles.heroSubtitle}>
              集中查看你收藏的旅外球員，之後接通知功能也會很順。
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>球員列表</Text>
          <Text style={styles.sectionAction}>{favoritePlayers.length} 人</Text>
        </View>

        <View style={styles.listWrap}>
          {favoritePlayers.length > 0 ? (
            favoritePlayers.map((player) => {
              const favorite = isFavorite(player.id);

              return (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerCard}
                  onPress={() => router.push(`/abroad/${player.id}`)}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.playerAvatarLarge,
                      { backgroundColor: player.teamColor },
                    ]}
                  >
                    <Text style={styles.playerAvatarText}>
                      {player.name.slice(0, 1)}
                    </Text>
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerTopRow}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <StatusBadge status={player.status} compact />
                    </View>

                    <Text style={styles.playerMeta}>
                      {player.enName}・{player.team}・{player.league} {player.level}
                    </Text>

                    <Text style={styles.playerStat}>{player.line1}</Text>
                    <Text style={styles.playerStatSecondary}>{player.line2}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.favoriteBtn}
                    onPress={() => toggleAbroadFavorite(player.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={favorite ? 'star' : 'star-outline'}
                      size={20}
                      color={favorite ? '#fbbf24' : '#9db0c9'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          ) : (
           <AppEmptyState
  title="還沒有收藏球員"
  description="先到旅外球員頁按星號收藏，這裡就會自動出現。"
  icon="star-outline"
  buttonLabel="前往旅外球員"
  onPress={() => router.push('/(tabs)/abroad')}
/>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBadge({
  status,
  compact = false,
}: {
  status: PlayerStatus;
  compact?: boolean;
}) {
  const map = {
    今日出賽: { bg: '#0b2a4d', color: '#60a5fa' },
    預告先發: { bg: '#3a2306', color: '#fbbf24' },
    已完賽: { bg: '#0b2f1f', color: '#34d399' },
    傷兵: { bg: '#3b1111', color: '#f87171' },
    待命: { bg: '#1c2435', color: '#94a3b8' },
  };

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: map[status].bg,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 4 : 5,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: map[status].color,
            fontSize: compact ? 10 : 11,
          },
        ]}
      >
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
  topBarRight: {
    minWidth: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#121c2c',
    borderWidth: 1,
    borderColor: '#1b2940',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 6,
  },
  topBarCount: {
    color: '#eef5ff',
    fontSize: 12,
    fontWeight: '800',
  },

  heroCard: {
    backgroundColor: '#111b2a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 16,
    marginBottom: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#2f240a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#8da2c0',
    fontSize: 13,
    lineHeight: 20,
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionAction: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '700',
  },

  listWrap: {
    gap: 12,
  },
  playerCard: {
    borderRadius: 20,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatarLarge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    color: '#09111f',
    fontSize: 20,
    fontWeight: '900',
  },
  playerInfo: {
    flex: 1,
  },
  playerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#f8fbff',
    fontSize: 16,
    fontWeight: '800',
  },
  playerMeta: {
    marginTop: 6,
    color: '#8da2c0',
    fontSize: 12,
    fontWeight: '600',
  },
  playerStat: {
    marginTop: 8,
    color: '#dbe7ff',
    fontSize: 13,
    fontWeight: '700',
  },
  playerStatSecondary: {
    marginTop: 5,
    color: '#8da2c0',
    fontSize: 12,
    lineHeight: 18,
  },
  favoriteBtn: {
    marginLeft: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1625',
    borderWidth: 1,
    borderColor: '#1b2940',
  },

  statusBadge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontWeight: '800',
  },
});