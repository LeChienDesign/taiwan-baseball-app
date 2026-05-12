import fs from 'fs';
import path from 'path';
import { fetchCpblOfficialGamesByDate } from './providers/cpblOfficial';

type CpblPayload = Awaited<ReturnType<typeof fetchCpblOfficialGamesByDate>>;
type CpblGame = CpblPayload extends { games: infer Games }
  ? Games extends Array<infer Game>
    ? Game
    : never
  : never;

const CPBL_SEASON_FALLBACK_PATHS = [
  path.resolve(process.cwd(), 'data/cpbl-2026.json'),
  path.resolve(process.cwd(), 'server/data/cpbl-2026.json'),
  path.resolve(process.cwd(), 'server/data/cpblManualGames.json'),
];

const CPBL_FALLBACK_DATE_FIELDS = [
  'date',
  'gameDate',
  'scheduledDate',
  'startDate',
  'gameDateLocal',
  'actualDate',
  'rescheduledDate',
  'makeUpDate',
  'makeupDate',
  'playedDate',
  'officialDate',
  'calendarDate',
  'localDate',
];

function formatDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function resolveCpblEventsDate() {
  return (
    process.env.CPBL_EVENTS_DATE ||
    process.argv[2] ||
    formatDateInTimeZone(new Date(), 'Asia/Taipei')
  );
}

