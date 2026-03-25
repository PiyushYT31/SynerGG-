import type { Player, Team } from './types';

export const players: Player[] = [
  {
    id: 'p1',
    ign: 'JONATHAN',
    role: 'Assaulter',
    experience: '4 Years Pro',
    fdRatio: 2.8,
    highlightsURL: 'https://www.youtube.com/watch?v=sB6_i-gY94A',
    synergyNeeds: 'I am a primary fragger who excels in close-quarters combat. I need an IGL who can create space and a support player who can trade me effectively. My ideal team plays aggressively and takes early fights.',
    device: 'iOS',
    playstyle: ['Aggressive', 'Drop-Clasher'],
    avatarUrl: 'https://picsum.photos/seed/jonathan/200/200'
  },
  {
    id: 'p2',
    ign: 'Scout',
    role: 'Entry Fragger',
    experience: '5 Years Pro',
    fdRatio: 2.5,
    highlightsURL: 'https://www.youtube.com/watch?v=O13a-TqF87k',
    synergyNeeds: 'I am an entry fragger and flanker. I thrive in a fast-paced environment and need a team that supports my aggressive pushes. A tactical IGL who is decisive is a must.',
    device: 'iOS',
    playstyle: ['Aggressive', 'Edge-Player'],
    avatarUrl: 'https://picsum.photos/seed/scout/200/200'
  },
  {
    id: 'p3',
    ign: 'Mavi',
    role: 'IGL',
    experience: '5 Years Pro',
    fdRatio: 1.5,
    highlightsURL: 'https://www.youtube.com/watch?v=Vq0tS0p3P_A',
    synergyNeeds: 'As an IGL, I prefer a tactical, zone-focused gameplay. I need assaulters who are disciplined and can hold compounds. My ideal team values placement points over kill points.',
    device: 'iOS',
    playstyle: ['Tactical', 'Center-Zone'],
    avatarUrl: 'https://picsum.photos/seed/mavi/200/200'
  },
  {
    id: 'p4',
    ign: 'ZGod',
    role: 'Support',
    experience: '4 Years Pro',
    fdRatio: 1.8,
    highlightsURL: 'https://www.youtube.com/watch?v=Y-Tjo5g9y7k',
    synergyNeeds: 'I am a versatile support player. I can provide cover fire, revive teammates, and clutch in late-game scenarios. I fit well in teams that have strong communication and a clear strategy.',
    device: 'Android',
    playstyle: ['Tactical', 'Passive'],
    avatarUrl: 'https://picsum.photos/seed/zgod/200/200'
  },
  {
    id: 'p5',
    ign: 'ClutchGod',
    role: 'IGL',
    experience: '4 Years Pro',
    fdRatio: 2.1,
    highlightsURL: 'https://www.youtube.com/watch?v=4Qvh5n8A1lI',
    synergyNeeds: 'I lead from the front with aggressive calls. Looking for fearless entry fraggers and a solid support who can keep up with a high-octane, rush-heavy playstyle. We fight for every compound.',
    device: 'iOS',
    playstyle: ['Aggressive', 'Drop-Clasher'],
    avatarUrl: 'https://picsum.photos/seed/clutchgod/200/200'
  },
  {
    id: 'p6',
    ign: 'SHADOW',
    role: 'Sniper',
    experience: '3 Years Pro',
    fdRatio: 1.9,
    highlightsURL: 'https://www.youtube.com/watch?v=0_q_iCgN_2Q',
    synergyNeeds: 'I am a patient sniper who excels at holding ridges and providing long-range information. I need a team that plays around zone edges and allows me to control key sightlines. Tactical and slow-paced gameplay is preferred.',
    device: 'Android',
    playstyle: ['Tactical', 'Edge-Player'],
    avatarUrl: 'https://picsum.photos/seed/shadow/200/200'
  },
  {
    id: 'p7',
    ign: 'Astra',
    role: 'Support',
    experience: '2 Years Semi-Pro',
    fdRatio: 2.2,
    highlightsURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    synergyNeeds: 'Dedicated support player focused on team utility and survivability. I need an IGL who communicates clearly and entry fraggers who don\'t overextend without backup. My goal is to enable my team to succeed.',
    device: 'iOS',
    playstyle: ['Passive', 'Center-Zone'],
    avatarUrl: 'https://picsum.photos/seed/astra/200/200'
  },
];

