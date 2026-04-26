export type AbroadLeagueGroup = 'MLB' | 'MiLB' | 'NPB' | 'KBO' | 'Farm' | 'Other';

export type AbroadTeamMeta = {
  id?: number;
  abbreviation?: string;
  logoKey?: string;
  logoUrl?: string;
  displayName?: string;
  leagueGroup?: AbroadLeagueGroup;
};

export const TEAM_META = {
  // MLB / MiLB
  astros: {
    id: 117,
    abbreviation: 'HOU',
    logoKey: 'astros',
    displayName: 'Houston Astros',
    leagueGroup: 'MLB',
  },
  redsox: {
    id: 111,
    abbreviation: 'BOS',
    logoKey: 'redsox',
    displayName: 'Boston Red Sox',
    leagueGroup: 'MLB',
  },
  tigers: {
    id: 116,
    abbreviation: 'DET',
    logoKey: 'tigers',
    displayName: 'Detroit Tigers',
    leagueGroup: 'MLB',
  },
  diamondbacks: {
    id: 109,
    abbreviation: 'ARI',
    logoKey: 'diamondbacks',
    displayName: 'Arizona Diamondbacks',
    leagueGroup: 'MLB',
  },
  athletics: {
    id: 133,
    abbreviation: 'OAK',
    logoKey: 'athletics',
    displayName: 'Athletics',
    leagueGroup: 'MLB',
  },
  pirates: {
    id: 134,
    abbreviation: 'PIT',
    logoKey: 'pirates',
    displayName: 'Pittsburgh Pirates',
    leagueGroup: 'MLB',
  },
  phillies: {
    id: 143,
    abbreviation: 'PHI',
    logoKey: 'phillies',
    displayName: 'Philadelphia Phillies',
    leagueGroup: 'MLB',
  },
  dodgers: {
    id: 119,
    abbreviation: 'LAD',
    logoKey: 'dodgers',
    displayName: 'Los Angeles Dodgers',
    leagueGroup: 'MLB',
  },
  giants: {
    id: 137,
    abbreviation: 'SF',
    logoKey: 'giants',
    displayName: 'San Francisco Giants',
    leagueGroup: 'MLB',
  },
  yankees: {
    id: 147,
    abbreviation: 'NYY',
    logoKey: 'yankees',
    displayName: 'New York Yankees',
    leagueGroup: 'MLB',
  },
  mets: {
    id: 121,
    abbreviation: 'NYM',
    logoKey: 'mets',
    displayName: 'New York Mets',
    leagueGroup: 'MLB',
  },
  mariners: {
    id: 136,
    abbreviation: 'SEA',
    logoKey: 'mariners',
    displayName: 'Seattle Mariners',
    leagueGroup: 'MLB',
  },
  guardians: {
    id: 114,
    abbreviation: 'CLE',
    logoKey: 'guardians',
    displayName: 'Cleveland Guardians',
    leagueGroup: 'MLB',
  },
  cubs: {
    id: 112,
    abbreviation: 'CHC',
    logoKey: 'cubs',
    displayName: 'Chicago Cubs',
    leagueGroup: 'MLB',
  },
  cardinals: {
    id: 138,
    abbreviation: 'STL',
    logoKey: 'cardinals',
    displayName: 'St. Louis Cardinals',
    leagueGroup: 'MLB',
  },
  braves: {
    id: 144,
    abbreviation: 'ATL',
    logoKey: 'braves',
    displayName: 'Atlanta Braves',
    leagueGroup: 'MLB',
  },
  rangers: {
    id: 140,
    abbreviation: 'TEX',
    logoKey: 'rangers',
    displayName: 'Texas Rangers',
    leagueGroup: 'MLB',
  },
  rays: {
    id: 139,
    abbreviation: 'TB',
    logoKey: 'rays',
    displayName: 'Tampa Bay Rays',
    leagueGroup: 'MLB',
  },
  marlins: {
    id: 146,
    abbreviation: 'MIA',
    logoKey: 'marlins',
    displayName: 'Miami Marlins',
    leagueGroup: 'MLB',
  },
  brewers: {
    id: 158,
    abbreviation: 'MIL',
    logoKey: 'brewers',
    displayName: 'Milwaukee Brewers',
    leagueGroup: 'MLB',
  },
  padres: {
    id: 135,
    abbreviation: 'SD',
    logoKey: 'padres',
    displayName: 'San Diego Padres',
    leagueGroup: 'MLB',
  },
  bluejays: {
    id: 141,
    abbreviation: 'TOR',
    logoKey: 'bluejays',
    displayName: 'Toronto Blue Jays',
    leagueGroup: 'MLB',
  },
  reds: {
    id: 113,
    abbreviation: 'CIN',
    logoKey: 'reds',
    displayName: 'Cincinnati Reds',
    leagueGroup: 'MLB',
  },
  nationals: {
    id: 120,
    abbreviation: 'WSH',
    logoKey: 'nationals',
    displayName: 'Washington Nationals',
    leagueGroup: 'MLB',
  },
  angels: {
    id: 108,
    abbreviation: 'LAA',
    logoKey: 'angels',
    displayName: 'Los Angeles Angels',
    leagueGroup: 'MLB',
  },
  royals: {
    id: 118,
    abbreviation: 'KC',
    logoKey: 'royals',
    displayName: 'Kansas City Royals',
    leagueGroup: 'MLB',
  },
  rockies: {
    id: 115,
    abbreviation: 'COL',
    logoKey: 'rockies',
    displayName: 'Colorado Rockies',
    leagueGroup: 'MLB',
  },
  whitesox: {
    id: 145,
    abbreviation: 'CWS',
    logoKey: 'whitesox',
    displayName: 'Chicago White Sox',
    leagueGroup: 'MLB',
  },
  twins: {
    id: 142,
    abbreviation: 'MIN',
    logoKey: 'twins',
    displayName: 'Minnesota Twins',
    leagueGroup: 'MLB',
  },
  orioles: {
    id: 110,
    abbreviation: 'BAL',
    logoKey: 'orioles',
    displayName: 'Baltimore Orioles',
    leagueGroup: 'MLB',
  },

  // NPB
  fighters: {
    abbreviation: 'F',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Hokkaido_Nippon_Ham_Fighters_logo.svg',
    displayName: 'Hokkaido Nippon-Ham Fighters',
    leagueGroup: 'NPB',
  },
  giantsNpb: {
    abbreviation: 'G',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/Yomiuri_Giants_logo.svg',
    displayName: 'Yomiuri Giants',
    leagueGroup: 'NPB',
  },
  softbankHawks: {
    abbreviation: 'H',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/29/Fukuoka_SoftBank_Hawks_logo.svg',
    displayName: 'Fukuoka SoftBank Hawks',
    leagueGroup: 'NPB',
  },
  rakutenEagles: {
    abbreviation: 'E',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Tohoku_Rakuten_Golden_Eagles_logo.svg',
    displayName: 'Tohoku Rakuten Golden Eagles',
    leagueGroup: 'NPB',
  },
  hanshinTigers: {
    abbreviation: 'T',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/1/18/Hanshin_Tigers_logo.svg',
    displayName: 'Hanshin Tigers',
    leagueGroup: 'NPB',
  },
  seibuLions: {
    abbreviation: 'L',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Saitama_Seibu_Lions_logo.svg',
    displayName: 'Saitama Seibu Lions',
    leagueGroup: 'NPB',
  },

  // KBO
  lgTwins: {
    abbreviation: 'LG',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/LG_Twins_logo.svg',
    displayName: 'LG Twins',
    leagueGroup: 'KBO',
  },
  ktWiz: {
    abbreviation: 'KT',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6d/KT_Wiz_logo.svg',
    displayName: 'KT Wiz',
    leagueGroup: 'KBO',
  },
  doosanBears: {
    abbreviation: 'DOO',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Doosan_Bears_logo.svg',
    displayName: 'Doosan Bears',
    leagueGroup: 'KBO',
  },
  ssgLanders: {
    abbreviation: 'SSG',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/59/SSG_Landers_logo.svg',
    displayName: 'SSG Landers',
    leagueGroup: 'KBO',
  },

  // Farm / 二軍
  softbankHawksFarm: {
    abbreviation: 'H2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/29/Fukuoka_SoftBank_Hawks_logo.svg',
    displayName: 'Fukuoka SoftBank Hawks 二軍',
    leagueGroup: 'Farm',
  },
  fightersFarm: {
    abbreviation: 'F2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/69/Hokkaido_Nippon_Ham_Fighters_logo.svg',
    displayName: 'Nippon-Ham Fighters 二軍',
    leagueGroup: 'Farm',
  },
  lgTwinsFarm: {
    abbreviation: 'LG2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/80/LG_Twins_logo.svg',
    displayName: 'LG Twins 二軍',
    leagueGroup: 'Farm',
  },
} as const;

