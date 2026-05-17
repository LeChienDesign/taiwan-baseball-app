import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type UseLiveJsonOptions<TPayload> = {
  remoteUrl?: string;
  fallbackPayload: TPayload;
  pollingIntervalMs?: number;
  enabled?: boolean;
};

type UseLiveJsonResult<TPayload> = {
  payload: TPayload;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  isUsingFallback: boolean;
  refresh: () => Promise<void>;
};

const DEFAULT_POLLING_INTERVAL_MS = 60 * 1000;

export function useLiveJson<TPayload>({
  remoteUrl,
  fallbackPayload,
  pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  enabled = true,
}: UseLiveJsonOptions<TPayload>): UseLiveJsonResult<TPayload> {
  const [payload, setPayload] = useState<TPayload>(fallbackPayload);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isUsingFallback, setIsUsingFallback] = useState(true);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const mountedRef = useRef(true);
  const refreshRef = useRef<() => Promise<void>>(async () => {});

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!remoteUrl) {
      setPayload(fallbackPayload);
      setLoading(false);
      setRefreshing(false);
      setError(undefined);
      setIsUsingFallback(true);
      return;
    }

    setRefreshing(true);
    setError(undefined);

    try {
      const response = await fetch(`${remoteUrl}?t=${Date.now()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch live json: ${response.status}`);
      }

      const nextPayload = (await response.json()) as TPayload;

      if (!mountedRef.current) return;

      setPayload(nextPayload);
      setIsUsingFallback(false);
    } catch (nextError) {
      if (!mountedRef.current) return;

      const message =
        nextError instanceof Error ? nextError.message : 'Failed to fetch live json';
      setError(message);
      setPayload((currentPayload) => currentPayload ?? fallbackPayload);
      setIsUsingFallback(true);
    } finally {
      if (!mountedRef.current) return;

      setLoading(false);
      setRefreshing(false);
    }
  }, [enabled, fallbackPayload, remoteUrl]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return useMemo(
    () => ({
      payload,
      loading,
      refreshing,
      error,
      isUsingFallback,
      refresh,
    }),
    [error, isUsingFallback, loading, payload, refresh, refreshing]
  );
}
