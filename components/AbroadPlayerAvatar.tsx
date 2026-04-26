import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getTeamLogoSource } from '../constants/teamLogos';

type Props = {
  name: string;
  team?: string | null;
  league?: string | null;
  level?: string | null;
  teamCode?: string | null;
  logoKey?: string | null;
  photoUri?: string | null;
  teamColor?: string;
  size?: number;
  textSize?: number;
  borderRadius?: number;
};

function getInitial(name: string) {
  const v = String(name ?? '').trim();
  return v ? v[0] : '?';
}

function isRemoteUrl(value?: string | null) {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export default function AbroadPlayerAvatar({
  name,
  team,
  league,
  level,
  teamCode,
  logoKey,
  photoUri,
  teamColor = '#123b7a',
  size = 84,
  textSize = 26,
  borderRadius,
}: Props) {
  const [remoteFailed, setRemoteFailed] = useState(false);

  const localLogoSource = useMemo<ImageSourcePropType | null>(() => {
    return getTeamLogoSource({
      logoKey,
      team,
      league,
      level,
      teamCode,
    });
  }, [logoKey, team, league, level, teamCode]);

  const showRemotePhoto = isRemoteUrl(photoUri) && !remoteFailed;

  const radius = borderRadius ?? Math.round(size * 0.24);

  if (showRemotePhoto) {
    return (
      <Image
        source={{ uri: photoUri! }}
        resizeMode="cover"
        onError={() => setRemoteFailed(true)}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      />
    );
  }

  if (localLogoSource) {
    return (
      <View
        style={[
          styles.avatarWrap,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      >
        <Image
          source={localLogoSource}
          resizeMode="contain"
          style={{
            width: size * 0.84,
            height: size * 0.84,
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: teamColor,
        },
      ]}
    >
      <Text
        style={[
          styles.fallbackText,
          {
            fontSize: textSize,
          },
        ]}
      >
        {getInitial(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    backgroundColor: '#09162d',
    borderWidth: 1,
    borderColor: '#193050',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: '#0b172d',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#06111f',
    fontWeight: '900',
  },
});