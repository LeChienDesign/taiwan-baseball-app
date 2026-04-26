import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';

export default function InternationalPage() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <Text style={styles.kicker}>INTERNATIONAL EVENTS</Text>
        <Text style={styles.title}>國際賽事</Text>
        <Text style={styles.subtitle}>WBC / WBSC / 奧運棒球 / 美國小馬聯盟</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24 },
  kicker: { color: '#64748b', fontSize: 10, letterSpacing: 3, fontWeight: '800', marginBottom: 10 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: '#94a3b8', fontSize: 16, lineHeight: 24, fontWeight: '700' },
});