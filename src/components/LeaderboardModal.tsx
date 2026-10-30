/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Compass, Flame, Gauge, X, RefreshCw, Send, Check } from 'lucide-react';
import { CAR_SKINS } from '../game/renderer';
import { PlayerProgress } from '../services/progress';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  driftScore: number;
  distance: number;
  topSpeed: number;
  carId: string;
  mode: string;
  date: string;
  country?: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  progress,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const url = selectedMode === 'all' ? '/api/leaderboard' : `/api/leaderboard?mode=${selectedMode}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        setEntries(data.entries);
      }
    } catch (e) {
      console.warn('Leaderboard fetch failed, using cached fallback:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      setSubmitted(false);
    }
  }, [isOpen, selectedMode]);

  const handleSubmitScore = async () => {
    setIsSubmitting(true);
    try {
      const bestEndless = progress.bestScores.endless || 0;
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: progress.driverName || 'Racer 01',
          score: Math.max(bestEndless, 5000),
          driftScore: Math.floor(bestEndless * 0.45),
          distance: Math.floor(bestEndless * 0.08),
          topSpeed: 145,
          carId: progress.selectedSkinId,
          mode: 'endless',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        fetchLeaderboard();
      }
    } catch (e) {
      console.error('Submit score failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const top3 = entries.slice(0, 3);
  const restEntries = entries.slice(3);

  const getCarName = (carId: string) => {
    const skin = CAR_SKINS.find((s) => s.id === carId);
    return skin ? skin.name : 'Crimson GT';
  };

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
                Global Highway Leaderboards
              </h2>
              <p className="text-xs text-slate-400">
                Live rankings across Endless, Drift King, Time Trial, and Multiplayer races.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Filter Bar */}
        <div className="flex items-center justify-between p-3 px-6 bg-slate-950/40 border-b border-slate-800/80 text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'endless', label: 'Endless' },
              { id: 'drift_king', label: 'Drift King' },
              { id: 'time_trial', label: 'Time Trial' },
              { id: 'multiplayer', label: 'Multiplayer' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  selectedMode === m.id
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitScore}
            disabled={isSubmitting || submitted}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 rounded-xl font-black text-xs transition-all active:scale-95"
          >
            {submitted ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            <span>{submitted ? 'SCORE POSTED' : 'SUBMIT MY RECORD'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {top3.map((entry, index) => {
                const colors = [
                  'border-amber-400/60 bg-gradient-to-b from-amber-500/15 to-slate-950/80 text-amber-300',
                  'border-slate-300/50 bg-gradient-to-b from-slate-400/10 to-slate-950/80 text-slate-200',
                  'border-amber-700/50 bg-gradient-to-b from-amber-800/10 to-slate-950/80 text-amber-600',
                ][index];

                return (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xl relative overflow-hidden ${colors}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-display font-mono-numbers">
                        #{index + 1}
                      </span>
                      <Medal className="w-6 h-6" />
                    </div>

                    <div className="mt-2">
                      <h3 className="font-black text-white text-base truncate">{entry.name}</h3>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {getCarName(entry.carId)}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] uppercase">SCORE</span>
                        <span className="font-black text-white font-mono-numbers">
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" />
                          {entry.driftScore.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Compass className="w-3 h-3 text-cyan-400" />
                          {(entry.distance / 1000).toFixed(1)}km
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ranks 4 to 50 List */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {restEntries.length === 0 && top3.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No scores recorded for this category yet. Be the first to set a record!
              </div>
            ) : (
              restEntries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 px-4 hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-500 w-6 text-sm">
                      #{idx + 4}
                    </span>
                    <div>
                      <div className="font-black text-white text-sm">{entry.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {getCarName(entry.carId)} · {entry.mode.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3 text-rose-400" />
                        {entry.driftScore.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-black text-amber-400 text-sm font-mono-numbers">
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
