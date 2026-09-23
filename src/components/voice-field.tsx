'use client';

import { Mic, Square } from 'lucide-react';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

type FieldType = 'text' | 'date' | 'time' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
type SpeechResultEvent = { results: ArrayLike<{ 0: { transcript: string } }> };
type SpeechErrorEvent = { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function subscribeToBrowserSupport() {
  return () => undefined;
}

function browserSupportsSpeech() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function spokenValue(transcript: string, type: FieldType, options: string[]) {
  const heard = transcript.trim();
  if (type === 'select') {
    const normalized = normalize(heard);
    return options.find(option => {
      const candidate = normalize(option);
      return candidate === normalized || candidate.includes(normalized) || normalized.includes(candidate);
    }) || '';
  }
  if (type === 'email') {
    return heard.toLowerCase().replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s/g, '');
  }
  if (type === 'tel') {
    const phone = heard.replace(/[^\d+]/g, '');
    return phone || heard;
  }
  if (type === 'number') {
    return heard.replace(/[^\d.-]/g, '');
  }
  if (type === 'date') {
    const parsed = new Date(heard);
    return Number.isNaN(parsed.getTime()) ? '' : `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  if (type === 'time') {
    const match = heard.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
    if (!match) return '';
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const period = match[3]?.toLowerCase()[0];
    if (period === 'p' && hour < 12) hour += 12;
    if (period === 'a' && hour === 12) hour = 0;
    return hour < 24 && minute < 60 ? `${pad(hour)}:${pad(minute)}` : '';
  }
  return heard;
}

export function VoiceField({
  name,
  label,
  type = 'text',
  options = [],
  required = false,
  defaultValue = '',
}: {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  required?: boolean;
  defaultValue?: string;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const supported = useSyncExternalStore(subscribeToBrowserSupport, browserSupportsSpeech, () => false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('');
  const recognitionRef = useRef<Recognition | null>(null);
  const keepListeningRef = useRef(false);
  const baseValueRef = useRef('');
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maximumTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (maximumTimerRef.current) clearTimeout(maximumTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  function clearTimers() {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (maximumTimerRef.current) clearTimeout(maximumTimerRef.current);
    inactivityTimerRef.current = null;
    maximumTimerRef.current = null;
  }

  function finish(message = 'Voice entry finished. Please review your answer before saving.') {
    keepListeningRef.current = false;
    clearTimers();
    recognitionRef.current?.stop();
    setListening(false);
    setStatus(message);
  }

  function resetInactivityTimer() {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => finish('The microphone closed after 15 seconds of silence. Please review your answer or tap Speak to continue.'), 15_000);
  }

  function listen() {
    if (listening) {
      finish();
      return;
    }
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setStatus('Listening… keep speaking through short pauses, then tap Done.');
      if (!inactivityTimerRef.current) resetInactivityTimer();
    };
    recognition.onresult = event => {
      resetInactivityTimer();
      const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim();
      const next = spokenValue(transcript, type, options);
      if (!next) {
        setStatus(type === 'select' ? `I heard “${transcript}.” Keep speaking or say one of the listed choices.` : `Listening… keep speaking, then tap Done.`);
        return;
      }
      setValue(type === 'textarea' && baseValueRef.current ? `${baseValueRef.current.trim()} ${next}` : next);
      setStatus(`Heard “${next}.” Keep speaking or tap Done.`);
    };
    recognition.onerror = event => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access was not allowed. Enable it in your browser settings and try again.',
        'audio-capture': 'No microphone was found on this device.',
      };
      if (event.error === 'no-speech' && keepListeningRef.current) return;
      keepListeningRef.current = false;
      clearTimers();
      setListening(false);
      setStatus(messages[event.error] || 'Voice entry could not continue. Please try again or type the answer.');
    };
    recognition.onend = () => {
      if (!keepListeningRef.current) {
        setListening(false);
        return;
      }
      setTimeout(() => {
        if (!keepListeningRef.current) return;
        try {
          recognition.start();
        } catch {
          finish('Voice entry stopped. Please review your answer or tap Speak to continue.');
        }
      }, 150);
    };
    baseValueRef.current = value;
    keepListeningRef.current = true;
    recognitionRef.current = recognition;
    maximumTimerRef.current = setTimeout(() => finish('The microphone closed after two minutes. Please review your answer or tap Speak to continue.'), 120_000);
    try {
      recognition.start();
    } catch {
      finish('Voice entry could not start. Please try again or type the answer.');
    }
  }

  const control = type === 'select'
    ? <select id={id} name={name} required={required} value={value} onChange={event => setValue(event.target.value)}><option value="">Select</option>{options.map(option => <option key={option}>{option}</option>)}</select>
    : type === 'textarea'
      ? <textarea id={id} name={name} required={required} rows={4} value={value} onChange={event => setValue(event.target.value)} />
      : <input id={id} name={name} required={required} type={type} value={value} onChange={event => setValue(event.target.value)} />;

  return <div className="voice-field">
    <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
    <div className="voice-input-row">
      {control}
      {supported && <button className={`voice-field-button${listening ? ' is-listening' : ''}`} type="button" onClick={listen} aria-label={`${listening ? 'Finish speaking for' : 'Speak answer for'} ${label}`} title={`${listening ? 'Finish voice entry' : 'Speak this answer'}`}>{listening ? <Square size={17} aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}<span>{listening ? 'Done' : 'Speak'}</span></button>}
    </div>
    {status && <small className="voice-field-status" aria-live="polite">{status}</small>}
  </div>;
}
