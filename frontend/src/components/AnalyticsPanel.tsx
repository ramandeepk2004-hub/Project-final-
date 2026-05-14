import React, { useMemo } from 'react';
import { BarChart3, BookOpen, Clock, Globe, Mic2, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const AnalyticsPanel: React.FC = () => {
  const { state } = useAppContext();

  const stats = useMemo(() => {
    const messages = state.messages;
    const total = messages.length;
    const avgMs = total > 0 ? messages.reduce((sum, message) => sum + message.processingMs, 0) / total : 0;
    const speechDurationEstimate = messages.reduce((sum, message) => sum + Math.max(2, message.originalText.split(/\s+/).length * 0.45), 0);
    const accuracyEstimate = total > 0
      ? Math.min(98, 78 + Math.round(messages.filter((message) => message.translatedText.length > 0).length / total * 20))
      : 0;

    const langMap = new Map<string, number>();
    messages.forEach((message) => {
      const pair = `${message.sourceLanguage} → ${message.targetLanguage}`;
      langMap.set(pair, (langMap.get(pair) || 0) + 1);
    });

    const trend = messages.slice(-7).map((message, index) => ({
      label: `#${index + 1}`,
      value: message.processingMs,
    }));

    const phrasebookUsage = state.phrasebook.length;
    const maxLangCount = Math.max(...Array.from(langMap.values()), 1);

    return {
      total,
      avgMs,
      speechDurationEstimate,
      accuracyEstimate,
      phrasebookUsage,
      langBreakdown: Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8),
      maxLangCount,
      trend,
    };
  }, [state.messages, state.phrasebook.length]);

  return (
    <div className="h-full overflow-y-auto scrollbar-hide px-6 pt-6 pb-[8rem]">
      <div className="mb-6 flex items-center gap-2">
        <BarChart3 size={20} className="text-primary" />
        <h2 className="text-lg font-outfit font-semibold">Analytics</h2>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Globe size={18} />} label="Total Translations" value={stats.total.toString()} accent="from-primary/20 to-primary/5" />
        <StatCard icon={<Clock size={18} />} label="Avg Response Time" value={`${(stats.avgMs / 1000).toFixed(1)}s`} accent="from-secondary/20 to-secondary/5" />
        <StatCard icon={<Mic2 size={18} />} label="Speech Duration" value={`${stats.speechDurationEstimate.toFixed(0)}s`} accent="from-emerald-500/20 to-emerald-500/5" />
        <StatCard icon={<Target size={18} />} label="Accuracy Estimate" value={`${stats.accuracyEstimate}%`} accent="from-amber-500/20 to-amber-500/5" />
        <StatCard icon={<BookOpen size={18} />} label="Phrasebook Size" value={stats.phrasebookUsage.toString()} accent="from-fuchsia-500/20 to-fuchsia-500/5" />
        <StatCard icon={<BarChart3 size={18} />} label="Language Pairs" value={stats.langBreakdown.length.toString()} accent="from-sky-500/20 to-sky-500/5" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/5 bg-surface/50 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textSecondary">Language Usage</h3>
          {stats.langBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-textSecondary opacity-50">No translations yet</p>
          ) : (
            <div className="space-y-3">
              {stats.langBreakdown.map(([pair, count]) => (
                <div key={pair}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-textPrimary">{pair.toUpperCase()}</span>
                    <span className="text-xs text-textSecondary">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                      style={{ width: `${(count / stats.maxLangCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/5 bg-surface/50 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-textSecondary">Recent Trend</h3>
          {stats.trend.length === 0 ? (
            <p className="py-8 text-center text-sm text-textSecondary opacity-50">No trend data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.trend.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm text-textPrimary">{point.label}</span>
                    <span className="text-xs text-textSecondary">{(point.value / 1000).toFixed(1)}s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (point.value / Math.max(stats.avgMs || 1, 1)) * 35)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}> = ({ icon, label, value, accent }) => (
  <div className={`rounded-xl border border-white/5 bg-gradient-to-br ${accent} p-4`}>
    <div className="mb-2 text-textSecondary">{icon}</div>
    <p className="text-2xl font-outfit font-bold text-textPrimary">{value}</p>
    <p className="mt-0.5 text-xs text-textSecondary">{label}</p>
  </div>
);
