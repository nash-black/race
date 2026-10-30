/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Wrench,
  Gauge,
  Zap,
  Flame,
  Shield,
  Coins,
  Check,
  Lock,
  Volume2,
  X,
  Disc,
  Layers,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  FileCode,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import { CAR_SKINS } from '../game/renderer';
import { CarSkin, CarUpgrades } from '../game/types';
import {
  PlayerProgress,
  CustomCarStyle,
  calculateCarStatsWithUpgrades,
  UPGRADE_COSTS,
  DEFAULT_CAR_UPGRADES,
  SKIN_UNLOCK_COSTS,
} from '../services/progress';
import { sound } from '../game/audio';

interface CarCustomizationLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSkin: CarSkin;
  onSelectSkin: (skin: CarSkin) => void;
  progress: PlayerProgress;
  onUpdateStyle: (carId: string, style: CustomCarStyle) => void;
  onUpgradePart: (carId: string, part: keyof CarUpgrades) => void;
  onUnlockSkin: (skin: CarSkin) => void;
}

const COLOR_PRESETS = [
  { name: 'Crimson Fury', hex: '#dc2626' },
  { name: 'Tokyo Cyan', hex: '#06b6d4' },
  { name: 'Midnight Onyx', hex: '#0f172a' },
  { name: 'Solar Gold', hex: '#f59e0b' },
  { name: 'Emerald Apex', hex: '#10b981' },
  { name: 'Neon Violet', hex: '#8b5cf6' },
  { name: 'Sunset Coral', hex: '#f97316' },
  { name: 'Alpine Frost', hex: '#f8fafc' },
  { name: 'Hyper Magenta', hex: '#ec4899' },
  { name: 'British Racing Green', hex: '#14532d' },
];

