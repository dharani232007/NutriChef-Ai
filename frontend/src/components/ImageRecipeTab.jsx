import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  RotateCcw,
  Volume2,
  Square,
  Sparkles,
  Languages,
  UtensilsCrossed,
  Minus,
  Plus,
  X
} from 'lucide-react';
import HistorySidebar from './HistorySidebar';
import { saveToFeatureHistory } from '../utils/historyHelper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function ImageRecipeTab({ username, userProfile }) {
  const activeUser = (username || userProfile?.username || userProfile?.user_id || 'guest').trim().toLowerCase();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamProgress, setStreamProgress] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState('en'); // 'en' | 'ta'

  // Modal State for Diet Tracker Logging
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [portionQuantity, setPortionQuantity] = useState(1);
  const [portionUnit, setPortionUnit] = useState('plate');
  const [isLoggingMeal, setIsLoggingMeal] = useState(false);
  const [loggedStatus, setLoggedStatus] = useState(null);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert(language === 'ta' ? 'குரல் வாசிப்பு வசதி இல்லை.' : 'Your browser does not support text-to-speech narration.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const recipe = result?.recipe;
    if (!recipe) return;

    const isTamil = language === 'ta' || 
                    /[\u0B80-\u0BFF]/.test(recipe.recipe_title || '') ||
                    /[\u0B80-\u0BFF]/.test(recipe.steps?.[0] || '');

    let fullScript = '';
    if (isTamil) {
      const dishTitle = recipe.recipe_title || result.image_analysis?.detected_dish_name || 'உணவு';
      const titleText = `${dishTitle} செய்முறை.`;
      const dietitianText = recipe.health_alignment_note ? `மருத்துவ குறிப்பு: ${recipe.health_alignment_note}.` : '';
      const usedList = (recipe.used_ingredients || result.image_analysis?.ingredients || []).join(', ');
      const ingredientsText = usedList ? `தேவையான பொருட்கள்: ${usedList}.` : '';
      const staplesList = (recipe.pantry_staples_used || []).join(', ');
      const staplesText = staplesList ? `மளிகைப் பொருட்கள்: ${staplesList}.` : '';
      const stepsList = (recipe.steps || []).map((step, idx) => `படி ${idx + 1}. ${step}`).join(' ');
      const instructionsText = stepsList ? `சமைக்கும் முறைகள்: ${stepsList}` : '';
      fullScript = `${titleText} ${dietitianText} ${ingredientsText} ${staplesText} ${instructionsText}`;
    } else {
      const titleText = `Recipe for ${recipe.recipe_title || result.image_analysis?.detected_dish_name || 'your dish'}.`;
      const dietitianText = recipe.health_alignment_note ? `Dietitian Note: ${recipe.health_alignment_note}.` : '';
      const usedList = (recipe.used_ingredients || result.image_analysis?.ingredients || []).join(', ');
      const ingredientsText = usedList ? `Ingredients used: ${usedList}.` : '';
      const staplesList = (recipe.pantry_staples_used || []).join(', ');
      const staplesText = staplesList ? `Pantry staples needed: ${staplesList}.` : '';
      const stepsList = (recipe.steps || []).map((step, idx) => `Step ${idx + 1}. ${step}`).join(' ');
      const instructionsText = stepsList ? `Cooking instructions: ${stepsList}` : '';
      fullScript = `${titleText} ${dietitianText} ${ingredientsText} ${staplesText} ${instructionsText}`;
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setLoggedStatus(null);
      setStreamProgress('');
    }
  };

  const handleClear = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setLoggedStatus(null);
    setStreamProgress('');
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError(language === 'ta' ? 'முதலில் ஒரு புகைப்படத்தை பதிவேற்றவும்.' : 'Please select or upload an image first.');
      return;
    }

    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setLoading(true);
    setError(null);
    setLoggedStatus(null);
    setStreamProgress(language === 'ta' ? 'புகைப்படம் பகுப்பாய்வு செய்யப்படுகிறது...' : 'Uploading image to neural vision pipeline...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('language', language);

    try {
      const res = await fetch(`${API_BASE_URL}/api/image-to-recipe`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(language === 'ta' ? 'அன்றாட பயன்பாட்டு வரம்பு முடிந்தது.' : 'Daily generation quota reached. Please try again tomorrow.');
        } else if (res.status === 422) {
          setError(language === 'ta' ? 'செல்லுபடியாகாத புகைப்படம். JPG அல்லது PNG பயன்படுத்தவும்.' : 'Invalid image format. Please upload a standard JPG or PNG.');
        } else {
          setError(data.detail || data.message || `Server error (${res.status})`);
        }
        return;
      }

      if (data.success === false) {
        setError(data.message || (language === 'ta' ? 'உணவு அல்லாத புகைப்படம் கண்டறியப்பட்டது.' : 'Non-food image detected. Please upload an edible item.'));
        return;
      }

      setResult(data);

      saveToFeatureHistory(
        'image-recipe',
        data.image_analysis?.detected_dish_name || data.recipe?.recipe_title || 'Scanned Dish',
        data.image_analysis?.ingredients?.join(', ') || 'Extracted Ingredients',
        data,
        activeUser
      );
    } catch {
      setError(language === 'ta' ? 'சேவையகத்தை இணைக்க இயலவில்லை.' : 'Cannot connect to backend server.');
    } finally {
      setLoading(false);
      setStreamProgress('');
    }
  };

  const handleRestoreHistory = (historyItem) => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setResult(historyItem.payload);
    setError(null);
    setLoggedStatus(null);
  };

  const submitDietLog = async (e) => {
    e.preventDefault();
    const recipe = result?.recipe;
    if (!recipe) return;

    setIsLoggingMeal(true);
    try {
      const baseCalories = Number(recipe.estimated_nutrition?.calories || 480);
      const baseProtein = Number(recipe.estimated_nutrition?.protein_g || 18);
      const baseCarbs = Number(recipe.estimated_nutrition?.carbs_g || 55);
      const baseFat = Number(recipe.estimated_nutrition?.fat_g || 14);
      const ratio = portionQuantity || 1;

      const res = await fetch(`${API_BASE_URL}/api/diet/log-meal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser,
          meal_name: `${recipe.recipe_title || result?.image_analysis?.detected_dish_name || 'Scanned Dish'} (${portionQuantity} ${portionUnit})`,
          meal_type: selectedMealType,
          calories: Math.round(baseCalories * ratio),
          protein_g: Math.round(baseProtein * ratio),
          carbs_g: Math.round(baseCarbs * ratio),
          fat_g: Math.round(baseFat * ratio),
          sugar_g: 0,
          sodium_mg: 400,
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h2 className="text-2xl font-serif font-bold text-[#2a3c2e] flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#4d6b53]"/>
            <span>{language === 'ta' ? 'உணவு ஸ்கேனர் (Dish Scanner)' : 'Multimodal Dish Scanner'}</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#4d6b53]/25 bg-white text-xs font-semibold text-[#2a3c2e] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <History className="w-4 h-4 text-[#4d6b53]"/>
              <span>{language === 'ta' ? 'வரலாறு' : 'History'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-6">
          {language === 'ta'
            ? 'சமைத்த உணவு அல்லது பொருட்களின் புகைப்படத்தைப் பதிவேற்றி உடனடியாக செய்முறையைப் பெறுங்கள்.'
            : 'Upload an image of your ingredients or a cooked dish to extract components and cook.'}
        </p>

        <label className="border-2 border-dashed border-[#4d6b53]/30 hover:border-[#4d6b53] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-white/50 transition-all mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {previewUrl ? (
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-64 rounded-xl object-contain shadow-sm"
              />
              <span className="text-[11px] text-stone-500 block text-center mt-2">
                {language === 'ta' ? 'வேறு படத்தை மாற்ற கிளிக் செய்க' : 'Click to change image'}
              </span>
            </div>
          ) : (
            <div className="text-center py-6">
              <Upload className="w-10 h-10 text-[#4d6b53] mx-auto mb-2 opacity-80"/>
              <p className="text-sm font-semibold text-[#2a3c2e]">
                {language === 'ta' ? 'உணவு புகைப்படத்தை பதிவேற்ற கிளிக் செய்க' : 'Click to upload dish photo'}
              </p>
              <p className="text-xs text-stone-400 mt-1">PNG, JPG, or JPEG up to 10MB</p>
            </div>
          )}
        </label>

        <button
          onClick={handleAnalyze}
          disabled={loading || !selectedFile}
          className="w-full py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-sm shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin"/>
              <span>{language === 'ta' ? 'பகுப்பாய்வு செய்யப்படுகிறது...' : 'Analyzing Food Image...'}</span>
            </>
          ) : (
            language === 'ta' ? 'பகுப்பாய்வு செய்து சமைக்க' : 'Analyze & Cook'
          )}
        </button>

        {loading && streamProgress && (
          <div className="mt-3 text-xs text-center text-[#4d6b53] font-medium animate-pulse">
            {streamProgress}
          </div>
        )}
      </div>

      {error && (
        <div className="cream-card border-rose-300 bg-rose-50/70 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600"/>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/20 animate-in fade-in bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4 mb-6">
            <div>
              <span className="text-[11px] font-semibold text-[#4d6b53] uppercase tracking-wider">
                {result.image_analysis?.detected_dish_name ? (language === 'ta' ? 'கண்டறியப்பட்ட உணவு' : 'Dish Identified') : (language === 'ta' ? 'பொருட்கள்' : 'Raw Ingredients')}
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#2a3c2e]">
                {result.recipe?.recipe_title || result.image_analysis?.detected_dish_name || (language === 'ta' ? 'சமைத்த உணவு' : 'Cooked Dish')}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {result.recipe && (
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
              )}

              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5"/> {result.recipe?.cooking_time_minutes || 20}m
              </span>
              <span className="px-3 py-1 rounded-full bg-[#4d6b53]/15 text-[#4d6b53] text-xs font-semibold capitalize">
                {result.recipe?.difficulty || 'Easy'}
              </span>

              {/* Log to Diet Tracker Button */}
              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
              >
                <UtensilsCrossed className="w-3.5 h-3.5"/>
                <span>{language === 'ta' ? 'டயட் டிராக்கரில் சேர்க்க' : 'Log to Diet Tracker'}</span>
              </button>

              <button
                onClick={handleClear}
                title="Clear current scan"
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
                {language === 'ta' ? 'கண்டறியப்பட்ட பொருட்கள்' : 'Detected Ingredients'}
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {(result.recipe?.used_ingredients || result.image_analysis?.ingredients)?.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4d6b53]"/>
                    <span className="capitalize">{ing}</span>
                  </li>
                ))}
              </ul>

              {result.recipe?.pantry_staples_used?.length > 0 && (
                <>
                  <h4 className="font-serif font-bold text-sm text-[#2a3c2e] mt-4 mb-2">
                    {language === 'ta' ? 'மளிகைப் பொருட்கள்' : 'Pantry Staples'}
                  </h4>
                  <ul className="space-y-1 text-xs text-stone-500">
                    {result.recipe.pantry_staples_used.map((st, idx) => (
                      <li key={idx}>+ {st}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="md:col-span-2">
              <h4 className="font-serif font-bold text-sm text-[#2a3c2e] mb-3">
                {language === 'ta' ? 'செய்முறை வழிமுறைகள்' : 'Recipe Instructions'}
              </h4>
              <ol className="space-y-2.5 text-xs text-stone-700">
                {result.recipe?.steps?.map((step, idx) => (
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

      {/* Log Meal Modal */}
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

      {/* History Drawer */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onSelectHistoryItem={handleRestoreHistory}
        activeTab="image-recipe"
        username={activeUser}
      />
    </div>
  );
}