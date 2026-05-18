import abroadPlayersLivePayload from '../server/data/abroadPlayers.live.json';
import { abroadPlayerManualPatches } from './manual/abroadPlayerManualPatches';
import { TEAM_META, inferTeamMeta } from './teamMetaRegistry';
export type PlayerStatus = '今日出賽' | '預告先發' | '已完賽' | '傷兵' | '待命' | '大聯盟出賽';
export type PlayerType = 'pitcher' | 'hitter';

export type AbroadTeamMeta = {
  id?: number;
  code?: string;
  abbreviation?: string;
  logoKey?: string;
  logoUrl?: string;
  displayName?: string;
  leagueGroup?: 'MLB' | 'MiLB' | 'NPB' | 'KBO' | 'Farm' | 'Other';
};

export type AbroadPlayer = {
  id: string;
  name: string;
  enName: string;
  team: string;
  league: string;
  level: string;
  position: string;
  bats: string;
  throws: string;
  age: number;
  number: string;
  status: PlayerStatus;
  intro: string;
  type: PlayerType;
  teamColor: string;

  teamMeta?: AbroadTeamMeta;

  trending?: boolean;
  line1?: string;
  line2?: string;
  recentNote?: string;

  nextGame?: {
    date?: string;
    opponent?: string;
    status?: string;
    venue?: string;
  };

  seasonStats?: {
    hitter?: {
      avg: string;
      obp: string;
      slg: string;
      ops: string;
      hr: number;
      rbi: number;
      sb: number;
      hits: number;
    };
    pitcher?: {
      era: string;
      whip: string;
      ip: string;
      so: number;
      bb: number;
      wins: number;
      saves: number;
      losses?: number;
      holds?: number;
      games?: number;
      battersFaced?: number;
      hitByPitch?: number;
      hits?: number;
      homeRuns?: number;
      runs?: number;
      earnedRuns?: number;
      winningPercentage?: string;
    };
  };

  recentGames?: Array<{
    date: string;
    opponent: string;
    result: string;
    detail1: string;
    detail2: string;
  }>;

  news?: Array<{
    id: string;
    title: string;
    date: string;
    tag: string;
    summary: string;
    url?: string;
    source?: string;
  }>;

  career?: Array<{
    year: string;
    team: string;
    level: string;
    note: string;
  }>;

  officialPlayerUrl?: string;
  officialPhotoUrl?: string;
  photoKey?: string;
  officialPersonId?: number;
};

type PlayerSeedInput = Omit<
  AbroadPlayer,
  'type' | 'news' | 'career'
> & {
  trending?: boolean;
  line1?: string;
  line2?: string;
  recentNote?: string;
};

export const abroadSummary = {
  todayGames: 0,
  finals: 0,
  probableStarters: 0,
  injured: 0,
};

function makePitcher(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'pitcher',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: input.seasonStats ?? {
      pitcher: {
        era: '—',
        whip: '—',
        ip: '—',
        so: 0,
        bb: 0,
        wins: 0,
        saves: 0,
      },
    },
    recentGames: input.recentGames ?? [],
    news: [],
    career: [],
  };
}

function makeHitter(input: PlayerSeedInput): AbroadPlayer {
  return {
    ...input,
    type: 'hitter',
    teamMeta: input.teamMeta ?? inferTeamMeta(input),
    seasonStats: input.seasonStats ?? {
      hitter: {
        avg: '—',
        obp: '—',
        slg: '—',
        ops: '—',
        hr: 0,
        rbi: 0,
        sb: 0,
        hits: 0,
      },
    },
    recentGames: input.recentGames ?? [],
    news: [],
    career: [],
  };
}

function normalizeAbroadPlayer(player: AbroadPlayer): AbroadPlayer {
  return {
    ...player,
    number: player.number === '—' ? '' : player.number,
  };
}

function applyManualPatch(player: AbroadPlayer): AbroadPlayer {
  const patch = abroadPlayerManualPatches[player.id];

  if (!patch) {
    return player;
  }

  return {
    ...player,
    number: patch.number ?? player.number,
    photoKey: patch.photoKey ?? player.photoKey,
    teamMeta: patch.teamMeta
      ? {
          ...player.teamMeta,
          ...patch.teamMeta,
        }
      : player.teamMeta,
  };
}

const supplementalAbroadPlayers: AbroadPlayer[] = [
  makeHitter({
    id: 'corbin-carroll',
    name: 'Corbin Carroll',
    enName: 'Corbin Carroll',
    team: 'Arizona Diamondbacks',
    league: 'MLB',
    level: 'MLB',
    position: 'OF',
    bats: 'L',
    throws: 'L',
    age: 25,
    number: '7',
    status: '待命',
    intro: '台裔外野手，效力亞利桑那響尾蛇。',
    teamColor: '#A71930',
    teamMeta: TEAM_META.diamondbacks,
    officialPlayerUrl: 'https://www.mlb.com/player/corbin-carroll-682998',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/w_360,q_auto:best/v1/people/682998/headshot/67/current',
    officialPersonId: 682998,
  }),
  makeHitter({
    id: 'stuart-fairchild',
    name: 'Stuart Fairchild',
    enName: 'Stuart Fairchild',
    team: 'Cleveland Guardians',
    league: 'MiLB',
    level: 'AAA',
    position: 'OF',
    bats: 'R',
    throws: 'R',
    age: 30,
    number: '7',
    status: '待命',
    intro: '台裔外野手，目前列入旅外觀察名單。',
    teamColor: '#00385D',
    teamMeta: TEAM_META.guardians,
    officialPlayerUrl: 'https://www.mlb.com/player/stuart-fairchild-656413',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/w_360,q_auto:best/v1/people/656413/headshot/67/current',
    officialPersonId: 656413,
  }),
  makeHitter({
    id: 'jonathon-long',
    name: 'Jonathon Long',
    enName: 'Jonathon Long',
    team: 'Chicago Cubs',
    league: 'MiLB',
    level: 'Triple-A',
    position: '1B/IF',
    bats: 'R',
    throws: 'R',
    age: 24,
    number: '24',
    status: '待命',
    intro: '台裔內野手，小熊體系旅外觀察球員。',
    teamColor: '#0E3386',
    teamMeta: TEAM_META.cubs,
    officialPlayerUrl: 'https://www.milb.com/player/jonathon-long-675085',
    officialPhotoUrl: 'https://img.mlbstatic.com/mlb-photos/image/upload/c_fill,g_auto/w_180/v1/people/675085/headshot/milb/current',
    officialPersonId: 675085,
  }),
];

const supplementalAbroadPlayerMap = new Map(
  supplementalAbroadPlayers.map((player) => [player.id, normalizeAbroadPlayer(player)])
);

const liveAbroadPlayers = (abroadPlayersLivePayload.players as AbroadPlayer[]).map((player) => {
  const livePlayer = normalizeAbroadPlayer(player);
  const supplementalPlayer = supplementalAbroadPlayerMap.get(livePlayer.id);

  return applyManualPatch({
    ...livePlayer,
    number: String(supplementalPlayer?.number ?? '').trim() || livePlayer.number,
  });
});

const livePlayerIds = new Set(liveAbroadPlayers.map((player) => player.id));

export const abroadPlayers = [
  ...liveAbroadPlayers,
  ...supplementalAbroadPlayers
    .filter((player) => !livePlayerIds.has(player.id))
    .map(normalizeAbroadPlayer)
    .map(applyManualPatch),
];