const UNDERGLOW_PRESETS = [
  { name: 'Cyan Neon', hex: '#06b6d4' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Toxic Lime', hex: '#84cc16' },
  { name: 'Electric Gold', hex: '#fbbf24' },
  { name: 'Deep Violet', hex: '#8b5cf6' },
  { name: 'Ice White', hex: '#e2e8f0' },
];

export const CarCustomizationLobbyModal: React.FC<CarCustomizationLobbyModalProps> = ({
  isOpen,
  onClose,
  selectedSkin,
  onSelectSkin,
  progress,
  onUpdateStyle,
  onUpgradePart,
  onUnlockSkin,
}) => {
  const [activeTab, setActiveTab] = useState<'paint' | 'underglow' | 'aero' | 'tuning' | 'canva'>('paint');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [currentCarIndex, setCurrentCarIndex] = useState(() => {
    const idx = CAR_SKINS.findIndex((s) => s.id === selectedSkin.id);
    return idx >= 0 ? idx : 0;
  });
  const [isRevving, setIsRevving] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(25);

  if (!isOpen) return null;

  const currentCar = CAR_SKINS[currentCarIndex] || selectedSkin;
  const isUnlocked = progress.unlockedSkins.includes(currentCar.id);
  const unlockCost = SKIN_UNLOCK_COSTS[currentCar.id] ?? 0;
  const canAffordUnlock = progress.bankedCoins >= unlockCost;

  // Custom style for current car
  const savedStyles: CustomCarStyle = progress.customCarStyles?.[currentCar.id] || {};
  const currentPrimaryColor = savedStyles.primaryColor || currentCar.primary;
  const currentSecondaryColor = savedStyles.secondaryColor || currentCar.secondary;
  const currentUnderglowColor = savedStyles.underglowColor || '#06b6d4';
  const isUnderglowActive = savedStyles.underglowEnabled !== false;
  const currentFinish = savedStyles.finish || 'gloss';
  const currentSpoiler = savedStyles.spoilerStyle || 'gt_wing';
  const currentWheel = savedStyles.wheelStyle || 'tuner5';

  const currentUpgrades: CarUpgrades = progress.carUpgrades[currentCar.id] || DEFAULT_CAR_UPGRADES;
  const tunedStats = calculateCarStatsWithUpgrades(currentCar, currentUpgrades);

  const handlePrevCar = () => {
    const nextIdx = (currentCarIndex - 1 + CAR_SKINS.length) % CAR_SKINS.length;
    setCurrentCarIndex(nextIdx);
    onSelectSkin(CAR_SKINS[nextIdx]);
  };

  const handleNextCar = () => {
    const nextIdx = (currentCarIndex + 1) % CAR_SKINS.length;
    setCurrentCarIndex(nextIdx);
    onSelectSkin(CAR_SKINS[nextIdx]);
  };

  const updateStyleProp = (updates: Partial<CustomCarStyle>) => {
    const merged: CustomCarStyle = {
      ...savedStyles,
      ...updates,
    };
    onUpdateStyle(currentCar.id, merged);
  };

  const handleRevEngine = () => {
    setIsRevving(true);
    sound.playSpeedBoost();
    setTimeout(() => {
      sound.playWhoosh();
      setIsRevving(false);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(null);

    // If 3D Model file (.glb / .gltf)
    if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
      const url = URL.createObjectURL(file);
      updateStyleProp({ customModelUrl: url });
      setUploadSuccess(`Loaded 3D car model: ${file.name}`);
      sound.playRankUp();
      return;
    }

    // If image file (PNG / SVG / JPG from Canva)
    if (file.type.startsWith('image/') || file.name.endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        if (dataUrl) {
          updateStyleProp({
            customDecalUrl: dataUrl,
            decalPreset: 'none',
          });
          setUploadSuccess(`Applied Canva decal wrap: ${file.name}`);
          sound.playChallengeComplete();
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read image file');
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploadError('Unsupported format. Please upload PNG/SVG from Canva or a .glb/.gltf 3D model.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-wide">
                  GARAGE & CUSTOMIZATION LOBBY
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
                  {currentCarIndex + 1} / {CAR_SKINS.length} CARS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch vehicles, tune performance, paint finishes, neon underglow, and test engine revs!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs shadow-md">
              <Coins className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{progress.bankedCoins.toLocaleString()} COINS</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Showroom Area */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Left Column: 3D Pedestal Stage & Car Telemetry */}
          <div className="lg:col-span-7 flex flex-col justify-between overflow-y-auto space-y-4">
            {/* Showroom Turnstile Stage */}
            <div className="relative h-64 sm:h-72 md:h-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl border border-slate-800/80 p-4 flex flex-col items-center justify-between overflow-hidden shadow-2xl">
              {/* Studio lighting ceiling spots */}
              <div className="absolute top-0 inset-x-0 h-10 flex justify-around opacity-40 pointer-events-none">
                <div className="w-24 h-16 bg-cyan-400/20 rounded-full blur-xl" />
                <div className="w-32 h-16 bg-white/25 rounded-full blur-xl" />
                <div className="w-24 h-16 bg-amber-400/20 rounded-full blur-xl" />
              </div>

              {/* Top info badge */}
              <div className="w-full flex items-center justify-between z-10 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-display font-black text-white">
                    {currentCar.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    {currentCar.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRevEngine}
                    disabled={isRevving}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isRevving ? 'animate-bounce text-amber-400' : ''}`} />
                    <span>{isRevving ? 'REVVING...' : 'REV ENGINE'}</span>
                  </button>
                </div>
              </div>

              {/* Center Showroom Vehicle Turntable */}
              <div className="relative my-auto flex flex-col items-center justify-center">
                {/* Turntable Pedestal Base */}
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

                  {/* Car SVG Vector Silhouette with Custom Paint & Finishes */}
                  <div
                    className="relative z-10 transition-transform duration-300 cursor-grab active:cursor-grabbing"
                    style={{
                      transform: `perspective(600px) rotateY(${rotationAngle}deg) scale(1.15)`,
                    }}
                    onMouseDown={() => setRotationAngle((prev) => (prev + 35) % 360)}
                  >
                    <svg className="w-56 sm:w-64 h-28" viewBox="0 0 240 100" fill="none">
                      <defs>
                        <linearGradient id="bodyFinishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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

                      {/* Main Aerodynamic Car Body Silhouette */}
                      <path
                        d="M 25,65 L 45,62 L 75,38 L 160,36 L 195,50 L 225,62 L 230,75 L 15,75 Z"
                        fill="url(#bodyFinishGrad)"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                      />

                      {/* Cabin & Windshield */}
                      <path
                        d="M 80,40 L 115,22 L 155,22 L 175,40 Z"
                        fill="#0f172a"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                      <polygon
                        points="84,39 116,24 135,24 135,39"
                        fill="#38bdf8"
                        fillOpacity="0.6"
                      />

                      {/* Headlights & Tail Lights */}
                      <polygon points="220,63 228,66 222,69" fill="#38bdf8" />
                      <polygon points="16,66 22,64 22,68" fill="#ef4444" />

                      {/* Canva Custom Uploaded Image Decal */}
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

                      {/* Decal Preset Overlays */}
                      {!savedStyles.customDecalUrl && savedStyles.decalPreset === 'twin_stripes' && (
                        <g opacity="0.9">
                          <rect x="110" y="38" width="5" height="26" fill="#ffffff" />
                          <rect x="118" y="38" width="5" height="26" fill="#ffffff" />
                        </g>
                      )}
                      {!savedStyles.customDecalUrl && savedStyles.decalPreset === 'tokyo_drift' && (
                        <g opacity="0.9">
                          <circle cx="120" cy="54" r="9" fill="#ef4444" />
                          <text x="120" y="57" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                            速
                          </text>
                        </g>
                      )}
                      {!savedStyles.customDecalUrl && savedStyles.decalPreset === 'dragon_flames' && (
                        <path
                          d="M 160,65 Q 180,55 195,50 Q 185,60 210,62 Z"
                          fill="#f59e0b"
                          opacity="0.9"
                        />
                      )}
                      {!savedStyles.customDecalUrl && savedStyles.decalPreset === 'cyber_hex' && (
                        <g opacity="0.85">
                          <polygon points="120,48 128,52 128,60 120,64 112,60 112,52" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
                        </g>
                      )}
                      {!savedStyles.customDecalUrl && savedStyles.decalPreset === 'sponsor_racing' && (
                        <g opacity="0.9">
                          <circle cx="120" cy="54" r="9" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
                          <text x="120" y="57" fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle">
                            77
                          </text>
                        </g>
                      )}

                      {/* Aero Spoiler Wing */}
                      {currentSpoiler === 'gt_wing' && (
                        <g>
                          <rect x="18" y="22" width="22" height="4" fill="#020617" rx="1" />
                          <line x1="24" y1="26" x2="26" y2="42" stroke="#475569" strokeWidth="2" />
                          <line x1="34" y1="26" x2="36" y2="42" stroke="#475569" strokeWidth="2" />
                        </g>
                      )}

                      {/* Front and Rear Wheels */}
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

              {/* Switch Car Carousel Arrows & Unlocking */}
              <div className="w-full flex items-center justify-between z-10 px-2">
                <button
                  onClick={handlePrevCar}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 cursor-pointer shadow"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div>
                  {!isUnlocked ? (
                    <button
                      onClick={() => onUnlockSkin(currentCar)}
                      disabled={!canAffordUnlock}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
                        canAffordUnlock
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>UNLOCK FOR {unlockCost} COINS</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectSkin(currentCar)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>{selectedSkin.id === currentCar.id ? 'CURRENT RACER' : 'DRIVE THIS CAR'}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleNextCar}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 cursor-pointer shadow"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Performance Telemetry Gauges */}
            <div className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>VEHICLE TELEMETRY</span>
                <span className="text-cyan-400 font-mono font-bold">PERK: {currentCar.perkTitle}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Top Speed</div>
                  <div className="text-base font-black text-cyan-400 font-mono">{tunedStats.topSpeed} MPH</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${(tunedStats.topSpeed / 130) * 100}%` }} />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Acceleration</div>
                  <div className="text-base font-black text-amber-400 font-mono">{tunedStats.acceleration}</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${(tunedStats.acceleration / 120) * 100}%` }} />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Drift Angle</div>
                  <div className="text-base font-black text-rose-400 font-mono">{tunedStats.driftMultiplier.toFixed(2)}x</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-rose-400" style={{ width: `${(tunedStats.driftMultiplier / 2.2) * 100}%` }} />
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Armor</div>
                  <div className="text-base font-black text-emerald-400 font-mono">{tunedStats.armor} HP</div>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${(tunedStats.armor / 160) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Car Selector Grid */}
            <div className="grid grid-cols-5 gap-2">
              {CAR_SKINS.map((skin, idx) => {
                const isCur = idx === currentCarIndex;
                const isSkinUnlocked = progress.unlockedSkins.includes(skin.id);
                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      setCurrentCarIndex(idx);
                      onSelectSkin(skin);
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCur
                        ? 'border-amber-400 bg-amber-400/20 shadow-lg'
                        : isSkinUnlocked
                          ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3 h-3 rounded-full border border-white/40 shadow"
                        style={{ backgroundColor: skin.primary }}
                      />
                      {!isSkinUnlocked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] font-black text-white truncate mt-1">{skin.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Customization Controls (Tabs) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-950/60 rounded-3xl border border-slate-800/80 p-4 overflow-y-auto">
            {/* Customizer Subtabs */}
            <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
              {[
                { id: 'paint', label: 'PAINT', icon: Palette },
                { id: 'underglow', label: 'NEON', icon: Sparkles },
                { id: 'aero', label: 'AERO', icon: Layers },
                { id: 'tuning', label: 'TUNING', icon: Wrench },
                { id: 'canva', label: 'CANVA', icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isTabActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: PAINT & FINISH */}
            {activeTab === 'paint' && (
              <div className="space-y-4">
                {/* Paint Finish Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Surface Finish
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gloss', label: 'High-Gloss Clearcoat' },
                      { id: 'metallic', label: 'Pearl Metallic' },
                      { id: 'matte', label: 'Satin Matte' },
                      { id: 'chameleon', label: 'Cyber Chameleon' },
                    ].map((finish) => (
                      <button
                        key={finish.id}
                        onClick={() => updateStyleProp({ finish: finish.id as CustomCarStyle['finish'] })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          currentFinish === finish.id
                            ? 'border-cyan-400 bg-cyan-950/60 text-white shadow'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {finish.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color Palette */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Primary Body Paint
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.map((color) => {
                      const isSelected = currentPrimaryColor === color.hex;
                      return (
                        <button
                          key={color.name}
                          onClick={() => updateStyleProp({ primaryColor: color.hex })}
                          title={color.name}
                          className={`h-10 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                            isSelected ? 'border-white scale-105 shadow-lg' : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Secondary Trim / Accent Color */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Roof & Mirror Accents
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {COLOR_PRESETS.slice(0, 5).map((color) => {
                      const isSelected = currentSecondaryColor === color.hex;
                      return (
                        <button
                          key={color.name}
                          onClick={() => updateStyleProp({ secondaryColor: color.hex })}
                          className={`h-8 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                            isSelected ? 'border-white scale-105 shadow-lg' : 'border-slate-800 hover:border-slate-600'
                          }`}
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NEON UNDERGLOW */}
            {activeTab === 'underglow' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      NEON UNDERGLOW SYSTEM
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Ground lighting tubes mounted beneath vehicle side skirts.
                    </div>
                  </div>
                  <button
                    onClick={() => updateStyleProp({ underglowEnabled: !isUnderglowActive })}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isUnderglowActive ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                        isUnderglowActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Underglow Color Tube
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {UNDERGLOW_PRESETS.map((glow) => {
                      const isSelected = currentUnderglowColor === glow.hex;
                      return (
                        <button
                          key={glow.name}
                          onClick={() => updateStyleProp({ underglowColor: glow.hex, underglowEnabled: true })}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            isSelected
                              ? 'border-white bg-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full shadow-lg"
                            style={{ backgroundColor: glow.hex, boxShadow: `0 0 12px ${glow.hex}` }}
                          />
                          <span className="text-[10px] font-bold text-slate-300">{glow.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: AERO & WHEELS */}
            {activeTab === 'aero' && (
              <div className="space-y-4">
                {/* Spoilers */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Rear Aero Wing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'stock', label: 'Stock / Low Lip' },
                      { id: 'gt_wing', label: 'Carbon GT Drift Wing' },
                      { id: 'ducktail', label: 'Ducktail Spoiler' },
                      { id: 'drag', label: 'Pro Drag Aerofoil' },
                    ].map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => updateStyleProp({ spoilerStyle: sp.id as CustomCarStyle['spoilerStyle'] })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          currentSpoiler === sp.id
                            ? 'border-cyan-400 bg-cyan-950/60 text-white shadow'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wheels */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Custom Wheel Rims
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'stock', label: 'Stock Factory Alloy' },
                      { id: 'tuner5', label: '5-Spoke Star Tuner' },
                      { id: 'deep_dish', label: 'Deep Dish Chrome' },
                      { id: 'gold_jdm', label: 'Gold JDM Lightweight' },
                    ].map((wh) => (
                      <button
                        key={wh.id}
                        onClick={() => updateStyleProp({ wheelStyle: wh.id as CustomCarStyle['wheelStyle'] })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          currentWheel === wh.id
                            ? 'border-cyan-400 bg-cyan-950/60 text-white shadow'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {wh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PERFORMANCE TUNING */}
            {activeTab === 'tuning' && (
              <div className="space-y-3">
                {[
                  {
                    key: 'turboStage' as keyof CarUpgrades,
                    name: 'Turbocharger',
                    icon: Gauge,
                    stage: currentUpgrades.turboStage,
                    bonus: '+6 MPH / stage',
                  },
                  {
                    key: 'ecuStage' as keyof CarUpgrades,
                    name: 'ECU Remap',
                    icon: Zap,
                    stage: currentUpgrades.ecuStage,
                    bonus: '+6% Accel / stage',
                  },
                  {
                    key: 'coiloversStage' as keyof CarUpgrades,
                    name: 'Drift Coilovers',
                    icon: Flame,
                    stage: currentUpgrades.coiloversStage,
                    bonus: '+0.12x Drift / stage',
                  },
                  {
                    key: 'armorStage' as keyof CarUpgrades,
                    name: 'Carbon Armor',
                    icon: Shield,
                    stage: currentUpgrades.armorStage,
                    bonus: '+8 HP / stage',
                  },
                  {
                    key: 'nitroStage' as keyof CarUpgrades,
                    name: 'Nitrous Tank',
                    icon: Sparkles,
                    stage: currentUpgrades.nitroStage,
                    bonus: '+15% Recharge / stage',
                  },
                ].map((part) => {
                  const isMax = part.stage >= 3;
                  const cost =
                    part.stage === 0
                      ? UPGRADE_COSTS[1]
                      : part.stage === 1
                        ? UPGRADE_COSTS[2]
                        : UPGRADE_COSTS[3];
                  const canAfford = progress.bankedCoins >= cost;
                  const Icon = part.icon;

                  return (
                    <div
                      key={part.key}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <span>{part.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono">Stage {part.stage}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">{part.bonus}</div>
                        </div>
                      </div>

                      {isMax ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          MAX
                        </span>
                      ) : (
                        <button
                          onClick={() => onUpgradePart(currentCar.id, part.key)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                            canAfford
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow cursor-pointer'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{cost}★</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 5: CANVA & 3D ASSET IMPORT */}
            {activeTab === 'canva' && (
              <div className="space-y-4">
                {/* Status Banners */}
                {uploadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="font-semibold">{uploadSuccess}</span>
                    <button onClick={() => setUploadSuccess(null)} className="text-emerald-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
                    <span className="font-semibold">{uploadError}</span>
                    <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Canva Car Livery Uploader */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-wider">
                          Canva Car Wrap & Decal Studio
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Export from Canva as transparent PNG or SVG
                        </div>
                      </div>
                    </div>

                    {savedStyles.customDecalUrl && (
                      <button
                        onClick={() => {
                          updateStyleProp({ customDecalUrl: undefined, decalPreset: 'none' });
                          setUploadSuccess('Removed custom decal wrap.');
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-rose-900/50 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Remove custom decal"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>RESET</span>
                      </button>
                    )}
                  </div>

                  {/* Canva Instructions */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                    <div className="font-bold text-cyan-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>How to export your car designs from Canva:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[10px] leading-relaxed">
                      <li>Design your sticker, wrap, or stripes on a blank Canva canvas.</li>
                      <li>Click <strong className="text-slate-200">Share</strong> → <strong className="text-slate-200">Download</strong>.</li>
                      <li>Select <strong className="text-slate-200">PNG</strong> and check <strong className="text-emerald-400">"Transparent background"</strong>.</li>
                      <li>Drop or select your exported PNG file below!</li>
                    </ol>
                  </div>

                  {/* Upload Dropzone */}
                  <label className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 bg-slate-950/50 cursor-pointer transition-all hover:bg-slate-900/80 group">
                    <input
                      type="file"
                      accept=".png,.svg,.jpg,.jpeg,.webp,.glb,.gltf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="p-2.5 rounded-full bg-slate-800 group-hover:bg-cyan-500/20 text-cyan-400 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      Upload Canva PNG / Decal or .glb 3D Model
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports transparent PNG, SVG, or .glb 3D files
                    </span>
                  </label>

                  {savedStyles.customDecalUrl && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-emerald-500/40">
                      <img
                        src={savedStyles.customDecalUrl}
                        alt="Current Decal"
                        className="w-12 h-10 object-contain rounded bg-slate-900 border border-slate-800"
                      />
                      <div className="flex-1">
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Canva Decal on 3D Car</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Projected across hood, roof, and showroom turntable
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-made Decal Liveries */}
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 block">
                    Fast Livery Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'Clean Stock (No Decal)', desc: 'Pure factory paint' },
                      { id: 'twin_stripes', label: 'Twin GT Stripes', desc: 'White center racing lines' },
                      { id: 'tokyo_drift', label: 'Tokyo Drift Kanji', desc: 'Japanese Touge speed crest' },
                      { id: 'dragon_flames', label: 'Dragon Fire', desc: 'Tri-color flame gradient' },
                      { id: 'cyber_hex', label: 'Cyber 01 Grid', desc: 'Neon hexagonal honeycomb' },
                      { id: 'sponsor_racing', label: 'Apex #77 Pro', desc: 'Championship roundel badge' },
                    ].map((preset) => {
                      const isSelected =
                        !savedStyles.customDecalUrl && (savedStyles.decalPreset || 'none') === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() =>
                            updateStyleProp({
                              decalPreset: preset.id as CustomCarStyle['decalPreset'],
                              customDecalUrl: undefined,
                            })
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-pink-400 bg-pink-950/50 text-white shadow'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold text-white">{preset.label}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3D Model Info Box */}
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                  <div className="font-bold text-amber-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>How 3D Models vs Canva work:</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Canva exports 2D graphics (wraps & decals). For full 3D polygon car bodies with real geometry, you can download free <strong>.glb</strong> or <strong>.gltf</strong> models from Sketchfab, Blender, or TurboSquid and upload them right here or attach them in our chat!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
