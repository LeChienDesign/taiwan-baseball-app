export const TAIWAN_FOCUS_PLAYERS = [
  '鄧愷威',
  '古林睿煬',
  '孫易磊',
  '徐若熙',
  '宋家豪',
  '王彥程',
  '林安可',
  '鄭宗哲',
  '費爾柴德',
  '林昱珉',
  '李灝宇',
  '林家正',
  '陳柏毓',
  '沙子宸',
] as const;

export const JAPAN_MLB_FOCUS_PLAYERS = [
  '大谷翔平',
  '山本由伸',
  '今永昇太',
  '鈴木誠也',
  '菊池雄星',
  '千賀滉大',
  '達比修有',
] as const;

export const HOME_FOCUS_TAGS = {
  taiwan: '台灣焦點',
  japanMlb: '日本旅美焦點',
  cpbl: '中職焦點',
} as const;

export const HOME_PRIORITY_SCORES = {
  taiwanFocus: 100,
  japanMlbFocus: 80,
  cpblMajor: 60,
  international: 50,
  npb: 40,
  kbo: 30,
  default: 10,
} as const;