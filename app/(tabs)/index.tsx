import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ImageBackground,
  type ImageSourcePropType,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';

import AppEmptyState from '../../components/AppEmptyState';
import AbroadPlayerAvatar from '../../components/AbroadPlayerAvatar';

import { useHomeGames, type LeagueKey } from '../../hooks/useHomeGames';
import { buildLeagueHref } from '../../lib/homeGameSelector';
import { getMlbTeamLogo, getMlbTeamLogoByKey } from '../../constants/mlbTeamLogos';
import * as TeamLogoConstants from '../../constants/teamLogos';
import abroadPlayersLive from '../../server/data/abroadPlayers.live.json';
import cpblEventsCenter from '../../server/data/eventsCenter.cpbl.json';
import mlbEventsCenter from '../../server/data/eventsCenter.mlb.json';
import npbEventsCenter from '../../server/data/eventsCenter.npb.json';
import kboEventsCenter from '../../server/data/eventsCenter.kbo.json';



const homeImages = {
  hero: require('../../assets/yaren_one_icons_png_pack/baseball_hat.png'),
  map: require('../../assets/yaren_one_icons_png_pack/baseball_map.png'),
  horn: require('../../assets/yaren_one_icons_png_pack/horn.png'),
  paperBg: require('../../assets/yaren_one_icons_png_pack/paper_bg.png'),
  scoreTicketBg: require('../../assets/yaren_one_icons_png_pack/score_ticket_bg.png'),
  todayGamesTicketBg: require('../../assets/yaren_one_icons_png_pack/today_games_ticket_bg.png'),
  playerFocusTicketBg: require('../../assets/yaren_one_icons_png_pack/player_focus_ticket_bg.png'),
  finalStamp: require('../../assets/yaren_one_icons_png_pack/FINAL.png'),
};

const REGULAR_SEASON_TICKET_WIDTH = Dimensions.get('window').width - 10;
const REGULAR_SEASON_TICKET_GAP = 0;

const localTeamLogoByKey: Record<string, ImageSourcePropType> = {
  'wei-chuan-dragons': require('../../assets/cpbl/味全龍.png'),
  'uni-lions': require('../../assets/cpbl/統一7-ELEVEn獅.png'),
  'rakuten-monkeys': require('../../assets/cpbl/樂天桃猿.png'),
  'fubon-guardians': require('../../assets/cpbl/富邦悍將.png'),
  'ctbc-brothers': require('../../assets/cpbl/中信兄弟.png'),
  'tsg-hawks': require('../../assets/cpbl/台鋼雄鷹.png'),
  swallows: require('../../assets/npb/Tokyo Yakult Swal.png'),
  'yakult-swallows': require('../../assets/npb/Tokyo Yakult Swal.png'),
  'tokyo-yakult-swallows': require('../../assets/npb/Tokyo Yakult Swal.png'),
};


const APP_FONT = 'CityBurn';
const CN_FONT = 'FangZhengHei';