function resolveCpblEventsDateRange() {
  const singleDate = resolveCpblEventsDate();
  const startDate = process.env.CPBL_EVENTS_START_DATE || process.argv[2] || singleDate;
  const endDate = process.env.CPBL_EVENTS_END_DATE || process.argv[3] || startDate;

  return { startDate, endDate };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeDateValue(value: unknown) {
  if (!value) return undefined;

  const text = String(value).trim();
  const matched = text.match(/\d{4}-\d{2}-\d{2}/);
  if (matched) return matched[0];

  const slashMatched = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatched) {
    const [, year, month, day] = slashMatched;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return undefined;
}

function getTeamName(game: any, side: 'away' | 'home') {
  const team = side === 'away' ? game?.awayTeam : game?.homeTeam;

  return String(
    team?.name ??
    team?.displayName ??
    team?.shortName ??
    game?.[`${side}TeamName`] ??
    game?.[`${side}Name`] ??
    ''
  )
    .replace(/\s+/g, '')
    .toLowerCase();
}

function getGameIdentityKey(game: any) {
  const id = game?.id ?? game?.gameId ?? game?.GameSno ?? game?.gameNo;
  if (id) return `id:${id}`;

  const away = getTeamName(game, 'away');
  const home = getTeamName(game, 'home');
  const time = String(game?.footerRight ?? game?.gameTime ?? game?.time ?? game?.scheduledTime ?? '').slice(0, 5);

  return `match:${away}:${home}:${time}`;
}

function collectGamesFromPayload(payload: any, targetDate: string) {
  const games: any[] = [];

  if (Array.isArray(payload?.games)) games.push(...payload.games);
  if (Array.isArray(payload?.eventsCenter?.cpbl)) games.push(...payload.eventsCenter.cpbl);
  if (Array.isArray(payload?.gamesByDate?.[targetDate])) games.push(...payload.gamesByDate[targetDate]);

  if (payload?.gamesByDate && typeof payload.gamesByDate === 'object') {
    for (const [dateKey, dateGames] of Object.entries(payload.gamesByDate)) {
      if (!Array.isArray(dateGames)) continue;

      for (const game of dateGames) {
        games.push({
          ...(game as any),
          __fallbackDateKey: normalizeDateValue(dateKey),
        });
      }
    }
  }

  return games;
}

function isFallbackGameForDate(game: any, targetDate: string) {
  const candidates = CPBL_FALLBACK_DATE_FIELDS
    .map((field) => normalizeDateValue(game?.[field]))
    .filter(Boolean);

  if (game?.__fallbackDateKey) {
    candidates.push(game.__fallbackDateKey);
  }

  return candidates.includes(targetDate);
}

function readCpblFallbackGamesByDate(targetDate: string) {
  const fallbackGames: any[] = [];

  for (const filePath of CPBL_SEASON_FALLBACK_PATHS) {
    if (!fs.existsSync(filePath)) continue;

    try {
      const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const games = collectGamesFromPayload(payload, targetDate)
        .filter((game) => isFallbackGameForDate(game, targetDate))
        .map((game) => ({
          ...game,
          source: game?.source ?? 'cpbl-season-fallback',
          status: game?.status ?? 'SCHEDULED',
          league: game?.league ?? 'CPBL',
          date: targetDate,
          fallbackReason: game?.fallbackReason ?? 'season-schedule-date-match',
        }));

      fallbackGames.push(...games);
    } catch (error) {
      console.warn(`Skipped CPBL fallback file: ${filePath}`);
      console.warn(error);
    }
  }

  return fallbackGames;
}

function mergeCpblGamesByIdentity(officialGames: CpblGame[], fallbackGames: any[]) {
  const merged = new Map<string, any>();

  for (const game of fallbackGames) {
    merged.set(getGameIdentityKey(game), game);
  }

  for (const game of officialGames) {
    merged.set(getGameIdentityKey(game), game);
  }

  return Array.from(merged.values());
}

function flattenGamesByDate(gamesByDate: Record<string, CpblGame[]>) {
  return Object.keys(gamesByDate)
    .sort()
    .flatMap((date) => gamesByDate[date] ?? []);
}

function printCpblGamesForDate(date: string, games: CpblGame[]) {
  const rows = games.map((game: any) => ({
    id: game.id,
    away: game.awayTeam?.name,
    home: game.homeTeam?.name,
    status: game.status,
    score: `${game.awayScore ?? 0}-${game.homeScore ?? 0}`,
    footer: game.footerRight,
    officialUrl: game.officialUrl,
  }));

  console.log(`CPBL ${date} games snapshot:`);
  console.table(rows);
}

async function main() {
  const { startDate, endDate } = resolveCpblEventsDateRange();
  const outputPath = path.resolve(process.cwd(), 'server/data/eventsCenter.cpbl.json');
  const gamesByDate: Record<string, CpblGame[]> = {};
  const delayMs = Number(process.env.CPBL_EVENTS_FETCH_DELAY_MS ?? 120);

  for (
    let cursor = new Date(`${startDate}T00:00:00.000Z`);
    cursor <= new Date(`${endDate}T00:00:00.000Z`);
    cursor = addDays(cursor, 1)
  ) {
    const date = toDateString(cursor);
    const payload = await fetchCpblOfficialGamesByDate(date);
    const officialGames = ((payload as any)?.games ?? payload ?? []) as CpblGame[];
    const fallbackGames = readCpblFallbackGamesByDate(date);
    const games = mergeCpblGamesByIdentity(officialGames, fallbackGames) as CpblGame[];

    gamesByDate[date] = games;

    console.log(
      `Fetched CPBL schedule date: ${date} (${officialGames.length} official + ${Math.max(0, games.length - officialGames.length)} fallback = ${games.length} games)`
    );
    printCpblGamesForDate(date, games);

    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const allGames = flattenGamesByDate(gamesByDate);
  const storedDates = Object.keys(gamesByDate).sort();
  const payloadStartDate = storedDates[0] ?? startDate;
  const payloadEndDate = storedDates[storedDates.length - 1] ?? endDate;

  const payload = {
    updatedAt: new Date().toISOString(),
    date: startDate === endDate ? startDate : undefined,
    startDate: payloadStartDate,
    endDate: payloadEndDate,
    games: allGames,
    gamesByDate,
    eventsCenter: {
      cpbl: allGames,
    },
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Wrote CPBL events center data to ${outputPath}`);
  console.log(`CPBL updated range: ${startDate} → ${endDate}`);
  console.log(`CPBL stored range: ${payloadStartDate} → ${payloadEndDate}`);
  console.log(`Games: ${allGames.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
