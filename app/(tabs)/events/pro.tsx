import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const leagueLogos = {
  mlb: require('../../../assets/league/mlb.png'),
  npb: require('../../../assets/league/npb.png'),
  cpbl: require('../../../assets/league/cpbl.png'),
  kbo: require('../../../assets/league/kbo.png'),
};

type LeagueItemProps = {
  image: any;
  caption: string;
  onPress: () => void;
};

function LeagueItem({ image, caption, onPress }: LeagueItemProps) {
  return (
    <View style={styles.item}>
      <TouchableOpacity style={styles.logoButton} activeOpacity={0.85} onPress={onPress}>
        <Image source={image} style={styles.logo} resizeMode="contain" />
      </TouchableOpacity>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

export default function ProPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>PRO BASEBALL</Text>
        <Text style={styles.title}>職棒聯盟</Text>
        <Text style={styles.subtitle}>
          選擇聯盟後，查看轉播月曆、每日賽程與比分。
        </Text>

        <View style={styles.grid}>
          <LeagueItem
            image={leagueLogos.mlb}
            caption="美國職棒 MLB"
            onPress={() => router.push('/league/mlb')}
          />

          <LeagueItem
            image={leagueLogos.npb}
            caption="日本職棒 NPB"
            onPress={() => router.push('/league/npb')}
          />

          <LeagueItem
            image={leagueLogos.cpbl}
            caption="中華職棒 CPBL"
            onPress={() => router.push('/league/cpbl')}
          />

          <LeagueItem
            image={leagueLogos.kbo}
            caption="韓國職棒 KBO"
            onPress={() => router.push('/league/kbo')}
          />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  kicker: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  item: {
    width: '47%',
    alignItems: 'center',
  },
  logoButton: {
    width: '100%',
    height: 120,
    borderRadius: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243041',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logo: {
    width: '100%',
    height: 72,
  },
  caption: {
    marginTop: 10,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});