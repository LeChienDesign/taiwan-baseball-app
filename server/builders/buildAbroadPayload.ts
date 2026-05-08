

import {
  buildSummary,
  type AbroadLiveSummary,
  type AbroadPlayerLike,
} from '../merge/mergeAbroadPlayers';
import { type ProviderRunResult } from '../providers/runAbroadProvider';

export type AbroadLivePayload = {
  updatedAt: string;
  requestedDate: string;
  summary: AbroadLiveSummary;
  providers: ProviderRunResult[];
  players: AbroadPlayerLike[];
};

export function buildAbroadPayload(
  players: AbroadPlayerLike[],
  providerResults: ProviderRunResult[],
  date: string
): AbroadLivePayload {
  return {
    updatedAt: new Date().toISOString(),
    requestedDate: date,
    summary: buildSummary(players),
    providers: providerResults,
    players,
  };
}
