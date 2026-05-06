import fs from 'fs';
import path from 'path';

type CpblSeedGame = {
  idEvent?: string;
  strTimestamp?: string;
  Round?: string;
  'Home Team'?: string;
  'Home Score'?: string;
  'Away Team'?: string;
  'Away Score'?: string;
  Venue?: string;
  DisplayTime?: string;
  Status?: string;
  'Away Inning Line'?: string;
  'Home Inning Line'?: string;
  'Away Hits'?: string;
  'Home Hits'?: string;
  'Away Errors'?: string;
  'Home Errors'?: string;
  gameSno?: string;
  kindCode?: string;
  year?: string;
  officialLiveUrl?: string;
};

export type CpblEventsCenterGame = {
  id: string;
  league: 'CPBL';
  gameDate: string;
  status: 'LIVE' | 'FINAL' | 'SCHEDULED';
  statusText: string;
  awayTeam: {
    name: string;
    short: string;
    logoKey: string;
  };
  homeTeam: {
    name: string;
    short: string;
    logoKey: string;
  };
  awayScore: number;
  homeScore: number;
  awayLine: {
    team: string;
    innings: string[];
    r: number;
    h: number;
    e: number;
  };
  homeLine: {
    team: string;
    innings: string[];
    r: number;
    h: number;
    e: number;
  };
  footerLeft: string;
  footerRight: string;
  venue: string;
  officialLiveUrl?: string;
};

type CpblTeamInfo = {
  name: string;
  short: string;
  logoKey: string;
};

type CpblLiveGameDetail = {
  GameSno?: number;
  KindCode?: string;
  Year?: number;
  PreExeDate?: string;
  GameDateTimeS?: string;
  GameDateTimeE?: string;
  VisitingTeamName?: string;
  HomeTeamName?: string;
  GameStatus?: number;
  GameStatusChi?: string;
  VisitingTotalScore?: number | null;
  HomeTotalScore?: number | null;
  FieldAbbe?: string;
  VisitingScoreboards?: Array<{ InningSeq?: number; ScoreCnt?: number }>;
  HomeScoreboards?: Array<{ InningSeq?: number; ScoreCnt?: number }>;
  VisitingScore?: unknown;
  HomeScore?: unknown;
  VisitingTeamData?: { HittingCnt?: number; ErrorCnt?: number };
  HomeTeamData?: { HittingCnt?: number; ErrorCnt?: number };
};

type CpblScoreboardItem = {
  GameSno?: number;
  VisitingHomeType?: string | number;
  InningSeq?: number;
  ScoreCnt?: number;
  HittingCnt?: number;
  ErrorCnt?: number;
};

const TEAM_MAP: Record<string, CpblTeamInfo> = {
  'CTBC Brothers': {
    name: '中信兄弟',
    short: '兄弟',
    logoKey: 'ctbc-brothers',
  },
  'Uni-President Lions': {
    name: '統一7-ELEVEn獅',
    short: '統一',
    logoKey: 'uni-lions',
  },
  'Rakuten Monkeys': {
    name: '樂天桃猿',
    short: '樂天',
    logoKey: 'rakuten-monkeys',
  },
  'Wei Chuan Dragons': {
    name: '味全龍',
    short: '味全',
    logoKey: 'wei-chuan-dragons',
  },
  'Fubon Guardians': {
    name: '富邦悍將',
    short: '富邦',
    logoKey: 'fubon-guardians',
  },
  'TSG Hawks': {
    name: '台鋼雄鷹',
    short: '台鋼',
    logoKey: 'tsg-hawks',
  },
};

