

export async function fetchKboScoreboardByDate(date: string) {
  const d = date.replace(/-/g, '');

  const res = await fetch('https://www.koreabaseball.com/ws/Main.asmx/GetKboGameList', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: JSON.stringify({ leId: '1', srId: '0,9', date: d })
  });

  const text = await res.text();

  let json: any;
  try {
    json = JSON.parse(text.trim());
  } catch {
    const start = text.indexOf('{');
    if (start < 0) throw new Error('KBO response does not contain JSON');

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let index = start; index < text.length; index += 1) {
      const char = text[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) {
        end = index;
        break;
      }
    }

    if (end < 0) throw new Error('KBO response JSON is incomplete');
    json = JSON.parse(text.slice(start, end + 1));
  }

  const stripHtml = (html: string) =>
    String(html ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

  const extractCells = (rowHtml: string) =>
    [...rowHtml.matchAll(/<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
      .map((cell) => stripHtml(cell[1]))
      .filter(Boolean);

  const ENG_TO_KOR: Record<string, string> = {
    DOOSAN: '두산',
    LG: 'LG',
    NC: 'NC',
    SSG: 'SSG',
    KIWOOM: '키움',
    SAMSUNG: '삼성',
    LOTTE: '롯데',
    KT: 'KT',
    HANWHA: '한화',
    KIA: 'KIA',
  };

  const lineScoreMap = new Map<string, {
    innings: number[];
    awayLine: { innings: string[]; r: number; h: number; e: number };
    homeLine: { innings: string[]; r: number; h: number; e: number };
  }>();

  try {
    const scoreRes = await fetch(`https://eng.koreabaseball.com/Schedule/Scoreboard.aspx?searchDate=${date}`);
    const scoreHtml = await scoreRes.text();
    const blocks = scoreHtml.split('<!-- score none -->');

    for (const block of blocks) {
      const teamNames = [...block.matchAll(/<span class="team_name">([\s\S]*?)<\/span>/gi)]
        .map((match) => stripHtml(match[1]).toUpperCase());

      if (teamNames.length < 2) continue;

      const awayKor = ENG_TO_KOR[teamNames[0]];
      const homeKor = ENG_TO_KOR[teamNames[1]];
      if (!awayKor || !homeKor) continue;

      const rows = [...block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
        .map((match) => match[0])
        .filter((row) => /scope="row"/i.test(row));

      if (rows.length < 2) continue;

      const awayCells = extractCells(rows[0]);
      const homeCells = extractCells(rows[1]);
      if (awayCells.length < 20 || homeCells.length < 20) continue;

      const buildLine = (cells: string[]) => ({
        innings: cells.slice(1, 16).map((cell) => cell || '-'),
        r: Number(cells[16]) || 0,
        h: Number(cells[17]) || 0,
        e: Number(cells[18]) || 0,
      });

      lineScoreMap.set(`${awayKor}-${homeKor}`, {
        innings: Array.from({ length: 15 }, (_, index) => index + 1),
        awayLine: buildLine(awayCells),
        homeLine: buildLine(homeCells),
      });
    }
  } catch {
    // Keep total-score-only fallback when the English scoreboard is unavailable.
  }

  const games = (json.game || []).map((g: any, i: number) => {
    const TEAM_MAP: Record<string, { name: string; short: string; logoKey?: string }> = {
      한화: { name: '韓華鷹', short: 'HAN', logoKey: 'hanwha-eagles' },
      두산: { name: '斗山熊', short: 'DOO', logoKey: 'doosan-bears' },
      KIA: { name: 'KIA虎', short: 'KIA', logoKey: 'kia-tigers' },
      키움: { name: '培證英雄', short: 'KIW', logoKey: 'kiwoom-heroes' },
      KT: { name: 'KT巫師', short: 'KT', logoKey: 'kt-wiz' },
      LG: { name: 'LG雙子', short: 'LG', logoKey: 'lg-twins' },
      롯데: { name: '樂天巨人', short: 'LOT', logoKey: 'lotte-giants' },
      NC: { name: 'NC恐龍', short: 'NC', logoKey: 'nc-dinos' },
      삼성: { name: '三星獅', short: 'SAM', logoKey: 'samsung-lions' },
      SSG: { name: 'SSG登陸者', short: 'SSG', logoKey: 'ssg-landers' },
    };

    const toTeam = (name: string) => {
      const key = String(name ?? '').trim();
      return TEAM_MAP[key] ?? { name: key, short: key.slice(0, 4).toUpperCase() };
    };

    const status = g.GAME_STATE_SC === '2' ? 'LIVE'
      : g.GAME_STATE_SC === '3' ? 'FINAL'
      : 'SCHEDULED';

    const inning = g.GAME_INN_NO;
    const half = g.GAME_TB_SC === 'T' ? '表' : '裏';

    const awayTeam = toTeam(g.AWAY_NM);
    const homeTeam = toTeam(g.HOME_NM);
    const awayScore = Number(g.T_SCORE_CN || 0);
    const homeScore = Number(g.B_SCORE_CN || 0);
    const lineScore = lineScoreMap.get(`${String(g.AWAY_NM ?? '').trim()}-${String(g.HOME_NM ?? '').trim()}`);
    const innings = lineScore?.innings ?? [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return {
      id: g.G_ID,
      date,
      league: 'KBO',
      status,
      venue: g.S_NM,
      source: 'kbo-official',
      gamePk: i + 1,
      statusText: status === 'LIVE' ? 'Live' : status === 'FINAL' ? 'Final' : 'Scheduled',
      awayTeam,
      homeTeam,
      awayScore,
      homeScore,
      innings,
      awayLine: {
        team: awayTeam.short,
        innings: lineScore?.awayLine.innings ?? Array(9).fill('-'),
        r: lineScore?.awayLine.r ?? awayScore,
        h: lineScore?.awayLine.h ?? 0,
        e: lineScore?.awayLine.e ?? 0
      },
      homeLine: {
        team: homeTeam.short,
        innings: lineScore?.homeLine.innings ?? Array(9).fill('-'),
        r: lineScore?.homeLine.r ?? homeScore,
        h: lineScore?.homeLine.h ?? 0,
        e: lineScore?.homeLine.e ?? 0
      },
      footerLeft: status === 'LIVE' ? 'Live' : status === 'FINAL' ? 'Final' : 'Scheduled',
      footerRight:
        status === 'LIVE'
          ? `${inning}回${half}`
          : status === 'FINAL'
          ? 'Final'
          : g.G_TM,
      gameDate: date,
      officialUrl: `https://www.koreabaseball.com/Schedule/GameCenter/Main.aspx?gameId=${g.G_ID}`,
    };
  });

  return {
    date,
    games
  };
}
