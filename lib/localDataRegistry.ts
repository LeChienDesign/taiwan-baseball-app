import dataVersion from '../data/data-version.json';

export type LeagueDataVersion = {
  version: string;
  source: string;
};

export type DataVersionMap = {
  cpbl?: LeagueDataVersion;
  npb?: LeagueDataVersion;
  kbo?: LeagueDataVersion;
  mlb?: LeagueDataVersion;
};

export function getLocalDataVersions(): DataVersionMap {
  return dataVersion as DataVersionMap;
}

export function getLeagueDataVersion(
  league: keyof DataVersionMap
): LeagueDataVersion | undefined {
  const versions = getLocalDataVersions();
  return versions[league];
}

export function formatVersionShort(version?: string) {
  if (!version) return '';

  const date = new Date(version);
  if (Number.isNaN(date.getTime())) return version;

  return date.toLocaleString('zh-TW', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatSourceLabel(source?: string) {
  switch (source) {
    case 'local+official-patch':
      return '本地資料 + 官方修正';
    case 'local':
      return '本地資料';
    case 'mock':
      return '靜態資料';
    case 'live':
      return '即時資料';
    default:
      return source ?? '';
  }
}