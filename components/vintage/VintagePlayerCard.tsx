import { Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';

import AbroadPlayerAvatar from '../AbroadPlayerAvatar';
import { getTeamLogoSource } from '../../constants/teamLogos';
import {
  formatAbroadLevelLine,
  formatAbroadTeamLine,
  type AbroadPlayerLike,
} from '../../lib/viewModels/abroadPlayerViewModel';

const APP_FONT = 'CityBurn';
const CN_FONT = 'ZaoZiGongFangXingHei';

const VINTAGE_COLOR = {
  ink: '#0B2346',
  shadow: '#7B4F2A',
};

const VINTAGE_LAYER = {
  texture: 1,
  portrait: 2,
  ticket: 4,
  title: 8,
  info: 9,
  number: 10,
  stamp: 12,
};

const VINTAGE_LAYOUT = {
  cardAspectRatio: 3.8,
  radius: 0,
  photoLeft: 12,
  photoTop: 14,
  photoSize: 90,
  stampLeft: 100,
  stampTop: 15,
  stampSize: 32,
  contentLeft: 124,
  contentTop: 15,
  contentWidth: 250,
  statusRight: 3,
  statusTop: 10,
  statusWidth: 88,
  statusHeight: 122,
  ticketScale: 1.02,
};

const VINTAGE_OPACITY = {
  text: 0.86,
  teamLogo: 0.78,
  leagueStamp: 0.72,
  number: 0.86,
};

const VINTAGE_SPACE = {
  cardGap: 6,
  shadowRadius: 6,
  shadowY: 2,
};

const vintageImages = {
  playerTicketBg: require('../../assets/yaren_one_icons_png_pack/小長格.png'),
  mlbStamp: require('../../assets/yaren_one_icons_png_pack/MLBstamp.png'),
  npbStamp: require('../../assets/yaren_one_icons_png_pack/NPBstamp.png'),
  kboStamp: require('../../assets/yaren_one_icons_png_pack/KBOstamp.png'),
};

const localAbroadPhotos: Record<string, ImageSourcePropType> = {
  'an-ko-lin': require('../../assets/abroad/an-ko-lin.png'),
  'chia-cheng-lin': require('../../assets/abroad/chia-cheng-lin.png'),
  'chia-hao-song': require('../../assets/abroad/chia-hao-song.png'),
  'chun-wei-chang': require('../../assets/abroad/chun-wei-chang.png'),
  'huang-chung-hsiang': require('../../assets/abroad/huang-chung-hsiang.png'),
  'jo-hsi-hsu': require('../../assets/abroad/jo-hsi-hsu.png'),
  'shosei-hsu': require('../../assets/abroad/Shosei徐翔聖.png'),
  'hsiang-sheng-hsu': require('../../assets/abroad/Shosei徐翔聖.png'),
  'ruei-yang-gu-lin': require('../../assets/abroad/ruei-yang-gu-lin.png'),
  'tzu-chen-sha': require('../../assets/abroad/tzu-chen-sha.png'),
  'yen-cheng-wang': require('../../assets/abroad/yen-cheng-wang.png'),
  'yi-lei-sun': require('../../assets/abroad/yi-lei-sun.png'),
};

type VintagePlayerCardProps = {
  player: AbroadPlayerLike;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
};

function getVintageLeagueStampSource(player: AbroadPlayerLike) {
  const leagueText = `${player.league ?? ''} ${player.level ?? ''}`.toLowerCase();

  if (leagueText.includes('npb') || leagueText.includes('日職')) {
    return vintageImages.npbStamp;
  }

  if (leagueText.includes('kbo') || leagueText.includes('韓職')) {
    return vintageImages.kboStamp;
  }

  return vintageImages.mlbStamp;
}

function normalizeVintageInfoText(value?: string | null) {
  const normalized = String(value ?? '')
    .replace(/[#＃]/g, '')
    .replace(/[\s・／/|｜,，]+/g, '')
    .trim()
    .toLowerCase();

  const positionAliases: Record<string, string> = {
    p: '投手',
    pitcher: '投手',
    投手: '投手',
    sp: '投手',
    rp: '投手',
    c: '捕手',
    catcher: '捕手',
    捕手: '捕手',
    '1b': '一壘手',
    一壘手: '一壘手',
    '2b': '二壘手',
    二壘手: '二壘手',
    '3b': '三壘手',
    三壘手: '三壘手',
    ss: '游擊手',
    游擊手: '游擊手',
    if: '內野手',
    內野手: '內野手',
    of: '外野手',
    外野手: '外野手',
    lf: '外野手',
    cf: '外野手',
    rf: '外野手',
    dh: '指定打擊',
    指定打擊: '指定打擊',
  };

  return positionAliases[normalized] ?? normalized;
}

function buildVintagePlayerSubLine(player: AbroadPlayerLike) {
  const levelLine = formatAbroadLevelLine(player);
  const positionText = player.position ?? '';
  const parts = levelLine
    .split(/[・／/|｜,，()（）\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedParts = new Set(parts.map(normalizeVintageInfoText));
  const positionParts = positionText
    .split(/[・／/|｜,，()（）\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  positionParts.forEach((positionPart) => {
    const normalizedPosition = normalizeVintageInfoText(positionPart);

    if (normalizedPosition && !normalizedParts.has(normalizedPosition)) {
      parts.push(positionPart);
      normalizedParts.add(normalizedPosition);
    }
  });

  return parts.join('');
}

function splitVintageMixedText(text: string) {
  return text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+|[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g) ?? [];
}

function isChineseText(text: string) {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text);
}

function renderVintageMixedText(text: string, chineseStyle: object, englishStyle: object) {
  return splitVintageMixedText(text).map((part, index) => (
    <Text key={`${part}-${index}`} style={isChineseText(part) ? chineseStyle : englishStyle}>
      {part}
    </Text>
  ));
}

export default function VintagePlayerCard({
  player,
  favorite,
  onPress,
  onToggleFavorite,
}: VintagePlayerCardProps) {
  const localPhotoSource = localAbroadPhotos[player.id];
  const remotePhotoSource: ImageSourcePropType | undefined = player.officialPhotoUrl
    ? { uri: player.officialPhotoUrl }
    : undefined;
  const portraitSource = localPhotoSource ?? remotePhotoSource;
  const leagueStampSource = getVintageLeagueStampSource(player);
  const teamLogoSource = getTeamLogoSource({
    logoKey: player.teamMeta?.logoKey,
  });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardTicketBg}>
        <View style={styles.avatarSlot}>
          {portraitSource ? (
            <Image
              source={portraitSource}
              style={styles.portraitImage}
              resizeMode="contain"
            />
          ) : (
            <AbroadPlayerAvatar
              name={player.name}
              team={player.team}
              league={player.league}
              level={player.level}
              teamCode={player.teamMeta?.code ?? player.teamMeta?.abbreviation}
              logoKey={player.teamMeta?.logoKey}
              photoUri={player.officialPhotoUrl}
              teamColor={player.teamColor}
              size={VINTAGE_LAYOUT.photoSize}
              textSize={24}
              borderRadius={0}
            />
          )}
        </View>

        <Image
          source={vintageImages.playerTicketBg}
          style={styles.ticketOverlay}
          resizeMode="contain"
        />

        <Image
          source={leagueStampSource}
          style={styles.passportStamp}
          resizeMode="contain"
        />

        <View style={styles.contentBlock}>
          <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
          <Text style={styles.playerMeta} numberOfLines={1}>
            {renderVintageMixedText(formatAbroadTeamLine(player), styles.playerMetaChinese, styles.playerMetaEnglish)}
          </Text>
          <Text style={styles.playerLine} numberOfLines={1}>
            {renderVintageMixedText(buildVintagePlayerSubLine(player), styles.playerLineChinese, styles.playerLineEnglish)}
          </Text>
        </View>

        {teamLogoSource ? (
          <Image
            source={teamLogoSource}
            style={styles.teamLogoStamp}
            resizeMode="contain"
          />
        ) : null}

        <TouchableOpacity
          style={[styles.statusTicket, favorite && styles.statusTicketActive]}
          activeOpacity={0.88}
          onPress={onToggleFavorite}
        >
          <Text style={styles.statusNumber}>{String(player.number ?? '').replace(/[#＃]/g, '')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: VINTAGE_LAYOUT.cardAspectRatio,
    marginBottom: VINTAGE_SPACE.cardGap,
    borderRadius: VINTAGE_LAYOUT.radius,
    overflow: 'visible',
    shadowColor: VINTAGE_COLOR.shadow,
    shadowOpacity: 0.16,
    shadowRadius: VINTAGE_SPACE.shadowRadius,
    shadowOffset: { width: 0, height: VINTAGE_SPACE.shadowY },
    elevation: 2,
  },
  cardTicketBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  ticketOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: VINTAGE_LAYOUT.radius,
    opacity: 1,
    zIndex: VINTAGE_LAYER.ticket,
    transform: [{ scale: VINTAGE_LAYOUT.ticketScale }],
  },
  avatarSlot: {
    position: 'absolute',
    left: VINTAGE_LAYOUT.photoLeft,
    top: VINTAGE_LAYOUT.photoTop,
    width: VINTAGE_LAYOUT.photoSize,
    height: VINTAGE_LAYOUT.photoSize,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: VINTAGE_LAYER.portrait,
    transform: [{ rotate: '-2deg' }],
  },
  portraitImage: {
    width: VINTAGE_LAYOUT.photoSize,
    height: VINTAGE_LAYOUT.photoSize,
  },
  passportStamp: {
    position: 'absolute',
    left: VINTAGE_LAYOUT.stampLeft,
    top: VINTAGE_LAYOUT.stampTop,
    width: VINTAGE_LAYOUT.stampSize,
    height: VINTAGE_LAYOUT.stampSize,
    opacity: VINTAGE_OPACITY.leagueStamp,
    zIndex: VINTAGE_LAYER.info,
    transform: [{ rotate: '-9deg' }],
  },
  contentBlock: {
    position: 'absolute',
    left: VINTAGE_LAYOUT.contentLeft,
    top: VINTAGE_LAYOUT.contentTop,
    width: VINTAGE_LAYOUT.contentWidth,
    zIndex: VINTAGE_LAYER.title,
  },
  teamLogoStamp: {
    position: 'absolute',
    left: VINTAGE_LAYOUT.contentLeft + 145,
    top: VINTAGE_LAYOUT.contentTop - 2,
    width: 34,
    height: 34,
    opacity: VINTAGE_OPACITY.teamLogo,
    zIndex: VINTAGE_LAYER.title,
  },
  playerName: {
    color: '#111111',
    fontFamily: CN_FONT,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: 0.3,
    flexShrink: 1,
    opacity: VINTAGE_OPACITY.text,
  },
  playerMeta: {
    color: VINTAGE_COLOR.ink,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
    letterSpacing: 0.7,
    marginTop: 4,
  },
  playerMetaChinese: {
    color: VINTAGE_COLOR.ink,
    fontFamily: CN_FONT,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
    letterSpacing: 0.7,
    opacity: VINTAGE_OPACITY.text,
  },
  playerMetaEnglish: {
    color: VINTAGE_COLOR.ink,
    fontFamily: APP_FONT,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
    letterSpacing: 0.7,
    opacity: VINTAGE_OPACITY.text,
  },
  playerLine: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    marginTop: 5,
  },
  playerLineChinese: {
    color: '#111111',
    fontFamily: CN_FONT,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    opacity: VINTAGE_OPACITY.text,
  },
  playerLineEnglish: {
    color: '#111111',
    fontFamily: APP_FONT,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    opacity: VINTAGE_OPACITY.text,
  },
  statusTicket: {
    position: 'absolute',
    right: VINTAGE_LAYOUT.statusRight,
    top: VINTAGE_LAYOUT.statusTop,
    width: VINTAGE_LAYOUT.statusWidth,
    height: VINTAGE_LAYOUT.statusHeight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: VINTAGE_LAYER.stamp,
  },
  statusTicketActive: {
    opacity: 0.96,
  },
  statusNumber: {
    color: VINTAGE_COLOR.ink,
    fontFamily: APP_FONT,
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -1,
    opacity: VINTAGE_OPACITY.number,
  },
});
