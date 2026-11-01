// Voice input through the browser's speech recognition. No key, no server: the words
// go into the text box, and the same intent pipeline handles them as typed text.
import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onText: (text: string) => void) {
  const supported = typeof window !== "undefined" && getCtor() !== null;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<RecognitionLike | null>(null);

  useEffect(() => () => rec.current?.stop(), []);

  const toggle = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Voice input is not supported in this browser. Type your message instead.");
      return;
    }
    if (listening) {
      rec.current?.stop();
      return;
    }
    setError(null);
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onText(transcript);
    };
    r.onerror = (e) => setError(e.error === "not-allowed" ? "Microphone access was blocked." : `Voice input stopped: ${e.error}.`);
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }, [listening, onText]);

  return { supported, listening, error, toggle };
}
