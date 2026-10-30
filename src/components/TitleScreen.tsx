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
  Shield,
  Zap,
  LogOut,
  Check,
  Settings,
  BookOpen,
  Lock,
  Trophy,
  Users,
  Flame,
  Award,
  Coins,
  Gauge,
  Sparkles,
  Wrench,
  ShoppingBag,
  Skull,
  MapPin,
  Wifi,
  Swords,
} from 'lucide-react';
import { googleSignIn, logout } from '../services/gmail';
import { DAILY_CHALLENGE_TARGET, SKIN_UNLOCK_COSTS } from '../services/progress';

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
}

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
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const isCurrentUnlocked = unlockedSkins.includes(selectedSkin.id);
  const unlockCost = SKIN_UNLOCK_COSTS[selectedSkin.id] ?? 0;
  const canAfford = bankedCoins >= unlockCost;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between gap-4 overflow-y-auto p-3 sm:p-5 md:p-6 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/95 pointer-events-auto select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left Utilities */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold backdrop-blur-md cursor-pointer active:scale-95"
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
          {/* Car Lobby & Customizer */}
          <button
            type="button"
            onClick={onOpenTuning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/30 via-orange-500/30 to-rose-500/30 border border-amber-400/60 text-amber-300 hover:text-white hover:bg-amber-500/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-pulse"
          >
            <Car className="w-4 h-4 text-amber-400" />
            <span>Car Lobby & Customizer</span>
          </button>

          {/* School Wi-Fi & Friends Challenge */}
          <button
            type="button"
            onClick={onOpenFriends}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-500/30 border border-emerald-400/50 text-emerald-300 hover:text-white hover:bg-emerald-600/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>School Wi-Fi & Wagers</span>
          </button>

          {/* Championship Cups */}
          <button
            type="button"
            onClick={onOpenCups}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-400/50 text-amber-300 hover:text-white hover:bg-amber-500/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Online Cups</span>
          </button>

          {/* Bounty Board */}
          <button
            type="button"
            onClick={onOpenBounties}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500/25 to-red-500/25 border border-rose-400/50 text-rose-300 hover:text-white hover:bg-rose-500/40 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Skull className="w-4 h-4 text-rose-400" />
            <span>Bounties</span>
          </button>

          {/* Used Marketplace */}
          <button
            type="button"
            onClick={onOpenMarketplace}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 hover:text-white hover:bg-cyan-500/30 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Marketplace</span>
          </button>

          {/* Leaderboard */}
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-500/30 font-black text-xs uppercase tracking-wider backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Rankings</span>
          </button>
        </div>

        {/* Right: Banked Coins & Profile */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shadow-md">
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

      {/* Hero Title & Main Actions */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-2">
          <svg className="w-72 sm:w-96 md:w-[480px] h-20 md:h-28" viewBox="0 0 500 110" fill="none">
            <defs>
              <linearGradient id="turboGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="horizonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <text
              x="250"
              y="54"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-5xl md:text-6xl"
              fill="url(#turboGrad)"
              style={{ fontStyle: 'italic', filter: 'drop-shadow(0 4px 14px rgba(239, 68, 68, 0.45))' }}
            >
              TURBO
            </text>
            <text
              x="250"
              y="98"
              textAnchor="middle"
              className="font-display font-black tracking-widest text-3xl md:text-4xl"
              fill="url(#horizonGrad)"
              style={{ letterSpacing: '0.25em', filter: 'drop-shadow(0 4px 14px rgba(56, 189, 248, 0.45))' }}
            >
              HORIZON
            </text>
          </svg>
          <div className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold mt-1">
            Same Wi-Fi Duels · Pink Slips · 4 Tracks · Online Cups
          </div>
        </div>

        {/* Track Selection Carousel */}
        <div className="mb-3 w-full max-w-2xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
            <span className="flex items-center gap-1 text-cyan-400">
              <MapPin className="w-3.5 h-3.5" /> SELECT RACE TRACK
            </span>
            <span className="text-[11px] text-slate-400">
              {TRACKS.find((t) => t.id === selectedTrack)?.subtitle || 'High-Speed Highway'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRACKS.map((track) => {
              const isSelected = selectedTrack === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => onSelectTrack(track.id)}
                  className={`p-2 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_15px_rgba(34,211,238,0.3)] text-white'
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black truncate">{track.name}</div>
                  <div className="text-[10px] text-slate-400">{track.previewBadge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Selector Carousel */}
        <section className="mb-4 w-full max-w-2xl" aria-label="Race modes">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'endless', label: 'ENDLESS', detail: 'Survive & Branch' },
              { id: 'drift_king', label: 'DRIFT KING', detail: 'Max Slip Angle' },
              { id: 'time_trial', label: 'TIME TRIAL', detail: '90s Speed Sprint' },
              { id: 'daily_challenge', label: 'DAILY OBJ', detail: `${DAILY_CHALLENGE_TARGET} Coins` },
              { id: 'multiplayer', label: 'MULTIPLAYER', detail: 'Live Rivals' },
            ].map((event) => (
              <button
                type="button"
                key={event.id}
                onClick={() => {
                  if (event.id === 'multiplayer') {
                    onOpenMultiplayer();
                  } else {
                    onSelectMode(event.id as GameMode);
                  }
                }}
                className={`rounded-2xl border p-2.5 text-left transition-all cursor-pointer ${
                  mode === event.id
                    ? 'border-amber-400 bg-amber-950/80 text-white shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                    : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-black tracking-wide">{event.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{event.detail}</div>
                <div className="text-[10px] font-mono text-amber-300 font-bold mt-1">
                  BEST {bestScores[event.id as GameMode]?.toLocaleString() || 0}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Primary Launch Button */}
        <button
          type="button"
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 px-10 md:px-14 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-slate-950 font-display font-black text-xl tracking-wider uppercase shadow-[0_0_35px_rgba(244,63,94,0.55)] hover:shadow-[0_0_50px_rgba(244,63,94,0.85)] active:scale-95 transition-all cursor-pointer mb-4"
        >
          <Play className="w-6 h-6 fill-slate-950 transition-transform group-hover:scale-110" />
          <span>
            {mode === 'time_trial'
              ? 'START TIME TRIAL'
              : mode === 'drift_king'
                ? 'ENTER DRIFT ARENA'
                : mode === 'daily_challenge'
                  ? 'START DAILY RUN'
                  : mode === 'multiplayer'
                    ? 'ENTER MULTIPLAYER'
                    : 'START RACE'}
          </span>
          <span className="hidden sm:inline text-xs font-sans font-bold bg-slate-950/20 px-2 py-0.5 rounded text-slate-950 ml-1">
            SPACE
          </span>
        </button>

        {/* 10 CAR GARAGE HUB */}
        <div className="flex flex-col items-center bg-slate-950/85 backdrop-blur-md p-4 rounded-3xl border border-slate-800/80 max-w-3xl w-full shadow-2xl">
          <div className="flex items-center justify-between w-full mb-3 px-2">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <span>GARAGE ·</span>
              <span className="text-white font-black">{selectedSkin.name}</span>
              <span className="text-cyan-400 font-mono font-bold">[{selectedSkin.badge}]</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tune car shortcut */}
              <button
                type="button"
                onClick={onOpenTuning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider hover:bg-amber-500/30 transition-all cursor-pointer active:scale-95 shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CUSTOMIZE & TUNE IN LOBBY</span>
              </button>

              {/* Unlock Action if locked */}
              {!isCurrentUnlocked && (
                <button
                  type="button"
                  onClick={() => onUnlockSkin(selectedSkin)}
                  disabled={!canAfford}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 ${
                    canAfford
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer animate-pulse'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>UNLOCK FOR {unlockCost} COINS</span>
                </button>
              )}
            </div>
          </div>

          {/* Car Grid Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full mb-3">
            {CAR_SKINS.map((skin) => {
              const isSelected = selectedSkin.id === skin.id;
              const isUnlocked = unlockedSkins.includes(skin.id);
              const cost = SKIN_UNLOCK_COSTS[skin.id] ?? 0;

              return (
                <button
                  key={skin.id}
                  onClick={() => onSelectSkin(skin)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10 shadow-lg'
                      : isUnlocked
                        ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-950/80 opacity-60 hover:opacity-100 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shadow"
                      style={{ backgroundColor: skin.primary }}
                    />
                    {isUnlocked ? (
                      isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] font-mono text-amber-400 font-bold">
                        <Lock className="w-2.5 h-2.5" /> {cost}★
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-black text-white truncate">{skin.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{skin.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Car Telemetry & Perk Bar */}
          <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Stats bars */}
            <div className="grid grid-cols-4 gap-3 w-full sm:w-auto flex-1 text-left">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Speed</div>
                <div className="text-xs font-black text-cyan-400 font-mono">{selectedSkin.topSpeed}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${selectedSkin.topSpeed}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Accel</div>
                <div className="text-xs font-black text-amber-400 font-mono">{selectedSkin.acceleration}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${selectedSkin.acceleration}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Drift</div>
                <div className="text-xs font-black text-rose-400 font-mono">{selectedSkin.driftMultiplier}x</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: `${(selectedSkin.driftMultiplier / 1.6) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Armor</div>
                <div className="text-xs font-black text-emerald-400 font-mono">{selectedSkin.armor}</div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${selectedSkin.armor}%` }} />
                </div>
              </div>
            </div>

            {/* Perk Description */}
            <div className="text-left bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl max-w-sm">
              <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {selectedSkin.perkTitle}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {selectedSkin.perkDescription}
              </div>
            </div>
          </div>

          {garageNotice && <p role="status" className="mt-2 text-xs font-medium text-amber-300">{garageNotice}</p>}
        </div>
      </div>

      {/* Footer Controls & Handbrake Guide */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>⚡ Nitro / Speed Boost</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Shield className="w-3.5 h-3.5 fill-cyan-400" />
            <span>🛡️ Collision Armor</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-rose-400" />
            <span>Counter-Steer for 5x Drift Multiplier</span>
          </div>
        </div>

        <div className="text-slate-300 font-mono text-[11px]">
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">A / D</kbd> Steer ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">SPACE</kbd> Drift Handbrake ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">SHIFT / N</kbd> Nitro ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded mr-1">T</kbd> Radio Chat
        </div>
      </div>
    </div>
  );
};
