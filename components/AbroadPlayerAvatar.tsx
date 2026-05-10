import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getTeamLogoSource } from '../constants/teamLogos';

const LOCAL_PLAYER_PHOTOS: Record<string, any> = {
  黃仲翔: require('../assets/abroad/huang-chung-hsiang.png'),
  徐若熙: require('../assets/abroad/jo-hsi-hsu.png'),
  林安可: require('../assets/abroad/an-ko-lin.png'),
  林家正: require('../assets/abroad/chia-cheng-lin.png'),
  宋家豪: require('../assets/abroad/chia-hao-song.png'),
  古林睿煬: require('../assets/abroad/ruei-yang-gu-lin.png'),
  孫易磊: require('../assets/abroad/yi-lei-sun.png'),
  沙子宸: require('../assets/abroad/tzu-chen-sha.png'),
  王彥程: require('../assets/abroad/yen-cheng-wang.png'),
  張峻瑋: require('../assets/abroad/chun-wei-chang.png'),
};

function normalizeLocalPhotoKey(value?: string | null) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\s\u3000・･·．.\-‐‑‒–—―]/g, '')
    .trim();
}

const NORMALIZED_LOCAL_PLAYER_PHOTOS = Object.fromEntries(
  Object.entries(LOCAL_PLAYER_PHOTOS).map(([key, source]) => [normalizeLocalPhotoKey(key), source])
);

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

  useEffect(() => {
    setRemoteFailed(false);
  }, [photoUri]);

  const localLogoSource = useMemo<ImageSourcePropType | null>(() => {
    return getTeamLogoSource({
      logoKey,
      team,
      league,
      level,
      teamCode,
    });
  }, [logoKey, team, league, level, teamCode]);

  const localPlayerPhoto = useMemo<ImageSourcePropType | null>(() => {
    return LOCAL_PLAYER_PHOTOS[name] ?? NORMALIZED_LOCAL_PLAYER_PHOTOS[normalizeLocalPhotoKey(name)] ?? null;
  }, [name]);

  const showRemotePhoto = isRemoteUrl(photoUri) && !remoteFailed;

  const radius = borderRadius ?? Math.round(size * 0.24);

  if (localPlayerPhoto) {
    return (
      <Image
        source={localPlayerPhoto}
        resizeMode="cover"
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
