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

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function listen() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setListening(true);
      setStatus('Listening… speak your answer.');
    };
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      const next = spokenValue(transcript, type, options);
      if (!next) {
        setStatus(type === 'select' ? `I heard “${transcript}.” Please say one of the listed choices.` : `I heard “${transcript},” but could not format it. Please try again or type the answer.`);
        return;
      }
      setValue(current => type === 'textarea' && current ? `${current.trim()} ${next}` : next);
      setStatus(`Added “${next}.” Please review it before saving.`);
    };
    recognition.onerror = event => {
      const messages: Record<string, string> = {
        'not-allowed': 'Microphone access was not allowed. Enable it in your browser settings and try again.',
        'audio-capture': 'No microphone was found on this device.',
        'no-speech': 'I did not hear an answer. Please try again.',
      };
      setStatus(messages[event.error] || 'Voice entry could not start. Please try again or type the answer.');
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
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
      {supported && <button className={`voice-field-button${listening ? ' is-listening' : ''}`} type="button" onClick={listen} aria-label={`${listening ? 'Stop listening for' : 'Speak answer for'} ${label}`} title={`${listening ? 'Stop listening' : 'Speak this answer'}`}>{listening ? <Square size={17} aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}<span>{listening ? 'Stop' : 'Speak'}</span></button>}
    </div>
    {status && <small className="voice-field-status" aria-live="polite">{status}</small>}
  </div>;
}