export default function HomePage() {
  const router = useRouter();
  useFonts({
    CityBurn: require('../../assets/fonts/CityBurn.ttf'),
    FangZhengHei: require('../../assets/fonts/FangZhengHei.ttf'),
  });
  const logoPulse = useRef(new Animated.Value(1)).current;
  const heroFloat = useRef(new Animated.Value(0)).current;
  const livePulse = useRef(new Animated.Value(0.45)).current;
  const regularSeasonTickerX = useRef(new Animated.Value(0)).current;
  const regularSeasonTickerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const regularSeasonDragStartX = useRef(0);
  const liveTicketShake = useRef(new Animated.Value(0)).current;
  const playerCardShake = useRef(new Animated.Value(0)).current;
  const playerCardOpacity = useRef(new Animated.Value(1)).current;
  const playerCardSlideX = useRef(new Animated.Value(0)).current;
  const playerCardEnterKey = useRef(0);
  const [todayGamesPage, setTodayGamesPage] = useState(0);
  const [focusPlayerPage, setFocusPlayerPage] = useState(0);
  const [previousFocusPlayerPage, setPreviousFocusPlayerPage] = useState(0);
  const [regularSeasonTickerHydrated, setRegularSeasonTickerHydrated] = useState(false);

  const {
    todayKey,
    mlbTodayKey,
    liveGames,
    leagueStats,
    refreshing,
    refresh,
  } = useHomeGames();

  useEffect(() => {
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const heroFloatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const liveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveTicketShake, {
          toValue: 1,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(liveTicketShake, {
          toValue: -1,
          duration: 90,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(liveTicketShake, {
          toValue: 0.6,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(liveTicketShake, {
          toValue: 0,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(2400),
      ])
    );

    logoLoop.start();
    heroFloatLoop.start();
    liveLoop.start();
    shakeLoop.start();

    return () => {
      logoLoop.stop();
      heroFloatLoop.stop();
      liveLoop.stop();
      shakeLoop.stop();
      logoPulse.setValue(1);
      heroFloat.setValue(0);
      livePulse.setValue(0.45);
      liveTicketShake.setValue(0);
      playerCardShake.setValue(0);
    };
  }, [logoPulse, heroFloat, livePulse, liveTicketShake, playerCardShake]);


  const totalGamesToday =
    leagueStats.CPBL.total +
    leagueStats.MLB.total +
    leagueStats.NPB.total +
    leagueStats.KBO.total;

  const totalLiveToday =
    leagueStats.CPBL.live +
    leagueStats.MLB.live +
    leagueStats.NPB.live +
    leagueStats.KBO.live;

  function openLeague(league: LeagueKey) {
    router.push(buildLeagueHref(league, league === 'MLB' ? mlbTodayKey : todayKey) as any);
  }

  function handleSeeMore() {
    router.push(`/events/pro?date=${todayKey}`);
  }


  function getTeamLogoSource(team?: any): ImageSourcePropType | undefined {
    const logo =
      team?.logoSource ??
      team?.logoImage ??
      team?.logoAsset ??
      team?.logo ??
      team?.logoUrl ??
      team?.logoUri ??
      team?.imageSource ??
      team?.image ??
      team?.imageUrl;

    if (logo) {
      return typeof logo === 'string' ? { uri: logo } : logo;
    }

    const logoKey = team?.logoKey ? String(team.logoKey) : undefined;
    if (logoKey && localTeamLogoByKey[logoKey]) return localTeamLogoByKey[logoKey];

    const sharedLogoInput = {
      logoKey: team?.logoKey,
      teamCode: team?.abbreviation ?? team?.short ?? team?.code,
      team: team?.name,
    };

    const sharedLogo =
      (TeamLogoConstants as any).getTeamLogoSource?.(sharedLogoInput) ??
      (TeamLogoConstants as any).getTeamLogo?.(sharedLogoInput) ??
      (TeamLogoConstants as any).resolveTeamLogo?.(sharedLogoInput) ??
      (logoKey ? (TeamLogoConstants as any).TEAM_LOGOS?.[logoKey] : undefined) ??
      (logoKey ? (TeamLogoConstants as any).teamLogos?.[logoKey] : undefined);

    if (sharedLogo) return sharedLogo;

    const mlbLogo = getMlbTeamLogoByKey(logoKey) ?? getMlbTeamLogo(team);
    return mlbLogo ? mlbLogo : undefined;
  }

  function getEventsCenterGames(source: any, dateKey: string, league: LeagueKey) {
    const games =
      source?.gamesByDate?.[dateKey] ??
      source?.gamesByDate?.[String(dateKey)] ??
      source?.games ??
      [];

    if (!Array.isArray(games)) return [];

    return games.map((game: any) => ({ league, game, dateKey }));
  }

  function isGameLiveLike(game: any) {
    const statusText = `${game?.status ?? ''} ${game?.footerRight ?? ''}`.toLowerCase();
    return (
      Boolean(game?.isLive) ||
      statusText.includes('live') ||
      statusText.includes('比賽中') ||
      statusText.includes('局') ||
      statusText.includes('上') ||
      statusText.includes('下')
    );
  }

  function isGameFinalLike(game: any) {
    const statusText = `${game?.status ?? ''} ${game?.footerRight ?? ''}`.toLowerCase();
    return (
      Boolean(game?.isFinal) ||
      statusText.includes('final') ||
      statusText.includes('結束') ||
      statusText.includes('完賽') ||
      statusText.includes('已完賽')
    );
  }

  function getGameStartDate(game: any, dateKey?: string) {
    const rawTime =
      game?.gameTimeText ??
      game?.timeText ??
      game?.startTimeText ??
      game?.startTimeLocal ??
      game?.gameTime ??
      game?.time ??
      game?.scheduledTime ??
      game?.footerRight;

    if (dateKey && typeof rawTime === 'string') {
      const timeMatch = rawTime.match(/(\d{1,2})[:：](\d{2})\s*(AM|PM|上午|下午)?/i);
      if (timeMatch) {
        const [, rawHour, minute, meridiem] = timeMatch;
        let hourNumber = Number(rawHour);
        const meridiemText = `${meridiem ?? ''}`.toLowerCase();

        if ((meridiemText === 'pm' || meridiemText === '下午') && hourNumber < 12) {
          hourNumber += 12;
        }

        if ((meridiemText === 'am' || meridiemText === '上午') && hourNumber === 12) {
          hourNumber = 0;
        }

        const hour = `${hourNumber}`.padStart(2, '0');
        const parsed = new Date(`${dateKey}T${hour}:${minute}:00+08:00`);
        if (!Number.isNaN(parsed.getTime())) return parsed;
      }
    }

    const rawDate =
      game?.startTime ??
      game?.startDate ??
      game?.gameDate ??
      game?.dateTime ??
      game?.scheduledAt ??
      game?.timestamp;

    if (typeof rawDate === 'string' && rawDate.includes('T')) {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (typeof rawDate === 'number') {
      const parsed = new Date(rawDate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return undefined;
  }

  function isUpcomingWithin12Hours(item: any) {
    const game = item?.game;
    if (!game || isGameLiveLike(game) || isGameFinalLike(game)) return false;

    const startDate = getGameStartDate(game, item?.dateKey);
    if (!startDate) return false;

    const now = new Date();
    const diffMs = startDate.getTime() - now.getTime();
    return diffMs >= 0 && diffMs <= 12 * 60 * 60 * 1000;
  }

  function formatUpcomingGameTime(game: any, dateKey?: string) {
    const startDate = getGameStartDate(game, dateKey);
    if (startDate) {
      return startDate.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    return (
      game?.gameTimeText ??
      game?.timeText ??
      game?.startTimeText ??
      game?.startTimeLocal ??
      game?.gameTime ??
      game?.time ??
      game?.scheduledTime ??
      game?.footerRight ??
      ''
    );
  }

  function addDateKeyDays(dateKey: string, days: number) {
    const parsed = new Date(`${dateKey}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return dateKey;

    parsed.setUTCDate(parsed.getUTCDate() + days);
    return parsed.toISOString().slice(0, 10);
  }


  function isFinalWithin12Hours(game: any, dateKey: string) {
    if (!isGameFinalLike(game)) return false;

    const now = new Date();
    const todayTaipeiKey = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });
    const yesterdayTaipeiKey = addDateKeyDays(todayTaipeiKey, -1);
    const gameDate = getGameStartDate(game, dateKey);
    const gameTaipeiKey = gameDate
      ? gameDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' })
      : dateKey;

    if (gameTaipeiKey !== todayTaipeiKey && gameTaipeiKey !== yesterdayTaipeiKey) {
      return false;
    }

    const gameTime = gameDate?.getTime();
    if (!gameTime) return true;

    const diffMs = now.getTime() - gameTime;

    return diffMs >= 0 && diffMs <= 18 * 60 * 60 * 1000;
  }

  function getRecentFinalGames(source: any, league: LeagueKey) {
    const gamesByDate = source?.gamesByDate ?? {};

    return Object.entries(gamesByDate).flatMap(([dateKey, games]) => {
      if (!Array.isArray(games)) return [];

      return games
        .map((game: any) => ({
          league,
          game,
          dateKey,
        }))
        .filter((item) => isFinalWithin12Hours(item.game, item.dateKey));
    });
  }




  const abroadPlayers = Array.isArray((abroadPlayersLive as any)?.players)
    ? (abroadPlayersLive as any).players
    : Array.isArray(abroadPlayersLive)
      ? (abroadPlayersLive as any)
      : [];

  function getRecentGameTime(player: any) {
    const recentGame = Array.isArray(player?.recentGames) ? player.recentGames[0] : undefined;
    const rawDate = recentGame?.date ?? recentGame?.gameDate ?? recentGame?.playedAt;
    if (!rawDate) return 0;

    const parsed = new Date(`${String(rawDate).slice(0, 10)}T00:00:00+08:00`);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  const latestRecentGameTime = abroadPlayers.reduce((latest: number, player: any) => {
    return Math.max(latest, getRecentGameTime(player));
  }, 0);

  const recentActivePlayers = abroadPlayers
    .filter((player: any) => {
      const recentGameTime = getRecentGameTime(player);
      if (!recentGameTime || !latestRecentGameTime) return false;
      return latestRecentGameTime - recentGameTime <= 2 * 24 * 60 * 60 * 1000;
    })
    .sort((a: any, b: any) => getRecentGameTime(b) - getRecentGameTime(a));

  const fallbackFocusPlayer = abroadPlayers.find((player: any) => {
    const playerText = JSON.stringify(player).toLowerCase();
    return playerText.includes('林安可') || playerText.includes('lin an-ko') || playerText.includes('an-ko-lin');
  });

  const focusPlayerCount = Math.max(1, recentActivePlayers.length);
  const focusPlayer = recentActivePlayers[focusPlayerPage % focusPlayerCount] ?? fallbackFocusPlayer;
  const previousFocusPlayer = recentActivePlayers[previousFocusPlayerPage % focusPlayerCount] ?? fallbackFocusPlayer;
  function formatPlayerEnglishName(name?: string) {
    const text = `${name ?? ''}`.trim().replace(/\s+/g, ' ');
    return text ? text.toUpperCase() : 'PLAYER';
  }
  const focusPlayerNumber = focusPlayer?.number ?? '-';
  const rawFocusPlayerNameEn =
    focusPlayer?.nameAbbrEn ??
    focusPlayer?.abbrNameEn ??
    focusPlayer?.shortNameEn ??
    focusPlayer?.displayNameAbbr ??
    focusPlayer?.nameEn ??
    focusPlayer?.enName ??
    focusPlayer?.englishName ??
    focusPlayer?.displayNameEn ??
    'LIN AN-KO';
  const focusPlayerNameEn = formatPlayerEnglishName(rawFocusPlayerNameEn);
  const focusPlayerNameZh = focusPlayer?.nameZh ?? focusPlayer?.name ?? focusPlayer?.displayName ?? '林安可';
  const focusRecentGame = Array.isArray(focusPlayer?.recentGames) ? focusPlayer.recentGames[0] : undefined;
  const focusGameDateText = focusRecentGame?.date ? String(focusRecentGame.date).slice(5).replace('-', '/') : '05/10';
  const rawFocusOpponentText = `${focusRecentGame?.opponentAbbr ?? focusRecentGame?.opponentCode ?? focusRecentGame?.opponentShortName ?? focusRecentGame?.opponent ?? focusRecentGame?.matchup ?? '樂天'}`;
  const focusGameOpponentText = getTeamAbbr(rawFocusOpponentText);
  function getTeamAbbr(teamName?: string) {
    const text = `${teamName ?? ''}`.trim();
    const normalized = text.toLowerCase().replace(/[\s.\-_]/g, '');

    const map: Record<string, string> = {
      樂天: 'RAK',
      樂天桃猿: 'RAK',
      rakutenmonkeys: 'RAK',
      rakuten: 'RAK',
      味全: 'WCD',
      味全龍: 'WCD',
      weichuandragons: 'WCD',
      統一: 'UNI',
      統一獅: 'UNI',
      統一7eleven獅: 'UNI',
      unilions: 'UNI',
      富邦: 'FBG',
      富邦悍將: 'FBG',
      fubonguardians: 'FBG',
      中信: 'CTB',
      中信兄弟: 'CTB',
      ctbcbrothers: 'CTB',
      台鋼: 'TSG',
      台鋼雄鷹: 'TSG',
      tsghawks: 'TSG',
      養樂多: 'YAK',
      東京養樂多燕子: 'YAK',
      swallows: 'YAK',
      tokyoyakultswallows: 'YAK',
      樂天金鷲: 'RAK',
      rakutengoldeneagles: 'RAK',
      西武: 'SEI',
      埼玉西武獅: 'SEI',
      seibulions: 'SEI',
      羅德: 'LOT',
      千葉羅德海洋: 'LOT',
      chibalottemarines: 'LOT',
    };

    return map[text] ?? map[normalized] ?? text.slice(0, 3).toUpperCase();
  }
  const focusGameTitleText = `${focusGameDateText} vs ${focusGameOpponentText}`;

  function hasValue(value: any) {
    return value !== undefined && value !== null && value !== '' && value !== '-';
  }

  function normalizeFocusStatLine(line?: string) {
    const text = `${line ?? ''}`.trim();
    if (!text || text === '-') return '';

    return text
      .replace(/被全壘打/g, 'HR')
      .replace(/被安打/g, 'H')
      .replace(/責失分/g, 'ER')
      .replace(/責失/g, 'ER')
      .replace(/投球局數/g, 'IP')
      .replace(/用球數/g, 'P')
      .replace(/投球數/g, 'P')
      .replace(/用球/g, 'P')
      .replace(/球數/g, 'P')
      .replace(/打數/g, 'AB')
      .replace(/安打/g, 'H')
      .replace(/打點/g, 'RBI')
      .replace(/得分/g, 'R')
      .replace(/全壘打/g, 'HR')
      .replace(/保送/g, 'BB')
      .replace(/四壞/g, 'BB')
      .replace(/三振/g, 'K')
      .replace(/局/g, 'IP')
      .replace(/失分/g, 'R')
      .replace(/勝投/g, 'W')
      .replace(/敗投/g, 'L')
      .replace(/中繼/g, 'HLD')
      .replace(/救援/g, 'SV')
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/[\u4e00-\u9fff]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function getRealFocusStatLines(recentGame: any) {
    const realLineOne =
      recentGame?.detail1 ??
      recentGame?.lineOne ??
      recentGame?.battingLine ??
      recentGame?.pitchingLine ??
      recentGame?.summary;

    const realLineTwo =
      recentGame?.detail2 ??
      recentGame?.lineTwo ??
      recentGame?.detail ??
      recentGame?.stats;

    return [normalizeFocusStatLine(realLineOne), normalizeFocusStatLine(realLineTwo)].filter(Boolean);
  }

  function isPitcherPlayer(player: any, recentGame: any) {
    const roleText = `${player?.position ?? ''} ${player?.role ?? ''} ${player?.type ?? ''} ${recentGame?.position ?? ''}`.toLowerCase();
    return (
      roleText.includes('投手') ||
      roleText.includes('pitcher') ||
      roleText.includes('p') ||
      hasValue(recentGame?.inningsPitched) ||
      hasValue(recentGame?.ip) ||
      hasValue(recentGame?.earnedRuns) ||
      hasValue(recentGame?.era)
    );
  }

  function buildFocusStatLines(player: any, recentGame: any) {
    const realStatLines = getRealFocusStatLines(recentGame);
    if (realStatLines.length >= 2) return [realStatLines[0], realStatLines[1]];
    if (realStatLines.length === 1) {
      return isPitcherPlayer(player, recentGame)
        ? [realStatLines[0], '0BB / 0K / 0HR']
        : [realStatLines[0], '0R / 0HR / 0BB / 0K'];
    }

    if (!recentGame) {
      return isPitcherPlayer(player, recentGame)
        ? ['0.0IP / 0H / 0ER', '0BB / 0K / 0HR']
        : ['0AB / 0H / 0RBI', '0R / 0HR / 0BB / 0K'];
    }

    if (isPitcherPlayer(player, recentGame)) {
      const ip = recentGame?.inningsPitched ?? recentGame?.ip ?? recentGame?.innings ?? '0.0';
      const hits = recentGame?.hitsAllowed ?? recentGame?.hits ?? recentGame?.h ?? 0;
      const earnedRuns = recentGame?.earnedRuns ?? recentGame?.er ?? recentGame?.runs ?? 0;
      const walks = recentGame?.walks ?? recentGame?.bb ?? 0;
      const strikeouts = recentGame?.strikeouts ?? recentGame?.k ?? 0;
      const homeRuns = recentGame?.homeRunsAllowed ?? recentGame?.homeRuns ?? recentGame?.hr ?? 0;
      const pitches = recentGame?.pitches ?? recentGame?.pitchCount ?? recentGame?.totalPitches;

      return [
        `${ip}IP / ${hits}H / ${earnedRuns}ER`,
        hasValue(pitches)
          ? `${walks}BB / ${strikeouts}K / ${pitches}P`
          : `${walks}BB / ${strikeouts}K / ${homeRuns}HR`,
      ];
    }

    const atBats = recentGame?.atBats ?? recentGame?.ab ?? 0;
    const hits = recentGame?.hits ?? recentGame?.h ?? 0;
    const rbi = recentGame?.rbi ?? recentGame?.runsBattedIn ?? 0;
    const runs = recentGame?.runs ?? recentGame?.r ?? 0;
    const homeRuns = recentGame?.homeRuns ?? recentGame?.hr ?? 0;
    const walks = recentGame?.walks ?? recentGame?.bb ?? 0;
    const strikeouts = recentGame?.strikeouts ?? recentGame?.k ?? 0;

    return [
      `${atBats}AB / ${hits}H / ${rbi}RBI`,
      `${runs}R / ${homeRuns}HR / ${walks}BB / ${strikeouts}K`,
    ];
  }

  function fitFocusStatLines(lineOne?: string, lineTwo?: string) {
    const first = `${lineOne ?? ''}`.trim();
    const second = `${lineTwo ?? ''}`.trim();

    if (first.length <= 18 && second.length <= 18) {
      return [first, second];
    }

    const tokens = [first, second]
      .join(' / ')
      .split('/')
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length <= 2) return [first, second];

    const totalLength = tokens.join(' / ').length;
    let bestSplitIndex = 1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 1; index < tokens.length; index += 1) {
      const leftLength = tokens.slice(0, index).join(' / ').length;
      const distance = Math.abs(totalLength / 2 - leftLength);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSplitIndex = index;
      }
    }

    return [
      tokens.slice(0, bestSplitIndex).join(' / '),
      tokens.slice(bestSplitIndex).join(' / '),
    ];
  }

  const [rawFocusGameLineOne, rawFocusGameLineTwo] = buildFocusStatLines(focusPlayer, focusRecentGame);
  const [focusGameLineOne, focusGameLineTwo] = fitFocusStatLines(rawFocusGameLineOne, rawFocusGameLineTwo);
  const previousFocusPlayerNumber = previousFocusPlayer?.number ?? '-';
  const rawPreviousFocusPlayerNameEn =
    previousFocusPlayer?.nameAbbrEn ??
    previousFocusPlayer?.abbrNameEn ??
    previousFocusPlayer?.shortNameEn ??
    previousFocusPlayer?.displayNameAbbr ??
    previousFocusPlayer?.nameEn ??
    previousFocusPlayer?.enName ??
    previousFocusPlayer?.englishName ??
    previousFocusPlayer?.displayNameEn ??
    'LIN AN-KO';
  const previousFocusPlayerNameEn = formatPlayerEnglishName(rawPreviousFocusPlayerNameEn);
  const previousFocusPlayerNameZh = previousFocusPlayer?.nameZh ?? previousFocusPlayer?.name ?? previousFocusPlayer?.displayName ?? '林安可';
  const previousFocusRecentGame = Array.isArray(previousFocusPlayer?.recentGames) ? previousFocusPlayer.recentGames[0] : undefined;
  const previousFocusGameDateText = previousFocusRecentGame?.date ? String(previousFocusRecentGame.date).slice(5).replace('-', '/') : '05/10';
  const rawPreviousFocusOpponentText = `${previousFocusRecentGame?.opponentAbbr ?? previousFocusRecentGame?.opponentCode ?? previousFocusRecentGame?.opponentShortName ?? previousFocusRecentGame?.opponent ?? previousFocusRecentGame?.matchup ?? '樂天'}`;
  const previousFocusGameOpponentText = getTeamAbbr(rawPreviousFocusOpponentText);
  const previousFocusGameTitleText = `${previousFocusGameDateText} vs ${previousFocusGameOpponentText}`;
  const [rawPreviousFocusGameLineOne, rawPreviousFocusGameLineTwo] = buildFocusStatLines(previousFocusPlayer, previousFocusRecentGame);
  const [previousFocusGameLineOne, previousFocusGameLineTwo] = fitFocusStatLines(rawPreviousFocusGameLineOne, rawPreviousFocusGameLineTwo);

  const mlbScheduleKeys = Array.from(new Set([
    addDateKeyDays(mlbTodayKey, -1),
    mlbTodayKey,
    addDateKeyDays(mlbTodayKey, 1),
    ...Object.keys((mlbEventsCenter as any).gamesByDate ?? {}).slice(-2),
  ]));

  const allTodayGames = [
    ...getEventsCenterGames(cpblEventsCenter, todayKey, 'CPBL'),
    ...getEventsCenterGames(npbEventsCenter, todayKey, 'NPB'),
    ...getEventsCenterGames(kboEventsCenter, todayKey, 'KBO'),
    ...mlbScheduleKeys.flatMap((dateKey) => getEventsCenterGames(mlbEventsCenter, dateKey, 'MLB')),
  ];

  const upcomingTodayGames = allTodayGames
    .filter((item) => isUpcomingWithin12Hours(item))
    .sort((a, b) => {
      const aTime = getGameStartDate(a.game, a.dateKey)?.getTime() ?? 0;
      const bTime = getGameStartDate(b.game, b.dateKey)?.getTime() ?? 0;
      return aTime - bTime;
    });

  const recentFinalGames = [
    ...getRecentFinalGames(cpblEventsCenter, 'CPBL'),
    ...getRecentFinalGames(mlbEventsCenter, 'MLB'),
    ...getRecentFinalGames(npbEventsCenter, 'NPB'),
    ...getRecentFinalGames(kboEventsCenter, 'KBO'),
  ]
    .sort((a, b) => {
      const aTime = getGameStartDate(a.game, a.dateKey)?.getTime() ?? new Date(`${a.dateKey}T00:00:00+08:00`).getTime();
      const bTime = getGameStartDate(b.game, b.dateKey)?.getTime() ?? new Date(`${b.dateKey}T00:00:00+08:00`).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  const todayGameSource = upcomingTodayGames;
  const todayGamesEmptyMessage = allTodayGames.length > 0 ? '近期無賽事' : '停賽期';

  const todayGamesPageCount = Math.max(1, Math.ceil(todayGameSource.length / 5));
  const todayGameRows = todayGameSource
    .slice(todayGamesPage * 5, todayGamesPage * 5 + 5)
    .map((item) => {
      const away =
        item.game.awayTeam?.shortName ??
        item.game.awayTeam?.name ??
        '-';

      const home =
        item.game.homeTeam?.shortName ??
        item.game.homeTeam?.name ??
        '-';

      return {
        league: item.league,
        away,
        home,
        time: formatUpcomingGameTime(item.game, item.dateKey),
        awayLogo: getTeamLogoSource(item.game.awayTeam),
        homeLogo: getTeamLogoSource(item.game.homeTeam),
      };
    });

  const regularSeasonCardSourceItems = (() => {
    const liveItems = allTodayGames.filter((item) => isGameLiveLike(item.game));

    if (liveItems.length > 0) {
      const finalFillers = recentFinalGames.filter((finalItem) => {
        const finalGameId = finalItem?.game?.id;
        return !finalGameId || !liveItems.some((liveItem) => liveItem?.game?.id === finalGameId);
      });

      return [...liveItems, ...finalFillers];
    }

    return recentFinalGames;
  })();

  const regularSeasonInitialItems = regularSeasonCardSourceItems.slice(0, 3);
  const regularSeasonHydratedItems = regularSeasonCardSourceItems.filter((item) => isGameLiveLike(item.game));
  const regularSeasonCardItems = regularSeasonTickerHydrated && regularSeasonHydratedItems.length > 0
    ? regularSeasonHydratedItems
    : regularSeasonInitialItems;

  const regularSeasonCardLoopItems = regularSeasonCardItems.length > 0
    ? [...regularSeasonCardItems, ...regularSeasonCardItems]
    : [];

  const regularSeasonTickerDistance =
    (REGULAR_SEASON_TICKET_WIDTH + REGULAR_SEASON_TICKET_GAP) * Math.max(1, regularSeasonCardItems.length);

  function normalizeRegularSeasonTickerX(value: number) {
    if (regularSeasonTickerDistance <= 0) return 0;

    const normalized = value % regularSeasonTickerDistance;
    return normalized > 0 ? normalized - regularSeasonTickerDistance : normalized;
  }

  function startRegularSeasonTicker(fromValue = 0) {
    regularSeasonTickerAnimationRef.current?.stop();

    if (regularSeasonCardItems.length <= 1) {
      regularSeasonTickerX.setValue(0);
      return;
    }

    const normalizedFrom = normalizeRegularSeasonTickerX(fromValue);
    const remainingDistance = Math.max(1, regularSeasonTickerDistance + normalizedFrom);
    const durationPerPixel = Math.max(12000, regularSeasonCardItems.length * 5600) / regularSeasonTickerDistance;

    regularSeasonTickerX.setValue(normalizedFrom);

    const animation = Animated.timing(regularSeasonTickerX, {
      toValue: -regularSeasonTickerDistance,
      duration: remainingDistance * durationPerPixel,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    regularSeasonTickerAnimationRef.current = animation;
    animation.start(({ finished }) => {
      if (!finished) return;
      startRegularSeasonTicker(0);
    });
  }

  const regularSeasonTickerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        regularSeasonTickerAnimationRef.current?.stop();
        regularSeasonTickerX.stopAnimation((value) => {
          regularSeasonDragStartX.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue = normalizeRegularSeasonTickerX(
          regularSeasonDragStartX.current + gestureState.dx
        );
        regularSeasonTickerX.setValue(nextValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const nextValue = normalizeRegularSeasonTickerX(
          regularSeasonDragStartX.current + gestureState.dx
        );
        startRegularSeasonTicker(nextValue);
      },
      onPanResponderTerminate: () => {
        regularSeasonTickerX.stopAnimation((value) => {
          startRegularSeasonTicker(value);
        });
      },
    })
  ).current;


  useEffect(() => {
    setRegularSeasonTickerHydrated(false);

    const timer = setTimeout(() => {
      setRegularSeasonTickerHydrated(true);
    }, 900);

    return () => clearTimeout(timer);
  }, [regularSeasonCardSourceItems.length]);

  useEffect(() => {
    startRegularSeasonTicker(0);

    return () => {
      regularSeasonTickerAnimationRef.current?.stop();
      regularSeasonTickerX.setValue(0);
    };
  }, [regularSeasonTickerDistance, regularSeasonCardItems.length, regularSeasonTickerX]);

  useEffect(() => {
    if (todayGamesPageCount <= 1) {
      setTodayGamesPage(0);
      return;
    }

    const timer = setInterval(() => {
      setTodayGamesPage((page) => (page + 1) % todayGamesPageCount);
    }, 3200);

    return () => clearInterval(timer);
  }, [todayGamesPageCount]);

  useEffect(() => {
    if (recentActivePlayers.length <= 1) {
      setFocusPlayerPage(0);
      setPreviousFocusPlayerPage(0);
      return;
    }

    const timer = setInterval(() => {
      playerCardEnterKey.current += 1;
      setFocusPlayerPage((page) => {
        setPreviousFocusPlayerPage(page);
        return (page + 1) % recentActivePlayers.length;
      });
    }, 4200);

    return () => clearInterval(timer);
  }, [recentActivePlayers.length]);

  useEffect(() => {
    playerCardShake.setValue(0.8);
    playerCardOpacity.setValue(0.35);
    playerCardSlideX.setValue(260);

    const cardChangeMotion = Animated.parallel([
      Animated.sequence([
        Animated.timing(playerCardShake, {
          toValue: 1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(playerCardShake, {
          toValue: -1,
          duration: 80,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(playerCardShake, {
          toValue: 0,
          duration: 70,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(playerCardOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(playerCardSlideX, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    cardChangeMotion.start();

    return () => {
      cardChangeMotion.stop();
      playerCardShake.setValue(0);
      playerCardOpacity.setValue(1);
      playerCardSlideX.setValue(0);
    };
  }, [focusPlayerPage, playerCardShake, playerCardOpacity, playerCardSlideX]);



  return (
    <ImageBackground source={homeImages.paperBg} style={styles.pageBackground} resizeMode="cover">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.topBar}>
          <Text style={styles.menuIcon}>☰</Text>
          <View style={styles.brandHeader}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandWord}>野席報</Text>
              <Text style={styles.brandSub}>球場通信</Text>
            </View>
            <Text style={styles.brandStars}>SINCE 2026</Text>
          </View>
          <View style={styles.bellWrap}>
            <Image source={homeImages.horn} style={styles.hornIcon} resizeMode="contain" />
            {liveGames.length > 0 ? <View style={styles.noticeDot} /> : null}
          </View>
        </View>

        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >

        <View style={styles.posterHero}>
          <Animated.View style={[styles.heroCopyBlock, { transform: [{ scale: logoPulse }] }]}>
            <Text style={styles.posterTitle}>PLAY{`\n`}EVERY{`\n`}DAY.</Text>
            <Text style={styles.posterSlogan}>LIVE.{`\n`}LOVE.{`\n`}BASEBALL.</Text>
          </Animated.View>
          <View style={styles.heroIllustration}>
            <Image
              source={homeImages.map}
              style={styles.heroFieldBadge}
              resizeMode="contain"
            />

            <Animated.Image
              source={homeImages.hero}
              style={[
                styles.heroPosterImage,
                {
                  transform: [
                    { rotate: '-4deg' },
                    {
                      translateY: heroFloat.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -2],
                      }),
                    },
                  ],
                },
              ]}
              resizeMode="contain"
            />
          </View>
          <View pointerEvents="none" style={styles.heroTicketTearLine}>
            {Array.from({ length: 18 }).map((_, index) => (
              <View key={`hero-tear-${index}`} style={styles.heroTicketTearHole} />
            ))}
          </View>
        </View>

        <View style={styles.regularSeasonTickerViewport} {...regularSeasonTickerPanResponder.panHandlers}>
          <Animated.View
            style={[
              styles.regularSeasonTickerRail,
              { transform: [{ translateX: regularSeasonTickerX }] },
            ]}
          >
            {regularSeasonCardLoopItems.length > 0 ? (
              regularSeasonCardLoopItems.map((item: any, index: number) => {
                const game = item?.game;
                const league = item?.league ?? 'CPBL';
                const awayLogo = getTeamLogoSource(game?.awayTeam);
                const homeLogo = getTeamLogoSource(game?.homeTeam);
                const isFinal = game ? isGameFinalLike(game) : false;
                const isLive = game ? isGameLiveLike(game) && !isFinal : false;
                const awayScoreValue = Number(game?.awayScore);
                const homeScoreValue = Number(game?.homeScore);
                const hasFinalWinner = isFinal && Number.isFinite(awayScoreValue) && Number.isFinite(homeScoreValue) && awayScoreValue !== homeScoreValue;
                const awayWon = hasFinalWinner && awayScoreValue > homeScoreValue;
                const homeWon = hasFinalWinner && homeScoreValue > awayScoreValue;
                const awayLost = hasFinalWinner && homeWon;
                const homeLost = hasFinalWinner && awayWon;
                const finalStampVariant = index % 3;
                const itemAwayRecord = game?.awayTeam?.record ? `(${game.awayTeam.record})` : '';
                const itemHomeRecord = game?.homeTeam?.record ? `(${game.homeTeam.record})` : '';

                return (
                  <Animated.View
                    key={`${league}-${game?.id ?? index}-${index}`}
                    style={[
                      styles.liveScoreCardAnimatedWrap,
                      isLive
                        ? {
                            transform: [
                              {
                                translateX: liveTicketShake.interpolate({
                                  inputRange: [-1, 0, 1],
                                  outputRange: [-1.2, 0, 1.2],
                                }),
                              },
                              {
                                rotate: liveTicketShake.interpolate({
                                  inputRange: [-1, 0, 1],
                                  outputRange: ['-0.18deg', '0deg', '0.18deg'],
                                }),
                              },
                            ],
                          }
                        : null,
                    ]}
                  >
                    <ImageBackground
                      source={homeImages.scoreTicketBg}
                      style={styles.liveScoreCardSlide}
                      imageStyle={styles.liveScoreCardBg}
                      resizeMode="stretch"
                    >
                    <View style={styles.liveMetaRow}>
                      {isLive ? (
                        <View style={styles.liveBadge}>
                          <Animated.View
                            style={[
                              styles.liveBadgeDot,
                              {
                                opacity: livePulse,
                                transform: [{ scale: livePulse }],
                              },
                            ]}
                          />
                          <Text style={styles.liveBadgeText}>LIVE</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.liveLeagueText, !isLive && styles.liveLeagueTextNoBadge]}>例行賽</Text>
                      <View style={styles.liveStatsWrap}>
                        <Text style={styles.liveStatText}>
                          今日場次 <Text style={styles.liveStatNumber}>{totalGamesToday}</Text>
                        </Text>
                        <Text style={styles.liveStatText}>
                          LIVE <Text style={styles.liveStatNumber}>{totalLiveToday}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.scoreDivider} />

                    {game ? (
                      <TouchableOpacity activeOpacity={0.9} onPress={() => openLeague(league as LeagueKey)}>
                        <View style={styles.matchupRow}>
                          <View style={styles.teamSideLeft}>
                            {awayLogo ? (
                              <Image source={awayLogo} style={styles.teamLogoImage} resizeMode="contain" />
                            ) : (
                              <Text style={styles.fakeLogo}>{game.awayTeam?.name?.slice(0, 1) ?? 'A'}</Text>
                            )}
                            <View>
                              <Text style={styles.teamName}>{game.awayTeam?.name}</Text>
                              <Text style={styles.teamRecord}>{itemAwayRecord}</Text>
                            </View>
                          </View>

                          <View style={styles.bigScoreWrap}>
                            <Text
                              style={[
                                styles.awayBigScore,
                                awayWon ? styles.winningBigScore : null,
                                awayLost ? styles.losingBigScore : null,
                              ]}
                            >
                              {game.awayScore ?? '-'}
                            </Text>
                            <Text style={styles.scoreDash}>−</Text>
                            <Text
                              style={[
                                styles.homeBigScore,
                                homeWon ? styles.winningBigScore : null,
                                homeLost ? styles.losingBigScore : null,
                              ]}
                            >
                              {game.homeScore ?? '-'}
                            </Text>
                          </View>

                          <View style={styles.teamSideRight}>
                            <View>
                              <Text style={[styles.teamName, styles.teamNameRight]}>{game.homeTeam?.name}</Text>
                              <Text style={[styles.teamRecord, styles.teamNameRight]}>{itemHomeRecord}</Text>
                            </View>
                            {homeLogo ? (
                              <Image source={homeLogo} style={styles.teamLogoImage} resizeMode="contain" />
                            ) : (
                              <Text style={styles.fakeLogo}>{game.homeTeam?.name?.slice(0, 1) ?? 'H'}</Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <AppEmptyState
                        title="目前沒有進行中的比賽"
                        description="今日 CPBL / MLB / NPB / KBO 若無賽程，首頁會顯示即將開打賽事。"
                        icon="baseball-outline"
                        compact
                      />
                    )}

                    <TouchableOpacity style={styles.moreGameButton} activeOpacity={0.85} onPress={handleSeeMore}>
                      <Text style={styles.moreGameText}>看更多賽事  ›</Text>
                    </TouchableOpacity>
                    {isFinal ? (
                      <Image
                        source={homeImages.finalStamp}
                        style={[
                          styles.finalStampImage,
                          homeLost ? styles.finalStampNearHomeScore : styles.finalStampNearAwayScore,
                          finalStampVariant === 1 ? styles.finalStampImageAltOne : null,
                          finalStampVariant === 2 ? styles.finalStampImageAltTwo : null,
                        ]}
                        resizeMode="contain"
                      />
                    ) : null}
                  </ImageBackground>
                  </Animated.View>
                );
              })
            ) : (
              <ImageBackground
                source={homeImages.scoreTicketBg}
                style={styles.liveScoreCardSlide}
                imageStyle={styles.liveScoreCardBg}
                resizeMode="stretch"
              >
                <AppEmptyState
                  title="目前沒有進行中的比賽"
                  description="今日 CPBL / MLB / NPB / KBO 若無賽程，首頁會顯示即將開打賽事。"
                  icon="baseball-outline"
                  compact
                />
              </ImageBackground>
            )}
          </Animated.View>
        </View>


        <View style={styles.gridRow}>
          <View style={styles.todayGamesCard}>
            <Image source={homeImages.todayGamesTicketBg} style={styles.todayGamesCardBgImage} resizeMode="stretch" />
            <View style={styles.todayGamesContentLayer}>
              <Text style={styles.cardTitleLight}>TODAY'S GAMES</Text>
              <View style={styles.todayGamesFixedList}>
                {todayGameRows.length === 0 ? (
                  <View style={styles.todayGamesEmptyWrap}>
                    <Text style={styles.todayGamesEmptyText}>{todayGamesEmptyMessage}</Text>
                  </View>
                ) : (
                  todayGameRows.map((row, index) => (
                    <View key={`${row.league}-${todayGamesPage}-${index}`} style={styles.gameListRow}>
                      <View style={styles.flipTimeCell}>
                        <Text style={styles.gameTime}>{row.time}</Text>
                      </View>
                      <View style={styles.flipMatchupCell}>
                        <View style={styles.gameLogoMatchupWrap}>
                          {row.awayLogo ? (
                            <Image source={row.awayLogo} style={styles.gameTeamLogo} resizeMode="contain" />
                          ) : (
                            <Text style={styles.gameLogoFallback}>{row.away.slice(0, 1)}</Text>
                          )}
                          <Text style={styles.gameVsText}>vs</Text>
                          {row.homeLogo ? (
                            <Image source={row.homeLogo} style={styles.gameTeamLogo} resizeMode="contain" />
                          ) : (
                            <Text style={styles.gameLogoFallback}>{row.home.slice(0, 1)}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
          <View style={styles.playerFocusCardStackWrap}>
            <View style={styles.playerFocusCardBaseWrap}>
              <View style={styles.playerAvatarBackLayer}>
                <AbroadPlayerAvatar
                  name={previousFocusPlayerNameZh}
                  team={previousFocusPlayer?.team}
                  league={previousFocusPlayer?.league}
                  level={previousFocusPlayer?.level}
                  teamCode={previousFocusPlayer?.teamMeta?.code ?? previousFocusPlayer?.teamMeta?.abbreviation}
                  logoKey={previousFocusPlayer?.teamMeta?.logoKey}
                  photoUri={previousFocusPlayer?.officialPhotoUrl}
                  teamColor={previousFocusPlayer?.teamColor}
                  size={139}
                  textSize={14}
                  borderRadius={0}
                />
              </View>
              <ImageBackground
                source={homeImages.playerFocusTicketBg}
                style={styles.playerFocusCard}
                imageStyle={styles.playerFocusCardBg}
                resizeMode="stretch"
              >
                <Text style={styles.playerCardTitle}>★ PLAYER FOCUS ★</Text>
                <View style={styles.playerFocusBody}>
                  <View style={styles.playerAvatarStack}>
                    <View style={styles.focusHeaderRow}>
                      <Text style={styles.focusNumber}>{previousFocusPlayerNumber}</Text>
                      <View style={styles.focusNameBlock}>
                        <Text style={styles.focusName}>{previousFocusPlayerNameEn}</Text>
                        <Text style={styles.focusSubName}>{previousFocusPlayerNameZh}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.playerTicketPanel}>
                    <Text style={styles.focusGameTitle}>{previousFocusGameTitleText}</Text>
                    <View style={styles.focusGameStatsBox}>
                      <Text style={styles.focusGameLine} numberOfLines={1}>{previousFocusGameLineOne}</Text>
                      <Text style={styles.focusGameLine} numberOfLines={1}>{previousFocusGameLineTwo}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.playerFooterButton} activeOpacity={0.85} onPress={() => router.push('/abroad' as any)}>
                  <Text style={styles.playerFooter}>查看球員動態  ›</Text>
                </TouchableOpacity>
              </ImageBackground>
            </View>

            <Animated.View
              key={`player-focus-enter-${focusPlayerPage}-${playerCardEnterKey.current}`}
              style={[
                styles.playerFocusCardShakeWrap,
                {
                  opacity: playerCardOpacity,
                  transform: [
                    {
                      translateX: Animated.add(
                        playerCardSlideX,
                        playerCardShake.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [-1.4, 0, 1.4],
                        })
                      ),
                    },
                    {
                      rotate: playerCardShake.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: ['-0.22deg', '0deg', '0.22deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.playerAvatarBackLayer}>
                <AbroadPlayerAvatar
                  name={focusPlayerNameZh}
                  team={focusPlayer?.team}
                  league={focusPlayer?.league}
                  level={focusPlayer?.level}
                  teamCode={focusPlayer?.teamMeta?.code ?? focusPlayer?.teamMeta?.abbreviation}
                  logoKey={focusPlayer?.teamMeta?.logoKey}
                  photoUri={focusPlayer?.officialPhotoUrl}
                  teamColor={focusPlayer?.teamColor}
                  size={139}
                  textSize={14}
                  borderRadius={0}
                />
              </View>
              <ImageBackground
                source={homeImages.playerFocusTicketBg}
                style={styles.playerFocusCard}
                imageStyle={styles.playerFocusCardBg}
                resizeMode="stretch"
              >
                <Text style={styles.playerCardTitle}>★ PLAYER FOCUS ★</Text>
                <View style={styles.playerFocusBody}>
                  <View style={styles.playerAvatarStack}>
                    <View style={styles.focusHeaderRow}>
                      <Text style={styles.focusNumber}>{focusPlayerNumber}</Text>
                      <View style={styles.focusNameBlock}>
                        <Text style={styles.focusName}>{focusPlayerNameEn}</Text>
                        <Text style={styles.focusSubName}>{focusPlayerNameZh}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.playerTicketPanel}>
                    <Text style={styles.focusGameTitle}>{focusGameTitleText}</Text>
                    <View style={styles.focusGameStatsBox}>
                      <Text style={styles.focusGameLine} numberOfLines={1}>{focusGameLineOne}</Text>
                      <Text style={styles.focusGameLine} numberOfLines={1}>{focusGameLineTwo}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.playerFooterButton} activeOpacity={0.85} onPress={() => router.push('/abroad' as any)}>
                  <Text style={styles.playerFooter}>查看球員動態  ›</Text>
                </TouchableOpacity>
              </ImageBackground>
            </Animated.View>
          </View>
        </View>


        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  regularSeasonTickerViewport: {
    width: REGULAR_SEASON_TICKET_WIDTH,
    marginTop: -40,
    marginBottom: 8,
    overflow: 'hidden',
  },
  regularSeasonTickerRail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 5,
    paddingTop: 1,
    paddingBottom: 75,
  },
  topBar: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,35,70,0.12)',
    paddingHorizontal: 20,
    paddingTop: 0,
    marginBottom: 0,
    zIndex: 20,
  },
  menuIcon: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 42,
  },
  brandHeader: {
    flex: 1,
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  brandWord: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 8,
    lineHeight: 25,
  },
  brandSub: {
    color: '#E85F2A',
    fontFamily: CN_FONT,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 11,
    lineHeight: 15,
    marginLeft: 8,
  },
  brandStars: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 7,
    letterSpacing: 1.8,
    marginTop: -2,
    lineHeight: 9,
  },
  bellWrap: {
    width: 58,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    position: 'relative',
  },
  hornIcon: {
    width: 54,
    height: 30,
  },
  noticeDot: {
    position: 'absolute',
    right: 2,
    top: 4,
    width: 11,
    height: 11,
    borderRadius: 0,
    backgroundColor: '#E85F2A',
    borderWidth: 2,
    borderColor: '#F2E4CF',
  },
  posterHero: {
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    overflow: 'hidden',
  },
  heroTicketTearLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,35,70,0.16)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,95,42,0.22)',
    backgroundColor: 'rgba(255,247,233,0.24)',
  },
  heroTicketTearHole: {
    width: 7,
    height: 7,
    borderRadius: 0,
    backgroundColor: 'rgba(11,35,70,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,233,0.42)',
  },
  heroCopyBlock: {
    width: '33%',
    justifyContent: 'center',
    paddingLeft: 2,
    zIndex: 5,
  },
  posterTitle: {
    color: '#E85F2A',
    fontFamily: APP_FONT,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 38,
    textShadowColor: '#FFF7E9',
    textShadowRadius: 3,
    textShadowOffset: { width: 2, height: 2 },
    width: 555,
  },
  posterSlogan: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.1,
    lineHeight: 22,
    marginTop: 0,
    width: 150,
  },
  heroIllustration: {
    flex: 1,
    minHeight: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: -1,
  },
  heroPosterImage: {
    position: 'absolute',
    width: 310,
    height: 428,
    right: 1,
    bottom:-50,
    zIndex: 4,
  },
  heroFieldBadge: {
    width: 500,
    height: 288,
    marginLeft: -10,
    marginTop: 30,
    zIndex: 3,
  },
  liveScoreCardAnimatedWrap: {
    width: REGULAR_SEASON_TICKET_WIDTH,
  },
  liveScoreCardSlide: {
    width: REGULAR_SEASON_TICKET_WIDTH,
    borderRadius: 0,
    paddingHorizontal: 34,
    paddingTop: 20,
    paddingBottom: 19,
    overflow: 'hidden',
    shadowColor: '#7B4F2A',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  liveScoreCardBg: {
    borderRadius: 0,
  },
  finalStampImage: {
    position: 'absolute',
    top: 42,
    width: 99,
    height: 99,
    opacity: 0.92,
    transform: [{ rotate: '-9deg' }],
    zIndex: 8,
  },
  finalStampNearAwayScore: {
    left: '31%',
  },
  finalStampNearHomeScore: {
    left: '45%',
  },
  finalStampImageAltOne: {
    top: 37,
    transform: [{ rotate: '7deg' }],
  },
  finalStampImageAltTwo: {
    top: 47,
    transform: [{ rotate: '-15deg' }],
  },
  liveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    gap: 7,
    paddingHorizontal: 22,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E85F2A',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginLeft: 22,
    marginRight: 2,
    shadowColor: '#E85F2A',
    shadowOpacity: 0.45,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 0 },
  },
  liveBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: '#FFF7E9',
    marginRight:3,
  },
  liveBadgeText: {
    color: '#FFF7E9',
    fontFamily: APP_FONT,
    fontSize: 13,
    fontWeight: '900',
  },
  liveLeagueText: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 14,
    fontWeight: '900',
  },
  liveLeagueTextNoBadge: {
    marginLeft: 22,
  },
  liveStatsWrap: {
    flex: 22,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  liveStatText: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 11,
    fontWeight: '900',
  },
  liveStatNumber: {
    color: '#E85F2A',
    fontFamily: APP_FONT,
    fontSize: 17,
    fontWeight: '100',
    lineHeight: 19,
    minWidth: 19,
    textAlign: 'right',
  },
  scoreDivider: {
    height: 1,
    backgroundColor: '#CDB18A',
    marginTop: 6,
    marginBottom: 7,
    marginHorizontal: 2,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    gap: 3,
    marginTop: -1,
  },
  teamSideLeft: {
    width: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 0,
  },
  teamSideRight: {
    width: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0,
  },
  fakeLogo: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    textShadowColor: '#E85F2A',
    textShadowRadius: 0,
    textShadowOffset: { width: 1, height: 1 },
  },
  teamLogoImage: {
    width: 55,
    height: 55,
  },
  teamName: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 10,
    maxWidth: 49,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamRecord: {
    color: '#45566C',
    fontFamily: APP_FONT,
    fontSize: 7,
    fontWeight: '700',
    marginTop: 1,
  },
  bigScoreWrap: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  awayBigScore: {
    color: '#E85F2A',
    fontFamily: APP_FONT,
    fontSize: 46,
    fontWeight: '100',
    lineHeight: 50,
  },
  homeBigScore: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 46,
    fontWeight: '100',
    lineHeight: 50,
  },
  winningBigScore: {
    color: '#E85F2A',
  },
  losingBigScore: {
    color: '#0B2346',
  },
  scoreDash: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 20,
    fontWeight: '500',
  },
  moreGameButton: {
    borderTopWidth: 1,
    borderTopColor: '#CDB18A',
    alignItems: 'center',
    paddingTop: 5,
    marginTop: 3,
    marginHorizontal: 2,
  },
  moreGameText: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 15,
    fontWeight: '900',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 0,
  },
  todayGamesCard: {
    flex: 1,
    height: 310,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  todayGamesCardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  todayGamesContentLayer: {
    ...StyleSheet.absoluteFillObject,
    paddingLeft: 13,
    paddingRight: 16,
    paddingTop: 23,
    paddingBottom: 14,
  },
  cardTitleLight: {
    color: '#F7D9B8',
    fontFamily: APP_FONT,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.6,
    lineHeight: 22,
    textAlign: 'left',
    marginBottom: 11,
  },
  todayGamesFixedList: {
    height: 185,
    overflow: 'hidden',
  },
  todayGamesEmptyWrap: {
    height: 130,
    justifyContent: 'center',
  },
  todayGamesEmptyText: {
    color: '#F7D9B8',
    fontFamily: CN_FONT,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  gameListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 33,
    marginBottom: 4,
    gap: 4,
  },
  flipTimeCell: {
    width: 42,
    minHeight: 33,
    borderRadius: 0,
    backgroundColor: 'rgba(7, 22, 45, 0.0)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247,217,184,0.22)',
  },
  flipMatchupCell: {
    flex: 1,
    minHeight: 33,
    borderRadius: 0,
    backgroundColor: 'rgba(7, 22, 45, 0)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(247,217,184,0.22)',
  },
  gameLogoMatchupWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gameTeamLogo: {
    width: 32,
    height: 32,
  },
  gameLogoFallback: {
    width: 25,
    height: 25,
    borderRadius: 1,
    backgroundColor: '#F7D9B8',
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 25,
    textAlign: 'center',
  },
  gameVsText: {
    color: '#F7D9B8',
    fontFamily: APP_FONT,
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
    letterSpacing: 0.25,
    width: 16,
    textAlign: 'center',
  },
  gameTime: {
    color: '#F7D9B8',
    fontFamily: APP_FONT,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
    letterSpacing: 0,
  },
  playerFocusCardStackWrap: {
    flex: 1,
    minHeight: 178,
    position: 'relative',
  },
  playerFocusCardBaseWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  playerFocusCardShakeWrap: {
    ...StyleSheet.absoluteFillObject,
    minHeight: 178,
    zIndex: 3,
  },
  playerFocusCard: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 178,
    position: 'relative',
    zIndex: 2,
  },
  playerFocusCardBg: {
    borderRadius: 0,
    zIndex: 2,
  },
  playerCardTitle: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 22,
    marginHorizontal: 8,
    zIndex: 4,
  },
  playerFocusBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 12,
    paddingTop: 2,
  },
  focusGameStatsBox: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: 0,
  },
    playerAvatarBackLayer: {
      position: 'absolute',
      left: 38,
      top: 45,
      width: 11,
      height: 11,
      zIndex: 0,
    },
    playerAvatarStack: {
      width: 99,
      height: 150,
      position: 'relative',
      marginLeft: 15,
      marginRight: -100,
      transform: [{ translateY: -66 }],
      zIndex: 5,
    },
   
    playerTicketPanel: {
      position: 'absolute',
      left: 1,
      right: 24,
      bottom: 43,
      paddingVertical: 0,
      paddingLeft: 0,
      alignItems: 'flex-end',
      zIndex: 4,
    },
  focusNumber: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 32,
    marginRight: 5,
  },
  focusName: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 13,
  },

  focusHeaderRow: {
    position: 'absolute',
    left: -3,
    right: 1,
    bottom: -27,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    zIndex: 5,
  },
  focusNameBlock: {
    flex: 0,
  },
  focusSubName: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  focusGameTitle: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 10,
    marginBottom: 1,
    textAlign: 'right',
  },
  focusGameLine: {
    color: '#0B2346',
    fontFamily: APP_FONT,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 15,
    textAlign: 'right',
  },
  playerFooterButton: {
    position: 'absolute',
    right: 22,
    bottom: 18,
    zIndex: 6,
  },
  playerFooter: {
    color: '#0B2346',
    fontFamily: CN_FONT,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'right',
  },
});
