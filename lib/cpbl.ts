import { createMockLeagueFetcher } from './mockLeague';

export const fetchCpblMajorGamesByDate = createMockLeagueFetcher({
  leagueCode: 'CPBL-1',
  leagueLogo: require('../assets/league/cpbl.png'),
  teams: [
    { name: 'CTBC Brothers', short: 'CTB', logo: require('../assets/league/cpbl.png'), record: '4-2' },
    { name: 'Uni-Lions', short: 'ULN', logo: require('../assets/league/cpbl.png'), record: '5-1' },
    { name: 'Rakuten Monkeys', short: 'RKM', logo: require('../assets/league/cpbl.png'), record: '3-3' },
    { name: 'Wei Chuan Dragons', short: 'WCD', logo: require('../assets/league/cpbl.png'), record: '2-4' },
    { name: 'Fubon Guardians', short: 'FBG', logo: require('../assets/league/cpbl.png'), record: '1-5' },
    { name: 'TSG Hawks', short: 'TSG', logo: require('../assets/league/cpbl.png'), record: '3-3' },
  ],
});

export const fetchCpblMinorGamesByDate = createMockLeagueFetcher({
  leagueCode: 'CPBL-2',
  leagueLogo: require('../assets/league/cpbl.png'),
  teams: [
    { name: 'Brothers Farm', short: 'BRF', logo: require('../assets/league/cpbl.png'), record: '4-2' },
    { name: 'Lions Farm', short: 'LIF', logo: require('../assets/league/cpbl.png'), record: '3-3' },
    { name: 'Monkeys Farm', short: 'MKF', logo: require('../assets/league/cpbl.png'), record: '2-4' },
    { name: 'Dragons Farm', short: 'DRF', logo: require('../assets/league/cpbl.png'), record: '5-1' },
    { name: 'Guardians Farm', short: 'GDF', logo: require('../assets/league/cpbl.png'), record: '1-5' },
    { name: 'Hawks Farm', short: 'HKF', logo: require('../assets/league/cpbl.png'), record: '3-3' },
  ],
});