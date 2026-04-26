import { getMlbTeamLogo } from '../constants/mlbTeamLogos';

export type TeamCardInfo = {
  name: string;
  short: string;
  record: string;
  logo: any;
};

export type LineScoreRow = {
  team: string;
  innings: (number | string)[];
  r: number;
  h: number;
  e: number;
};

export type ScoreboardGame = {
  id: string;
  gamePk: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  venue: string;
  awayTeam: TeamCardInfo;
  homeTeam: TeamCardInfo;
  awayScore: number;
  homeScore: number;
  innings: number[];
  awayLine: LineScoreRow;
  homeLine: LineScoreRow;
  footerLeft: string;
  footerRight: string;
  gameDate?: string;
};

const MLB_BASE = 'https://statsapi.mlb.com/api/v1';
const REMOTE_BASE = process.env.EXPO_PUBLIC_BASEBALL_API_URL;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

function toTaipeiTime(iso?: string) {
  if (!iso) return '待更新';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '待更新';

  return new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Taipei',
  }).format(d);
}

function mapStatus(
  abstractGameState?: string,
  detailedState?: string
): 'SCHEDULED' | 'LIVE' | 'FINAL' {
  if (abstractGameState === 'Live') return 'LIVE';
  if (abstractGameState === 'Final') return 'FINAL';

  if (
    detailedState?.includes('In Progress') ||
    detailedState?.includes('Manager Challenge') ||
    detailedState?.includes('Review')
  ) {
    return 'LIVE';
  }

  if (detailedState?.includes('Final')) return 'FINAL';
  return 'SCHEDULED';
}

function safeTeamShort(team: any) {
  return (
    team?.abbreviation ||
    team?.teamCode ||
    team?.fileCode ||
    team?.name?.slice(0, 3)?.toUpperCase() ||
    'TEAM'
  );
}

function buildLines(linescore: any, awayShort: string, homeShort: string) {
  const innings = Array.isArray(linescore?.innings) ? linescore.innings : [];
  const inningHeaders =
    innings.length > 0
      ? innings.map((_: any, index: number) => index + 1)
      : [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const awayInnings =
    innings.length > 0
      ? innings.map((inn: any) => inn?.away?.runs ?? '-')
      : Array.from({ length: 9 }, () => '-');

  const homeInnings =
    innings.length > 0
      ? innings.map((inn: any) => inn?.home?.runs ?? '-')
      : Array.from({ length: 9 }, () => '-');

  return {
    inningHeaders,
    awayLine: {
      team: awayShort,
      innings: awayInnings,
      r: linescore?.teams?.away?.runs ?? 0,
      h: linescore?.teams?.away?.hits ?? 0,
      e: linescore?.teams?.away?.errors ?? 0,
    },
    homeLine: {
      team: homeShort,
      innings: homeInnings,
      r: linescore?.teams?.home?.runs ?? 0,
      h: linescore?.teams?.home?.hits ?? 0,
      e: linescore?.teams?.home?.errors ?? 0,
    },
  };
}

function buildTeamInfo(team: any): TeamCardInfo {
  return {
    name: team?.name ?? 'Team',
    short: safeTeamShort(team),
    record: '',
    logo: getMlbTeamLogo(team),
  };
}

function normalizeScheduleGames(data: any, fallbackDate: string): ScoreboardGame[] {
  const dates = Array.isArray(data?.dates) ? data.dates : [];
  const games = dates.flatMap((d: any) => d?.games ?? []);

  return games.map((game: any) => {
    const status = mapStatus(
      game?.status?.abstractGameState,
      game?.status?.detailedState
    );

    const awayShort = safeTeamShort(game?.teams?.away?.team);
    const homeShort = safeTeamShort(game?.teams?.home?.team);

    const lines = buildLines(game?.linescore, awayShort, homeShort);

    const footerRight =
      game?.linescore?.inningState && game?.linescore?.currentInning
        ? `${game.linescore.inningState}${game.linescore.currentInning}局`
        : toTaipeiTime(game?.gameDate);

    return {
      id: `mlb-${game.gamePk}`,
      gamePk: game.gamePk,
      status,
      venue: game?.venue?.name ?? '待更新',
      awayTeam: buildTeamInfo(game?.teams?.away?.team),
      homeTeam: buildTeamInfo(game?.teams?.home?.team),
      awayScore: game?.teams?.away?.score ?? 0,
      homeScore: game?.teams?.home?.score ?? 0,
      innings: lines.inningHeaders,
      awayLine: lines.awayLine,
      homeLine: lines.homeLine,
      footerLeft: game?.status?.detailedState ?? '待更新',
      footerRight,
      gameDate: game?.gameDate ?? fallbackDate,
    };
  });
}

async function fetchFromRemote(date: string): Promise<ScoreboardGame[] | null> {
  if (!REMOTE_BASE) return null;

  try {
    const url = `${REMOTE_BASE.replace(/\/$/, '')}/events-center/mlb?date=${encodeURIComponent(date)}`;
    const data = await fetchJson<any>(url);

    if (Array.isArray(data)) return data as ScoreboardGame[];
    if (Array.isArray(data?.games)) return data.games as ScoreboardGame[];
    if (Array.isArray(data?.eventsCenter?.mlb)) return data.eventsCenter.mlb as ScoreboardGame[];

    return null;
  } catch {
    return null;
  }
}

async function fetchDirectFromMlb(date: string): Promise<ScoreboardGame[]> {
  const url =
    `${MLB_BASE}/schedule?sportId=1&date=${encodeURIComponent(date)}` +
    `&hydrate=linescore,team,venue`;

  const data = await fetchJson<any>(url);
  return normalizeScheduleGames(data, date);
}

export async function fetchMlbGamesByDate(date: string): Promise<ScoreboardGame[]> {
  const remote = await fetchFromRemote(date);
  if (remote) {
    return remote;
  }

  return fetchDirectFromMlb(date);
}