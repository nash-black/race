/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { RacingGameEngine } from './game/engine';
import { CAR_SKINS } from './game/renderer';
import { sound } from './game/audio';
import {
  BountyRacer,
  CarSkin,
  CarUpgrades,
  Challenge,
  ChatMessage,
  GameMode,
  GameSettings,
  GameState,
  GameStats,
  InputState,
  MarketListing,
  OnlineCup,
  RaceChallengeInvite,
  TrackId,
  TRACKS,
} from './game/types';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { GmailShareModal } from './components/GmailShareModal';
import { TouchControls } from './components/TouchControls';
import { SettingsModal } from './components/SettingsModal';
import { TutorialModal } from './components/TutorialModal';
import { ChallengesModal } from './components/ChallengesModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { FriendsAndWagerModal } from './components/FriendsAndWagerModal';
import { OnlineCupsModal } from './components/OnlineCupsModal';
import { CarTuningModal } from './components/CarTuningModal';
import { CarCustomizationLobbyModal } from './components/CarCustomizationLobbyModal';
import { MarketplaceModal } from './components/MarketplaceModal';
import { BountyBoardModal } from './components/BountyBoardModal';
import { InGameChat } from './components/InGameChat';
import { initAuth } from './services/gmail';
import {
  calculateCarStatsWithUpgrades,
  CustomCarStyle,
  DAILY_CHALLENGE_TARGET,
  DEFAULT_CAR_UPGRADES,
  getDailyChallengeDate,
  getRankFromPoints,
  loadProgress,
  loadSettings,
  PlayerProgress,
  saveProgress,
  saveSettings,
  SKIN_UNLOCK_COSTS,
  UPGRADE_COSTS,
} from './services/progress';

const createEmptyStats = (highScore = 0): GameStats => ({
  score: 0,
  highScore,
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
  activeTrackId: 'tokyo_midnight',
  wagerCoins: 0,
  wagerPinkSlip: false,
  trackMapCurve: 0,
  trackProgressPct: 0,
});

