import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Languages, Waves, Fish, AlertTriangle, Navigation, MapPin, Send } from 'lucide-react';
import type { AdvisoryMessage, LanguageOption } from '@/types';
import type { VoiceState } from '@/hooks/useVoiceAssistant';
import { LANGUAGES } from '@/data/mockData';

interface ChatPanelProps {
  messages: AdvisoryMessage[];
  voiceState: VoiceState;
  language: string;
  lowDistraction: boolean;
  onLanguageChange: (code: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onQuickAction: (query: string) => void;
  onToggleLowDistraction: () => void;
}

const severityIcon = (action?: AdvisoryMessage['action']) => {
  switch (action) {
    case 'fly-to-pfz':
      return <Fish className="w-4 h-4 text-safe-500" />;
    case 'fly-to-hazard':
      return <AlertTriangle className="w-4 h-4 text-hazard-500" />;
    case 'fly-to-imbl':
      return <AlertTriangle className="w-4 h-4 text-hazard-500" />;
    case 'fly-to-route':
      return <Navigation className="w-4 h-4 text-aqua-400" />;
    case 'fly-to-vessel':
      return <MapPin className="w-4 h-4 text-aqua-400" />;
    default:
      return <Waves className="w-4 h-4 text-ocean-300" />;
  }
};

export default function ChatPanel({
  messages,
  voiceState,
  language,
  lowDistraction,
  onLanguageChange,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onQuickAction,
  onToggleLowDistraction,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isListening = voiceState.status === 'listening';
  const isSpeaking = voiceState.status === 'speaking';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    onQuickAction(trimmedQuery);
    setQuery('');
  };

  const quickActions = [
    { label: 'Fishing Zone', query: 'Show me the nearest fishing zone', icon: Fish },
    { label: 'Weather', query: 'What is the weather and wave condition?', icon: Waves },
    { label: 'IMBL Border', query: 'How far am I from the IMBL border?', icon: AlertTriangle },
    { label: 'Route Home', query: 'Show me the safe route home', icon: Navigation },
  ];

  return (
    <div className="flex flex-col h-full bg-ocean-900 border-r border-ocean-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-ocean-800/80 border-b border-ocean-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-aqua-500/20 flex items-center justify-center">
            <Waves className="w-5 h-5 text-aqua-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ocean-50">ORCA</h1>
            <p className="text-[10px] text-ocean-300">Marine Advisory System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="appearance-none bg-ocean-700/60 text-ocean-100 text-xs font-medium rounded-lg pl-7 pr-7 py-1.5 border border-ocean-600/50 focus:outline-none focus:border-aqua-500/50 cursor-pointer"
            >
              {LANGUAGES.map((lang: LanguageOption) => (
                <option key={lang.code} value={lang.code} className="bg-ocean-800">
                  {lang.label}
                </option>
              ))}
            </select>
            <Languages className="w-3.5 h-3.5 text-aqua-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Low Distraction Toggle */}
          <button
            onClick={onToggleLowDistraction}
            className={`p-1.5 rounded-lg border transition-colors ${
              lowDistraction
                ? 'bg-aqua-500/20 border-aqua-500/50 text-aqua-400'
                : 'bg-ocean-700/60 border-ocean-600/50 text-ocean-300 hover:text-ocean-100'
            }`}
            title="Low Distraction Mode"
          >
            {lowDistraction ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!lowDistraction && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-aqua-500/15 border border-aqua-500/30 text-ocean-50'
                    : 'bg-ocean-800/80 border border-ocean-700/50 text-ocean-100'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    {severityIcon(msg.action)}
                    <span className="text-[10px] font-semibold text-ocean-300 uppercase tracking-wide">Advisory</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-[9px] text-ocean-400 mt-1.5">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {voiceState.status === 'processing' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-ocean-800/80 border border-ocean-700/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-aqua-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Transcript (when listening) */}
      {isListening && voiceState.transcript && (
        <div className="px-4 pb-2">
          <div className="bg-aqua-500/10 border border-aqua-500/30 rounded-xl px-3 py-2">
            <p className="text-xs text-aqua-400 font-medium mb-0.5">Listening...</p>
            <p className="text-sm text-ocean-50">{voiceState.transcript}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!lowDistraction && (
        <div className="px-4 py-2 border-t border-ocean-700/50">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => onQuickAction(action.query)}
                  className="flex items-center gap-2 bg-ocean-800/60 hover:bg-ocean-700/60 border border-ocean-700/50 hover:border-aqua-500/30 rounded-lg px-3 py-2 text-xs text-ocean-200 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-aqua-400" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-ocean-700/50">
        <div className="flex items-center gap-2 rounded-xl bg-ocean-800/80 border border-ocean-700/60 focus-within:border-aqua-500/60 px-2 py-1.5 transition-colors">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask ORCA anything..."
            aria-label="Ask ORCA anything"
            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-ocean-50 placeholder:text-ocean-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            aria-label="Send message"
            title="Send message"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-aqua-500/20 text-aqua-400 transition-colors hover:bg-aqua-500/30 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Voice Controls */}
      <div className="px-4 py-4 bg-ocean-800/60 border-t border-ocean-700/50">
        <div className="flex items-center justify-center gap-4">
          {/* Push to Speak */}
          <button
            onClick={isListening ? onStopListening : onStartListening}
            disabled={!voiceState.supported}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-hazard-500/20 border-2 border-hazard-500 animate-pulse-glow'
                : 'bg-aqua-500/20 border-2 border-aqua-400 animate-pulse-glow hover:scale-105'
            } disabled:opacity-30 disabled:cursor-not-allowed disabled:animate-none`}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-hazard-500 animate-pulse-ring" />
            )}
            {isListening ? (
              <MicOff className="w-7 h-7 text-hazard-500" />
            ) : (
              <Mic className="w-7 h-7 text-aqua-400" />
            )}
          </button>

          {/* Stop Speaking */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-2 bg-ocean-700/60 hover:bg-ocean-600/60 border border-ocean-600/50 rounded-lg px-3 py-2 text-xs text-ocean-100 transition-colors"
            >
              <VolumeX className="w-4 h-4 text-aqua-400" />
              Stop Audio
            </button>
          )}
        </div>

        {!voiceState.supported && (
          <p className="text-center text-[10px] text-hazard-400 mt-2">
            Voice not supported. Use text quick actions below.
          </p>
        )}
        {voiceState.error && voiceState.supported && (
          <p className="text-center text-[10px] text-hazard-400 mt-2">{voiceState.error}</p>
        )}
        <p className="text-center text-[10px] text-ocean-400 mt-2">
          {isListening ? 'Tap to stop' : 'Push to Speak'}
        </p>
      </div>
    </div>
  );
}
