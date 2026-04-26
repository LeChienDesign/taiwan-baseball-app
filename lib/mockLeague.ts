export type MockFetcherOptions = {
  leagueCode: string;
  leagueLogo: any;
  teams: Array<{
    name: string;
    short: string;
    record?: string;
    logo: any;
  }>;
};

function makeStatus(index: number): 'FINAL' | 'LIVE' | 'SCHEDULED' {
  if (index % 3 === 0) return 'FINAL';
  if (index % 3 === 1) return 'LIVE';
  return 'SCHEDULED';
}

export function createMockLeagueFetcher(options: MockFetcherOptions) {
  return async function fetchGamesByDate(date: string) {
    const day = Number(date.slice(-2)) || 1;
    const count = (day % 3) + 2;
    const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    return Array.from({ length: count }).map((_, index) => {
      const away = options.teams[(index * 2) % options.teams.length];
      const home = options.teams[(index * 2 + 1) % options.teams.length];
      const status = makeStatus(index);

      const awayRuns = innings.map((n) => ((day + index + n) % 2 === 0 ? 1 : 0));
      const homeRuns = innings.map((n) => ((day + index + n + 1) % 3 === 0 ? 1 : 0));

      const awayScore = awayRuns.reduce((a, b) => a + b, 0);
      const homeScore = homeRuns.reduce((a, b) => a + b, 0);

      return {
        id: `${options.leagueCode}-${date}-${index}`,
        awayTeam: {
          name: away.name,
          short: away.short,
          record: away.record ?? '',
          logo: away.logo ?? options.leagueLogo,
        },
        homeTeam: {
          name: home.name,
          short: home.short,
          record: home.record ?? '',
          logo: home.logo ?? options.leagueLogo,
        },
        awayScore: status === 'SCHEDULED' ? 0 : awayScore,
        homeScore: status === 'SCHEDULED' ? 0 : homeScore,
        status,
        venue: `${options.leagueCode} Stadium ${index + 1}`,
        innings,
        awayLine: {
          team: away.short,
          innings: status === 'SCHEDULED' ? innings.map(() => '') : awayRuns,
          r: status === 'SCHEDULED' ? 0 : awayScore,
          h: status === 'SCHEDULED' ? 0 : awayScore + 4,
          e: status === 'SCHEDULED' ? 0 : index % 2,
        },
        homeLine: {
          team: home.short,
          innings: status === 'SCHEDULED' ? innings.map(() => '') : homeRuns,
          r: status === 'SCHEDULED' ? 0 : homeScore,
          h: status === 'SCHEDULED' ? 0 : homeScore + 5,
          e: status === 'SCHEDULED' ? 0 : (index + 1) % 2,
        },
        footerLeft:
          status === 'FINAL'
            ? 'FINAL'
            : status === 'LIVE'
              ? 'Top 7th'
              : 'Scheduled',
        footerRight: status === 'SCHEDULED' ? '18:35' : '',
      };
    });
  };
}