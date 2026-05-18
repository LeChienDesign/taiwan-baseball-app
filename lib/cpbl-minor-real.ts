import cpblMinor2026 from '../data/cpbl-minor-2026.json';
import type { ScoreboardGame } from './mlb';

type CpblMinorRow = {
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

function formatDateOnly(dateTime: string) {
  return dateTime.slice(0, 10);
}

function formatTimeTaiwan(dateTime: string, displayTime?: string) {
  if (displayTime) return displayTime;
  if (!dateTime) return '';
  return dateTime.slice(11, 16);
}

function parseScore(value: string | number | null | undefined) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function mapMinorShort(name: string) {
  const map: Record<string, string> = {
    '中信兄弟二軍': '兄弟',
    '富邦悍將二軍': '富邦',
    '樂天桃猿二軍': '樂天',
    '統一7-ELEVEn獅二軍': '統一',
    '味全龍二軍': '味全',
    '台鋼雄鷹二軍': '台鋼',
    '嘉鋼': '嘉鋼',
  };

  return map[name] ?? name.slice(0, 2);
}

const MINOR_TEAM_LOGOS: Record<string, any> = {
  '中信兄弟二軍': require('../assets/cpbl/中信兄弟.png'),
  '富邦悍將二軍': require('../assets/cpbl/富邦悍將.png'),
  '樂天桃猿二軍': require('../assets/cpbl/樂天桃猿.png'),
  '統一7-ELEVEn獅二軍': require('../assets/cpbl/統一7-ELEVEn獅.png'),
  '味全龍二軍': require('../assets/cpbl/味全龍.png'),
  '台鋼雄鷹二軍': require('../assets/cpbl/台鋼雄鷹.png'),
  '嘉鋼': require('../assets/league/cpbl.png'),
};

function getMinorLogo(name: string) {
  return MINOR_TEAM_LOGOS[name] ?? require('../assets/league/cpbl.png');
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

function rowToGame(row: CpblMinorRow): ScoreboardGame {
  const homeScore = parseScore(row['Home Score']);
  const awayScore = parseScore(row['Away Score']);
  const isScheduled = homeScore == null || awayScore == null;
  const status: 'FINAL' | 'SCHEDULED' = isScheduled ? 'SCHEDULED' : 'FINAL';

  const homeName = row['Home Team'];
  const awayName = row['Away Team'];
  const homeShort = mapMinorShort(homeName);
  const awayShort = mapMinorShort(awayName);

  return {
    id: row.idEvent,
    awayTeam: {
      name: awayName,
      short: awayShort,
      record: '',
      logo: getMinorLogo(awayName),
    },
    homeTeam: {
      name: homeName,
      short: homeShort,
      record: '',
      logo: getMinorLogo(homeName),
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
          r: awayScore ?? 0,
          h: '',
          e: '',
        },
    homeLine: isScheduled
      ? buildEmptyLine(homeShort)
      : {
          team: homeShort,
          innings: ['', '', '', '', '', '', '', '', ''],
          r: homeScore ?? 0,
          h: '',
          e: '',
        },
    footerLeft: status === 'FINAL' ? 'FINAL' : row.Round || '二軍例行賽',
    footerRight: status === 'SCHEDULED'
      ? formatTimeTaiwan(row.strTimestamp, row.DisplayTime)
      : '',
  };
}

export async function fetchCpblMinorGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const rows = (cpblMinor2026 as CpblMinorRow[]).filter(
    (row) => formatDateOnly(row.strTimestamp) === date
  );

  return rows.map(rowToGame);
}
