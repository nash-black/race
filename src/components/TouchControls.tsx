/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Zap, OctagonX, Flame, ChevronUp } from 'lucide-react';
import { InputState } from '../game/types';

interface TouchControlsProps {
  onInput: (control: keyof InputState, active: boolean | number) => void;
  touchSteering?: boolean;
  controlScale?: number;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInput,
  touchSteering = false,
  controlScale = 1,
}) => {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const controlStyle = { transform: `scale(${controlScale})`, touchAction: 'none' as const };

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  };

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    const offset = (clientX - mid) / (rect.width / 2);
    const clamped = Math.max(-1, Math.min(1, offset));
    onInput('analogSteer', clamped);
  };

  return (
    <div className="absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none md:hidden z-20">
      {/* Steering Cluster */}
      {touchSteering ? (
        <div
          ref={sliderRef}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            triggerHaptic();
            handleSliderMove(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) {
              handleSliderMove(e.clientX);
            }
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onInput('analogSteer', 0);
          }}
          onPointerCancel={() => onInput('analogSteer', 0)}
          className="pointer-events-auto w-44 h-16 rounded-2xl bg-slate-900/85 border border-slate-700/80 flex items-center justify-center p-2 shadow-2xl backdrop-blur-md"
        >
          <div className="w-full flex items-center justify-between px-3 text-slate-400 text-xs font-mono font-bold">
            <span>◄ STEER</span>
            <div className="w-3 h-8 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span>STEER ►</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              triggerHaptic();
              onInput('left', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onInput('left', false);
            }}
            onPointerCancel={() => onInput('left', false)}
            aria-label="Steer Left"
            style={controlStyle}
            className="w-16 h-16 rounded-2xl bg-slate-900/85 active:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              triggerHaptic();
              onInput('right', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onInput('right', false);
            }}
            onPointerCancel={() => onInput('right', false)}
            aria-label="Steer Right"
            style={controlStyle}
            className="w-16 h-16 rounded-2xl bg-slate-900/85 active:bg-slate-700 border border-slate-700/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Throttle, Handbrake & Action Cluster */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Foot Brake */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            triggerHaptic();
            onInput('brake', true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onInput('brake', false);
          }}
          onPointerCancel={() => onInput('brake', false)}
          aria-label="Foot Brake"
          style={controlStyle}
          className="w-13 h-14 rounded-2xl bg-slate-900/85 active:bg-slate-800 border border-slate-700 text-slate-300 flex flex-col items-center justify-center shadow-xl backdrop-blur-md active:scale-95 transition-transform"
        >
          <OctagonX className="w-5 h-5 text-rose-400" />
          <span className="text-[9px] font-bold mt-0.5">BRAKE</span>
        </button>

        {/* Dedicated Handbrake (Drift Initiation) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            triggerHaptic();
            onInput('handbrake', true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onInput('handbrake', false);
          }}
          onPointerCancel={() => onInput('handbrake', false)}
          aria-label="Drift Handbrake"
          style={controlStyle}
          className="w-14 h-14 rounded-2xl bg-rose-600 active:bg-rose-500 border border-rose-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform shadow-[0_0_15px_rgba(225,29,72,0.6)]"
        >
          <Flame className="w-6 h-6 fill-white" />
          <span className="text-[9px] font-black tracking-wider">DRIFT</span>
        </button>

        {/* Throttle */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            triggerHaptic();
            onInput('up', true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onInput('up', false);
          }}
          onPointerCancel={() => onInput('up', false)}
          aria-label="Throttle Gas"
          style={controlStyle}
          className="w-13 h-14 rounded-2xl bg-emerald-600/90 active:bg-emerald-500 border border-emerald-400 text-white flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform"
        >
          <ChevronUp className="w-6 h-6" />
          <span className="text-[9px] font-bold">GAS</span>
        </button>

        {/* Nitro Boost */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            triggerHaptic();
            onInput('nitro', true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onInput('nitro', false);
          }}
          onPointerCancel={() => onInput('nitro', false)}
          aria-label="Nitro Boost"
          style={controlStyle}
          className="w-15 h-15 rounded-2xl bg-cyan-600 active:bg-cyan-500 border border-cyan-400 text-white flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-transform shadow-[0_0_16px_rgba(6,182,212,0.7)]"
        >
          <Zap className="w-7 h-7 fill-white" />
          <span className="text-[9px] font-black tracking-wider">NITRO</span>
        </button>
      </div>
    </div>
  );
};