const OFFICIAL_GAME_META_MAP: Record<string, { gameSno: string; kindCode: string; year: string; statusOverride?: 'SCHEDULED'; labelOverride?: string }> = {
  '2026-05-05|Rakuten Monkeys|Fubon Guardians': {
    gameSno: '80',
    kindCode: 'A',
    year: '2026',
    statusOverride: 'SCHEDULED',
    labelOverride: '延賽',
  },
  '2026-05-05|CTBC Brothers|Wei Chuan Dragons': {
    gameSno: '81',
    kindCode: 'A',
    year: '2026',
  },
  '2026-05-06|TSG Hawks|Uni-President Lions': {
    gameSno: '84',
    kindCode: 'A',
    year: '2026',
  },
  '2026-05-06|CTBC Brothers|Wei Chuan Dragons': {
    gameSno: '83',
    kindCode: 'A',
    year: '2026',
  },
};

let computedOfficialGameMetaMapCache: Record<string, { gameSno: string; kindCode: string; year: string }> | null = null;

function getSeedOfficialMetaKey(seed: CpblSeedGame) {
  return `${normalizeDate(seed.strTimestamp)}|${seed['Away Team']}|${seed['Home Team']}`;
}

function buildComputedOfficialGameMetaMap() {
  if (computedOfficialGameMetaMapCache) {
    return computedOfficialGameMetaMapCache;
  }

  const seeds = readSeedGames()
    .filter((game) => normalizeDate(game.strTimestamp))
    .filter((game) => game['Away Team'] && game['Home Team'])
    .sort((a, b) => {
      const timeDiff = String(a.strTimestamp || '').localeCompare(String(b.strTimestamp || ''));
      if (timeDiff !== 0) return timeDiff;
      return `${a['Away Team']}|${a['Home Team']}`.localeCompare(`${b['Away Team']}|${b['Home Team']}`);
    });

  const anchorKey = '2026-05-05|Rakuten Monkeys|Fubon Guardians';
  const anchorGameSno = 80;
  const anchorIndex = seeds.findIndex((game) => getSeedOfficialMetaKey(game) === anchorKey);
  const map: Record<string, { gameSno: string; kindCode: string; year: string }> = {};

  if (anchorIndex < 0) {
    computedOfficialGameMetaMapCache = map;
    return map;
  }

  seeds.forEach((game, index) => {
    const computedGameSno = anchorGameSno + (index - anchorIndex);

    if (computedGameSno <= 0) {
      return;
    }

    map[getSeedOfficialMetaKey(game)] = {
      gameSno: String(computedGameSno),
      kindCode: 'A',
      year: '2026',
    };
  });

  computedOfficialGameMetaMapCache = map;
  return map;
}

const MANUAL_LIVE_LINE_SCORE_MAP: Record<string, {
  status: 'LIVE' | 'FINAL';
  statusText: string;
  footerLeft: string;
  footerRight: string;
  awayScore: number;
  homeScore: number;
  awayLine: { innings: string[]; r: number; h: number; e: number };
  homeLine: { innings: string[]; r: number; h: number; e: number };
}> = {
  '2026-05-05|CTBC Brothers|Wei Chuan Dragons': {
    status: 'FINAL',
    statusText: '比賽結束',
    footerLeft: 'FINAL',
    footerRight: '11局 延長賽',
    awayScore: 3,
    homeScore: 5,
    awayLine: {
      innings: ['1', '0', '0', '0', '0', '0', '0', '2', '0', '0', '0'],
      r: 3,
      h: 11,
      e: 0,
    },
    homeLine: {
      innings: ['1', '0', '2', '0', '0', '0', '0', '0', '0', '0', '2'],
      r: 5,
      h: 8,
      e: 0,
    },
  },
  '2026-05-05|中信兄弟|味全龍': {
    status: 'FINAL',
    statusText: '比賽結束',
    footerLeft: 'FINAL',
    footerRight: '11局 延長賽',
    awayScore: 3,
    homeScore: 5,
    awayLine: {
      innings: ['1', '0', '0', '0', '0', '0', '0', '2', '0', '0', '0'],
      r: 3,
      h: 11,
      e: 0,
    },
    homeLine: {
      innings: ['1', '0', '2', '0', '0', '0', '0', '0', '0', '0', '2'],
      r: 5,
      h: 8,
      e: 0,
    },
  },
};

