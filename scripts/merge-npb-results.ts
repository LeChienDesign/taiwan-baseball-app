import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const RESULTS_PATH = path.join(ROOT_DIR, 'data', 'npb.results.2026.txt');
const EVENTS_PATH = path.join(ROOT_DIR, 'server', 'data', 'eventsCenter.npb.json');

type NpbResultRow = {
  date: string;
  away: string;
  home: string;
  awayScore: number;
  homeScore: number;
  result: string;
};

type AnyGame = {
  id?: string;
  gameDate?: string;
  date?: string;
  status?: string;
  statusText?: string;
  awayScore?: number;
  homeScore?: number;
  footerLeft?: string;
  footerRight?: string;
  awayTeam?: { name?: string };
  homeTeam?: { name?: string };
  awayLine?: { r?: number; h?: number; e?: number; innings?: Array<string | number> };
  homeLine?: { r?: number; h?: number; e?: number; innings?: Array<string | number> };
  [key: string]: any;
};

type EventsCenterPayload = {
  updatedAt?: string;
  games?: AnyGame[];
  gamesByDate?: Record<string, AnyGame[]>;
  [key: string]: any;
};

function assertFileExists(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${filePath}`);
  }
}

function parseResultsText(raw: string): NpbResultRow[] {
  const rows: NpbResultRow[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const text = line.trim();

    if (!text || text.startsWith('#')) {
      continue;
    }

    const match = text.match(/^(\d{4}-\d{2}-\d{2})｜(.+?)\s+(\d+)\s+-\s+(\d+)\s+(.+?)｜(.+)$/);

    if (!match) {
      continue;
    }

    const [, date, away, awayScore, homeScore, home, result] = match;

    rows.push({
      date,
      away: away.trim(),
      home: home.trim(),
      awayScore: Number(awayScore),
      homeScore: Number(homeScore),
      result: result.trim(),
    });
  }

  return rows;
}

function normalizeName(value?: string) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/・/g, '')
    .trim();
}

function findMatchingGame(games: AnyGame[], row: NpbResultRow) {
  const away = normalizeName(row.away);
  const home = normalizeName(row.home);

  return games.find((game) => {
    return normalizeName(game.awayTeam?.name) === away && normalizeName(game.homeTeam?.name) === home;
  });
}

function ensureLine(line: AnyGame['awayLine'], score: number) {
  return {
    ...(line || {}),
    r: score,
    innings: Array.isArray(line?.innings) ? line?.innings : [],
    h: typeof line?.h === 'number' ? line.h : 0,
    e: typeof line?.e === 'number' ? line.e : 0,
  };
}

const NPB_LOGO_KEY_BY_NAME: Record<string, string> = {
  讀賣巨人: 'yomiuri-giants',
  養樂多燕子: 'yakult-swallows',
  橫濱DeNA灣星: 'dena-baystars',
  廣島東洋鯉魚: 'hiroshima-carp',
  中日龍: 'chunichi-dragons',
  阪神虎: 'hanshin-tigers',
  東北樂天金鷲: 'rakuten-eagles',
  北海道日本火腿鬥士: 'nippon-ham-fighters',
  埼玉西武獅: 'seibu-lions',
  福岡軟銀鷹: 'softbank-hawks',
  歐力士猛牛: 'orix-buffaloes',
  千葉羅德海洋: 'lotte-marines',
};

const NPB_SHORT_BY_NAME: Record<string, string> = {
  讀賣巨人: 'YOM',
  養樂多燕子: 'YAK',
  橫濱DeNA灣星: 'DB',
  廣島東洋鯉魚: 'CARP',
  中日龍: 'CHU',
  阪神虎: 'HAN',
  東北樂天金鷲: 'E',
  北海道日本火腿鬥士: 'F',
  埼玉西武獅: 'L',
  福岡軟銀鷹: 'H',
  歐力士猛牛: 'B',
  千葉羅德海洋: 'M',
};

function buildTeam(name: string) {
  return {
    name,
    short: NPB_SHORT_BY_NAME[name] || name.slice(0, 4),
    record: '',
    logoKey: NPB_LOGO_KEY_BY_NAME[name],
  };
}

function buildGameFromResult(row: NpbResultRow, gamePk: number): AnyGame {
  const awayTeam = buildTeam(row.away);
  const homeTeam = buildTeam(row.home);
  const isAbn = row.result.toLowerCase() === 'abn';

  return {
    id: `npb-${row.date}-result-${gamePk}`,
    source: 'npb-results-file',
    league: 'NPB',
    date: row.date,
    gameDate: row.date,
    gamePk,
    status: isAbn ? 'SCHEDULED' : 'FINAL',
    statusText: row.result,
    venue: '待更新',
    awayTeam,
    homeTeam,
    awayScore: row.awayScore,
    homeScore: row.homeScore,
    innings: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    awayLine: {
      team: awayTeam.short,
      innings: Array.from({ length: 9 }, () => '-'),
      r: row.awayScore,
      h: 0,
      e: 0,
    },
    homeLine: {
      team: homeTeam.short,
      innings: Array.from({ length: 9 }, () => '-'),
      r: row.homeScore,
      h: 0,
      e: 0,
    },
    footerLeft: isAbn ? 'Abn' : 'FINAL',
    footerRight: isAbn ? '中止' : '試合終了',
    officialUrl: '',
  };
}

function applyResult(game: AnyGame, row: NpbResultRow) {
  const isAbn = row.result.toLowerCase() === 'abn';

  game.status = isAbn ? 'SCHEDULED' : 'FINAL';
  game.statusText = row.result;
  game.awayScore = row.awayScore;
  game.homeScore = row.homeScore;
  game.footerLeft = isAbn ? 'Abn' : 'FINAL';
  game.footerRight = isAbn ? '中止' : '試合終了';
  game.awayLine = ensureLine(game.awayLine, row.awayScore);
  game.homeLine = ensureLine(game.homeLine, row.homeScore);
}

function main() {
  assertFileExists(RESULTS_PATH);
  assertFileExists(EVENTS_PATH);

  const rows = parseResultsText(fs.readFileSync(RESULTS_PATH, 'utf8'));
  const payload = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8')) as EventsCenterPayload;

  if (!payload.gamesByDate) {
    payload.gamesByDate = {};
  }

  let merged = 0;
  let created = 0;

  for (const row of rows) {
    if (!payload.gamesByDate[row.date]) {
      payload.gamesByDate[row.date] = [];
    }

    const games = payload.gamesByDate[row.date];
    const game = findMatchingGame(games, row);

    if (game) {
      applyResult(game, row);
      merged += 1;
      continue;
    }

    games.push(buildGameFromResult(row, games.length + 1));
    created += 1;
  }

  payload.games = Object.values(payload.gamesByDate).flat();
  payload.updatedAt = new Date().toISOString();

  fs.writeFileSync(EVENTS_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(`Merged NPB results: ${merged}`);
  console.log(`Created NPB results: ${created}`);
  console.log(`Total imported results: ${merged + created}`);
  console.log(`Total games: ${payload.games.length}`);
}

main();
