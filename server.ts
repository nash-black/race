import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

const server = http.createServer(app);

// Data Types
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  driftScore: number;
  distance: number;
  topSpeed: number;
  carId: string;
  mode: 'endless' | 'time_trial' | 'daily_challenge' | 'drift_king' | 'multiplayer' | 'cup_race' | 'duel';
  date: string;
  country?: string;
  bounty?: number;
}

export interface BountyLeader {
  id: string;
  name: string;
  tag: string;
  bounty: number;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  rankTitle: string;
  wins: number;
  losses: number;
  winStreak: number;
  carId: string;
  isOnline: boolean;
  status: string;
}

export interface MarketItem {
  id: string;
  sellerId: string;
  sellerName: string;
  carId: string;
  carName: string;
  price: number;
  upgrades: {
    turboStage: number;
    ecuStage: number;
    coiloversStage: number;
    armorStage: number;
    nitroStage: number;
  };
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
  trackId: string;
  mode: 'sprint' | 'drift_battle';
  badge: string;
  participantsCount: number;
}

// In-Memory Global Storage
const leaderboardData: LeaderboardEntry[] = [
  {
    id: 'legend-1',
    name: 'AkinaPhantom',
    score: 184500,
    driftScore: 92400,
    distance: 14200,
    topSpeed: 178,
    carId: 'drift_meister',
    mode: 'endless',
    date: '2026-10-28',
    country: 'JP',
    bounty: 24500,
  },
  {
    id: 'legend-2',
    name: 'CyberRacer_99',
    score: 162100,
    driftScore: 68400,
    distance: 12850,
    topSpeed: 184,
    carId: 'cyber_volt',
    mode: 'endless',
    date: '2026-10-29',
    country: 'US',
    bounty: 18900,
  },
  {
    id: 'legend-3',
    name: 'ValkyrieApex',
    score: 145800,
    driftScore: 74200,
    distance: 11900,
    topSpeed: 191,
    carId: 'phantom_valkyrie',
    mode: 'endless',
    date: '2026-10-29',
    country: 'DE',
    bounty: 15400,
  },
  {
    id: 'legend-4',
    name: 'MidnightDrifter',
    score: 129400,
    driftScore: 88900,
    distance: 10400,
    topSpeed: 166,
    carId: 'midnight_shadow',
    mode: 'drift_king',
    date: '2026-10-30',
    country: 'GB',
    bounty: 12800,
  },
  {
    id: 'legend-5',
    name: 'V8_Thunder',
    score: 114200,
    driftScore: 61500,
    distance: 9800,
    topSpeed: 172,
    carId: 'muscle_69',
    mode: 'endless',
    date: '2026-10-30',
    country: 'AU',
    bounty: 11200,
  },
  {
    id: 'legend-6',
    name: 'SolarPulse',
    score: 98400,
    driftScore: 54100,
    distance: 8900,
    topSpeed: 169,
    carId: 'solar_horizon',
    mode: 'time_trial',
    date: '2026-10-30',
    country: 'FR',
    bounty: 8900,
  },
];

const bountyBoard: BountyLeader[] = [
  {
    id: 'b-1',
    name: 'AkinaPhantom',
    tag: '#0001',
    bounty: 24500,
    rank: 'S',
    rankTitle: 'Apex Legend',
    wins: 48,
    losses: 3,
    winStreak: 19,
    carId: 'drift_meister',
    isOnline: true,
    status: 'King of Touge',
  },
  {
    id: 'b-2',
    name: 'CyberRacer_99',
    tag: '#1337',
    bounty: 18900,
    rank: 'S',
    rankTitle: 'Apex Legend',
    wins: 39,
    losses: 6,
    winStreak: 11,
    carId: 'cyber_volt',
    isOnline: true,
    status: 'Hypercar Dominator',
  },
  {
    id: 'b-3',
    name: 'ValkyrieApex',
    tag: '#7777',
    bounty: 15400,
    rank: 'A',
    rankTitle: 'Drift Master',
    wins: 31,
    losses: 8,
    winStreak: 7,
    carId: 'phantom_valkyrie',
    isOnline: true,
    status: 'Seeking Pink Slips',
  },
  {
    id: 'b-4',
    name: 'MidnightDrifter',
    tag: '#8080',
    bounty: 12800,
    rank: 'A',
    rankTitle: 'Drift Master',
    wins: 27,
    losses: 5,
    winStreak: 5,
    carId: 'midnight_shadow',
    isOnline: false,
    status: 'Offline (Last seen Tokyo)',
  },
  {
    id: 'b-5',
    name: 'V8_Thunder',
    tag: '#1969',
    bounty: 11200,
    rank: 'B',
    rankTitle: 'Highway Phantom',
    wins: 22,
    losses: 9,
    winStreak: 4,
    carId: 'muscle_69',
    isOnline: false,
    status: 'Offline (Last seen Desert)',
  },
];

