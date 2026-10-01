import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  Plus, 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  RotateCcw,
  UtensilsCrossed,
  Volume2,
  Square,
  Languages,
  Minus,
  Mic,
  MicOff,
  Sparkles
} from 'lucide-react';
import HistorySidebar from './HistorySidebar';
import { saveToFeatureHistory } from '../utils/historyHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function SimpleRecipeTab({ username, userProfile }) {
  const activeUser = (username || userProfile?.username || userProfile?.user_id || 'guest').trim().toLowerCase();

  const [ingredients, setIngredients] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loggedStatus, setLoggedStatus] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en');

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [portionQuantity, setPortionQuantity] = useState(1);
  const [portionUnit, setPortionUnit] = useState('plate');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);

  const cacheKey = `last_pantry_recipe_${activeUser}`;

  const [recipe, setRecipe] = useState(() => {
    try {
      const saved = sessionStorage.getItem(cacheKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(cacheKey);
      setRecipe(saved ? JSON.parse(saved) : null);
    } catch {
      setRecipe(null);
    }
    setIngredients([]);
    setError(null);
  }, [activeUser, cacheKey]);

  useEffect(() => {
    if (recipe) {
      sessionStorage.setItem(cacheKey, JSON.stringify(recipe));
    }
  }, [recipe, cacheKey]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(language === 'ta' 
        ? 'உங்கள் உலாவி குரல் உள்ளீட்டை ஆதரிக்கவில்லை.' 
        : 'Your browser does not support Speech Recognition.');
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

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const items = transcript
          .split(/,| and | மற்றும் /)
          .map((i) => i.trim().toLowerCase())
          .filter((i) => i.length > 0);
        setIngredients((prev) => Array.from(new Set([...prev, ...items])));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support text-to-speech.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!recipe) return;

    const isTamil = language === 'ta' || 
                    /[\u0B80-\u0BFF]/.test(recipe.recipe_title || '') ||
                    /[\u0B80-\u0BFF]/.test(recipe.steps?.[0] || '');

    let fullScript = '';
    if (isTamil) {
      const titleText = `${recipe.recipe_title || 'செய்முறை'}.`;
      const usedList = (recipe.used_ingredients || recipe.ingredients || []).join(', ');
      const ingredientsText = usedList ? `தேவையான பொருட்கள்: ${usedList}.` : '';
      const staplesList = (recipe.pantry_staples_used || []).join(', ');
      const staplesText = staplesList ? `மளிகைப் பொருட்கள்: ${staplesList}.` : '';
      const stepsList = (recipe.steps || recipe.instructions || []).map((step, idx) => `படி ${idx + 1}. ${step}`).join(' ');
      fullScript = `${titleText} ${ingredientsText} ${staplesText} ${stepsList}`;
    } else {
      const titleText = `Recipe for ${recipe.recipe_title || 'your dish'}.`;
      const usedList = (recipe.used_ingredients || recipe.ingredients || []).join(', ');
      const ingredientsText = usedList ? `Ingredients used: ${usedList}.` : '';
      const staplesList = (recipe.pantry_staples_used || []).join(', ');
      const staplesText = staplesList ? `Pantry staples needed: ${staplesList}.` : '';
      const stepsList = (recipe.steps || []).map((step, idx) => `Step ${idx + 1}. ${step}`).join(' ');
      fullScript = `${titleText} ${ingredientsText} ${staplesText} ${stepsList}`;
    }

    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = isTamil ? 0.90 : 0.95;
    utterance.pitch = 1.0;
    utterance.lang = isTamil ? 'ta-IN' : 'en-US';

    const availableVoices = window.speechSynthesis.getVoices();
    if (isTamil) {
      const tamilVoice = availableVoices.find(
        (v) => v.lang === 'ta-IN' || v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')
      );
      if (tamilVoice) utterance.voice = tamilVoice;
    } else {
      const englishVoice = availableVoices.find(
        (v) => v.lang === 'en-IN' || v.lang === 'en-US' || v.lang.startsWith('en')
      );
      if (englishVoice) utterance.voice = englishVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const addIngredient = (e) => {
    e.preventDefault();
    const trimmed = inputVal.trim().toLowerCase();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setInputVal('');
    }
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter((i) => i !== item));
  };

  const handleClearRecipe = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setRecipe(null);
    setStreamingText('');
    setLoggedStatus(null);
    sessionStorage.removeItem(cacheKey);
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      setError(language === 'ta' ? 'தயவுசெய்து குறைந்தபட்சம் ஒரு பொருளைச் சேர்க்கவும்.' : 'Please add at least one ingredient.');
      return;
    }
    
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setLoading(true);
    setError(null);
    setLoggedStatus(null);
    setRecipe(null);
    setStreamingText('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-recipe/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredients,
          language: language 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const match = block.match(/data:\s*(.+)/s);
          if (!match) continue;
          const dataStr = match[1].trim();
          if (!dataStr) continue;

          try {
            const eventData = JSON.parse(dataStr);
            if (eventData.type === 'chunk') {
              accumulated += eventData.text;
              setStreamingText(accumulated);
            } else if (eventData.type === 'complete') {
              const finalRecipe = eventData.data;
              setRecipe(finalRecipe);
              setStreamingText('');

              saveToFeatureHistory(
                'text-recipe',
                finalRecipe.recipe_title || 'Pantry Recipe',
                ingredients.join(', '),
                finalRecipe,
                activeUser
              );
            } else if (eventData.type === 'error') {
              setError(eventData.message);
            }
          } catch (e) {
            console.warn("Chunk parsing error:", e);
          }
        }
      }

      setIngredients([]);
      setInputVal('');
    } catch {
      setError(language === 'ta' ? 'பின்தள சேவையகத்தை இணைக்க இயலவில்லை.' : 'Cannot connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreHistory = (historyItem) => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setRecipe(historyItem.payload);
    setLoggedStatus(null);
    setError(null);
  };

  const submitDietLog = async (e) => {
    e.preventDefault();
    if (!recipe) return;

    setIsLoggingMeal(true);
    try {
      const baseCalories = Number(recipe.estimated_nutrition?.calories || 400);
      const baseProtein = Number(recipe.estimated_nutrition?.protein_g || 15);
      const baseCarbs = Number(recipe.estimated_nutrition?.carbs_g || 45);
      const baseFat = Number(recipe.estimated_nutrition?.fat_g || 12);
      const ratio = portionQuantity || 1;

      const res = await fetch(`${API_BASE_URL}/api/diet/log-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser,
          meal_name: `${recipe.recipe_title || 'Cooked Recipe'} (${portionQuantity} ${portionUnit})`,
          meal_type: selectedMealType,
          calories: Math.round(baseCalories * ratio),
          protein_g: Math.round(baseProtein * ratio),
          carbs_g: Math.round(baseCarbs * ratio),
          fat_g: Math.round(baseFat * ratio),
          sugar_g: 0,
          sodium_mg: 300,
        }),
      });

      if (res.ok) {
        setLoggedStatus(language === 'ta'
          ? `${selectedMealType} பிரிவில் (${portionQuantity} ${portionUnit}) பதிவு செய்யப்பட்டது!`
          : `Logged to ${activeUser}'s Diet Tracker as ${selectedMealType} (${portionQuantity} ${portionUnit})!`
        );
        setIsLogModalOpen(false);
      } else {
        setLoggedStatus(language === 'ta' ? 'பதிவு செய்வதில் பிழை ஏற்பட்டது.' : 'Failed to log to tracker.');
      }
    } catch {
      setLoggedStatus(language === 'ta' ? 'பின்தளத்தை அணுக முடியவில்லை.' : 'Failed to reach backend server.');
    } finally {
      setIsLoggingMeal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/20 mb-8 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-bold text-[#2a3c2e] flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-[#4d6b53]"/>
            <span>{language === 'ta' ? 'கிச்சன் செஃப் (Pantry Chef)' : 'Pantry Chef'}</span>
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
            ? `${activeUser}-க்காக கைவசம் உள்ள பொருட்களை உள்ளிட்டு உடனடி செய்முறையைப் பெறுங்கள்.`
            : `Enter available pantry ingredients for ${activeUser} to formulate step-by-step authentic recipes.`}
        </p>

        <form onSubmit={addIngredient} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={
                isListening
                  ? (language === 'ta' ? 'பேசுங்கள்... கேட்கிறது' : 'Listening... Speak ingredient name')
                  : (language === 'ta' ? 'பொருட்களை உள்ளிடவும் அல்லது மைக் அழுத்தவும்...' : 'Add ingredient (e.g. egg, onion, paneer) or use mic...')
              }
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className={`w-full bg-white border rounded-xl px-4 py-2.5 pr-11 text-sm text-stone-800 placeholder-stone-400 focus:outline-none ${
                isListening ? 'border-rose-400 ring-2 ring-rose-200' : 'border-stone-300 focus:border-[#4d6b53]'
              }`}
            />
            <button
              type="button"
              onClick={toggleListening}
              title={language === 'ta' ? 'குரல் உள்ளீடு' : 'Speak Ingredients'}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-stone-400 hover:text-[#4d6b53] hover:bg-stone-100'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4"/> : <Mic className="w-4 h-4"/>}
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4"/>
            <span>{language === 'ta' ? 'சேர்' : 'Add'}</span>
          </button>
        </form>

        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {ingredients.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-medium text-stone-700 shadow-xs"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeIngredient(item)}
                  className="hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5"/>
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || ingredients.length === 0}
          className="w-full py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-sm shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin"/>
              <span>{language === 'ta' ? 'நிகழ்நேரத்தில் உருவாகிறது...' : 'Streaming Recipe in Real-time...'}</span>
            </>
          ) : (
            language === 'ta' ? 'தமிழில் செய்முறை பெறுக' : 'Generate Recipe'
          )}
        </button>
      </div>

      {loading && streamingText && (
        <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/30 mb-8 bg-stone-50/80 animate-in fade-in">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#4d6b53]">
            <Sparkles className="w-4 h-4 animate-spin"/>
            <span>Live Response Stream</span>
          </div>
          <pre className="text-xs font-mono text-stone-700 whitespace-pre-wrap break-words max-h-56 overflow-y-auto">
            {streamingText}
          </pre>
        </div>
      )}

      {error && (
        <div className="cream-card border-rose-300 bg-rose-50/70 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600"/>
          <span>{error}</span>
        </div>
      )}

      {recipe && (
        <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/20 animate-in fade-in bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4 mb-6">
            <div>
              <h3 className="text-2xl font-serif font-bold text-[#2a3c2e]">
                {recipe.recipe_title || recipe.recipe_name || (language === 'ta' ? 'செய்முறை விளக்கம்' : 'Recipe')}
              </h3>
              {recipe.is_non_veg && (
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-semibold">
                  {language === 'ta' ? 'அசைவம்' : 'Non-Vegetarian'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleSpeech}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors shadow-xs ${
                  isSpeaking
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-white text-[#2a3c2e] border-stone-300 hover:border-[#4d6b53] hover:text-[#4d6b53]'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current"/>
                    <span>{language === 'ta' ? 'நிறுத்துக' : 'Stop Voice'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5"/>
                    <span>{language === 'ta' ? 'செய்முறை வாசி' : 'Read Recipe'}</span>
                  </>
                )}
              </button>

              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5"/>{' '}
                {recipe.cooking_time_minutes || 20}m
              </span>

              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <UtensilsCrossed className="w-3.5 h-3.5"/>
                <span>{language === 'ta' ? 'டயட் டிராக்கரில் சேர்க்க' : 'Log to Diet Tracker'}</span>
              </button>

              <button
                onClick={handleClearRecipe}
                title="Clear recipe"
                className="p-1.5 rounded-xl border border-stone-300 text-stone-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {loggedStatus && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0"/>
              <span>{loggedStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2a3c2e] mb-3">
                {language === 'ta' ? 'பயன்படுத்திய பொருட்கள்' : 'Ingredients Used'}
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {(recipe.used_ingredients || recipe.ingredients)?.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4d6b53]"/>
                    <span className="capitalize">{ing}</span>
                  </li>
                ))}
              </ul>

              {recipe.pantry_staples_used?.length > 0 && (
                <>
                  <h4 className="font-serif font-bold text-sm text-[#2a3c2e] mt-4 mb-2">
                    {language === 'ta' ? 'மளிகைப் பொருட்கள்' : 'Pantry Staples'}
                  </h4>
                  <ul className="space-y-1 text-xs text-stone-500">
                    {recipe.pantry_staples_used.map((st, idx) => (
                      <li key={idx}>+ {st}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="md:col-span-2">
              <h4 className="font-serif font-bold text-sm text-[#2a3c2e] mb-3">
                {language === 'ta' ? 'செய்முறை வழிமுறைகள்' : 'Cooking Instructions'}
              </h4>
              <ol className="space-y-2.5 text-xs text-stone-700">
                {(recipe.steps || recipe.instructions)?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#4d6b53]/15 text-[#4d6b53] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#faf7f0] rounded-3xl p-6 border border-[#4d6b53]/25 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-200">
              <h3 className="font-serif font-bold text-lg text-[#2a3c2e] flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#4d6b53]"/>
                <span>{language === 'ta' ? 'உணவு பதிவு விவரங்கள்' : 'Log Meal to Tracker'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <form onSubmit={submitDietLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {language === 'ta' ? 'உணவு நேரம் / வகை:' : 'Meal Window / Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'breakfast', en: 'Breakfast', ta: 'காலை உணவு' },
                    { id: 'lunch', en: 'Lunch', ta: 'மதிய உணவு' },
                    { id: 'dinner', en: 'Dinner', ta: 'இரவு உணவு' },
                    { id: 'snack', en: 'Snack', ta: 'சிற்றுண்டி' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedMealType(type.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        selectedMealType === type.id
                          ? 'bg-[#4d6b53] text-white border-[#4d6b53] shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-[#4d6b53]'
                      }`}
                    >
                      {language === 'ta' ? type.ta : type.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {language === 'ta' ? 'சாப்பிட்ட அளவு (Quantity & Unit):' : 'Serving Quantity & Portion Unit:'}
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-stone-300 rounded-xl px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setPortionQuantity((q) => Math.max(0.5, Number((q - 0.5).toFixed(1))))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600"
                    >
                      <Minus className="w-3.5 h-3.5"/>
                    </button>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={portionQuantity}
                      onChange={(e) => setPortionQuantity(Math.max(0.25, parseFloat(e.target.value) || 1))}
                      className="w-12 text-center text-sm font-bold text-stone-800 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPortionQuantity((q) => Number((q + 0.5).toFixed(1)))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600"
                    >
                      <Plus className="w-3.5 h-3.5"/>
                    </button>
                  </div>

                  <select
                    value={portionUnit}
                    onChange={(e) => setPortionUnit(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#4d6b53]"
                  >
                    <option value="plate">{language === 'ta' ? 'தட்டு (Plate)' : 'Plate(s)'}</option>
                    <option value="bowl">{language === 'ta' ? 'கிண்ணம் (Bowl)' : 'Bowl / Katori'}</option>
                    <option value="piece">{language === 'ta' ? 'எண்ணிக்கை (Piece / Roti)' : 'Piece(s) / Roti'}</option>
                    <option value="cup">{language === 'ta' ? 'கப் (Cup - 240ml)' : 'Cup(s) (240ml)'}</option>
                    <option value="gram">{language === 'ta' ? 'கிராம் (Grams)' : 'Grams (g)'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-100 transition-colors"
                >
                  {language === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isLoggingMeal}
                  className="flex-1 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  {isLoggingMeal 
                    ? (language === 'ta' ? 'பதிவாகிறது...' : 'Logging...') 
                    : (language === 'ta' ? 'டிராக்கரில் பதிவு செய்க' : 'Confirm & Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={handleRestoreHistory}
        activeTab="text-recipe"
        username={activeUser}
      />
    </div>
  );
}