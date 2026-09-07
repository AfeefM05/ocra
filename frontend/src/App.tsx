import { useCallback, useEffect, useState } from 'react';
import OceanMap from '@/components/OceanMap';
import ChatPanel from '@/components/ChatPanel';
import AlertPanel from '@/components/AlertPanel';
import MobileDrawer from '@/components/MobileDrawer';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import {
  getWelcomeMessage,
  createUserMessage,
  processUserQuery,
} from '@/services/advisoryEngine';
import {
  sendAgentQuery,
  checkBackendHealth,
  getCentroidFromGeoJson,
} from '@/services/api';
import { VESSEL_POSITION } from '@/data/mockData';
import type { AdvisoryMessage, LatLng } from '@/types';
import { MapPin, Cpu } from 'lucide-react';

const STORAGE_KEY = 'ocean-clear-chat-history';

export default function App() {
  const [language, setLanguage] = useState('en-IN');
  const [messages, setMessages] = useState<AdvisoryMessage[]>([]);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [activeFeature, setActiveFeature] = useState<any | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [lowDistraction, setLowDistraction] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const voice = useVoiceAssistant(language);

  // Check backend health on initial load
  useEffect(() => {
    checkBackendHealth().then((isHealthy) => {
      setBackendConnected(isHealthy);
    });
  }, []);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AdvisoryMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setMessages([getWelcomeMessage()]);
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
      } catch {
        // ignore quota errors
      }
    }
  }, [messages]);

  const handleQuery = useCallback(
    async (query: string) => {
      const userMsg = createUserMessage(query);
      setMessages((prev) => [...prev, userMsg]);

      // Call the LangGraph multi-agent FastAPI backend
      const backendResult = await sendAgentQuery(
        query,
        VESSEL_POSITION.lat,
        VESSEL_POSITION.lng,
      );

      if (backendResult && backendResult.advisory) {
        setBackendConnected(true);
        const dynamicFeature = backendResult.map_data;
        const centroid = getCentroidFromGeoJson(dynamicFeature);

        const isHazard =
          dynamicFeature?.properties?.status === 'DANGER' ||
          (dynamicFeature?.properties?.wave_height_m ?? 0) > 2.5;

        const agentMsg: AdvisoryMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          role: 'assistant',
          content: backendResult.advisory,
          timestamp: new Date().toISOString(),
          targetZone: dynamicFeature?.properties?.zone_id,
          targetCoordinates: centroid || undefined,
          action: isHazard ? 'fly-to-hazard' : 'fly-to-pfz',
          dynamicFeature: dynamicFeature,
        };

        setMessages((prev) => [...prev, agentMsg]);

        if (dynamicFeature) {
          setActiveFeature(dynamicFeature);
        }
        if (centroid) {
          setFlyTarget(centroid);
        }

        if (!lowDistraction) {
          voice.speak(backendResult.advisory);
        }
      } else {
        // Fallback to local rule engine if backend is offline
        setBackendConnected(false);
        const response = processUserQuery(query);
        setMessages((prev) => [...prev, response]);

        if (response.targetCoordinates) {
          setFlyTarget(response.targetCoordinates);
        }

        if (!lowDistraction) {
          voice.speak(response.content);
        }
      }
    },
    [voice, lowDistraction],
  );

  const handleStartListening = useCallback(() => {
    voice.startListening();
  }, [voice]);

  const handleStopListening = useCallback(() => {
    voice.stopListening();
    if (voice.state.transcript) {
      handleQuery(voice.state.transcript);
    }
  }, [voice, handleQuery]);

  const handleQuickAction = useCallback(
    (query: string) => {
      handleQuery(query);
    },
    [handleQuery],
  );

  const handleLanguageChange = useCallback((code: string) => {
    setLanguage(code);
  }, []);

  const handleToggleLowDistraction = useCallback(() => {
    setLowDistraction((prev) => !prev);
    if (voice.state.status === 'speaking') {
      voice.stopSpeaking();
    }
  }, [voice]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-ocean-950">
        {/* Fullscreen Map */}
        <div className="absolute inset-0">
          <OceanMap flyTarget={flyTarget} activeFeature={activeFeature} />
        </div>

        {/* Alert Panel overlay */}
        <div className="absolute top-3 left-3 right-3 z-[500]">
          <AlertPanel />
        </div>

        {/* Status bar */}
        <div className="absolute top-2 right-3 z-[500] flex items-center gap-2">
          {backendConnected && (
            <div className="flex items-center gap-1 bg-emerald-900/80 backdrop-blur-md border border-emerald-500/40 rounded-lg px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
              <Cpu className="w-2.5 h-2.5 text-emerald-400" />
              <span>LangGraph</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-ocean-900/80 backdrop-blur-md border border-ocean-700/50 rounded-lg px-2.5 py-1">
            <MapPin className="w-3 h-3 text-aqua-400" />
            <span className="text-[10px] text-ocean-100 font-medium">9.288°N, 79.313°E</span>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer
          messages={messages}
          voiceState={voice.state}
          language={language}
          onLanguageChange={handleLanguageChange}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onStopSpeaking={voice.stopSpeaking}
          onQuickAction={handleQuickAction}
        />
      </div>
    );
  }

  // Desktop / Tablet layout
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ocean-950">
      {/* Left Sidebar: Chat */}
      <aside className="w-[360px] min-w-[340px] max-w-[440px] flex-shrink-0 lg:w-[30%]">
        <ChatPanel
          messages={messages}
          voiceState={voice.state}
          language={language}
          lowDistraction={lowDistraction}
          onLanguageChange={handleLanguageChange}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onStopSpeaking={voice.stopSpeaking}
          onQuickAction={handleQuickAction}
          onToggleLowDistraction={handleToggleLowDistraction}
        />
      </aside>

      {/* Right Pane: Map (70%) */}
      <div className="flex-1 relative">
        <OceanMap flyTarget={flyTarget} activeFeature={activeFeature} />

        {/* Alert Panel overlay */}
        <div className="absolute top-4 right-4 z-[500] w-80 max-w-[calc(100%-2rem)]">
          <AlertPanel />
        </div>

        {/* Status bar */}
        <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-3">
          <div className="flex items-center gap-2 bg-ocean-900/85 backdrop-blur-md border border-ocean-700/50 rounded-lg px-3 py-1.5 shadow-lg">
            <MapPin className="w-3.5 h-3.5 text-aqua-400" />
            <span className="text-xs text-ocean-100 font-medium">Rameswaram · 9.288°N, 79.313°E</span>
          </div>

          {backendConnected ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/85 backdrop-blur-md border border-emerald-500/50 rounded-lg px-3 py-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">LangGraph Agent: Online</span>
            </div>
          ) : backendConnected === false ? (
            <div className="flex items-center gap-1.5 bg-amber-950/85 backdrop-blur-md border border-amber-500/50 rounded-lg px-3 py-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300 font-medium">Local Engine Mode</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
