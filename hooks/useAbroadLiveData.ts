import { useMemo } from 'react';

import localLivePayload from '../server/data/abroadPlayers.live.json';
import { useLiveJson } from './useLiveJson';

type LivePlayer = {
  id: string;
  [key: string]: any;
};

type LivePayload = {
  updatedAt?: string;
  requestedDate?: string;
  summary?: Record<string, any>;
  providers?: Array<{
    name: string;
    ok: boolean;
    message: string;
    affectedPlayers?: number;
  }>;
  players?: LivePlayer[];
};

type UseAbroadLiveDataResult = {
  players: LivePlayer[];
  updatedAt?: string;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  isUsingFallback: boolean;
  refresh: () => Promise<void>;
};

const fallbackPayload = localLivePayload as LivePayload;

export function useAbroadLiveData(): UseAbroadLiveDataResult {
  const {
    payload,
    loading,
    refreshing,
    error,
    isUsingFallback,
    refresh,
  } = useLiveJson<LivePayload>({
    fallbackPayload,
    enabled: false,
  });

  const players = useMemo(() => {
    return Array.isArray(payload.players) ? payload.players : [];
  }, [payload]);

  return {
    players,
    updatedAt: payload.updatedAt,
    loading,
    refreshing,
    error,
    isUsingFallback,
    refresh,
  };
}
