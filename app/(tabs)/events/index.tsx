import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { APP_FONT, CN_FONT } from '../../../constants/fonts';


export default function EventsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>EVENTS CENTER</Text>
          <Text style={styles.title}>賽事中心</Text>
          <Text style={styles.subtitle}>
            依照賽事層級快速進入，從職業聯盟到國際賽事，一張票根收好今天的棒球行程。
          </Text>
        </View>

        <View style={styles.cardsWrap}>
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => router.push('/events/pro')}
          >
            <View style={styles.heroLeagueCard}>
              <Text style={styles.heroLeagueKicker}>PROFESSIONAL</Text>
              <Text style={styles.heroLeagueKicker}>BASEBALL</Text>

              <View style={styles.heroLeagueBottom}>
                <View>
                  <Text style={styles.heroLeagueTitle}>職業棒球</Text>
                  <Text style={styles.heroLeagueSubtitle}>
                    MLB / NPB / CPBL / KBO
                  </Text>
                </View>

                <Text style={styles.heroLeagueArrow}>→</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.bottomGrid}>
            <TouchableOpacity
              style={styles.bottomCardWrap}
              activeOpacity={0.86}
              onPress={() => router.push('/events/international')}
            >
              <View style={styles.smallCard}>
                <Text style={styles.smallCardKicker}>INTERNATIONAL</Text>
                <Text style={styles.smallCardTitle}>國際賽事</Text>
                <Text style={styles.smallCardSubtitle}>
                  WBC / WBSC
                </Text>
                <Text style={styles.smallCardArrow}>↗</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomCardWrap}
              activeOpacity={0.86}
              onPress={() => router.push('/events/asia')}
            >
              <View style={styles.smallCard}>
                <Text style={styles.smallCardKicker}>ASIA</Text>
                <Text style={styles.smallCardTitle}>亞洲區域</Text>
                <Text style={styles.smallCardSubtitle}>
                  亞洲運動會 / BFA
                </Text>
                <Text style={styles.smallCardArrow}>↗</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ead8ad',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
  },
  heroCard: {
    backgroundColor: '#f7e9c7',
    borderWidth: 1.5,
    borderColor: '#221d16',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    marginBottom: 18,
  },
  kicker: {
    color: '#9b3526',
    fontSize: 11,
    letterSpacing: 3.2,
    fontFamily: APP_FONT,
    marginBottom: 8,
  },
  title: {
    color: '#201b15',
    fontSize: 36,
    lineHeight: 42,
    fontFamily: CN_FONT,
    marginBottom: 8,
  },
  subtitle: {
    color: '#5b4b37',
    fontSize: 13,
    lineHeight: 21,
    fontFamily: CN_FONT,
    maxWidth: 310,
  },
  cardsWrap: {
    gap: 14,
  },
  heroLeagueCard: {
    backgroundColor: '#f7e9c7',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#2a241d',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  heroLeagueKicker: {
    color: '#a1392b',
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: 2,
    fontFamily: APP_FONT,
  },
  heroLeagueBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroLeagueTitle: {
    color: '#1f1a14',
    fontSize: 42,
    lineHeight: 48,
    fontFamily: CN_FONT,
    marginBottom: 8,
  },
  heroLeagueSubtitle: {
    color: '#665744',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: APP_FONT,
    letterSpacing: 1,
  },
  heroLeagueArrow: {
    color: '#a1392b',
    fontSize: 42,
    lineHeight: 42,
    fontFamily: APP_FONT,
    marginBottom: 2,
  },
  bottomGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomCardWrap: {
    flex: 1,
  },
  smallCard: {
    backgroundColor: '#f7e9c7',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#2a241d',
    minHeight: 188,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  smallCardKicker: {
    color: '#a1392b',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: APP_FONT,
  },
  smallCardTitle: {
    color: '#1f1a14',
    fontSize: 28,
    lineHeight: 32,
    fontFamily: CN_FONT,
  },
  smallCardSubtitle: {
    color: '#665744',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: CN_FONT,
    marginTop: 6,
  },
  smallCardArrow: {
    color: '#a1392b',
    fontSize: 24,
    fontFamily: APP_FONT,
    alignSelf: 'flex-end',
  },
});
