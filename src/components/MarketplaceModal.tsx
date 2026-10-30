/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Coins,
  Gauge,
  Zap,
  Flame,
  Shield,
  Check,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import { MarketListing } from '../game/types';
import { CAR_SKINS } from '../game/renderer';
import { PlayerProgress } from '../services/progress';

interface MarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onBuyListing: (listing: MarketListing) => Promise<boolean>;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  isOpen,
  onClose,
  progress,
  onBuyListing,
}) => {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/market');
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchListings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = async (listing: MarketListing) => {
    if (progress.bankedCoins < listing.price) return;
    setBuyingId(listing.id);
    try {
      const ok = await onBuyListing(listing);
      if (ok) {
        setPurchaseNotice(`Purchased ${listing.carName} from ${listing.sellerName}! Added to garage.`);
        fetchListings();
        setTimeout(() => setPurchaseNotice(null), 3500);
      }
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 md:p-7 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-black text-white tracking-wide">
                  USED & MODIFIED CAR MARKETPLACE
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {progress.bankedCoins.toLocaleString()} COINS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Buy custom pre-tuned and modified cars sold by other players and classmates!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchListings}
              disabled={loading}
              title="Refresh listings"
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

        {purchaseNotice && (
          <div className="mt-3 p-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold text-center">
            {purchaseNotice}
          </div>
        )}

        {/* Listings Grid */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {listings.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
              <ShoppingBag className="w-12 h-12 opacity-30 text-slate-400" />
              <span>No cars listed on the marketplace right now.</span>
              <span className="text-[11px] text-slate-400">
                You can list your own tuned cars from the Tuning & Performance Shop!
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing) => {
                const canAfford = progress.bankedCoins >= listing.price;
                const isBuying = buyingId === listing.id;
                const skin = CAR_SKINS.find((s) => s.id === listing.carId);

                return (
                  <div
                    key={listing.id}
                    className="p-4 rounded-3xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-white/40 shadow"
                            style={{ backgroundColor: skin?.primary || '#38bdf8' }}
                          />
                          <div>
                            <h3 className="text-base font-display font-black text-white">
                              {listing.carName}
                            </h3>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Seller: <span className="text-cyan-400 font-bold">{listing.sellerName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-mono font-black text-amber-400 flex items-center gap-1 justify-end">
                            <Coins className="w-3.5 h-3.5" />
                            {listing.price.toLocaleString()}★
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Asking Price</span>
                        </div>
                      </div>

                      {/* Upgrades pill summary */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                        <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-slate-400">TURBO</div>
                          <div className="text-cyan-400 font-bold">Stage {listing.upgrades?.turboStage ?? 0}</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-slate-400">ECU</div>
                          <div className="text-amber-400 font-bold">Stage {listing.upgrades?.ecuStage ?? 0}</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-slate-400">COILOVERS</div>
                          <div className="text-rose-400 font-bold">Stage {listing.upgrades?.coiloversStage ?? 0}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {skin?.perkTitle || 'Custom Tuned Machine'}
                      </span>

                      <button
                        type="button"
                        disabled={!canAfford || isBuying}
                        onClick={() => handleBuy(listing)}
                        className={`px-4 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                          !canAfford
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 cursor-pointer'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isBuying ? 'BUYING...' : !canAfford ? 'NEED COINS' : 'BUY THIS CAR'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
