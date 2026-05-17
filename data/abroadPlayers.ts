import abroadPlayersLivePayload from '../server/data/abroadPlayers.live.json';
export type PlayerStatus = '今日出賽' | '預告先發' | '已完賽' | '傷兵' | '待命' | '大聯盟出賽';
export type PlayerType = 'pitcher' | 'hitter';

export type AbroadTeamMeta = {
  id?: number;
  code?: string;
  abbreviation?: string;
  logoKey?: string;
  logoUrl?: string;
  displayName?: string;
  leagueGroup?: 'MLB' | 'MiLB' | 'NPB' | 'KBO' | 'Farm' | 'Other';
};

export type AbroadPlayer = {
  id: string;
  name: string;
  enName: string;
  team: string;
  league: string;
  level: string;
  position: string;
  bats: string;
  throws: string;
  age: number;
  number: string;
  status: PlayerStatus;
  intro: string;
  type: PlayerType;
  teamColor: string;

  teamMeta?: AbroadTeamMeta;

  trending?: boolean;
  line1?: string;
  line2?: string;
  recentNote?: string;

  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };

  seasonStats?: {
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
      losses?: number;
      holds?: number;
      games?: number;
      battersFaced?: number;
      hitByPitch?: number;
      hits?: number;
      homeRuns?: number;
      runs?: number;
      earnedRuns?: number;
      winningPercentage?: string;
    };
  };

  recentGames?: Array<{
    date: string;
    opponent: string;
    result: string;
    detail1: string;
    detail2: string;
  }>;

  news?: Array<{
    id: string;
    title: string;
    date: string;
    tag: string;
    summary: string;
    url?: string;
    source?: string;
  }>;

  career?: Array<{
    year: string;
    team: string;
    level: string;
    note: string;
  }>;

  officialPlayerUrl?: string;
  officialPhotoUrl?: string;
  officialPersonId?: number;
};

type PlayerSeedInput = Omit<
  AbroadPlayer,
  'type' | 'news' | 'career'
> & {
  trending?: boolean;
  line1?: string;
  line2?: string;
  recentNote?: string;
};

export const abroadSummary = {
  todayGames: 0,
  finals: 0,
  probableStarters: 0,
  injured: 0,
};

