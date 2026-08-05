import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRightPress?: () => void;
  rightIconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Sadé',
  subtitle,
  onRightPress,
  rightIconName = 'account-circle-outline',
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <Text style={styles.brandTitle}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
          <MaterialCommunityIcons name={rightIconName} size={21} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  leftSection: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    fontStyle: 'italic',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: -2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
