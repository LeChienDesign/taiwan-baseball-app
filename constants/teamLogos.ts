import { ImageSourcePropType } from 'react-native';

export type TeamLogoResolveInput = {
  logoKey?: string | null;
  team?: string | null;
  league?: string | null;
  level?: string | null;
  teamCode?: string | null;
};

export type TeamLogoKey =
  // MLB
  | 'angels'
  | 'astros'
  | 'athletics'
  | 'bluejays'
  | 'braves'
  | 'brewers'
  | 'cardinals'
  | 'diamondbacks'
  | 'dodgers'
  | 'giants'
  | 'mariners'
  | 'padres'
  | 'phillies'
  | 'pirates'
  | 'reds'
  | 'redsox'
  | 'tigers'
  // NPB
  | 'fighters'
  | 'hawks'
  | 'lions-npb'
  | 'buffaloes'
  | 'marines-npb'
  | 'eagles-npb'
  | 'giants-npb'
  | 'dragons'
  | 'baystars'
  | 'carp'
  | 'swallows'
  | 'tigers-npb'
  // KBO
  | 'doosan-bears'
  | 'hanwha-eagles'
  | 'kia-tigers'
  | 'kiwoom-heroes'
  | 'kt-wiz'
  | 'lg-twins'
  | 'lotte-giants'
  | 'nc-dinos'
  | 'samsung-lions'
  | 'ssg-landers';

export const TEAM_LOGOS: Record<TeamLogoKey, ImageSourcePropType> = {
  // MLB
  angels: require('../assets/mlbteams/angels.png'),
  astros: require('../assets/mlbteams/astros.png'),
  athletics: require('../assets/mlbteams/athletics.png'),
  bluejays: require('../assets/mlbteams/bluejays.png'),
  braves: require('../assets/mlbteams/braves.png'),
  brewers: require('../assets/mlbteams/brewers.png'),
  cardinals: require('../assets/mlbteams/cardinals.png'),
  diamondbacks: require('../assets/mlbteams/diamondbacks.png'),
  dodgers: require('../assets/mlbteams/dodgers.png'),
  giants: require('../assets/mlbteams/giants.png'),
  mariners: require('../assets/mlbteams/mariners.png'),
  padres: require('../assets/mlbteams/padres.png'),
  phillies: require('../assets/mlbteams/phillies.png'),
  pirates: require('../assets/mlbteams/pirates.png'),
  reds: require('../assets/mlbteams/reds.png'),
  redsox: require('../assets/mlbteams/redsox.png'),
  tigers: require('../assets/mlbteams/tigers.png'),

  // NPB
  fighters: require('../assets/npb/Hokkaido Nippon-H.png'),
  hawks: require('../assets/npb/Fukuoka SoftBank.png'),
  'lions-npb': require('../assets/npb/Saitama Seibu Lio.png'),
  buffaloes: require('../assets/npb/Orix Buffaloes.png'),
  'marines-npb': require('../assets/npb/Lotte Marines.png'),
  'eagles-npb': require('../assets/npb/Tohoku Rakuten Go.png'),
  'giants-npb': require('../assets/npb/Yomiuri Giants.png'),
  dragons: require('../assets/npb/Chunichi Dragons.png'),
  baystars: require('../assets/npb/Yokohama DeNA Bay.png'),
  carp: require('../assets/npb/Hiroshima Toyo Ca.png'),
  swallows: require('../assets/npb/Tokyo Yakult Swal.png'),
  'tigers-npb': require('../assets/npb/Hanshin Tigers.png'),

  // KBO
  'doosan-bears': require('../assets/kbo/Doosan Bears.png'),
  'hanwha-eagles': require('../assets/kbo/Hanwha Eagles.png'),
  'kia-tigers': require('../assets/kbo/KIA Tigers.png'),
  'kiwoom-heroes': require('../assets/kbo/Kiwoom Heroes.png'),
  'kt-wiz': require('../assets/kbo/KT Wiz.png'),
  'lg-twins': require('../assets/kbo/LG Twins.png'),
  'lotte-giants': require('../assets/kbo/Lotte Giants.png'),
  'nc-dinos': require('../assets/kbo/NC Dinos.png'),
  'samsung-lions': require('../assets/kbo/Samsung Lions.png'),
  'ssg-landers': require('../assets/kbo/SSG Landers.png'),
};

