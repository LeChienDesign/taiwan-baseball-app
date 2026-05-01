export type AbroadProvider = 'mlb' | 'npb' | 'kbo';

export type AbroadRegistryEntry = {
  id: string;
  name: string;
  enName: string;
  provider: AbroadProvider;
  league: 'MLB' | 'MiLB' | 'NPB' | 'KBO';
  officialTeam: string;
  officialTeamCode?: string;

  officialOrgUrl: string;
  officialRosterUrl?: string;
  officialPlayerUrl?: string;
  officialStatsUrl?: string;
  officialGameLogUrl?: string;
  officialNewsUrl?: string;

  officialSearchUrl?: string;
  officialSearchQuery?: string;
  personId?: number;

  teamLogoKey?: string;
  newsKeywords: string[];
  notes?: string;
};

function slugifyName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/\s+/g, '-');
}

function mlbSearchUrl(query: string) {
  return `https://www.mlb.com/search?q=${encodeURIComponent(query)}`;
}

function googleNewsUrl(query: string) {
  return `https://www.google.com/search?tbm=nws&q=${encodeURIComponent(query)}`;
}

function mlbPlayerUrl(enName: string, personId: number) {
  return `https://www.mlb.com/player/${slugifyName(enName)}-${personId}`;
}

function mlbEntry(input: {
  id: string;
  name: string;
  enName: string;
  league?: 'MLB' | 'MiLB';
  officialTeam: string;
  officialTeamCode: string;
  officialOrgUrl: string;
  personId?: number;
  teamLogoKey?: string;
  notes?: string;
}) {
  const officialPlayerUrl =
    typeof input.personId === 'number' ? mlbPlayerUrl(input.enName, input.personId) : undefined;

  return {
    id: input.id,
    name: input.name,
    enName: input.enName,
    provider: 'mlb' as const,
    league: input.league ?? 'MiLB',
    officialTeam: input.officialTeam,
    officialTeamCode: input.officialTeamCode,
    officialOrgUrl: input.officialOrgUrl,
    officialRosterUrl: input.officialOrgUrl,
    officialPlayerUrl,
    officialStatsUrl: officialPlayerUrl,
    officialGameLogUrl: officialPlayerUrl,
    officialNewsUrl: officialPlayerUrl,
    officialSearchUrl: mlbSearchUrl(input.enName),
    officialSearchQuery: `${input.enName} site:mlb.com`,
    personId: input.personId,
    teamLogoKey: input.teamLogoKey,
    newsKeywords: [input.name, input.enName, input.officialTeam],
    notes: input.notes,
  } satisfies AbroadRegistryEntry;
}

function npbEntry(input: {
  id: string;
  name: string;
  enName: string;
  officialTeam: string;
  officialTeamCode: string;
  officialOrgUrl: string;
  officialRosterUrl: string;
  teamLogoKey?: string;
  notes?: string;
  extraNewsKeywords?: string[];
}) {
  const keywords = [
    input.name,
    input.enName,
    input.officialTeam,
    ...(input.extraNewsKeywords ?? []),
  ];

  return {
    id: input.id,
    name: input.name,
    enName: input.enName,
    provider: 'npb' as const,
    league: 'NPB' as const,
    officialTeam: input.officialTeam,
    officialTeamCode: input.officialTeamCode,
    officialOrgUrl: input.officialOrgUrl,
    officialRosterUrl: input.officialRosterUrl,
    officialPlayerUrl: input.officialRosterUrl,
    officialStatsUrl: input.officialRosterUrl,
    officialGameLogUrl: input.officialRosterUrl,
    officialNewsUrl: input.officialOrgUrl,
    officialSearchUrl: googleNewsUrl(`${input.name} ${input.officialTeam}`),
    officialSearchQuery: `${input.name} ${input.officialTeam}`,
    teamLogoKey: input.teamLogoKey,
    newsKeywords: keywords,
    notes: input.notes,
  } satisfies AbroadRegistryEntry;
}

