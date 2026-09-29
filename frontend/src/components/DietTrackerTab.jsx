import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Coffee, 
  Sun, 
  Moon, 
  Apple, 
  CheckCircle, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Scale,
  Plus,
  Minus,
  TrendingUp,
  BarChart3,
  Camera,
  Upload,
  X
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function DietTrackerTab({ username, userProfile }) {
  const rawUser = username || userProfile?.username || userProfile?.user_id || 'Archana';
  const activeUser = rawUser.trim().toLowerCase();

  // Dynamic user profile state fetched from localStorage & backend
  const [currentProfile, setCurrentProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(`profile_data_${activeUser}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const data = parsed.profile || parsed;
        if (data && (data.height_cm || data.weight_kg)) {
          return data;
        }
      }
    } catch (e) {
      console.error("Could not parse initial profile data:", e);
    }
    return userProfile || null;
  });

  const profileHeight = currentProfile?.height_cm || '';
  const profileWeight = currentProfile?.weight_kg || '';
  const profileGender = currentProfile?.gender || 'female';

  const [timeframe, setTimeframe] = useState('today');
  const [progress, setProgress] = useState(null);
  
  // Input modes: 'text' or 'photo'
  const [logMode, setLogMode] = useState('text');
  
  // Text Form State
  const [quickMeal, setQuickMeal] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [quantity, setQuantity] = useState(1);
  const [portionUnit, setPortionUnit] = useState('plate');

  // Photo Form State (Hotel / Function Dish Scanner)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Sync profile directly from backend & listen to real-time profile updates
  const syncProfile = async () => {
    if (!activeUser || activeUser === 'guest') return;
    try {
      // 1. Check local storage
      const stored = localStorage.getItem(`profile_data_${activeUser}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const data = parsed.profile || parsed;
        if (data && (data.height_cm || data.weight_kg)) {
          setCurrentProfile(data);
        }
      }

      // 2. Query the SQLite profile API
      const res = await fetch(`${API_BASE_URL}/api/user-profile/${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists && data.profile) {
          setCurrentProfile(data.profile);
          localStorage.setItem(`profile_data_${activeUser}`, JSON.stringify({
            profile: data.profile,
            targets: data.calculated_targets || null
          }));
        }
      }
    } catch (err) {
      console.error("Failed to sync profile in DietTrackerTab:", err);
    }
  };

  useEffect(() => {
    syncProfile();

    const handleProfileUpdate = (e) => {
      if (e.detail && e.detail.profile) {
        setCurrentProfile(e.detail.profile);
      } else {
        syncProfile();
      }
    };

    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, [activeUser]);

  const fetchProgress = async (tf = timeframe) => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/diet/progress/${encodeURIComponent(activeUser)}?timeframe=${tf}`);
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgress(timeframe);
  }, [activeUser, timeframe]);

  // Handler 1: Text Logging
  const handleQuickLog = async (e) => {
    e.preventDefault();
    if (!quickMeal.trim()) return;

    setLoading(true);
    setStatusMsg(null);

    const fullDescription = portionUnit === 'auto'
      ? `${quickMeal.trim()} (Standard serving adjusted for ${profileHeight || 165}cm, ${profileWeight || 60}kg ${profileGender})`
      : `${quantity} ${portionUnit}(s) of ${quickMeal.trim()}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/diet/quick-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeUser,
          meal_type: mealType,
          meal_description: fullDescription,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`Logged: ${data.logged_item?.meal_name || quickMeal} (~${Math.round(data.logged_item?.calories || 0)} kcal) to ${mealType}`);
        setQuickMeal('');
        setQuantity(1);
        await fetchProgress(timeframe);
      } else {
        setStatusMsg('Error estimating nutrition. Please try again.');
      }
    } catch {
      setStatusMsg('Cannot reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Handler 2: Hotel/Function Meal Photo Logging
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setStatusMsg(null);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleImageLog = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      setStatusMsg('Please capture or upload a meal photo first.');
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', photoFile);
    formData.append('user_id', activeUser);
    formData.append('meal_type', mealType);
    formData.append('height_cm', profileHeight || 165);
    formData.append('weight_kg', profileWeight || 60);
    formData.append('gender', profileGender);

    try {
      const res = await fetch(`${API_BASE_URL}/api/diet/log-meal-image`, {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || result.success === false) {
        setStatusMsg(result.message || 'Could not analyze meal photo. Please try a clearer food photo.');
        return;
      }

      setStatusMsg(`Auto-Logged: ${result.data?.meal_name} (~${Math.round(result.data?.calories || 0)} kcal) to ${mealType}`);
      clearPhoto();
      await fetchProgress(timeframe);
    } catch {
      setStatusMsg('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  const consumed = progress?.total_consumed || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targets = progress?.targets || { daily_calories: 2000, protein_g: 100, carbs_g: 220, fat_g: 60 };
  const breakdown = progress?.meal_breakdown || {
    breakfast: { calories: 0, protein_g: 0 },
    lunch: { calories: 0, protein_g: 0 },
    dinner: { calories: 0, protein_g: 0 },
    snack: { calories: 0, protein_g: 0 }
  };
  const routine = progress?.recommended_routine || { 
    breakfast_target_kcal: 500, 
    lunch_target_kcal: 700, 
    dinner_target_kcal: 500, 
    remaining_kcal: 2000 
  };

  const macroGraphs = [
    {
      label: 'Calories',
      consumed: Math.round(consumed.calories),
      target: Math.round(targets.daily_calories),
      unit: 'kcal',
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-[#2a3c2e]'
    },
    {
      label: 'Protein',
      consumed: Math.round(consumed.protein_g),
      target: Math.round(targets.protein_g),
      unit: 'g',
      color: 'from-[#4d6b53] to-emerald-700',
      textColor: 'text-[#4d6b53]'
    },
    {
      label: 'Carbohydrates',
      consumed: Math.round(consumed.carbs_g),
      target: Math.round(targets.carbs_g),
      unit: 'g',
      color: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-800'
    },
    {
      label: 'Fats',
      consumed: Math.round(consumed.fat_g),
      target: Math.round(targets.fat_g),
      unit: 'g',
      color: 'from-stone-600 to-stone-700',
      textColor: 'text-stone-700'
    }
  ];

  const mealWindows = [
    {
      name: 'Breakfast',
      icon: <Coffee className="w-4 h-4 text-amber-600" />,
      consumed: Math.round(breakdown.breakfast.calories),
      target: Math.round(routine.breakfast_target_kcal),
      protein: breakdown.breakfast.protein_g || 0,
    },
    {
      name: 'Lunch',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      consumed: Math.round(breakdown.lunch.calories),
      target: Math.round(routine.lunch_target_kcal),
      protein: breakdown.lunch.protein_g || 0,
    },
    {
      name: 'Dinner',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      consumed: Math.round(breakdown.dinner.calories),
      target: Math.round(routine.dinner_target_kcal),
      protein: breakdown.dinner.protein_g || 0,
    },
    {
      name: 'Snacks',
      icon: <Apple className="w-4 h-4 text-emerald-600" />,
      consumed: Math.round(breakdown.snack.calories),
      target: Math.max(200, Math.round(targets.daily_calories * 0.15)),
      protein: breakdown.snack.protein_g || 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Natural Intake & Photo Logger */}
      <div className="cream-card rounded-3xl p-6 sm:p-8 border border-[#4d6b53]/20 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-2xl font-serif font-bold text-[#2a3c2e] flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#4d6b53]" />
            <span>Natural Intake Logger</span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Mode Switcher: Text vs. Photo */}
            <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setLogMode('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  logMode === 'text' ? 'bg-[#4d6b53] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Text Log
              </button>
              <button
                type="button"
                onClick={() => setLogMode('photo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  logMode === 'photo' ? 'bg-[#4d6b53] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Plate</span>
              </button>
            </div>

            {/* Live Profile Height & Weight Badge */}
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#4d6b53]/10 text-[#2a3c2e] font-semibold flex items-center gap-1 border border-[#4d6b53]/20">
              <Scale className="w-3.5 h-3.5 text-[#4d6b53]" />
              <span>
                {profileHeight && profileWeight 
                  ? `${profileHeight}cm | ${profileWeight}kg` 
                  : (profileHeight ? `${profileHeight}cm` : (profileWeight ? `${profileWeight}kg` : 'Profile Syncing...'))}
              </span>
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-600 mb-5">
          {logMode === 'text'
            ? `Type what you ate for ${rawUser} with portion quantities (e.g. 2 plates of biryani, 3 rotis).`
            : `Eating at a hotel or function? Snap or upload a photo of your plate to auto-calculate metabolic intake.`}
        </p>

        {/* Option A: Text Logger */}
        {logMode === 'text' && (
          <form onSubmit={handleQuickLog} className="space-y-3">
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#4d6b53]"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>

              <div className="flex items-center bg-white border border-stone-300 rounded-xl px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0.5, Number((q - 0.5).toFixed(1))))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0.25, parseFloat(e.target.value) || 1))}
                  className="w-12 text-center text-sm font-bold text-stone-800 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Number((q + 0.5).toFixed(1)))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <select
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-800 focus:outline-none focus:border-[#4d6b53]"
              >
                <option value="plate">Plate(s)</option>
                <option value="bowl">Bowl / Katori</option>
                <option value="piece">Piece(s) / Roti / Idli</option>
                <option value="cup">Cup(s) (240ml)</option>
                <option value="gram">Grams (g)</option>
                <option value="auto">Auto Body Portion</option>
              </select>

              <input
                type="text"
                required
                placeholder="e.g. hotel veg meals, biryani, paneer butter masala..."
                value={quickMeal}
                onChange={(e) => setQuickMeal(e.target.value)}
                className="flex-1 min-w-[200px] bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-bold cursor-pointer disabled:opacity-60 transition-all whitespace-nowrap shadow-xs"
              >
                {loading ? 'Estimating...' : 'Log Meal'}
              </button>
            </div>
          </form>
        )}

        {/* Option B: Photo Intake Logger (Hotel / Function / Wedding) */}
        {logMode === 'photo' && (
          <form onSubmit={handleImageLog} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#4d6b53]"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
              <span className="text-xs text-stone-500 font-medium">
                Photo will be evaluated based on plate volume and logged directly to {mealType}.
              </span>
            </div>

            {/* Dropzone / Camera Input */}
            <label className="border-2 border-dashed border-[#4d6b53]/30 hover:border-[#4d6b53] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white/60 transition-all">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoPreview ? (
                <div className="relative group text-center">
                  <img
                    src={photoPreview}
                    alt="Plate Preview"
                    className="max-h-52 rounded-xl object-contain shadow-xs mx-auto"
                  />
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs text-stone-600 font-medium">Click to retake picture</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPhoto();
                      }}
                      className="p-1 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Camera className="w-8 h-8 text-[#4d6b53] mx-auto mb-1 opacity-80" />
                  <p className="text-xs font-semibold text-[#2a3c2e]">Take or upload hotel/function food photo</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Captures buffet plates, wedding thalis, or restaurant bowls</p>
                </div>
              )}
            </label>

            <button
              type="submit"
              disabled={loading || !photoFile}
              className="w-full py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-xs cursor-pointer disabled:opacity-60 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Analyzing Plate & Calculating Nutrition...</span>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Analyze Plate & Log to Progress</span>
                </>
              )}
            </button>
          </form>
        )}

        {statusMsg && (
          <p className="text-xs text-[#4d6b53] font-semibold mt-3 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /> {statusMsg}
          </p>
        )}
      </div>

      {/* 2. Metabolic Header & Timeframe Filter */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h3 className="font-serif font-bold text-xl text-[#2a3c2e] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#4d6b53]" />
            <span>Metabolic Intake & Target Graphs</span>
            <button
              onClick={() => fetchProgress(timeframe)}
              title="Refresh Progress"
              className={`p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition-all ${refreshing ? 'animate-spin text-[#4d6b53]' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </h3>
          <p className="text-xs text-stone-500">
            Comparing actual intake against recommended targets for <span className="capitalize font-semibold">{rawUser}</span>.
          </p>
        </div>

        <div className="flex bg-stone-200/70 p-1 rounded-xl">
          {['today', 'week', 'month', 'year'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                timeframe === tf ? 'bg-white text-[#2a3c2e] shadow-xs font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Visual Macro Progress Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {macroGraphs.map((macro, idx) => {
          const percent = Math.min(100, Math.round((macro.consumed / Math.max(1, macro.target)) * 100));
          const diff = macro.target - macro.consumed;
          const isUnder = diff > 0;

          return (
            <div key={idx} className="cream-card rounded-2xl p-5 border border-[#4d6b53]/15 shadow-xs">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{macro.label}</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold text-[#2a3c2e]">{macro.consumed}</span>
                    <span className="text-xs text-stone-400">/ {macro.target} {macro.unit}</span>
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                  isUnder 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {isUnder ? `Need +${diff} ${macro.unit} more` : `Target Met (${percent}%)`}
                </div>
              </div>

              <div className="w-full bg-stone-200/80 h-3 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${macro.color} transition-all duration-700 ease-out`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-stone-500 mt-2 font-medium">
                <span>Consumed: {percent}%</span>
                <span>Remaining: {Math.max(0, diff)} {macro.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Intake by Meal Window Comparison Graph */}
      <div className="cream-card rounded-3xl p-6 border border-[#4d6b53]/20 mb-8 shadow-xs">
        <h4 className="font-serif font-bold text-base text-[#2a3c2e] mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#4d6b53]" />
          <span>Meal Window Intake vs. Recommended Distribution</span>
        </h4>
        <p className="text-xs text-stone-500 mb-6">
          Identifies whether breakfast, lunch, or dinner needs adjustments to balance your daily metabolism.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mealWindows.map((m, i) => {
            const mealPercent = Math.min(100, Math.round((m.consumed / Math.max(1, m.target)) * 100));
            const deficit = m.target - m.consumed;
            const needsMore = deficit > 0;

            return (
              <div key={i} className="p-4 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#2a3c2e]">
                      {m.icon}
                      <span>{m.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">Target: ~{m.target} kcal</span>
                  </div>

                  <div className="text-2xl font-bold text-[#2a3c2e] mb-1">
                    {m.consumed} <span className="text-xs font-normal text-stone-500">kcal</span>
                  </div>

                  <div className="text-[11px] text-stone-500 mb-3 font-medium">
                    {m.protein}g Protein logged
                  </div>

                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden mb-2 border border-stone-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        m.consumed === 0
                          ? 'bg-transparent'
                          : needsMore
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                      }`}
                      style={{ width: `${mealPercent}%` }}
                    />
                  </div>
                </div>

                <div className={`mt-3 p-2 rounded-xl text-[11px] font-semibold text-center ${
                  m.consumed === 0
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : needsMore
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                }`}>
                  {m.consumed === 0
                    ? `Not taken (Need ${m.target} kcal)`
                    : needsMore
                      ? `Take +${deficit} kcal more`
                      : '✓ Window target met'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Routine Guidance */}
      {progress?.dietary_advice && progress.dietary_advice.length > 0 && (
        <div className="cream-card p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 mb-6">
          <h5 className="font-semibold text-xs text-emerald-950 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Personalized Metabolic Guidance</span>
          </h5>
          <ul className="space-y-1.5 text-xs text-emerald-900 leading-relaxed">
            {progress.dietary_advice.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="mt-0.5 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Clinical Condition Alerts */}
      {progress?.health_alerts && progress.health_alerts.length > 0 && (
        <div className="cream-card border-rose-300 bg-rose-50/80 rounded-2xl p-4 space-y-2 mb-6">
          {progress.health_alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}