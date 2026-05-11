import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AppEmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttonLabel?: string;
  onPress?: () => void;
  compact?: boolean;
};

export default function AppEmptyState({
  title,
  description,
  icon = 'alert-circle-outline',
  buttonLabel,
  onPress,
  compact = false,
}: AppEmptyStateProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        <Ionicons
          name={icon}
          size={compact ? 20 : 24}
          color="#0B2346"
        />
      </View>

      <Text style={[styles.title, compact && styles.titleCompact]}>
        {title}
      </Text>

      <Text style={[styles.description, compact && styles.descriptionCompact]}>
        {description}
      </Text>

      {buttonLabel && onPress ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Text style={styles.actionText}>{buttonLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#FFF7E9',
    borderWidth: 2,
    borderColor: '#0B2346',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#7B4F2A',
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardCompact: {
    borderRadius: 20,
    padding: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F2E4CF',
    borderWidth: 2,
    borderColor: '#0B2346',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginBottom: 10,
  },
  title: {
    color: '#0B2346',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 16,
  },
  description: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  descriptionCompact: {
    marginTop: 6,
  },
  actionBtn: {
    marginTop: 18,
    backgroundColor: '#F0642B',
    borderWidth: 2,
    borderColor: '#0B2346',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  actionText: {
    color: '#FFF7E9',
    fontSize: 13,
    fontWeight: '900',
  },
});
