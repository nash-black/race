/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Volume2, Sparkles, Wifi } from 'lucide-react';
import { ChatMessage } from '../game/types';

interface InGameChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  inGame?: boolean;
}

const QUICK_MACROS = [
  '🔥 Eat my dust!',
  '💨 Sick drift angle!',
  '🏫 School Wi-Fi Squad!',
  '🏁 Rematch? Double or nothing!',
  '🚗 Pink Slip on the line!',
  '⚡ Out of my way!',
];

export const InGameChat: React.FC<InGameChatProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggleOpen,
  inGame = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleMacro = (macro: string) => {
    onSendMessage(macro);
  };

  // When closed during inGame, show recent 3 floating chat toasts in the corner
  if (!isOpen) {
    return (
      <div className="absolute bottom-20 left-4 z-40 pointer-events-none flex flex-col gap-1.5 max-w-sm">
        {messages.slice(-3).map((msg) => (
          <div
            key={msg.id}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs shadow-xl animate-fade-in"
          >
            <span className="font-bold text-cyan-400 font-mono text-[11px] truncate max-w-[90px]">
              {msg.senderName}:
            </span>
            <span className="text-slate-200 text-xs">{msg.text}</span>
          </div>
        ))}

        <button
          onClick={onToggleOpen}
          className="pointer-events-auto self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold shadow-lg backdrop-blur-md cursor-pointer transition-all active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chat / Radio</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-4 z-50 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl shadow-2xl p-4 flex flex-col max-h-[460px] pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-display font-black text-white tracking-wider uppercase">
            LIVE RADIO CHAT
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
            <Wifi className="w-2.5 h-2.5" /> LAN
          </span>
        </div>
        <button
          onClick={onToggleOpen}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 py-3 min-h-[160px] max-h-[220px] pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No radio messages yet. Broadcast to school racers!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              <span className="text-cyan-400 font-bold font-mono mr-1">
                {msg.senderName}
                <span className="text-slate-500 text-[10px] ml-0.5">[RANK {msg.senderRank}]</span>:
              </span>
              <span className="text-slate-200">{msg.text}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Radio Callout Macros */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {QUICK_MACROS.map((macro, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleMacro(macro)}
            className="flex-shrink-0 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-[10px] text-slate-300 font-semibold transition-all active:scale-95 cursor-pointer"
          >
            {macro}
          </button>
        ))}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          placeholder="Radio frequency broadcast..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
