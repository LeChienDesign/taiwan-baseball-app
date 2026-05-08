import fs from 'node:fs';
import path from 'node:path';

type LineScore = {
  innings?: Array<number | string | null>;
  r?: number | string | null;
  h?: number | string | null;
  e?: number | string | null;
};

type Game = {
  id?: string;
  status?: string;
  statusText?: string;
  awayScore?: number | string | null;
  homeScore?: number | string | null;
  awayTeam?: { name?: string; short?: string };
  homeTeam?: { name?: string; short?: string };
  awayLine?: LineScore;
  homeLine?: LineScore;
  footerLeft?: string;
  footerRight?: string;
  gameDate?: string;
  date?: string;
};

type ValidationMessage = {
  league: string;
  label: string;
  level: 'ERROR' | 'WARN';
  message: string;
};

const FILES = [
  ['CPBL', 'server/data/eventsCenter.cpbl.json'],
  ['MLB', 'server/data/eventsCenter.mlb.json'],
  ['NPB', 'server/data/eventsCenter.npb.json'],
  ['KBO', 'server/data/eventsCenter.kbo.json'],
] as const;

function toNumber(value: unknown) {
  if (value === '' || value == null || value === '-') return null;

  const normalized = String(value)
    .trim()
    .replace(/[xXｘＸ]$/u, '');

  if (!normalized) return null;

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function isPlayedInningValue(value: unknown) {
  return value !== '-' && value !== '' && value !== null && value !== undefined;
}

function inningSum(values?: Array<number | string | null>) {
  if (!Array.isArray(values)) return null;

  return values.reduce((sum, value) => {
    const n = toNumber(value);
    return sum + (n ?? 0);
  }, 0);
}

function normalizeStatus(value?: string) {
  return String(value ?? '').trim().toUpperCase();
}

function combinedStatusText(game: Game) {
  return `${game.status ?? ''} ${game.statusText ?? ''} ${game.footerLeft ?? ''} ${game.footerRight ?? ''}`.toUpperCase();
}

function gameDate(game: Game) {
  return String(game.gameDate ?? game.date ?? '').slice(0, 10);
}

function gameLabel(game: Game) {
  return `${gameDate(game) || 'date?'} ${game.awayTeam?.name ?? 'Away'} @ ${game.homeTeam?.name ?? 'Home'}`;
}

function pushMessage(
  messages: ValidationMessage[],
  league: string,
  game: Game,
  level: ValidationMessage['level'],
  message: string
) {
  messages.push({
    league,
    label: gameLabel(game),
    level,
    message,
  });
}

function playedLength(values?: Array<number | string | null>) {
  if (!Array.isArray(values)) return 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (isPlayedInningValue(values[index])) {
      return index + 1;
    }
  }

  return 0;
}

function validateLineScoreConsistency(league: string, game: Game, messages: ValidationMessage[]) {
  const awayScore = toNumber(game.awayScore);
  const homeScore = toNumber(game.homeScore);
  const awayR = toNumber(game.awayLine?.r);
  const homeR = toNumber(game.homeLine?.r);

  // 最重要規則：上排 R = awayScore；下排 R = homeScore。
  if (awayScore != null && awayR != null && awayScore !== awayR) {
    pushMessage(messages, league, game, 'ERROR', `awayScore mismatch: score=${awayScore}, awayLine.r=${awayR}`);
  }

  if (homeScore != null && homeR != null && homeScore !== homeR) {
    pushMessage(messages, league, game, 'ERROR', `homeScore mismatch: score=${homeScore}, homeLine.r=${homeR}`);
  }

  const awaySum = inningSum(game.awayLine?.innings);
  const homeSum = inningSum(game.homeLine?.innings);

  if (awaySum != null && awayR != null && awaySum !== awayR) {
    pushMessage(messages, league, game, 'ERROR', `away inning sum mismatch: sum=${awaySum}, awayLine.r=${awayR}`);
  }

  if (homeSum != null && homeR != null && homeSum !== homeR) {
    pushMessage(messages, league, game, 'ERROR', `home inning sum mismatch: sum=${homeSum}, homeLine.r=${homeR}`);
  }
}

