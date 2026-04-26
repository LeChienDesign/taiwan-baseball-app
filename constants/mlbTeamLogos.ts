export const MLB_TEAM_LOGOS: Record<string, any> = {
  ARI: require('../assets/mlbteams/diamondbacks.png'),
  ATL: require('../assets/mlbteams/braves.png'),
  BAL: require('../assets/mlbteams/orioles.png'),
  BOS: require('../assets/mlbteams/redsox.png'),
  CHC: require('../assets/mlbteams/cubs.png'),
  CWS: require('../assets/mlbteams/whitesox.png'),
  CIN: require('../assets/mlbteams/reds.png'),
  CLE: require('../assets/mlbteams/guardians.png'),
  COL: require('../assets/mlbteams/rockies.png'),
  DET: require('../assets/mlbteams/tigers.png'),
  HOU: require('../assets/mlbteams/astros.png'),
  KC: require('../assets/mlbteams/royals.png'),
  KCR: require('../assets/mlbteams/royals.png'),
  LAA: require('../assets/mlbteams/angels.png'),
  LAD: require('../assets/mlbteams/dodgers.png'),
  MIA: require('../assets/mlbteams/marlins.png'),
  MIL: require('../assets/mlbteams/brewers.png'),
  MIN: require('../assets/mlbteams/twins.png'),
  NYM: require('../assets/mlbteams/mets.png'),
  NYY: require('../assets/mlbteams/yankees.png'),
  OAK: require('../assets/mlbteams/athletics.png'),
  ATH: require('../assets/mlbteams/athletics.png'),
  PHI: require('../assets/mlbteams/phillies.png'),
  PIT: require('../assets/mlbteams/pirates.png'),
  SD: require('../assets/mlbteams/padres.png'),
  SDP: require('../assets/mlbteams/padres.png'),
  SEA: require('../assets/mlbteams/mariners.png'),
  SF: require('../assets/mlbteams/giants.png'),
  SFG: require('../assets/mlbteams/giants.png'),
  STL: require('../assets/mlbteams/cardinals.png'),
  TB: require('../assets/mlbteams/rays.png'),
  TBR: require('../assets/mlbteams/rays.png'),
  TEX: require('../assets/mlbteams/rangers.png'),
  TOR: require('../assets/mlbteams/bluejays.png'),
  WSH: require('../assets/mlbteams/nationals.png'),
  WAS: require('../assets/mlbteams/nationals.png'),
};

export function getMlbTeamLogo(team: {
  abbreviation?: string;
  teamCode?: string;
  fileCode?: string;
  name?: string;
}) {
  const candidates = [
    team?.abbreviation,
    team?.teamCode,
    team?.fileCode,
  ]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase());

  for (const key of candidates) {
    if (MLB_TEAM_LOGOS[key]) return MLB_TEAM_LOGOS[key];
  }

  const byName = String(team?.name || '').toLowerCase();

  if (byName.includes('diamondbacks')) return MLB_TEAM_LOGOS.ARI;
  if (byName.includes('braves')) return MLB_TEAM_LOGOS.ATL;
  if (byName.includes('orioles')) return MLB_TEAM_LOGOS.BAL;
  if (byName.includes('red sox')) return MLB_TEAM_LOGOS.BOS;
  if (byName.includes('cubs')) return MLB_TEAM_LOGOS.CHC;
  if (byName.includes('white sox')) return MLB_TEAM_LOGOS.CWS;
  if (byName.includes('reds')) return MLB_TEAM_LOGOS.CIN;
  if (byName.includes('guardians')) return MLB_TEAM_LOGOS.CLE;
  if (byName.includes('rockies')) return MLB_TEAM_LOGOS.COL;
  if (byName.includes('tigers')) return MLB_TEAM_LOGOS.DET;
  if (byName.includes('astros')) return MLB_TEAM_LOGOS.HOU;
  if (byName.includes('royals')) return MLB_TEAM_LOGOS.KC;
  if (byName.includes('angels')) return MLB_TEAM_LOGOS.LAA;
  if (byName.includes('dodgers')) return MLB_TEAM_LOGOS.LAD;
  if (byName.includes('marlins')) return MLB_TEAM_LOGOS.MIA;
  if (byName.includes('brewers')) return MLB_TEAM_LOGOS.MIL;
  if (byName.includes('twins')) return MLB_TEAM_LOGOS.MIN;
  if (byName.includes('mets')) return MLB_TEAM_LOGOS.NYM;
  if (byName.includes('yankees')) return MLB_TEAM_LOGOS.NYY;
  if (byName.includes('athletics')) return MLB_TEAM_LOGOS.OAK;
  if (byName.includes('phillies')) return MLB_TEAM_LOGOS.PHI;
  if (byName.includes('pirates')) return MLB_TEAM_LOGOS.PIT;
  if (byName.includes('padres')) return MLB_TEAM_LOGOS.SD;
  if (byName.includes('mariners')) return MLB_TEAM_LOGOS.SEA;
  if (byName.includes('giants')) return MLB_TEAM_LOGOS.SF;
  if (byName.includes('cardinals')) return MLB_TEAM_LOGOS.STL;
  if (byName.includes('rays')) return MLB_TEAM_LOGOS.TB;
  if (byName.includes('rangers')) return MLB_TEAM_LOGOS.TEX;
  if (byName.includes('blue jays')) return MLB_TEAM_LOGOS.TOR;
  if (byName.includes('nationals')) return MLB_TEAM_LOGOS.WSH;

  return null;
}
export function getMlbTeamLogoByKey(logoKey?: string | null) {
  if (!logoKey) return null;
  const key = String(logoKey).toUpperCase();
  return MLB_TEAM_LOGOS[key] ?? null;
}