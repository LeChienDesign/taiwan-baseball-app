import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BackButton from '../../../components/BackButton';

export default function CPBLSelectPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.page}>
        <BackButton style={styles.backButton} fallbackHref="/events/pro" />

        <Text style={styles.kicker}>CHINESE PROFESSIONAL BASEBALL LEAGUE</Text>
        <Text style={styles.title}>中華職棒</Text>
        <Text style={styles.subtitle}>先選擇一軍或二軍，再進入賽程月曆與比分頁。</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.86}
            onPress={() => router.push('/league/cpbl-major')}
          >
            <Text style={styles.cardTitle}>一軍</Text>
            <Text style={styles.cardSub}>一軍賽程 / 即時比分</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.86}
            onPress={() => router.push('/league/cpbl-minor')}
          >
            <Text style={styles.cardTitle}>二軍</Text>
            <Text style={styles.cardSub}>二軍賽程 / 比賽資料</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  backButton: {
    marginBottom: 18,
  },
  kicker: {
    color: '#69748d',
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#9aa7bf',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#121826',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#273247',
    padding: 20,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  cardSub: {
    color: '#9aa7bf',
    fontSize: 14,
    lineHeight: 20,
  },
});