import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, ChevronDown, X } from 'lucide-react';
import { useLanguages } from '../hooks/useLanguages';
import { useAppContext } from '../context/AppContext';

interface LanguageSelectorProps {
  type: 'A' | 'B';
  currentValue: string;
}

type Group = { letter: string; items: Array<{ code: string; name: string; native?: string; flag?: string }> };

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ type, currentValue }) => {
  const { languages, loading } = useLanguages();
  const { dispatch, state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['hi', 'en', 'fr', 'es']);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLang = languages.find((language) => language.code === currentValue) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return languages;
    return languages.filter((language) =>
      language.name.toLowerCase().includes(query) ||
      language.code.toLowerCase().includes(query) ||
      language.native?.toLowerCase().includes(query),
    );
  }, [search, languages]);

  const groupedLanguages = useMemo<Group[]>(() => {
    const map = new Map<string, Group['items']>();
    filteredLanguages.forEach((language) => {
      const first = language.name?.[0]?.toUpperCase() || '#';
      const letter = /[A-Z]/.test(first) ? first : '#';
      const arr = map.get(letter) || [];
      arr.push(language);
      map.set(letter, arr);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, items]) => ({
        letter,
        items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredLanguages]);

  const handleSelect = (code: string) => {
    if (type === 'A') {
      dispatch({ type: 'SET_LANGUAGE_A', payload: code });
    } else {
      dispatch({ type: 'SET_LANGUAGE_B', payload: code });
    }
    dispatch({ type: 'PUSH_RECENT_LANGUAGE', payload: code });
    setIsOpen(false);
    setSearch('');
  };

  const toggleFavorite = (event: React.MouseEvent, code: string) => {
    event.stopPropagation();
    setFavorites((previous) =>
      previous.includes(code) ? previous.filter((item) => item !== code) : [...previous, code],
    );
  };

  const listPanel = (
    <>
      <div className="sticky top-0 z-20 border-b border-white/5 bg-surface/95 p-3 backdrop-blur-xl">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search languages..."
            className="w-full rounded-lg border border-white/5 bg-black/20 pl-9 pr-3 py-2 text-sm text-textPrimary placeholder:text-textSecondary focus:border-primary/50 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      <div className="scrollbar-dark max-h-[70vh] overflow-y-auto py-2 md:max-h-80">
        {!search && favorites.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-textSecondary">Favorites</div>
            {languages.filter((language) => favorites.includes(language.code)).map((language) => (
              <button
                key={`fav-${language.code}`}
                onClick={() => handleSelect(language.code)}
                className={`w-full px-3 py-2 text-left transition-colors hover:bg-white/5 ${
                  currentValue === language.code ? 'bg-primary/10 text-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">{language.flag}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{language.name}</div>
                      <div className="truncate text-xs text-textSecondary">{language.native || language.name} ({language.code})</div>
                    </div>
                  </div>
                  <Star size={14} className="fill-yellow-500 text-yellow-500" onClick={(event) => toggleFavorite(event, language.code)} />
                </div>
              </button>
            ))}
          </div>
        )}

        {groupedLanguages.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-textSecondary">No languages found</div>
        ) : (
          groupedLanguages.map((group) => (
            <div key={group.letter} className="mb-2">
              <div className="sticky top-0 z-10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-textSecondary/80 backdrop-blur-lg">
                {group.letter}
              </div>
              {group.items.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleSelect(language.code)}
                  className={`w-full px-3 py-2 text-left transition-colors hover:bg-white/5 ${
                    currentValue === language.code ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-lg">{language.flag}</span>
                      <div className="min-w-0">
                        <div className="truncate text-sm">{language.name}</div>
                        <div className="truncate text-xs text-textSecondary">{language.native || language.name} ({language.code})</div>
                      </div>
                    </div>
                    <Star
                      size={14}
                      className={favorites.includes(language.code)
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-textSecondary/50 hover:text-textSecondary'}
                      onClick={(event) => toggleFavorite(event, language.code)}
                    />
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || state.recordingState !== 'idle'}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedLang?.flag}</span>
            <span className="truncate text-sm font-medium">{selectedLang?.name}</span>
          </div>
          <div className="truncate text-xs text-textSecondary">{selectedLang?.native || selectedLang?.name} ({selectedLang?.code})</div>
        </div>
        <ChevronDown size={16} className={`text-textSecondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 hidden overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl md:block"
            >
              {listPanel}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-bg/95 backdrop-blur-xl md:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                  <p className="text-sm font-semibold text-textPrimary">Select {type === 'A' ? 'Source' : 'Target'} Language</p>
                  <button className="rounded-lg border border-white/10 p-2" onClick={() => setIsOpen(false)} aria-label="Close language modal">
                    <X size={16} />
                  </button>
                </div>
                <div className="min-h-0 flex-1">{listPanel}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
