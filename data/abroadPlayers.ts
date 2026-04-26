export type PlayerStatus = '今日出賽' | '預告先發' | '已完賽' | '傷兵' | '待命';
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
  'type' | 'seasonStats' | 'recentGames' | 'news' | 'career'
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

  // NPB
  fighters: {
    code: 'F',
    abbreviation: 'F',
    logoKey: 'fighters',
    displayName: 'Hokkaido Nippon-Ham Fighters',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  hawks: {
    code: 'H',
    abbreviation: 'H',
    logoKey: 'hawks',
    displayName: 'Fukuoka SoftBank Hawks',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  lionsNpb: {
    code: 'L',
    abbreviation: 'L',
    logoKey: 'lions-npb',
    displayName: 'Saitama Seibu Lions',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  rakutenEagles: {
    code: 'E',
    abbreviation: 'E',
    logoKey: 'eagles-npb',
    displayName: 'Tohoku Rakuten Golden Eagles',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,
  swallows: {
    code: 'S',
    abbreviation: 'S',
    logoKey: 'swallows',
    displayName: 'Tokyo Yakult Swallows',
    leagueGroup: 'NPB',
  } satisfies AbroadTeamMeta,

  // KBO
  hanwhaEagles: {
    code: 'HAN',
    abbreviation: 'HAN',
    logoKey: 'hanwha-eagles',
    displayName: 'Hanwha Eagles',
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

  return undefined;
}

function makePitcher(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'pitcher',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: {
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
    recentGames: [],
    news: [],
    career: [],
  };
}

function makeHitter(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'hitter',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: {
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
    recentGames: [],
    news: [],
    career: [],
  };
}

export const abroadPlayers: AbroadPlayer[] = [
  makePitcher({
    id: 'kai-wei-teng',
    name: '鄧愷威',
    enName: 'Kai-Wei Teng',
    team: 'Astros',
    league: 'MLB',
    level: 'MLB / 40-man',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 27,
    number: '17',
    status: '待命',
    teamColor: '#eb6e1f',
    trending: true,
    line1: '大聯盟右投',
    line2: '2026 轉入 Astros 體系',
    intro: '目前在 Houston Astros 體系的大聯盟右投，是現階段最接近穩定站上 MLB 的台灣投手之一。',
    recentNote: '建議下一步接真實資料後，把近 5 場登板與球隊異動補進來。',
  }),

  makeHitter({
    id: 'tsung-che-cheng',
    name: '鄭宗哲',
    enName: 'Tsung-Che Cheng',
    team: 'Red Sox',
    league: 'MiLB',
    level: '40-man / AAA',
    position: 'IF',
    bats: 'L',
    throws: 'R',
    age: 24,
    number: '39',
    status: '待命',
    teamColor: '#bd3039',
    trending: true,
    line1: '中線內野工具型球員',
    line2: '2026 春季在 Red Sox 體系',
    intro: '具備中線守備、選球與機動性，2026 年春季歷經多隊讓渡後進入 Red Sox 體系。',
    recentNote: '這位很適合做成旅外首頁固定焦點球員。',
  }),

  makePitcher({
    id: 'liu-chih-jung',
    name: '劉致榮',
    enName: 'Chih-Jung Liu',
    team: 'Red Sox',
    league: 'MiLB',
    level: 'AA',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 25,
    number: '—',
    status: '待命',
    teamColor: '#bd3039',
    line1: '紅襪體系火球右投',
    line2: '目前層級 AA',
    intro: '旅美多年、球速條件出色的右投，若控球與角色定位更穩，仍有往上推進空間。',
    recentNote: '後續建議補上中繼 / 先發角色欄位。',
  }),

  makePitcher({
    id: 'chen-po-yu',
    name: '陳柏毓',
    enName: 'Po-Yu Chen',
    team: 'Pirates',
    league: 'MiLB',
    level: 'AAA',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 23,
    number: '—',
    status: '待命',
    teamColor: '#fdb827',
    trending: true,
    line1: '海盜體系先發右投',
    line2: '目前層級 AAA',
    intro: '具備先發養成基礎與國際賽經驗，是台灣旅美投手群裡最常被關注的一位。',
    recentNote: '非常適合補上近 3 場先發數據卡。',
  }),

  makeHitter({
    id: 'hao-yu-lee',
    name: '李灝宇',
    enName: 'Hao-Yu Lee',
    team: 'Tigers',
    league: 'MiLB',
    level: 'AAA',
    position: 'INF',
    bats: 'R',
    throws: 'R',
    age: 22,
    number: '—',
    status: '待命',
    teamColor: '#0c2340',
    trending: true,
    line1: '老虎體系重點內野手',
    line2: '目前層級 AAA',
    intro: '近年最受期待的台灣旅美野手之一，打擊潛力與升上 MLB 的機會都很高。',
    recentNote: '建議個人頁把他設成固定焦點卡之一。',
  }),

  makePitcher({
    id: 'chen-zhong-ao-zhuang',
    name: '莊陳仲敖',
    enName: 'Chen-Zhong-Ao Zhuang',
    team: 'Athletics',
    league: 'MiLB',
    level: 'AA',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 24,
    number: '—',
    status: '待命',
    teamColor: '#003831',
    line1: '運動家體系右投',
    line2: '目前層級 AA',
    intro: '目前在 Athletics 體系持續發展的右投，具備旅外投手群深度代表性。',
    recentNote: '後面建議接上國家隊與農場雙軌資料。',
  }),

  makePitcher({
    id: 'yu-min-lin',
    name: '林昱珉',
    enName: 'Yu-Min Lin',
    team: 'Diamondbacks',
    league: 'MiLB',
    level: 'AAA',
    position: 'LHP',
    bats: 'L',
    throws: 'L',
    age: 22,
    number: '—',
    status: '待命',
    teamColor: '#a71930',
    trending: true,
    line1: '響尾蛇體系左投',
    line2: '目前層級 AAA',
    intro: '台灣最受矚目的旅美左投之一，具備輪值潛力與國際賽話題性。',
    recentNote: '個人頁可優先補齊近 5 場先發摘要。',
  }),

  makePitcher({
    id: 'chang-hung-ling',
    name: '張弘稜',
    enName: 'Hung-Ling Chang',
    team: 'Pirates',
    league: 'MiLB',
    level: 'High-A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 23,
    number: '—',
    status: '待命',
    teamColor: '#fdb827',
    line1: '海盜體系右投',
    line2: '目前層級 High-A',
    intro: '仍在海盜農場累積局數與穩定度的台灣投手。',
    recentNote: '後續可依真實資料補上受傷 / 復出等標籤。',
  }),

  makePitcher({
    id: 'li-chen-hsun',
    name: '李晨薰',
    enName: 'Chen-Hsun Lee',
    team: 'Giants',
    league: 'MiLB',
    level: 'Rookie',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 23,
    number: '—',
    status: '待命',
    teamColor: '#fd5a1e',
    line1: '巨人體系右投',
    line2: '目前層級 Rookie',
    intro: '曾受期待的旅美右投，現階段更需要健康與實戰累積。',
    recentNote: '個人頁建議把傷兵 / 復健標籤系統準備好。',
  }),

  makePitcher({
    id: 'pan-wen-hui',
    name: '潘文輝',
    enName: 'Wen-Hui Pan',
    team: 'Phillies',
    league: 'MiLB',
    level: 'High-A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 23,
    number: '—',
    status: '待命',
    teamColor: '#e81828',
    line1: '費城人體系後援型右投',
    line2: '目前層級 High-A',
    intro: '速球條件突出的旅美右投，若控球穩定度提升，上升速度有機會更快。',
    recentNote: '適合在個人頁加上球速 / 三振型標籤。',
  }),

  makePitcher({
    id: 'sha-tzu-chen',
    name: '沙子宸',
    enName: 'Tzu-Chen Sha',
    team: 'Athletics',
    league: 'MiLB',
    level: 'High-A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 22,
    number: '—',
    status: '待命',
    teamColor: '#003831',
    line1: '運動家體系右投',
    line2: '目前層級 High-A',
    intro: '旅美新生代投手之一，近年在國際賽與農場都持續被追蹤。',
    recentNote: '建議之後補上國際賽經歷。',
  }),

  makePitcher({
    id: 'lin-sheng-en',
    name: '林盛恩',
    enName: 'Sheng-En Lin',
    team: 'Reds',
    league: 'MiLB',
    level: 'A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 19,
    number: '—',
    status: '待命',
    teamColor: '#c6011f',
    line1: '紅人體系年輕右投',
    line2: '目前層級 A',
    intro: '還在農場前段養成中的年輕右投，屬於中長期追蹤型球員。',
    recentNote: '首頁不一定要先放，但列表頁建議保留。',
  }),

  makePitcher({
    id: 'lin-chen-wei',
    name: '林振瑋',
    enName: 'Chen-Wei Lin',
    team: 'Cardinals',
    league: 'MiLB',
    level: 'AA',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 24,
    number: '—',
    status: '待命',
    teamColor: '#c41e3a',
    trending: true,
    line1: '紅雀體系高身材速球右投',
    line2: '目前層級 AA',
    intro: '以高大身材與火球著稱，是台灣旅美投手裡辨識度很高的一位。',
    recentNote: '很適合做個人頁趨勢卡與球探標籤。',
  }),

  makePitcher({
    id: 'wei-en-lin',
    name: '林維恩',
    enName: 'Wei-En Lin',
    team: 'Athletics',
    league: 'MiLB',
    level: 'AA',
    position: 'LHP',
    bats: 'L',
    throws: 'L',
    age: 19,
    number: '—',
    status: '待命',
    teamColor: '#003831',
    trending: true,
    line1: '運動家體系左投',
    line2: '目前層級 AA',
    intro: '新生代最受期待的旅美左投之一，層級與話題性都上升很快。',
    recentNote: '建議放進首頁「我追蹤的旅外」優先顯示清單。',
  }),

  makeHitter({
    id: 'ko-ching-hsien',
    name: '柯敬賢',
    enName: 'Ching-Hsien Ko',
    team: 'Dodgers',
    league: 'MiLB',
    level: 'A',
    position: 'OF',
    bats: 'L',
    throws: 'L',
    age: 18,
    number: '—',
    status: '待命',
    teamColor: '#005a9c',
    line1: '道奇體系外野手',
    line2: '目前層級 A',
    intro: '台灣近年最受矚目的年輕旅美外野手之一，屬長線高潛力觀察名單。',
    recentNote: '很適合先在列表頁保留，之後再慢慢補完整個人頁內容。',
  }),

  makePitcher({
    id: 'shen-chia-hsi',
    name: '沈家羲',
    enName: 'Chia-Hsi Shen',
    team: 'Mariners',
    league: 'MiLB',
    level: 'A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 21,
    number: '—',
    status: '待命',
    teamColor: '#0c2c56',
    line1: '水手體系右投',
    line2: '目前層級 A',
    intro: '目前在 Mariners 農場體系發展中的台灣投手。',
    recentNote: '後續可補農場層級升降資訊。',
  }),

  makePitcher({
    id: 'yang-nien-hsi',
    name: '陽念希',
    enName: 'Nien-Hsi Yang',
    team: 'Giants',
    league: 'MiLB',
    level: 'Rookie',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 19,
    number: '—',
    status: '待命',
    teamColor: '#fd5a1e',
    line1: '巨人體系年輕右投',
    line2: '目前層級 Rookie',
    intro: '旅美生涯仍在起步階段，屬於偏長線養成型球員。',
    recentNote: '先保留名冊卡，等真實資料再逐步補強。',
  }),

  makePitcher({
    id: 'huang-chung-hsiang',
    name: '黃仲翔',
    enName: 'Chung-Hsiang Huang',
    team: 'Diamondbacks',
    league: 'MiLB',
    level: 'A',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 20,
    number: '—',
    status: '待命',
    teamColor: '#a71930',
    line1: '響尾蛇體系右投',
    line2: '目前層級 A',
    intro: '目前在 D-backs 農場體系養成中的台灣投手。',
    recentNote: '可作為列表頁補齊完整度使用。',
  }),

  makePitcher({
    id: 'lin-po-jun',
    name: '林鉑濬',
    enName: 'Po-Jun Lin',
    team: 'Mariners',
    league: 'MiLB',
    level: 'Rookie',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 19,
    number: '—',
    status: '待命',
    teamColor: '#0c2c56',
    line1: '水手體系年輕右投',
    line2: '目前層級 Rookie',
    intro: '近年加入旅美體系的新生代投手之一。',
    recentNote: '這類球員可先以簡版資料顯示。',
  }),

  makePitcher({
    id: 'lin-chang-tzu-chun',
    name: '林張子俊',
    enName: 'Tzu-Chun Lin-Chang',
    team: 'Brewers',
    league: 'MiLB',
    level: 'Rookie',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 20,
    number: '—',
    status: '待命',
    teamColor: '#12284b',
    line1: '釀酒人體系右投',
    line2: '目前層級 Rookie',
    intro: '屬於旅美農場前段的台灣投手名單之一。',
    recentNote: '後續可加上簽約年份與養成階段標籤。',
  }),

  makeHitter({
    id: 'liao-you-lin',
    name: '廖宥霖',
    enName: 'You-Lin Liao',
    team: 'Brewers',
    league: 'MiLB',
    level: 'Rookie',
    position: 'INF',
    bats: 'R',
    throws: 'R',
    age: 18,
    number: '—',
    status: '待命',
    teamColor: '#12284b',
    line1: '釀酒人體系內野手',
    line2: '目前層級 Rookie',
    intro: '目前仍屬養成初期的台灣旅美野手。',
    recentNote: '可先當完整名冊的一員，未來再補實戰資料。',
  }),

  makePitcher({
    id: 'su-lan-hung',
    name: '蘇嵐鴻',
    enName: 'Lan-Hung Su',
    team: 'Padres',
    league: 'MiLB',
    level: 'Rookie',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 18,
    number: '—',
    status: '待命',
    teamColor: '#2f241d',
    line1: '教士體系年輕右投',
    line2: '目前層級 Rookie',
    intro: '剛進旅美體系不久，屬於需要時間養成的年輕投手。',
    recentNote: '適合暫時用簡版個人頁。',
  }),

  makePitcher({
    id: 'ruei-yang-gu-lin',
    name: '古林睿煬',
    enName: 'Ruei-Yang Gu Lin',
    team: '日本火腿',
    league: 'NPB',
    level: '一軍 / 支配下',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 25,
    number: '11',
    status: '待命',
    teamColor: '#0066b3',
    teamMeta: TEAM_META.fighters,
    trending: true,
    line1: '旅日先發右投',
    line2: '目前在日本火腿體系',
    intro: '旅日後話題與期待值都很高，是現階段最受關注的台灣旅日投手之一。',
    recentNote: '建議優先補完整個人頁與新聞異動頁。',
  }),

  makePitcher({
    id: 'yi-lei-sun',
    name: '孫易磊',
    enName: 'Yi-Lei Sun',
    team: '日本火腿',
    league: 'NPB',
    level: '育成 / 一軍體系',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 20,
    number: '96',
    status: '待命',
    teamColor: '#0066b3',
    teamMeta: TEAM_META.fighters,
    line1: '旅日年輕火球右投',
    line2: '目前在日本火腿體系',
    intro: '旅日年輕投手代表之一，具備高天花板與發展性。',
    recentNote: '個人頁可強調年齡、球速、養成進度。',
  }),

  makePitcher({
    id: 'chun-wei-chang',
    name: '張峻瑋',
    enName: 'Chun-Wei Chang',
    team: '軟銀',
    league: 'NPB',
    level: '育成',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 20,
    number: '—',
    status: '待命',
    teamColor: '#f7c600',
    teamMeta: TEAM_META.hawks,
    line1: '旅日育成年輕右投',
    line2: '目前在軟銀體系',
    intro: '近年被看好的台灣旅日年輕火球右投之一。',
    recentNote: '非常適合加上「育成」「火球型」標籤。',
  }),

  makeHitter({
    id: 'an-ko-lin',
    name: '林安可',
    enName: 'An-Ko Lin',
    team: '西武',
    league: 'NPB',
    level: '一軍',
    position: 'OF',
    bats: 'R',
    throws: 'R',
    age: 29,
    number: '77',
    status: '待命',
    teamColor: '#00469c',
    teamMeta: TEAM_META.lionsNpb,
    line1: '旅日外野手',
    line2: '目前在西武體系',
    intro: '具備長打與國際賽知名度，是台灣旅日野手的重要代表。',
    recentNote: '很適合放進旅外新聞總覽頁。',
  }),

  makePitcher({
    id: 'yen-cheng-wang',
    name: '王彥程',
    enName: 'Yen-Cheng Wang',
    team: 'Hanwha Eagles',
    league: 'KBO',
    level: '一軍 / 先發輪值',
    position: 'LHP',
    bats: 'L',
    throws: 'L',
    age: 25,
    number: '19',
    status: '待命',
    teamColor: '#ff6600',
    teamMeta: TEAM_META.hanwhaEagles,
    trending: true,
    line1: '旅韓左投',
    line2: '韓華鷹先發輪值',
    intro: '目前效力 Hanwha Eagles，是台灣旅韓代表左投之一。',
    recentNote: '建議接 KBO 真實先發紀錄、近 5 場內容與球種數據。',
  }),

  makePitcher({
    id: 'jo-hsi-hsu',
    name: '徐若熙',
    enName: 'Jo-Hsi Hsu',
    team: 'Fukuoka SoftBank Hawks',
    league: 'NPB',
    level: '一軍 / 先發輪值',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 25,
    number: '18',
    status: '待命',
    teamColor: '#f7c600',
    teamMeta: TEAM_META.hawks,
    trending: true,
    line1: '旅日先發右投',
    line2: '軟銀一軍',
    intro: '目前效力福岡軟銀鷹，是台灣最受矚目的旅日先發投手之一。',
    recentNote: '建議優先同步先發輪值、近 5 場與球速變化。',
  }),

  makePitcher({
    id: 'chia-hao-sung',
    name: '宋家豪',
    enName: 'Chia-Hao Sung',
    team: 'Tohoku Rakuten Golden Eagles',
    league: 'NPB',
    level: '一軍 / 牛棚',
    position: 'RHP',
    bats: 'L',
    throws: 'R',
    age: 33,
    number: '43',
    status: '待命',
    teamColor: '#7a0019',
    teamMeta: TEAM_META.rakutenEagles,
    trending: true,
    line1: '旅日後援右投',
    line2: '樂天金鷲牛棚',
    intro: '長年效力東北樂天金鷲，是旅日資歷最完整的台灣投手之一。',
    recentNote: '建議同步中繼、防禦率、近 10 場牛棚內容。',
  }),

  makeHitter({
    id: 'chia-cheng-lin',
    name: '林家正',
    enName: 'Chia-Cheng Lin',
    team: 'Hokkaido Nippon-Ham Fighters',
    league: 'NPB',
    level: '支配下 / 捕手',
    position: 'C',
    bats: 'R',
    throws: 'R',
    age: 28,
    number: '38',
    status: '待命',
    teamColor: '#0066b3',
    teamMeta: TEAM_META.fighters,
    trending: true,
    line1: '旅日捕手',
    line2: '日本火腿支配下',
    intro: '2026 年轉戰北海道日本火腿鬥士並登錄正式球員，有望與台灣投手形成旅日台灣投捕搭檔。',
    recentNote: '建議同步一軍 / 二軍出賽與先發捕手紀錄。',
  }),

  makePitcher({
    id: 'hsiang-sheng-hsu',
    name: '徐翔聖',
    enName: 'Hsiang-Sheng Hsu',
    team: 'Tokyo Yakult Swallows',
    league: 'NPB',
    level: '二軍 / 育成',
    position: 'RHP',
    bats: 'R',
    throws: 'R',
    age: 20,
    number: '017',
    status: '待命',
    teamColor: '#00a7e0',
    teamMeta: TEAM_META.swallows,
    line1: '旅日年輕右投',
    line2: '養樂多二軍',
    intro: '目前效力東京養樂多燕子，2026 年主要在二軍累積出賽與養成。',
    recentNote: '建議同步二軍登板、局數、三振與支配下進度。',
  }),
];