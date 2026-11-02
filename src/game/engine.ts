/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sound } from './audio';
import { CAR_SKINS } from './renderer';
import { GameRenderer, JUNCTION_SPACING } from './renderer3d';
import {
  DAILY_CHALLENGE_TARGET,
  TIME_TRIAL_SECONDS,
  INITIAL_CHALLENGES,
  loadProgress,
  saveProgress,
  CustomCarStyle,
} from '../services/progress';
import {
  BountyRacer,
  CarSkin,
  CarUpgrades,
  Challenge,
  ChatMessage,
  FloatingText,
  GameMode,
  GameSettings,
  GameState,
  GameStats,
  InputState,
  Particle,
  Pickup,
  PickupType,
  RaceChallengeInvite,
  RemoteRacer,
  RoadsideObject,
  SkidMark,
  TimeOfDay,
  TRACKS,
  TrackConfig,
  TrackId,
  Vehicle,
  VehicleType,
} from './types';

export class RacingGameEngine {
  private canvas: HTMLCanvasElement;
  private renderer: GameRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game state
  public state: GameState = 'TITLE';
  public selectedSkin: CarSkin = CAR_SKINS[0];
  private currentTrack: TrackConfig = TRACKS[0];
  private upgrades: CarUpgrades = {
    turboStage: 0,
    ecuStage: 0,
    coiloversStage: 0,
    armorStage: 0,
    nitroStage: 0,
  };
  private wagerCoins: number = 0;
  private wagerPinkSlip: boolean = false;
  private wagerCarId?: string;

  // Callback listeners
  private onStatsChange?: (stats: GameStats) => void;
  private onStateChange?: (state: GameState) => void;
  private onRunComplete?: (stats: GameStats, mode: GameMode) => void;
  private onChallengeCompleted?: (challenge: Challenge) => void;
  private onChallengeInvite?: (invite: RaceChallengeInvite) => void;
  private onRaceFinished?: (result: { winnerId: string; winnerName: string; wagerCoins: number; wagerPinkSlip: boolean }) => void;
  private onChatMessage?: (chat: ChatMessage) => void;
  private onDriversUpdate?: (drivers: BountyRacer[]) => void;

  private mode: GameMode = 'endless';
  private settings: GameSettings | null = null;

  // Road & Dimensions
  private width: number = 800;
  private height: number = 900;
  private roadOffset: number = 0;
  private routeChoice: -1 | 1 | null = null;
  private routesTaken = 0;
  private playerLateralVelocity: number = 0;
  private roadEdgeContactCooldown: number = 0;
  private driftTime: number = 0;
  private elapsedTime: number = 0;
  private timeOfDay: TimeOfDay = 'night';
  private dayTimer: number = 0;

  // Physics states
  private slipAngle: number = 0;
  private driftMultiplier: number = 1.0;
  private bodyRoll: number = 0;
  private pitchAngle: number = 0;
  private counterSteerAngle: number = 0;
  private counterSteerQuality: 'PERFECT' | 'GREAT' | 'GOOD' | null = null;
  private solarCoinTimer: number = 0;
  private gear: number = 1;
  private rpm: number = 1000;

  // Player Vehicle
  private player: Vehicle = {
    id: 0,
    x: 400,
    y: 720,
    width: 44,
    height: 82,
    speed: 0,
    maxSpeed: 140,
    acceleration: 24,
    handling: 540,
    type: 'player',
    color: CAR_SKINS[0].primary,
    secondaryColor: CAR_SKINS[0].secondary,
    angle: 0,
    targetAngle: 0,
    lane: 2,
    targetLane: 2,
    blinker: null,
    blinkerTimer: 0,
    sirenTimer: 0,
    passedPlayer: true,
    nearMissAwarded: true,
  };

  // Vehicles, Pickups, Particles, Texts
  private enemies: Vehicle[] = [];
  private enemyIdCounter: number = 1;
  private pickups: Pickup[] = [];
  private pickupIdCounter: number = 1;
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private textIdCounter: number = 1;
  private skidMarks: SkidMark[] = [];
  private roadsideObjects: RoadsideObject[] = [];

  // Spawning timers
  private enemySpawnTimer: number = 0;
  private pickupSpawnTimer: number = 0;

