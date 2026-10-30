/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Radio, Sparkles, X, Play, Globe, Shield, Zap } from 'lucide-react';
import { CarSkin } from '../game/types';
import { PlayerProgress, saveProgress } from '../services/progress';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkin: CarSkin;
  progress: PlayerProgress;
  onUpdateProgress: (progress: PlayerProgress) => void;
  onStartMultiplayer: (roomCode: string, driverName: string, mode: 'sprint' | 'drift_battle' | 'endless_cruise') => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  selectedSkin,
  progress,
  onUpdateProgress,
  onStartMultiplayer,
}) => {
  const [driverName, setDriverName] = useState(progress.driverName || 'Racer 01');
  const [roomCode, setRoomCode] = useState('TURBO-HIGHWAY');
  const [mpMode, setMpMode] = useState<'sprint' | 'drift_battle' | 'endless_cruise'>('sprint');

  if (!isOpen) return null;

  const handleStart = () => {
    const cleanName = driverName.trim().slice(0, 16) || 'Racer 01';
    const updated = { ...progress, driverName: cleanName };
    saveProgress(updated);
    onUpdateProgress(updated);

    onStartMultiplayer(roomCode.trim().toUpperCase() || 'TURBO-HIGHWAY', cleanName, mpMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
                Real-Time Multiplayer Highway
              </h2>
              <p className="text-xs text-slate-400">
                Tear up the asphalt alongside live rival racers with synchronized traffic and road junctions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 md:p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Driver Name & Car Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Driver Nickname
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                maxLength={16}
                placeholder="Enter racer name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-black text-sm focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Room Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="TURBO-HIGHWAY"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-amber-400 font-black text-sm focus:outline-none focus:border-cyan-400 font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={() => setRoomCode(`ROOM-${Math.floor(100 + Math.random() * 900)}`)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                >
                  Random
                </button>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Race Discipline
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  id: 'sprint',
                  title: '5,000M Sprint',
                  desc: 'High-speed drag to the finish line.',
                },
                {
                  id: 'drift_battle',
                  title: 'Drift Battle',
                  desc: 'Highest drift multiplier takes the crown.',
                },
                {
                  id: 'endless_cruise',
                  title: 'Free Highway',
                  desc: 'Endless shared road with live rivals.',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMpMode(m.id as 'sprint' | 'drift_battle' | 'endless_cruise')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mpMode === m.id
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-black text-white">{m.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Car Card */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: selectedSkin.primary }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/30"
                  style={{ backgroundColor: selectedSkin.accent }}
                />
              </div>
              <div>
                <div className="text-sm font-black text-white">{selectedSkin.name}</div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {selectedSkin.badge} · {selectedSkin.perkTitle}
                </div>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-slate-300">
              <span className="text-cyan-400 font-bold">{selectedSkin.topSpeed} MPH</span> Top Speed
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 md:p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Active Server Port 3000 (Low Latency)</span>
          </div>

          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-600/25 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>LAUNCH MULTIPLAYER RACE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
