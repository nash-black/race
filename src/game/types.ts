/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type GameMode = 'endless' | 'time_trial' | 'daily_challenge' | 'drift_king' | 'multiplayer' | 'cup_race' | 'duel';
export type TimeOfDay = 'day' | 'sunset' | 'night';

export type VehicleType = 'player' | 'sedan' | 'coupe' | 'truck' | 'police' | 'taxi' | 'rival';

export type CarBodyStyle = 'sports' | 'hyper' | 'tuner' | 'muscle' | 'gt3' | 'prototype' | 'police' | 'concept';

export type TrackId = 'tokyo_midnight' | 'coastline_sunset' | 'akina_touge' | 'cyber_desert';

export interface TrackConfig {
  id: TrackId;
  name: string;
  subtitle: string;
  timeOfDay: TimeOfDay;
  roadColor: string;
  shoulderColor: string;
  groundColor: string;
  skyColor: string;
  fogColor: string;
  curvatureFactor: number;
  sceneryType: 'palm' | 'lamp' | 'sakura' | 'canyon';
  previewBadge: string;
}

export const TRACKS: TrackConfig[] = [
  {
    id: 'tokyo_midnight',
    name: 'Tokyo Midnight Expressway',
    subtitle: 'Rain-slicked asphalt, towering neon skyscrapers & high-speed junctions',
    timeOfDay: 'night',
    roadColor: '#1e293b',
    shoulderColor: '#334155',
    groundColor: '#090d16',
    skyColor: '#030712',
    fogColor: '#0f172a',
    curvatureFactor: 1.0,
    sceneryType: 'lamp',
    previewBadge: 'NIGHT RUN',
  },
  {
    id: 'coastline_sunset',
    name: 'Coastline Pacific Highway',
    subtitle: 'Golden hour cliffside ocean roads with sweeping curves and palm trees',
    timeOfDay: 'sunset',
    roadColor: '#334155',
    shoulderColor: '#64748b',
    groundColor: '#451a03',
    skyColor: '#9a3412',
    fogColor: '#7c2d12',
    curvatureFactor: 0.85,
    sceneryType: 'palm',
    previewBadge: 'OCEAN DRIFT',
  },
  {
    id: 'akina_touge',
    name: 'Akina Mountain Touge',
    subtitle: 'Technical mountain hairpins, deep fog, and cherry blossom trees',
    timeOfDay: 'night',
    roadColor: '#172554',
    shoulderColor: '#1e3a8a',
    groundColor: '#14532d',
    skyColor: '#090d16',
    fogColor: '#1e1b4b',
    curvatureFactor: 1.45,
    sceneryType: 'sakura',
    previewBadge: 'TECHNICAL',
  },
  {
    id: 'cyber_desert',
    name: 'Neon Canyon Desert Run',
    subtitle: 'Blistering desert straightaways with red canyon walls and glowing pylons',
    timeOfDay: 'day',
    roadColor: '#262626',
    shoulderColor: '#78350f',
    groundColor: '#451a03',
    skyColor: '#78716c',
    fogColor: '#57534e',
    curvatureFactor: 0.7,
    sceneryType: 'canyon',
    previewBadge: 'TOP SPEED',
  },
];

export interface CarUpgrades {
  turboStage: number; // 0 - 3 (+Top Speed)
  ecuStage: number; // 0 - 3 (+Acceleration)
  coiloversStage: number; // 0 - 3 (+Handling & Drift Factor)
  armorStage: number; // 0 - 3 (+Armor & Ramming)
  nitroStage: number; // 0 - 3 (+Nitro recharge & capacity)
}

export interface CarSkin {
  id: string;
  name: string;
  tagline: string;
  bodyStyle: CarBodyStyle;
  primary: string;
  secondary: string;
  accent: string;
  glass: string;
  glow: string;
  // Performance attributes (0 - 100 benchmark)
  topSpeed: number;
  acceleration: number;
  handling: number;
  driftMultiplier: number;
  weight: number; // kg feel (affects ramming & inertia)
  armor: number; // damage resistance
  nitroRecharge: number; // 0.8x to 1.5x
  cost: number; // gold coins to unlock
  badge: string;
  perkTitle: string;
  perkDescription: string;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  carId: string;
  carName: string;
  price: number;
  upgrades: CarUpgrades;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  rating: number;
  listedAt: string;
  badge: string;
}

export interface OnlineCup {
  id: string;
  title: string;
  subtitle: string;
  minRank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  entryFee: number;
  prizeCoins: number;
  specialReward?: string;
  trackId: TrackId;
  mode: 'sprint' | 'drift_battle';
  badge: string;
  participantsCount: number;
}

