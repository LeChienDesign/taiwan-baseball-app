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
        <Text style={styles.sectionTitle}>QUICK MENU</Text>
      </View>

      <View style={styles.grid}>
        <QuickActionCard
          title="收藏旅外"
          subtitle={isHydrated ? `${favoriteCount} 位球員` : '讀取中'}
          ticketNumber="01"
          icon={favoriteCount > 0 ? 'star' : 'star-outline'}
          iconColor={favoriteCount > 0 ? '#F0642B' : '#0B2346'}
          onPress={() => router.push('/abroad/favorites')}
        />

        <QuickActionCard
          title="旅外球員"
          subtitle="即時動態"
          ticketNumber="02"
          icon="airplane-outline"
          iconColor="#0B2346"
          onPress={() => router.push('/(tabs)/abroad')}
        />

        <QuickActionCard
          title="賽事中心"
          subtitle="近期賽程"
          ticketNumber="03"
          icon="grid-outline"
          iconColor="#0B2346"
          onPress={() => router.push('/(tabs)/events')}
        />

        <QuickActionCard
          title="社區棒球"
          subtitle="找人找隊"
          ticketNumber="04"
          icon="people-outline"
          iconColor="#0B2346"
          onPress={() => router.push('/(tabs)/community')}
        />
      </View>
    </View>
  );
}

function QuickActionCard({
  title,
  subtitle,
  ticketNumber,
  icon,
  iconColor,
  onPress,
}: {
  title: string;
  subtitle: string;
  ticketNumber: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={19} color={iconColor} />
        </View>
        <Text style={styles.ticketNumber}>NO. {ticketNumber}</Text>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    paddingHorizontal: 14,
  },
  headerRow: {
    marginBottom: 12,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.2%',
    borderRadius: 22,
    backgroundColor: '#FFF7E9',
    borderWidth: 2,
    borderColor: '#0B2346',
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 13,
    shadowColor: '#7B4F2A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketNumber: {
    color: '#F0642B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#F2E4CF',
    borderWidth: 2,
    borderColor: '#0B2346',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#0B2346',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
});
