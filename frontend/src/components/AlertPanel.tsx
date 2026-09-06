import { Waves, AlertTriangle, Fish, Wind, Eye, Thermometer, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Alert, SeaCondition } from '@/types';
import { ACTIVE_ALERTS, SEA_CONDITIONS } from '@/data/mockData';
import { useState } from 'react';

const severityConfig = {
  safe: {
    bg: 'bg-safe-500/10',
    border: 'border-safe-500/40',
    text: 'text-safe-500',
    icon: CheckCircle2,
  },
  moderate: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    icon: AlertTriangle,
  },
  high: {
    bg: 'bg-hazard-500/10',
    border: 'border-hazard-500/40',
    text: 'text-hazard-400',
    icon: AlertTriangle,
  },
  extreme: {
    bg: 'bg-hazard-500/20',
    border: 'border-hazard-500/60',
    text: 'text-hazard-500',
    icon: AlertTriangle,
  },
};

const alertIconMap: Record<string, typeof Waves> = {
  waves: Waves,
  'alert-triangle': AlertTriangle,
  fish: Fish,
};

export default function AlertPanel() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-ocean-900/90 backdrop-blur-md border border-ocean-700/50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-ocean-800/80 hover:bg-ocean-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-hazard-400" />
          <span className="text-xs font-semibold text-ocean-50">Active Alerts</span>
          <span className="bg-hazard-500/20 text-hazard-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {ACTIVE_ALERTS.filter((a) => a.severity !== 'safe').length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-ocean-300" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ocean-300" />
        )}
      </button>

      {/* Alert Items */}
      {expanded && (
        <div className="p-3 space-y-2 animate-fade-in">
          {ACTIVE_ALERTS.map((alert: Alert) => {
            const config = severityConfig[alert.severity];
            const Icon = alertIconMap[alert.icon] || AlertTriangle;
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-2.5 ${config.bg} ${config.border} border rounded-lg p-2.5`}
              >
                <Icon className={`w-4 h-4 ${config.text} flex-shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${config.text}`}>{alert.title}</p>
                  <p className="text-[11px] text-ocean-200 leading-snug">{alert.description}</p>
                  {alert.zone && (
                    <p className="text-[9px] text-ocean-400 mt-0.5">{alert.zone}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sea Conditions */}
      {expanded && (
        <div className="px-3 pb-3 animate-fade-in">
          <div className="border-t border-ocean-700/50 pt-2.5">
            <p className="text-[10px] font-semibold text-ocean-300 uppercase tracking-wide mb-2">Sea Conditions</p>
            <div className="grid grid-cols-2 gap-2">
              <SeaStat icon={Waves} label="Waves" value={`${SEA_CONDITIONS.waveHeight}m`} />
              <SeaStat icon={Wind} label="Wind" value={`${SEA_CONDITIONS.windSpeed} km/h`} />
              <SeaStat icon={Eye} label="Visibility" value={`${SEA_CONDITIONS.visibility} km`} />
              <SeaStat icon={Thermometer} label="SST" value={`${SEA_CONDITIONS.temperature}°C`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeaStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-ocean-800/50 rounded-lg px-2 py-1.5">
      <Icon className="w-3 h-3 text-aqua-400" />
      <div>
        <p className="text-[9px] text-ocean-400">{label}</p>
        <p className="text-[11px] text-ocean-100 font-medium">{value}</p>
      </div>
    </div>
  );
}
