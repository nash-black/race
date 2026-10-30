import { CarSkin, CarUpgrades, Challenge, GameMode, GameSettings, TrackId } from '../game/types';

export const SETTINGS_KEY = 'turbo_horizon_settings';
export const PROGRESS_KEY = 'turbo_horizon_progress';
export const CHALLENGES_KEY = 'turbo_horizon_challenges';
export const DAILY_CHALLENGE_TARGET = 8;
export const TIME_TRIAL_SECONDS = 90;

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.65,
  steeringSensitivity: 1,
  steeringDeadzone: 0.05,
  reducedMotion: false,
  highContrast: false,
  colorblindPickups: false,
  largeHud: false,
  touchSteering: false,
  touchControlScale: 1,
  showTutorial: true,
  haptics: true,
  showFPS: false,
  showMinimap: true,
};

export const UPGRADE_COSTS = {
  1: 150,
  2: 350,
  3: 750,
};

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'drift_initiate',
    title: 'First Angle',
    description: 'Score 2,500 drift points in a single run.',
    category: 'drift',
    target: 2500,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 100,
    icon: 'Flame',
    badge: 'BRONZE',
  },
  {
    id: 'drift_chain_master',
    title: 'Touge Slide King',
    description: 'Maintain an unbroken drift chain for at least 5.0 seconds.',
    category: 'drift',
    target: 5,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 250,
    icon: 'Zap',
    badge: 'SILVER',
  },
  {
    id: 'drift_legend',
    title: 'Akina Royalty',
    description: 'Score 25,000 drift points in a single session.',
    category: 'drift',
    target: 25000,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 500,
    icon: 'Trophy',
    badge: 'GOLD',
  },
  {
    id: 'speed_130',
    title: 'Breaking the Limit',
    description: 'Reach a top speed of 130 MPH.',
    category: 'speed',
    target: 130,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 120,
    icon: 'Gauge',
    badge: 'BRONZE',
  },
  {
    id: 'close_calls_10',
    title: 'Adrenaline Junkie',
    description: 'Perform 10 high-speed close calls / near-misses.',
    category: 'speed',
    target: 10,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 200,
    icon: 'ShieldAlert',
    badge: 'SILVER',
  },
  {
    id: 'speed_demon_160',
    title: 'Hyper Velocity',
    description: 'Surpass 160 MPH using Nitro or Speed Boost.',
    category: 'speed',
    target: 160,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 350,
    icon: 'Rocket',
    badge: 'GOLD',
  },
  {
    id: 'distance_3000',
    title: 'Highway Cruiser',
    description: 'Travel 3,000 meters in a single highway run.',
    category: 'distance',
    target: 3000,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 150,
    icon: 'Compass',
    badge: 'BRONZE',
  },
  {
    id: 'junctions_6',
    title: 'Highway Navigator',
    description: 'Successfully execute 6 high-speed highway fork junction turns.',
    category: 'distance',
    target: 6,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 280,
    icon: 'GitFork',
    badge: 'SILVER',
  },
  {
    id: 'distance_10000',
    title: 'Coast to Coast',
    description: 'Reach an epic milestone distance of 10,000 meters.',
    category: 'distance',
    target: 10000,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 600,
    icon: 'Flag',
    badge: 'PLATINUM',
  },
  {
    id: 'coins_50',
    title: 'Treasure Hauler',
    description: 'Collect 50 gold coins during one highway run.',
    category: 'tactical',
    target: 50,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 200,
    icon: 'Coins',
    badge: 'BRONZE',
  },
  {
    id: 'ram_destroyer',
    title: 'Battering Ram',
    description: 'Blast or knock aside 5 civilian traffic vehicles using Shield or heavy impact.',
    category: 'tactical',
    target: 5,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 350,
    icon: 'Bomb',
    badge: 'SILVER',
  },
  {
    id: 'multiplayer_racer',
    title: 'Multiplayer Challenger',
    description: 'Compete in a live multiplayer highway room race.',
    category: 'tactical',
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    rewardCoins: 300,
    icon: 'Users',
    badge: 'GOLD',
  },
];