export const teams: Team[] = [
  {
    id: 't1',
    orgName: 'Team SouL',
    logoUrl: 'https://picsum.photos/seed/teamsoul/200/200',
    socialLinks: {},
    achievements: ['BMPS 2022 Winners', 'PMIS 2019 Winners'],
    bio: 'One of the most decorated and fan-favorite teams in India, known for their aggressive gameplay and star-studded lineups.',
    teamStyle: 'We are an aggressive team that believes in dominating the lobby through firepower. Our strategy revolves around drop clashes and hunting other teams. We are looking for players who are mechanically gifted and not afraid to take fights.',
    roster: [
      { role: 'IGL', player: { id: 'p5', ign: 'ClutchGod', role: 'IGL', avatarUrl: 'https://picsum.photos/seed/clutchgod/200/200' }, status: 'Locked' },
      { role: 'Entry Fragger', player: { id: 'p2', ign: 'Scout', role: 'Entry Fragger', avatarUrl: 'https://picsum.photos/seed/scout/200/200' }, status: 'Locked' },
      { role: 'Assaulter', player: { id: 'p1', ign: 'JONATHAN', role: 'Assaulter', avatarUrl: 'https://picsum.photos/seed/jonathan/200/200' }, status: 'Locked' },
      { role: 'Support', player: null, status: 'Vacant' },
      { role: 'Sniper', player: null, status: 'Open for Replacement' }
    ]
  },
  {
    id: 't2',
    orgName: 'GodLike Esports',
    logoUrl: 'https://picsum.photos/seed/godlike/200/200',
    socialLinks: {},
    achievements: ['PMCO 2021 India Winners', 'LOCO War of Glory Winners'],
    bio: 'A powerhouse organization in Indian esports, GodLike is known for its tactical approach and consistent performances.',
    teamStyle: 'Our team focuses on a tactical and balanced approach. We prioritize getting to the center of the zone and setting up a strong defense. We value smart rotations and end-game performance over early-game aggression.',
    roster: [
      { role: 'IGL', player: { id: 'p3', ign: 'Mavi', role: 'IGL', avatarUrl: 'https://picsum.photos/seed/mavi/200/200' }, status: 'Locked' },
      { role: 'Entry Fragger', player: null, status: 'Vacant' },
      { role: 'Assaulter', player: null, status: 'Vacant' },
      { role: 'Support', player: { id: 'p4', ign: 'ZGod', role: 'Support', avatarUrl: 'https://picsum.photos/seed/zgod/200/200' }, status: 'Locked' },
      { role: 'Sniper', player: { id: 'p6', ign: 'SHADOW', role: 'Sniper', avatarUrl: 'https://picsum.photos/seed/shadow/200/200' }, status: 'Locked' }
    ]
  },
  {
    id: 't3',
    orgName: 'TSM India',
    logoUrl: 'https://picsum.photos/seed/tsm/200/200',
    socialLinks: {},
    achievements: ['Skyesports Championship 3.0 Winners'],
    bio: 'The Indian division of the global giant TSM, focusing on raw talent and aggressive strategies.',
    teamStyle: 'We play an edge-of-zone, aggressive style. Our goal is to clear out one side of the map and gatekeep teams rotating in. We need self-sufficient fraggers who can win their 1v1s and an IGL who can track team movements across the map.',
    roster: [
        { role: 'IGL', player: null, status: 'Vacant' },
        { role: 'Entry Fragger', player: null, status: 'Vacant' },
        { role: 'Assaulter', player: null, status: 'Vacant' },
        { role: 'Support', player: null, status: 'Vacant' },
        { role: 'Sniper', player: null, status: 'Vacant' }
    ]
  },
  {
    id: 't4',
    orgName: 'Blind Esports',
    logoUrl: 'https://picsum.photos/seed/blind/200/200',
    socialLinks: {},
    achievements: ['BMPS 2023 Winners', 'Upthrust Esports Pro Showdown S2 Winners'],
    bio: 'A dominant force in recent BGMI tournaments, known for their unpredictable and highly aggressive playstyle.',
    teamStyle: 'Pure, unadulterated aggression. We hot-drop, we crash compounds, and we believe the best defense is a relentless offense. We need mechanically cracked players who have ice in their veins and thrive in chaos.',
    roster: [
        { role: 'IGL', player: null, status: 'Open for Replacement' },
        { role: 'Entry Fragger', player: { id: 'p5', ign: 'ClutchGod', role: 'IGL', avatarUrl: 'https://picsum.photos/seed/clutchgod/200/200' }, status: 'Locked' },
        { role: 'Assaulter', player: null, status: 'Vacant' },
        { role: 'Support', player: null, status: 'Vacant' },
        { role: 'Sniper', player: { id: 'p6', ign: 'SHADOW', role: 'Sniper', avatarUrl: 'https://picsum.photos/seed/shadow/200/200' }, status: 'Locked' },
    ]
  }
];
