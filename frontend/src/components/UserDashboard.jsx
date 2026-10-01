import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChefHat, 
  Camera, 
  Activity, 
  ArrowLeftRight, 
  Flame, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Scale,
  CheckCircle2,
  HeartPulse
} from 'lucide-react';

export default function UserDashboard({ username, onNavigate, onOpenProfile }) {
  const [profileData, setProfileData] = useState(null);
  const [dietProgress, setDietProgress] = useState(null);

  const cleanUser = (username).trim().toLowerCase();

  useEffect(() => {
    // 1. Fetch cached local user profile & calculated targets
    const stored = localStorage.getItem(`profile_data_${username}`);
    if (stored) {
      try {
        setProfileData(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse cached profile data:", e);
      }
    }

    // 2. Fetch live diet progress from backend
    fetch(`${API_BASE_URL}/api/diet/progress/${encodeURIComponent(activeUser)}?timeframe=${tf}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setDietProgress(data);
      })
      .catch((err) => {
        console.error("Dashboard progress fetch error:", err);
      });
  }, [cleanUser, username]);

  // Fallbacks for profile & nutrition
  const userProfile = profileData?.profile || {};
  const targets = profileData?.targets || dietProgress?.targets || {
    daily_calories: 2000,
    protein_g: 100,
    carbs_g: 220,
    fat_g: 60
  };

  const consumed = dietProgress?.total_consumed || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const targetCalories = Math.round(targets.daily_calories || 2000);
  const consumedCalories = Math.round(consumed.calories || 0);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / Math.max(1, targetCalories)) * 100));

  const targetProtein = Math.round(targets.protein_g || 100);
  const consumedProtein = Math.round(consumed.protein_g || 0);

  const targetCarbs = Math.round(targets.carbs_g || 220);
  const consumedCarbs = Math.round(consumed.carbs_g || 0);

  const targetFat = Math.round(targets.fat_g || 60);
  const consumedFat = Math.round(consumed.fat_g || 0);

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 text-stone-800">
      
      {/* 1. Dual-Tone Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 mb-8 bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white shadow-xl shadow-emerald-950/15 border border-white/10">
        {/* Subtle Ambient Decorative Circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Active Metabolic Health Hub</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-white tracking-tight capitalize">
              Welcome back, {username}!
            </h1>

            <p className="text-emerald-100/90 text-sm max-w-xl leading-relaxed">
              Tailoring meals and portions for your goal:{' '}
              <strong className="text-amber-300 capitalize font-bold">
                {userProfile.health_goal?.replace('_', ' ') || 'Maintain Healthy Weight'}
              </strong>
            </p>

            {/* Health Conditions & Allergy Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {userProfile.health_conditions && userProfile.health_conditions.length > 0 ? (
                userProfile.health_conditions.map((condition) => (
                  <span 
                    key={condition} 
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40"
                  >
                    🛡️ {condition.replace('_', ' ').toUpperCase()}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>General Wellness Mode</span>
                </span>
              )}

              {userProfile.allergies && userProfile.allergies.length > 0 && (
                userProfile.allergies.map((allergy) => (
                  <span 
                    key={allergy} 
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-rose-900/60 text-rose-200 border border-rose-500/40"
                  >
                    🚫 NO {allergy.toUpperCase()}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Quick Edit Profile CTA */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-950/20 transition-all cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95"
          >
            <Scale className="w-4 h-4 text-stone-950" />
            <span>Update Body Stats</span>
          </button>
        </div>
      </section>

      {/* 2. Dual-Tone Macro Progress Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Calorie Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-600/20 border-b-2 border-b-amber-500/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
            <span>Calorie Budget</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-[#1a2e20]">
            {consumedCalories} <span className="text-xs font-normal text-stone-500">/ {targetCalories} kcal</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-stone-100 h-2 rounded-full mt-3 overflow-hidden border border-stone-200">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${caloriePercent}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-stone-500 mt-2 font-medium">
            <span>{caloriePercent}% consumed</span>
            <span>{Math.max(0, targetCalories - consumedCalories)} kcal left</span>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-600/20 border-b-2 border-b-emerald-600/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
            <span>Protein</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {consumedProtein}g <span className="text-xs font-normal text-stone-500">/ {targetProtein}g</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-2 font-medium">
            Muscle repair & satiety
          </div>
        </div>

        {/* Carbohydrates Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-amber-600/20 border-b-2 border-b-amber-500/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
            <span>Carbohydrates</span>
            <span className="text-[10px] font-bold text-amber-600">Energy</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {consumedCarbs}g <span className="text-xs font-normal text-stone-500">/ {targetCarbs}g</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-2 font-medium">
            Glycemic distribution balance
          </div>
        </div>

        {/* Fats & Clinical Guardrails Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-emerald-600/20 border-b-2 border-b-emerald-700/40 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-1">
            <span>Fats & Safety</span>
            <HeartPulse className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-[#1a2e20]">
            {consumedFat}g <span className="text-xs font-normal text-stone-500">/ {targetFat}g</span>
          </div>
          <div className="text-xs font-bold mt-2">
            {dietProgress?.health_alerts && dietProgress.health_alerts.length > 0 ? (
              <span className="text-rose-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Violation Alert
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Within Safe Limits
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 3. Action Cards Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif font-bold text-[#1c3324] flex items-center gap-2">
          <span>Quick Culinary Actions</span>
        </h2>
        <span className="text-xs text-stone-500">Choose a tool to start cooking or tracking</span>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Leftover Chef */}
        <div
          onClick={() => onNavigate('text-recipe')}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer border border-emerald-600/20 hover:border-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/5 flex flex-col justify-between group"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1a2e20] mb-1.5 group-hover:text-emerald-700 transition-colors">
              Pantry Leftovers
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Enter any raw ingredients you have. AI generates an authentic zero-waste recipe.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span>Launch Chef</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Multimodal Dish Scanner */}
        <div
          onClick={() => onNavigate('image-recipe')}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer border border-amber-600/20 hover:border-amber-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/5 flex flex-col justify-between group"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1a2e20] mb-1.5 group-hover:text-amber-700 transition-colors">
              Scan Food Photo
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Snap a picture of your dish or raw ingredients for immediate ingredient extraction.
            </p>
          </div>
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <span>Open Scanner</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Diet Progress Tracker */}
        <div
          onClick={() => onNavigate('diet-tracker')}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer border border-emerald-600/20 hover:border-emerald-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/5 flex flex-col justify-between group"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1a2e20] mb-1.5 group-hover:text-emerald-700 transition-colors">
              Diet Tracker
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Log daily meals with natural portion quantities and check your calorie graph.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <span>Log Nutrition</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Metabolic Food Swaps */}
        <div
          onClick={() => onNavigate('swaps')}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer border border-amber-600/20 hover:border-amber-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/5 flex flex-col justify-between group"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1a2e20] mb-1.5 group-hover:text-amber-700 transition-colors">
              Healthy Swaps
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed mb-4">
              Find lower-glycemic and lower-calorie alternatives for rice, oils, or sugars.
            </p>
          </div>
          <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            <span>Find Swaps</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
}