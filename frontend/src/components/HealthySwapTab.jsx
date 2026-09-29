import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Sparkles, 
  AlertTriangle, 
  Languages, 
  History, 
  Mic, 
  MicOff, 
  RotateCcw
} from 'lucide-react';
import HistorySidebar from './HistorySidebar';
import { saveToFeatureHistory } from '../utils/historyHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HealthySwapTab({ username, userProfile }) {
  const activeUser = (username || userProfile?.username || userProfile?.user_id || 'guest').trim().toLowerCase();

  const [foodItem, setFoodItem] = useState('');
  const [healthGoal, setHealthGoal] = useState('weight_loss');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [swapsData, setSwapsData] = useState(null);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'ta'

  // Voice Input (Microphone Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // History Drawer
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'ta' 
        ? 'உங்கள் உலாவி குரல் உள்ளீட்டை (Speech Recognition) ஆதரிக்கவில்லை.' 
        : 'Your browser does not support Speech Recognition. Try Google Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setFoodItem(transcript);
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!foodItem.trim()) return;
    setLoading(true);
    setError(null);
    setSwapsData(null);
    setStreamingText('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/swap/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          food_item: foodItem.trim(), 
          health_goal: healthGoal,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const eventData = JSON.parse(dataStr);
              if (eventData.type === 'chunk') {
                accumulated += eventData.text;
                setStreamingText(accumulated);
              } else if (eventData.type === 'complete') {
                const completeData = eventData.data;
                setSwapsData(completeData);
                setStreamingText('');

                saveToFeatureHistory(
                  'swaps',
                  completeData.original_item || foodItem,
                  completeData.swaps?.map((s) => s.alternative_name).join(', ') || 'Healthy alternatives',
                  completeData,
                  activeUser
                );
              } else if (eventData.type === 'error') {
                setError(eventData.message);
              }
            } catch {
              // Partial stream ticks
            }
          }
        }
      }
    } catch {
      setError(language === 'ta' 
        ? 'பின்தள சேவையகத்தை இணைக்க இயலவில்லை.' 
        : 'Unable to fetch recommendations. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreHistory = (historyItem) => {
    setSwapsData(historyItem.payload);
    if (historyItem.payload?.original_item) {
      setFoodItem(historyItem.payload.original_item);
    }
    setError(null);
  };

  const handleClear = () => {
    setFoodItem('');
    setSwapsData(null);
    setStreamingText('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/20 mb-8 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 className="text-2xl font-serif font-bold text-[#2a3c2e] flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#4d6b53]"/>
            <span>{language === 'ta' ? 'ஊட்டச்சத்து மாற்று உணவுகள் (Nutritional Swaps)' : 'Healthy Nutritional Swaps'}</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'ta' : 'en'))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer shadow-xs transition-colors ${
                language === 'ta' 
                  ? 'bg-[#4d6b53] text-white border-[#4d6b53]' 
                  : 'bg-white text-stone-700 border-stone-300 hover:border-[#4d6b53]'
              }`}
            >
              <Languages className="w-3.5 h-3.5"/>
              <span>{language === 'en' ? 'English (EN)' : 'தமிழ் (TA)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#4d6b53]/25 bg-white text-xs font-semibold text-[#2a3c2e] hover:bg-stone-50 cursor-pointer transition-colors shadow-xs"
            >
              <History className="w-4 h-4 text-[#4d6b53]"/>
              <span>{language === 'ta' ? 'வரலாறு' : 'History'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-6">
          {language === 'ta'
            ? 'அதிக கலோரி, பதப்படுத்தப்பட்ட உணவுகளுக்கு பதிலாக சத்தான மாற்று உணவுகளை உடனுக்குடன் கண்டறியுங்கள்.'
            : 'Find nutrient-dense substitutions for calorie-heavy, processed, or inflammatory ingredients.'}
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder={
                isListening
                  ? (language === 'ta' ? 'பேசுங்கள்... கேட்கிறது' : 'Listening... Speak food item name')
                  : (language === 'ta' ? 'உணவு பெயர் (எ.கா: வெள்ளை சாதம், சர்க்கரை)...' : 'e.g. white rice, refined oil, potato chips, sugar...')
              }
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 pr-11 text-sm text-stone-800 placeholder-stone-400 focus:outline-none ${
                isListening ? 'border-rose-400 ring-2 ring-rose-200' : 'border-stone-300 focus:border-[#4d6b53]'
              }`}
            />
            <button
              type="button"
              onClick={toggleListening}
              title={language === 'ta' ? 'குரல் உள்ளீடு' : 'Speak Food Item'}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-stone-400 hover:text-[#4d6b53] hover:bg-stone-100'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
            </button>
          </div>

          <select
            value={healthGoal}
            onChange={(e) => setHealthGoal(e.target.value)}
            className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-[#4d6b53]"
          >
            <option value="weight_loss">{language === 'ta' ? 'எடை இழப்பு (Weight Loss)' : 'Weight Loss'}</option>
            <option value="muscle_building">{language === 'ta' ? 'தசை வளர்ச்சி (Muscle Gain)' : 'Muscle Gain'}</option>
            <option value="maintain_weight">{language === 'ta' ? 'உடல் பராமரிப்பு (Maintenance)' : 'Maintenance'}</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-semibold cursor-pointer disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            {loading ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin"/>
                <span>{language === 'ta' ? 'தேடுகிறது...' : 'Streaming Swaps...'}</span>
              </>
            ) : (
              language === 'ta' ? 'மாற்று உணவு காண்க' : 'Find Swaps'
            )}
          </button>
        </form>
      </div>

      {loading && streamingText && (
        <div className="cream-card rounded-2xl p-4 border border-[#4d6b53]/30 mb-6 bg-stone-50 font-mono text-xs text-stone-700 whitespace-pre-wrap">
          {streamingText}
        </div>
      )}

      {error && (
        <div className="cream-card border-rose-300 bg-rose-50/70 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600"/>
          <span>{error}</span>
        </div>
      )}

      {swapsData && swapsData.swaps && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#2a3c2e]">
              {language === 'ta' ? 'சிறந்த ஊட்டச்சத்து மாற்றுகள்:' : 'Healthier Alternatives for'}{' '}
              <span className="capitalize">{swapsData.original_item}</span>:
            </h3>

            <button
              onClick={handleClear}
              title="Clear search"
              className="p-1.5 rounded-xl border border-stone-300 text-stone-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer bg-white"
            >
              <RotateCcw className="w-4 h-4"/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swapsData.swaps.map((item, idx) => (
              <div key={idx} className="cream-card rounded-2xl p-5 border border-[#4d6b53]/20 bg-white shadow-xs">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif font-bold text-base text-[#2a3c2e]">{item.alternative_name}</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {item.calorie_difference}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{item.why_it_is_better}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Slide-out Drawer */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={handleRestoreHistory}
        activeTab="swaps"
        username={activeUser}
      />
    </div>
  );
}