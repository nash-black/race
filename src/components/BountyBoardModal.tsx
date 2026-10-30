/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Skull,
  Flame,
  Trophy,
  Swords,
  Coins,
  RefreshCw,
  X,
  Target,
  Shield,
} from 'lucide-react';
import { BountyRacer } from '../game/types';
import { PlayerProgress, getRankFromPoints } from '../services/progress';

interface BountyBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onHuntRacer: (racer: BountyRacer) => void;
}

export const BountyBoardModal: React.FC<BountyBoardModalProps> = ({
  isOpen,
  onClose,
  progress,
  onHuntRacer,
}) => {
  const [bounties, setBounties] = useState<BountyRacer[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBounties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/bounties');
      if (res.ok) {
        const data = await res.json();
        setBounties(data.bounties || []);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBounties();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playerRank = getRankFromPoints(progress.rankPoints || 0).rank;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Skull className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white tracking-wide">
                  MOST WANTED BOUNTY BOARD
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-xs font-mono font-bold border border-rose-500/30">
                  YOUR BOUNTY: ${progress.bounty?.toLocaleString() || 500}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defeat high-bounty drivers to claim their cash reward and claim their license rank!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBounties}
              disabled={loading}
              title="Refresh bounty board"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player's Own Status Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-display font-black text-slate-950 text-sm">
              {playerRank}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{progress.driverName}</span>
                <span className="text-[10px] font-mono text-cyan-400">[{progress.driverTag}]</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Record: {progress.wins || 0}W / {progress.losses || 0}L</span>
                <span>·</span>
                <span className="text-rose-400 font-bold flex items-center gap-0.5">
                  <Flame className="w-3 h-3" /> {progress.winStreak || 0} Streak
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Your Bounty</div>
              <div className="text-base font-mono font-black text-amber-400">
                ${(progress.bounty || 500).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Bounties List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {bounties.map((target, idx) => (
            <div
              key={target.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                idx === 0
                  ? 'border-amber-400/60 bg-amber-950/20 shadow-lg'
                  : idx === 1
                    ? 'border-slate-400/50 bg-slate-900/80'
                    : 'border-slate-800 bg-slate-950/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-sm ${
                    idx === 0
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}
                >
                  #{idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{target.name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono font-bold text-amber-400 border border-slate-700">
                      RANK {target.rank} · {target.rankTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="capitalize text-slate-300 font-semibold">{target.carId}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {target.wins} Wins ({target.losses}L)
                    </span>
                    <span>·</span>
                    <span className="text-rose-400 font-mono font-bold flex items-center gap-0.5">
                      <Flame className="w-3 h-3" /> {target.winStreak} Streak
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Reward Bounty</div>
                  <div className="text-base font-mono font-black text-amber-400 flex items-center gap-1 justify-end">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>${target.bounty.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onHuntRacer(target)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>HUNT</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
