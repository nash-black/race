/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Lock,
  CheckCircle2,
  Coins,
  MapPin,
  Flame,
  X,
  Play,
  Sparkles,
} from 'lucide-react';
import { OnlineCup, TrackId, TRACKS } from '../game/types';
import { PlayerProgress, getRankFromPoints } from '../services/progress';

interface OnlineCupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onEnterCup: (cup: OnlineCup) => void;
}

export const OnlineCupsModal: React.FC<OnlineCupsModalProps> = ({
  isOpen,
  onClose,
  progress,
  onEnterCup,
}) => {
  const [cups, setCups] = useState<OnlineCup[]>([]);
  const [selectedCup, setSelectedCup] = useState<OnlineCup | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/cups')
        .then((r) => r.json())
        .then((data) => {
          if (data.cups) {
            setCups(data.cups);
            setSelectedCup(data.cups[0]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const RANK_ORDER: Record<string, number> = {
    E: 1,
    D: 2,
    C: 3,
    B: 4,
    A: 5,
    S: 6,
  };

  const currentRank = getRankFromPoints(progress.rankPoints || 0).rank;
  const playerRankVal = RANK_ORDER[currentRank] || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white tracking-wide">
                  ONLINE CHAMPIONSHIP CUPS
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                  RANK {currentRank} · {progress.rankPoints || 0} PTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Climb license ranks, win prestigious trophies, and take down huge prize purses!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cups Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
          {cups.map((cup) => {
            const reqVal = RANK_ORDER[cup.minRank] || 1;
            const isQualified = playerRankVal >= reqVal;
            const canAfford = progress.bankedCoins >= cup.entryFee;
            const isSelected = selectedCup?.id === cup.id;
            const trackName = TRACKS.find((t) => t.id === cup.trackId)?.name || 'Expressway';

            return (
              <div
                key={cup.id}
                onClick={() => setSelectedCup(cup)}
                className={`relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_25px_rgba(251,191,36,0.2)]'
                    : isQualified
                      ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      : 'border-slate-800/60 bg-slate-950/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-xs">
                        {cup.badge}
                      </div>
                      <div>
                        <h3 className="text-base font-display font-black text-white">{cup.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{trackName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider ${
                          isQualified
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isQualified ? 'Qualified' : `Requires Rank ${cup.minRank}`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{cup.subtitle}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Entry Fee</div>
                      <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        <span>{cup.entryFee} Coins</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Grand Purse</div>
                      <div className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>+{cup.prizeCoins.toLocaleString()} Coins</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reward: {cup.specialReward || 'Gold Cup Trophy'}</span>
                  </span>

                  <button
                    type="button"
                    disabled={!isQualified || !canAfford}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnterCup(cup);
                    }}
                    className={`px-4 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      !isQualified
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : !canAfford
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 hover:brightness-110 cursor-pointer'
                    }`}
                  >
                    {!isQualified ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>LOCKED (RANK {cup.minRank})</span>
                      </>
                    ) : !canAfford ? (
                      <>
                        <Coins className="w-3.5 h-3.5" />
                        <span>NEED COINS</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>ENTER CUP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
