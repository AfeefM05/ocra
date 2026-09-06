import { useState } from 'react';
import { ChevronUp, ChevronDown, Mic, MicOff, VolumeX, Languages } from 'lucide-react';
import type { AdvisoryMessage, LanguageOption } from '@/types';
import type { VoiceState } from '@/hooks/useVoiceAssistant';
import { LANGUAGES } from '@/data/mockData';
import { Fish, Waves, AlertTriangle, Navigation } from 'lucide-react';

interface MobileDrawerProps {
  messages: AdvisoryMessage[];
  voiceState: VoiceState;
  language: string;
  onLanguageChange: (code: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onQuickAction: (query: string) => void;
}

type DrawerState = 'collapsed' | 'half' | 'full';

export default function MobileDrawer({
  messages,
  voiceState,
  language,
  onLanguageChange,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onQuickAction,
}: MobileDrawerProps) {
  const [drawerState, setDrawerState] = useState<DrawerState>('half');

  const isListening = voiceState.status === 'listening';
  const isSpeaking = voiceState.status === 'speaking';

  const cycleDrawer = () => {
    setDrawerState((prev) => {
      if (prev === 'collapsed') return 'half';
      if (prev === 'half') return 'full';
      return 'collapsed';
    });
  };

  const maxHeight =
    drawerState === 'collapsed' ? '72px' : drawerState === 'half' ? '45vh' : '85vh';

  const quickActions = [
    { label: 'Fish', query: 'Show me the nearest fishing zone', icon: Fish },
    { label: 'Weather', query: 'What is the weather and wave condition?', icon: Waves },
    { label: 'Border', query: 'How far am I from the IMBL border?', icon: AlertTriangle },
    { label: 'Home', query: 'Show me the safe route home', icon: Navigation },
  ];

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-ocean-900/95 backdrop-blur-lg border-t border-aqua-500/30 rounded-t-2xl shadow-2xl transition-all duration-300 ease-out z-[1000]"
      style={{ maxHeight, height: maxHeight }}
    >
      {/* Drag Handle */}
      <button
        onClick={cycleDrawer}
        className="w-full flex items-center justify-center py-2 cursor-pointer"
      >
        <div className="w-10 h-1 bg-ocean-600 rounded-full mb-1" />
      </button>

      {/* Top Row: Handle + Controls */}
      <div className="flex items-center justify-between px-4 pb-2">
        <button
          onClick={cycleDrawer}
          className="flex items-center gap-1 text-ocean-300 hover:text-ocean-100"
        >
          {drawerState === 'full' ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          <span className="text-xs font-medium">
            {drawerState === 'collapsed' ? 'Expand' : drawerState === 'half' ? 'Full' : 'Collapse'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="appearance-none bg-ocean-700/60 text-ocean-100 text-xs font-medium rounded-lg pl-7 pr-6 py-1.5 border border-ocean-600/50 focus:outline-none focus:border-aqua-500/50 cursor-pointer"
            >
              {LANGUAGES.map((lang: LanguageOption) => (
                <option key={lang.code} value={lang.code} className="bg-ocean-800">
                  {lang.label}
                </option>
              ))}
            </select>
            <Languages className="w-3.5 h-3.5 text-aqua-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Collapsed View: Just last message + mic */}
      {drawerState === 'collapsed' && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={isListening ? onStopListening : onStartListening}
              disabled={!voiceState.supported}
              className={`relative w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-hazard-500/20 border-2 border-hazard-500 animate-pulse-glow'
                  : 'bg-aqua-500/20 border-2 border-aqua-400 animate-pulse-glow'
              } disabled:opacity-30 disabled:animate-none`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-hazard-500" />
              ) : (
                <Mic className="w-5 h-5 text-aqua-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              {lastAssistant ? (
                <p className="text-xs text-ocean-100 truncate">{lastAssistant.content}</p>
              ) : (
                <p className="text-xs text-ocean-400">Tap mic to speak</p>
              )}
              {isSpeaking && (
                <button
                  onClick={onStopSpeaking}
                  className="flex items-center gap-1 text-[10px] text-aqua-400 mt-0.5"
                >
                  <VolumeX className="w-3 h-3" /> Stop audio
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Half / Full View */}
      {drawerState !== 'collapsed' && (
        <div className="flex flex-col h-[calc(100%-52px)] overflow-hidden">
          {/* Quick Actions */}
          <div className="px-4 py-2">
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => onQuickAction(action.query)}
                    className="flex flex-col items-center gap-1 bg-ocean-800/60 hover:bg-ocean-700/60 border border-ocean-700/50 hover:border-aqua-500/30 rounded-lg py-2 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-aqua-400" />
                    <span className="text-[10px] text-ocean-200">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-aqua-500/15 border border-aqua-500/30 text-ocean-50'
                      : 'bg-ocean-800/80 border border-ocean-700/50 text-ocean-100'
                  }`}
                >
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                  <p className="text-[9px] text-ocean-400 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {voiceState.status === 'processing' && (
              <div className="flex justify-start">
                <div className="bg-ocean-800/80 border border-ocean-700/50 rounded-2xl px-3 py-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="px-4 py-3 border-t border-ocean-700/50">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isListening ? onStopListening : onStartListening}
                disabled={!voiceState.supported}
                className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-hazard-500/20 border-2 border-hazard-500 animate-pulse-glow'
                    : 'bg-aqua-500/20 border-2 border-aqua-400 animate-pulse-glow hover:scale-105'
                } disabled:opacity-30 disabled:animate-none`}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-2 border-hazard-500 animate-pulse-ring" />
                )}
                {isListening ? (
                  <MicOff className="w-6 h-6 text-hazard-500" />
                ) : (
                  <Mic className="w-6 h-6 text-aqua-400" />
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={onStopSpeaking}
                  className="flex items-center gap-1.5 bg-ocean-700/60 hover:bg-ocean-600/60 border border-ocean-600/50 rounded-lg px-3 py-2 text-xs text-ocean-100"
                >
                  <VolumeX className="w-4 h-4 text-aqua-400" />
                  Stop
                </button>
              )}
            </div>
            {isListening && voiceState.transcript && (
              <p className="text-center text-xs text-aqua-400 mt-2">{voiceState.transcript}</p>
            )}
            {!voiceState.supported && (
              <p className="text-center text-[10px] text-hazard-400 mt-2">Voice not supported in this browser</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
