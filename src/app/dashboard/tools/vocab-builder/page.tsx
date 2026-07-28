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
  examples?: string[];
};

export default function VocabBuilderPage() {
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VocabItem[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  
  // Options state
  const [modelName, setModelName] = useState('gemini-3.5-flash');
  const [options, setOptions] = useState({
    pos: true,
    ipa: true,
    simpleMeaning: true,
    khmerMeaning: true,
    synonyms: false,
    antonyms: false,
    example: true,
    exampleLevel: 'beginner',
    exampleCount: 1,
    extractHighlighted: false,
    extractDifficult: false,
    difficultLevel: 'beginner',
    imageCustomPrompt: '',
  });

  const handleOptionChange = (field: string, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBase64Image = async (file: File): Promise<{mimeType: string, base64: string}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ mimeType: file.type, base64 });
      };
      reader.onerror = error => reject(error);
    });
  };

  const generateVocabList = async () => {
    if (activeTab === 'text' && !inputText.trim()) {
      alert("សូមបញ្ចូលពាក្យឬឃ្លាជាមុនសិន!");
      return;
    }
    if (activeTab === 'image' && !imageFile) {
      alert("សូមអាប់ឡូតរូបភាពជាមុនសិន!");
      return;
    }

    setIsLoading(true);
    
    // Split by commas or newlines and clean up
    const wordsArray = activeTab === 'text' ? inputText.split(/[,\n]+/).map(w => w.trim()).filter(w => w.length > 0) : [];

    try {
      let imagePayload = null;
      if (activeTab === 'image' && imageFile) {
        imagePayload = await getBase64Image(imageFile);
      }

      const response = await fetch('/api/vocab-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words: wordsArray,
          options,
          modelName,
          image: imagePayload
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

  const generatePromptText = () => {
    let wordListStr = activeTab === 'text' ? inputText.trim() : "(None, extract from image only)";
    let imageInstruction = "";
    if (activeTab === 'image' && imageFile) {
      imageInstruction = `\nI have provided an image containing text. \nPlease extract words from the image based on the following rules:\n`;
      if (options.extractHighlighted) {
        imageInstruction += "- Extract words that are highlighted, underlined, or circled in the image.\n";
      }
      if (options.extractDifficult) {
        imageInstruction += `- Extract words that are considered "difficult" for a ${options.difficultLevel} English learner.\n`;
      }
      if (!options.extractHighlighted && !options.extractDifficult) {
        imageInstruction += "- Extract all distinct, important vocabulary words from the image.\n";
      }
      if (options.imageCustomPrompt) {
        imageInstruction += `- Additional instructions for image extraction: ${options.imageCustomPrompt}\n`;
      }
      imageInstruction += "\nThen, for all extracted words (and any words provided in the list below), generate the required vocabulary details.\n\n";
    }

    return `You are an expert English teacher. ${imageInstruction}
I will give you a list of words or phrases.
For each word/phrase, please provide the following details based on the user's requested options.
IMPORTANT: If a word has parentheses next to it (e.g., "bank (2 meanings)" or "apple (fruit)"), pay close attention to that context or instruction when generating meanings and examples.

List of words: ${wordListStr}

Requested options:
- Part of Speech: ${options.pos ? 'Yes' : 'No'}
- IPA Pronunciation (US): ${options.ipa ? 'Yes' : 'No'}
- Simple English Meaning: ${options.simpleMeaning ? 'Yes' : 'No'}
- Khmer Translation/Meaning: ${options.khmerMeaning ? 'Yes (Short and easy to understand)' : 'No'}
- Synonyms: ${options.synonyms ? 'Yes (comma separated)' : 'No'}
- Antonyms: ${options.antonyms ? 'Yes (comma separated)' : 'No'}
- Examples: ${options.example ? `Yes, provide exactly ${options.exampleCount || 1} example sentence(s) at a ${options.exampleLevel} level.` : 'No'}

Return ONLY a JSON array of objects, where each object represents a word and contains the requested fields. Use exact keys: "word", "pos", "ipa", "meaningEn", "meaningKm", "synonyms", "antonyms", "examples".
Note: "examples" MUST be an array of strings (e.g., ["Example 1", "Example 2"]).
If a requested field doesn't make sense or isn't requested, omit it or leave it empty.
Make sure the Khmer translation is very short, concise, and easy to understand.`;
  };

  const copyPrompt = () => {
    const prompt = generatePromptText();
    navigator.clipboard.writeText(prompt).then(() => {
      alert("បាន Copy Prompt ជោគជ័យ! លោកអ្នកអាច Paste វាចូល ChatGPT ឬ Gemini បាន។");
    }).catch(err => {
      alert("មិនអាច Copy បានទេ: " + err);
    });
  };

  const playAudio = (word: string, locale: 'en-US' | 'en-GB') => {
    const cleanWord = word.replace(/\(.*?\)/g, '').trim();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(cleanWord);
      utterance.lang = locale;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("កម្មវិធីរុករក (Browser) របស់អ្នកមិនគាំទ្រមុខងារអានសំឡេងនេះទេ។");
    }
  };

  const copyToClipboard = () => {
    if (results.length === 0) return;

    let textToCopy = "";
    results.forEach((item, index) => {
      const cleanWord = item.word.replace(/\(.*?\)/g, '').trim();
      textToCopy += `${index + 1}. ${cleanWord}`;
      if (item.pos) textToCopy += ` (${item.pos})`;
      if (item.ipa) textToCopy += ` //${item.ipa}//`;
      if (item.meaningEn) textToCopy += ` ${item.meaningEn}`;
      if (item.meaningKm) textToCopy += ` ${item.meaningKm}`;
      textToCopy += "\n";
      
      if (item.synonyms) textToCopy += `    • Synonyms: ${item.synonyms}\n`;
      if (item.antonyms) textToCopy += `    • Antonyms: ${item.antonyms}\n`;
      
      if (item.examples && item.examples.length > 0) {
        item.examples.forEach(ex => {
          textToCopy += `    • Example: ${ex}\n`;
        });
      }
      textToCopy += "\n";
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
      alert("បាន Copy លទ្ធផលជោគជ័យ!");
    }).catch(err => {
      alert("មិនអាច Copy បានទេ: " + err);
    });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>បង្កើតបញ្ជីពាក្យ (Vocab Builder)</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>បញ្ចួលពាក្យ ឬអាប់ឡូតរូបភាពដើម្បីឱ្យ Gemini AI បង្កើតន័យ, IPA និងឧទាហរណ៍ដោយស្វ័យប្រវត្តិ។</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ជ្រើសរើសម៉ូដែល (Model)</label>
          <select className="input-field" value={modelName} onChange={(e) => setModelName(e.target.value)} style={{ maxWidth: '300px' }}>
            <option value="gemini-3.5-flash">Gemini 3.5 Flash (ឆ្លាត និងល្អបំផុត)</option>
            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (លឿន)</option>
            <option value="gemini-flash-latest">Gemini Flash Latest</option>
          </select>
        </div>

        {/* Input Tabs */}
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setActiveTab('text')}
            style={{ 
              padding: '0.8rem 1.5rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'text' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'text' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            បញ្ចូលពាក្យឬឃ្លា (Words or Phrases)
          </button>
          <button 
            onClick={() => setActiveTab('image')}
            style={{ 
              padding: '0.8rem 1.5rem', 
              background: 'none', 
              border: 'none', 
              borderBottom: activeTab === 'image' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'image' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            អាប់ឡូតរូបភាព (Upload Image)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: '2rem' }}>
          {activeTab === 'text' && (
            <div>
              <textarea 
                className="input-field" 
                placeholder="ឧទាហរណ៍៖ apple, banana, car&#10;វាយចុះបន្ទាត់ម្ដងមួយពាក្យ ឬប្រើសញ្ញាក្បៀស។ អាចដាក់ (បរិបទ) ពីក្រោយពាក្យបាន..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ minHeight: '120px', resize: 'vertical' }}
              ></textarea>
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="input-field"
              />
              {imagePreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  <div style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>ជម្រើសទាញពាក្យពីរូបភាព</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={options.extractHighlighted} onChange={(e) => handleOptionChange('extractHighlighted', e.target.checked)} />
                        ទាញយកតែពាក្យដែលបាន Highlight / គូសបន្ទាត់ / គូសរង្វង់
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={options.extractDifficult} onChange={(e) => handleOptionChange('extractDifficult', e.target.checked)} />
                          ទាញយកពាក្យពិបាកៗតាមកម្រិត៖
                        </label>
                        {options.extractDifficult && (
                          <select 
                            className="input-field" 
                            style={{ padding: '0.3rem 0.5rem', width: 'auto' }}
                            value={options.difficultLevel} 
                            onChange={(e) => handleOptionChange('difficultLevel', e.target.value)}
                          >
                            <option value="beginner">កម្រិតងាយ (Beginner)</option>
                            <option value="intermediate">កម្រិតមធ្យម (Intermediate)</option>
                            <option value="advanced">កម្រិតខ្ពស់ (Advanced)</option>
                            <option value="native">ដូចម្ចាស់ភាសា (Native)</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600 }}>បញ្ជាបន្ថែម (Custom Prompt) - មិនដាក់ក៏បាន</label>
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="ឧទាហរណ៍៖ ទាញយកតែពាក្យដែលជានាម (Noun)..."
                          value={options.imageCustomPrompt}
                          onChange={(e) => handleOptionChange('imageCustomPrompt', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
              <>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>ចំនួន៖</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-color)', border: 'none', borderRight: '1px solid var(--border-color)', borderRadius: 0 }}
                      onClick={() => handleOptionChange('exampleCount', Math.max(1, options.exampleCount - 1))}
                    >-</button>
                    <input 
                      type="number" 
                      className="input-field" 
                      style={{ padding: '0.4rem', width: '50px', border: 'none', borderRadius: 0, textAlign: 'center' }}
                      min="1" 
                      max="10"
                      value={options.exampleCount}
                      onChange={(e) => handleOptionChange('exampleCount', Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-color)', border: 'none', borderLeft: '1px solid var(--border-color)', borderRadius: 0 }}
                      onClick={() => handleOptionChange('exampleCount', Math.min(10, options.exampleCount + 1))}
                    >+</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={generateVocabList}
            disabled={isLoading || (activeTab === 'text' && !inputText.trim()) || (activeTab === 'image' && !imageFile)}
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
          
          <button 
            className="btn" 
            onClick={copyPrompt}
            style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            ចម្លង Prompt (Copy Prompt)
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
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--accent-primary)' }}>{index + 1}. {item.word.replace(/\(.*?\)/g, '').trim()}</h3>
                  {item.pos && <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{item.pos}</span>}
                  {item.ipa && <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>//{item.ipa}//</span>}
                  
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
                  {item.meaningEn && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span>{item.meaningEn}</span>
                    </div>
                  )}
                  {item.meaningKm && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.meaningKm}</span>
                    </div>
                  )}
                  {item.synonyms && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
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
                  {item.examples && item.examples.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {item.examples.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0.8rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                          <span style={{ fontStyle: 'italic' }}>• Example: {ex}</span>
                        </div>
                      ))}
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
