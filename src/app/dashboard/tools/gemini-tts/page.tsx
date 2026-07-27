"use client";

import { useState, useRef, useEffect } from 'react';

export default function GeminiTTSPage() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Voice settings
  const [voiceName, setVoiceName] = useState('Aoede'); 
  const [modelName, setModelName] = useState('gemini-2.5-flash-preview-tts');
  const [speed, setSpeed] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Apply speed when audio URL or speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [audioUrl, speed]);

  // Clean up Object URL when unmounting or when audioUrl changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const generateSpeech = async () => {
    if (!text.trim()) {
      alert("សូមបញ្ចូលអត្ថបទជាមុនសិន!");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/gemini-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceName,
          modelName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      // Convert base64 to blob
      const binaryString = window.atob(data.audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const mimeType = data.mimeType || 'audio/wav';
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
        setTimeout(() => audioRef.current?.play(), 100);
      }
      
    } catch (error: any) {
      console.error(error);
      alert("មានបញ្ហាក្នុងការបង្កើតសំឡេង៖ " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>អានអក្សរ (Gemini AI Voice)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>បំប្លែងអត្ថបទទៅជាសំឡេងដ៏រស់រវើក ប្រើប្រាស់បច្ចេកវិទ្យា Gemini AI របស់ Google ។</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ជ្រើសរើសម៉ូដែល (Model)</label>
            <select className="input-field" value={modelName} onChange={(e) => setModelName(e.target.value)}>
              <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash TTS (ណែនាំ & លំនាំដើម)</option>
              <option value="gemini-3.1-flash-tts-preview">Gemini 3.1 Flash TTS (សាកល្បងថ្មី)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ជ្រើសរើសទឹកដមសំឡេង (Voice)</label>
            <select className="input-field" value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
              <option value="Aoede">សំឡេង Aoede (ស្រី - ស្រទន់និងច្បាស់)</option>
              <option value="Puck">សំឡេង Puck (ប្រុស - រស់រវើកនិងកក់ក្ដៅ)</option>
              <option value="Charon">សំឡេង Charon (ប្រុស - ធ្ងន់និងមានអំណាច)</option>
              <option value="Kore">សំឡេង Kore (ស្រី - ស្រស់ស្រាយនិងក្មេងខ្ចី)</option>
              <option value="Fenrir">សំឡេង Fenrir (ប្រុស - រាងក្រាស់និងទាក់ទាញ)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ល្បឿន (Speed)</label>
            <select className="input-field" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}>
              <option value="0.5">០.៥x (យឺតខ្លាំង)</option>
              <option value="0.75">០.៧៥x (យឺតបន្តិច)</option>
              <option value="1">១.០x (ធម្មតា)</option>
              <option value="1.25">១.២៥x (លឿនបន្តិច)</option>
              <option value="1.5">១.៥x (លឿន)</option>
              <option value="2">២.០x (លឿនខ្លាំង)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>អត្ថបទដែលត្រូវអាន</label>
          <textarea 
            className="input-field" 
            placeholder="វាយបញ្ចូលអត្ថបទនៅទីនេះ (គាំទ្រទាំងខ្មែរ និងអង់គ្លេស)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: '200px', resize: 'vertical' }}
          ></textarea>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            តួអក្សរ៖ {text.length}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={generateSpeech}
            disabled={isLoading || !text.trim()}
            style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
                កំពុងបង្កើតសំឡេង...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                បង្កើតសំឡេង (Generate Speech)
              </>
            )}
          </button>
        </div>

        {audioUrl && (
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>លទ្ធផលសំឡេង (Gemini Audio)</h3>
            <audio ref={audioRef} controls src={audioUrl} style={{ width: '100%' }} />
            
            <a 
              href={audioUrl} 
              download={`gemini_audio_${Date.now()}.wav`}
              className="btn"
              style={{ background: 'var(--accent-primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              ទាញយកសំឡេង
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
