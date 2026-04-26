import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAbroadFavorites } from '../store/abroadFavorites';

export default function HomeQuickActions() {
  const router = useRouter();
  const { favoriteCount, isHydrated } = useAbroadFavorites();

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>快捷功能</Text>
      </View>

      <View style={styles.grid}>
        <QuickActionCard
          title="收藏旅外"
          subtitle={isHydrated ? `${favoriteCount} 位球員` : '讀取中'}
          icon={favoriteCount > 0 ? 'star' : 'star-outline'}
          iconColor={favoriteCount > 0 ? '#fbbf24' : '#60a5fa'}
          onPress={() => router.push('/abroad/favorites')}
        />

        <QuickActionCard
          title="旅外球員"
          subtitle="即時動態"
          icon="airplane-outline"
          iconColor="#60a5fa"
          onPress={() => router.push('/(tabs)/abroad')}
        />

        <QuickActionCard
          title="賽事中心"
          subtitle="近期賽程"
          icon="grid-outline"
          iconColor="#60a5fa"
          onPress={() => router.push('/(tabs)/events')}
        />

        <QuickActionCard
          title="社區棒球"
          subtitle="找人找隊"
          icon="people-outline"
          iconColor="#60a5fa"
          onPress={() => router.push('/(tabs)/community')}
        />
      </View>
    </View>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.2%',
    borderRadius: 20,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0d1625',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#f8fbff',
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    marginTop: 6,
    color: '#8da2c0',
    fontSize: 12,
    lineHeight: 18,
  },
});