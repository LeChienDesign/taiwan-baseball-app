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
          color="#8da2c0"
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
    borderRadius: 22,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 22,
    alignItems: 'center',
  },
  cardCompact: {
    borderRadius: 18,
    padding: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#0d1625',
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
    color: '#f8fbff',
    fontSize: 18,
    fontWeight: '800',
  },
  titleCompact: {
    fontSize: 16,
  },
  description: {
    marginTop: 8,
    color: '#8da2c0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  descriptionCompact: {
    marginTop: 6,
  },
  actionBtn: {
    marginTop: 18,
    backgroundColor: '#1f4f93',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionText: {
    color: '#eef5ff',
    fontSize: 13,
    fontWeight: '800',
  },
});