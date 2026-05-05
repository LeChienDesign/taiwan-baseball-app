import cpblMajor2026 from '../data/cpbl-major-2026.json';
import type { ScoreboardGame } from './mlb';
import { CPBL_TEAM_LOGOS } from '../constants/cpblTeamLogos';

type CpblRow = {
  idEvent: string;
  strTimestamp: string;
  Round: string;
  'Home Team': string;
  'Home Score': string | number | null;
  'Away Team': string;
  'Away Score': string | number | null;
  Poster?: string;
  Thumb?: string;

  Venue?: string;
  venue?: string;
  Stadium?: string;
  stadium?: string;

  DisplayTime?: string;

  Status?: 'SCHEDULED' | 'FINAL' | 'POSTPONED' | 'SUSPENDED' | 'LIVE' | string;

  'Away Inning Line'?: string[] | string;
  'Home Inning Line'?: string[] | string;

  'Away Hits'?: string | number | null;
  'Home Hits'?: string | number | null;
  'Away Errors'?: string | number | null;
  'Home Errors'?: string | number | null;

  gameSno?: string | number;
  kindCode?: string;
  year?: string | number;
  officialLiveUrl?: string;
};

type TeamRecordMap = Record<string, { win: number; loss: number }>;

function formatDateOnly(dateTime: string) {
  return String(dateTime || '').slice(0, 10);
}

function formatTimeTaiwan(dateTime: string, displayTime?: string) {
  if (displayTime) return displayTime;
  if (!dateTime) return '';

  const parsed = new Date(String(dateTime).replace(' ', 'T'));
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

function parseScore(value: string | number | null | undefined) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function parseMaybeNumber(value: string | number | null | undefined) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isNaN(n) ? '' : n;
}

function normalizeTeamName(name: string) {
  const map: Record<string, string> = {
    'CTBC Brothers': '中信兄弟',
    'Fubon Guardians': '富邦悍將',
    'Rakuten Monkeys': '樂天桃猿',
    'TSG Hawks': '台鋼雄鷹',
    'Uni-President Lions': '統一7-ELEVEn獅',
    'Wei Chuan Dragons': '味全龍',

    '中信兄弟': '中信兄弟',
    '富邦悍將': '富邦悍將',
    '樂天桃猿': '樂天桃猿',
    '台鋼雄鷹': '台鋼雄鷹',
    '統一7-ELEVEn獅': '統一7-ELEVEn獅',
    '味全龍': '味全龍',
  };

  return map[name] ?? name;
}

function mapTeamShort(name: string) {
  const team = normalizeTeamName(name);

  const map: Record<string, string> = {
    '中信兄弟': '中信',
    '富邦悍將': '富邦',
    '樂天桃猿': '樂天',
    '台鋼雄鷹': '台鋼',
    '統一7-ELEVEn獅': '統一',
    '味全龍': '味全',
  };

  return map[team] ?? team.slice(0, 2);
}

