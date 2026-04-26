import kbo2026 from '../data/kbo-2026.json';
import { KBO_TEAM_LOGOS } from '../constants/kboTeamLogos';
import type { ScoreboardGame } from './mlb';

type KboRow = {
  idEvent: string;
  strTimestamp: string;
  Round?: string;
  'Home Team': string;
  'Home Score': string | number | null;
  'Away Team': string;
  'Away Score': string | number | null;
  Venue?: string;
  DisplayTime?: string;
};

function formatDateOnly(dateTime: string) {
  return String(dateTime || '').slice(0, 10);
}

function parseScore(value: string | number | null | undefined) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function normalizeTeamName(name: string) {
  const map: Record<string, string> = {
    'Doosan Bears': 'Doosan Bears',
    'Hanwha Eagles': 'Hanwha Eagles',
    'KIA Tigers': 'KIA Tigers',
    'Kiwoom Heroes': 'Kiwoom Heroes',
    'KT Wiz': 'KT Wiz',
    'LG Twins': 'LG Twins',
    'Lotte Giants': 'Lotte Giants',
    'NC Dinos': 'NC Dinos',
    'Samsung Lions': 'Samsung Lions',
    'SSG Landers': 'SSG Landers',
  };

  return map[name] ?? name;
}

function displayTeamName(name: string) {
  const normalized = normalizeTeamName(name);

  const map: Record<string, string> = {
    'Doosan Bears': '斗山熊',
    'Hanwha Eagles': '韓華鷹',
    'KIA Tigers': 'KIA虎',
    'Kiwoom Heroes': '培證英雄',
    'KT Wiz': 'KT巫師',
    'LG Twins': 'LG雙子',
    'Lotte Giants': '樂天巨人',
    'NC Dinos': 'NC恐龍',
    'Samsung Lions': '三星獅',
    'SSG Landers': 'SSG登陸者',
  };

  return map[normalized] ?? normalized;
}

function teamShort(name: string) {
  const normalized = normalizeTeamName(name);

  const map: Record<string, string> = {
    'Doosan Bears': 'DOO',
    'Hanwha Eagles': 'HAN',
    'KIA Tigers': 'KIA',
    'Kiwoom Heroes': 'KIW',
    'KT Wiz': 'KTW',
    'LG Twins': 'LGT',
    'Lotte Giants': 'LOT',
    'NC Dinos': 'NCD',
    'Samsung Lions': 'SAM',
    'SSG Landers': 'SSG',
  };

  return map[normalized] ?? normalized.slice(0, 3).toUpperCase();
}

function getTeamLogo(name: string) {
  const normalized = normalizeTeamName(name);
  return KBO_TEAM_LOGOS[normalized] ?? require('../assets/league/kbo.png');
}

function displayVenueName(venue: string) {
  const map: Record<string, string> = {
    Jamsil: '蠶室',
    Munhak: '文鶴',
    Daegu: '大邱',
    Changwon: '昌原',
    Daejeon: '大田',
    Sajik: '社稷',
    Suwon: '水原',
    Gwangju: '光州',
    'Gocheok Sky Dome': '高尺巨蛋',
    Pohang: '浦項',
  };

  return map[venue] ?? venue;
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

function formatTimeTaiwan(dateTime: string, displayTime?: string) {
  if (displayTime) return displayTime;
  if (!dateTime) return '';

  const parsed = new Date(dateTime.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) {
    return String(dateTime).slice(11, 16);
  }

  return parsed.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Taipei',
  });
}

function rowToScoreboardGame(row: KboRow): ScoreboardGame {
  const homeScore = parseScore(row['Home Score']);
  const awayScore = parseScore(row['Away Score']);

  const isScheduled = homeScore == null || awayScore == null;
  const status: 'FINAL' | 'SCHEDULED' = isScheduled ? 'SCHEDULED' : 'FINAL';

  const homeRawName = normalizeTeamName(row['Home Team']);
  const awayRawName = normalizeTeamName(row['Away Team']);

  const homeName = displayTeamName(homeRawName);
  const awayName = displayTeamName(awayRawName);

  const homeShort = teamShort(homeRawName);
  const awayShort = teamShort(awayRawName);

  return {
    id: row.idEvent,
    awayTeam: {
      name: awayName,
      short: awayShort,
      record: '',
      logo: getTeamLogo(awayRawName),
    },
    homeTeam: {
      name: homeName,
      short: homeShort,
      record: '',
      logo: getTeamLogo(homeRawName),
    },
    awayScore: awayScore ?? 0,
    homeScore: homeScore ?? 0,
    status,
    venue: displayVenueName(row.Venue ?? ''),
    innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine:
      isScheduled
        ? buildEmptyLine(awayShort)
        : {
            team: awayShort,
            innings: ['', '', '', '', '', '', '', '', ''],
            r: awayScore ?? '',
            h: '',
            e: '',
          },
    homeLine:
      isScheduled
        ? buildEmptyLine(homeShort)
        : {
            team: homeShort,
            innings: ['', '', '', '', '', '', '', '', ''],
            r: homeScore ?? '',
            h: '',
            e: '',
          },
    footerLeft: status === 'FINAL' ? '完賽' : '未開打',
    footerRight: status === 'SCHEDULED'
      ? formatTimeTaiwan(row.strTimestamp, row.DisplayTime)
      : '',
  };
}

export async function fetchKboGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const rows = kbo2026 as KboRow[];

  return rows
    .filter((row) => formatDateOnly(row.strTimestamp) === date)
    .map(rowToScoreboardGame);
}