function getManualLiveLineScore(seed?: CpblSeedGame) {
  if (!seed) return undefined;
  const key = `${normalizeDate(seed.strTimestamp)}|${seed['Away Team']}|${seed['Home Team']}`;
  return MANUAL_LIVE_LINE_SCORE_MAP[key];
}

function getManualLiveLineScoreForGame(seed: CpblSeedGame | undefined, game: CpblEventsCenterGame) {
  const seedScore = getManualLiveLineScore(seed);
  if (seedScore) return seedScore;

  const key = `${game.gameDate}|${game.awayTeam.name}|${game.homeTeam.name}`;
  return MANUAL_LIVE_LINE_SCORE_MAP[key];
}

function getOfficialGameMeta(seed?: CpblSeedGame) {
  if (!seed) return undefined;

  if (seed.gameSno && seed.kindCode && seed.year) {
    return {
      gameSno: String(seed.gameSno),
      kindCode: String(seed.kindCode),
      year: String(seed.year),
    };
  }

  const key = getSeedOfficialMetaKey(seed);
  return OFFICIAL_GAME_META_MAP[key] ?? buildComputedOfficialGameMetaMap()[key];
}

function buildOfficialLiveUrl(seed?: CpblSeedGame, fallbackUrl?: string) {
  if (fallbackUrl) return fallbackUrl;

  const meta = getOfficialGameMeta(seed);
  if (!meta) return undefined;

  return `https://www.cpbl.com.tw/box/live?gameSno=${meta.gameSno}&kindCode=${meta.kindCode}&year=${meta.year}`;
}

function getAntiForgeryToken(html: string) {
  return (
    html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1] ||
    html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/)?.[1] ||
    ''
  );
}

function normalizeOfficialTeamName(name?: string) {
  const value = String(name || '').trim();

  if (value.includes('中信') || value.includes('兄弟')) return 'CTBC Brothers';
  if (value.includes('統一') || value.includes('7-ELEVEn') || value.includes('獅')) return 'Uni-President Lions';
  if (value.includes('樂天') || value.includes('桃猿')) return 'Rakuten Monkeys';
  if (value.includes('味全') || value.includes('龍')) return 'Wei Chuan Dragons';
  if (value.includes('富邦') || value.includes('悍將')) return 'Fubon Guardians';
  if (value.includes('台鋼') || value.includes('雄鷹')) return 'TSG Hawks';

  return value;
}

function makeLiveDetailKey(date: string, awayTeam?: string, homeTeam?: string) {
  return `${normalizeDate(date)}|${normalizeOfficialTeamName(awayTeam)}|${normalizeOfficialTeamName(homeTeam)}`;
}

function getOfficialDetailDate(detail: CpblLiveGameDetail) {
  return normalizeDate(
    detail.PreExeDate ||
      (detail as any).GameDateTimeS ||
      (detail as any).GameDateTimeE ||
      ''
  );
}

function makeLiveDetailKeyFromDetail(detail: CpblLiveGameDetail) {
  return makeLiveDetailKey(
    getOfficialDetailDate(detail),
    detail.VisitingTeamName,
    detail.HomeTeamName
  );
}

function mergeLiveDetails(base: CpblLiveGameDetail, patch: CpblLiveGameDetail): CpblLiveGameDetail {
  return {
    ...base,
    ...patch,
    PreExeDate: patch.PreExeDate || base.PreExeDate,
    GameDateTimeS: patch.GameDateTimeS || base.GameDateTimeS,
    GameDateTimeE: patch.GameDateTimeE || base.GameDateTimeE,
    VisitingTeamName: patch.VisitingTeamName || base.VisitingTeamName,
    HomeTeamName: patch.HomeTeamName || base.HomeTeamName,
    VisitingScoreboards: patch.VisitingScoreboards?.length ? patch.VisitingScoreboards : base.VisitingScoreboards,
    HomeScoreboards: patch.HomeScoreboards?.length ? patch.HomeScoreboards : base.HomeScoreboards,
    VisitingTeamData: patch.VisitingTeamData || base.VisitingTeamData,
    HomeTeamData: patch.HomeTeamData || base.HomeTeamData,
  };
}

