import npb2026 from '../data/npb-2026.json';
import { NPB_TEAM_LOGOS } from '../constants/npbTeamLogos';
import type { ScoreboardGame } from './mlb';

type NpbRow = {
  idEvent: string;
  strTimestamp: string;
  Round: string;
  'Home Team': string;
  'Home Score': string | number | null;
  'Away Team': string;
  'Away Score': string | number | null;
  Venue?: string;
  DisplayTime?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatDateOnly(dateTime: string) {
  return dateTime.slice(0, 10);
}

function parseScore(value: string | number | null | undefined) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function normalizeTeamName(name: string) {
  const map: Record<string, string> = {
    '阪神虎': '阪神虎',
    '讀賣巨人': '讀賣巨人',
    '中日龍': '中日龍',
    '廣島東洋鯉魚': '廣島東洋鯉魚',
    '東京養樂多燕子': '東京養樂多燕子',
    '橫濱 DeNA 海灣之星': '橫濱 DeNA 海灣之星',
    '福岡軟銀鷹': '福岡軟銀鷹',
    '北海道日本火腿鬥士': '北海道日本火腿鬥士',
    '千葉羅德海洋': '千葉羅德海洋',
    '東北樂天金鷲': '東北樂天金鷲',
    '埼玉西武獅': '埼玉西武獅',
    '歐力士猛牛': '歐力士猛牛',
  };

  return map[name] ?? name;
}

function teamShort(name: string) {
  const normalized = normalizeTeamName(name);

  const map: Record<string, string> = {
    '千葉羅德海洋': '羅德',
    '中日龍': '中日',
    '福岡軟銀鷹': '軟銀',
    '阪神虎': '阪神',
    '廣島東洋鯉魚': '廣島',
    '北海道日本火腿鬥士': '火腿',
    '歐力士猛牛': '歐力士',
    '埼玉西武獅': '西武',
    '東北樂天金鷲': '樂天',
    '東京養樂多燕子': '養樂多',
    '橫濱 DeNA 海灣之星': '橫濱',
    '讀賣巨人': '巨人',
  };

  return map[normalized] ?? normalized.slice(0, 2);
}

function getTeamLogo(name: string) {
  const normalized = normalizeTeamName(name);

  const keyMap: Record<string, string> = {
    '千葉羅德海洋': 'Chiba Lotte Marines',
    '中日龍': 'Chunichi Dragons',
    '福岡軟銀鷹': 'Fukuoka SoftBank Hawks',
    '阪神虎': 'Hanshin Tigers',
    '廣島東洋鯉魚': 'Hiroshima Toyo Carp',
    '北海道日本火腿鬥士': 'Hokkaido Nippon-Ham Fighters',
    '歐力士猛牛': 'Orix Buffaloes',
    '埼玉西武獅': 'Saitama Seibu Lions',
    '東北樂天金鷲': 'Tohoku Rakuten Golden Eagles',
    '東京養樂多燕子': 'Tokyo Yakult Swallows',
    '橫濱 DeNA 海灣之星': 'Yokohama DeNA BayStars',
    '讀賣巨人': 'Yomiuri Giants',
  };

  const logoKey = keyMap[normalized];
  return (logoKey && NPB_TEAM_LOGOS[logoKey]) ?? require('../assets/league/npb.png');
}

function buildEmptyLine(team: string) {
  return {
    team,
    innings: ['', '', '', '', '', '', '', '', ''],
    r: '',
    h: '',
    e: '',
  };
}

function formatDisplayTime(row: NpbRow) {
  if (row.DisplayTime) return row.DisplayTime;
  if (!row.strTimestamp) return '';
  return row.strTimestamp.slice(11, 16);
}

function rowToGame(row: NpbRow): ScoreboardGame {
  const homeName = normalizeTeamName(row['Home Team']);
  const awayName = normalizeTeamName(row['Away Team']);

  const homeScore = parseScore(row['Home Score']);
  const awayScore = parseScore(row['Away Score']);
  const isScheduled = homeScore == null || awayScore == null;
  const status: 'FINAL' | 'SCHEDULED' = isScheduled ? 'SCHEDULED' : 'FINAL';

  const homeShort = teamShort(homeName);
  const awayShort = teamShort(awayName);

  return {
    id: row.idEvent,
    awayTeam: {
      name: awayName,
      short: awayShort,
      record: '',
      logo: getTeamLogo(awayName),
    },
    homeTeam: {
      name: homeName,
      short: homeShort,
      record: '',
      logo: getTeamLogo(homeName),
    },
    awayScore: awayScore ?? 0,
    homeScore: homeScore ?? 0,
    status,
    venue: row.Venue ?? '',
    innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine: isScheduled
      ? buildEmptyLine(awayShort)
      : {
          team: awayShort,
          innings: ['', '', '', '', '', '', '', '', ''],
          r: awayScore ?? '',
          h: '',
          e: '',
        },
    homeLine: isScheduled
      ? buildEmptyLine(homeShort)
      : {
          team: homeShort,
          innings: ['', '', '', '', '', '', '', '', ''],
          r: homeScore ?? '',
          h: '',
          e: '',
        },
    footerLeft: status === 'FINAL' ? 'FINAL' : row.Round || '例行賽',
    footerRight: status === 'SCHEDULED' ? formatDisplayTime(row) : '',
  };
}

export async function fetchNpbGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const rows = (npb2026 as NpbRow[]).filter(
    (row) => formatDateOnly(row.strTimestamp) === date
  );

  return rows.map(rowToGame);
}