import type { ScoreboardGame } from './mlb';

export type CpblOfficialStatus = {
  status: 'SCHEDULED' | 'FINAL' | 'POSTPONED' | 'SUSPENDED' | 'LIVE';
  statusText: string;
};

function detectOfficialStatus(text: string) {
  const raw = (text || '').trim();

  if (!raw) return { status: 'SCHEDULED' as const, label: '' };

  if (
    raw.includes('延賽') ||
    raw.includes('取消比賽') ||
    raw.includes('Postponed') ||
    raw.includes('Rain Out')
  ) {
    return { status: 'POSTPONED' as const, label: '延賽' };
  }

  if (
    raw.includes('保留比賽') ||
    raw.includes('暫停') ||
    raw.includes('Suspended')
  ) {
    return { status: 'SUSPENDED' as const, label: '暫停' };
  }

  if (
    raw.includes('比賽結束') ||
    raw.includes('終場') ||
    raw.includes('FINAL') ||
    raw.includes('Final')
  ) {
    return { status: 'FINAL' as const, label: 'FINAL' };
  }

  if (
    raw.includes('比賽中') ||
    raw.includes('文字轉播') ||
    raw.includes('成績看板') ||
    raw.includes('Live') ||
    raw.includes('LIVE') ||
    raw.includes('scoreboard') ||
    raw.includes('SCOREBOARD')
  ) {
    return { status: 'LIVE' as const, label: '比賽中' };
  }

  if (
    raw.includes('比賽尚未開始') ||
    raw.includes('Scheduled') ||
    raw.includes('Preview')
  ) {
    return { status: 'SCHEDULED' as const, label: 'SCHEDULED' };
  }

  return { status: 'SCHEDULED' as const, label: raw };
}

function normalizeHtml(html: string) {
  return html
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');
}

function extractStatusText(clean: string) {
  const direct = clean.match(
    /(比賽結束|終場|延賽|保留比賽|取消比賽|比賽尚未開始|比賽中|文字轉播|成績看板|SCOREBOARD|scoreboard|FINAL|Final|Live|LIVE|Postponed|Suspended|Scheduled|Preview)/
  )?.[1];

  return direct ?? clean;
}

function makeBrowserHeaders(referer: string) {
  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Referer: referer,
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  };
}

async function fetchText(url: string, referer: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: makeBrowserHeaders(referer),
  });

  console.log('CPBL live response status =', response.status, 'for', url);

  if (!response.ok) {
    throw new Error(`CPBL official request failed: ${response.status}`);
  }

  return await response.text();
}

export async function fetchCpblOfficialStatusByGame(params: {
  gameSno?: number | string;
  kindCode?: string;
  year?: number | string;
}): Promise<CpblOfficialStatus | null> {
  const { gameSno, kindCode, year } = params;
  if (!gameSno || !kindCode || !year) return null;

  const primaryUrl = `https://en.cpbl.com.tw/box/index?gameSno=${gameSno}&kindCode=${kindCode}&year=${year}`;
  const fallbackUrl = `https://www.cpbl.com.tw/box/live?gameSno=${gameSno}&kindCode=${kindCode}&year=${year}`;

  console.log('CPBL live url =', primaryUrl);

  let detected = { status: 'SCHEDULED' as const, label: '' };

  try {
    const html = await fetchText(primaryUrl, 'https://en.cpbl.com.tw/box');
    const clean = normalizeHtml(html);
    const statusText = extractStatusText(clean);
    detected = detectOfficialStatus(statusText);

    console.log('CPBL parsed statusText =', statusText.slice(0, 120), 'for', primaryUrl);
  } catch (primaryError) {
    console.warn('CPBL primary live fetch failed, trying fallback:', primaryError);
  }

  if (detected.status === 'SCHEDULED') {
    try {
      const html = await fetchText(fallbackUrl, 'https://www.cpbl.com.tw/box');
      const clean = normalizeHtml(html);
      const statusText = extractStatusText(clean);
      detected = detectOfficialStatus(statusText);

      console.log('CPBL parsed fallback statusText =', statusText.slice(0, 120), 'for', fallbackUrl);
    } catch (fallbackError) {
      console.warn('CPBL fallback live fetch failed:', fallbackError);
    }
  }

  return {
    status: detected.status,
    statusText: detected.label,
  };
}

export function applyCpblOfficialStatus(
  game: ScoreboardGame,
  official: CpblOfficialStatus | null
): ScoreboardGame {
  if (!official) return game;

  return {
    ...game,
    status: official.status,
    footerLeft:
      official.status === 'FINAL'
        ? 'FINAL'
        : official.status === 'POSTPONED'
          ? '延賽'
          : official.status === 'SUSPENDED'
            ? '暫停'
            : official.status === 'LIVE'
              ? official.statusText || '比賽中'
              : game.footerLeft,
    footerRight: official.status === 'SCHEDULED' ? game.footerRight : '',
  };
}