function splitScoreboardsByTeam(scoreboards: CpblScoreboardItem[], gameSno?: number) {
  const filtered = scoreboards.filter((item) => {
    if (gameSno == null || item.GameSno == null) return true;
    return Number(item.GameSno) === Number(gameSno);
  });

  const visiting = filtered
    .filter((item) => String(item.VisitingHomeType) === '1')
    .map((item) => ({
      InningSeq: Number(item.InningSeq ?? 0),
      ScoreCnt: Number(item.ScoreCnt ?? 0),
    }));

  const home = filtered
    .filter((item) => String(item.VisitingHomeType) === '2')
    .map((item) => ({
      InningSeq: Number(item.InningSeq ?? 0),
      ScoreCnt: Number(item.ScoreCnt ?? 0),
    }));

  const visitingHits = filtered
    .filter((item) => String(item.VisitingHomeType) === '1')
    .reduce((sum, item) => sum + Number(item.HittingCnt ?? 0), 0);
  const homeHits = filtered
    .filter((item) => String(item.VisitingHomeType) === '2')
    .reduce((sum, item) => sum + Number(item.HittingCnt ?? 0), 0);
  const visitingErrors = filtered
    .filter((item) => String(item.VisitingHomeType) === '1')
    .reduce((sum, item) => sum + Number(item.ErrorCnt ?? 0), 0);
  const homeErrors = filtered
    .filter((item) => String(item.VisitingHomeType) === '2')
    .reduce((sum, item) => sum + Number(item.ErrorCnt ?? 0), 0);

  return {
    visiting,
    home,
    visitingTeamData: visiting.length
      ? {
          HittingCnt: visitingHits,
          ErrorCnt: visitingErrors,
        }
      : undefined,
    homeTeamData: home.length
      ? {
          HittingCnt: homeHits,
          ErrorCnt: homeErrors,
        }
      : undefined,
  };
}

function mergeScoreboardJsonIntoDetail(
  detail: CpblLiveGameDetail,
  scoreboards: CpblScoreboardItem[]
): CpblLiveGameDetail {
  const split = splitScoreboardsByTeam(scoreboards, detail.GameSno);

  return {
    ...detail,
    VisitingScoreboards: detail.VisitingScoreboards?.length
      ? detail.VisitingScoreboards
      : split.visiting,
    HomeScoreboards: detail.HomeScoreboards?.length ? detail.HomeScoreboards : split.home,
    VisitingTeamData: detail.VisitingTeamData || split.visitingTeamData,
    HomeTeamData: detail.HomeTeamData || split.homeTeamData,
  };
}

function isOfficialPostponed(game: CpblLiveGameDetail) {
  const label = String(game.GameStatusChi || '');
  return label.includes('延賽') || label.includes('取消比賽') || game.GameStatus === 6;
}

function normalizeOfficialGameStatus(game: CpblLiveGameDetail): CpblEventsCenterGame['status'] {
  const label = String(game.GameStatusChi || '');

  if (label.includes('比賽結束') || game.GameStatus === 3) return 'FINAL';
  if (label.includes('比賽中') || game.GameStatus === 2 || game.GameStatus === 8) return 'LIVE';
  return 'SCHEDULED';
}

function normalizeOfficialStatusText(game: CpblLiveGameDetail) {
  const label = String(game.GameStatusChi || '');
  if (label) return label;
  return getStatusText(normalizeOfficialGameStatus(game));
}

function normalizeInningScoreValue(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text || text === '-' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
    return '';
  }
  return text;
}

