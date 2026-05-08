import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import localLivePayload from '../server/data/abroadPlayers.live.json';

const REMOTE_ABROAD_LIVE_URL =
  'https://raw.githubusercontent.com/LeChienDesign/taiwan-baseball-app/main/server/data/abroadPlayers.live.json';

const POLLING_INTERVAL_MS = 60 * 1000;

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
  const [payload, setPayload] = useState<LivePayload>(fallbackPayload);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const players = useMemo(() => {
    return Array.isArray(payload.players) ? payload.players : [];
  }, [payload]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(undefined);

    try {
      const response = await fetch(`${REMOTE_ABROAD_LIVE_URL}?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch abroad live data: ${response.status}`);
      }

      const nextPayload = (await response.json()) as LivePayload;
      setPayload(nextPayload);
      setIsUsingFallback(false);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'Failed to fetch abroad live data';
      setError(message);
      setPayload((currentPayload) => currentPayload ?? fallbackPayload);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInactive =
        appStateRef.current === 'inactive' || appStateRef.current === 'background';

      appStateRef.current = nextAppState;

      if (wasInactive && nextAppState === 'active') {
        refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshRef.current();
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