export interface BountyRacer {
  id: string;
  name: string;
  bounty: number;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  rankTitle: string;
  wins: number;
  losses: number;
  winStreak: number;
  carId: string;
  isOnline: boolean;
  isLocalWifi?: boolean;
}

export interface RaceChallengeInvite {
  id: string;
  fromId: string;
  fromName: string;
  fromRank: string;
  fromBounty: number;
  fromCarId: string;
  trackId: TrackId;
  wagerCoins: number;
  wagerPinkSlip: boolean;
  wagerCarId?: string;
  mode: 'sprint' | 'drift_battle';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRank: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RemoteRacer {
  id: string;
  name: string;
  carId: string;
  color: string;
  secondaryColor?: string;
  x: number;
  distance: number;
  speed: number;
  angle: number;
  driftScore: number;
  score: number;
  isDrifting: boolean;
  isNitro: boolean;
  health: number;
  lastUpdate: number;
  rank?: string;
  bounty?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: 'drift' | 'speed' | 'distance' | 'tactical';
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  icon: string;
  badge: string;
}

export interface Vehicle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  type: VehicleType;
  color: string;
  secondaryColor: string;
  angle: number; // in radians, for steering tilt
  targetAngle: number;
  lane: number;
  targetLane: number;
  blinker: 'left' | 'right' | null;
  blinkerTimer: number;
  sirenTimer: number;
  passedPlayer: boolean;
  nearMissAwarded: boolean;
  isBlasted?: boolean;
  blastVx?: number;
  blastVy?: number;
  blastRot?: number;
  tipAngle?: number;
  isOverturned?: boolean;
  remoteRacerId?: string;
  remoteRacerName?: string;
}

export type ParticleType =
  | 'smoke'
  | 'spark'
  | 'flame'
  | 'debris'
  | 'tire_track'
  | 'speed_line'
  | 'shield_shockwave'
  | 'boost_burst'
  | 'sakura_petal'
  | 'sand_dust';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: ParticleType;
  rotation?: number;
  vRot?: number;
}

export type PickupType = 'coin' | 'nitro' | 'repair' | 'speed_boost' | 'shield';

export interface Pickup {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PickupType;
  bobTimer: number;
  collected: boolean;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  scale: number;
}

export interface RoadsideObject {
  id: number;
  side: 'left' | 'right';
  x: number;
  y: number;
  type: 'lamp' | 'palm' | 'sign' | 'speed_camera' | 'sakura' | 'canyon';
  label?: string;
}

export interface SkidMark {
  x: number;
  y: number;
  width: number;
  length: number;
  alpha: number;
  color?: string;
}

export interface GameStats {
  score: number;
  highScore: number;
  distance: number; // in meters
  coins: number;
  speedMph: number;
  topSpeedMph: number;
  health: number; // 0 - 100
  nitro: number; // 0 - 100
  combo: number;
  comboTimer: number;
  closeCalls: number;
  driftScore: number;
  driftChain: number;
  bestDriftChain: number;
  driftMultiplier: number;
  driftAngleDegrees: number;
  slipAngle: number;
  isDrifting: boolean;
  isHandbraking: boolean;
  counterSteerQuality: 'PERFECT' | 'GREAT' | 'GOOD' | null;
  gForce: number;
  bodyRoll: number;
  pitchAngle: number;
  rpm: number;
  gear: number;
  raceTime: number;
  timeRemaining: number;
  challengeProgress: number;
  junctionDistance: number;
  routeChoice: 'left' | 'right' | null;
  routesTaken: number;
  // Active power-up states
  speedBoostActive: boolean;
  speedBoostTimer: number;
  shieldActive: boolean;
  shieldTimer: number;
  // Multiplayer real-time rankings & Wagers
  multiplayerRank: number;
  multiplayerTotal: number;
  rivals: RemoteRacer[];
  wagerCoins: number;
  wagerPinkSlip: boolean;
  wagerCarId?: string;
  activeTrackId: TrackId;
  // Minimap track curve telemetry
  trackMapCurve: number;
  trackProgressPct: number;
  duelWinner?: string;
}

export interface GameSettings {
  masterVolume: number;
  steeringSensitivity: number;
  steeringDeadzone: number;
  reducedMotion: boolean;
  highContrast: boolean;
  colorblindPickups: boolean;
  largeHud: boolean;
  touchSteering: boolean;
  touchControlScale: number;
  showTutorial: boolean;
  haptics: boolean;
  showFPS: boolean;
  showMinimap: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  nitro: boolean;
  brake: boolean;
  handbrake: boolean;
  analogSteer: number; // -1 to 1 for smooth analog joystick/gamepad/mouse-wheel
}