function normalize(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[／/]/g, '')
    .replace(/[\s\-_'.]/g, '');
}

const DIRECT_ALIAS: Record<string, TeamLogoKey> = {
  // MLB
  astros: 'astros',
  houstonastros: 'astros',
  hou: 'astros',

  redsox: 'redsox',
  bostonredsox: 'redsox',
  bos: 'redsox',

  tigers: 'tigers',
  detroittigers: 'tigers',
  det: 'tigers',

  diamondbacks: 'diamondbacks',
  arizonadiamondbacks: 'diamondbacks',
  dbacks: 'diamondbacks',
  ari: 'diamondbacks',

  athletics: 'athletics',
  oaklandathletics: 'athletics',
  ath: 'athletics',

  pirates: 'pirates',
  pittsburghpirates: 'pirates',
  pit: 'pirates',

  phillies: 'phillies',
  philadelphiaphillies: 'phillies',
  phi: 'phillies',

  dodgers: 'dodgers',
  losangelesdodgers: 'dodgers',
  lad: 'dodgers',

  giants: 'giants',
  sanfranciscogiants: 'giants',
  sf: 'giants',

  mariners: 'mariners',
  seattlemariners: 'mariners',
  sea: 'mariners',

  brewers: 'brewers',
  milwaukeebrewers: 'brewers',
  mil: 'brewers',

  padres: 'padres',
  sandiegopadres: 'padres',
  sd: 'padres',

  reds: 'reds',
  cincinnatireds: 'reds',
  cin: 'reds',

  angels: 'angels',
  losangelesangels: 'angels',
  laa: 'angels',

  bluejays: 'bluejays',
  torontobluejays: 'bluejays',
  tor: 'bluejays',

  braves: 'braves',
  atlantabraves: 'braves',
  atl: 'braves',

  cardinals: 'cardinals',
  stlouiscardinals: 'cardinals',
  stl: 'cardinals',

  // NPB
  日本火腿: 'fighters',
  北海道日本火腿: 'fighters',
  北海道日本火腿鬥士: 'fighters',
  北海道日本火腿斗士: 'fighters',
  火腿: 'fighters',
  fighters: 'fighters',
  nipponhamfighters: 'fighters',
  hokkaidonipponhamfighters: 'fighters',
  f: 'fighters',

  軟銀: 'hawks',
  软银: 'hawks',
  福岡軟銀鷹: 'hawks',
  福冈软银鹰: 'hawks',
  softbankhawks: 'hawks',
  fukuokasoftbankhawks: 'hawks',
  hawks: 'hawks',
  h: 'hawks',

  西武: 'lions-npb',
  埼玉西武獅: 'lions-npb',
  埼玉西武狮: 'lions-npb',
  seibulions: 'lions-npb',
  saitamaseibulions: 'lions-npb',
  lionsnpb: 'lions-npb',
  l: 'lions-npb',

  歐力士: 'buffaloes',
  欧力士: 'buffaloes',
  歐力士猛牛: 'buffaloes',
  欧力士猛牛: 'buffaloes',
  orixbuffaloes: 'buffaloes',
  buffaloes: 'buffaloes',
  b: 'buffaloes',

  羅德: 'marines-npb',
  罗德: 'marines-npb',
  千葉羅德: 'marines-npb',
  千叶罗德: 'marines-npb',
  lottemarines: 'marines-npb',
  chibalottemarines: 'marines-npb',
  marinesnpb: 'marines-npb',
  m: 'marines-npb',

  樂天: 'eagles-npb',
  乐天: 'eagles-npb',
  東北樂天金鷲: 'eagles-npb',
  东北乐天金鹫: 'eagles-npb',
  rakuteneagles: 'eagles-npb',
  tohokurakutengoldeneagles: 'eagles-npb',
  eaglesnpb: 'eagles-npb',
  e: 'eagles-npb',

  巨人: 'giants-npb',
  讀賣巨人: 'giants-npb',
  读卖巨人: 'giants-npb',
  yomiurigiants: 'giants-npb',
  giantsnpb: 'giants-npb',
  g: 'giants-npb',

  中日: 'dragons',
  中日龍: 'dragons',
  中日龙: 'dragons',
  chunichidragons: 'dragons',
  dragons: 'dragons',
  d: 'dragons',

  橫濱: 'baystars',
  横滨: 'baystars',
  橫濱dena: 'baystars',
  横滨dena: 'baystars',
  baystars: 'baystars',
  yokohamadenabaystars: 'baystars',
  db: 'baystars',

  廣島: 'carp',
  广岛: 'carp',
  廣島東洋鯉魚: 'carp',
  广岛东洋鲤鱼: 'carp',
  hiroshimatoyocarp: 'carp',
  carp: 'carp',
  c: 'carp',

  養樂多: 'swallows',
  养乐多: 'swallows',
  東京養樂多燕子: 'swallows',
  东京养乐多燕子: 'swallows',
  tokyoyakultswallows: 'swallows',
  swallows: 'swallows',
  s: 'swallows',

  阪神: 'tigers-npb',
  阪神虎: 'tigers-npb',
  hanshintigers: 'tigers-npb',
  tigersnpb: 'tigers-npb',
  t: 'tigers-npb',

  // KBO
  hanwhaeagles: 'hanwha-eagles',
  韓華鷹: 'hanwha-eagles',
  韩华鹰: 'hanwha-eagles',
  han: 'hanwha-eagles',

  doosanbears: 'doosan-bears',
  斗山熊: 'doosan-bears',
  doo: 'doosan-bears',

  kiatigers: 'kia-tigers',
  kia虎: 'kia-tigers',
  kia: 'kia-tigers',

  kiwoomheroes: 'kiwoom-heroes',
  培證英雄: 'kiwoom-heroes',
  培证英雄: 'kiwoom-heroes',
  kiw: 'kiwoom-heroes',

  ktwiz: 'kt-wiz',
  kt巫師: 'kt-wiz',
  kt巫师: 'kt-wiz',
  kt: 'kt-wiz',

  lgtwins: 'lg-twins',
  lg雙子: 'lg-twins',
  lg双子: 'lg-twins',
  lg: 'lg-twins',

  lottegiants: 'lotte-giants',
  樂天巨人: 'lotte-giants',
  乐天巨人: 'lotte-giants',
  lot: 'lotte-giants',

  ncdinos: 'nc-dinos',
  nc恐龍: 'nc-dinos',
  nc恐龙: 'nc-dinos',
  nc: 'nc-dinos',

  samsunglions: 'samsung-lions',
  三星獅: 'samsung-lions',
  三星狮: 'samsung-lions',
  sam: 'samsung-lions',

  ssglanders: 'ssg-landers',
  ssg登陸者: 'ssg-landers',
  ssg登陆者: 'ssg-landers',
  ssg: 'ssg-landers',
};

export function resolveTeamLogoKey(input: TeamLogoResolveInput): TeamLogoKey | null {
  const candidates = [input.logoKey, input.teamCode, input.team];

  for (const value of candidates) {
    const hit = DIRECT_ALIAS[normalize(value)];
    if (hit) return hit;
  }

  return null;
}

export function getTeamLogoSource(input: TeamLogoResolveInput): ImageSourcePropType | null {
  const key = resolveTeamLogoKey(input);
  return key ? TEAM_LOGOS[key] : null;
}