function getSavedHighScore(): number {
  const saved = Number(localStorage.getItem('turbo_horizon_high_score'));
  return Number.isFinite(saved) ? Math.max(0, saved) : 0;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RacingGameEngine | null>(null);
  const touchSteeringPointer = useRef<number | null>(null);

  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [selectedSkin, setSelectedSkin] = useState<CarSkin>(() => {
    const savedProgress = loadProgress();
    const candidate = CAR_SKINS.find((skin) => skin.id === savedProgress.selectedSkinId);
    return candidate && savedProgress.unlockedSkins.includes(candidate.id) ? candidate : CAR_SKINS[0];
  });
  const [selectedTrack, setSelectedTrack] = useState<TrackId>(() => {
    const saved = loadProgress();
    return saved.activeTrackId || 'tokyo_midnight';
  });
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals state
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    const savedSettings = loadSettings();
    return savedSettings.showTutorial;
  });
  const [showChallenges, setShowChallenges] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showCups, setShowCups] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showBounties, setShowBounties] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Real-time online invites & chat
  const [incomingChallenges, setIncomingChallenges] = useState<RaceChallengeInvite[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [garageNotice, setGarageNotice] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>(() => createEmptyStats(getSavedHighScore()));

  const currentRankInfo = getRankFromPoints(progress.rankPoints || 0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new RacingGameEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setOnStatsChange((newStats) => setStats({ ...newStats }));
    engine.setOnStateChange(setGameState);
    engine.setOnChallengeCompleted(() => {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
      });
    });

    // In-game online challenge invites
    engine.setOnChallengeInvite((invite) => {
      setIncomingChallenges((prev) => [...prev.filter((c) => c.id !== invite.id), invite]);
    });

    // Live chat receiver
    engine.setOnChatMessage((msg) => {
      setChatMessages((prev) => [...prev.slice(-40), msg]);
    });

    // Race finish & Wager / Pink Slip Payout
    engine.setOnRaceFinished((result) => {
      if (result.wagerCoins > 0 || result.wagerPinkSlip) {
        setProgress((prev) => {
          const won = result.winnerName === prev.driverName;
          const updatedCoins = won
            ? prev.bankedCoins + result.wagerCoins * 2
            : Math.max(0, prev.bankedCoins - result.wagerCoins);
          const updatedWins = won ? (prev.wins || 0) + 1 : prev.wins || 0;
          const updatedLosses = !won ? (prev.losses || 0) + 1 : prev.losses || 0;
          const updatedStreak = won ? (prev.winStreak || 0) + 1 : 0;
          const updatedRankPoints = won
            ? (prev.rankPoints || 0) + 250
            : Math.max(0, (prev.rankPoints || 0) - 80);
          const updatedBounty = won ? (prev.bounty || 1000) + 500 : Math.max(500, (prev.bounty || 1000) - 200);

          let updatedWonSlips = [...(prev.wonPinkSlips || [])];
          let updatedUnlocked = [...prev.unlockedSkins];

          if (won && result.wagerPinkSlip) {
            confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
            sound.playRankUp();
          }

          const upd: PlayerProgress = {
            ...prev,
            bankedCoins: updatedCoins,
            wins: updatedWins,
            losses: updatedLosses,
            winStreak: updatedStreak,
            rankPoints: updatedRankPoints,
            bounty: updatedBounty,
            wonPinkSlips: updatedWonSlips,
            unlockedSkins: updatedUnlocked,
          };
          saveProgress(upd);
          return upd;
        });
      }
    });

    engine.setOnRunComplete((runStats, mode) => {
      const today = getDailyChallengeDate();
      const completedDaily =
        mode === 'daily_challenge' && runStats.challengeProgress >= DAILY_CHALLENGE_TARGET;

      setProgress((current) => {
        const challengeAlreadyCompleted =
          current.dailyChallengeDate === today && current.dailyChallengeCompleted;
        const dailyBonus = completedDaily && !challengeAlreadyCompleted ? 25 : 0;
        const pointsEarned = Math.round(runStats.score / 200) + Math.round(runStats.driftScore / 100);

        const updated: PlayerProgress = {
          ...current,
          bankedCoins: current.bankedCoins + runStats.coins + dailyBonus,
          rankPoints: (current.rankPoints || 0) + pointsEarned,
          bounty: (current.bounty || 1000) + Math.round(runStats.score / 500),
          bestScores: {
            ...current.bestScores,
            [mode]: Math.max(current.bestScores[mode] || 0, runStats.score),
          },
          dailyChallengeDate: today,
          dailyChallengeCompleted:
            completedDaily || (current.dailyChallengeDate === today && current.dailyChallengeCompleted),
        };
        saveProgress(updated);
        return updated;
      });

      // Post score to server leaderboard
      if (runStats.score > 500) {
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: progress.driverName || 'Racer 01',
            score: runStats.score,
            driftScore: runStats.driftScore,
            distance: Math.round(runStats.distance),
            topSpeed: runStats.topSpeedMph,
            carId: selectedSkin.id,
            mode,
            bounty: progress.bounty || 1500,
          }),
        }).catch((e) => console.warn('Could not post score to server leaderboard:', e));
      }
    });

    engine.setSkin(selectedSkin);
    engine.setTrack(selectedTrack);
    engine.setUpgrades(progress.carUpgrades[selectedSkin.id] || DEFAULT_CAR_UPGRADES);
    engine.setSettings(settings);
    engine.setMode(selectedMode);

    // Register driver with server
    engine.registerDriver({
      id: progress.driverTag || '#1001',
      name: progress.driverName || 'Racer 01',
      tag: progress.driverTag || '#1001',
      rank: currentRankInfo.rank,
      rankTitle: currentRankInfo.title,
      bounty: progress.bounty || 1500,
      wins: progress.wins || 0,
      losses: progress.losses || 0,
      winStreak: progress.winStreak || 0,
      carId: selectedSkin.id,
    });

    engine.startLoop();

    const unsubscribeAuth = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );

    // Keyboard shortcut for Radio Chat ('T')
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 't' || e.key === 'T') && gameState === 'PLAYING') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setShowChat((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    saveSettings(settings);
    sound.setVolume(settings.masterVolume);
    if (engineRef.current) {
      engineRef.current.setSettings(settings);
      engineRef.current.setMode(selectedMode);
    }
    document.documentElement.dataset.highContrast = String(settings.highContrast);
    document.documentElement.dataset.largeHud = String(settings.largeHud);
    document.documentElement.dataset.reducedMotion = String(settings.reducedMotion);
  }, [settings, selectedMode]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleStartGame = useCallback(() => {
    setShareStatus(null);
    if (engineRef.current) {
      engineRef.current.setSettings(settings);
      engineRef.current.setTrack(selectedTrack);
      engineRef.current.setUpgrades(progress.carUpgrades[selectedSkin.id] || DEFAULT_CAR_UPGRADES);
      engineRef.current.setMode(selectedMode);
      engineRef.current.startGame();
    }
  }, [settings, selectedMode, selectedTrack, selectedSkin, progress.carUpgrades]);

  const handleRestartGame = useCallback(() => {
    setShareStatus(null);
    if (engineRef.current) {
      engineRef.current.setSettings(settings);
      engineRef.current.setTrack(selectedTrack);
      engineRef.current.setUpgrades(progress.carUpgrades[selectedSkin.id] || DEFAULT_CAR_UPGRADES);
      engineRef.current.setMode(selectedMode);
      engineRef.current.restartGame();
    }
  }, [settings, selectedMode, selectedTrack, selectedSkin, progress.carUpgrades]);

  const handleSelectTrack = useCallback((trackId: TrackId) => {
    setSelectedTrack(trackId);
    setProgress((prev) => ({ ...prev, activeTrackId: trackId }));
    engineRef.current?.setTrack(trackId);
  }, []);

  const handleStartMultiplayer = useCallback(
    (roomCode: string, driverName: string, mpMode: 'sprint' | 'drift_battle' | 'endless_cruise') => {
      setSelectedMode('multiplayer');
      if (engineRef.current) {
        engineRef.current.setMode('multiplayer');
        engineRef.current.connectMultiplayer(roomCode, driverName, selectedTrack);
        engineRef.current.startGame();
      }
    },
    [selectedTrack]
  );

  // Send 1v1 challenge
  const handleSendChallenge = useCallback(
    (targetId: string, trackId: TrackId, wagerCoins: number, pinkSlip: boolean) => {
      if (engineRef.current) {
        engineRef.current.sendChallenge(
          targetId,
          wagerCoins,
          pinkSlip,
          trackId,
          'sprint',
          {
            id: progress.driverTag || '#1001',
            name: progress.driverName || 'Racer 01',
            rank: currentRankInfo.rank,
            bounty: progress.bounty || 1500,
            carId: selectedSkin.id,
          }
        );
      }
    },
    [progress, currentRankInfo, selectedSkin]
  );

  // Accept incoming challenge
  const handleAcceptChallenge = useCallback(
    (challenge: RaceChallengeInvite) => {
      setSelectedTrack(challenge.trackId);
      setSelectedMode('duel');
      if (engineRef.current) {
        engineRef.current.setTrack(challenge.trackId);
        engineRef.current.respondChallenge(
          challenge.id,
          true,
          challenge.wagerCoins,
          challenge.wagerPinkSlip,
          challenge.trackId,
          progress.driverName
        );
        engineRef.current.connectMultiplayer(
          `duel_${challenge.id.slice(0, 8)}`,
          progress.driverName,
          challenge.trackId,
          challenge.wagerCoins,
          challenge.wagerPinkSlip
        );
        engineRef.current.startGame();
      }
      setIncomingChallenges((prev) => prev.filter((c) => c.id !== challenge.id));
      setShowFriends(false);
    },
    [progress.driverName]
  );

  // Decline challenge
  const handleDeclineChallenge = useCallback(
    (challengeId: string) => {
      engineRef.current?.respondChallenge(challengeId, false, 0, false, 'tokyo_midnight', progress.driverName);
      setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    },
    [progress.driverName]
  );

  // Enter online cup
  const handleEnterCup = useCallback(
    (cup: OnlineCup) => {
      if (progress.bankedCoins < cup.entryFee) return;

      setProgress((prev) => ({
        ...prev,
        bankedCoins: prev.bankedCoins - cup.entryFee,
      }));

      setSelectedTrack(cup.trackId);
      setSelectedMode('cup_race');
      setShowCups(false);

      if (engineRef.current) {
        engineRef.current.setTrack(cup.trackId);
        engineRef.current.setMode('cup_race');
        engineRef.current.startGame();
      }
    },
    [progress.bankedCoins]
  );

  // Tuning upgrades
  const handleUpgradePart = useCallback(
    (carId: string, part: keyof CarUpgrades) => {
      const currentCarUpgrades = progress.carUpgrades[carId] || DEFAULT_CAR_UPGRADES;
      const currentStage = currentCarUpgrades[part];
      if (currentStage >= 3) return;

      const cost =
        currentStage === 0
          ? UPGRADE_COSTS[1]
          : currentStage === 1
            ? UPGRADE_COSTS[2]
            : UPGRADE_COSTS[3];

      if (progress.bankedCoins < cost) return;

      const nextUpgrades: CarUpgrades = {
        ...currentCarUpgrades,
        [part]: currentStage + 1,
      };

      setProgress((prev) => {
        const upd: PlayerProgress = {
          ...prev,
          bankedCoins: prev.bankedCoins - cost,
          carUpgrades: {
            ...prev.carUpgrades,
            [carId]: nextUpgrades,
          },
        };
        saveProgress(upd);
        return upd;
      });

      if (engineRef.current && selectedSkin.id === carId) {
        engineRef.current.setUpgrades(nextUpgrades);
      }
      sound.playChallengeComplete();
    },
    [progress, selectedSkin.id]
  );

  // Update vehicle styling (paint, finish, neon underglow, aero)
  const handleUpdateStyle = useCallback(
    (carId: string, style: CustomCarStyle) => {
      setProgress((prev) => {
        const nextStyles = {
          ...(prev.customCarStyles || {}),
          [carId]: style,
        };
        const upd: PlayerProgress = {
          ...prev,
          customCarStyles: nextStyles,
        };
        saveProgress(upd);
        return upd;
      });

      if (selectedSkin.id === carId && engineRef.current) {
        const customSkin: CarSkin = {
          ...selectedSkin,
          primary: style.primaryColor || selectedSkin.primary,
          secondary: style.secondaryColor || selectedSkin.secondary,
        };
        engineRef.current.setSkin(customSkin, style);
      }
    },
    [selectedSkin]
  );

  // Marketplace: List car
  const handleListCarOnMarket = useCallback(
    async (carId: string, price: number): Promise<boolean> => {
      try {
        const car = CAR_SKINS.find((c) => c.id === carId);
        const upgrades = progress.carUpgrades[carId] || DEFAULT_CAR_UPGRADES;
        const res = await fetch('/api/market/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: progress.driverTag,
            sellerName: progress.driverName,
            carId,
            carName: car?.name || 'Tuned Car',
            price,
            upgrades,
            primaryColor: car?.primary || '#38bdf8',
          }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [progress]
  );

  // Marketplace: Buy car
  const handleBuyListing = useCallback(
    async (listing: MarketListing): Promise<boolean> => {
      if (progress.bankedCoins < listing.price) return false;

      try {
        const res = await fetch('/api/market/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: listing.id,
            buyerId: progress.driverTag,
          }),
        });

        if (res.ok) {
          setProgress((prev) => {
            const nextUnlocked = Array.from(new Set([...prev.unlockedSkins, listing.carId]));
            const upd: PlayerProgress = {
              ...prev,
              bankedCoins: prev.bankedCoins - listing.price,
              unlockedSkins: nextUnlocked,
              carUpgrades: {
                ...prev.carUpgrades,
                [listing.carId]: listing.upgrades || DEFAULT_CAR_UPGRADES,
              },
            };
            saveProgress(upd);
            return upd;
          });
          confetti({ particleCount: 50, spread: 60 });
          sound.playChallengeComplete();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [progress.bankedCoins, progress.driverTag]
  );

  // Hunt bounty racer
  const handleHuntRacer = useCallback(
    (target: BountyRacer) => {
      setShowBounties(false);
      setShowFriends(true);
    },
    []
  );

  // Send Radio Chat
  const handleSendMessage = useCallback(
    (text: string) => {
      if (engineRef.current) {
        engineRef.current.sendChat(text, 'global', progress.driverName, currentRankInfo.rank);
      }
      setChatMessages((prev) => [
        ...prev.slice(-40),
        {
          id: `msg-${Date.now()}`,
          senderId: progress.driverTag,
          senderName: progress.driverName,
          senderRank: currentRankInfo.rank,
          text,
          timestamp: Date.now(),
        },
      ]);
    },
    [progress.driverName, progress.driverTag, currentRankInfo.rank]
  );

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleReturnToTitle = useCallback(() => {
    engineRef.current?.disconnectMultiplayer();
    engineRef.current?.returnToTitle();
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(sound.toggleMute());
  }, []);

  const handleSettingsChange = useCallback((nextSettings: GameSettings) => {
    setSettings(nextSettings);
    sound.setVolume(nextSettings.masterVolume);
  }, []);

  const handleSelectSkin = useCallback(
    (skin: CarSkin) => {
      const style = progress.customCarStyles?.[skin.id];
      setSelectedSkin(skin);
      engineRef.current?.setSkin(skin, style);
      engineRef.current?.setUpgrades(progress.carUpgrades[skin.id] || DEFAULT_CAR_UPGRADES);
      if (progress.unlockedSkins.includes(skin.id)) {
        setProgress((prev) => {
          const upd = { ...prev, selectedSkinId: skin.id };
          saveProgress(upd);
          return upd;
        });
        setGarageNotice(null);
      } else {
        const cost = SKIN_UNLOCK_COSTS[skin.id] ?? 0;
        setGarageNotice(`${skin.name} is locked. Unlock for ${cost} gold coins.`);
      }
    },
    [progress.unlockedSkins, progress.carUpgrades, progress.customCarStyles]
  );

  const handleUnlockSkin = useCallback(
    (skin: CarSkin) => {
      const unlockCost = SKIN_UNLOCK_COSTS[skin.id] ?? 0;
      if (progress.bankedCoins < unlockCost) {
        setGarageNotice(`Need ${unlockCost - progress.bankedCoins} more coins to unlock ${skin.name}.`);
        return;
      }

      sound.playChallengeComplete();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      const updatedSkins = [...progress.unlockedSkins, skin.id];
      const updated = {
        ...progress,
        bankedCoins: progress.bankedCoins - unlockCost,
        unlockedSkins: updatedSkins,
        selectedSkinId: skin.id,
      };
      setProgress(updated);
      saveProgress(updated);
      setSelectedSkin(skin);
      engineRef.current?.setSkin(skin);
      setGarageNotice(`🎉 ${skin.name} unlocked and ready for the highway!`);
    },
    [progress]
  );

  const handleTouchInput = useCallback((control: keyof InputState, active: boolean | number) => {
    engineRef.current?.setVirtualInput(control, active);
  }, []);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!settings.touchSteering || event.pointerType !== 'touch' || gameState !== 'PLAYING') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchSteeringPointer.current = event.pointerId;
    updateTouchSteering(event.clientX, event.currentTarget);
  };

  const updateTouchSteering = (clientX: number, canvas: HTMLCanvasElement) => {
    const midpoint = canvas.getBoundingClientRect().left + canvas.clientWidth / 2;
    engineRef.current?.setVirtualInput('left', clientX < midpoint - 24);
    engineRef.current?.setVirtualInput('right', clientX > midpoint + 24);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchSteeringPointer.current !== event.pointerId || !settings.touchSteering) return;
    updateTouchSteering(event.clientX, event.currentTarget);
  };

  const handleCanvasPointerEnd = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchSteeringPointer.current !== event.pointerId) return;
    touchSteeringPointer.current = null;
    engineRef.current?.setVirtualInput('left', false);
    engineRef.current?.setVirtualInput('right', false);
  };

  const closeTutorial = (remember: boolean) => {
    setShowTutorial(false);
    if (remember) {
      setProgress((current) => ({ ...current, tutorialSeen: true }));
      setSettings((current) => ({ ...current, showTutorial: false }));
    }
  };

  const startPractice = () => {
    closeTutorial(true);
    handleStartGame();
  };

  const handleShare = async () => {
    const text = [
      `Turbo Horizon: Drift Evolution — ${selectedMode.replace('_', ' ').toUpperCase()}`,
      `Score: ${stats.score.toLocaleString()} pts`,
      `Distance: ${(stats.distance / 1000).toFixed(2)} km`,
      `Top Speed: ${stats.topSpeedMph} MPH`,
      `Drift Score: ${stats.driftScore.toLocaleString()} pts`,
      `Best Drift: ${stats.bestDriftChain.toFixed(1)}s`,
      `Near Misses: ${stats.closeCalls}`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Turbo Horizon Race Telemetry', text });
        setShareStatus('Scorecard shared.');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareStatus('Scorecard copied to clipboard.');
      } else {
        setShareStatus('Sharing is not available in this browser.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus(
        error instanceof Error ? `Could not share scorecard: ${error.message}` : 'Could not share scorecard.'
      );
    }
  };

  const currentTrackConfig = TRACKS.find((t) => t.id === selectedTrack) || TRACKS[0];

  const modeLabel =
    selectedMode === 'time_trial'
      ? 'TIME TRIAL'
      : selectedMode === 'drift_king'
        ? 'DRIFT KING'
        : selectedMode === 'daily_challenge'
          ? 'DAILY CHALLENGE'
          : selectedMode === 'multiplayer'
            ? 'MULTIPLAYER'
            : selectedMode === 'cup_race'
              ? 'CHAMPIONSHIP CUP'
              : selectedMode === 'duel'
                ? '1V1 WAGER DUEL'
                : 'ENDLESS';

  const dailyChallengeCompleted =
    progress.dailyChallengeDate === getDailyChallengeDate() && progress.dailyChallengeCompleted;

  return (
    <main
      className="relative flex h-screen w-screen select-none items-center justify-center overflow-hidden bg-slate-950 font-sans"
      data-game-ui
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="block h-full w-full object-cover"
          style={{ touchAction: settings.touchSteering ? 'none' : 'auto' }}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerEnd}
          onPointerCancel={handleCanvasPointerEnd}
        />
      </div>

      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStartGame}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          selectedTrack={selectedTrack}
          onSelectTrack={handleSelectTrack}
          highScore={stats.highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          mode={selectedMode}
          onSelectMode={setSelectedMode}
          bestScores={progress.bestScores}
          bankedCoins={progress.bankedCoins}
          unlockedSkins={progress.unlockedSkins}
          dailyChallengeCompleted={dailyChallengeCompleted}
          garageNotice={garageNotice}
          onOpenSettings={() => setShowSettings(true)}
          onOpenTutorial={() => setShowTutorial(true)}
          onOpenChallenges={() => setShowChallenges(true)}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          onOpenFriends={() => setShowFriends(true)}
          onOpenCups={() => setShowCups(true)}
          onOpenTuning={() => setShowTuning(true)}
          onOpenMarketplace={() => setShowMarketplace(true)}
          onOpenBounties={() => setShowBounties(true)}
          onUnlockSkin={handleUnlockSkin}
          driverTag={progress.driverTag}
          driverRank={currentRankInfo.rank}
          driverBounty={progress.bounty}
          progress={progress}
          onUpdateStyle={handleUpdateStyle}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HUD
          stats={stats}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onToggleChat={() => setShowChat((prev) => !prev)}
          largeHud={settings.largeHud}
          modeLabel={modeLabel}
          trackName={currentTrackConfig.name}
        />
      )}

      {/* Floating In-Game & Menu Radio Chat */}
      <InGameChat
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isOpen={showChat}
        onToggleOpen={() => setShowChat((prev) => !prev)}
        inGame={gameState === 'PLAYING'}
      />

      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={handleRestartGame}
          onHome={handleReturnToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestartGame}
          onHome={handleReturnToTitle}
          onOpenGmailShare={() => setShowGmailModal(true)}
          mode={selectedMode}
          dailyChallengeCompleted={dailyChallengeCompleted}
          onShare={handleShare}
          shareStatus={shareStatus}
        />
      )}

      {showGmailModal && (
        <GmailShareModal
          stats={stats}
          currentUser={currentUser}
          onUserChange={setCurrentUser}
          onClose={() => setShowGmailModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTutorial && gameState === 'TITLE' && (
        <TutorialModal onClose={closeTutorial} onPractice={startPractice} />
      )}

      {showChallenges && (
        <ChallengesModal
          isOpen={showChallenges}
          onClose={() => setShowChallenges(false)}
          progress={progress}
          onProgressUpdate={setProgress}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          progress={progress}
        />
      )}

      {showMultiplayer && (
        <MultiplayerLobbyModal
          isOpen={showMultiplayer}
          onClose={() => setShowMultiplayer(false)}
          selectedSkin={selectedSkin}
          progress={progress}
          onUpdateProgress={setProgress}
          onStartMultiplayer={handleStartMultiplayer}
        />
      )}

      {showFriends && (
        <FriendsAndWagerModal
          isOpen={showFriends}
          onClose={() => setShowFriends(false)}
          progress={progress}
          onSendChallenge={handleSendChallenge}
          incomingChallenges={incomingChallenges}
          onAcceptChallenge={handleAcceptChallenge}
          onDeclineChallenge={handleDeclineChallenge}
        />
      )}

      {showCups && (
        <OnlineCupsModal
          isOpen={showCups}
          onClose={() => setShowCups(false)}
          progress={progress}
          onEnterCup={handleEnterCup}
        />
      )}

      {showTuning && (
        <CarCustomizationLobbyModal
          isOpen={showTuning}
          onClose={() => setShowTuning(false)}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          progress={progress}
          onUpdateStyle={handleUpdateStyle}
          onUpgradePart={handleUpgradePart}
          onUnlockSkin={handleUnlockSkin}
        />
      )}

      {showMarketplace && (
        <MarketplaceModal
          isOpen={showMarketplace}
          onClose={() => setShowMarketplace(false)}
          progress={progress}
          onBuyListing={handleBuyListing}
        />
      )}

      {showBounties && (
        <BountyBoardModal
          isOpen={showBounties}
          onClose={() => setShowBounties(false)}
          progress={progress}
          onHuntRacer={handleHuntRacer}
        />
      )}

      {gameState === 'PLAYING' && (
        <TouchControls
          onInput={handleTouchInput}
          touchSteering={settings.touchSteering}
          controlScale={settings.touchControlScale}
        />
      )}
    </main>
  );
}
