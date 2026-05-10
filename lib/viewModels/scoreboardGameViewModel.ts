// View model helpers for scoreboard cards.
// Keep status normalization and display labels here so ScoreboardCard stays render-only.

import type { ScoreboardGame } from '../mlb';

export type NormalizedScoreboardStatus = 'FINAL' | 'LIVE' | 'SCHEDULED';

export type ScoreboardCardViewModel = ScoreboardGame & {
  normalizedStatus: NormalizedScoreboardStatus;
  statusLabel: string;
  liveDetail?: string;
  footerVenue: string;
  isScheduled: boolean;
  isLive: boolean;
  isFinal: boolean;
};

// Status helpers

export function normalizeScoreboardStatus(status?: string): NormalizedScoreboardStatus {
  const rawStatus = String(status || '').toUpperCase();

  if (rawStatus.includes('LIVE') || rawStatus.includes('比賽中')) return 'LIVE';
  if (
    rawStatus.includes('FINAL') ||
    rawStatus.includes('結束') ||
    rawStatus.includes('完賽')
  ) {
    return 'FINAL';
  }

  return 'SCHEDULED';
}

export function getScoreboardStatusLabel(
  status: NormalizedScoreboardStatus,
  footerLeft?: string,
  footerRight?: string
) {
  if (status === 'LIVE') return footerLeft || footerRight || 'LIVE';
  if (status === 'FINAL') return 'FINAL';

  return footerRight || 'SCHEDULED';
}

// View model builders

export function toScoreboardCardViewModel(game: ScoreboardGame): ScoreboardCardViewModel {
  const normalizedStatus = normalizeScoreboardStatus(game.status);
  const statusLabel = getScoreboardStatusLabel(
    normalizedStatus,
    game.footerLeft,
    game.footerRight
  );
  const footerVenue = game.venue && game.venue !== '—' ? game.venue : '';
  const isLive = normalizedStatus === 'LIVE';

  return {
    ...game,
    normalizedStatus,
    statusLabel,
    liveDetail: isLive ? statusLabel : game.footerRight,
    footerVenue,
    isScheduled: normalizedStatus === 'SCHEDULED',
    isLive,
    isFinal: normalizedStatus === 'FINAL',
  };
}
