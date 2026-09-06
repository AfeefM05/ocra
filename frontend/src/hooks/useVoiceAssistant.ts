import { useCallback, useEffect, useRef, useState } from 'react';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  error: string | null;
  supported: boolean;
}

/**
 * useVoiceAssistant — isolated voice I/O hook.
 *
 * Currently uses the browser's built-in Web Speech API for speech recognition
 * and speech synthesis. The adapter architecture allows swapping in the
 * Bhashini REST API later by replacing only the internal implementation
 * without changing the public interface.
 */
export function useVoiceAssistant(language: string) {
  const [state, setState] = useState<VoiceState>({
    status: 'idle',
    transcript: '',
    error: null,
    supported: false,
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState((s) => ({ ...s, status: 'listening', error: null }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setState((s) => ({ ...s, transcript: text }));

        if (event.results[event.results.length - 1].isFinal) {
          setState((s) => ({ ...s, status: 'processing' }));
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setState((s) => ({
          ...s,
          status: 'error',
          error: event.error || 'Speech recognition error',
        }));
      };

      recognition.onend = () => {
        setState((s) => {
          if (s.status === 'listening') {
            return { ...s, status: 'idle' };
          }
          return s;
        });
      };

      recognitionRef.current = recognition;
      synthRef.current = window.speechSynthesis;
      setState((s) => ({ ...s, supported: true }));
    } else {
      setState((s) => ({ ...s, supported: false, error: 'Voice not supported in this browser' }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setState((s) => ({ ...s, transcript: '', error: null, status: 'listening' }));
    try {
      recognitionRef.current.start();
    } catch {
      // Already started — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setState((s) => ({ ...s, status: 'idle' }));
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!synthRef.current) return;
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setState((s) => ({ ...s, status: 'speaking' }));
      };

      utterance.onend = () => {
        setState((s) => ({ ...s, status: 'idle' }));
      };

      utterance.onerror = () => {
        setState((s) => ({ ...s, status: 'idle' }));
      };

      synthRef.current.speak(utterance);
    },
    [language],
  );

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setState((s) => ({ ...s, status: 'idle' }));
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', transcript: '', error: null, supported: state.supported });
  }, [state.supported]);

  return {
    state,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    reset,
  };
}