function scoreboardsToInnings(scoreboards?: Array<{ InningSeq?: number; ScoreCnt?: number }> | null) {
  if (!Array.isArray(scoreboards)) return [];

  return scoreboards
    .slice()
    .sort((a, b) => Number(a.InningSeq ?? 0) - Number(b.InningSeq ?? 0))
    .map((item) => normalizeInningScoreValue(item.ScoreCnt));
}

function scoreLineToInnings(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === 'object' && 'ScoreCnt' in item) {
          return normalizeInningScoreValue((item as any).ScoreCnt);
        }
        return normalizeInningScoreValue(item);
      })
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => /inning|seq|score|cnt|\d+/i.test(key))
      .sort(([a], [b]) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));

    return entries.map(([, score]) => normalizeInningScoreValue(score)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[|,\s]+/)
      .map(normalizeInningScoreValue)
      .filter(Boolean);
  }

  return [];
}

function getOfficialInningLine(scoreboards: CpblLiveGameDetail['VisitingScoreboards'], scoreLine: unknown) {
  const fromScoreboards = scoreboardsToInnings(scoreboards);
  if (fromScoreboards.length > 0) return fromScoreboards;
  return scoreLineToInnings(scoreLine);
}

function getOfficialHits(teamData?: { HittingCnt?: number }) {
  const value = Number(teamData?.HittingCnt ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function getOfficialErrors(teamData?: { ErrorCnt?: number }) {
  const value = Number(teamData?.ErrorCnt ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function applyOfficialLiveDetail(game: CpblEventsCenterGame, detail: CpblLiveGameDetail): CpblEventsCenterGame {
  const status = normalizeOfficialGameStatus(detail);
  const awayScore = toNumber(String(detail.VisitingTotalScore ?? game.awayScore));
  const homeScore = toNumber(String(detail.HomeTotalScore ?? game.homeScore));
  const awayInnings = getOfficialInningLine(detail.VisitingScoreboards, detail.VisitingScore);
  const homeInnings = getOfficialInningLine(detail.HomeScoreboards, detail.HomeScore);
  const maxInnings = Math.max(awayInnings.length, homeInnings.length);

  return {
    ...game,
    status,
    statusText: normalizeOfficialStatusText(detail),
    awayScore,
    homeScore,
    awayLine: {
      ...game.awayLine,
      innings: awayInnings.length ? awayInnings : game.awayLine.innings,
      r: awayScore,
      h: getOfficialHits(detail.VisitingTeamData) || game.awayLine.h,
      e: getOfficialErrors(detail.VisitingTeamData),
    },
    homeLine: {
      ...game.homeLine,
      innings: homeInnings.length ? homeInnings : game.homeLine.innings,
      r: homeScore,
      h: getOfficialHits(detail.HomeTeamData) || game.homeLine.h,
      e: getOfficialErrors(detail.HomeTeamData),
    },
    footerLeft: status === 'FINAL' ? 'FINAL' : status === 'LIVE' ? 'LIVE' : isOfficialPostponed(detail) ? '延賽' : game.footerLeft,
    footerRight:
      isOfficialPostponed(detail)
        ? '延賽'
        : status === 'FINAL'
          ? maxInnings > 9
            ? `${maxInnings}局 延長賽`
            : 'Final'
          : status === 'LIVE'
            ? 'LIVE'
            : game.footerRight,
    venue: detail.FieldAbbe || game.venue,
  };
}

function applyManualLiveLineScore(game: CpblEventsCenterGame, manualLiveLineScore: NonNullable<ReturnType<typeof getManualLiveLineScore>>): CpblEventsCenterGame {
  return {
    ...game,
    status: manualLiveLineScore.status,
    statusText: manualLiveLineScore.statusText,
    awayScore: manualLiveLineScore.awayScore,
    homeScore: manualLiveLineScore.homeScore,
    awayLine: {
      ...game.awayLine,
      ...manualLiveLineScore.awayLine,
    },
    homeLine: {
      ...game.homeLine,
      ...manualLiveLineScore.homeLine,
    },
    footerLeft: manualLiveLineScore.footerLeft,
    footerRight: manualLiveLineScore.footerRight,
  };
}

async function fetchOfficialLiveDetails(seed: CpblSeedGame): Promise<Map<string, CpblLiveGameDetail>> {
  const meta = getOfficialGameMeta(seed);
  if (!meta) return new Map();

  const url = `https://www.cpbl.com.tw/box?gameSno=${meta.gameSno}&kindCode=${meta.kindCode}&year=${meta.year}`;
  const html = await fetchText(url);
  const token = getAntiForgeryToken(html);

  const body = new URLSearchParams({
    __RequestVerificationToken: token,
    GameSno: meta.gameSno,
    KindCode: meta.kindCode,
    Year: meta.year,
    PrevOrNext: '',
    PresentStatus: '',
  });

  const res = await fetch('https://www.cpbl.com.tw/box/getlive', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: url,
    },
    body,
  });

  const payload = await res.json();
  const details = JSON.parse(payload.GameDetailJson || '[]') as CpblLiveGameDetail[];
  const scoreboards = JSON.parse(payload.ScoreboardJson || '[]') as CpblScoreboardItem[];
  const current = payload.CurtGameDetailJson
    ? (JSON.parse(payload.CurtGameDetailJson) as CpblLiveGameDetail)
    : null;

  const map = new Map<string, CpblLiveGameDetail>();
  const gameSnoMap = new Map<number, CpblLiveGameDetail>();

  for (const detail of details) {
    const enhancedDetail = mergeScoreboardJsonIntoDetail(detail, scoreboards);
    const key = makeLiveDetailKeyFromDetail(enhancedDetail);
    map.set(key, enhancedDetail);

    if (enhancedDetail.GameSno != null) {
      gameSnoMap.set(Number(enhancedDetail.GameSno), enhancedDetail);
    }
  }

  if (current) {
    const currentGameSno = Number(current.GameSno ?? meta.gameSno);
    const enhancedCurrent = mergeScoreboardJsonIntoDetail(
      {
        ...current,
        GameSno: currentGameSno,
      },
      scoreboards
    );
    const base = gameSnoMap.get(currentGameSno);
    const merged = base ? mergeLiveDetails(base, enhancedCurrent) : enhancedCurrent;
    const key =
      makeLiveDetailKeyFromDetail(merged) ||
      makeLiveDetailKey(seed.strTimestamp || '', seed['Away Team'], seed['Home Team']);

    map.set(key, merged);
  }

  return map;
}

function getTeamInfo(teamName?: string): CpblTeamInfo {
  const key = String(teamName || '').trim();

  return (
    TEAM_MAP[key] || {
      name: key || '待定',
      short: key || '待定',
      logoKey: 'cpbl',
    }
  );
}

function toNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value?: string) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function getTodayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : new Date().toISOString().slice(0, 10);
}

