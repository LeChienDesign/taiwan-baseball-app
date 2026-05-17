export type AbroadPlayerManualPatch = {
  number?: string;
  photoKey?: string;
  teamMeta?: {
    league?: string;
    team?: string;
    teamAbbr?: string;
  };
};

export const abroadPlayerManualPatches: Record<string, AbroadPlayerManualPatch> = {};
