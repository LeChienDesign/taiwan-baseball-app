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

const TEAM_MAP: Record<string, CpblTeamInfo> = {
  'CTBC Brothers': {
    name: '中信兄弟',
    short: '兄弟',
    logoKey: 'ctbc-brothers',
  },
  'Uni-President Lions': {
    name: '統一獅',
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
};

const MANUAL_LIVE_LINE_SCORE_MAP: Record<string, {
  status: 'LIVE';
  statusText: string;
  footerLeft: string;
  footerRight: string;
  awayScore: number;
  homeScore: number;
  awayLine: { innings: string[]; r: number; h: number; e: number };
  homeLine: { innings: string[]; r: number; h: number; e: number };
}> = {
  '2026-05-05|CTBC Brothers|Wei Chuan Dragons': {
    status: 'LIVE',
    statusText: '比賽中',
    footerLeft: 'LIVE',
    footerRight: '9局下',
    awayScore: 3,
    homeScore: 3,
    awayLine: {
      innings: ['1', '0', '0', '0', '0', '0', '0', '2', ''],
      r: 3,
      h: 10,
      e: 0,
    },
    homeLine: {
      innings: ['1', '0', '2', '0', '0', '0', '0', '0', ''],
      r: 3,
      h: 7,
      e: 0,
    },
  },
};

function getManualLiveLineScore(seed?: CpblSeedGame) {
  if (!seed) return undefined;
  const key = `${normalizeDate(seed.strTimestamp)}|${seed['Away Team']}|${seed['Home Team']}`;
  return MANUAL_LIVE_LINE_SCORE_MAP[key];
}

function getOfficialGameMeta(seed?: CpblSeedGame) {
  if (!seed) return undefined;

  if (seed.gameSno && seed.kindCode && seed.year) {
    return {
      gameSno: seed.gameSno,
      kindCode: seed.kindCode,
      year: seed.year,
    };
  }

  const key = `${normalizeDate(seed.strTimestamp)}|${seed['Away Team']}|${seed['Home Team']}`;
  return OFFICIAL_GAME_META_MAP[key];
}

function buildOfficialLiveUrl(seed?: CpblSeedGame, fallbackUrl?: string) {
  if (fallbackUrl) return fallbackUrl;

  const meta = getOfficialGameMeta(seed);
  if (!meta) return undefined;

  return `https://www.cpbl.com.tw/box/live?gameSno=${meta.gameSno}&kindCode=${meta.kindCode}&year=${meta.year}`;
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
  const status = normalizeStatus(game.Status);
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
    footerRight: status === 'LIVE' ? 'LIVE' : '',
    venue: game.Venue || '',
    officialLiveUrl: game.officialLiveUrl || undefined,
  };
}

export async function fetchCpblOfficialGamesByDate(date: string): Promise<CpblEventsCenterGame[]> {
  const targetDate = normalizeDate(date);
  const seedGames = readSeedGames();

  const sameDaySeedGames = seedGames.filter((game) => normalizeDate(game.strTimestamp) === targetDate);
  const games = sameDaySeedGames.map(convertSeedGame);

  const enhanced = await Promise.all(
    games.map(async (g, index) => {
      const seed = sameDaySeedGames[index];
      const officialMeta = getOfficialGameMeta(seed);
      const officialLiveUrl = buildOfficialLiveUrl(seed, g.officialLiveUrl);
      const manualLiveLineScore = getManualLiveLineScore(seed);

      if (manualLiveLineScore) {
        return {
          ...g,
          officialLiveUrl,
          status: manualLiveLineScore.status,
          statusText: manualLiveLineScore.statusText,
          awayScore: manualLiveLineScore.awayScore,
          homeScore: manualLiveLineScore.homeScore,
          awayLine: {
            ...g.awayLine,
            ...manualLiveLineScore.awayLine,
          },
          homeLine: {
            ...g.homeLine,
            ...manualLiveLineScore.homeLine,
          },
          footerLeft: manualLiveLineScore.footerLeft,
          footerRight: manualLiveLineScore.footerRight,
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
