import AppEmptyState from './AppEmptyState';
import AppLoadingState from './AppLoadingState';
import AbroadPlayerAvatar from './AbroadPlayerAvatar';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { abroadPlayers as seedAbroadPlayers } from '../data/abroadPlayers';
import { useAbroadLiveData } from '../hooks/useAbroadLiveData';
import {
  type AbroadPlayerLike,
  formatAbroadTeamLine,
  getAbroadPlayerStatus,
  mergeAbroadPlayerViewModels,
} from '../lib/viewModels/abroadPlayerViewModel';
import { useAbroadFavorites } from '../store/abroadFavorites';

export default function TrackedAbroadSection() {
  const router = useRouter();
  const { favoriteIds, isHydrated } = useAbroadFavorites();

  const { players: livePlayers } = useAbroadLiveData();
  const abroadPlayers = mergeAbroadPlayerViewModels(
    seedAbroadPlayers as AbroadPlayerLike[],
    livePlayers as AbroadPlayerLike[]
  );

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
          <Text style={styles.sectionTitle}>PLAYER WATCH</Text>

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
        <Text style={styles.sectionTitle}>PLAYER WATCH</Text>

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
            <AbroadPlayerAvatar
              name={player.name}
              team={player.team}
              league={player.league}
              level={player.level}
              teamCode={player.teamMeta?.code ?? player.teamMeta?.abbreviation}
              logoKey={player.teamMeta?.logoKey}
              photoUri={player.officialPhotoUrl}
              teamColor={player.teamColor}
              size={44}
              textSize={16}
              borderRadius={13}
            />

            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                <StatusBadge status={getAbroadPlayerStatus(player)} />
              </View>

              <Text style={styles.meta} numberOfLines={1}>
                {formatAbroadTeamLine(player)}・{player.league} {player.level}
              </Text>

              <Text style={styles.line1} numberOfLines={1}>{player.line1}</Text>
              <Text style={styles.line2} numberOfLines={1}>{player.line2}</Text>
            </View>

            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={15} color="#0B2346" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    今日出賽: { bg: '#F0642B', color: '#FFF7E9', border: '#0B2346' },
    預告先發: { bg: '#F7D9B8', color: '#0B2346', border: '#F0642B' },
    已完賽: { bg: '#0B2346', color: '#FFF7E9', border: '#0B2346' },
    大聯盟出賽: { bg: '#0B2346', color: '#FFF7E9', border: '#0B2346' },
    傷兵: { bg: '#F0642B', color: '#FFF7E9', border: '#0B2346' },
    待命: { bg: '#F2E4CF', color: '#0B2346', border: '#0B2346' },
  };
  const badge = map[status] ?? map['待命'];

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}> 
      <Text style={[styles.badgeText, { color: badge.color }]}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    paddingHorizontal: 0,
  },
  headerRow: {
    marginBottom: 12,
    paddingHorizontal: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0B2346',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionAction: {
    color: '#F0642B',
    fontSize: 11,
    fontWeight: '900',
  },
  listWrap: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7E9',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#0B2346',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    shadowColor: '#7B4F2A',
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#0B2346',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  meta: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  line1: {
    marginTop: 5,
    color: '#0B2346',
    fontSize: 12,
    fontWeight: '900',
  },
  line2: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#F2E4CF',
    borderWidth: 2,
    borderColor: '#0B2346',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
