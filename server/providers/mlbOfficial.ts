export type NormalizedGameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export type ScoreboardTeam = {
  id: number;
  name: string;
  abbreviation: string;
  logoKey: string;
};

export type ScoreboardGame = {
  id: string;
  source: 'mlb-official';
  league: 'MLB';
  date: string;
  gamePk: number;
  status: NormalizedGameStatus;
  statusText: string;
  venue?: string;
  awayTeam: ScoreboardTeam;
  homeTeam: ScoreboardTeam;
  awayScore: number;
  homeScore: number;
  innings: number[];
  awayLine: {
    team: string;
    innings: (number | string)[];
    r: number;
    h: number;
    e: number;
  };
  homeLine: {
    team: string;
    innings: (number | string)[];
    r: number;
    h: number;
    e: number;
  };
  footerLeft: string;
  footerRight: string;
  gameDate?: string;
};

export type MlbPerson = {
  id: number;
  fullName: string;
  currentTeam?: {
    id: number;
    name: string;
    abbreviation: string;
    logoKey: string;
  };
  active?: boolean;
  primaryPosition?: string;
  batSide?: 'R' | 'L' | 'S';
  pitchHand?: 'R' | 'L';
  jerseyNumber?: string;
};

export type MlbPlayerSeasonStats = {
  type: 'hitter' | 'pitcher';
  hitter?: {
    avg: string;
    obp: string;
    slg: string;
    ops: string;
    hr: number;
    rbi: number;
    sb: number;
    hits: number;
  };
  pitcher?: {
    era: string;
    whip: string;
    ip: string;
    so: number;
    bb: number;
    wins: number;
    saves: number;
  };
};

const MLB_BASE = 'https://statsapi.mlb.com/api/v1';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TaiwanBaseballHub/1.0',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`MLB request failed: ${res.status} ${res.statusText} ${url}`);
  }

  return (await res.json()) as T;
}

