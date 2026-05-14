import { Toaster } from 'react-hot-toast';
import { BarChart3, BookOpen, History, Menu, MessageSquare, MessagesSquare, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { ConversationScreen } from './components/ConversationScreen';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPage } from './components/SettingsPage';
import { PhrasebookPanel } from './components/PhrasebookPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { useAppContext } from './context/AppContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';

function MainContent() {
  const { state } = useAppContext();

  if (state.activeView === 'phrasebook') {
    return <PhrasebookPanel />;
  }

  if (state.activeView === 'analytics') {
    return <AnalyticsPanel />;
  }

  if (state.activeView === 'history') {
    return <HistoryPanel />;
  }

  return (
    <>
      {state.activeView === 'conversation' ? <ConversationScreen /> : <ChatView />}
      <ControlPanel />
    </>
  );
}

function AppShell() {
  const { state, dispatch } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkTheme =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && prefersDark);

  const mobileTabs = [
    { id: 'chat', icon: <MessageSquare size={18} />, label: 'Chat' },
    { id: 'conversation', icon: <MessagesSquare size={18} />, label: 'Talk' },
    { id: 'phrasebook', icon: <BookOpen size={18} />, label: 'Phrases' },
    { id: 'history', icon: <History size={18} />, label: 'History' },
    { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Stats' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
  ] as const;

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail) {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: custom.detail as never });
      }
    };
    window.addEventListener('ot:set-view', handler);
    return () => window.removeEventListener('ot:set-view', handler);
  }, [dispatch]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'window.error',
          message: event.message || 'Unknown runtime error',
        },
      });
    };

    const onUnhandled = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message || 'Unhandled promise rejection';
      dispatch({
        type: 'SET_ERROR',
        payload: {
          type: 'unhandledrejection',
          message,
        },
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, [dispatch]);

  return (
    <div
      className="min-h-screen bg-bg relative overflow-hidden"
      style={{ ['--mobile-nav-height' as string]: '76px' }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-secondary/15 blur-[120px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-purple-500/15 blur-[120px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <Navbar />

        <main className="flex-1 min-w-0 md:ml-72">
          <div className="h-screen overflow-hidden">
            <MainContent />
          </div>
        </main>
      </div>
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-3 top-3 z-50 rounded-xl border border-white/15 bg-bg/80 p-2 text-white backdrop-blur md:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[82%] max-w-[320px] border-r border-white/10 bg-bg/95 p-4 backdrop-blur-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Menu</h2>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-lg p-2 text-textSecondary">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    dispatch({ type: 'SET_ACTIVE_VIEW', payload: tab.id as never });
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${
                    state.activeView === tab.id ? 'bg-primary/20 text-white' : 'text-textSecondary'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[var(--mobile-nav-height)] items-center justify-around border-t border-white/10 bg-bg/90 px-2 py-2 backdrop-blur-xl md:hidden">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => state.activeView !== tab.id && window.dispatchEvent(new CustomEvent('ot:set-view', { detail: tab.id }))}
            className={`flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] ${
              state.activeView === tab.id ? 'text-white bg-primary/20' : 'text-textSecondary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <SettingsPage />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: isDarkTheme ? '#111827' : '#ffffff',
            color: isDarkTheme ? '#F9FAFB' : '#111827',
            border: isDarkTheme
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(15,23,42,0.08)',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppErrorBoundary>
        <AppShell />
      </AppErrorBoundary>
    </AppProvider>
  );
}

export default App;
