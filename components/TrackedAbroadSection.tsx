import AppEmptyState from './AppEmptyState';
import AppLoadingState from './AppLoadingState';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { abroadPlayers, type PlayerStatus } from '../data/abroadPlayers';
import { useAbroadFavorites } from '../store/abroadFavorites';

export default function TrackedAbroadSection() {
  const router = useRouter();
  const { favoriteIds, isHydrated } = useAbroadFavorites();

  if (!isHydrated) {
  return (
    <View style={styles.section}>
      <AppLoadingState text="正在讀取追蹤名單..." />
    </View>
  );
}

  const trackedPlayers = abroadPlayers.filter((player) =>
    favoriteIds.includes(player.id)
  );

  if (trackedPlayers.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>我追蹤的旅外</Text>

          <TouchableOpacity
            onPress={() => router.push('/abroad/favorites')}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionAction}>查看收藏</Text>
          </TouchableOpacity>
        </View>

        <AppEmptyState
  title="還沒有追蹤球員"
  description="到旅外球員頁按下星號收藏後，這裡就會顯示你的追蹤名單。"
  icon="star-outline"
  buttonLabel="前往旅外球員"
  onPress={() => router.push('/(tabs)/abroad')}
/>
       
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>我追蹤的旅外</Text>

        <TouchableOpacity
          onPress={() => router.push('/abroad/favorites')}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionAction}>全部查看</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listWrap}>
        {trackedPlayers.slice(0, 3).map((player) => (
          <TouchableOpacity
            key={player.id}
            style={styles.card}
            onPress={() => router.push(`/abroad/${player.id}`)}
            activeOpacity={0.9}
          >
            <View style={[styles.avatar, { backgroundColor: player.teamColor }]}>
              <Text style={styles.avatarText}>{player.name.slice(0, 1)}</Text>
            </View>

            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.name}>{player.name}</Text>
                <StatusBadge status={player.status} />
              </View>

              <Text style={styles.meta}>
                {player.team}・{player.league} {player.level}
              </Text>

              <Text style={styles.line1}>{player.line1}</Text>
              <Text style={styles.line2}>{player.line2}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#7f95b4" />
          </TouchableOpacity>
        ))}
      </View>
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
    <View style={[styles.badge, { backgroundColor: map[status].bg }]}>
      <Text style={[styles.badgeText, { color: map[status].color }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    paddingHorizontal: 18,
  },
  headerRow: {
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
  card: {
    borderRadius: 20,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#09111f',
    fontSize: 20,
    fontWeight: '900',
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#f8fbff',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    marginTop: 6,
    color: '#8da2c0',
    fontSize: 12,
    fontWeight: '600',
  },
  line1: {
    marginTop: 8,
    color: '#dbe7ff',
    fontSize: 13,
    fontWeight: '700',
  },
  line2: {
    marginTop: 5,
    color: '#8da2c0',
    fontSize: 12,
    lineHeight: 18,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});