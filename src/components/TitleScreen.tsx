/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { CAR_SKINS } from '../game/renderer';
import { CarSkin, GameMode, TrackId, TRACKS } from '../game/types';
import {
  Car,
  Volume2,
  VolumeX,
  Play,
  LogOut,
  Check,
  Settings,
  BookOpen,
  Lock,
  Trophy,
  Coins,
  Gauge,
  Sparkles,
  ShoppingBag,
  Skull,
  MapPin,
  Wifi,
  Award,
  ChevronLeft,
  ChevronRight,
  Palette,
  Layers,
  Camera,
  RotateCw,
} from 'lucide-react';
import { googleSignIn, logout } from '../services/gmail';
import {
  DAILY_CHALLENGE_TARGET,
  SKIN_UNLOCK_COSTS,
  PlayerProgress,
  CustomCarStyle,
} from '../services/progress';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStart: () => void;
  selectedSkin: CarSkin;
  onSelectSkin: (skin: CarSkin) => void;
  selectedTrack: TrackId;
  onSelectTrack: (trackId: TrackId) => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  bestScores: Record<GameMode, number>;
  bankedCoins: number;
  unlockedSkins: string[];
  dailyChallengeCompleted: boolean;
  garageNotice: string | null;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  onOpenChallenges: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
  onOpenFriends: () => void;
  onOpenCups: () => void;
  onOpenTuning: () => void;
  onOpenMarketplace: () => void;
  onOpenBounties: () => void;
  onUnlockSkin: (skin: CarSkin) => void;
  driverTag?: string;
  driverRank?: string;
  driverBounty?: number;
  progress?: PlayerProgress;
  onUpdateStyle?: (carId: string, style: CustomCarStyle) => void;
}

const COLOR_PRESETS = [
  { name: 'Midnight Violet', hex: '#3b0764' },
  { name: 'Stealth Onyx', hex: '#09090b' },
  { name: 'Rosso Corsa', hex: '#dc2626' },
  { name: 'Bianco Fuji', hex: '#f8fafc' },
  { name: 'Tokyo Cyan', hex: '#06b6d4' },
  { name: 'Solar Gold', hex: '#f59e0b' },
  { name: 'Toxic Lime', hex: '#84cc16' },
  { name: 'Sunset Orange', hex: '#f97316' },
];