const marketplaceListings: MarketItem[] = [
  {
    id: 'm-1',
    sellerId: 'legend-1',
    sellerName: 'AkinaPhantom',
    carId: 'drift_meister',
    carName: 'Drift Meister S15 [Touge Spec]',
    price: 1800,
    upgrades: { turboStage: 3, ecuStage: 2, coiloversStage: 3, armorStage: 1, nitroStage: 2 },
    primaryColor: '#ec4899',
    secondaryColor: '#1e1b4b',
    accentColor: '#fbcfe8',
    glowColor: 'rgba(236,72,153,0.7)',
    rating: 98,
    listedAt: '2026-10-29',
    badge: 'STAGE 3 TUNED',
  },
  {
    id: 'm-2',
    sellerId: 'legend-2',
    sellerName: 'CyberRacer_99',
    carId: 'cyber_volt',
    carName: 'Cyber Volt [Neon Interceptor]',
    price: 1400,
    upgrades: { turboStage: 2, ecuStage: 3, coiloversStage: 2, armorStage: 2, nitroStage: 3 },
    primaryColor: '#06b6d4',
    secondaryColor: '#0f172a',
    accentColor: '#a5f3fc',
    glowColor: 'rgba(6,182,212,0.8)',
    rating: 94,
    listedAt: '2026-10-30',
    badge: 'EV OVERCLOCKED',
  },
  {
    id: 'm-3',
    sellerId: 'legend-5',
    sellerName: 'V8_Thunder',
    carId: 'muscle_69',
    carName: 'Midnight Muscle 69 [Heavy Rammer]',
    price: 1200,
    upgrades: { turboStage: 3, ecuStage: 3, coiloversStage: 1, armorStage: 3, nitroStage: 1 },
    primaryColor: '#1e293b',
    secondaryColor: '#020617',
    accentColor: '#f97316',
    glowColor: 'rgba(249,115,22,0.6)',
    rating: 91,
    listedAt: '2026-10-30',
    badge: 'V8 BLOWER RAMMER',
  },
];

const onlineCups: OnlineCup[] = [
  {
    id: 'cup-schoolyard',
    title: 'Schoolyard Rookie Cup',
    subtitle: 'Open to all license ranks. Prove your basic highway steering.',
    minRank: 'E',
    entryFee: 0,
    prizeCoins: 1000,
    specialReward: 'Bronze License Trophy',
    trackId: 'tokyo_midnight',
    mode: 'sprint',
    badge: 'OPEN ENTRY',
    participantsCount: 18,
  },
  {
    id: 'cup-midnight-touge',
    title: 'Midnight Touge Drift Cup',
    subtitle: 'Mountain hairpins where only the deepest slip angle triumphs.',
    minRank: 'D',
    entryFee: 250,
    prizeCoins: 3500,
    specialReward: 'Cherry Blossom Underglow',
    trackId: 'akina_touge',
    mode: 'drift_battle',
    badge: 'DRIFT BATTLE',
    participantsCount: 24,
  },
  {
    id: 'cup-apex-gp',
    title: 'Apex High Roller Grand Prix',
    subtitle: 'High-speed Pacific coastline sprint for elite licensed pilots.',
    minRank: 'B',
    entryFee: 800,
    prizeCoins: 8500,
    specialReward: 'Gold Exotic Aero Wing',
    trackId: 'coastline_sunset',
    mode: 'sprint',
    badge: 'HIGH STAKES',
    participantsCount: 14,
  },
  {
    id: 'cup-most-wanted',
    title: 'Most Wanted Bounty Invitational',
    subtitle: 'The supreme pink-slip arena. Winner takes all + $10,000 bounty.',
    minRank: 'A',
    entryFee: 2000,
    prizeCoins: 25000,
    specialReward: 'Phantom Valkyrie Pink Slip',
    trackId: 'cyber_desert',
    mode: 'sprint',
    badge: 'PINK SLIP INVITATIONAL',
    participantsCount: 8,
  },
];

