import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Volume2, Tag, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Phrase } from '../types';

const CATEGORIES = ['all', 'general', 'travel', 'emergency', 'medical', 'food', 'shopping', 'business', 'hotel', 'transportation', 'custom'] as const;
type CategoryFilter = typeof CATEGORIES[number];

const categoryColors: Record<string, string> = {
  general: 'bg-blue-500/20 text-blue-400',
  travel: 'bg-green-500/20 text-green-400',
  emergency: 'bg-rose-500/20 text-rose-300',
  medical: 'bg-red-500/20 text-red-400',
  food: 'bg-amber-500/20 text-amber-300',
  shopping: 'bg-cyan-500/20 text-cyan-300',
  business: 'bg-violet-500/20 text-violet-300',
  hotel: 'bg-fuchsia-500/20 text-fuchsia-300',
  transportation: 'bg-emerald-500/20 text-emerald-300',
  custom: 'bg-purple-500/20 text-purple-400',
};

export const PhrasebookPanel: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    let list = state.phrasebook;
    if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.originalText.toLowerCase().includes(q) ||
          p.translatedText.toLowerCase().includes(q)
      );
    }
    return list;
  }, [state.phrasebook, activeCategory, search]);

  const handlePlayTTS = (phrase: Phrase) => {
    // Use the browser SpeechSynthesis as a lightweight TTS fallback
    const utterance = new SpeechSynthesisUtterance(phrase.translatedText);
    utterance.rate = state.settings.playbackSpeed;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_PHRASE', payload: id });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="text-lg font-outfit font-semibold">Phrasebook</h2>
          <span className="text-xs text-textSecondary bg-white/5 px-2 py-0.5 rounded-full ml-auto">
            {state.phrasebook.length} phrases
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phrases..."
            className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full capitalize whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/5 text-textSecondary hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
        {state.settings.privateMode && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 text-xs text-yellow-400">
            Private mode is on — new phrases cannot be saved.
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-textSecondary">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No phrases available</p>
            <p className="text-xs mt-1 opacity-60">Try another category or search term</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((phrase) => (
              <motion.div
                key={phrase.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface/50 glass-panel border border-white/5 rounded-xl p-4 mb-3"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${categoryColors[phrase.category] || 'bg-white/10 text-textSecondary'}`}>
                    <Tag size={10} className="inline mr-1" />
                    {phrase.category}
                  </span>
                  <span className="text-xs text-textSecondary">{phrase.languagePair}</span>
                </div>

                <p className="text-sm text-textSecondary mb-1">{phrase.originalText}</p>
                <p className="text-sm text-textPrimary font-medium">{phrase.translatedText}</p>

                <div className="flex items-center gap-2 mt-3 border-t border-white/5 pt-2">
                  <button
                    onClick={() => handlePlayTTS(phrase)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Volume2 size={13} /> Play
                  </button>
                  <button
                    onClick={() => handleDelete(phrase.id)}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors ml-auto"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
