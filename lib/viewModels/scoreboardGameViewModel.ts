import type { ScoreboardGame } from '../mlb';

export type ScoreboardCardViewModel = ScoreboardGame & {
  normalizedStatus: 'FINAL' | 'LIVE' | 'SCHEDULED';
  statusLabel: string;
  liveDetail?: string;
  footerVenue: string;
  isScheduled: boolean;
  isLive: boolean;
  isFinal: boolean;
};

export function normalizeScoreboardStatus(status: ScoreboardGame['status']) {
  const raw = String(status || '').toUpperCase();

  if (raw.includes('LIVE') || raw.includes('比賽中')) return 'LIVE';
  if (raw.includes('FINAL') || raw.includes('結束') || raw.includes('完賽')) return 'FINAL';
  return 'SCHEDULED';
}

export function getScoreboardStatusLabel(
  status: ScoreboardCardViewModel['normalizedStatus'],
  footerLeft?: string,
  footerRight?: string
) {
  if (status === 'LIVE') return footerLeft || footerRight || 'LIVE';
  if (status === 'FINAL') return 'FINAL';
  return footerRight || 'SCHEDULED';
}

export function toScoreboardCardViewModel(game: ScoreboardGame): ScoreboardCardViewModel {
  const normalizedStatus = normalizeScoreboardStatus(game.status);
  const statusLabel = getScoreboardStatusLabel(
    normalizedStatus,
    game.footerLeft,
    game.footerRight
  );

  return {
    ...game,
    normalizedStatus,
    statusLabel,
    liveDetail: normalizedStatus === 'LIVE' ? statusLabel : game.footerRight,
    footerVenue: game.venue && game.venue !== '—' ? game.venue : '',
    isScheduled: normalizedStatus === 'SCHEDULED',
    isLive: normalizedStatus === 'LIVE',
    isFinal: normalizedStatus === 'FINAL',
  };
}

