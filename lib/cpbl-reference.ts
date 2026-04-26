import type { ScoreboardGame } from './mlb';

type ParsedReferenceLine = {
  team: string;
  innings: string[];
  r: number;
  h: number | '';
  e: number | '';
};

type ParsedReferenceGame = {
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  venue?: string;
  awayLine: ParsedReferenceLine;
  homeLine: ParsedReferenceLine;
  awayScore: number;
  homeScore: number;
};

function padInnings(values: string[], max = 9) {
  const arr = [...values];
  while (arr.length < max) arr.push('');
  return arr.slice(0, max);
}

function sumRuns(values: string[]) {
  return values.reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function normalizeCpblTeamName(name: string) {
  const map: Record<string, string> = {
    'Wei Chuan Dragons': '味全龍',
    'TSG Hawks': '台鋼雄鷹',
    'CTBC Brothers': '中信兄弟',
    'Rakuten Monkeys': '樂天桃猿',
    'Fubon Guardians': '富邦悍將',
    'Uni-President Lions': '統一7-ELEVEn獅',
    '味全龍': '味全龍',
    '台鋼雄鷹': '台鋼雄鷹',
    '中信兄弟': '中信兄弟',
    '樂天桃猿': '樂天桃猿',
    '富邦悍將': '富邦悍將',
    '統一7-ELEVEn獅': '統一7-ELEVEn獅',
  };

  return map[name.trim()] ?? name.trim();
}

function shortTeam(name: string) {
  const map: Record<string, string> = {
    '味全龍': '味全',
    '台鋼雄鷹': '台鋼',
    '中信兄弟': '兄弟',
    '樂天桃猿': '樂天',
    '富邦悍將': '富邦',
    '統一7-ELEVEn獅': '統一',
  };

  const normalized = normalizeCpblTeamName(name);
  return map[normalized] ?? normalized.slice(0, 2);
}

function detectStatus(raw: string) {
  const value = raw.trim().toUpperCase();
  if (!value) return 'SCHEDULED' as const;
  if (value.startsWith('IN')) return 'LIVE' as const;
  if (value.includes('FINAL') || value.includes('GAME OVER')) return 'FINAL' as const;
  return 'SCHEDULED' as const;
}

function parseReferenceDescription(text: string) {
  const clean = text.replace(/\r/g, '').trim();

  const teamMatches = [...clean.matchAll(/^(.*?)\s+Innings:\s*$/gim)];
  if (teamMatches.length < 2) {
    throw new Error('Reference description missing team blocks');
  }

  const lines = clean.split('\n').map((s) => s.trim()).filter(Boolean);

  function parseBlock(teamIndex: number): ParsedReferenceLine {
    const teamName = normalizeCpblTeamName(teamMatches[teamIndex][1]);
    const inningsLabelIndex = lines.findIndex((line) =>
      line.toLowerCase() === `${teamMatches[teamIndex][1].toLowerCase()} innings:`
    );

    if (inningsLabelIndex < 0) {
      throw new Error(`Missing innings line for ${teamName}`);
    }

    const inningsLine = lines[inningsLabelIndex + 1] ?? '';
    const heLine = lines[inningsLabelIndex + 2] ?? '';

    const innings = inningsLine ? inningsLine.split(/\s+/) : [];
    const heMatch = heLine.match(/Hits:\s*(\d+)\s*-\s*Errors:\s*(\d+)/i);

    const padded = padInnings(innings, 9);

    return {
      team: shortTeam(teamName),
      innings: padded,
      r: sumRuns(padded),
      h: heMatch ? Number(heMatch[1]) : '',
      e: heMatch ? Number(heMatch[2]) : '',
    };
  }

  const awayLine = parseBlock(0);
  const homeLine = parseBlock(1);

  return {
    awayLine,
    homeLine,
    awayScore: awayLine.r,
    homeScore: homeLine.r,
  };
}

export function parseCpblReferenceSources(input: {
  statusText?: string;
  venue?: string;
  resultDescription?: string;
}): ParsedReferenceGame {
  const status = detectStatus(input.statusText ?? '');

  if (!input.resultDescription?.trim()) {
    throw new Error('Missing resultDescription');
  }

  const parsed = parseReferenceDescription(input.resultDescription);

  return {
    status,
    venue: input.venue?.trim() || '',
    ...parsed,
  };
}

export function applyCpblReferenceToGame(
  game: ScoreboardGame,
  parsed: ParsedReferenceGame
): ScoreboardGame {
  return {
    ...game,
    status: parsed.status,
    venue: parsed.venue || game.venue,
    awayScore: parsed.awayScore,
    homeScore: parsed.homeScore,
    awayLine: {
      ...game.awayLine,
      team: parsed.awayLine.team,
      innings: parsed.awayLine.innings,
      r: parsed.awayLine.r,
      h: parsed.awayLine.h,
      e: parsed.awayLine.e,
    },
    homeLine: {
      ...game.homeLine,
      team: parsed.homeLine.team,
      innings: parsed.homeLine.innings,
      r: parsed.homeLine.r,
      h: parsed.homeLine.h,
      e: parsed.homeLine.e,
    },
    footerLeft:
      parsed.status === 'FINAL'
        ? 'FINAL'
        : parsed.status === 'LIVE'
          ? 'LIVE'
          : game.footerLeft,
  };
}