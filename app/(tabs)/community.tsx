import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CommunityScreen() {
  const items = ['區域賽事', '找球隊', '球員選秀', '比賽揪團'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>社區棒球</Text>
      <Text style={styles.subtitle}>這裡先做主功能入口，細部資料之後再展開</Text>

      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity key={item} style={styles.card} activeOpacity={0.85}>
            <Text style={styles.cardText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 68,
    paddingBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 28,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
  },
  cardText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
});