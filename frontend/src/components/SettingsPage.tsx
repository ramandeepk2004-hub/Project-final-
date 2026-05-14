import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SettingToggle: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1 mr-4">
      <p className="text-sm font-medium text-textPrimary">{label}</p>
      {description && <p className="text-xs text-textSecondary mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-white/10'}`}
      aria-label={`Toggle ${label}`}
    >
      <motion.div
        layout
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: value ? 22 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  </div>
);

type SettingOptionsProps<T extends string | number> = {
  label: string;
  description?: string;
  options: { label: string; value: T }[];
  current: T;
  onChange: (v: T) => void;
};

const SettingOptions = <T extends string | number>({
  label,
  description,
  options,
  current,
  onChange,
}: SettingOptionsProps<T>) => (
  <div className="py-3">
    <p className="text-sm font-medium text-textPrimary mb-1">{label}</p>
    {description && <p className="text-xs text-textSecondary mb-2">{description}</p>}
    <div className="flex gap-1 bg-black/30 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
            current === opt.value
              ? 'bg-surface text-primary font-semibold shadow-sm'
              : 'text-textSecondary hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2 px-1">{title}</h3>
    <div className="bg-surface/50 glass-panel border border-white/5 rounded-xl px-4 divide-y divide-white/5">
      {children}
    </div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { settings } = state;

  const update = (partial: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTING', payload: partial });
  };

  return (
    <AnimatePresence>
      {state.activeView === 'settings' && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'chat' })}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-bg border-l border-white/10 z-50 overflow-y-auto scrollbar-hide"
          >
            <div className="sticky top-0 bg-bg/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-outfit font-semibold">Settings</h2>
              <button
                onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'chat' })}
                className="p-2 rounded-full hover:bg-white/5 text-textSecondary hover:text-white transition-colors"
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4">
              <Section title="Translation">
                <SettingToggle
                  label="Auto-Play Audio"
                  description="Automatically play translated audio after processing"
                  value={settings.autoPlay}
                  onChange={(v) => update({ autoPlay: v })}
                />
                <SettingOptions
                  label="Theme"
                  description="Choose the application appearance"
                  options={[
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                    { label: 'System', value: 'system' },
                  ]}
                  current={settings.theme}
                  onChange={(v) => update({ theme: v })}
                />
                <SettingOptions
                  label="Playback Speed"
                  options={[
                    { label: '0.75×', value: 0.75 },
                    { label: '1×', value: 1 },
                    { label: '1.25×', value: 1.25 },
                  ]}
                  current={settings.playbackSpeed}
                  onChange={(v) => update({ playbackSpeed: v })}
                />
                <SettingToggle
                  label="Motion Effects"
                  description="Enable premium transitions and animated controls"
                  value={settings.animationsEnabled}
                  onChange={(v) => update({ animationsEnabled: v })}
                />
              </Section>

              <Section title="Conversation">
                <SettingToggle
                  label="Continuous Listening"
                  description="Automatically restart recording after each translation"
                  value={settings.continuousListening}
                  onChange={(v) => update({ continuousListening: v })}
                />
                <SettingToggle
                  label="Auto-Scroll"
                  description="Scroll to the latest message automatically"
                  value={settings.autoScroll}
                  onChange={(v) => update({ autoScroll: v })}
                />
                <SettingToggle
                  label="Auto Detect Speaker"
                  description="Use silence detection to switch turns in conversation mode"
                  value={settings.autoDetectSpeaker}
                  onChange={(v) => update({ autoDetectSpeaker: v })}
                />
              </Section>

              <Section title="Data">
                <SettingToggle
                  label="Save History"
                  description="Keep translation history in local storage"
                  value={settings.historyEnabled}
                  onChange={(v) => update({ historyEnabled: v })}
                />
                <div className="py-3">
                  <button
                    onClick={() => {
                      dispatch({ type: 'CLEAR_HISTORY' });
                      localStorage.removeItem('ag_history');
                    }}
                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={14} />
                    Clear All History
                  </button>
                </div>
              </Section>

              <Section title="Privacy">
                <SettingToggle
                  label="Allow Voice Storage"
                  description="Allow audio recordings to be stored on the server"
                  value={settings.allowVoiceStorage}
                  onChange={(v) => update({ allowVoiceStorage: v })}
                />
                <SettingToggle
                  label="Profanity Filter"
                  description="Filter inappropriate language (processed server-side)"
                  value={settings.filterProfanity}
                  onChange={(v) => update({ filterProfanity: v })}
                />
              </Section>

              <Section title="Clipboard">
                <SettingOptions
                  label="Copy Mode"
                  description="What to copy when you tap the copy button"
                  options={[
                    { label: 'Translated Only', value: 'translated' },
                    { label: 'Both', value: 'both' },
                  ]}
                  current={settings.copyMode}
                  onChange={(v) => update({ copyMode: v })}
                />
              </Section>

              <Section title="Accessibility">
                <SettingToggle
                  label="Large Text"
                  description="Increase UI font scale across the workspace"
                  value={settings.largeText}
                  onChange={(v) => update({ largeText: v })}
                />
                <SettingToggle
                  label="High Contrast"
                  description="Increase contrast for improved readability"
                  value={settings.highContrast}
                  onChange={(v) => update({ highContrast: v })}
                />
                <SettingToggle
                  label="Subtitle Mode"
                  description="Prioritize transcript visibility while speaking"
                  value={settings.subtitleMode}
                  onChange={(v) => update({ subtitleMode: v })}
                />
                <SettingToggle
                  label="Dyslexia-Friendly Font"
                  description="Switch to a reading-optimized font stack"
                  value={settings.dyslexiaFont}
                  onChange={(v) => update({ dyslexiaFont: v })}
                />
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