export interface CustomCarStyle {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  underglowColor?: string;
  underglowEnabled?: boolean;
  spoilerStyle?: 'stock' | 'gt_wing' | 'ducktail' | 'drag';
  wheelStyle?: 'stock' | 'tuner5' | 'deep_dish' | 'gold_jdm';
  finish?: 'gloss' | 'metallic' | 'matte' | 'chameleon';
  decalPreset?: 'none' | 'tokyo_drift' | 'twin_stripes' | 'dragon_flames' | 'cyber_hex' | 'sponsor_racing';
  customDecalUrl?: string;
  customModelUrl?: string;
}

export interface PlayerProgress {
  bankedCoins: number;
  unlockedSkins: string[];
  selectedSkinId: string;
  driverName: string;
  driverTag: string; // e.g. #2841
  bounty: number;
  rankPoints: number;
  wins: number;
  losses: number;
  winStreak: number;
  activeTrackId: TrackId;
  carUpgrades: Record<string, CarUpgrades>;
  customCarStyles?: Record<string, CustomCarStyle>;
  wonPinkSlips: string[];
  bestScores: Record<GameMode, number>;
  tutorialSeen: boolean;
  dailyChallengeDate: string;
  dailyChallengeCompleted: boolean;
  challenges: Record<string, { current: number; completed: boolean; claimed: boolean }>;
}

export const DEFAULT_CAR_UPGRADES: CarUpgrades = {
  turboStage: 0,
  ecuStage: 0,
  coiloversStage: 0,
  armorStage: 0,
  nitroStage: 0,
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  bankedCoins: 500, // Generous starting balance to try upgrades and wagers
  unlockedSkins: ['crimson_fury'],
  selectedSkinId: 'crimson_fury',
  driverName: 'Racer 01',
  driverTag: `#${Math.floor(1000 + Math.random() * 9000)}`,
  bounty: 1500,
  rankPoints: 120,
  wins: 0,
  losses: 0,
  winStreak: 0,
  activeTrackId: 'tokyo_midnight',
  carUpgrades: {
    crimson_fury: { ...DEFAULT_CAR_UPGRADES },
  },
  wonPinkSlips: [],
  bestScores: {
    endless: 0,
    time_trial: 0,
    daily_challenge: 0,
    drift_king: 0,
    multiplayer: 0,
    cup_race: 0,
    duel: 0,
  },
  tutorialSeen: false,
  dailyChallengeDate: '',
  dailyChallengeCompleted: false,
  challenges: {},
};

export const SKIN_UNLOCK_COSTS: Record<string, number> = {
  crimson_fury: 0,
  cyber_volt: 80,
  midnight_shadow: 160,
  hyper_gold: 260,
  emerald_apex: 400,
  phantom_valkyrie: 550,
  muscle_69: 700,
  drift_meister: 850,
  solar_horizon: 1000,
  urban_enforcer: 1200,
};

export function getRankFromPoints(points: number): { rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S'; title: string } {
  if (points >= 10000) return { rank: 'S', title: 'Apex Legend' };
  if (points >= 6500) return { rank: 'A', title: 'Drift Master' };
  if (points >= 3500) return { rank: 'B', title: 'Highway Phantom' };
  if (points >= 1500) return { rank: 'C', title: 'Pro Tuner' };
  if (points >= 500) return { rank: 'D', title: 'Street Racer' };
  return { rank: 'E', title: 'Rookie' };
}

export function calculateCarStatsWithUpgrades(skin: CarSkin, upgrades?: CarUpgrades) {
  const up = upgrades || DEFAULT_CAR_UPGRADES;
  return {
    topSpeed: skin.topSpeed + up.turboStage * 6,
    acceleration: skin.acceleration + up.ecuStage * 6,
    handling: skin.handling + up.coiloversStage * 5,
    driftMultiplier: Number((skin.driftMultiplier + up.coiloversStage * 0.12).toFixed(2)),
    armor: skin.armor + up.armorStage * 8,
    nitroRecharge: Number((skin.nitroRecharge + up.nitroStage * 0.15).toFixed(2)),
  };
}

