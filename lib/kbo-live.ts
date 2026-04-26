import { KBO_TEAM_LOGOS } from '../constants/kboTeamLogos';
import type { ScoreboardGame } from './mlb';

type KboLiveParsedGame = {
  awayTeam: string;
  homeTeam: string;
  venue: string;
  displayTime: string;
  innings: number[];
  awayLine: {
    team: string;
    innings: (string | number)[];
    r: string | number;
    h: string | number;
    e: string | number;
  };
  homeLine: {
    team: string;
    innings: (string | number)[];
    r: string | number;
    h: string | number;
    e: string | number;
  };
  status: 'SCHEDULED' | 'FINAL' | 'LIVE';
};

const TEAM_CODES = [
  'DOOSAN',
  'HANWHA',
  'KIA',
  'KIWOOM',
  'KT',
  'LG',
  'LOTTE',
  'NC',
  'SAMSUNG',
  'SSG',
];

function formatDateToKboUrl(date: string) {
  const [year, month, day] = date.split('-');
  return `https://eng.koreabaseball.com/Schedule/Scoreboard.aspx?searchDate=${year}${month}${day}`;
}

function normalizeTeamName(name: string) {
  const raw = (name || '').trim().toUpperCase();

  const map: Record<string, string> = {
    DOOSAN: 'Doosan Bears',
    HANWHA: 'Hanwha Eagles',
    KIA: 'KIA Tigers',
    KIWOOM: 'Kiwoom Heroes',
    KT: 'KT Wiz',
    LG: 'LG Twins',
    LOTTE: 'Lotte Giants',
    NC: 'NC Dinos',
    SAMSUNG: 'Samsung Lions',
    SSG: 'SSG Landers',
  };

  return map[raw] ?? name;
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

function buildEmptyLine(team: string, inningsCount = 9) {
  return {
    team,
    innings: Array.from({ length: inningsCount }, () => ''),
    r: '',
    h: '',
    e: '',
  };
}

function parseCellValue(value: string) {
  const v = value.trim();
  if (!v || v === '-') return '';
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function detectStatus(
  awayInnings: (string | number)[],
  homeInnings: (string | number)[],
  awayR: string | number,
  homeR: string | number
): 'SCHEDULED' | 'FINAL' | 'LIVE' {
  const hasRuns =
    awayR !== '' ||
    homeR !== '' ||
    awayInnings.some((v) => v !== '') ||
    homeInnings.some((v) => v !== '');

  if (!hasRuns) return 'SCHEDULED';

  const first9Away = awayInnings.slice(0, 9);
  const first9Home = homeInnings.slice(0, 9);

  const inningsComplete =
    first9Away.length === 9 &&
    first9Home.length === 9 &&
    first9Away.every((v) => v !== '') &&
    first9Home.every((v) => v !== '');

  return inningsComplete ? 'FINAL' : 'LIVE';
}

function sanitizeLines(html: string) {
  return html
    .replace(/\r/g, '')
    .split('\n')
    .map((line) =>
      line
        .replace(/【\d+†[^】]*】/g, ' ')
        .replace(/Image:[^ ]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

function isMatchupLine(line: string) {
  const m = line.match(
    /^(DOOSAN|HANWHA|KIA|KIWOOM|KT|LG|LOTTE|NC|SAMSUNG|SSG)\s+(\d{1,2}:\d{2})\s+(DOOSAN|HANWHA|KIA|KIWOOM|KT|LG|LOTTE|NC|SAMSUNG|SSG)$/
  );
  return m;
}

function isVenueLine(line: string) {
  return /^(JAMSIL|MUNHAK|DAEGU|CHANGWON|DAEJEON|SAJIK|SUWON|GWANGJU|GOCHEOKSKY)\s+\d{1,2}:\d{2}$/.test(
    line
  );
}

function parseTeamRow(line: string, inningsCount: number, expectedTeam: string) {
  const tokens = line.split(' ');
  const rowTeam = tokens[0] ?? '';
  if (rowTeam !== expectedTeam) return null;

  const cells = tokens.slice(1);
  const inningCells = cells.slice(0, inningsCount).map(parseCellValue);
  const r = parseCellValue(cells[inningsCount] ?? '');
  const h = parseCellValue(cells[inningsCount + 1] ?? '');
  const e = parseCellValue(cells[inningsCount + 2] ?? '');

  return {
    team: teamShort(normalizeTeamName(expectedTeam)),
    innings: inningCells,
    r,
    h,
    e,
  };
}

function parseScoreboardBlocksFromHtml(html: string): KboLiveParsedGame[] {
  const lines = sanitizeLines(html);
  const games: KboLiveParsedGame[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const matchup = isMatchupLine(lines[i]);
    if (!matchup) continue;

    const awayTeam = matchup[1];
    const displayTime = matchup[2];
    const homeTeam = matchup[3];

    const venueLine = lines[i + 1] && isVenueLine(lines[i + 1]) ? lines[i + 1] : '';
    const headerIndex = venueLine ? i + 2 : i + 1;

    const venue = venueLine ? venueLine.replace(/\s+\d{1,2}:\d{2}$/, '') : '';
    const headerLine = lines[headerIndex] ?? '';

    if (!headerLine.startsWith('TEAM ')) continue;

    const headerTokens = headerLine.split(' ');
    const innings = headerTokens
      .filter((t) => /^\d+$/.test(t))
      .map((t) => Number(t))
      .filter((n) => n >= 1 && n <= 15);

    const inningsCount = innings.length || 9;

    const awayRowLine = lines[headerIndex + 1] ?? '';
    const homeRowLine = lines[headerIndex + 2] ?? '';

    const awayParsed = parseTeamRow(awayRowLine, inningsCount, awayTeam);
    const homeParsed = parseTeamRow(homeRowLine, inningsCount, homeTeam);

    if (!awayParsed || !homeParsed) continue;

    const status = detectStatus(
      awayParsed.innings,
      homeParsed.innings,
      awayParsed.r,
      homeParsed.r
    );

    games.push({
      awayTeam,
      homeTeam,
      venue,
      displayTime,
      innings: innings.length ? innings : [1, 2, 3, 4, 5, 6, 7, 8, 9],
      awayLine:
        status === 'SCHEDULED'
          ? buildEmptyLine(teamShort(normalizeTeamName(awayTeam)), inningsCount)
          : awayParsed,
      homeLine:
        status === 'SCHEDULED'
          ? buildEmptyLine(teamShort(normalizeTeamName(homeTeam)), inningsCount)
          : homeParsed,
      status,
    });
  }

  return games;
}

function toScoreboardGame(
  date: string,
  index: number,
  parsed: KboLiveParsedGame
): ScoreboardGame {
  const awayName = normalizeTeamName(parsed.awayTeam);
  const homeName = normalizeTeamName(parsed.homeTeam);

  const awayShort = teamShort(awayName);
  const homeShort = teamShort(homeName);

  const awayScore =
    typeof parsed.awayLine.r === 'number' ? parsed.awayLine.r : Number(parsed.awayLine.r || 0);

  const homeScore =
    typeof parsed.homeLine.r === 'number' ? parsed.homeLine.r : Number(parsed.homeLine.r || 0);

  return {
    id: `kbo-live-${date}-${index + 1}`,
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
    awayScore: Number.isNaN(awayScore) ? 0 : awayScore,
    homeScore: Number.isNaN(homeScore) ? 0 : homeScore,
    status: parsed.status,
    venue: parsed.venue,
    innings: parsed.innings.slice(0, 9),
    awayLine: {
      team: awayShort,
      innings: parsed.awayLine.innings.slice(0, 9),
      r: parsed.awayLine.r,
      h: parsed.awayLine.h,
      e: parsed.awayLine.e,
    },
    homeLine: {
      team: homeShort,
      innings: parsed.homeLine.innings.slice(0, 9),
      r: parsed.homeLine.r,
      h: parsed.homeLine.h,
      e: parsed.homeLine.e,
    },
    footerLeft:
      parsed.status === 'FINAL'
        ? 'FINAL'
        : parsed.status === 'LIVE'
          ? 'LIVE'
          : 'SCHEDULED',
    footerRight: parsed.status === 'SCHEDULED' ? parsed.displayTime : '',
  };
}

export async function fetchKboOfficialGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const url = formatDateToKboUrl(date);
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`KBO official request failed: ${response.status}`);
  }

  const html = await response.text();

  console.log('KBO official html preview =', html.slice(0, 2000));
  console.log('KBO official html has DOOSAN =', html.includes('DOOSAN'));
  console.log('KBO official html has JAMSIL =', html.includes('JAMSIL'));
  console.log('KBO official html has Scoreboard =', html.includes('Scoreboard'));

  const parsedGames = parseScoreboardBlocksFromHtml(html);

  console.log('KBO official parsed count =', parsedGames.length, 'date =', date);

  return parsedGames.map((game, index) => toScoreboardGame(date, index, game));
}