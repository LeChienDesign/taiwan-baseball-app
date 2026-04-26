import { createMockLeagueFetcher } from './mockLeague';

export const fetchKboGamesByDate = createMockLeagueFetcher({
  leagueCode: 'KBO',
  leagueLogo: require('../assets/league/kbo.png'),
  teams: [
    { name: 'LG Twins', short: 'LGT', logo: require('../assets/league/kbo.png'), record: '5-1' },
    { name: 'Doosan Bears', short: 'DSB', logo: require('../assets/league/kbo.png'), record: '4-2' },
    { name: 'KIA Tigers', short: 'KIA', logo: require('../assets/league/kbo.png'), record: '3-3' },
    { name: 'SSG Landers', short: 'SSG', logo: require('../assets/league/kbo.png'), record: '3-3' },
    { name: 'Kiwoom Heroes', short: 'KWH', logo: require('../assets/league/kbo.png'), record: '2-4' },
    { name: 'NC Dinos', short: 'NCD', logo: require('../assets/league/kbo.png'), record: '1-5' },
  ],
});