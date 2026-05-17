export type AbroadPlayerManualPatch = {
  number?: string;
  photoKey?: string;
  teamMeta?: {
    league?: string;
    team?: string;
    teamAbbr?: string;
  };
};

export const abroadPlayerManualPatches: Record<string, AbroadPlayerManualPatch> = {
  'huang-chung-hsiang': {
    photoKey: 'chung-hsiang-huang',
  },
  'chia-hao-sung': {
    photoKey: 'chia-hao-song',
  },
  'sung-chia-hao': {
    photoKey: 'chia-hao-song',
  },
};
