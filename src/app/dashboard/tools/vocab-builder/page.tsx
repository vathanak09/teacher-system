"use client";

import { useState } from 'react';

type VocabItem = {
  word: string;
  pos?: string;
  ipa?: string;
  meaningEn?: string;
  meaningKm?: string;
  synonyms?: string;
  antonyms?: string;
  example?: string;
};

export default function VocabBuilderPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VocabItem[]>([]);
  
  // Options state
  const [options, setOptions] = useState({
    pos: true,
    ipa: true,
    simpleMeaning: true,
    khmerMeaning: true,
    synonyms: false,
    antonyms: false,
    example: true,
    exampleLevel: 'intermediate',
  });

  const handleOptionChange = (field: string, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const generateVocabList = async () => {
    if (!inputText.trim()) {
      alert("សូមបញ្ចូលពាក្យជាមុនសិន!");
      return;
    }

    setIsLoading(true);
    
    // Split by commas or newlines and clean up
    const wordsArray = inputText.split(/[,\n]+/).map(w => w.trim()).filter(w => w.length > 0);

    try {
      const response = await fetch('/api/vocab-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words: wordsArray,
          options,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate vocabulary list');
      }

      setResults(data.data || []);
      
    } catch (error: any) {
      console.error(error);
      alert("មានបញ្ហាក្នុងការបង្កើត៖ " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (word: string, locale: 'en-US' | 'en-GB') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = locale;
      // You can tweak rate and pitch if needed
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("កម្មវិធីរុករក (Browser) របស់អ្នកមិនគាំទ្រមុខងារអានសំឡេងនេះទេ។");
    }
  };

  const copyToClipboard = () => {
    if (results.length === 0) return;

    let textToCopy = "Vocabulary List\n\n";
    results.forEach((item, index) => {
      textToCopy += `${index + 1}. ${item.word}`;
      if (item.pos) textToCopy += ` (${item.pos})`;
      if (item.ipa) textToCopy += ` /${item.ipa}/`;
      textToCopy += "\n";
      
      if (item.meaningKm) textToCopy += `   • ន័យខ្មែរ: ${item.meaningKm}\n`;
      if (item.meaningEn) textToCopy += `   • Meaning: ${item.meaningEn}\n`;
      if (item.synonyms) textToCopy += `   • Synonyms: ${item.synonyms}\n`;
      if (item.antonyms) textToCopy += `   • Antonyms: ${item.antonyms}\n`;
      if (item.example) textToCopy += `   • Example: ${item.example}\n`;
      textToCopy += "\n";
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("បាន Copy ជោគជ័យ!");
    }).catch(err => {
      alert("មិនអាច Copy បានទេ: " + err);
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>បង្កើតបញ្ជីពាក្យ (Vocab Builder)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>បញ្ចួលពាក្យដើម្បីឱ្យ Gemini AI បង្កើតន័យ, IPA និងឧទាហរណ៍ដោយស្វ័យប្រវត្តិ។</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>បញ្ចូលពាក្យឬឃ្លា (Words or Phrases)</label>
          <textarea 
            className="input-field" 
            placeholder="ឧទាហរណ៍៖ apple, banana, car&#10;ឬវាយចុះបន្ទាត់ម្ដងមួយពាក្យក៏បាន..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical' }}
          ></textarea>
        </div>

        <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>ជម្រើសព័ត៌មាន (Options)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.pos} onChange={(e) => handleOptionChange('pos', e.target.checked)} />
              ថ្នាក់ពាក្យ (Part of Speech)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.ipa} onChange={(e) => handleOptionChange('ipa', e.target.checked)} />
              សំឡេងអាន IPA
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.khmerMeaning} onChange={(e) => handleOptionChange('khmerMeaning', e.target.checked)} />
              បកប្រែខ្មែរ (ខ្លីៗ)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.simpleMeaning} onChange={(e) => handleOptionChange('simpleMeaning', e.target.checked)} />
              ពន្យល់ន័យអង់គ្លេស
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.synonyms} onChange={(e) => handleOptionChange('synonyms', e.target.checked)} />
              ពាក្យន័យដូច (Synonyms)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.antonyms} onChange={(e) => handleOptionChange('antonyms', e.target.checked)} />
              ពាក្យផ្ទុយ (Antonyms)
            </label>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={options.example} onChange={(e) => handleOptionChange('example', e.target.checked)} />
              ឧទាហរណ៍ប្រយោគ (Example)
            </label>
            {options.example && (
              <select 
                className="input-field" 
                style={{ padding: '0.4rem', width: 'auto', minWidth: '150px' }}
                value={options.exampleLevel} 
                onChange={(e) => handleOptionChange('exampleLevel', e.target.value)}
              >
                <option value="beginner">កម្រិតងាយ (Beginner)</option>
                <option value="intermediate">កម្រិតមធ្យម (Intermediate)</option>
                <option value="advanced">កម្រិតខ្ពស់ (Advanced)</option>
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={generateVocabList}
            disabled={isLoading || !inputText.trim()}
            style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line></svg>
                កំពុងបង្កើត...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                បង្កើតបញ្ជីពាក្យ (Generate)
              </>
            )}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>លទ្ធផល (Results)</h2>
            <button className="btn" onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-primary)', color: 'white' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy Text
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((item, index) => (
              <div key={index} style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-primary)' }}>{item.word}</h3>
                  {item.pos && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{item.pos}</span>}
                  {item.ipa && <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>/{item.ipa}/</span>}
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                    <button onClick={() => playAudio(item.word, 'en-US')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'white', border: '1px solid var(--border-color)' }}>
                      🔊 US
                    </button>
                    <button onClick={() => playAudio(item.word, 'en-GB')} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'white', border: '1px solid var(--border-color)' }}>
                      🔊 UK
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {item.meaningKm && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, minWidth: '90px' }}>ន័យខ្មែរ៖</span>
                      <span>{item.meaningKm}</span>
                    </div>
                  )}
                  {item.meaningEn && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, minWidth: '90px' }}>Meaning៖</span>
                      <span>{item.meaningEn}</span>
                    </div>
                  )}
                  {item.synonyms && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, minWidth: '90px' }}>Synonyms៖</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.synonyms}</span>
                    </div>
                  )}
                  {item.antonyms && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, minWidth: '90px' }}>Antonyms៖</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.antonyms}</span>
                    </div>
                  )}
                  {item.example && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0.8rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <span style={{ fontStyle: 'italic' }}>"{item.example}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