  // Inputs
  private inputs: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    nitro: false,
    brake: false,
    handbrake: false,
    analogSteer: 0,
  };

  // Hitstop & screen shake
  private hitstopTimer: number = 0;
  private screenShake: number = 0;
  private isCrashing: boolean = false;
  private crashTimer: number = 0;

  // Challenges Tracking
  private runBlastedTraffic: number = 0;
  private runSpeedDemonDuration: number = 0;

  // Multiplayer Engine State
  private ws: WebSocket | null = null;
  private mpRoomCode: string = '';
  private mpPlayerId: string = '';
  private mpRivals: Map<string, RemoteRacer> = new Map();
  private lastWsSyncTime: number = 0;

  // Stats
  private stats: GameStats = {
    score: 0,
    highScore: 0,
    distance: 0,
    coins: 0,
    speedMph: 0,
    topSpeedMph: 0,
    health: 100,
    nitro: 100,
    combo: 1,
    comboTimer: 0,
    closeCalls: 0,
    driftScore: 0,
    driftChain: 0,
    bestDriftChain: 0,
    driftMultiplier: 1.0,
    driftAngleDegrees: 0,
    slipAngle: 0,
    isDrifting: false,
    isHandbraking: false,
    counterSteerQuality: null,
    gForce: 0,
    bodyRoll: 0,
    pitchAngle: 0,
    rpm: 1000,
    gear: 1,
    raceTime: 0,
    timeRemaining: 0,
    challengeProgress: 0,
    junctionDistance: 0,
    routeChoice: null,
    routesTaken: 0,
    speedBoostActive: false,
    speedBoostTimer: 0,
    shieldActive: false,
    shieldTimer: 0,
    multiplayerRank: 1,
    multiplayerTotal: 1,
    rivals: [],
    wagerCoins: 0,
    wagerPinkSlip: false,
    activeTrackId: 'tokyo_midnight',
    trackMapCurve: 0,
    trackProgressPct: 0,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new GameRenderer(canvas);
    this.resize();
    this.bindEvents();
    this.setTrack('tokyo_midnight');
    this.initWebSocketConnection();
  }

  public setSettings(settings: GameSettings) {
    this.settings = settings;
    this.renderer.setReducedMotion(settings.reducedMotion);
    sound.setVolume(settings.masterVolume);
  }

  public setSkin(skin: CarSkin, style?: CustomCarStyle) {
    this.selectedSkin = skin;
    this.player.color = style?.primaryColor || skin.primary;
    this.player.secondaryColor = style?.secondaryColor || skin.secondary;
    this.renderer.rebuildPlayerCar(skin, style);
  }

  public setTrack(trackId: TrackId) {
    const config = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
    this.currentTrack = config;
    this.timeOfDay = config.timeOfDay;
    this.renderer.setTrack(config);
    this.stats.activeTrackId = config.id;
    this.spawnInitialRoadsideScenery();
  }

  public setUpgrades(upgrades: CarUpgrades) {
    this.upgrades = upgrades;
  }

  public setWagers(wagerCoins: number, wagerPinkSlip: boolean, wagerCarId?: string) {
    this.wagerCoins = wagerCoins;
    this.wagerPinkSlip = wagerPinkSlip;
    this.wagerCarId = wagerCarId;
    this.stats.wagerCoins = wagerCoins;
    this.stats.wagerPinkSlip = wagerPinkSlip;
    this.stats.wagerCarId = wagerCarId;
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  public setOnStatsChange(cb: (stats: GameStats) => void) {
    this.onStatsChange = cb;
  }

  public setOnStateChange(cb: (state: GameState) => void) {
    this.onStateChange = cb;
  }

  public setOnRunComplete(cb: (stats: GameStats, mode: GameMode) => void) {
    this.onRunComplete = cb;
  }

  public setOnChallengeCompleted(cb: (challenge: Challenge) => void) {
    this.onChallengeCompleted = cb;
  }

  public setOnChallengeInvite(cb: (invite: RaceChallengeInvite) => void) {
    this.onChallengeInvite = cb;
  }

  public setOnRaceFinished(cb: (result: { winnerId: string; winnerName: string; wagerCoins: number; wagerPinkSlip: boolean }) => void) {
    this.onRaceFinished = cb;
  }

  public setOnChatMessage(cb: (chat: ChatMessage) => void) {
    this.onChatMessage = cb;
  }

  public setOnDriversUpdate(cb: (drivers: BountyRacer[]) => void) {
    this.onDriversUpdate = cb;
  }

  // WEBSOCKET LIFECYCLE & MULTIPLAYER
  private initWebSocketConnection() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'online_drivers_update') {
            this.onDriversUpdate?.(data.drivers);
          } else if (data.type === 'challenge_invitation') {
            sound.playRankUp();
            this.onChallengeInvite?.(data.invite);
          } else if (data.type === 'challenge_declined') {
            this.addFloatingText(data.message, this.player.x, this.player.y - 40, '#f43f5e', 20, true);
          } else if (data.type === 'challenge_accepted') {
            this.connectMultiplayer(data.roomCode, this.selectedSkin.name, data.trackId, data.wagerCoins, data.wagerPinkSlip);
            this.startGame();
          } else if (data.type === 'race_finished') {
            sound.playChallengeComplete();
            this.stats.duelWinner = data.winnerName;
            this.onRaceFinished?.(data);
          } else if (data.type === 'chat_received') {
            this.onChatMessage?.(data);
          } else if (data.type === 'room_joined') {
            this.mpPlayerId = data.playerId;
            if (data.trackId) {
              this.setTrack(data.trackId);
            }
            if (data.players && Array.isArray(data.players)) {
              data.players.forEach((p: RemoteRacer) => {
                if (p.id !== this.mpPlayerId) {
                  this.mpRivals.set(p.id, p);
                }
              });
            }
          } else if (data.type === 'player_joined') {
            if (data.player && data.player.id !== this.mpPlayerId) {
              this.mpRivals.set(data.player.id, data.player);
            }
          } else if (data.type === 'player_state') {
            if (data.id && data.id !== this.mpPlayerId) {
              const existing = this.mpRivals.get(data.id);
              if (existing) {
                Object.assign(existing, data, { lastUpdate: Date.now() });
              } else {
                this.mpRivals.set(data.id, { ...data, lastUpdate: Date.now() });
              }
            }
          } else if (data.type === 'player_left') {
            this.mpRivals.delete(data.playerId);
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onerror = (err) => console.warn('Multiplayer WS error:', err);
      this.ws.onclose = () => console.log('Multiplayer WS closed');
    } catch (e) {
      console.warn('Could not connect WS:', e);
    }
  }

  public registerDriver(driver: {
    id: string;
    name: string;
    tag: string;
    rank: string;
    rankTitle: string;
    bounty: number;
    wins: number;
    losses: number;
    winStreak: number;
    carId: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'register_driver', ...driver }));
    } else {
      setTimeout(() => this.registerDriver(driver), 500);
    }
  }

  public sendChallenge(
    targetDriverId: string,
    wagerCoins: number,
    wagerPinkSlip: boolean,
    trackId: TrackId,
    mode: 'sprint' | 'drift_battle',
    driverProfile: { id: string; name: string; rank: string; bounty: number; carId: string }
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'send_challenge',
          targetDriverId,
          wagerCoins,
          wagerPinkSlip,
          trackId,
          mode,
          fromName: driverProfile.name,
          fromRank: driverProfile.rank,
          fromBounty: driverProfile.bounty,
          fromCarId: driverProfile.carId,
        })
      );
    }
  }

  public respondChallenge(
    fromId: string,
    accepted: boolean,
    wagerCoins: number,
    wagerPinkSlip: boolean,
    trackId: TrackId,
    responderName: string
  ) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'respond_challenge',
          fromId,
          accepted,
          wagerCoins,
          wagerPinkSlip,
          trackId,
          responderName,
        })
      );
    }
  }

  public sendChat(text: string, channel: 'global' | 'room', senderName: string, senderRank: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'send_chat',
          text,
          channel,
          senderName,
          senderRank,
        })
      );
    }
  }

  public connectMultiplayer(
    roomCode: string,
    playerName: string,
    trackId?: TrackId,
    wagerCoins = 0,
    wagerPinkSlip = false
  ) {
    this.mpRoomCode = roomCode;
    if (trackId) this.setTrack(trackId);
    this.setWagers(wagerCoins, wagerPinkSlip);

    const joinPayload = {
      type: 'join_room',
      roomCode: this.mpRoomCode,
      name: playerName,
      carId: this.selectedSkin.id,
      color: this.selectedSkin.primary,
      secondaryColor: this.selectedSkin.secondary,
      trackId: this.currentTrack.id,
      wagerCoins,
      wagerPinkSlip,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(joinPayload));
    } else {
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(joinPayload));
        }
      }, 500);
    }
  }

  public disconnectMultiplayer() {
    this.mpRivals.clear();
  }

  public sendEmote(emote: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'send_chat', text: emote, channel: 'room' }));
    }
  }

  private spawnInitialRoadsideScenery() {
    this.roadsideObjects = [];
    const bounds = this.renderer.getRoadBounds();
    const spacing = 160;

    for (let y = -spacing; y <= this.height + spacing; y += spacing) {
      this.roadsideObjects.push({
        id: Math.random(),
        side: 'left',
        x: bounds.x - 36,
        y: y,
        type: this.currentTrack.sceneryType,
      });
      this.roadsideObjects.push({
        id: Math.random(),
        side: 'right',
        x: bounds.x + bounds.width + 36,
        y: y + spacing / 2,
        type: this.currentTrack.sceneryType,
      });
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => this.resize();
  private handleBlur = () => this.clearInputs();

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.state === 'TITLE') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.startGame();
      }
      return;
    }

    if (this.state === 'GAMEOVER') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.restartGame();
      }
      return;
    }

    if (this.state === 'PLAYING') {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
        return;
      }
    } else if (this.state === 'PAUSED') {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
      }
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.inputs.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.inputs.right = true;
        break;
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        this.inputs.up = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        this.inputs.down = true;
        this.inputs.brake = true;
        break;
      case 'Space':
        e.preventDefault();
        this.inputs.handbrake = true;
        this.inputs.brake = true;
        sound.playHandbrake();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyN':
      case 'KeyE':
        e.preventDefault();
        this.inputs.nitro = true;
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.inputs.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.inputs.right = false;
        break;
      case 'ArrowUp':
      case 'KeyW':
        this.inputs.up = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.inputs.down = false;
        this.inputs.brake = false;
        break;
      case 'Space':
        this.inputs.handbrake = false;
        this.inputs.brake = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'KeyN':
      case 'KeyE':
        this.inputs.nitro = false;
        break;
    }
  };

  public setVirtualInput(control: keyof InputState, active: boolean | number) {
    if (control === 'analogSteer' && typeof active === 'number') {
      this.inputs.analogSteer = Math.max(-1, Math.min(1, active));
    } else if (typeof active === 'boolean') {
      ((this.inputs as unknown) as Record<string, unknown>)[control] = active;
      if (control === 'down') {
        this.inputs.brake = active;
      }
      if (control === 'handbrake') {
        this.inputs.brake = active;
        if (active) sound.playHandbrake();
      }
    }
  }

  // GAMEPAD POLLING
  private pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    const deadzone = this.settings?.steeringDeadzone ?? 0.05;
    const stickX = gp.axes[0] ?? 0;

    if (Math.abs(stickX) > deadzone) {
      const sign = Math.sign(stickX);
      const val = (Math.abs(stickX) - deadzone) / (1 - deadzone);
      this.inputs.analogSteer = sign * Math.pow(val, 1.25);
    } else {
      this.inputs.analogSteer = 0;
    }

    const gasPressed = gp.buttons[0]?.pressed || (gp.buttons[7]?.value ?? 0) > 0.2;
    const brakePressed = gp.buttons[2]?.pressed || (gp.buttons[6]?.value ?? 0) > 0.2;
    const handbrakePressed = gp.buttons[1]?.pressed || gp.buttons[5]?.pressed;
    const nitroPressed = gp.buttons[3]?.pressed || gp.buttons[4]?.pressed;

    if (gasPressed) this.inputs.up = true;
    if (brakePressed) {
      this.inputs.down = true;
      this.inputs.brake = true;
    }
    if (handbrakePressed) {
      this.inputs.handbrake = true;
      this.inputs.brake = true;
    }
    if (nitroPressed) this.inputs.nitro = true;
  }

  public startGame() {
    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    sound.startEngine();
    sound.startBgm();
    this.resetGameplayState();
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.clearInputs();
      sound.stopEngine();
      sound.stopBgm();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      sound.startEngine();
      sound.startBgm();
      this.lastTime = performance.now();
    }
    this.onStateChange?.(this.state);
  }

  public restartGame() {
    this.resetGameplayState();
    this.state = 'PLAYING';
    this.onStateChange?.(this.state);
    sound.startEngine();
    sound.startBgm();
  }

  public returnToTitle() {
    this.clearInputs();
    this.state = 'TITLE';
    this.onStateChange?.(this.state);
    sound.stopEngine();
    sound.stopBgm();
  }

  private resetGameplayState() {
    const bounds = this.renderer.getRoadBounds();
    this.roadOffset = 0;
    this.routeChoice = null;
    this.routesTaken = 0;
    this.renderer.resetRoutes();
    this.player.x = bounds.x + bounds.width / 2;
    this.player.y = this.height * 0.76;
    this.player.speed = 65;
    this.playerLateralVelocity = 0;
    this.player.angle = 0;
    this.player.targetAngle = 0;
    this.isCrashing = false;
    this.crashTimer = 0;
    this.enemies = [];
    this.pickups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.skidMarks = [];
    this.enemySpawnTimer = 0.5;
    this.pickupSpawnTimer = 1.0;
    this.elapsedTime = 0;
    this.driftTime = 0;
    this.runBlastedTraffic = 0;
    this.runSpeedDemonDuration = 0;
    this.solarCoinTimer = 0;
    this.gear = 1;
    this.rpm = 1500;

    const savedHighScore = Number(localStorage.getItem('turbo_horizon_high_score')) || 0;

    this.stats = {
      score: 0,
      highScore: savedHighScore,
      distance: 0,
      coins: 0,
      speedMph: 65,
      topSpeedMph: 65,
      health: 100,
      nitro: 100,
      combo: 1,
      comboTimer: 0,
      closeCalls: 0,
      driftScore: 0,
      driftChain: 0,
      bestDriftChain: 0,
      driftMultiplier: 1.0,
      driftAngleDegrees: 0,
      slipAngle: 0,
      isDrifting: false,
      isHandbraking: false,
      counterSteerQuality: null,
      gForce: 0,
      bodyRoll: 0,
      pitchAngle: 0,
      rpm: 1500,
      gear: 1,
      raceTime: 0,
      timeRemaining: this.mode === 'time_trial' ? TIME_TRIAL_SECONDS : 0,
      challengeProgress: 0,
      junctionDistance: 0,
      routeChoice: null,
      routesTaken: 0,
      speedBoostActive: false,
      speedBoostTimer: 0,
      shieldActive: false,
      shieldTimer: 0,
      multiplayerRank: 1,
      multiplayerTotal: this.mpRivals.size + 1,
      rivals: [],
      wagerCoins: this.wagerCoins,
      wagerPinkSlip: this.wagerPinkSlip,
      wagerCarId: this.wagerCarId,
      activeTrackId: this.currentTrack.id,
      trackMapCurve: 0,
      trackProgressPct: 0,
    };
  }

  public triggerGameOver() {
    this.state = 'GAMEOVER';
    this.clearInputs();
    sound.stopEngine();
    sound.stopBgm();

    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('turbo_horizon_high_score', String(this.stats.highScore));
    }

    this.onRunComplete?.(this.stats, this.mode);
    this.onStateChange?.(this.state);
  }

  public startLoop() {
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.pollGamepad();
      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopEngine();
    sound.stopBgm();
  }

  private update(dt: number) {
    if (this.state !== 'PLAYING' && this.state !== 'TITLE') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    if (this.state === 'PLAYING') {
      this.updatePlayingState(dt);
    } else if (this.state === 'TITLE') {
      this.updateTitleState(dt);
    }

    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
  }

  private updateTitleState(dt: number) {
    const idleSpeed = 50;
    this.roadOffset += idleSpeed * dt * 20;
    this.updateRoadsideScenery(idleSpeed * dt * 20);
    const bounds = this.renderer.getRoadBounds();
    this.player.x = bounds.x + bounds.width / 2 + Math.sin(performance.now() * 0.002) * 20;
    this.player.y = this.height * 0.76;
    this.player.angle = Math.sin(performance.now() * 0.002) * 0.04;
  }

  private updatePlayingState(dt: number) {
    const bounds = this.renderer.getRoadBounds();
    this.roadEdgeContactCooldown = Math.max(0, this.roadEdgeContactCooldown - dt);

    if (this.isCrashing) {
      this.crashTimer += dt;
      this.player.angle += dt * 8;
      this.player.y += dt * 40;
      this.player.speed = Math.max(0, this.player.speed - dt * 70);
      if (Math.random() < 0.6) {
        this.addCrashSparks(this.player.x, this.player.y);
      }
      if (this.crashTimer > 1.2) {
        this.triggerGameOver();
      }
      return;
    }

    this.elapsedTime += dt;
    this.stats.raceTime = this.elapsedTime;

    if (this.mode === 'time_trial') {
      this.stats.timeRemaining = Math.max(0, TIME_TRIAL_SECONDS - this.elapsedTime);
      if (this.stats.timeRemaining === 0) {
        this.triggerGameOver();
        return;
      }
    }

    // 1. Power-ups
    if (this.stats.speedBoostActive) {
      this.stats.speedBoostTimer -= dt;
      if (this.stats.speedBoostTimer <= 0) {
        this.stats.speedBoostActive = false;
        this.stats.speedBoostTimer = 0;
      }
    }
    if (this.stats.shieldActive) {
      this.stats.shieldTimer -= dt;
      if (this.stats.shieldTimer <= 0) {
        this.stats.shieldActive = false;
        this.stats.shieldTimer = 0;
      }
    }

    // 2. Throttle & Speed Dynamics with Upgrades
    const skin = this.selectedSkin;
    const isHandbraking = this.inputs.handbrake;
    const isBraking = this.inputs.down || this.inputs.brake;
    let isBoosting = false;

    // Upgrades modifiers
    const turboBonus = this.upgrades.turboStage * 6;
    const ecuBonus = this.upgrades.ecuStage * 5;
    const handlingBonus = this.upgrades.coiloversStage * 45;
    const driftUpgradeBonus = this.upgrades.coiloversStage * 0.12;
    const nitroUpMultiplier = 1.0 + this.upgrades.nitroStage * 0.2;

    const nitroRechargeMultiplier = (skin.nitroRecharge || 1.0) * nitroUpMultiplier;
    if (this.stats.speedBoostActive) {
      isBoosting = true;
    } else if (this.inputs.nitro && this.stats.nitro > 0) {
      isBoosting = true;
      this.stats.nitro = Math.max(0, this.stats.nitro - dt * 26);
      if (Math.random() < 0.28) {
        sound.playNitro();
      }
    } else if (!this.inputs.up && !isHandbraking) {
      this.stats.nitro = Math.min(100, this.stats.nitro + dt * 4.5 * nitroRechargeMultiplier);
    }

    // Base target speed calculation with track curvature
    const baseTopSpeed = (skin.topSpeed ? 115 + (skin.topSpeed - 80) * 1.5 : 125) + turboBonus;
    let targetSpeed = 85;

    if (this.stats.speedBoostActive) {
      targetSpeed = baseTopSpeed + 65;
    } else if (isBoosting) {
      targetSpeed = baseTopSpeed + 35;
    } else if (this.inputs.up) {
      targetSpeed = baseTopSpeed;
    } else if (isHandbraking) {
      targetSpeed = 48;
    } else if (isBraking) {
      targetSpeed = 38;
    }

    const distanceBonus = Math.min(25, this.stats.distance * 0.004);
    targetSpeed += distanceBonus;

    const baseAccel = (skin.acceleration ? 26 + (skin.acceleration - 80) * 0.5 : 28) + ecuBonus;
    const accelRate = this.stats.speedBoostActive
      ? 100
      : isBoosting
        ? 80
        : isHandbraking
          ? 110
          : isBraking
            ? 95
            : baseAccel;

    if (this.player.speed < targetSpeed) {
      this.player.speed = Math.min(targetSpeed, this.player.speed + accelRate * dt);
    } else {
      this.player.speed = Math.max(targetSpeed, this.player.speed - accelRate * dt);
    }

    this.stats.speedMph = Math.round(this.player.speed);
    if (this.stats.speedMph > this.stats.topSpeedMph) {
      this.stats.topSpeedMph = this.stats.speedMph;
    }

    this.calculateGearAndRpm();
    const speedRatio = this.player.speed / 100;
    sound.updateEngine(speedRatio, isBoosting);

    // 3. ENHANCED DRIFT & STEERING WITH TRACK CURVATURE
    const steerSensitivity = this.settings?.steeringSensitivity ?? 1.0;
    let steerInput = 0;
    if (this.inputs.analogSteer !== 0) {
      steerInput = this.inputs.analogSteer;
    } else {
      steerInput = Number(this.inputs.right) - Number(this.inputs.left);
    }
    steerInput *= steerSensitivity;

    const baseHandling = (skin.handling ? 480 + (skin.handling - 80) * 8 : 520) + handlingBonus;
    const steerAcceleration = (baseHandling + (isBoosting ? 65 : 0)) * (this.player.speed / 100);

    // Enhanced grip: responsive lane transitions when steering, high directional stability when coasting, and loose slides when handbraking
    const grip = isHandbraking ? 0.38 : isBraking ? 0.8 : Math.abs(steerInput) > 0.05 ? 5.2 : 7.6;
    const maxLateralSpeed = 280 + Math.min(90, this.player.speed * 0.4);

    this.playerLateralVelocity += steerInput * steerAcceleration * dt;
    this.playerLateralVelocity *= Math.exp(-grip * dt);
    this.playerLateralVelocity = Math.max(
      -maxLateralSpeed,
      Math.min(maxLateralSpeed, this.playerLateralVelocity)
    );

    this.player.x += this.playerLateralVelocity * dt;

    const forwardVelocity = Math.max(25, this.player.speed * 0.44704);
    this.slipAngle = Math.atan2(this.playerLateralVelocity, forwardVelocity);
    const slipDegrees = (this.slipAngle * 180) / Math.PI;

    const isDrifting =
      (Math.abs(this.playerLateralVelocity) > 85 || isHandbraking) && this.player.speed > 48;

    const isCounterSteering =
      isDrifting && Math.sign(steerInput) !== 0 && Math.sign(steerInput) !== Math.sign(this.playerLateralVelocity);

    let counterSteerQuality: 'PERFECT' | 'GREAT' | 'GOOD' | null = null;
    if (isCounterSteering) {
      const counterRatio = Math.abs(steerInput) / (Math.abs(this.slipAngle) + 0.01);
      if (counterRatio >= 0.4 && counterRatio <= 1.2) {
        counterSteerQuality = 'PERFECT';
      } else if (counterRatio > 0.2) {
        counterSteerQuality = 'GREAT';
      } else {
        counterSteerQuality = 'GOOD';
      }
    }
    this.counterSteerQuality = counterSteerQuality;

    const driftAngle = (this.playerLateralVelocity / maxLateralSpeed) * -0.24;
    this.player.targetAngle = Math.max(-0.32, Math.min(0.32, steerInput * 0.11 + driftAngle));
    this.player.angle += (this.player.targetAngle - this.player.angle) * (1 - Math.exp(-18 * dt));

    this.bodyRoll = Math.max(-0.14, Math.min(0.14, -this.playerLateralVelocity / 350));
    this.pitchAngle = isBoosting ? -0.045 : isHandbraking ? 0.065 : isBraking ? 0.05 : -0.02;
    this.counterSteerAngle = isCounterSteering ? steerInput * 0.45 : steerInput * 0.35;

    // Track active lane cleanly
    const laneWidth = bounds.laneWidth || bounds.width / 4;
    this.player.lane = Math.max(0, Math.min(3, Math.floor((this.player.x - bounds.x) / laneWidth)));
    this.player.targetLane = this.player.lane;

    // Soft, non-glitchy Road Edge contact (no physics bouncing)
    const minX = bounds.x + this.player.width / 2 + 8;
    const maxX = bounds.x + bounds.width - this.player.width / 2 - 8;

    if (this.player.x < minX) {
      this.player.x = minX;
      this.playerLateralVelocity = 0;
      const speedScrub = skin.id === 'emerald_apex' ? 20 : 42;
      this.player.speed = Math.max(38, this.player.speed - dt * speedScrub);

      if (this.roadEdgeContactCooldown <= 0) {
        sound.playScreech();
        this.addSparks(this.player.x, this.player.y + 25);
        this.renderer.addCameraShake(0.18);
        this.roadEdgeContactCooldown = 0.25;
      }
    } else if (this.player.x > maxX) {
      this.player.x = maxX;
      this.playerLateralVelocity = 0;
      const speedScrub = skin.id === 'emerald_apex' ? 20 : 42;
      this.player.speed = Math.max(38, this.player.speed - dt * speedScrub);

      if (this.roadEdgeContactCooldown <= 0) {
        sound.playScreech();
        this.addSparks(this.player.x, this.player.y + 25);
        this.renderer.addCameraShake(0.18);
        this.roadEdgeContactCooldown = 0.25;
      }
    }

    // Drift Scoring
    const carDriftMultiplier = (skin.driftMultiplier || 1.0) + driftUpgradeBonus;
    if (isDrifting) {
      this.driftTime += dt;
      this.stats.driftChain = this.driftTime;
      this.stats.bestDriftChain = Math.max(this.stats.bestDriftChain, this.driftTime);

      const qualityBonus = counterSteerQuality === 'PERFECT' ? 2.5 : counterSteerQuality === 'GREAT' ? 1.8 : 1.2;
      this.driftMultiplier = Math.min(5.0, 1.0 + this.driftTime * 0.45 * qualityBonus);

      const driftPoints = Math.round(
        Math.max(0, Math.abs(this.playerLateralVelocity) - 60) *
          dt *
          0.24 *
          this.stats.combo *
          carDriftMultiplier *
          this.driftMultiplier
      );

      this.stats.driftScore += driftPoints;
      this.stats.score += driftPoints;

      if (Math.random() < 1 - Math.exp(-28 * dt)) {
        sound.playScreech();
        const tireX1 = this.player.x - 14;
        const tireX2 = this.player.x + 14;
        const tireY = this.player.y + 36;
        this.addSkidMark(tireX1, tireY, skin.glow);
        this.addSkidMark(tireX2, tireY, skin.glow);
        this.addSmoke(tireX1, tireY);
        this.addSmoke(tireX2, tireY);
      }
    } else {
      const decayRate = skin.id === 'drift_meister' ? 0.6 : 1.2;
      this.driftTime = Math.max(0, this.driftTime - dt * decayRate);
      if (this.driftTime === 0) {
        this.driftMultiplier = 1.0;
        this.stats.driftChain = 0;
      }
    }

    // 4. Track & Scenery Scrolling
    const roadScrollSpeed = this.player.speed * 8 * dt;
    const previousProgress = this.roadOffset * 0.12;
    this.roadOffset += roadScrollSpeed;
    this.updateRouteJunctions(previousProgress, this.roadOffset * 0.12);
    this.updateRoadsideScenery(roadScrollSpeed);
    this.updateSkidMarks(roadScrollSpeed);

    const distanceDelta = this.player.speed * dt * 0.44704;
    this.stats.distance += distanceDelta;

    const scoreMultiplier = this.stats.speedBoostActive ? this.stats.combo * 2 : this.stats.combo;
    const scoreDelta = Math.round((this.player.speed / 10) * dt * 14 * scoreMultiplier);
    this.stats.score += scoreDelta;

    if (this.stats.combo > 1) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.combo = 1;
      }
    }

    // 5. Enemies & Pickups
    this.updateEnemies(dt, roadScrollSpeed);
    this.updatePickups(dt, roadScrollSpeed);
    this.checkCollisionsAndNearMisses();

    // 6. Update Stats Object
    this.stats.isDrifting = isDrifting;
    this.stats.isHandbraking = isHandbraking;
    this.stats.slipAngle = this.slipAngle;
    this.stats.driftAngleDegrees = Math.round(slipDegrees);
    this.stats.driftMultiplier = Number(this.driftMultiplier.toFixed(1));
    this.stats.counterSteerQuality = this.counterSteerQuality;
    this.stats.bodyRoll = this.bodyRoll;
    this.stats.pitchAngle = this.pitchAngle;
    this.stats.gear = this.gear;
    this.stats.rpm = Math.round(this.rpm);
    this.stats.gForce = Number((Math.abs(this.playerLateralVelocity) / 98).toFixed(2));
    this.stats.trackMapCurve = this.renderer.getTrackCurveAhead();
    this.stats.trackProgressPct = Math.min(100, (this.stats.distance / 5000) * 100);

    // Multiplayer Sync
    if (this.mode === 'multiplayer' || this.mode === 'duel' || this.mode === 'cup_race') {
      this.syncMultiplayerState();
    }

    this.evaluateChallenges();
    this.onStatsChange?.(this.stats);

    // Check finish line for Duel or Sprint
    if ((this.mode === 'duel' || this.mode === 'cup_race') && this.stats.distance >= 5000) {
      this.triggerGameOver();
    } else if (this.mode === 'daily_challenge' && this.stats.challengeProgress >= DAILY_CHALLENGE_TARGET) {
      this.triggerGameOver();
    }
  }

  private calculateGearAndRpm() {
    const speed = this.player.speed;
    if (speed < 30) this.gear = 1;
    else if (speed < 55) this.gear = 2;
    else if (speed < 85) this.gear = 3;
    else if (speed < 115) this.gear = 4;
    else if (speed < 150) this.gear = 5;
    else this.gear = 6;

    const gearBaseSpeed = [0, 0, 30, 55, 85, 115, 150][this.gear];
    const gearMaxSpeed = [0, 30, 55, 85, 115, 150, 220][this.gear];
    const fraction = (speed - gearBaseSpeed) / Math.max(1, gearMaxSpeed - gearBaseSpeed);
    this.rpm = 2500 + fraction * 5500;
  }

  private syncMultiplayerState() {
    const now = performance.now();
    if (now - this.lastWsSyncTime > 40) {
      this.lastWsSyncTime = now;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'state_update',
            playerId: this.mpPlayerId,
            x: this.player.x,
            distance: Math.round(this.stats.distance),
            speed: this.stats.speedMph,
            angle: this.player.angle,
            driftChain: Number(this.stats.driftChain.toFixed(1)),
            driftScore: this.stats.driftScore,
            score: this.stats.score,
            isDrifting: this.stats.isDrifting,
            isNitro: this.inputs.nitro || this.stats.speedBoostActive,
            health: this.stats.health,
          })
        );
      }
    }

    const rivalList = Array.from(this.mpRivals.values());
    this.stats.rivals = rivalList;
    this.stats.multiplayerTotal = rivalList.length + 1;

    let aheadCount = 0;
    for (const r of rivalList) {
      if (r.distance > this.stats.distance) {
        aheadCount++;
      }
    }
    this.stats.multiplayerRank = aheadCount + 1;
  }

  private evaluateChallenges() {
    const progress = loadProgress();
    let hasChanges = false;

    for (const ch of INITIAL_CHALLENGES) {
      const state = progress.challenges[ch.id] || { current: 0, completed: false, claimed: false };
      if (state.completed) continue;

      let value = 0;
      if (ch.id === 'drift_initiate') value = this.stats.driftScore;
      else if (ch.id === 'drift_chain_master') value = this.stats.bestDriftChain;
      else if (ch.id === 'drift_legend') value = this.stats.driftScore;
      else if (ch.id === 'speed_130') value = this.stats.topSpeedMph;
      else if (ch.id === 'close_calls_10') value = this.stats.closeCalls;
      else if (ch.id === 'speed_demon_160') value = this.stats.topSpeedMph;
      else if (ch.id === 'distance_3000') value = this.stats.distance;
      else if (ch.id === 'junctions_6') value = this.stats.routesTaken;
      else if (ch.id === 'distance_10000') value = this.stats.distance;
      else if (ch.id === 'coins_50') value = this.stats.coins;
      else if (ch.id === 'ram_destroyer') value = this.runBlastedTraffic;
      else if (ch.id === 'multiplayer_racer') value = this.mode === 'multiplayer' || this.mode === 'duel' ? 1 : 0;

      if (value > state.current) {
        state.current = value;
        hasChanges = true;
      }

      if (value >= ch.target && !state.completed) {
        state.completed = true;
        hasChanges = true;
        sound.playChallengeComplete();
        this.addFloatingText(`🏆 CHALLENGE: ${ch.title}!`, this.player.x, this.player.y - 50, '#fbbf24', 24, true);
        this.onChallengeCompleted?.(ch);
      }

      progress.challenges[ch.id] = state;
    }

    if (hasChanges) {
      saveProgress(progress);
    }
  }

  private updateRouteJunctions(previousProgress: number, currentProgress: number) {
    let nextJunction = (Math.floor(previousProgress / JUNCTION_SPACING) + 1) * JUNCTION_SPACING;
    while (nextJunction <= currentProgress) {
      this.renderer.addRouteTurn(this.routeChoice ?? 0, nextJunction);
      this.routesTaken += 1;
      this.routeChoice = null;
      nextJunction += JUNCTION_SPACING;
    }

    this.stats.junctionDistance = Math.max(0, nextJunction - currentProgress);
    if (this.stats.junctionDistance <= 220) {
      if (this.inputs.left !== this.inputs.right) {
        this.routeChoice = this.inputs.left ? -1 : 1;
      }
    } else {
      this.routeChoice = null;
    }
    this.stats.routeChoice = this.routeChoice === -1 ? 'left' : this.routeChoice === 1 ? 'right' : null;
    this.stats.routesTaken = this.routesTaken;
  }

  private updateRoadsideScenery(scrollDelta: number) {
    const bounds = this.renderer.getRoadBounds();

    for (const obj of this.roadsideObjects) {
      obj.y += scrollDelta;
      if (obj.y > this.height + 140) {
        obj.y = -100;
        obj.type = this.currentTrack.sceneryType;
        obj.x = obj.side === 'left' ? bounds.x - 36 : bounds.x + bounds.width + 36;
      }
    }
  }

  private updateSkidMarks(scrollDelta: number) {
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const sm = this.skidMarks[i];
      sm.y += scrollDelta;
      sm.alpha -= 0.005;
      if (sm.y > this.height + 50 || sm.alpha <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number, roadScrollDelta: number) {
    const bounds = this.renderer.getRoadBounds();

    this.enemySpawnTimer -= dt;
    const spawnInterval = Math.max(1.0, 2.3 - Math.min(1.2, this.stats.distance * 0.0003));

    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnTimer = spawnInterval + Math.random() * 0.8;
      this.spawnEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.isBlasted) {
        // Tip over onto side (target roll is ~85° / 1.5 rad on its side)
        const tipDirection = (e.blastVx && e.blastVx > 0 ? 1 : -1);
        const targetTip = tipDirection * (Math.PI / 2 * 0.94);
        e.tipAngle = (e.tipAngle || 0) + (targetTip - (e.tipAngle || 0)) * Math.min(1, dt * 8.0);
        e.blastRot = e.tipAngle;

        // Ground friction decelerates the lateral slide toward the road side / shoulder
        if (e.blastVx) {
          e.x += e.blastVx * dt;
          e.blastVx *= Math.max(0, 1 - dt * 2.8);
        }

        // Tipped-over car grinds to a halt rapidly on the asphalt/grass
        e.speed = Math.max(0, e.speed - dt * 85);
        // Relative motion along highway: slides backward as player drives past
        const relSpeed = (this.player.speed - e.speed) * 8 * dt;
        e.y += relSpeed;

        // Friction sparks & smoke while skidding on its side
        if (Math.abs(e.blastVx || 0) > 15 || e.speed > 5) {
          if (Math.random() < 0.45) {
            this.addSmoke(e.x, e.y);
          }
          if (Math.random() < 0.35) {
            this.addSparks(e.x, e.y + 12);
          }
        } else {
          // Resting on roadside shoulder: gentle radiator smoke puff
          if (Math.random() < 0.06) {
            this.addSmoke(e.x, e.y);
          }
        }

        // Only splice when fallen far behind the player's view
        if (e.y > this.height + 320) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      const relSpeed = (this.player.speed - e.speed) * 8 * dt;
      e.y += relSpeed;

      if (e.type === 'police') {
        e.sirenTimer += dt;
      }
      if (e.blinker) {
        e.blinkerTimer += dt;
      }

      if (this.selectedSkin.id === 'urban_enforcer' && Math.abs(e.x - this.player.x) < 40 && e.y < this.player.y) {
        e.targetLane = e.lane === 0 ? 1 : 0;
      }

      if (e.type === 'coupe' && Math.random() < 0.01 && !e.blinker) {
        const laneShift = Math.random() > 0.5 ? 1 : -1;
        const newLane = Math.max(0, Math.min(3, e.lane + laneShift));
        if (newLane !== e.lane) {
          e.targetLane = newLane;
          e.blinker = laneShift > 0 ? 'right' : 'left';
          e.blinkerTimer = 0;
        }
      }

      if (e.targetLane !== e.lane) {
        const targetX = bounds.x + (e.targetLane + 0.5) * bounds.laneWidth;
        const dx = targetX - e.x;
        e.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 140);
        e.angle = Math.sign(dx) * 0.08;
        if (Math.abs(dx) < 4) {
          e.x = targetX;
          e.lane = e.targetLane;
          e.blinker = null;
          e.angle = 0;
        }
      }

      if (e.y > this.height + 200 || e.y < -350) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnEnemy() {
    const bounds = this.renderer.getRoadBounds();
    const lane = Math.floor(Math.random() * 4);
    const isOccupied = this.enemies.some((e) => Math.abs(e.y - -120) < 160 && e.lane === lane);
    if (isOccupied) return;

    const occupiedLanes = new Set(this.enemies.filter((e) => e.y < 50 && e.y > -250).map((e) => e.lane));
    if (occupiedLanes.size >= 3 && !occupiedLanes.has(lane)) {
      return;
    }

    const typeRoll = Math.random();
    let type: VehicleType = 'sedan';
    let width = 42;
    let height = 78;
    let speed = 45 + Math.random() * 25;
    let color = '#2563eb';
    let secondaryColor = '#1d4ed8';

    if (typeRoll < 0.2) {
      type = 'truck';
      width = 46;
      height = 135;
      speed = 35 + Math.random() * 15;
      color = '#e2e8f0';
      secondaryColor = '#64748b';
    } else if (typeRoll < 0.45) {
      type = 'coupe';
      width = 42;
      height = 80;
      speed = 65 + Math.random() * 20;
      color = '#f59e0b';
      secondaryColor = '#78350f';
    } else if (typeRoll < 0.6) {
      type = 'police';
      width = 42;
      height = 80;
      speed = 70 + Math.random() * 25;
      color = '#0f172a';
      secondaryColor = '#f8fafc';
    } else if (typeRoll < 0.75) {
      type = 'taxi';
      width = 42;
      height = 78;
      speed = 50 + Math.random() * 15;
      color = '#facc15';
      secondaryColor = '#1e293b';
    }

    const x = bounds.x + (lane + 0.5) * bounds.laneWidth;

    this.enemies.push({
      id: this.enemyIdCounter++,
      x,
      y: -120,
      width,
      height,
      speed,
      maxSpeed: speed,
      acceleration: 0,
      handling: 0,
      type,
      color,
      secondaryColor,
      angle: 0,
      targetAngle: 0,
      lane,
      targetLane: lane,
      blinker: null,
      blinkerTimer: 0,
      sirenTimer: 0,
      passedPlayer: false,
      nearMissAwarded: false,
    });
  }

  private updatePickups(dt: number, roadScrollDelta: number) {
    const bounds = this.renderer.getRoadBounds();
    this.pickupSpawnTimer -= dt;

    if (this.pickupSpawnTimer <= 0) {
      this.pickupSpawnTimer = 3.5 + Math.random() * 2.0;
      const lane = Math.floor(Math.random() * 4);
      const px = bounds.x + (lane + 0.5) * bounds.laneWidth;
      const roll = Math.random();

      let type: PickupType = 'coin';
      if (roll < (this.mode === 'daily_challenge' ? 0.6 : 0.38)) {
        type = 'coin';
      } else if (roll < 0.58) {
        type = 'speed_boost';
      } else if (roll < 0.78) {
        type = 'shield';
      } else if (roll < 0.88) {
        type = 'repair';
      } else {
        type = 'nitro';
      }

      this.pickups.push({
        id: this.pickupIdCounter++,
        x: px,
        y: -50,
        width: 28,
        height: 28,
        type,
        bobTimer: Math.random() * 10,
        collected: false,
      });
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.y += roadScrollDelta;
      if (!this.settings?.reducedMotion) p.bobTimer += dt;

      const dx = Math.abs(p.x - this.player.x);
      const dy = Math.abs(p.y - this.player.y);

      if (dx < 34 && dy < 48 && !p.collected) {
        p.collected = true;
        this.collectPickup(p);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.y > this.height + 60) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(p: Pickup) {
    const skin = this.selectedSkin;
    const durationBonus = skin.id === 'phantom_valkyrie' ? 3.0 : 0;

    if (p.type === 'speed_boost') {
      sound.playSpeedBoost();
      this.stats.speedBoostActive = true;
      this.stats.speedBoostTimer = 6.0 + durationBonus;
      this.stats.score += 500;
      this.addFloatingText('⚡ HYPER SPEED BOOST!', p.x, p.y, '#f59e0b', 22, true);
      this.addSparkles(p.x, p.y, '#f59e0b');
    } else if (p.type === 'shield') {
      sound.playShieldUp();
      this.stats.shieldActive = true;
      this.stats.shieldTimer = 7.0 + durationBonus;
      this.stats.score += 500;
      this.addFloatingText('🛡️ SHIELD INVINCIBLE!', p.x, p.y, '#06b6d4', 22, true);
      this.addSparkles(p.x, p.y, '#06b6d4');
    } else if (p.type === 'coin') {
      sound.playCoin();
      this.stats.coins += 1;
      this.stats.challengeProgress = this.stats.coins;
      const coinScore = 150 * this.stats.combo;
      this.stats.score += coinScore;
      this.addFloatingText(`+${coinScore}`, p.x, p.y, '#fbbf24', 18);
      this.addSparkles(p.x, p.y, '#fbbf24');
    } else if (p.type === 'nitro') {
      sound.playNitro();
      this.stats.nitro = Math.min(100, this.stats.nitro + 35);
      this.stats.score += 200;
      this.addFloatingText('NITRO SURGE!', p.x, p.y, '#38bdf8', 20);
      this.addSparkles(p.x, p.y, '#38bdf8');
    } else if (p.type === 'repair') {
      sound.playRepair();
      this.stats.health = Math.min(100, this.stats.health + 30);
      this.addFloatingText('REPAIRED +30%', p.x, p.y, '#34d399', 20);
      this.addSparkles(p.x, p.y, '#34d399');
    }
  }

  private checkCollisionsAndNearMisses() {
    const pw = this.player.width * 0.78;
    const ph = this.player.height * 0.82;
    const px = this.player.x;
    const py = this.player.y;
    const skin = this.selectedSkin;

    for (const e of this.enemies) {
      if (e.isBlasted) continue;

      const ew = e.width * 0.8;
      const eh = e.height * 0.85;
      const ex = e.x;
      const ey = e.y;

      const overlapX = Math.abs(px - ex) < (pw + ew) / 2;
      const overlapY = Math.abs(py - ey) < (ph + eh) / 2;

      if (overlapX && overlapY) {
        const canRam =
          this.stats.shieldActive ||
          skin.id === 'muscle_69' ||
          this.upgrades.armorStage >= 2 ||
          (skin.weight > 1500 && this.player.speed > 110);
        if (canRam) {
          this.handleShieldSmash(e);
        } else {
          this.handleCrash(e);
        }
        break;
      }

      const lateralDist = Math.abs(px - ex);
      const verticalOverlap = Math.abs(py - ey) < (ph + eh) / 2 + 12;
      const isClose = lateralDist > (pw + ew) / 2 && lateralDist < (pw + ew) / 2 + 24;

      if (verticalOverlap && isClose && !e.nearMissAwarded && this.player.speed > 68) {
        e.nearMissAwarded = true;
        this.stats.closeCalls += 1;
        this.stats.combo = Math.min(5, this.stats.combo + 1);
        this.stats.comboTimer = 3.6;
        this.stats.nitro = Math.min(100, this.stats.nitro + 14);

        const bonus = 250 * this.stats.combo;
        this.stats.score += bonus;
        sound.playWhoosh();
        if (!this.settings?.reducedMotion) this.renderer.addCameraShake(0.25);

        this.addFloatingText(`CLOSE CALL! +${bonus}`, px, py - 40, '#f43f5e', 22, true);
      }
    }
  }

  private handleShieldSmash(enemy: Vehicle) {
    sound.playShieldHit();
    if (!this.settings?.reducedMotion) this.renderer.addCameraShake(0.5);
    enemy.isBlasted = true;
    this.runBlastedTraffic += 1;

    const blastDir = enemy.x < this.player.x ? -1 : 1;
    enemy.blastVx = blastDir * (190 + Math.random() * 60);
    enemy.blastVy = 0; // Do not fly up into the air
    enemy.tipAngle = blastDir * 0.25;
    enemy.blastRot = enemy.tipAngle;
    enemy.speed = Math.max(12, enemy.speed * 0.35);

    const bonus = 500 * this.stats.combo;
    this.stats.score += bonus;
    this.addFloatingText(`RAM BLAST! +${bonus}`, enemy.x, enemy.y - 20, '#06b6d4', 24, true);

    this.particles.push({
      x: (this.player.x + enemy.x) / 2,
      y: (this.player.y + enemy.y) / 2,
      vx: 0,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      size: 44,
      color: '#38bdf8',
      alpha: 1,
      type: 'shield_shockwave',
    });

    this.addCrashSparks(enemy.x, enemy.y);
  }

  private handleCrash(enemy: Vehicle) {
    if (this.isCrashing) return;

    enemy.isBlasted = true;
    const blastDir = enemy.x < this.player.x ? -1 : 1;
    enemy.blastVx = blastDir * (135 + Math.random() * 45);
    enemy.blastVy = 0; // Do not fly into the sky
    enemy.tipAngle = blastDir * 0.25;
    enemy.blastRot = enemy.tipAngle;
    enemy.speed = Math.max(8, enemy.speed * 0.25);
    sound.playCrash();
    if (!this.settings?.reducedMotion) this.renderer.addCameraShake(0.8);
    this.hitstopTimer = 0.08;

    const impactSpeed = Math.abs(this.player.speed - enemy.speed);
    const armorBonus = this.upgrades.armorStage * 8;
    const armorFactor = (this.selectedSkin.armor + armorBonus) / 100;
    const baseDamage = Math.max(25, Math.round(impactSpeed * 0.85 * (1.6 - armorFactor)));

    const damage = this.selectedSkin.id === 'muscle_69' ? Math.round(baseDamage * 0.4) : baseDamage;
    this.stats.health = Math.max(0, this.stats.health - damage);

    this.addCrashSparks((this.player.x + enemy.x) / 2, (this.player.y + enemy.y) / 2);
    this.addFloatingText(`CRASH -${damage}%`, this.player.x, this.player.y - 30, '#ef4444', 24, true);

    if (this.stats.health <= 0) {
      if (this.mode === 'time_trial') {
        this.stats.health = 1;
        this.player.speed = 25;
      } else {
        this.isCrashing = true;
        this.crashTimer = 0;
        this.player.speed = 40;
      }
    } else {
      const bounceDir = this.player.x < enemy.x ? -1 : 1;
      this.player.x += bounceDir * 35;
      this.playerLateralVelocity = bounceDir * 80;
      this.player.speed = Math.max(35, this.player.speed - 30);
    }
  }

  private render() {
    this.renderer.renderEnvironment(
      this.roadOffset,
      this.timeOfDay,
      this.roadsideObjects,
      this.skidMarks,
      this.stats.junctionDistance
    );

    for (const enemy of this.enemies) {
      this.renderer.renderEnemy(enemy);
    }

    if ((this.mode === 'multiplayer' || this.mode === 'duel' || this.mode === 'cup_race') && this.mpRivals.size > 0) {
      this.renderer.renderRivals(Array.from(this.mpRivals.values()), this.stats.distance);
    }

    const isBoosting = this.inputs.nitro && this.stats.nitro > 0;
    const isBraking = this.inputs.down || this.inputs.brake || this.inputs.handbrake;

    this.renderer.renderPlayerCar(
      this.player,
      this.selectedSkin,
      isBoosting,
      isBraking,
      this.timeOfDay,
      this.stats.shieldActive,
      this.stats.speedBoostActive,
      this.bodyRoll,
      this.pitchAngle,
      this.counterSteerAngle
    );

    this.renderer.renderPickups(this.pickups, this.settings?.colorblindPickups ?? false);
    this.renderer.renderParticles(this.particles);
    this.renderer.renderFloatingTexts(this.floatingTexts);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private addSmoke(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 40,
      vy: 20 + Math.random() * 40,
      life: 0.45,
      maxLife: 0.45,
      size: 14 + Math.random() * 12,
      color: '#cbd5e1',
      alpha: 0.65,
      type: 'smoke',
    });
  }

  private addSparks(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: 30 + Math.random() * 100,
        life: 0.28,
        maxLife: 0.28,
        size: 5,
        color: '#fef08a',
        alpha: 1,
        type: 'spark',
      });
    }
  }

  private addCrashSparks(x: number, y: number) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45,
        maxLife: 0.45,
        size: 6,
        color: Math.random() > 0.5 ? '#f97316' : '#fef08a',
        alpha: 1,
        type: 'spark',
      });
    }
  }

  private addSparkles(x: number, y: number, color: string) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        size: 6,
        color,
        alpha: 1,
        type: 'spark',
      });
    }
  }

  private addSkidMark(x: number, y: number, color?: string) {
    this.skidMarks.push({
      x,
      y,
      width: 10,
      length: 22,
      alpha: 0.85,
      color,
    });
  }

  private addFloatingText(
    text: string,
    x: number,
    y: number,
    color = '#ffffff',
    size = 20,
    isMajor = false
  ) {
    this.floatingTexts.push({
      id: this.textIdCounter++,
      text,
      x,
      y,
      vy: isMajor ? -45 : -35,
      life: isMajor ? 1.4 : 0.9,
      maxLife: isMajor ? 1.4 : 0.9,
      color,
      size,
      scale: isMajor ? 1.3 : 1.0,
    });
  }

  public resize() {
    const parent = this.canvas.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;

    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;

    const roadW = Math.min(480, w * 0.88);
    this.renderer.setDimensions(w, h, roadW);
    this.player.y = this.height * 0.76;
  }

  private clearInputs() {
    this.inputs = {
      left: false,
      right: false,
      up: false,
      down: false,
      nitro: false,
      brake: false,
      handbrake: false,
      analogSteer: 0,
    };
  }

  public destroy() {
    this.stopLoop();
    this.disconnectMultiplayer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