function validateStatusConsistency(league: string, game: Game, messages: ValidationMessage[]) {
  const status = normalizeStatus(game.status);
  const text = combinedStatusText(game);

  if (status === 'FINAL' && text.includes('LIVE')) {
    pushMessage(messages, league, game, 'ERROR', 'FINAL game still contains LIVE footer/status text');
  }

  if (status === 'LIVE' && (text.includes('FINAL') || text.includes('GAMEOVER') || text.includes('比賽結束') || text.includes('試合終了'))) {
    pushMessage(messages, league, game, 'ERROR', 'LIVE game contains final-like footer/status text');
  }
}

function validateInningColumns(league: string, game: Game, messages: ValidationMessage[]) {
  const awayLength = game.awayLine?.innings?.length ?? 0;
  const homeLength = game.homeLine?.innings?.length ?? 0;
  const maxLength = Math.max(awayLength, homeLength);
  const maxPlayedLength = Math.max(
    playedLength(game.awayLine?.innings),
    playedLength(game.homeLine?.innings)
  );

  // KBO 等來源可能固定帶到 15 格，但 10~15 都是 '-'。
  // 這是資料噪音，UI 會裁掉；列為警告，不阻擋流程。
  if (maxLength > 9 && maxPlayedLength <= 9) {
    pushMessage(messages, league, game, 'WARN', `unused extra inning columns: maxLength=${maxLength}, playedLength=${maxPlayedLength}`);
  }

  if (maxPlayedLength > 12) {
    pushMessage(messages, league, game, 'WARN', `very long extra-inning game: playedLength=${maxPlayedLength}`);
  }
}

function validateGame(league: string, game: Game) {
  const messages: ValidationMessage[] = [];

  validateLineScoreConsistency(league, game, messages);
  validateStatusConsistency(league, game, messages);
  validateInningColumns(league, game, messages);

  return messages;
}

function readGames(payload: any): Game[] {
  if (Array.isArray(payload?.games)) {
    return payload.games;
  }

  if (payload?.gamesByDate && typeof payload.gamesByDate === 'object') {
    return Object.values(payload.gamesByDate).flatMap((games) => (Array.isArray(games) ? games : []));
  }

  return [];
}

function formatMessage(message: ValidationMessage) {
  return `[${message.league}] ${message.level} ${message.label} :: ${message.message}`;
}

function main() {
  const allMessages: ValidationMessage[] = [];
  const counts: Record<string, number> = {};

  for (const [league, relativePath] of FILES) {
    const filePath = path.resolve(process.cwd(), relativePath);

    if (!fs.existsSync(filePath)) {
      allMessages.push({
        league,
        label: relativePath,
        level: 'ERROR',
        message: `Missing file: ${relativePath}`,
      });
      continue;
    }

    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const games = readGames(payload);
    counts[league] = games.length;

    if (!games.length) {
      allMessages.push({
        league,
        label: relativePath,
        level: 'ERROR',
        message: `No games found in ${relativePath}`,
      });
      continue;
    }

    for (const game of games) {
      allMessages.push(...validateGame(league, game));
    }
  }

  const errors = allMessages.filter((message) => message.level === 'ERROR');
  const warnings = allMessages.filter((message) => message.level === 'WARN');

  for (const warning of warnings) {
    console.warn(formatMessage(warning));
  }

  for (const error of errors) {
    console.error(formatMessage(error));
  }

  for (const [league] of FILES) {
    const errorCount = errors.filter((message) => message.league === league).length;
    const warningCount = warnings.filter((message) => message.league === league).length;
    const suffix = warningCount ? ` (${warningCount} warnings)` : '';
    console.log(`[${league}] ${errorCount ? 'FAILED' : 'OK'} - ${counts[league] ?? 0} games${suffix}`);
  }

  if (errors.length) {
    process.exitCode = 1;
  }
}

main();
