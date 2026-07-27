"use client";

import { useState, useEffect } from 'react';

export default function WebTTSPage() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);

  // Initialize voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        // Try to find a Khmer voice, otherwise fallback to English, otherwise first available
        const khmerVoice = availableVoices.find(v => v.lang.includes('km'));
        const englishVoice = availableVoices.find(v => v.lang.includes('en'));
        
        if (khmerVoice) {
          setSelectedVoiceURI(khmerVoice.voiceURI);
        } else if (englishVoice) {
          setSelectedVoiceURI(englishVoice.voiceURI);
        } else {
          setSelectedVoiceURI(availableVoices[0].voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!window.speechSynthesis) {
      alert("កម្មវិធីរុករក (Browser) របស់អ្នកមិនគាំទ្រមុខងារអានអក្សរនេះទេ។ សូមប្រើប្រាស់ Google Chrome ឬ Microsoft Edge។");
      return;
    }

    if (!text.trim()) {
      alert("សូមបញ្ចូលអត្ថបទជាមុនសិន!");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set selected voice
    if (selectedVoiceURI) {
      const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error('SpeechSynthesisError', e);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>អានអក្សរ (Web Speech API)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>បំប្លែងអត្ថបទទៅជាសំឡេងប្រើប្រាស់មុខងារឥតគិតថ្លៃរបស់ Browser (Offline) ។</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ជ្រើសរើសសំឡេង (Voice)</label>
            <select 
              className="input-field" 
              value={selectedVoiceURI} 
              onChange={(e) => setSelectedVoiceURI(e.target.value)}
              disabled={voices.length === 0}
            >
              {voices.length === 0 ? (
                <option value="">កំពុងស្វែងរកសំឡេង...</option>
              ) : (
                voices.map((voice, index) => (
                  <option key={index} value={voice.voiceURI}>
                    {voice.name} ({voice.lang}) {voice.default ? ' - លំនាំដើម' : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
              <span>ល្បឿន (Rate)</span>
              <span>{rate.toFixed(1)}x</span>
            </label>
            <input 
              type="range" 
              min="0.5" max="2" step="0.1" 
              value={rate} 
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
              <span>កម្ពស់សំឡេង (Pitch)</span>
              <span>{pitch.toFixed(1)}</span>
            </label>
            <input 
              type="range" 
              min="0" max="2" step="0.1" 
              value={pitch} 
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>អត្ថបទដែលត្រូវអាន</label>
          <textarea 
            className="input-field" 
            placeholder="វាយបញ្ចូលអត្ថបទនៅទីនេះ..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: '200px', resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {!isPlaying ? (
            <button 
              className="btn btn-primary" 
              onClick={handlePlay}
              disabled={!text.trim() || voices.length === 0}
              style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              ចាក់សំឡេង (Play)
            </button>
          ) : (
            <button 
              className="btn" 
              onClick={handleStop}
              style={{ background: '#ef4444', color: 'white', padding: '0.8rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              បញ្ឈប់ (Stop)
            </button>
          )}
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          *ចំណាំ៖ គុណភាពសំឡេង និងចំនួនជម្រើសសំឡេងគឺអាស្រ័យទៅលើកម្មវិធី Browser (Chrome, Edge, Safari) និងកុំព្យូទ័រ/ទូរស័ព្ទដែលអ្នកកំពុងប្រើប្រាស់។
        </div>

      </div>
    </div>
  );
}
