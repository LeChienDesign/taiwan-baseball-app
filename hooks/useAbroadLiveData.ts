import { useCallback, useMemo, useState } from 'react';

import localLivePayload from '../server/data/abroadPlayers.live.json';

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

const payload = localLivePayload as LivePayload;

export function useAbroadLiveData(): UseAbroadLiveDataResult {
  const [refreshing, setRefreshing] = useState(false);

  const players = useMemo(() => {
    return Array.isArray(payload.players) ? payload.players : [];
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshing(false);
  }, []);

  return {
    players,
    updatedAt: payload.updatedAt,
    loading: false,
    refreshing,
    error: undefined,
    isUsingFallback: true,
    refresh,
  };
}
