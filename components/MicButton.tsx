"use client";

// The 🎤 button. Uses the browser's built-in speech-to-text (free, works in
// Chrome and Edge). If the browser can't do it, the button doesn't appear.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// The browser's speech feature isn't in TypeScript's built-in types,
// so we describe the small part we use.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  speechLang: string; // e.g. "hi-IN"
  label: string;
  listeningLabel: string;
  onText: (text: string) => void;
};

export default function MicButton({ speechLang, label, listeningLabel, onText }: Props) {
  // "false" while the server builds the page (no browser there), then the real answer.
  const supported = useSyncExternalStore(
    noSubscribe,
    () => getRecognitionClass() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  // Stop listening if the button disappears.
  useEffect(() => () => recognitionRef.current?.stop(), []);

  if (!supported) return null;

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const RecognitionClass = getRecognitionClass();
    if (!RecognitionClass) return;
    const recognition = new RecognitionClass();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) onText(event.results[i][0].transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
        listening ? "border-red-400 bg-red-50 text-red-700" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
      }`}
    >
      {listening ? listeningLabel : label}
    </button>
  );
}
