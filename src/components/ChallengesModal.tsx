/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Challenge } from '../game/types';
import { INITIAL_CHALLENGES, PlayerProgress, saveProgress } from '../services/progress';
import { sound } from '../game/audio';
import { Trophy, CheckCircle, Lock, Award, Flame, Zap, Gauge, Compass, ShieldAlert, Coins, Rocket, Flag, Bomb, Users, X } from 'lucide-react';

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onProgressUpdate: (updated: PlayerProgress) => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  isOpen,
  onClose,
  progress,
  onProgressUpdate,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-5 h-5 text-rose-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-300" />;
      case 'Gauge': return <Gauge className="w-5 h-5 text-cyan-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'Rocket': return <Rocket className="w-5 h-5 text-purple-400" />;
      case 'Compass': return <Compass className="w-5 h-5 text-emerald-400" />;
      case 'Flag': return <Flag className="w-5 h-5 text-yellow-400" />;
      case 'Coins': return <Coins className="w-5 h-5 text-amber-400" />;
      case 'Bomb': return <Bomb className="w-5 h-5 text-orange-400" />;
      case 'Users': return <Users className="w-5 h-5 text-blue-400" />;
      default: return <Award className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleClaimReward = (ch: Challenge) => {
    sound.playChallengeComplete();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    const updated = { ...progress };
    const state = updated.challenges[ch.id] || { current: ch.target, completed: true, claimed: false };
    state.claimed = true;
    updated.challenges[ch.id] = state;
    updated.bankedCoins += ch.rewardCoins;

    saveProgress(updated);
    onProgressUpdate(updated);
  };

  const filteredChallenges = INITIAL_CHALLENGES.filter((ch) => {
    if (filterCategory === 'all') return true;
    return ch.category === filterCategory;
  });

  const totalCompleted = INITIAL_CHALLENGES.filter(
    (ch) => progress.challenges[ch.id]?.completed
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide uppercase">
                Challenges & Mastery
              </h2>
              <p className="text-xs text-slate-400">
                Complete driving feats, perfect drifts, and claim gold coins to unlock legendary cars.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-400 uppercase">Progress</div>
              <div className="text-base font-black text-amber-400 font-mono">
                {totalCompleted} / {INITIAL_CHALLENGES.length} Completed
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 px-6 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          {['all', 'drift', 'speed', 'distance', 'tactical'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                filterCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredChallenges.map((ch) => {
            const state = progress.challenges[ch.id] || { current: 0, completed: false, claimed: false };
            const progressPct = Math.min(100, Math.round((state.current / ch.target) * 100));

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-2xl border transition-all ${
                  state.completed
                    ? state.claimed
                      ? 'bg-slate-950/40 border-slate-800/70 opacity-75'
                      : 'bg-amber-500/10 border-amber-500/40 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5">
                      {getIcon(ch.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base tracking-wide">
                          {ch.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider bg-slate-800 text-slate-300">
                          {ch.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{ch.description}</p>
                    </div>
                  </div>

                  {/* Reward & Claim */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{ch.rewardCoins} COINS</span>
                    </div>

                    {state.completed ? (
                      state.claimed ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                          <CheckCircle className="w-3.5 h-3.5" /> Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaimReward(ch)}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-lg active:scale-95 transition-all animate-pulse"
                        >
                          CLAIM
                        </button>
                      )
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <span>
                      Progress: {state.current.toLocaleString()} / {ch.target.toLocaleString()}
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        state.completed ? 'bg-amber-400' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
