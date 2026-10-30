/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Wifi,
  Trophy,
  Flame,
  Swords,
  ShieldAlert,
  Coins,
  Check,
  X,
  RefreshCw,
  MapPin,
  Car,
} from 'lucide-react';
import { TRACKS, TrackId, RaceChallengeInvite } from '../game/types';
import { PlayerProgress, calculateCarStatsWithUpgrades } from '../services/progress';
import { CAR_SKINS } from '../game/renderer';

interface OnlineDriver {
  id: string;
  name: string;
  tag: string;
  rank: string;
  bounty: number;
  carId: string;
  isLocalWifi: boolean;
  score?: number;
}

interface FriendsAndWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onSendChallenge: (targetId: string, trackId: TrackId, wagerCoins: number, pinkSlip: boolean) => void;
  incomingChallenges: RaceChallengeInvite[];
  onAcceptChallenge: (challenge: RaceChallengeInvite) => void;
  onDeclineChallenge: (challengeId: string) => void;
}

export const FriendsAndWagerModal: React.FC<FriendsAndWagerModalProps> = ({
  isOpen,
  onClose,
  progress,
  onSendChallenge,
  incomingChallenges,
  onAcceptChallenge,
  onDeclineChallenge,
}) => {
  const [drivers, setDrivers] = useState<OnlineDriver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<OnlineDriver | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('tokyo_midnight');
  const [wagerCoins, setWagerCoins] = useState<number>(200);
  const [pinkSlip, setPinkSlip] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [challengeSentNotice, setChallengeSentNotice] = useState<string | null>(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/players');
      if (res.ok) {
        const data = await res.json();
        // Exclude current player if tag matches
        const others = (data.players || []).filter(
          (p: OnlineDriver) => p.tag !== progress.driverTag && p.name !== progress.driverName
        );
        setDrivers(others);
      }
    } catch {
      // Fallback empty or offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      const interval = setInterval(fetchDrivers, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, progress.driverTag]);

  if (!isOpen) return null;

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (!selectedDriver) return;
    onSendChallenge(selectedDriver.id, selectedTrack, wagerCoins, pinkSlip);
    setChallengeSentNotice(`Challenge sent to ${selectedDriver.name}! Waiting for them to accept...`);
    setTimeout(() => {
      setChallengeSentNotice(null);
      setSelectedDriver(null);
    }, 3500);
  };

  const currentCarSkin = CAR_SKINS.find((s) => s.id === progress.selectedSkinId) || CAR_SKINS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white tracking-wide">
                  FRIENDS & SCHOOL WI-FI RIVALS
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> LAN DETECT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Search classmates by name or tag, challenge to 1v1 duels, and wager money or Pink Slips!
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

        {/* Incoming Challenges Alert Banner */}
        {incomingChallenges.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-rose-950/90 to-amber-950/90 border border-rose-500/60 shadow-xl flex flex-col gap-2 animate-pulse">
            <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-wider">
              <Swords className="w-4 h-4" />
              <span>INCOMING 1V1 RACE CHALLENGE!</span>
            </div>
            {incomingChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 flex-wrap gap-2"
              >
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{challenge.fromName}</span>
                    <span className="text-xs text-cyan-400 font-mono">[RANK {challenge.fromRank}]</span>
                    {challenge.wagerPinkSlip && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        🔥 PINK SLIP MATCH!
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-400 font-mono">
                      <Coins className="w-3.5 h-3.5" /> Wager: {challenge.wagerCoins} coins
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-cyan-300 font-bold uppercase">
                      Track: {TRACKS.find((t) => t.id === challenge.trackId)?.name || 'Tokyo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeclineChallenge(challenge.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAcceptChallenge(challenge)}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    Accept Duel!
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Body */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-hidden">
          {/* Left: Driver list & search */}
          <div className="md:col-span-6 flex flex-col overflow-hidden bg-slate-950/60 rounded-2xl border border-slate-800/80 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search classmate name or #tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
              <button
                onClick={fetchDrivers}
                disabled={loading}
                title="Refresh drivers"
                className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Drivers list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Wifi className="w-8 h-8 opacity-40 text-slate-400" />
                  <span>No other drivers found right now.</span>
                  <span className="text-[11px] text-slate-400 max-w-xs">
                    Ask your friends at school to open the game on their phone or laptop connected to the same Wi-Fi!
                  </span>
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const isSelected = selectedDriver?.id === driver.id;
                  return (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-lg'
                          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-display font-black text-cyan-400 text-sm">
                          {driver.rank || 'E'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">{driver.name}</span>
                            <span className="text-[10px] text-cyan-400 font-mono">{driver.tag}</span>
                            {driver.isLocalWifi && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold">
                                Same Wi-Fi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-0.5 text-amber-400 font-mono">
                              <Trophy className="w-3 h-3" /> Bounty ${driver.bounty || 500}
                            </span>
                            <span>·</span>
                            <span className="capitalize">{driver.carId || 'Specter'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-black text-cyan-400 uppercase tracking-wider">
                        <span>Select</span>
                        <Swords className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Challenge Configurator */}
          <div className="md:col-span-6 flex flex-col justify-between bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 overflow-y-auto">
            {selectedDriver ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase font-bold">Challenging Racer</div>
                    <div className="text-base font-black text-white flex items-center gap-2">
                      <span>{selectedDriver.name}</span>
                      <span className="text-xs text-cyan-400 font-mono">[{selectedDriver.tag}]</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Target Bounty</div>
                    <div className="text-sm font-mono font-black text-amber-400">
                      ${selectedDriver.bounty || 500}
                    </div>
                  </div>
                </div>

                {/* Select Track */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Select Track
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRACKS.map((t) => {
                      const isTrackSelected = selectedTrack === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTrack(t.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isTrackSelected
                              ? 'border-cyan-400 bg-cyan-950/60 text-white shadow'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-black truncate">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.subtitle}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select Wager Coins */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Coins className="w-3.5 h-3.5 text-amber-400" /> Coin Bet (Winner Takes Pot)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 200, 500, 1000].map((amount) => {
                      const canAfford = progress.bankedCoins >= amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          disabled={!canAfford}
                          onClick={() => setWagerCoins(amount)}
                          className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                            wagerCoins === amount
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300 font-black font-mono shadow'
                              : canAfford
                                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 font-mono text-xs'
                                : 'border-slate-800/40 bg-slate-950/40 text-slate-600 cursor-not-allowed font-mono text-xs'
                          }`}
                        >
                          {amount === 0 ? 'Friendly' : `${amount}★`}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Your coins: {progress.bankedCoins.toLocaleString()}</span>
                    <span>Total Pot: {wagerCoins * 2} Coins</span>
                  </div>
                </div>

                {/* Pink Slip Toggle */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Flame className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                          PINK SLIP RACE (WAGER CAR)
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          High stakes! If you lose, the opponent wins your current car (
                          <span className="text-white font-bold">{currentCarSkin.name}</span>). If you win, you take theirs!
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPinkSlip(!pinkSlip)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        pinkSlip ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          pinkSlip ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {pinkSlip && (
                    <div className="mt-2 text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      WARNING: You could forfeit this vehicle permanently!
                    </div>
                  )}
                </div>

                {challengeSentNotice && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-300 text-xs font-bold text-center">
                    {challengeSentNotice}
                  </div>
                )}

                {/* Send challenge action */}
                <button
                  type="button"
                  onClick={handleSend}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-display font-black text-sm tracking-wider uppercase shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>TRANSMIT 1V1 RACE CHALLENGE</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center my-auto">
                <Users className="w-12 h-12 text-slate-600 mb-3" />
                <div className="text-sm font-bold text-slate-300">Select an Online Driver</div>
                <div className="text-xs text-slate-500 max-w-xs mt-1">
                  Pick a classmate from the list on the left to set up track, coin wager, or Pink Slip stakes!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
