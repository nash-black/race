/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  Zap,
  Gauge,
  Flame,
  Shield,
  Coins,
  Check,
  Tag,
  ArrowUpRight,
  X,
  Sparkles,
} from 'lucide-react';
import { CarSkin, CarUpgrades } from '../game/types';
import {
  PlayerProgress,
  calculateCarStatsWithUpgrades,
  UPGRADE_COSTS,
  DEFAULT_CAR_UPGRADES,
} from '../services/progress';

interface CarTuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkin: CarSkin;
  progress: PlayerProgress;
  onUpgradePart: (carId: string, part: keyof CarUpgrades) => void;
  onListCarOnMarket: (carId: string, price: number) => Promise<boolean>;
}

export const CarTuningModal: React.FC<CarTuningModalProps> = ({
  isOpen,
  onClose,
  selectedSkin,
  progress,
  onUpgradePart,
  onListCarOnMarket,
}) => {
  const [askingPrice, setAskingPrice] = useState<number>(1200);
  const [listingSuccess, setListingSuccess] = useState<string | null>(null);
  const [isListing, setIsListing] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUpgrades: CarUpgrades = progress.carUpgrades[selectedSkin.id] || DEFAULT_CAR_UPGRADES;
  const tunedStats = calculateCarStatsWithUpgrades(selectedSkin, currentUpgrades);

  const handleListCar = async () => {
    setIsListing(true);
    try {
      const ok = await onListCarOnMarket(selectedSkin.id, askingPrice);
      if (ok) {
        setListingSuccess(`Successfully listed ${selectedSkin.name} on the marketplace for ${askingPrice} coins!`);
        setTimeout(() => setListingSuccess(null), 3500);
      }
    } finally {
      setIsListing(false);
    }
  };

  const getStageCost = (currentStage: number) => {
    if (currentStage === 0) return UPGRADE_COSTS[1];
    if (currentStage === 1) return UPGRADE_COSTS[2];
    if (currentStage === 2) return UPGRADE_COSTS[3];
    return 0;
  };

  const upgradeParts: Array<{
    key: keyof CarUpgrades;
    name: string;
    icon: React.ReactNode;
    desc: string;
    currentStage: number;
    statName: string;
    stageBonus: string;
  }> = [
    {
      key: 'turboStage',
      name: 'High-Spool Turbocharger',
      icon: <Gauge className="w-5 h-5 text-cyan-400" />,
      desc: 'Increases top straight-line speed & boost velocity.',
      currentStage: currentUpgrades.turboStage,
      statName: 'Top Speed',
      stageBonus: '+6 MPH / stage',
    },
    {
      key: 'ecuStage',
      name: 'Twin Stage ECU Remap',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      desc: 'Sharpens throttle curve & acceleration torque.',
      currentStage: currentUpgrades.ecuStage,
      statName: 'Accel',
      stageBonus: '+6% / stage',
    },
    {
      key: 'coiloversStage',
      name: 'Drift Coilovers & Angle Kit',
      icon: <Flame className="w-5 h-5 text-rose-400" />,
      desc: 'Broadens max slip angle & boosts drift score multiplier.',
      currentStage: currentUpgrades.coiloversStage,
      statName: 'Drift Multiplier',
      stageBonus: '+0.12x / stage',
    },
    {
      key: 'armorStage',
      name: 'Reinforced Carbon Armor',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      desc: 'Protects vehicle durability against high-speed impacts.',
      currentStage: currentUpgrades.armorStage,
      statName: 'Armor',
      stageBonus: '+8 HP / stage',
    },
    {
      key: 'nitroStage',
      name: 'Nitrous Purge Injectors',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      desc: 'Expands nitro storage tank and refill efficiency.',
      currentStage: currentUpgrades.nitroStage,
      statName: 'Nitro Tank',
      stageBonus: '+15% recharge / stage',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white tracking-wide">
                  TUNING & PERFORMANCE SHOP
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {progress.bankedCoins.toLocaleString()} COINS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage up parts on <span className="text-white font-bold">{selectedSkin.name}</span> or list it in the Used Car Market!
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

        {/* Main Tuning Area */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 overflow-hidden">
          {/* Left: Performance Parts Upgrades */}
          <div className="md:col-span-7 flex flex-col overflow-y-auto space-y-3 pr-1">
            {upgradeParts.map((part) => {
              const stage = part.currentStage;
              const isMax = stage >= 3;
              const nextStageCost = getStageCost(stage);
              const canAfford = progress.bankedCoins >= nextStageCost;

              return (
                <div
                  key={part.key}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
                      {part.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{part.name}</span>
                        {/* Stages pip indicator */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((s) => (
                            <div
                              key={s}
                              className={`w-2 h-2 rounded-sm ${
                                s <= stage ? 'bg-amber-400' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{part.desc}</p>
                      <div className="text-[10px] text-cyan-400 font-mono mt-1">
                        Current: Stage {stage} ({part.stageBonus})
                      </div>
                    </div>
                  </div>

                  {/* Upgrade button */}
                  <div>
                    {isMax ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> MAX
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onUpgradePart(selectedSkin.id, part.key)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                          canAfford
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{nextStageCost}★ UP</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Specs Comparison & Marketplace Listing */}
          <div className="md:col-span-5 flex flex-col justify-between bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 space-y-4 overflow-y-auto">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                TUNED SPECIFICATIONS
              </div>

              {/* Stats telemetry panel */}
              <div className="space-y-2.5 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Top Speed</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {tunedStats.topSpeed} MPH (+{tunedStats.topSpeed - selectedSkin.topSpeed})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400"
                      style={{ width: `${Math.min(100, (tunedStats.topSpeed / 130) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Acceleration</span>
                    <span className="font-mono font-bold text-amber-400">
                      {tunedStats.acceleration} (+{tunedStats.acceleration - selectedSkin.acceleration})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${Math.min(100, (tunedStats.acceleration / 120) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Drift Multiplier</span>
                    <span className="font-mono font-bold text-rose-400">
                      {tunedStats.driftMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400"
                      style={{
                        width: `${Math.min(100, (tunedStats.driftMultiplier / 2.2) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Chassis Armor</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {tunedStats.armor} HP
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${Math.min(100, (tunedStats.armor / 160) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* List on Marketplace section */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>SELL TUNED CAR ON MARKET</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mb-3">
                Sell your custom tuned {selectedSkin.name} to classmates and other players on the server!
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-400">Asking Price:</span>
                <input
                  type="number"
                  min="300"
                  max="50000"
                  step="100"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Math.max(300, Number(e.target.value)))}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 text-center"
                />
                <span className="text-xs font-mono text-amber-400">★ Coins</span>
              </div>

              {listingSuccess && (
                <div className="mb-2 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] font-medium text-center">
                  {listingSuccess}
                </div>
              )}

              <button
                type="button"
                disabled={isListing}
                onClick={handleListCar}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isListing ? 'LISTING CAR...' : 'LIST ON MARKETPLACE'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
