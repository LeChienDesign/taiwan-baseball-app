import { useEffect } from 'react';
import { AppState } from 'react-native';

const SMART_SCORE_REFRESH_MS = 5 * 60 * 1000;

type UseSmartLeagueRefreshOptions = {
  enabled: boolean;
  onRefresh: () => void | Promise<void>;
};

export function useSmartLeagueRefresh({
  enabled,
  onRefresh,
}: UseSmartLeagueRefreshOptions) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      onRefresh();
    }, SMART_SCORE_REFRESH_MS);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, onRefresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && enabled) {
        onRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, onRefresh]);
}
