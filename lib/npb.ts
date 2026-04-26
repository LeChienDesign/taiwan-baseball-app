import { createMockLeagueFetcher } from './mockLeague';

export const fetchNpbGamesByDate = createMockLeagueFetcher({
  leagueCode: 'NPB',
  leagueLogo: require('../assets/league/npb.png'),
  teams: [
    { name: 'Yomiuri Giants', short: 'YOM', logo: require('../assets/league/npb.png'), record: '4-2' },
    { name: 'Hanshin Tigers', short: 'HAN', logo: require('../assets/league/npb.png'), record: '5-1' },
    { name: 'SoftBank Hawks', short: 'SBH', logo: require('../assets/league/npb.png'), record: '3-3' },
    { name: 'Orix Buffaloes', short: 'ORX', logo: require('../assets/league/npb.png'), record: '2-4' },
    { name: 'Yakult Swallows', short: 'YAK', logo: require('../assets/league/npb.png'), record: '3-3' },
    { name: 'Chunichi Dragons', short: 'CHU', logo: require('../assets/league/npb.png'), record: '1-5' },
  ],
});