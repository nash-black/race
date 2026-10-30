/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameStats } from '../game/types';
import {
  Volume2,
  VolumeX,
  Pause,
  Shield,
  Zap,
  Flame,
  Compass,
  Users,
  Coins,
  Navigation,
  MessageSquare,
} from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onToggleChat?: () => void;
  largeHud?: boolean;
  modeLabel?: string;
  trackName?: string;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onPause,
  onToggleChat,
  largeHud = false,
  modeLabel = 'ENDLESS',
  trackName = 'Tokyo Midnight',
}) => {
  // Health color
  const healthColor =
    stats.health > 60 ? 'bg-emerald-500' : stats.health > 25 ? 'bg-amber-500' : 'bg-rose-500';

  const trackCurve = stats.trackMapCurve || 0;

  return (
    <div
      className={`absolute inset-0 pointer-events-none p-3 md:p-6 flex flex-col justify-between select-none ${
        largeHud ? 'text-base' : ''
      }`}
    >
      {/* TOP BAR CLUSTER */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Speedometer & Telemetry */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 shadow-2xl min-w-[170px] md:min-w-[210px]">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span
                className={`font-display font-black tracking-tighter text-white font-mono-numbers ${
                  largeHud ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'
                }`}
              >
                {stats.speedMph}
              </span>
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                MPH
              </span>
            </div>

            {/* Gear & RPM */}
            <div className="flex flex-col items-end">
              <span className="text-xs font-black text-amber-400 font-mono tracking-wider">
                GEAR {stats.gear}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-mono-numbers">
                {stats.rpm} RPM
              </span>
            </div>
          </div>

          {/* RPM Bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                stats.rpm > 7000 ? 'bg-rose-500' : stats.rpm > 5000 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (stats.rpm / 8500) * 100)}%` }}
            />
          </div>

          {/* Nitro gauge */}
          <div className="w-full">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-0.5">
              <span className="flex items-center gap-1 text-cyan-400">
                <Zap className="w-2.5 h-2.5 fill-cyan-400" /> NITRO
              </span>
              <span className="font-mono-numbers">{Math.round(stats.nitro)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${stats.nitro}%` }}
              />
            </div>
          </div>

          {/* Health bar */}
          <div className="w-full">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-2.5 h-2.5 fill-emerald-400" /> ARMOR
              </span>
              <span className="font-mono-numbers">{Math.round(stats.health)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${healthColor} transition-all duration-150`}
                style={{ width: `${stats.health}%` }}
              />
            </div>
          </div>

          {/* Handbrake badge */}
          {stats.isHandbraking && (
            <div className="py-0.5 px-2 bg-rose-600/90 text-white rounded text-[10px] font-black text-center tracking-widest animate-pulse">
              HANDBRAKE ENGAGED
            </div>
          )}
        </div>

        {/* Center: Score, Distance & Mode Banner */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl px-5 py-2.5 shadow-2xl flex flex-col items-center min-w-[190px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              SCORE
            </span>
            <span
              className={`font-display font-black text-amber-400 tracking-tight font-mono-numbers ${
                largeHud ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
              }`}
            >
              {stats.score.toLocaleString()}
            </span>

            <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 font-mono-numbers">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                {(stats.distance / 1000).toFixed(2)} km
              </span>
              <span>·</span>
              <span className="text-amber-300 font-semibold">★ {stats.coins}</span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-cyan-300">
              <span className="px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800/60 rounded">
                {modeLabel}
              </span>
              {modeLabel === 'TIME TRIAL' && (
                <span className="font-mono-numbers text-amber-300">
                  {Math.ceil(stats.timeRemaining)}s
                </span>
              )}
              {modeLabel === 'DAILY CHALLENGE' && (
                <span className="font-mono-numbers text-amber-300">
                  {stats.challengeProgress}/8 coins
                </span>
              )}
            </div>
          </div>

          {/* WAGER & PINK SLIP STAKES BANNER */}
          {(stats.wagerCoins > 0 || stats.wagerPinkSlip) && (
            <div
              className={`mt-2 flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-xl border animate-pulse ${
                stats.wagerPinkSlip
                  ? 'bg-rose-950/90 border-rose-500 text-rose-300'
                  : 'bg-amber-950/90 border-amber-500 text-amber-300'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>
                STAKES: {stats.wagerCoins} COINS
                {stats.wagerPinkSlip && ' + 🔥 PINK SLIP (CAR ON THE LINE)'}
              </span>
            </div>
          )}

          {/* Multiplayer Rank Banner */}
          {modeLabel === 'MULTIPLAYER' && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-3.5 py-1 text-white font-black text-xs uppercase tracking-wider shadow-lg border border-blue-400/40">
              <Users className="w-3.5 h-3.5" />
              <span>
                RANK {stats.multiplayerRank} / {stats.multiplayerTotal}
              </span>
            </div>
          )}

          {/* Junction Guide Banner */}
          {stats.junctionDistance > 0 && stats.junctionDistance < 220 && (
            <div className="mt-2 rounded-xl border border-amber-400/60 bg-slate-950/95 px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-amber-300 shadow-xl animate-bounce">
              <div>FORK JUNCTION · {Math.ceil(stats.junctionDistance)} M</div>
              <div className="text-[10px] text-white/90 font-medium">
                {stats.routeChoice
                  ? `[${stats.routeChoice.toUpperCase()} LANE SELECTED]`
                  : 'STEER LEFT OR RIGHT TO CHOOSE BRANCH'}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Drift Telemetry */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Pause, Mute & Chat buttons */}
          <div className="flex items-center gap-2">
            {onToggleChat && (
              <button
                onClick={onToggleChat}
                className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-cyan-400 hover:text-white hover:bg-slate-800/80 transition-all shadow-lg active:scale-95 cursor-pointer"
                title="Toggle Radio Chat"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all shadow-lg active:scale-95 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onPause}
              className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all shadow-lg active:scale-95 cursor-pointer"
              title="Pause Game (Esc)"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>

          {/* DRIFT TELEMETRY CLUSTER */}
          {(stats.isDrifting || stats.driftChain > 0) && (
            <div className="bg-slate-950/90 backdrop-blur-md border border-rose-500/60 rounded-2xl p-3 shadow-2xl flex flex-col items-end min-w-[140px] animate-pulse">
              <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs uppercase tracking-wider">
                <Flame className="w-4 h-4 fill-rose-500 text-rose-500 animate-spin" />
                DRIFT CHAIN
              </div>
              <div className="font-display font-black text-2xl text-rose-300 font-mono-numbers">
                {stats.driftChain.toFixed(1)}s
              </div>
              <div className="text-[11px] font-bold text-amber-400 font-mono tracking-wider">
                {stats.driftMultiplier}x MULTIPLIER
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                ANGLE: {stats.driftAngleDegrees}° · {stats.gForce}G
              </div>

              {/* Counter Steer Pill */}
              {stats.counterSteerQuality && (
                <div
                  className={`mt-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    stats.counterSteerQuality === 'PERFECT'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {stats.counterSteerQuality} COUNTER-STEER!
                </div>
              )}
            </div>
          )}

          {/* Active Power-up indicators */}
          {stats.speedBoostActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-amber-300">
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              BOOST {stats.speedBoostTimer.toFixed(1)}s
            </div>
          )}
          {stats.shieldActive && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/90 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg border border-cyan-300">
              <Shield className="w-3.5 h-3.5 fill-slate-950" />
              SHIELD {stats.shieldTimer.toFixed(1)}s
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CLUSTER: MINIMAP RADAR & RIVALS */}
      <div className="flex items-end justify-between gap-4">
        {/* Left: Multiplayer Rivals Ticker */}
        {modeLabel === 'MULTIPLAYER' && stats.rivals.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-full px-4 py-1.5 text-xs text-slate-300 font-mono shadow-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Racers:</span>
              {stats.rivals.slice(0, 3).map((r) => {
                const diff = Math.round(r.distance - stats.distance);
                return (
                  <div key={r.id} className="flex items-center gap-1">
                    <span className="font-bold text-white">{r.name.slice(0, 8)}</span>
                    <span className={`text-[10px] ${diff > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {diff > 0 ? `+${diff}m` : `${diff}m`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Right: Real-time Track Road Minimap */}
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-3xl p-3 shadow-2xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
            <span className="flex items-center gap-1 text-cyan-400">
              <Navigation className="w-3 h-3 text-cyan-400" />
              {trackName}
            </span>
            <span className="font-mono text-amber-300">
              {stats.trackProgressPct !== undefined ? `${Math.round(stats.trackProgressPct)}%` : ''}
            </span>
          </div>

          {/* Radar Screen Canvas / SVG */}
          <div className="relative w-32 h-28 bg-slate-900/90 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
            {/* Range rings */}
            <div className="absolute inset-2 border border-slate-800/60 rounded-full pointer-events-none" />
            <div className="absolute inset-7 border border-slate-800/40 rounded-full pointer-events-none" />

            {/* Road trajectory ahead */}
            <svg className="w-full h-full" viewBox="-50 -90 100 110">
              {/* Road lane curvature */}
              <path
                d={`M 0,10 Q ${(trackCurve * 25).toFixed(1)},-40 ${(trackCurve * 50).toFixed(1)},-85`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="8"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
              <path
                d={`M 0,10 Q ${(trackCurve * 25).toFixed(1)},-40 ${(trackCurve * 50).toFixed(1)},-85`}
                fill="none"
                stroke="#f8fafc"
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {/* Player Car icon (pointing up) */}
              <polygon points="0,5 -4,14 4,14" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />

              {/* Rival dots on minimap */}
              {stats.rivals.map((rival) => {
                const deltaDist = rival.distance - stats.distance;
                if (deltaDist > -60 && deltaDist < 120) {
                  const y = 10 - deltaDist * 0.7;
                  const x = (rival.x / 400) * 30;
                  return (
                    <circle
                      key={rival.id}
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  );
                }
                return null;
              })}
            </svg>

            {/* Speed radar scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none animate-pulse" />
          </div>

          {/* Track Progress Bar */}
          <div className="w-full mt-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, stats.trackProgressPct || 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
