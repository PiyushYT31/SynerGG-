export type PlayerRole = 'IGL' | 'Entry Fragger' | 'Support' | 'Assaulter' | 'Sniper' | 'Substitute';
export type Playstyle = 'Aggressive' | 'Tactical' | 'Balanced' | 'Passive';
export type Device = 'iOS' | 'Android';

export interface PlayerStats {
  assaulting: number;
  igling: number;
  support: number;
  survival: number;
  sniping: number;
}

export interface PovLink {
    id: string;
    name: string;
    url: string;
}

export interface SocialLink {
    id: string;
    name: 'youtube' | 'instagram' | 'twitter';
    url: string;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  playerName: string;
  email: string;
  phoneNumber: string;
  ign: string;
  bgmiUid: string;
  dateOfBirth: string;
  role: PlayerRole;
  experience: string;
  fdRatio: number;
  povLinks: PovLink[];
  idealTeammateStrategy: string;
  playstyle: Playstyle;
  device: Device;
  achievements: string[];
  playerStats?: PlayerStats;
  createdAt: string;
  updatedAt: string;
  profilePictureUrl?: string;
  socialLinks?: SocialLink[];
  isVerified?: boolean;
  verificationScreenshotUrl?: string;
  verification_status?: 'unverified' | 'pending' | 'verified';
  show_verified_badge?: boolean;
  verifiedIgn?: string;
  verifiedUid?: string;
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialLinks?: SocialLink[];
  achievements?: string[];
  teamStyle?: string;
  description?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  email: string;
  phoneNumber?: string;
  owner: string;
  coOwner?: string;
  coach?: string;
  analyst?: string;
}

export interface RosterSlot {
    id: string;
    organizationId: string;
    organizationManagerUserId: string;
    slotName: string;
    status: 'Locked' | 'Vacant' | 'Open for Replacement';
    playerId?: string;
    requiredRole: PlayerRole;
    requiredPlaystyle: Playstyle;
    minFdRatio: number;
    createdAt: string;
    updatedAt: string;
}

export interface TryoutRequest {
    id: string;
    organizationId: string;
    playerId: string;
    playerUserId: string;
    organizationManagerUserId: string;
    status: 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn';
    message?: string;
    sentBy: 'Org' | 'Player';
    sentAt: string;
    respondedAt?: string;
    isReadByPlayer?: boolean;
    isReadByOrg?: boolean;
    mouGeneratedAt?: string;
    mouPlayerConfirmedAt?: string;
    mouOrgConfirmedAt?: string;
}

export interface VODReviewComment {
    id: string;
    povId: string;
    playerId: string;
    organizationId: string;
    organizationManagerUserId: string;
    timestamp: string;
    comment: string;
    createdAt: string;
}

    
