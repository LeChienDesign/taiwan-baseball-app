import { useCallback, useEffect, useMemo, useState } from 'react';

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

function getBaseUrl() {
  const base = process.env.EXPO_PUBLIC_BASEBALL_API_URL?.trim();

  if (!base) {
    return 'http://localhost:3000/api';
  }

  return base.replace(/\/+$/, '');
}

function buildLiveUrl() {
  return `${getBaseUrl()}/abroad/live`;
}

function normalizePlayers(input: unknown): LivePlayer[] {
  if (Array.isArray(input)) {
    return input.filter(
      (item): item is LivePlayer => !!item && typeof item === 'object' && typeof (item as any).id === 'string'
    );
  }

  if (input && typeof input === 'object' && Array.isArray((input as any).players)) {
    return (input as any).players.filter(
      (item: any): item is LivePlayer => !!item && typeof item === 'object' && typeof item.id === 'string'
    );
  }

  return [];
}

function readUpdatedAt(input: unknown) {
  if (input && typeof input === 'object' && typeof (input as any).updatedAt === 'string') {
    return (input as any).updatedAt as string;
  }
  return undefined;
}

export function useAbroadLiveData(): UseAbroadLiveDataResult {
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const fetchLiveData = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(undefined);

      const url = `${buildLiveUrl()}?t=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as LivePayload | LivePlayer[];
      const nextPlayers = normalizePlayers(json);
      const nextUpdatedAt = readUpdatedAt(json);

      if (nextPlayers.length === 0) {
        throw new Error('Live payload has no players');
      }

      setPlayers(nextPlayers);
      setUpdatedAt(nextUpdatedAt);
      setIsUsingFallback(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);

      // 這裡不清空 players，避免上一輪成功資料被洗掉
      // 若完全沒有 live 資料，頁面會回 seed + fallback 顯示
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData('initial');
  }, [fetchLiveData]);

  const refresh = useCallback(async () => {
    await fetchLiveData('refresh');
  }, [fetchLiveData]);

  return useMemo(
    () => ({
      players,
      updatedAt,
      loading,
      refreshing,
      error,
      isUsingFallback,
      refresh,
    }),
    [players, updatedAt, loading, refreshing, error, isUsingFallback, refresh]
  );
}