// Connected Online Drivers
interface ConnectedDriver {
  id: string;
  name: string;
  tag: string;
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  rankTitle: string;
  bounty: number;
  wins: number;
  losses: number;
  winStreak: number;
  carId: string;
  ip: string;
  ws: WebSocket;
  lastPing: number;
}

const onlineDrivers = new Map<string, ConnectedDriver>();

// REST ENDPOINTS
// 1. Leaderboards
app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode as string | undefined;
  let entries = [...leaderboardData];
  if (mode && mode !== 'all') {
    entries = entries.filter((e) => e.mode === mode);
  }
  entries.sort((a, b) => b.score - a.score);
  res.json({
    success: true,
    entries: entries.slice(0, 50),
    totalCount: entries.length,
  });
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score, driftScore, distance, topSpeed, carId, mode, country, bounty } = req.body;
  if (!name || typeof score !== 'number') {
    res.status(400).json({ success: false, error: 'Invalid score payload' });
    return;
  }

  const cleanName = String(name).slice(0, 20).trim() || 'Racer';
  const newEntry: LeaderboardEntry = {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    score: Math.max(0, Math.floor(score)),
    driftScore: Math.max(0, Math.floor(driftScore || 0)),
    distance: Math.max(0, Math.floor(distance || 0)),
    topSpeed: Math.max(0, Math.floor(topSpeed || 0)),
    carId: String(carId || 'crimson_fury'),
    mode: mode || 'endless',
    date: new Date().toISOString().split('T')[0],
    country: country || 'GL',
    bounty: bounty || 1500,
  };

  leaderboardData.push(newEntry);
  leaderboardData.sort((a, b) => b.score - a.score);
  if (leaderboardData.length > 200) {
    leaderboardData.length = 200;
  }

  const rank = leaderboardData.findIndex((e) => e.id === newEntry.id) + 1;
  res.json({ success: true, entry: newEntry, rank });
});

// 2. Bounty Board
app.get('/api/bounties', (_req, res) => {
  // Merge static champions with live active drivers
  const merged: BountyLeader[] = [...bountyBoard];

  for (const [id, driver] of onlineDrivers.entries()) {
    if (!merged.some((m) => m.name.toLowerCase() === driver.name.toLowerCase())) {
      merged.push({
        id: driver.id,
        name: driver.name,
        tag: driver.tag,
        bounty: driver.bounty,
        rank: driver.rank,
        rankTitle: driver.rankTitle,
        wins: driver.wins,
        losses: driver.losses,
        winStreak: driver.winStreak,
        carId: driver.carId,
        isOnline: true,
        status: 'Active on Network',
      });
    }
  }

  merged.sort((a, b) => b.bounty - a.bounty);
  res.json({ success: true, bounties: merged.slice(0, 50) });
});

// 3. Online Players (Discover friends on school / same Wi-Fi)
app.get('/api/players', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  const players = Array.from(onlineDrivers.values()).map((p) => ({
    id: p.id,
    name: p.name,
    tag: p.tag,
    rank: p.rank,
    rankTitle: p.rankTitle,
    bounty: p.bounty,
    wins: p.wins,
    losses: p.losses,
    winStreak: p.winStreak,
    carId: p.carId,
    isLocalWifi: p.ip === clientIp || p.ip.startsWith('127.0.0.') || p.ip.startsWith('192.168.'),
  }));

  res.json({ success: true, players });
});

// 4. Used Car Marketplace
app.get('/api/market', (_req, res) => {
  res.json({ success: true, listings: marketplaceListings });
});

app.post('/api/market/list', (req, res) => {
  const { sellerId, sellerName, carId, carName, price, upgrades, primaryColor, secondaryColor, accentColor, glowColor } = req.body;
  if (!sellerName || !carId || typeof price !== 'number') {
    res.status(400).json({ success: false, error: 'Invalid market listing payload' });
    return;
  }

  const newListing: MarketItem = {
    id: `m-${Date.now()}`,
    sellerId: sellerId || 'racer',
    sellerName: String(sellerName).slice(0, 16),
    carId,
    carName: carName || 'Custom Tuned Car',
    price: Math.max(50, Math.floor(price)),
    upgrades: upgrades || { turboStage: 1, ecuStage: 1, coiloversStage: 1, armorStage: 1, nitroStage: 1 },
    primaryColor: primaryColor || '#e11d48',
    secondaryColor: secondaryColor || '#020617',
    accentColor: accentColor || '#fbbf24',
    glowColor: glowColor || 'rgba(225,29,72,0.5)',
    rating: Math.floor(85 + Math.random() * 14),
    listedAt: new Date().toISOString().split('T')[0],
    badge: 'MODIFIED STREET CAR',
  };

  marketplaceListings.unshift(newListing);
  res.json({ success: true, listing: newListing });
});

