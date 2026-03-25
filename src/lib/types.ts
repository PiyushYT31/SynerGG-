export type PlayerRole = 'IGL' | 'Entry Fragger' | 'Support' | 'Assaulter' | 'Sniper';

export type RosterStatus = 'Locked' | 'Vacant' | 'Open for Replacement';

export type Playstyle = 'Aggressive' | 'Tactical' | 'Passive' | 'Edge-Player' | 'Drop-Clasher' | 'Center-Zone';

export type Device = 'iOS' | 'Android';

export type Player = {
  id: string;
  ign: string;
  role: PlayerRole;
  experience: string;
  fdRatio: number;
  highlightsURL: string;
  synergyNeeds: string;
  device: Device;
  playstyle: Playstyle[];
  avatarUrl: string;
};

export type RosterSlot = {
  player: Pick<Player, 'id' | 'ign' | 'role' | 'avatarUrl'> | null;
  status: RosterStatus;
  role: PlayerRole;
};

export type Team = {
  id: string;
  orgName: string;
  logoUrl: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  achievements: string[];
  roster: RosterSlot[];
  teamStyle: string;
  bio: string;
};
