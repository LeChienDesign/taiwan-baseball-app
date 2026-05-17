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
  黃仲翔: require('../assets/abroad/chung-hsiang-huang.png'),
  鄧愷威: require('../assets/abroad/kai-wei-teng.png'),
  鄭宗哲: require('../assets/abroad/tsung-che-cheng.png'),
  劉致榮: require('../assets/abroad/chih-jung-liu.png'),
  陳柏毓: require('../assets/abroad/po-yu-chen.png'),
  李灝宇: require('../assets/abroad/hao-yu-lee.png'),
  莊陳仲敖: require('../assets/abroad/chen-zhong-ao-zhuang.png'),
  林昱珉: require('../assets/abroad/yu-min-lin.png'),
  潘文輝: require('../assets/abroad/wen-hui-pan.png'),
  林盛恩: require('../assets/abroad/sheng-en-lin.png'),
  林振瑋: require('../assets/abroad/chen-wei-lin.png'),
  林維恩: require('../assets/abroad/wei-en-lin.png'),
  柯敬賢: require('../assets/abroad/ching-hsien-ko.png'),
  徐若熙: require('../assets/abroad/jo-hsi-hsu.png'),
  林安可: require('../assets/abroad/an-ko-lin.png'),
  林家正: require('../assets/abroad/chia-cheng-lin.png'),
  宋家豪: require('../assets/abroad/chia-hao-song.png'),
  古林睿煬: require('../assets/abroad/ruei-yang-gu-lin.png'),
  孫易磊: require('../assets/abroad/yi-lei-sun.png'),
  沙子宸: require('../assets/abroad/tzu-chen-sha.png'),
  王彥程: require('../assets/abroad/yen-cheng-wang.png'),
  張峻瑋: require('../assets/abroad/chun-wei-chang.png'),
  'Corbin Carroll': require('../assets/abroad/corbin-carroll.png'),
  'Stuart Fairchild': require('../assets/abroad/stuart-fairchild.png'),
  'Jonathon Long': require('../assets/abroad/jonathon-long.png'),
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
  allowRemotePhoto?: boolean;
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
  allowRemotePhoto = false,
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

  const showRemotePhoto = allowRemotePhoto && isRemoteUrl(photoUri) && !remoteFailed;

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
    backgroundColor: '#F2E4CF',
    borderWidth: 1,
    borderColor: '#D8BE9B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: '#F2E4CF',
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