const UNDERGLOW_PRESETS = [
  { name: 'Cyan Neon', hex: '#06b6d4' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Toxic Lime', hex: '#84cc16' },
  { name: 'Electric Gold', hex: '#fbbf24' },
  { name: 'Deep Violet', hex: '#8b5cf6' },
  { name: 'Ice White', hex: '#f8fafc' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  selectedSkin,
  onSelectSkin,
  selectedTrack,
  onSelectTrack,
  highScore,
  isMuted,
  onToggleMute,
  currentUser,
  onUserChange,
  mode,
  onSelectMode,
  bestScores,
  bankedCoins,
  unlockedSkins,
  dailyChallengeCompleted,
  garageNotice,
  onOpenSettings,
  onOpenTutorial,
  onOpenChallenges,
  onOpenLeaderboard,
  onOpenMultiplayer,
  onOpenFriends,
  onOpenCups,
  onOpenTuning,
  onOpenMarketplace,
  onOpenBounties,
  onUnlockSkin,
  driverTag = '#4921',
  driverRank = 'E',
  driverBounty = 500,
  progress,
  onUpdateStyle,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(25);
  const [isRevving, setIsRevving] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | 'turntable'>('photo');

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      setAuthError(errorMsg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChange(null);
  };

  const handleRevEngine = () => {
    setIsRevving(true);
    sound.playSpeedBoost();
    setTimeout(() => {
      sound.playWhoosh();
      setIsRevving(false);
    }, 600);
  };

  const isCurrentUnlocked = unlockedSkins.includes(selectedSkin.id);
  const unlockCost = SKIN_UNLOCK_COSTS[selectedSkin.id] ?? 0;
  const canAfford = bankedCoins >= unlockCost;

  // Custom styles for active car
  const savedStyles: CustomCarStyle = progress?.customCarStyles?.[selectedSkin.id] || {};
  const currentPrimaryColor = savedStyles.primaryColor || selectedSkin.primary;
  const currentSecondaryColor = savedStyles.secondaryColor || selectedSkin.secondary;
  const currentUnderglowColor = savedStyles.underglowColor || '#06b6d4';
  const isUnderglowActive = savedStyles.underglowEnabled !== false;
  const currentFinish = savedStyles.finish || 'gloss';
  const currentSpoiler = savedStyles.spoilerStyle || 'gt_wing';
  const currentWheel = savedStyles.wheelStyle || 'tuner5';

  const updateCarStyle = (updates: Partial<CustomCarStyle>) => {
    if (onUpdateStyle) {
      onUpdateStyle(selectedSkin.id, {
        ...savedStyles,
        ...updates,
      });
    }
  };

  const currentIndex = CAR_SKINS.findIndex((s) => s.id === selectedSkin.id);
  const handlePrevCar = () => {
    const prevIdx = (currentIndex - 1 + CAR_SKINS.length) % CAR_SKINS.length;
    onSelectSkin(CAR_SKINS[prevIdx]);
  };
  const handleNextCar = () => {
    const nextIdx = (currentIndex + 1) % CAR_SKINS.length;
    onSelectSkin(CAR_SKINS[nextIdx]);
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between overflow-y-auto p-2 sm:p-4 md:p-6 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950/98 pointer-events-auto select-none">
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left Utilities */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold backdrop-blur-md cursor-pointer active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenTutorial}
            aria-label="How to play"
            className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Online Hub Navigation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenFriends}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-500/30 border border-emerald-400/50 text-emerald-300 hover:text-white hover:bg-emerald-600/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>School Wi-Fi & Duels</span>
          </button>

          <button
            type="button"
            onClick={onOpenCups}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/50 text-amber-300 hover:text-white hover:bg-amber-500/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Online Cups</span>
          </button>

          <button
            type="button"
            onClick={onOpenBounties}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/25 to-red-500/25 border border-rose-400/50 text-rose-300 hover:text-white hover:bg-rose-500/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Skull className="w-4 h-4 text-rose-400" />
            <span>Bounties</span>
          </button>

          <button
            type="button"
            onClick={onOpenMarketplace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 hover:text-white hover:bg-cyan-500/30 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Market</span>
          </button>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-500/30 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Rankings</span>
          </button>
        </div>

        {/* Right: Banked Coins & Profile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shadow-md">
            <Coins className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{bankedCoins.toLocaleString()}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono font-bold text-cyan-400">
            <span>RANK {driverRank}</span>
            <span className="text-slate-500">·</span>
            <span>${driverBounty}</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Pilot'}
                  className="w-6 h-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.displayName?.[0] || 'G'}
                </div>
              )}
              <span className="text-xs text-slate-200 font-medium max-w-[90px] truncate">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out of Gmail"
                className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span>{isSigningIn ? 'Connecting...' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="mx-auto max-w-md text-xs text-rose-300 bg-rose-950/80 border border-rose-800 px-3 py-1.5 rounded-lg text-center">
          {authError}
        </div>
      )}

      {/* Main Logo & Showroom Title */}
      <div className="flex flex-col items-center text-center my-1">
        <div className="relative">
          <svg className="w-64 sm:w-80 md:w-[420px] h-16 md:h-20" viewBox="0 0 500 100" fill="none">
            <defs>
              <linearGradient id="turboGradTitle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="horizonGradTitle" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <text
              x="250"
              y="48"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-4xl md:text-5xl"
              fill="url(#turboGradTitle)"
              style={{ fontStyle: 'italic', filter: 'drop-shadow(0 4px 14px rgba(239, 68, 68, 0.45))' }}
            >
              TURBO
            </text>
            <text
              x="250"
              y="88"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-2xl md:text-3xl"
              fill="url(#horizonGradTitle)"
              style={{ letterSpacing: '0.22em', filter: 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.45))' }}
            >
              HORIZON
            </text>
          </svg>
          <div className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-cyan-400 font-bold -mt-1">
            Supercar Showroom & Customizer · Same Wi-Fi Duels · 4 Tracks
          </div>
        </div>
      </div>

      {/* CENTERPIECE: INTERACTIVE SUPERCAR HOME LOBBY & SHOWROOM */}
      <div className="w-full max-w-5xl mx-auto bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-4 sm:p-5 flex flex-col gap-4">
        {/* Car Showcase Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevCar}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 cursor-pointer shadow"
              title="Previous Car"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-display font-black text-white tracking-wide">
                  {selectedSkin.name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold border border-cyan-500/40">
                  {selectedSkin.badge}
                </span>
                {selectedSkin.photoUrl && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                    REAL SUPERCAR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl truncate">
                {selectedSkin.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher (if photo available) */}
            {selectedSkin.photoUrl && (
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setViewMode('photo')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'photo'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>PHOTO</span>
                </button>
                <button
                  onClick={() => setViewMode('turntable')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'turntable'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>3D STAGE</span>
                </button>
              </div>
            )}

            <button
              onClick={handleRevEngine}
              disabled={isRevving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isRevving ? 'animate-bounce text-amber-400' : ''}`} />
              <span>{isRevving ? 'REVVING...' : 'REV ENGINE'}</span>
            </button>

            <button
              onClick={handleNextCar}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 cursor-pointer shadow"
              title="Next Car"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Showcase Pedestal & Quick Customizer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left/Main: Visual Stage (Real Photo or 3D Showroom Turntable) */}
          <div className="lg:col-span-7 relative h-60 sm:h-64 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-3 flex flex-col items-center justify-center overflow-hidden shadow-xl">
            {/* Studio lighting ceiling spots */}
            <div className="absolute top-0 inset-x-0 h-10 flex justify-around opacity-40 pointer-events-none">
              <div className="w-24 h-16 bg-cyan-400/20 rounded-full blur-xl" />
              <div className="w-32 h-16 bg-white/20 rounded-full blur-xl" />
              <div className="w-24 h-16 bg-amber-400/20 rounded-full blur-xl" />
            </div>

            {selectedSkin.photoUrl && viewMode === 'photo' ? (
              /* High-Resolution Real Supercar Photo Card */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl group">
                <img
                  src={selectedSkin.photoUrl}
                  alt={selectedSkin.name}
                  className="w-full h-full object-contain rounded-xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono text-cyan-300 font-bold">
                  {selectedSkin.badge}
                </div>
              </div>
            ) : (
              /* Interactive Showroom Turntable Stage */
              <div className="relative flex flex-col items-center justify-center w-full my-auto">
                <div className="relative w-64 sm:w-80 h-16 flex items-center justify-center">
                  {/* Underglow Neon Reflection */}
                  {isUnderglowActive && (
                    <div
                      className="absolute inset-x-4 bottom-2 h-10 rounded-full blur-xl opacity-90 transition-all duration-300"
                      style={{ backgroundColor: currentUnderglowColor }}
                    />
                  )}

                  {/* Rotating Stage Disc */}
                  <div className="absolute inset-x-0 bottom-0 h-8 rounded-[100%] bg-slate-800/90 border border-slate-700 shadow-2xl flex items-center justify-center">
                    <div className="w-48 h-5 rounded-[100%] border border-slate-600/50" />
                  </div>

                  {/* SVG Vehicle Silhouette with Custom Finishes & Decals */}
                  <div
                    className="relative z-10 transition-transform duration-300 cursor-grab active:cursor-grabbing"
                    style={{
                      transform: `perspective(600px) rotateY(${rotationAngle}deg) scale(1.15)`,
                    }}
                    onMouseDown={() => setRotationAngle((prev) => (prev + 35) % 360)}
                  >
                    <svg className="w-56 sm:w-64 h-28" viewBox="0 0 240 100" fill="none">
                      <defs>
                        <linearGradient id="lobbyCarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={currentPrimaryColor} />
                          <stop
                            offset="100%"
                            stopColor={
                              currentFinish === 'matte'
                                ? '#1e293b'
                                : currentFinish === 'chameleon'
                                  ? '#ec4899'
                                  : currentSecondaryColor
                            }
                          />
                        </linearGradient>
                      </defs>

                      <path
                        d="M 25,65 L 45,62 L 75,38 L 160,36 L 195,50 L 225,62 L 230,75 L 15,75 Z"
                        fill="url(#lobbyCarGrad)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                      />

                      <path
                        d="M 80,40 L 115,22 L 155,22 L 175,40 Z"
                        fill="#0f172a"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                      <polygon points="84,39 116,24 135,24 135,39" fill="#38bdf8" fillOpacity="0.6" />

                      <polygon points="220,63 228,66 222,69" fill="#38bdf8" />
                      <polygon points="16,66 22,64 22,68" fill="#ef4444" />

                      {savedStyles.customDecalUrl && (
                        <image
                          href={savedStyles.customDecalUrl}
                          x="95"
                          y="42"
                          width="65"
                          height="24"
                          preserveAspectRatio="xMidYMid meet"
                          opacity="0.95"
                        />
                      )}

                      {/* Aero Spoiler Wing */}
                      {currentSpoiler === 'gt_wing' && (
                        <g>
                          <rect x="18" y="22" width="22" height="4" fill="#020617" rx="1" />
                          <line x1="24" y1="26" x2="26" y2="42" stroke="#475569" strokeWidth="2" />
                          <line x1="34" y1="26" x2="36" y2="42" stroke="#475569" strokeWidth="2" />
                        </g>
                      )}

                      <circle cx="58" cy="74" r="16" fill="#090d16" stroke="#475569" strokeWidth="3" />
                      <circle cx="58" cy="74" r="9" fill={currentWheel === 'gold_jdm' ? '#f59e0b' : '#94a3b8'} />
                      <circle cx="188" cy="74" r="16" fill="#090d16" stroke="#475569" strokeWidth="3" />
                      <circle cx="188" cy="74" r="9" fill={currentWheel === 'gold_jdm' ? '#f59e0b' : '#94a3b8'} />
                    </svg>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Click car to rotate turntable (Angle: {rotationAngle}°)
                </div>
              </div>
            )}
          </div>

          {/* Right: In-Lobby Quick Customization Dock */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LOBBY PAINT & FINISH</span>
                </span>
                <button
                  onClick={onOpenTuning}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                >
                  Full Garage & Decals →
                </button>
              </div>

              {/* Paint Swatches */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-3">
                {COLOR_PRESETS.map((col) => {
                  const isSel = currentPrimaryColor === col.hex;
                  return (
                    <button
                      key={col.name}
                      onClick={() => updateCarStyle({ primaryColor: col.hex })}
                      className={`h-7 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                        isSel ? 'border-white scale-110 shadow-lg' : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {isSel && <Check className="w-3 h-3 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>

              {/* Surface Finishes */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { id: 'gloss', label: 'Gloss' },
                  { id: 'metallic', label: 'Pearl' },
                  { id: 'matte', label: 'Matte' },
                  { id: 'chameleon', label: 'Color-Shift' },
                ].map((fin) => (
                  <button
                    key={fin.id}
                    onClick={() => updateCarStyle({ finish: fin.id as CustomCarStyle['finish'] })}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      currentFinish === fin.id
                        ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {fin.label}
                  </button>
                ))}
              </div>

              {/* Neon Underglow Bar */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-[11px] font-bold text-white">Neon Underglow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {UNDERGLOW_PRESETS.slice(0, 4).map((glow) => (
                    <button
                      key={glow.name}
                      onClick={() => updateCarStyle({ underglowColor: glow.hex, underglowEnabled: true })}
                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                        currentUnderglowColor === glow.hex && isUnderglowActive ? 'border-white scale-110 shadow' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: glow.hex, boxShadow: `0 0 8px ${glow.hex}` }}
                      title={glow.name}
                    />
                  ))}
                  <button
                    onClick={() => updateCarStyle({ underglowEnabled: !isUnderglowActive })}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                      isUnderglowActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isUnderglowActive ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Telemetry */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-left">
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Speed</div>
                <div className="text-xs font-black text-cyan-400 font-mono">{selectedSkin.topSpeed}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${selectedSkin.topSpeed}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Accel</div>
                <div className="text-xs font-black text-amber-400 font-mono">{selectedSkin.acceleration}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${selectedSkin.acceleration}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Handling</div>
                <div className="text-xs font-black text-emerald-400 font-mono">{selectedSkin.handling}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${selectedSkin.handling}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Drift</div>
                <div className="text-xs font-black text-rose-400 font-mono">{selectedSkin.driftMultiplier}x</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: `${(selectedSkin.driftMultiplier / 2) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 14 CAR SHOWROOM SELECTOR CAROUSEL */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            <span className="flex items-center gap-1.5 text-white">
              <Car className="w-4 h-4 text-cyan-400" />
              <span>SELECT SUPERCAR ({CAR_SKINS.length} AVAILABLE)</span>
            </span>
            <span className="text-[11px] text-cyan-400">
              Active: {selectedSkin.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {CAR_SKINS.map((skin) => {
              const isSelected = selectedSkin.id === skin.id;
              const isUnlocked = unlockedSkins.includes(skin.id);

              return (
                <button
                  key={skin.id}
                  onClick={() => onSelectSkin(skin)}
                  className={`p-2 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-2 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                  }`}
                >
                  {/* Photo thumbnail if available */}
                  {skin.photoUrl ? (
                    <div className="w-full h-12 rounded-lg overflow-hidden mb-1.5 bg-slate-900 border border-slate-800 relative">
                      <img
                        src={skin.photoUrl}
                        alt={skin.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 p-0.5 rounded-full bg-amber-400 text-slate-950">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shadow"
                        style={{ backgroundColor: skin.primary }}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-black text-white truncate leading-tight">
                      {skin.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">
                      {skin.badge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TRACKS & MODES SELECTION DOCK */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-3 my-2">
        {/* Track Selection */}
        <div className="md:col-span-6 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>CHOOSE HIGHWAY TRACK</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {TRACKS.map((track) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/70 text-white shadow'
                      : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black truncate">{track.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{track.previewBadge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="md:col-span-6 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Gauge className="w-3.5 h-3.5" />
              <span>CHOOSE RACE EVENT</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'endless', label: 'ENDLESS', desc: 'Survive highway traffic' },
              { id: 'drift_king', label: 'DRIFT KING', desc: 'Max Touge slip angle' },
              { id: 'time_trial', label: 'TIME TRIAL', desc: '90s Speed sprint' },
            ].map((event) => {
              const isSelected = mode === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => onSelectMode(event.id as GameMode)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/70 text-white shadow'
                      : 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black truncate">{event.label}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{event.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRIMARY LAUNCH / START RACE BUTTON */}
      <div className="flex flex-col items-center justify-center pb-2">
        <button
          type="button"
          onClick={onStart}
          className="group relative inline-flex items-center justify-center gap-3 px-12 md:px-20 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-slate-950 font-display font-black text-xl tracking-wider uppercase shadow-[0_0_40px_rgba(244,63,94,0.6)] hover:shadow-[0_0_60px_rgba(244,63,94,0.9)] active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950 transition-transform group-hover:scale-125" />
          <span>START RACE WITH {selectedSkin.name.toUpperCase()}</span>
          <span className="hidden sm:inline text-xs font-sans font-bold bg-slate-950/20 px-2 py-0.5 rounded text-slate-950 ml-1">
            SPACE
          </span>
        </button>
      </div>
    </div>
  );
};