function hasCompletedBoxScore(game: CpblSeedGame) {
  return Boolean(
    parseInningLine(game['Away Inning Line']).length ||
      parseInningLine(game['Home Inning Line']).length ||
      game['Away Hits'] ||
      game['Home Hits'] ||
      game['Away Errors'] ||
      game['Home Errors'] ||
      Number(game['Away Score']) > 0 ||
      Number(game['Home Score']) > 0
  );
}

function normalizeSeedStatus(game: CpblSeedGame, status: CpblEventsCenterGame['status']) {
  const gameDate = normalizeDate(game.strTimestamp);
  const today = getTodayKey();
  const statusText = String(game.Status || '');

  if (statusText.includes('延賽') || statusText.includes('取消比賽')) {
    return 'SCHEDULED';
  }

  if (status === 'SCHEDULED' && gameDate && gameDate < today && hasCompletedBoxScore(game)) {
    return 'FINAL';
  }

  if (status === 'LIVE' && gameDate && gameDate < today) {
    return 'FINAL';
  }

  return status;
}

function parseInningLine(value?: string) {
  if (!value) return [];

  return String(value)
    .split(/[|,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  return res.text();
}

function detectStatusFromHtml(html: string): { status: CpblEventsCenterGame['status']; label: string } {
  const text = html || '';

  if (text.includes('比賽結束') || text.includes('終場')) {
    return { status: 'FINAL', label: 'Final' };
  }

  if (
    text.includes('比賽中') ||
    text.includes('文字轉播') ||
    text.includes('LIVE') ||
    text.includes('Live')
  ) {
    return { status: 'LIVE', label: 'LIVE' };
  }

  if (text.includes('比賽尚未開始')) {
    return { status: 'SCHEDULED', label: '未開始' };
  }

  if (text.includes('延賽') || text.includes('取消比賽')) {
    return { status: 'SCHEDULED', label: '延賽' };
  }

  return { status: 'SCHEDULED', label: '' };
}

function normalizeStatus(status?: string): CpblEventsCenterGame['status'] {
  const value = String(status || '').toUpperCase();

  if (value.includes('FINAL') || value.includes('END') || value.includes('結束')) {
    return 'FINAL';
  }

  if (value.includes('LIVE') || value.includes('IN PLAY') || value.includes('進行')) {
    return 'LIVE';
  }

  return 'SCHEDULED';
}

function getStatusText(status: CpblEventsCenterGame['status']) {
  if (status === 'FINAL') return '比賽結束';
  if (status === 'LIVE') return '進行中';
  return '未開賽';
}

function getFooterLeft(game: CpblSeedGame, status: CpblEventsCenterGame['status']) {
  if (status === 'FINAL') return 'FINAL';
  if (status === 'LIVE') return 'LIVE';
  if (String(game.Status || '').includes('延賽') || String(game.DisplayTime || '').includes('延賽')) {
    return '延賽';
  }

  return game.DisplayTime || '';
}

function getSeedFilePath() {
  const candidates = [
    path.join(process.cwd(), 'server', 'data', 'cpbl-major-2026.json'),
    path.join(process.cwd(), 'data', 'cpbl-major-2026.json'),
    path.join(process.cwd(), 'cpbl-major-2026.json'),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function readSeedGames(): CpblSeedGame[] {
  const seedPath = getSeedFilePath();
  if (!seedPath) return [];

  try {
    const raw = fs.readFileSync(seedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[cpblOfficial] Failed to read CPBL seed data:', error);
    return [];
  }
}

function convertSeedGame(game: CpblSeedGame): CpblEventsCenterGame {
  const awayTeam = getTeamInfo(game['Away Team']);
  const homeTeam = getTeamInfo(game['Home Team']);
  const status = normalizeSeedStatus(game, normalizeStatus(game.Status));
  const awayScore = toNumber(game['Away Score']);
  const homeScore = toNumber(game['Home Score']);
  const awayInnings = parseInningLine(game['Away Inning Line']);
  const homeInnings = parseInningLine(game['Home Inning Line']);

  return {
    id: game.idEvent || game.gameSno || `cpbl-${normalizeDate(game.strTimestamp)}-${awayTeam.logoKey}-${homeTeam.logoKey}`,
    league: 'CPBL',
    gameDate: normalizeDate(game.strTimestamp),
    status,
    statusText: getStatusText(status),
    awayTeam,
    homeTeam,
    awayScore,
    homeScore,
    awayLine: {
      team: awayTeam.short,
      innings: awayInnings,
      r: awayScore,
      h: toNumber(game['Away Hits']),
      e: toNumber(game['Away Errors']),
    },
    homeLine: {
      team: homeTeam.short,
      innings: homeInnings,
      r: homeScore,
      h: toNumber(game['Home Hits']),
      e: toNumber(game['Home Errors']),
    },
    footerLeft: getFooterLeft(game, status),
    footerRight:
      status === 'LIVE'
        ? 'LIVE'
        : status === 'SCHEDULED'
          ? String(game.Status || '').includes('延賽') || String(game.DisplayTime || '').includes('延賽')
            ? '延賽'
            : game.DisplayTime || ''
          : '',
    venue: game.Venue || '',
    officialLiveUrl: game.officialLiveUrl || undefined,
  };
}

export async function fetchCpblOfficialGamesByDate(date: string): Promise<CpblEventsCenterGame[]> {
  const targetDate = normalizeDate(date);
  const seedGames = readSeedGames();
  const sameDaySeedGames = seedGames.filter((game) => normalizeDate(game.strTimestamp) === targetDate);
  const games = sameDaySeedGames.map(convertSeedGame);
  const officialLiveDetails = new Map<string, CpblLiveGameDetail>();
  const officialLiveDetailsByGameSno = new Map<string, CpblLiveGameDetail>();

  for (const seed of sameDaySeedGames) {
    try {
      const details = await fetchOfficialLiveDetails(seed);
      for (const [key, value] of details) {
        const existing = officialLiveDetails.get(key);
        const mergedValue = existing ? mergeLiveDetails(existing, value) : value;
        officialLiveDetails.set(key, mergedValue);

        if (mergedValue.GameSno != null) {
          const gameSnoKey = String(Number(mergedValue.GameSno));
          const existingByGameSno = officialLiveDetailsByGameSno.get(gameSnoKey);
          officialLiveDetailsByGameSno.set(
            gameSnoKey,
            existingByGameSno ? mergeLiveDetails(existingByGameSno, mergedValue) : mergedValue
          );
        }
      }
    } catch (error) {
      console.warn('[CPBL] getlive fetch failed', error);
    }
  }

  const enhanced = await Promise.all(
    games.map(async (g, index) => {
      const seed = sameDaySeedGames[index];
      const officialMeta = getOfficialGameMeta(seed);
      const officialLiveUrl = buildOfficialLiveUrl(seed, g.officialLiveUrl);
      const liveDetail =
        (officialMeta?.gameSno
          ? officialLiveDetailsByGameSno.get(String(Number(officialMeta.gameSno)))
          : undefined) ||
        officialLiveDetails.get(makeLiveDetailKey(g.gameDate, seed?.['Away Team'], seed?.['Home Team']));
      const manualLiveLineScore = getManualLiveLineScoreForGame(seed, g);

      if (liveDetail) {
        const officialGame = applyOfficialLiveDetail(g, liveDetail);
        const correctedGame = manualLiveLineScore
          ? applyManualLiveLineScore(officialGame, manualLiveLineScore)
          : officialGame;

        return {
          ...correctedGame,
          officialLiveUrl,
        };
      }

      if (manualLiveLineScore) {
        return {
          ...applyManualLiveLineScore(g, manualLiveLineScore),
          officialLiveUrl,
        };
      }

      if (officialMeta?.statusOverride) {
        return {
          ...g,
          officialLiveUrl,
          status: officialMeta.statusOverride,
          statusText: officialMeta.labelOverride || g.statusText,
          footerLeft: officialMeta.labelOverride || g.footerLeft,
          footerRight: officialMeta.labelOverride || g.footerRight,
        };
      }

      if (!officialLiveUrl) return g;

      try {
        const html = await fetchText(officialLiveUrl);
        const detected = detectStatusFromHtml(html);

        return {
          ...g,
          officialLiveUrl,
          status: detected.status,
          statusText: detected.label || g.statusText,
          footerLeft:
            detected.status === 'LIVE'
              ? 'LIVE'
              : detected.label === '延賽'
                ? '延賽'
                : g.footerLeft,
          footerRight:
            detected.status === 'LIVE'
              ? 'LIVE'
              : detected.status === 'FINAL'
                ? 'Final'
                : detected.label === '延賽'
                  ? '延賽'
                  : g.footerRight,
        };
      } catch (e) {
        console.warn('[CPBL] live fetch failed', e);
        return g;
      }
    })
  );

  return enhanced;
}
