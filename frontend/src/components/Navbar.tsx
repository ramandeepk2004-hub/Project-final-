import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  History,
  Languages,
  MessageSquare,
  MessagesSquare,
  Moon,
  Settings,
  Shield,
  Sun,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { LanguageSelector } from './LanguageSelector';
import type { ActiveView } from '../types';

const tabs: { id: ActiveView; icon: React.ReactNode; label: string }[] = [
  { id: 'chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { id: 'conversation', icon: <MessagesSquare size={18} />, label: 'Conversation' },
  { id: 'phrasebook', icon: <BookOpen size={18} />, label: 'Phrasebook' },
  { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { id: 'history', icon: <History size={18} />, label: 'History' },
  { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
];

export const Navbar: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const nextTheme = state.settings.theme === 'dark'
    ? 'light'
    : state.settings.theme === 'light'
      ? 'system'
      : 'dark';
  const themeLabel = state.settings.theme === 'system'
    ? 'System'
    : state.settings.theme === 'dark'
      ? 'Dark'
      : 'Light';

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-white/10 bg-bg/80 backdrop-blur-2xl">
      <div className="scrollbar-dark flex h-full flex-col overflow-y-auto px-4 py-5">
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <img
            src="/icons.svg"
            alt="OmniTranslator logo"
            className="h-10 w-10 rounded-xl shadow-glow"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-outfit font-semibold text-textPrimary">
              Omni<span className="text-primary">Translator</span>
            </h1>
            <p className="text-xs text-textSecondary">
              AI communication workspace
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-1">
          {tabs.map((tab) => {
            const isActive = state.activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: tab.id })}
                className={`relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary/15 text-white shadow-glow'
                    : 'text-textSecondary hover:bg-white/5 hover:text-white'
                }`}
                aria-label={tab.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-2xl border border-primary/30 bg-primary/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">
              Languages
            </p>
            {state.settings.privateMode && (
              <div className="flex items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-1 text-[11px] font-medium text-yellow-400">
                <Shield size={12} />
                Private
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-textSecondary">
                Source
              </p>
              <LanguageSelector type="A" currentValue={state.languageA} />
            </div>

            <button
              onClick={() => dispatch({ type: 'SWAP_LANGUAGES' })}
              disabled={state.recordingState !== 'idle'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-textSecondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Swap languages"
            >
              <ArrowLeftRight size={16} />
              Swap languages
            </button>

            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-textSecondary">
                Target
              </p>
              <LanguageSelector type="B" currentValue={state.languageB} />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">
            <Languages size={14} />
            Recently used
          </div>
          <div className="flex flex-wrap gap-2">
            {state.recentLanguages.map((code) => (
              <button
                key={code}
                onClick={() => dispatch({ type: 'SET_LANGUAGE_B', payload: code })}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-textSecondary transition-all hover:border-primary/30 hover:text-white"
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() =>
            dispatch({
              type: 'UPDATE_SETTING',
              payload: { theme: nextTheme },
            })
          }
          className="mt-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-textPrimary transition-all hover:border-primary/30 hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            {state.settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            <div className="text-left">
              <p className="font-medium">Theme mode</p>
              <p className="text-xs text-textSecondary">Cycle: Dark, Light, System</p>
            </div>
          </div>
          <span className="rounded-full bg-black/20 px-2 py-1 text-xs text-textSecondary">
            {themeLabel}
          </span>
        </button>

      </div>
    </aside>
  );
};