function mapStatusCodeToNormalized(
  abstractGameState?: string,
  detailedState?: string
): NormalizedGameStatus {
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

function safeTeamAbbr(team: any) {
  return (
    team?.abbreviation ||
    team?.teamCode ||
    team?.fileCode ||
    team?.name?.slice(0, 3)?.toUpperCase() ||
    'TEAM'
  );
}

function safeLogoKey(team: any) {
  return safeTeamAbbr(team).toUpperCase();
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

function buildInningLines(linescore: any, awayShort: string, homeShort: string) {
  const innings = Array.isArray(linescore?.innings) ? linescore.innings : [];
  const headers =
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
    headers,
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

function buildFooter(game: any) {
  const detailedState = game?.status?.detailedState ?? '待更新';
  const inningState = game?.linescore?.inningState;
  const currentInning = game?.linescore?.currentInning;

  const footerRight =
    inningState && currentInning
      ? `${inningState}${currentInning}局`
      : toTaipeiTime(game?.gameDate);

  return {
    footerLeft: detailedState,
    footerRight,
  };
}

function buildTeam(team: any): ScoreboardTeam {
  const abbreviation = safeTeamAbbr(team);
  return {
    id: team?.id ?? 0,
    name: team?.name ?? 'Team',
    abbreviation,
    logoKey: safeLogoKey(team),
  };
}

export async function fetchMlbScoreboardByDate(date: string): Promise<ScoreboardGame[]> {
  const url =
    `${MLB_BASE}/schedule?sportId=1&date=${encodeURIComponent(date)}` +
    `&hydrate=linescore,team,venue`;

  const data = await fetchJson<any>(url);
  const games = data?.dates?.[0]?.games ?? [];

  return games.map((game: any) => {
    const status = mapStatusCodeToNormalized(
      game?.status?.abstractGameState,
      game?.status?.detailedState
    );

    const awayShort = safeTeamAbbr(game?.teams?.away?.team);
    const homeShort = safeTeamAbbr(game?.teams?.home?.team);
    const lines = buildInningLines(game?.linescore, awayShort, homeShort);
    const footer = buildFooter(game);

    return {
      id: `mlb-${game.gamePk}`,
      source: 'mlb-official',
      league: 'MLB',
      date,
      gamePk: game.gamePk,
      status,
      statusText: game?.status?.detailedState ?? '待更新',
      venue: game?.venue?.name ?? '待更新',
      awayTeam: buildTeam(game?.teams?.away?.team),
      homeTeam: buildTeam(game?.teams?.home?.team),
      awayScore: game?.teams?.away?.score ?? 0,
      homeScore: game?.teams?.home?.score ?? 0,
      innings: lines.headers,
      awayLine: lines.awayLine,
      homeLine: lines.homeLine,
      footerLeft: footer.footerLeft,
      footerRight: footer.footerRight,
      gameDate: game?.gameDate,
    };
  });
}

export async function fetchMlbTeamGames(args: {
  teamId: number;
  startDate: string;
  endDate: string;
}): Promise<ScoreboardGame[]> {
  const url =
    `${MLB_BASE}/schedule?sportId=1&teamId=${args.teamId}` +
    `&startDate=${encodeURIComponent(args.startDate)}` +
    `&endDate=${encodeURIComponent(args.endDate)}` +
    `&hydrate=linescore,team,venue`;

  const data = await fetchJson<any>(url);
  const dates = data?.dates ?? [];
  const games = dates.flatMap((d: any) => d?.games ?? []);

  return games.map((game: any) => {
    const status = mapStatusCodeToNormalized(
      game?.status?.abstractGameState,
      game?.status?.detailedState
    );

    const awayShort = safeTeamAbbr(game?.teams?.away?.team);
    const homeShort = safeTeamAbbr(game?.teams?.home?.team);
    const lines = buildInningLines(game?.linescore, awayShort, homeShort);
    const footer = buildFooter(game);

    return {
      id: `mlb-${game.gamePk}`,
      source: 'mlb-official',
      league: 'MLB',
      date: game?.officialDate ?? args.startDate,
      gamePk: game.gamePk,
      status,
      statusText: game?.status?.detailedState ?? '待更新',
      venue: game?.venue?.name ?? '待更新',
      awayTeam: buildTeam(game?.teams?.away?.team),
      homeTeam: buildTeam(game?.teams?.home?.team),
      awayScore: game?.teams?.away?.score ?? 0,
      homeScore: game?.teams?.home?.score ?? 0,
      innings: lines.headers,
      awayLine: lines.awayLine,
      homeLine: lines.homeLine,
      footerLeft: footer.footerLeft,
      footerRight: footer.footerRight,
      gameDate: game?.gameDate,
    };
  });
}

export async function fetchMlbPerson(personId: number): Promise<MlbPerson | null> {
  const url = `${MLB_BASE}/people/${personId}`;
  const data = await fetchJson<any>(url);
  const person = data?.people?.[0];
  if (!person) return null;

  const team = person?.currentTeam;

  return {
    id: person.id,
    fullName: person.fullName,
    currentTeam: team
      ? {
          id: team.id,
          name: team.name,
          abbreviation: safeTeamAbbr(team),
          logoKey: safeLogoKey(team),
        }
      : undefined,
    active: person.active,
    primaryPosition: person.primaryPosition?.abbreviation,
    batSide: person.batSide?.code,
    pitchHand: person.pitchHand?.code,
    jerseyNumber: person.primaryNumber,
  };
}

export async function fetchMlbPlayerSeasonStats(args: {
  personId: number;
  type: 'hitter' | 'pitcher';
  season?: string;
}): Promise<MlbPlayerSeasonStats> {
  const group = args.type === 'pitcher' ? 'pitching' : 'hitting';
  const season = args.season ?? String(new Date().getFullYear());

  const url =
    `${MLB_BASE}/people/${args.personId}/stats?stats=season` +
    `&group=${group}&season=${season}`;

  const data = await fetchJson<any>(url);
  const stat = data?.stats?.[0]?.splits?.[0]?.stat ?? {};

  if (args.type === 'pitcher') {
    return {
      type: 'pitcher',
      pitcher: {
        era: stat?.era ?? '0.00',
        whip: stat?.whip ?? '0.00',
        ip: stat?.inningsPitched ?? '0.0',
        so: Number(stat?.strikeOuts ?? 0),
        bb: Number(stat?.baseOnBalls ?? 0),
        wins: Number(stat?.wins ?? 0),
        saves: Number(stat?.saves ?? 0),
      },
    };
  }

  return {
    type: 'hitter',
    hitter: {
      avg: stat?.avg ?? '.000',
      obp: stat?.obp ?? '.000',
      slg: stat?.slg ?? '.000',
      ops: stat?.ops ?? '.000',
      hr: Number(stat?.homeRuns ?? 0),
      rbi: Number(stat?.rbi ?? 0),
      sb: Number(stat?.stolenBases ?? 0),
      hits: Number(stat?.hits ?? 0),
    },
  };
}