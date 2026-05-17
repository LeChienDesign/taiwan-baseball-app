import { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AbroadPlayerAvatar from '../AbroadPlayerAvatar';
import { getTeamLogoSource } from '../../constants/teamLogos';
import { getAbroadPlayerPhotoSource } from '../../constants/abroadPlayerImages';
import {
  formatAbroadLevelLine,
  formatAbroadTeamLine,
  type AbroadPlayerLike,
} from '../../lib/viewModels/abroadPlayerViewModel';

const APP_FONT = 'CityBurn';
const CN_FONT = 'FangZhengHei';

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
  cardAspectRatio: 3.35,
  radius: 0,
  photoLeft: -8,
  photoTop: 5,
  photoSize: 117,
  stampLeft: 66,
  stampTop: 1,
  stampSize: 77,
  contentLeft: 124,
  contentTop: 15,
  contentWidth: 250,
  statusRight: 3,
  statusTop: 10,
  statusWidth: 88,
  statusHeight: 122,
  ticketScale: 1.04,
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


function getLocalPhotoKey(value?: string | null) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getVintageTextFont(value?: string | number | null) {
  const text = String(value ?? '');
  return /[\u4e00-\u9fff]/.test(text) ? CN_FONT : APP_FONT;
}


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

function formatVintageInfoPart(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, '');

  if (normalized === 'triplea') return 'AAA';
  if (normalized === 'doublea') return 'AA';
  if (normalized === 'higha') return 'High-A';

  return trimmed;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getVintageHiddenTeamTexts(player: AbroadPlayerLike) {
  return [
    player.team,
    player.teamMeta?.displayName,
    player.teamMeta?.code,
    player.teamMeta?.abbreviation,
    '日本火腿',
    '軟銀鷹',
    '西武獅',
    '樂天金鷲',
    '養樂多',
    '韓華鷹',
    '三星獅',
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function getVintageHiddenTeamRegex(player: AbroadPlayerLike) {
  const pattern = getVintageHiddenTeamTexts(player)
    .map(escapeRegExp)
    .filter(Boolean)
    .join('|');

  return pattern ? new RegExp(pattern, 'g') : null;
}

function stripVintageTeamText(text: string, hiddenTeamRegex: RegExp | null) {
  return hiddenTeamRegex ? text.replace(hiddenTeamRegex, '') : text;
}

function buildVintagePlayerSubLine(player: AbroadPlayerLike, hiddenTeamRegex: RegExp | null) {
  const levelLine = stripVintageTeamText(formatAbroadLevelLine(player), hiddenTeamRegex);
  const positionText = stripVintageTeamText(player.position ?? '', hiddenTeamRegex);
  const hiddenTeamTexts = [
    player.team,
    player.teamMeta?.displayName,
    player.teamMeta?.code,
    player.teamMeta?.abbreviation,
  ]
    .flatMap((value) => String(value ?? '').split(/[・／/|｜,，()（）\s]+/).concat(String(value ?? '')))
    .map(normalizeVintageInfoText)
    .filter(Boolean);

  const parts = levelLine
    .split(/[・／/|｜,，()（）\s]+/)
    .map((item) => formatVintageInfoPart(item))
    .filter(Boolean)
    .filter((item) => normalizeVintageInfoText(item) !== '40man')
    .filter((item) => !hiddenTeamTexts.includes(normalizeVintageInfoText(item)));
  const normalizedParts = new Set(parts.map(normalizeVintageInfoText));
  const positionParts = positionText
    .split(/[・／/|｜,，()（）\s]+/)
    .map((item) => formatVintageInfoPart(item))
    .filter(Boolean);

  positionParts.forEach((positionPart) => {
    const normalizedPosition = normalizeVintageInfoText(positionPart);

    if (normalizedPosition && !normalizedParts.has(normalizedPosition)) {
      parts.push(positionPart);
      normalizedParts.add(normalizedPosition);
    }
  });

  if (player.age) {
    parts.push(`AGE ${player.age}`);
  }

  return parts.join('  ');
}


function VintagePlayerCard({
  player,
  favorite,
  onPress,
  onToggleFavorite,
}: VintagePlayerCardProps) {

  const localPhotoSource = useMemo(
    () =>
      getAbroadPlayerPhotoSource(player.photoKey) ??
      getAbroadPlayerPhotoSource(player.id) ??
      getAbroadPlayerPhotoSource(getLocalPhotoKey(player.enName)) ??
      getAbroadPlayerPhotoSource(getLocalPhotoKey(player.name)),
    [player.photoKey, player.id, player.enName, player.name],
  );

  const hiddenTeamRegex = useMemo(() => getVintageHiddenTeamRegex(player), [player]);

  const teamMetaLine = useMemo(
    () => formatAbroadTeamLine(player).trim(),
    [player],
  );

  const playerSubLine = useMemo(
    () => buildVintagePlayerSubLine(player, hiddenTeamRegex),
    [player, hiddenTeamRegex],
  );

  const leagueStampSource = useMemo(
    () => getVintageLeagueStampSource(player),
    [player],
  );

  const teamLogoSource = useMemo(
    () =>
      getTeamLogoSource({
        logoKey: player.teamMeta?.logoKey,
      }),
    [player.teamMeta?.logoKey],
  );


  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardTicketBg}>
        <View style={styles.avatarSlot}>
          {localPhotoSource ? (
            <Image
              source={localPhotoSource}
              style={styles.portraitImage}
              resizeMode="contain"
            />
          ) : teamLogoSource ? (
            <Image
              source={teamLogoSource}
              style={styles.fallbackTeamLogo}
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
          <Text style={[styles.playerName, { fontFamily: getVintageTextFont(player.name) }]} numberOfLines={1}>
            {player.name}
          </Text>
          {teamMetaLine ? (
            <Text style={[styles.playerMeta, { fontFamily: getVintageTextFont(teamMetaLine) }]} numberOfLines={1}>
              {teamMetaLine}
            </Text>
          ) : null}
          <Text style={[styles.playerLine, { fontFamily: getVintageTextFont(playerSubLine) }]} numberOfLines={1}>
            {playerSubLine}
          </Text>
        </View>


        <TouchableOpacity
          style={[styles.statusTicket, favorite && styles.statusTicketActive]}
          activeOpacity={0.88}
          onPress={onToggleFavorite}
        >
          <Text style={[styles.statusNumber, { fontFamily: APP_FONT }]}>{String(player.number ?? '').replace(/[#＃]/g, '')}</Text>
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
    backgroundColor: 'rgba(255, 248, 232, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(183, 121, 69, 0.34)',
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
  fallbackTeamLogo: {
    width: VINTAGE_LAYOUT.photoSize * 0.72,
    height: VINTAGE_LAYOUT.photoSize * 0.72,
    opacity: 0.82,
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
    fontFamily: CN_FONT,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
    letterSpacing: 0.7,
    marginTop: 4,
    opacity: VINTAGE_OPACITY.text,
  },
  playerLine: {
    color: '#111111',
    fontFamily: CN_FONT,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    marginTop: 5,
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
      color: '#E8D7B4',
    fontFamily: APP_FONT,
    fontSize: 60,
    fontWeight: '900',
    lineHeight: 99,
    letterSpacing: -1,
    opacity: VINTAGE_OPACITY.number,
  },
});

export default memo(VintagePlayerCard);
