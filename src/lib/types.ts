export interface PlayerProfile {
  id: string;
  userId: string;
  ign: string;
  role: string;
  experience: string;
  fdRatio: number;
  highlightsUrl: string;
  synergyNeeds: string;
  playstyle: string;
  device: string;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationProfile {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;
  socialLinks?: string[];
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