function kboEntry(input: {
  id: string;
  name: string;
  enName: string;
  officialTeam: string;
  officialTeamCode: string;
  officialOrgUrl: string;
  officialPlayerUrl: string;
  teamLogoKey?: string;
  notes?: string;
  extraNewsKeywords?: string[];
}) {
  const keywords = [
    input.name,
    input.enName,
    input.officialTeam,
    ...(input.extraNewsKeywords ?? []),
  ];

  return {
    id: input.id,
    name: input.name,
    enName: input.enName,
    provider: 'kbo' as const,
    league: 'KBO' as const,
    officialTeam: input.officialTeam,
    officialTeamCode: input.officialTeamCode,
    officialOrgUrl: input.officialOrgUrl,
    officialRosterUrl: input.officialPlayerUrl,
    officialPlayerUrl: input.officialPlayerUrl,
    officialStatsUrl: input.officialPlayerUrl,
    officialGameLogUrl: input.officialPlayerUrl,
    officialNewsUrl: input.officialOrgUrl,
    officialSearchUrl: googleNewsUrl(`${input.name} ${input.officialTeam}`),
    officialSearchQuery: `${input.name} ${input.officialTeam}`,
    teamLogoKey: input.teamLogoKey,
    newsKeywords: keywords,
    notes: input.notes,
  } satisfies AbroadRegistryEntry;
}