app.post('/api/market/buy', (req, res) => {
  const { listingId, buyerId } = req.body;
  const index = marketplaceListings.findIndex((m) => m.id === listingId);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Listing not found or already sold' });
    return;
  }

  const bought = marketplaceListings[index];
  marketplaceListings.splice(index, 1);
  res.json({ success: true, purchasedCar: bought });
});

// 5. Online Cups
app.get('/api/cups', (_req, res) => {
  res.json({ success: true, cups: onlineCups });
});

// MULTIPLAYER ROOMS & WEBSOCKET ENGINE
interface MultiplayerPlayer {
  id: string;
  name: string;
  tag?: string;
  rank?: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  bounty?: number;
  carId: string;
  color: string;
  secondaryColor?: string;
  x: number;
  y: number;
  distance: number;
  speed: number;
  angle: number;
  driftChain: number;
  driftScore: number;
  score: number;
  isDrifting: boolean;
  isNitro: boolean;
  health: number;
  lastPing: number;
  ws: WebSocket;
}

interface MultiplayerRoom {
  code: string;
  seed: number;
  targetDistance: number;
  trackId: string;
  mode: 'sprint' | 'drift_battle' | 'endless_cruise' | 'duel';
  wagerCoins: number;
  wagerPinkSlip: boolean;
  wagerCarId?: string;
  players: Map<string, MultiplayerPlayer>;
  createdAt: number;
  started: boolean;
}

const rooms = new Map<string, MultiplayerRoom>();
const PUBLIC_ROOM_CODE = 'TURBO-HIGHWAY';

function getOrCreateRoom(
  code: string,
  mode: 'sprint' | 'drift_battle' | 'endless_cruise' | 'duel' = 'sprint',
  trackId: string = 'tokyo_midnight',
  wagerCoins: number = 0,
  wagerPinkSlip: boolean = false
): MultiplayerRoom {
  const normalized = code.trim().toUpperCase() || PUBLIC_ROOM_CODE;
  let room = rooms.get(normalized);
  if (!room) {
    room = {
      code: normalized,
      seed: Math.floor(Math.random() * 1000000),
      targetDistance: mode === 'sprint' ? 5000 : 8000,
      trackId,
      mode,
      wagerCoins,
      wagerPinkSlip,
      players: new Map(),
      createdAt: Date.now(),
      started: true,
    };
    rooms.set(normalized, room);
  }
  return room;
}

