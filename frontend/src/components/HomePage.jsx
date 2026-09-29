import React from 'react';
import { 
  ChefHat, 
  Camera, 
  HeartPulse, 
  Activity, 
  ArrowLeftRight, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function HomePage({ onNavigate, onOpenAuth, username }) {
  const features = [
    {
      id: 'text-recipe',
      title: 'Pantry Chef',
      tag: 'Zero-Waste',
      desc: 'Enter whatever raw ingredients you have at home. AI formulates authentic step-by-step recipes.',
      icon: <ChefHat className="w-5 h-5 text-emerald-700" />,
      border: 'border-emerald-500/25',
      badge: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'image-recipe',
      title: 'Multimodal Dish Scanner',
      tag: 'Computer Vision',
      desc: 'Snap a picture of your dish at home, hotels, or functions to extract ingredients and cooking instructions.',
      icon: <Camera className="w-5 h-5 text-amber-700" />,
      border: 'border-amber-500/25',
      badge: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'personalized',
      title: 'Clinical Health Recipes',
      tag: 'Medical AI',
      desc: 'Tailors recipes around your exact health conditions like Diabetes, High BP, and strict allergen bounds.',
      icon: <HeartPulse className="w-5 h-5 text-emerald-700" />,
      border: 'border-emerald-500/25',
      badge: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'diet-tracker',
      title: 'Metabolic Progress Tracker',
      tag: 'Portion & Macros',
      desc: 'Log food in natural portions (bowls, plates, rotis) and monitor intake vs targets with visual graphs.',
      icon: <Activity className="w-5 h-5 text-amber-700" />,
      border: 'border-amber-500/25',
      badge: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'swaps',
      title: 'Nutritional Food Swaps',
      tag: 'Smart Swaps',
      desc: 'Find low-glycemic, low-calorie nutrient-dense alternatives for refined carbs, sugars, and oils.',
      icon: <ArrowLeftRight className="w-5 h-5 text-emerald-700" />,
      border: 'border-emerald-500/25',
      badge: 'bg-emerald-100 text-emerald-900',
    },
  ];

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* 1. Main Hero Card with High-Contrast Text & Plated Dish Visual */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-12 mb-12 bg-white/85 backdrop-blur-xl border border-emerald-600/25 border-b-2 border-b-amber-500/40 shadow-xl shadow-emerald-950/10">
        
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>GOOD FOOD, GOOD MOOD</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-black text-emerald-950 tracking-tight leading-[1.15]">
              Delicious Food:{' '}
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-700 bg-clip-text text-transparent">
                Made with Love ❤
              </span>
            </h1>

            <p className="text-stone-700 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Fresh ingredients, authentic flavors, and clinically verified metabolic balance. 
              Transform everyday pantry staples into tailored culinary art that nourishes your body.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('text-recipe')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-900/15 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Start Cooking</span>
                <ArrowRight className="w-4 h-4 text-stone-950" />
              </button>

              {!username && (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/15 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>

            {/* Quality Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4 text-xs font-semibold text-emerald-950 border-t border-stone-200/80">
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-emerald-700" />
                <span>Expert AI Chef</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Zero-Waste Pantry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Clinical Guardrails</span>
              </div>
            </div>
          </div>

          {/* Right Visual Column (Populates the empty circle with food photography) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80">
              
              {/* Outer Golden Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-emerald-400 p-1.5 shadow-2xl shadow-emerald-950/15 animate-in zoom-in duration-700">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-inner bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
                    alt="Nutritious Plated Culinary Dish"
                    className="w-full h-full object-cover filter contrast-105 saturate-110"
                  />
                </div>
              </div>

              {/* Floating Calorie / Balance Badge */}
              <div className="absolute -bottom-2 right-4 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-amber-500/30 shadow-lg text-emerald-950 text-xs font-bold">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>~450 kcal Balanced</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Feature Showcase Cards Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-serif font-bold text-emerald-950 mb-1">
          Explore RasoiAI Capabilities
        </h2>
        <p className="text-xs text-stone-600">
          From pantry leftovers to clinical nutrition algorithms, choose your tool.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`bg-white/90 backdrop-blur-md rounded-2xl p-6 border ${item.border} hover:border-emerald-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-950/5 flex flex-col justify-between cursor-pointer group`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.badge}`}>
                  {item.tag}
                </span>
              </div>

              <h3 className="font-serif font-bold text-base text-emerald-950 mb-1.5 group-hover:text-emerald-700 transition-colors">
                {item.title}
              </h3>

              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                {item.desc}
              </p>
            </div>

            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 group-hover:text-amber-700 transition-colors">
              <span>Open Feature</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}