export const abroadRegistry = {
  // MLB / MiLB
  'kai-wei-teng': mlbEntry({
    id: 'kai-wei-teng',
    name: '鄧愷威',
    enName: 'Kai-Wei Teng',
    league: 'MLB',
    officialTeam: 'Houston Astros',
    officialTeamCode: 'HOU',
    officialOrgUrl: 'https://www.mlb.com/astros',
    personId: 678906,
    teamLogoKey: 'astros',
  }),

  'tsung-che-cheng': mlbEntry({
    id: 'tsung-che-cheng',
    name: '鄭宗哲',
    enName: 'Tsung-Che Cheng',
    league: 'MiLB',
    officialTeam: 'Boston Red Sox',
    officialTeamCode: 'BOS',
    officialOrgUrl: 'https://www.mlb.com/redsox',
    personId: 691907,
    teamLogoKey: 'redsox',
    notes: '2026 currently tied to Red Sox official pipeline / transaction flow.',
  }),

  'liu-chih-jung': mlbEntry({
    id: 'liu-chih-jung',
    name: '劉致榮',
    enName: 'Chih-Jung Liu',
    officialTeam: 'Boston Red Sox',
    officialTeamCode: 'BOS',
    officialOrgUrl: 'https://www.mlb.com/redsox',
    personId: 692617,
    teamLogoKey: 'redsox',
  }),

  'chen-po-yu': mlbEntry({
    id: 'chen-po-yu',
    name: '陳柏毓',
    enName: 'Po-Yu Chen',
    officialTeam: 'Pittsburgh Pirates',
    officialTeamCode: 'PIT',
    officialOrgUrl: 'https://www.mlb.com/pirates',
    personId: 696040,
    teamLogoKey: 'pirates',
  }),

  'hao-yu-lee': mlbEntry({
    id: 'hao-yu-lee',
    name: '李灝宇',
    enName: 'Hao-Yu Lee',
    officialTeam: 'Detroit Tigers',
    officialTeamCode: 'DET',
    officialOrgUrl: 'https://www.mlb.com/tigers',
    personId: 701678,
    teamLogoKey: 'tigers',
  }),

  'chen-zhong-ao-zhuang': mlbEntry({
  id: 'chen-zhong-ao-zhuang',
  name: '莊陳仲敖',
  enName: 'Chen-Zhong-Ao Zhuang',
  officialTeam: 'Athletics',
  officialTeamCode: 'ATH',
  officialOrgUrl: 'https://www.mlb.com/athletics',
  personId: 800018,
  teamLogoKey: 'athletics',
}),

  'yu-min-lin': mlbEntry({
    id: 'yu-min-lin',
    name: '林昱珉',
    enName: 'Yu-Min Lin',
    officialTeam: 'Arizona Diamondbacks',
    officialTeamCode: 'ARI',
    officialOrgUrl: 'https://www.mlb.com/dbacks',
    personId: 801179,
    teamLogoKey: 'diamondbacks',
  }),

  'chang-hung-ling': mlbEntry({
  id: 'chang-hung-ling',
  name: '張弘稜',
  enName: 'Hung-Ling Chang',
  officialTeam: 'Pittsburgh Pirates',
  officialTeamCode: 'PIT',
  officialOrgUrl: 'https://www.mlb.com/pirates',
  personId: 800213,
  teamLogoKey: 'pirates',
  notes: 'MLB official page currently uses Hung-Leng Chang as display spelling.',
}),

  'li-chen-hsun': mlbEntry({
  id: 'li-chen-hsun',
  name: '李晨薰',
  enName: 'Chen-Hsun Lee',
  officialTeam: 'San Francisco Giants',
  officialTeamCode: 'SF',
  officialOrgUrl: 'https://www.mlb.com/giants',
  personId: 808486,
  teamLogoKey: 'giants',
}),

  'pan-wen-hui': mlbEntry({
    id: 'pan-wen-hui',
    name: '潘文輝',
    enName: 'Wen-Hui Pan',
    officialTeam: 'Philadelphia Phillies',
    officialTeamCode: 'PHI',
    officialOrgUrl: 'https://www.mlb.com/phillies',
    personId: 808207,
    teamLogoKey: 'phillies',
  }),

  'sha-tzu-chen': mlbEntry({
    id: 'sha-tzu-chen',
    name: '沙子宸',
    enName: 'Tzu-Chen Sha',
    officialTeam: 'Athletics',
    officialTeamCode: 'ATH',
    officialOrgUrl: 'https://www.mlb.com/athletics',
    personId: 809223,
    teamLogoKey: 'athletics',
  }),

  'lin-sheng-en': mlbEntry({
    id: 'lin-sheng-en',
    name: '林盛恩',
    enName: 'Sheng-En Lin',
    officialTeam: 'Cincinnati Reds',
    officialTeamCode: 'CIN',
    officialOrgUrl: 'https://www.mlb.com/reds',
    personId: 806823,
    teamLogoKey: 'reds',
  }),

  'lin-chen-wei': mlbEntry({
    id: 'lin-chen-wei',
    name: '林振瑋',
    enName: 'Chen-Wei Lin',
    officialTeam: 'St. Louis Cardinals',
    officialTeamCode: 'STL',
    officialOrgUrl: 'https://www.mlb.com/cardinals',
    personId: 813820,
    teamLogoKey: 'cardinals',
  }),

  'wei-en-lin': mlbEntry({
    id: 'wei-en-lin',
    name: '林維恩',
    enName: 'Wei-En Lin',
    officialTeam: 'Athletics',
    officialTeamCode: 'ATH',
    officialOrgUrl: 'https://www.mlb.com/athletics',
    personId: 827734,
    teamLogoKey: 'athletics',
  }),

  'ko-ching-hsien': mlbEntry({
    id: 'ko-ching-hsien',
    name: '柯敬賢',
    enName: 'Ching-Hsien Ko',
    officialTeam: 'Los Angeles Dodgers',
    officialTeamCode: 'LAD',
    officialOrgUrl: 'https://www.mlb.com/dodgers',
    personId: 828667,
    teamLogoKey: 'dodgers',
  }),

  'shen-chia-hsi': mlbEntry({
  id: 'shen-chia-hsi',
  name: '沈家羲',
  enName: 'Chia-Hsi Shen',
  officialTeam: 'Seattle Mariners',
  officialTeamCode: 'SEA',
  officialOrgUrl: 'https://www.mlb.com/mariners',
  personId: 828430,
  teamLogoKey: 'mariners',
}),

  'yang-nien-hsi': mlbEntry({
    id: 'yang-nien-hsi',
    name: '陽念希',
    enName: 'Nien-Hsi Yang',
    officialTeam: 'San Francisco Giants',
    officialTeamCode: 'SF',
    officialOrgUrl: 'https://www.mlb.com/giants',
    personId: 806825,
    teamLogoKey: 'giants',
  }),

  'huang-chung-hsiang': mlbEntry({
    id: 'huang-chung-hsiang',
    name: '黃仲翔',
    enName: 'Chung-Hsiang Huang',
    officialTeam: 'Arizona Diamondbacks',
    officialTeamCode: 'ARI',
    officialOrgUrl: 'https://www.mlb.com/dbacks',
    personId: 829473,
    teamLogoKey: 'diamondbacks',
  }),

  'lin-po-jun': mlbEntry({
  id: 'lin-po-jun',
  name: '林鉑濬',
  enName: 'Po-Jun Lin',
  officialTeam: 'Seattle Mariners',
  officialTeamCode: 'SEA',
  officialOrgUrl: 'https://www.mlb.com/mariners',
  personId: 806836,
  teamLogoKey: 'mariners',
  notes: 'MLB official page currently appears under Po-Chun Lin; confirm this matches 林鉑濬.',
}),

  'lin-chang-tzu-chun': mlbEntry({
    id: 'lin-chang-tzu-chun',
    name: '林張子俊',
    enName: 'Chang Tzu-Chun Lin',
    officialTeam: 'Milwaukee Brewers',
    officialTeamCode: 'MIL',
    officialOrgUrl: 'https://www.mlb.com/brewers',
    personId: 835646,
    teamLogoKey: 'brewers',
  }),

  'liao-you-lin': mlbEntry({
  id: 'liao-you-lin',
  name: '廖宥霖',
  enName: 'You-Lin Liao',
  officialTeam: 'Milwaukee Brewers',
  officialTeamCode: 'MIL',
  officialOrgUrl: 'https://www.mlb.com/brewers',
  personId: 835879,
  teamLogoKey: 'brewers',
}),

  'su-lan-hung': mlbEntry({
  id: 'su-lan-hung',
  name: '蘇嵐鴻',
  enName: 'Lan-Hung Su',
  officialTeam: 'San Diego Padres',
  officialTeamCode: 'SD',
  officialOrgUrl: 'https://www.mlb.com/padres',
  personId: 837088,
  teamLogoKey: 'padres',
}),

  // NPB
  'ruei-yang-gu-lin': npbEntry({
    id: 'ruei-yang-gu-lin',
    name: '古林睿煬',
    enName: 'Ruei-Yang Gu Lin',
    officialTeam: 'Hokkaido Nippon-Ham Fighters',
    officialTeamCode: 'F',
    officialOrgUrl: 'https://www.fighters.co.jp/',
    officialRosterUrl: 'https://media.fighters.co.jp/player/37/',
    teamLogoKey: 'fighters',
    extraNewsKeywords: ['古林睿煬 日本火腿', '古林睿煬 北海道日本火腿鬥士'],
  }),

  'yi-lei-sun': npbEntry({
    id: 'yi-lei-sun',
    name: '孫易磊',
    enName: 'Yi-Lei Sun',
    officialTeam: 'Hokkaido Nippon-Ham Fighters',
    officialTeamCode: 'F',
    officialOrgUrl: 'https://www.fighters.co.jp/',
    officialRosterUrl: 'https://media.fighters.co.jp/player/96/',
    teamLogoKey: 'fighters',
    extraNewsKeywords: ['孫易磊 日本火腿', '孫易磊 北海道日本火腿鬥士'],
  }),

  'chun-wei-chang': npbEntry({
    id: 'chun-wei-chang',
    name: '張峻瑋',
    enName: 'Chun-Wei Chang',
    officialTeam: 'Fukuoka SoftBank Hawks',
    officialTeamCode: 'H',
    officialOrgUrl: 'https://www.softbankhawks.co.jp/',
    officialRosterUrl: 'https://www.softbankhawks.co.jp/global/traditional-c/2026_153/',
    teamLogoKey: 'hawks',
    extraNewsKeywords: ['張峻瑋 軟銀', '張峻瑋 福岡軟銀鷹'],
  }),

  'an-ko-lin': npbEntry({
    id: 'an-ko-lin',
    name: '林安可',
    enName: 'An-Ko Lin',
    officialTeam: 'Saitama Seibu Lions',
    officialTeamCode: 'L',
    officialOrgUrl: 'https://www.seibulions.jp/',
    officialRosterUrl: 'https://players.seibulions.jp/player/1098',
    teamLogoKey: 'lions-npb',
    extraNewsKeywords: ['林安可 西武', '林安可 埼玉西武獅'],
  }),

  'jo-hsi-hsu': npbEntry({
    id: 'jo-hsi-hsu',
    name: '徐若熙',
    enName: 'Jo-Hsi Hsu',
    officialTeam: 'Fukuoka SoftBank Hawks',
    officialTeamCode: 'H',
    officialOrgUrl: 'https://www.softbankhawks.co.jp/',
    officialRosterUrl: 'https://www.softbankhawks.co.jp/team/player/detail/2026_00001589.html',
    teamLogoKey: 'hawks',
    extraNewsKeywords: ['徐若熙 軟銀', '徐若熙 福岡軟銀鷹', 'Hsu Jo-Hsi SoftBank Hawks'],
  }),

  'chia-hao-sung': npbEntry({
    id: 'chia-hao-sung',
    name: '宋家豪',
    enName: 'Chia-Hao Sung',
    officialTeam: 'Tohoku Rakuten Golden Eagles',
    officialTeamCode: 'E',
    officialOrgUrl: 'https://www.rakuteneagles.jp/',
    officialRosterUrl: 'https://www.rakuteneagles.jp/team/player/detail/2026_00001013.html',
    teamLogoKey: 'eagles-npb',
    extraNewsKeywords: ['宋家豪 樂天金鷲', '宋家豪 東北樂天', 'Sung Chia-Hao Rakuten Eagles'],
  }),

  'chia-cheng-lin': npbEntry({
    id: 'chia-cheng-lin',
    name: '林家正',
    enName: 'Chia-Cheng Lin',
    officialTeam: 'Hokkaido Nippon-Ham Fighters',
    officialTeamCode: 'F',
    officialOrgUrl: 'https://www.fighters.co.jp/',
    officialRosterUrl: 'https://media.fighters.co.jp/player/38/',
    teamLogoKey: 'fighters',
    extraNewsKeywords: ['林家正 日本火腿', '林家正 北海道日本火腿鬥士', 'Lyle Lin Fighters'],
    notes: 'Japanese club page currently lists him under the registered name ライル・リン.',
  }),

  'hsiang-sheng-hsu': npbEntry({
    id: 'hsiang-sheng-hsu',
    name: '徐翔聖',
    enName: 'Hsiang-Sheng Hsu',
    officialTeam: 'Tokyo Yakult Swallows',
    officialTeamCode: 'S',
    officialOrgUrl: 'https://www.yakult-swallows.co.jp/',
    officialRosterUrl: 'https://npb.jp/bis/players/53255159.html',
    teamLogoKey: 'swallows',
    extraNewsKeywords: ['徐翔聖 養樂多', '徐翔聖 東京養樂多燕子', '翔聖 ヤクルト'],
    notes:
      'Uses NPB official player page fallback; 2026 development registration confirms No.017 and Tokyo Yakult Swallows.',
  }),

  // KBO
  'yen-cheng-wang': kboEntry({
    id: 'yen-cheng-wang',
    name: '王彥程',
    enName: 'Yen-Cheng Wang',
    officialTeam: 'Hanwha Eagles',
    officialTeamCode: 'HAN',
    officialOrgUrl: 'https://eng.koreabaseball.com/',
    officialPlayerUrl:
      'https://eng.koreabaseball.com/Teams/PlayerInfoPitcher/Summary.aspx?pcode=56719',
    teamLogoKey: 'hanwha-eagles',
    extraNewsKeywords: ['王彥程 韓華鷹', 'Yen-Cheng Wang Hanwha Eagles'],
  }),
} satisfies Record<string, AbroadRegistryEntry>;

export const abroadRegistryList = Object.values(abroadRegistry);

export function getAbroadRegistry(id: string) {
  return abroadRegistry[id];
}