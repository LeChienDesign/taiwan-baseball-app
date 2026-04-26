import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function EventsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>EVENTS CENTER</Text>
        <Text style={styles.title}>賽事中心</Text>
        <Text style={styles.subtitle}>
          先從三個主要分類進入，後續再往下延伸到聯盟、賽事與資料頁。
        </Text>

        <View style={styles.cardsWrap}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.86}
            onPress={() => router.push('/events/pro')}
          >
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>職業棒球</Text>
            <Text style={styles.cardSubtitle}>MLB / NPB / CPBL / KBO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.86}
            onPress={() => router.push('/events/international')}
          >
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>國際賽事</Text>
            <Text style={styles.cardSubtitle}>
              WBC / WBSC / 奧運棒球 / 美國小馬聯盟
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.86}
            onPress={() => router.push('/events/asia')}
          >
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>亞洲區域賽事</Text>
            <Text style={styles.cardSubtitle}>
              亞洲運動會 / 亞太區賽事 / BFA 系列
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },
  kicker: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 10,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: '#a8b3c7',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 22,
  },
  cardsWrap: {
    gap: 14,
  },
  card: {
    backgroundColor: '#0d1729',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1b2940',
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardAccent: {
    width: 64,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 12,
  },
  cardSubtitle: {
    color: '#9fb0ca',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
  },
});