export type TeamMetaKey = keyof typeof TEAM_META;

function normalizeKey(value?: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');
}

export const TEAM_ALIAS_TO_META_KEY: Record<string, TeamMetaKey> = {
  // MLB
  'houston astros': 'astros',
  astros: 'astros',
  hou: 'astros',

  'boston red sox': 'redsox',
  'red sox': 'redsox',
  redsox: 'redsox',
  bos: 'redsox',

  'detroit tigers': 'tigers',
  tigers: 'tigers',
  det: 'tigers',

  'arizona diamondbacks': 'diamondbacks',
  diamondbacks: 'diamondbacks',
  dbacks: 'diamondbacks',
  ari: 'diamondbacks',

  athletics: 'athletics',
  'oakland athletics': 'athletics',
  oak: 'athletics',

  pirates: 'pirates',
  'pittsburgh pirates': 'pirates',
  pit: 'pirates',

  phillies: 'phillies',
  'philadelphia phillies': 'phillies',
  phi: 'phillies',

  dodgers: 'dodgers',
  'los angeles dodgers': 'dodgers',
  lad: 'dodgers',

  giants: 'giants',
  'san francisco giants': 'giants',
  sf: 'giants',

  yankees: 'yankees',
  'new york yankees': 'yankees',
  nyy: 'yankees',

  mets: 'mets',
  'new york mets': 'mets',
  nym: 'mets',

  mariners: 'mariners',
  'seattle mariners': 'mariners',
  sea: 'mariners',

  guardians: 'guardians',
  'cleveland guardians': 'guardians',
  cle: 'guardians',

  cubs: 'cubs',
  'chicago cubs': 'cubs',
  chc: 'cubs',

  cardinals: 'cardinals',
  'st louis cardinals': 'cardinals',
  stl: 'cardinals',

  braves: 'braves',
  'atlanta braves': 'braves',
  atl: 'braves',

  rangers: 'rangers',
  'texas rangers': 'rangers',
  tex: 'rangers',

  rays: 'rays',
  'tampa bay rays': 'rays',
  tb: 'rays',

  marlins: 'marlins',
  'miami marlins': 'marlins',
  mia: 'marlins',

  brewers: 'brewers',
  'milwaukee brewers': 'brewers',
  mil: 'brewers',

  padres: 'padres',
  'san diego padres': 'padres',
  sd: 'padres',

  'toronto blue jays': 'bluejays',
  'blue jays': 'bluejays',
  bluejays: 'bluejays',
  tor: 'bluejays',

  reds: 'reds',
  'cincinnati reds': 'reds',
  cin: 'reds',

  nationals: 'nationals',
  'washington nationals': 'nationals',
  wsh: 'nationals',

  angels: 'angels',
  'los angeles angels': 'angels',
  laa: 'angels',

  royals: 'royals',
  'kansas city royals': 'royals',
  kc: 'royals',

  rockies: 'rockies',
  'colorado rockies': 'rockies',
  col: 'rockies',

  whitesox: 'whitesox',
  'white sox': 'whitesox',
  'chicago white sox': 'whitesox',
  cws: 'whitesox',

  twins: 'twins',
  'minnesota twins': 'twins',
  min: 'twins',

  orioles: 'orioles',
  'baltimore orioles': 'orioles',
  bal: 'orioles',

  // NPB
  fighters: 'fighters',
  'nippon ham fighters': 'fighters',
  'hokkaido nippon ham fighters': 'fighters',
  '日本火腿鬥士': 'fighters',

  'yomiuri giants': 'giantsNpb',
  '讀賣巨人': 'giantsNpb',

  'softbank hawks': 'softbankHawks',
  'fukuoka softbank hawks': 'softbankHawks',
  '福岡軟銀鷹': 'softbankHawks',

  'rakuten eagles': 'rakutenEagles',
  'tohoku rakuten golden eagles': 'rakutenEagles',
  '東北樂天金鷲': 'rakutenEagles',

  'hanshin tigers': 'hanshinTigers',
  '阪神虎': 'hanshinTigers',

  'seibu lions': 'seibuLions',
  'saitama seibu lions': 'seibuLions',
  '西武獅': 'seibuLions',

  // KBO
  'lg twins': 'lgTwins',
  lg: 'lgTwins',

  'kt wiz': 'ktWiz',
  kt: 'ktWiz',

  'doosan bears': 'doosanBears',
  doosan: 'doosanBears',

  'ssg landers': 'ssgLanders',
  ssg: 'ssgLanders',
};