// Inactive rooms cleanup
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (code !== PUBLIC_ROOM_CODE && room.players.size === 0 && now - room.createdAt > 300000) {
      rooms.delete(code);
    }
  }
}, 60000);

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, req) => {
  let playerRoom: MultiplayerRoom | null = null;
  let registeredDriverId: string | null = null;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Driver Registration (Online presence & school Wi-Fi list)
      if (msg.type === 'register_driver') {
        registeredDriverId = String(msg.id || `drv_${Date.now()}`);
        const driver: ConnectedDriver = {
          id: registeredDriverId,
          name: String(msg.name || 'Racer').slice(0, 16),
          tag: String(msg.tag || '#0000'),
          rank: msg.rank || 'E',
          rankTitle: msg.rankTitle || 'Rookie',
          bounty: Number(msg.bounty || 1500),
          wins: Number(msg.wins || 0),
          losses: Number(msg.losses || 0),
          winStreak: Number(msg.winStreak || 0),
          carId: String(msg.carId || 'crimson_fury'),
          ip: clientIp,
          ws,
          lastPing: Date.now(),
        };
        onlineDrivers.set(registeredDriverId, driver);
        broadcastOnlineDrivers();
      }

      // 2. 1v1 Race Challenge / Pink Slip Invite to Friend
      else if (msg.type === 'send_challenge') {
        const targetDriver = onlineDrivers.get(msg.targetDriverId);
        if (targetDriver && targetDriver.ws.readyState === WebSocket.OPEN) {
          targetDriver.ws.send(
            JSON.stringify({
              type: 'challenge_invitation',
              invite: {
                id: `inv-${Date.now()}`,
                fromId: registeredDriverId,
                fromName: msg.fromName || 'Racer',
                fromRank: msg.fromRank || 'E',
                fromBounty: msg.fromBounty || 1500,
                fromCarId: msg.fromCarId || 'crimson_fury',
                trackId: msg.trackId || 'tokyo_midnight',
                wagerCoins: Number(msg.wagerCoins || 0),
                wagerPinkSlip: Boolean(msg.wagerPinkSlip),
                wagerCarId: msg.wagerCarId,
                mode: msg.mode || 'sprint',
              },
            })
          );
        }
      }

      // 3. Challenge Acceptance / Decline
      else if (msg.type === 'respond_challenge') {
        const challenger = onlineDrivers.get(msg.fromId);
        if (msg.accepted) {
          const duelRoomCode = `DUEL-${Date.now().toString(36).toUpperCase()}`;
          const duelRoom = getOrCreateRoom(
            duelRoomCode,
            'duel',
            msg.trackId || 'tokyo_midnight',
            Number(msg.wagerCoins || 0),
            Boolean(msg.wagerPinkSlip)
          );

          // Notify challenger to join duel room
          if (challenger && challenger.ws.readyState === WebSocket.OPEN) {
            challenger.ws.send(
              JSON.stringify({
                type: 'challenge_accepted',
                roomCode: duelRoomCode,
                trackId: msg.trackId,
                wagerCoins: msg.wagerCoins,
                wagerPinkSlip: msg.wagerPinkSlip,
              })
            );
          }

          // Notify acceptor to join duel room
          ws.send(
            JSON.stringify({
              type: 'challenge_accepted',
              roomCode: duelRoomCode,
              trackId: msg.trackId,
              wagerCoins: msg.wagerCoins,
              wagerPinkSlip: msg.wagerPinkSlip,
            })
          );
        } else {
          if (challenger && challenger.ws.readyState === WebSocket.OPEN) {
            challenger.ws.send(
              JSON.stringify({
                type: 'challenge_declined',
                message: `${msg.responderName || 'Driver'} declined the race challenge.`,
              })
            );
          }
        }
      }

      // 4. Join Multiplayer Room
      else if (msg.type === 'join_room') {
        const roomCode = (msg.roomCode || PUBLIC_ROOM_CODE).toUpperCase();
        playerRoom = getOrCreateRoom(
          roomCode,
          msg.mode || 'sprint',
          msg.trackId || 'tokyo_midnight',
          Number(msg.wagerCoins || 0),
          Boolean(msg.wagerPinkSlip)
        );

        const pid: string = String(msg.playerId || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);

        const player: MultiplayerPlayer = {
          id: pid,
          name: msg.name || 'Racer',
          tag: msg.tag || '#0000',
          rank: msg.rank || 'E',
          bounty: msg.bounty || 1500,
          carId: msg.carId || 'crimson_fury',
          color: msg.color || '#e11d48',
          secondaryColor: msg.secondaryColor || '#881337',
          x: 400,
          y: 720,
          distance: 0,
          speed: 0,
          angle: 0,
          driftChain: 0,
          driftScore: 0,
          score: 0,
          isDrifting: false,
          isNitro: false,
          health: 100,
          lastPing: Date.now(),
          ws,
        };

        playerRoom.players.set(pid, player);

        const existingPlayers = Array.from(playerRoom.players.values()).map((p) => ({
          id: p.id,
          name: p.name,
          tag: p.tag,
          rank: p.rank,
          bounty: p.bounty,
          carId: p.carId,
          color: p.color,
          secondaryColor: p.secondaryColor,
          x: p.x,
          distance: p.distance,
          speed: p.speed,
          angle: p.angle,
          driftScore: p.driftScore,
          score: p.score,
          isDrifting: p.isDrifting,
          isNitro: p.isNitro,
        }));

        ws.send(
          JSON.stringify({
            type: 'room_joined',
            roomCode: playerRoom.code,
            playerId: pid,
            seed: playerRoom.seed,
            targetDistance: playerRoom.targetDistance,
            trackId: playerRoom.trackId,
            mode: playerRoom.mode,
            wagerCoins: playerRoom.wagerCoins,
            wagerPinkSlip: playerRoom.wagerPinkSlip,
            players: existingPlayers,
          })
        );

        broadcastToRoom(
          playerRoom,
          {
            type: 'player_joined',
            player: {
              id: player.id,
              name: player.name,
              tag: player.tag,
              rank: player.rank,
              bounty: player.bounty,
              carId: player.carId,
              color: player.color,
              secondaryColor: player.secondaryColor,
              x: player.x,
              distance: player.distance,
              speed: player.speed,
              score: player.score,
            },
          },
          pid
        );
      }

      // 5. In-Game State Sync
      else if (msg.type === 'state_update' && playerRoom && msg.playerId) {
        const player = playerRoom.players.get(msg.playerId);
        if (player) {
          player.x = msg.x ?? player.x;
          player.y = msg.y ?? player.y;
          player.distance = msg.distance ?? player.distance;
          player.speed = msg.speed ?? player.speed;
          player.angle = msg.angle ?? player.angle;
          player.driftChain = msg.driftChain ?? player.driftChain;
          player.driftScore = msg.driftScore ?? player.driftScore;
          player.score = msg.score ?? player.score;
          player.isDrifting = !!msg.isDrifting;
          player.isNitro = !!msg.isNitro;
          player.health = msg.health ?? player.health;
          player.lastPing = Date.now();

          // Check for Duel / Sprint Finish line victory
          if (playerRoom.mode === 'duel' || playerRoom.mode === 'sprint') {
            if (player.distance >= playerRoom.targetDistance) {
              broadcastToRoom(playerRoom, {
                type: 'race_finished',
                winnerId: player.id,
                winnerName: player.name,
                wagerCoins: playerRoom.wagerCoins,
                wagerPinkSlip: playerRoom.wagerPinkSlip,
              });
            }
          }

          broadcastToRoom(
            playerRoom,
            {
              type: 'player_state',
              id: msg.playerId,
              x: player.x,
              distance: player.distance,
              speed: player.speed,
              angle: player.angle,
              driftChain: player.driftChain,
              driftScore: player.driftScore,
              score: player.score,
              isDrifting: player.isDrifting,
              isNitro: player.isNitro,
              health: player.health,
            },
            msg.playerId
          );
        }
      }

      // 6. Real-time In-Game & Lobby Chat
      else if (msg.type === 'send_chat') {
        const chatPayload = {
          type: 'chat_received',
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          senderId: registeredDriverId || msg.senderId || 'racer',
          senderName: String(msg.senderName || 'Racer').slice(0, 16),
          senderRank: msg.senderRank || 'E',
          text: String(msg.text || '').slice(0, 140),
          timestamp: Date.now(),
        };

        if (playerRoom && msg.channel === 'room') {
          broadcastToRoom(playerRoom, chatPayload);
        } else {
          // Broadcast to all active clients (global / school Wi-Fi chat)
          const json = JSON.stringify(chatPayload);
          for (const driver of onlineDrivers.values()) {
            if (driver.ws.readyState === WebSocket.OPEN) {
              driver.ws.send(json);
            }
          }
        }
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  const cleanup = () => {
    if (registeredDriverId) {
      onlineDrivers.delete(registeredDriverId);
      broadcastOnlineDrivers();
    }
    if (playerRoom && registeredDriverId) {
      playerRoom.players.delete(registeredDriverId);
      broadcastToRoom(playerRoom, {
        type: 'player_left',
        playerId: registeredDriverId,
      });
      if (playerRoom.players.size === 0 && playerRoom.code !== PUBLIC_ROOM_CODE) {
        rooms.delete(playerRoom.code);
      }
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

function broadcastToRoom(room: MultiplayerRoom, payload: unknown, excludeId?: string) {
  const json = JSON.stringify(payload);
  for (const [id, player] of room.players.entries()) {
    if (id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(json);
    }
  }
}

function broadcastOnlineDrivers() {
  const driversList = Array.from(onlineDrivers.values()).map((p) => ({
    id: p.id,
    name: p.name,
    tag: p.tag,
    rank: p.rank,
    rankTitle: p.rankTitle,
    bounty: p.bounty,
    wins: p.wins,
    losses: p.losses,
    winStreak: p.winStreak,
    carId: p.carId,
  }));

  const payload = JSON.stringify({
    type: 'online_drivers_update',
    drivers: driversList,
  });

  for (const driver of onlineDrivers.values()) {
    if (driver.ws.readyState === WebSocket.OPEN) {
      driver.ws.send(payload);
    }
  }
}

// Upgrade HTTP requests on path /ws to WebSocket
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Setup Vite middlewares for development, or static serving for production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Turbo Horizon server running on port ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}]`);
  });
}

startServer();