export const TEAM_META = {
  // MLB / MiLB
  astros: {
    id: 117,
    code: 'HOU',
    abbreviation: 'HOU',
    logoKey: 'astros',
    displayName: 'Houston Astros',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  redsox: {
    id: 111,
    code: 'BOS',
    abbreviation: 'BOS',
    logoKey: 'redsox',
    displayName: 'Boston Red Sox',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  tigers: {
    id: 116,
    code: 'DET',
    abbreviation: 'DET',
    logoKey: 'tigers',
    displayName: 'Detroit Tigers',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  diamondbacks: {
    id: 109,
    code: 'ARI',
    abbreviation: 'ARI',
    logoKey: 'diamondbacks',
    displayName: 'Arizona Diamondbacks',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  athletics: {
    id: 133,
    code: 'ATH',
    abbreviation: 'ATH',
    logoKey: 'athletics',
    displayName: 'Athletics',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  pirates: {
    id: 134,
    code: 'PIT',
    abbreviation: 'PIT',
    logoKey: 'pirates',
    displayName: 'Pittsburgh Pirates',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  phillies: {
    id: 143,
    code: 'PHI',
    abbreviation: 'PHI',
    logoKey: 'phillies',
    displayName: 'Philadelphia Phillies',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  dodgers: {
    id: 119,
    code: 'LAD',
    abbreviation: 'LAD',
    logoKey: 'dodgers',
    displayName: 'Los Angeles Dodgers',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  giants: {
    id: 137,
    code: 'SF',
    abbreviation: 'SF',
    logoKey: 'giants',
    displayName: 'San Francisco Giants',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  mariners: {
    id: 136,
    code: 'SEA',
    abbreviation: 'SEA',
    logoKey: 'mariners',
    displayName: 'Seattle Mariners',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  brewers: {
    id: 158,
    code: 'MIL',
    abbreviation: 'MIL',
    logoKey: 'brewers',
    displayName: 'Milwaukee Brewers',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  padres: {
    id: 135,
    code: 'SD',
    abbreviation: 'SD',
    logoKey: 'padres',
    displayName: 'San Diego Padres',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  reds: {
    id: 113,
    code: 'CIN',
    abbreviation: 'CIN',
    logoKey: 'reds',
    displayName: 'Cincinnati Reds',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  cardinals: {
    id: 138,
    code: 'STL',
    abbreviation: 'STL',
    logoKey: 'cardinals',
    displayName: 'St. Louis Cardinals',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  guardians: {
    id: 114,
    code: 'CLE',
    abbreviation: 'CLE',
    logoKey: 'guardians',
    displayName: 'Cleveland Guardians',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,
  cubs: {
    id: 112,
    code: 'CHC',
    abbreviation: 'CHC',
    logoKey: 'cubs',
    displayName: 'Chicago Cubs',
    leagueGroup: 'MLB',
  } satisfies AbroadTeamMeta,

  // NPB
  fighters: {
    code: 'F',
    abbreviation: 'F',
    logoKey: 'fighters',
    displayName: '北海道日本火腿鬥士',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  hawks: {
    code: 'H',
    abbreviation: 'H',
    logoKey: 'hawks',
    displayName: '福岡軟銀鷹',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  lionsNpb: {
    code: 'L',
    abbreviation: 'L',
    logoKey: 'lions-npb',
    displayName: '埼玉西武獅',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  rakutenEagles: {
    code: 'E',
    abbreviation: 'E',
    logoKey: 'eagles-npb',
    displayName: '東北樂天金鷲',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  swallows: {
    code: 'S',
    abbreviation: 'S',
    logoKey: 'swallows',
    displayName: '東京養樂多燕子',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,

  // KBO
  hanwhaEagles: {
    code: 'HAN',
    abbreviation: 'HAN',
    logoKey: 'hanwha-eagles',
    displayName: '韓華鷹',
    leagueGroup: 'KBO',
  } satisfies AbroadTeamMeta,
  samsungLions: {
    code: 'SAM',
    abbreviation: 'SAM',
    logoKey: 'samsung-lions',
    displayName: '三星獅',
    leagueGroup: 'KBO',
  } satisfies AbroadTeamMeta,
} as const;

function normalizeKey(value?: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[／/]/g, '')
    .replace(/[\s\-_'.]/g, '');
}

function inferTeamMeta(player: Pick<AbroadPlayer, 'team' | 'league' | 'level'>): AbroadTeamMeta | undefined {
  const team = normalizeKey(player.team);
  const league = normalizeKey(player.league);

  // MLB / MiLB
  if (team.includes('astros')) return TEAM_META.astros;
  if (team.includes('redsox') || team.includes('bostonredsox') || team.includes('red sox')) return TEAM_META.redsox;
  if (team.includes('tigers') || team.includes('detroittigers')) return TEAM_META.tigers;
  if (team.includes('diamondbacks') || team.includes('arizonadiamondbacks') || team.includes('dbacks')) {
    return TEAM_META.diamondbacks;
  }
  if (team.includes('athletics')) return TEAM_META.athletics;
  if (team.includes('pirates')) return TEAM_META.pirates;
  if (team.includes('phillies')) return TEAM_META.phillies;
  if (team.includes('dodgers')) return TEAM_META.dodgers;
  if (team.includes('giants') && (league.includes('mlb') || league.includes('milb'))) return TEAM_META.giants;
  if (team.includes('mariners')) return TEAM_META.mariners;
  if (team.includes('brewers')) return TEAM_META.brewers;
  if (team.includes('padres')) return TEAM_META.padres;
  if (team.includes('reds')) return TEAM_META.reds;
  if (team.includes('cardinals')) return TEAM_META.cardinals;
  if (team.includes('guardians') || team.includes('clevelandguardians')) return TEAM_META.guardians;
  if (team.includes('cubs') || team.includes('chicagocubs')) return TEAM_META.cubs;

  // NPB
  if (
    team.includes('日本火腿') ||
    team.includes('北海道日本火腿') ||
    team.includes('fighters') ||
    team.includes('nipponhamfighters')
  ) {
    return TEAM_META.fighters;
  }

  if (
    team.includes('軟銀') ||
    team.includes('福岡軟銀') ||
    team.includes('softbankhawks') ||
    team.includes('hawks')
  ) {
    return TEAM_META.hawks;
  }

  if (
    team.includes('西武') ||
    team.includes('埼玉西武') ||
    team.includes('seibulions') ||
    team.includes('lions')
  ) {
    return TEAM_META.lionsNpb;
  }

  if (
    team.includes('樂天') ||
    team.includes('rakuten') ||
    team.includes('tohokurakutengoldeneagles') ||
    team.includes('eagles')
  ) {
    return TEAM_META.rakutenEagles;
  }

  if (
    team.includes('養樂多') ||
    team.includes('yakult') ||
    team.includes('tokyoyakultswallows') ||
    team.includes('swallows')
  ) {
    return TEAM_META.swallows;
  }

  // KBO
  if (
    team.includes('hanwhaeagles') ||
    team.includes('韓華鷹') ||
    team.includes('韩华鹰')
  ) {
    return TEAM_META.hanwhaEagles;
  }

  if (
    team.includes('samsunglions') ||
    team.includes('三星獅') ||
    team.includes('三星狮') ||
    team.includes('samsung')
  ) {
    return TEAM_META.samsungLions;
  }

  return undefined;
}

function makePitcher(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'pitcher',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: input.seasonStats ?? {
      pitcher: {
        era: '—',
        whip: '—',
        ip: '—',
        so: 0,
        bb: 0,
        wins: 0,
        saves: 0,
      },
    },
    recentGames: input.recentGames ?? [],
    news: [],
    career: [],
  };
}

function makeHitter(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'hitter',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: input.seasonStats ?? {
      hitter: {
        avg: '—',
        obp: '—',
        slg: '—',
        ops: '—',
        hr: 0,
        rbi: 0,
        sb: 0,
        hits: 0,
      },
    },
    recentGames: input.recentGames ?? [],
    news: [],
    career: [],
  };
}

function normalizeAbroadPlayer(player: AbroadPlayer): AbroadPlayer {
  return {
    ...player,
    number: player.number === '—' ? '' : player.number,
  };
}

const supplementalAbroadPlayers: AbroadPlayer[] = [
  makeHitter({
    id: 'corbin-carroll',
    name: 'Corbin Carroll',
    enName: 'Corbin Carroll',
    team: 'Arizona Diamondbacks',
    league: 'MLB',
    level: 'MLB',
    position: 'OF',
    bats: 'L',
    throws: 'L',
    age: 25,
    number: '7',
    status: '待命',
    intro: '台裔外野手，效力亞利桑那響尾蛇。',
    teamColor: '#A71930',
    teamMeta: TEAM_META.diamondbacks,
    officialPlayerUrl: 'https://www.mlb.com/player/corbin-carroll-682998',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/w_360,q_auto:best/v1/people/682998/headshot/67/current',
    officialPersonId: 682998,
  }),
  makeHitter({
    id: 'stuart-fairchild',
    name: 'Stuart Fairchild',
    enName: 'Stuart Fairchild',
    team: 'Cleveland Guardians',
    league: 'MiLB',
    level: 'AAA',
    position: 'OF',
    bats: 'R',
    throws: 'R',
    age: 30,
    number: '—',
    status: '待命',
    intro: '台裔外野手，目前列入旅外觀察名單。',
    teamColor: '#00385D',
    teamMeta: TEAM_META.guardians,
    officialPlayerUrl: 'https://www.mlb.com/player/stuart-fairchild-656413',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/w_360,q_auto:best/v1/people/656413/headshot/67/current',
    officialPersonId: 656413,
  }),
  makeHitter({
    id: 'jonathon-long',
    name: 'Jonathon Long',
    enName: 'Jonathon Long',
    team: 'Chicago Cubs',
    league: 'MiLB',
    level: 'Triple-A',
    position: '1B/IF',
    bats: 'R',
    throws: 'R',
    age: 24,
    number: '—',
    status: '待命',
    intro: '台裔內野手，小熊體系旅外觀察球員。',
    teamColor: '#0E3386',
    teamMeta: TEAM_META.cubs,
    officialPlayerUrl: 'https://www.milb.com/player/jonathon-long-675085',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_180/v1/people/675085/headshot/milb/current',
    officialPersonId: 675085,
  }),
];

const liveAbroadPlayers = (abroadPlayersLivePayload.players as AbroadPlayer[]).map(normalizeAbroadPlayer);
const livePlayerIds = new Set(liveAbroadPlayers.map((player) => player.id));

export const abroadPlayers = [
  ...liveAbroadPlayers,
  ...supplementalAbroadPlayers.filter((player) => !livePlayerIds.has(player.id)).map(normalizeAbroadPlayer),
];