function getTeamLogo(name: string) {
  const team = normalizeTeamName(name);
  return CPBL_TEAM_LOGOS[team] ?? require('../assets/league/cpbl.png');
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

function getVenue(row: CpblRow) {
  return row.Venue || row.venue || row.Stadium || row.stadium || '';
}

function normalizeStatus(
  rawStatus: CpblRow['Status'],
  homeScore: number | null,
  awayScore: number | null
): 'FINAL' | 'SCHEDULED' | 'POSTPONED' | 'SUSPENDED' | 'LIVE' {
  const s = String(rawStatus || '').toUpperCase();

  if (s === 'POSTPONED' || s.includes('POSTPONED') || s.includes('延賽')) return 'POSTPONED';
  if (s === 'SUSPENDED' || s.includes('SUSPENDED') || s.includes('暫停') || s.includes('保留')) return 'SUSPENDED';
  if (s === 'LIVE' || s.includes('LIVE') || s.includes('比賽中')) return 'LIVE';
  if (s === 'FINAL' || s.includes('FINAL') || s.includes('終場') || s.includes('比賽結束')) return 'FINAL';

  if (homeScore != null && awayScore != null) return 'FINAL';
  return 'SCHEDULED';
}

function normalizeInningLine(value?: string[] | string) {
  if (Array.isArray(value)) {
    const arr = value.map((v) => String(v ?? ''));
    while (arr.length < 9) arr.push('');
    return arr.slice(0, 9);
  }

  if (typeof value === 'string' && value.trim()) {
    const arr = value.trim().split(/\s+/);
    while (arr.length < 9) arr.push('');
    return arr.slice(0, 9);
  }

  return ['', '', '', '', '', '', '', '', ''];
}

function buildTeamRecordsUntilDate(rows: CpblRow[], targetDate: string): TeamRecordMap {
  const table: TeamRecordMap = {};

  const sorted = [...rows].sort((a, b) => {
    const da = a.strTimestamp || '';
    const db = b.strTimestamp || '';
    return da.localeCompare(db);
  });

  for (const row of sorted) {
    const gameDate = formatDateOnly(row.strTimestamp);
    if (gameDate > targetDate) continue;

    const homeName = normalizeTeamName(row['Home Team']);
    const awayName = normalizeTeamName(row['Away Team']);

    const status = normalizeStatus(
      row.Status,
      parseScore(row['Home Score']),
      parseScore(row['Away Score'])
    );
    if (status !== 'FINAL') continue;

    const homeScore = parseScore(row['Home Score']);
    const awayScore = parseScore(row['Away Score']);

    if (!table[homeName]) table[homeName] = { win: 0, loss: 0 };
    if (!table[awayName]) table[awayName] = { win: 0, loss: 0 };

    if (homeScore == null || awayScore == null) continue;

    if (homeScore > awayScore) {
      table[homeName].win += 1;
      table[awayName].loss += 1;
    } else if (awayScore > homeScore) {
      table[awayName].win += 1;
      table[homeName].loss += 1;
    }
  }

  return table;
}

function formatRecord(recordMap: TeamRecordMap, teamName: string) {
  const team = normalizeTeamName(teamName);
  const rec = recordMap[team];
  if (!rec) return '';
  return `${rec.win}-${rec.loss}`;
}

function rowToScoreboardGame(row: CpblRow, recordMap: TeamRecordMap): ScoreboardGame {
  const homeScore = parseScore(row['Home Score']);
  const awayScore = parseScore(row['Away Score']);

  const status = normalizeStatus(row.Status, homeScore, awayScore);

  const homeName = normalizeTeamName(row['Home Team']);
  const awayName = normalizeTeamName(row['Away Team']);

  const homeShort = mapTeamShort(homeName);
  const awayShort = mapTeamShort(awayName);

  const displayTime = formatTimeTaiwan(row.strTimestamp, row.DisplayTime);

  const awayInnings = normalizeInningLine(row['Away Inning Line']);
  const homeInnings = normalizeInningLine(row['Home Inning Line']);

  const awayHits = parseMaybeNumber(row['Away Hits']);
  const homeHits = parseMaybeNumber(row['Home Hits']);
  const awayErrors = parseMaybeNumber(row['Away Errors']);
  const homeErrors = parseMaybeNumber(row['Home Errors']);

  return {
    id: row.idEvent,
    awayTeam: {
      name: awayName,
      short: awayShort,
      record: formatRecord(recordMap, awayName),
      logo: getTeamLogo(awayName),
    },
    homeTeam: {
      name: homeName,
      short: homeShort,
      record: formatRecord(recordMap, homeName),
      logo: getTeamLogo(homeName),
    },
    awayScore: awayScore ?? 0,
    homeScore: homeScore ?? 0,
    status,
    venue: getVenue(row),
    innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine:
      status === 'SCHEDULED' || status === 'POSTPONED'
        ? buildEmptyLine(awayShort)
        : {
            team: awayShort,
            innings: awayInnings,
            r: awayScore ?? '',
            h: awayHits,
            e: awayErrors,
          },
    homeLine:
      status === 'SCHEDULED' || status === 'POSTPONED'
        ? buildEmptyLine(homeShort)
        : {
            team: homeShort,
            innings: homeInnings,
            r: homeScore ?? '',
            h: homeHits,
            e: homeErrors,
          },
    footerLeft:
      status === 'FINAL'
        ? 'FINAL'
        : status === 'POSTPONED'
          ? '延賽'
          : status === 'SUSPENDED'
            ? '暫停'
            : status === 'LIVE'
              ? 'LIVE'
              : row.Round || 'SCHEDULED',
    footerRight: status === 'SCHEDULED' ? displayTime : '',
  };
}

export async function fetchCpblMajorGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const rows = cpblMajor2026 as CpblRow[];
  const recordMap = buildTeamRecordsUntilDate(rows, date);

  const sameDayRows = rows.filter((row) => formatDateOnly(row.strTimestamp) === date);
  return sameDayRows.map((row) => rowToScoreboardGame(row, recordMap));
}

export async function fetchCpblMinorGamesByDate(_date: string): Promise<ScoreboardGame[]> {
  return [];
}