export function resolveTeamMetaKey(args: {
  team?: string;
  league?: string;
  level?: string;
}) {
  const team = normalizeKey(args.team);
  const league = normalizeKey(args.league);
  const level = normalizeKey(args.level);

  if (team in TEAM_ALIAS_TO_META_KEY) {
    const key = TEAM_ALIAS_TO_META_KEY[team];
    if (key) {
      if (key === 'fighters' && (level.includes('二軍') || level.includes('farm'))) {
        return 'fightersFarm' as TeamMetaKey;
      }
      if (key === 'softbankHawks' && (level.includes('二軍') || level.includes('farm'))) {
        return 'softbankHawksFarm' as TeamMetaKey;
      }
      if (key === 'lgTwins' && (level.includes('二軍') || level.includes('farm'))) {
        return 'lgTwinsFarm' as TeamMetaKey;
      }
      return key;
    }
  }

  if (team.includes('fighters') && (level.includes('二軍') || level.includes('farm'))) {
    return 'fightersFarm';
  }
  if (team.includes('hawks') && (level.includes('二軍') || level.includes('farm'))) {
    return 'softbankHawksFarm';
  }
  if ((team.includes('lg twins') || team === 'lg') && (level.includes('二軍') || level.includes('farm'))) {
    return 'lgTwinsFarm';
  }

  if (league.includes('npb') && team.includes('giants')) return 'giantsNpb';
  if (league.includes('mlb') && team.includes('giants')) return 'giants';

  return undefined;
}

export function inferTeamMeta(args: {
  team?: string;
  league?: string;
  level?: string;
}) {
  const key = resolveTeamMetaKey(args);
  return key ? TEAM_META[key] : undefined;
}