export function loadSettings(): GameSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const saved: Partial<GameSettings> = JSON.parse(raw);
    return {
      masterVolume: clampNumber(saved.masterVolume, DEFAULT_SETTINGS.masterVolume, 0, 1),
      steeringSensitivity: clampNumber(saved.steeringSensitivity, 1, 0.5, 2.0),
      steeringDeadzone: clampNumber(saved.steeringDeadzone, 0.05, 0, 0.2),
      reducedMotion: saved.reducedMotion === true,
      highContrast: saved.highContrast === true,
      colorblindPickups: saved.colorblindPickups === true,
      largeHud: saved.largeHud === true,
      touchSteering: saved.touchSteering === true,
      touchControlScale: clampNumber(saved.touchControlScale, 1, 0.85, 1.35),
      showTutorial: saved.showTutorial !== false,
      haptics: saved.haptics !== false,
      showFPS: saved.showFPS === true,
      showMinimap: saved.showMinimap !== false,
    };
  } catch (error) {
    console.warn('Saved game settings could not be read; using defaults.', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadProgress(): PlayerProgress {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return DEFAULT_PROGRESS;

  try {
    const saved: Partial<PlayerProgress> = JSON.parse(raw);
    const bestScores = saved.bestScores;
    const dailyChallengeDate = typeof saved.dailyChallengeDate === 'string' ? saved.dailyChallengeDate : '';
    const today = getDailyChallengeDate();

    return {
      bankedCoins: clampNumber(saved.bankedCoins, DEFAULT_PROGRESS.bankedCoins, 0, Number.MAX_SAFE_INTEGER),
      unlockedSkins: Array.isArray(saved.unlockedSkins)
        ? Array.from(new Set(saved.unlockedSkins.filter((id): id is string => typeof id === 'string')))
        : DEFAULT_PROGRESS.unlockedSkins,
      selectedSkinId:
        typeof saved.selectedSkinId === 'string' ? saved.selectedSkinId : DEFAULT_PROGRESS.selectedSkinId,
      driverName:
        typeof saved.driverName === 'string' && saved.driverName.trim()
          ? saved.driverName.trim().slice(0, 16)
          : 'Racer 01',
      driverTag:
        typeof saved.driverTag === 'string' && saved.driverTag.startsWith('#')
          ? saved.driverTag
          : DEFAULT_PROGRESS.driverTag,
      bounty: clampNumber(saved.bounty, DEFAULT_PROGRESS.bounty, 500, Number.MAX_SAFE_INTEGER),
      rankPoints: clampNumber(saved.rankPoints, DEFAULT_PROGRESS.rankPoints, 0, Number.MAX_SAFE_INTEGER),
      wins: clampNumber(saved.wins, 0, 0, Number.MAX_SAFE_INTEGER),
      losses: clampNumber(saved.losses, 0, 0, Number.MAX_SAFE_INTEGER),
      winStreak: clampNumber(saved.winStreak, 0, 0, Number.MAX_SAFE_INTEGER),
      activeTrackId: (['tokyo_midnight', 'coastline_sunset', 'akina_touge', 'cyber_desert'].includes(
        saved.activeTrackId as string
      )
        ? saved.activeTrackId
        : 'tokyo_midnight') as TrackId,
      carUpgrades: saved.carUpgrades && typeof saved.carUpgrades === 'object' ? saved.carUpgrades : {},
      wonPinkSlips: Array.isArray(saved.wonPinkSlips) ? saved.wonPinkSlips : [],
      bestScores: {
        endless: clampNumber(bestScores?.endless, 0, 0, Number.MAX_SAFE_INTEGER),
        time_trial: clampNumber(bestScores?.time_trial, 0, 0, Number.MAX_SAFE_INTEGER),
        daily_challenge: clampNumber(bestScores?.daily_challenge, 0, 0, Number.MAX_SAFE_INTEGER),
        drift_king: clampNumber(bestScores?.drift_king, 0, 0, Number.MAX_SAFE_INTEGER),
        multiplayer: clampNumber(bestScores?.multiplayer, 0, 0, Number.MAX_SAFE_INTEGER),
        cup_race: clampNumber(bestScores?.cup_race, 0, 0, Number.MAX_SAFE_INTEGER),
        duel: clampNumber(bestScores?.duel, 0, 0, Number.MAX_SAFE_INTEGER),
      },
      tutorialSeen: saved.tutorialSeen === true,
      dailyChallengeDate,
      dailyChallengeCompleted: dailyChallengeDate === today && saved.dailyChallengeCompleted === true,
      challenges: saved.challenges && typeof saved.challenges === 'object' ? saved.challenges : {},
    };
  } catch (error) {
    console.warn('Saved game progress could not be read; using a fresh profile.', error);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

export function getDailyChallengeDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
