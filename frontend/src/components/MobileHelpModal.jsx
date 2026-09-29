import React, { useState } from 'react';
import { 
  X, 
  ChefHat, 
  Camera, 
  HeartPulse, 
  Activity, 
  ArrowLeftRight, 
  Mic, 
  Languages, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';

export default function MobileHelpModal({ isOpen, onClose }) {
  const [lang, setLang] = useState('en');
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const helpContent = {
    en: [
      {
        title: "Welcome to NutriChef Mobile!",
        desc: "Here is a quick guide to help you navigate and cook healthy, personalized meals easily on your phone.",
        icon: <ChefHat className="w-8 h-8 text-[#4d6b53]" />,
        tip: "Use the bottom navigation bar to switch between features."
      },
      {
        title: "Pantry Chef & Voice Input",
        desc: "Enter the ingredients you have at home. You don't have to type—tap the microphone button to dictate items in English or Tamil.",
        icon: <Mic className="w-8 h-8 text-rose-500" />,
        tip: "Tap '+ Add' or press enter to include multiple items."
      },
      {
        title: "Scan Dish with Camera",
        desc: "Take a photo of your cooked meal or ingredients directly from your phone camera. Our AI detects the dish and generates recipes.",
        icon: <Camera className="w-8 h-8 text-[#4d6b53]" />,
        tip: "Switch between English and Tamil anytime with the language toggle."
      },
      {
        title: "Clinical Health Recipes",
        desc: "Safe recipes adapted to medical conditions (Diabetes, Hypertension, Allergies) and personal fitness goals.",
        icon: <HeartPulse className="w-8 h-8 text-amber-600" />,
        tip: "Recipes calculate exact calories and nutrient splits."
      },
      {
        title: "Log to Diet Tracker",
        desc: "After generating or scanning any meal, tap 'Log to Diet Tracker' to log your breakfast, lunch, dinner, or snack portions in one click.",
        icon: <Activity className="w-8 h-8 text-emerald-600" />,
        tip: "Monitor your daily calories and progress in the Diet Tracker tab."
      },
      {
        title: "Healthy Nutritional Swaps",
        desc: "Find healthier alternatives for calorie-dense foods (e.g. white rice, potato chips) customized to weight loss or muscle building.",
        icon: <ArrowLeftRight className="w-8 h-8 text-[#4d6b53]" />,
        tip: "Includes calorie savings and dietitian rationale."
      }
    ],
    ta: [
      {
        title: "NutriChef மொபைல் வழிகாட்டி!",
        desc: "உங்கள் மொபைலில் ஆரோக்கியமான மற்றும் பாதுகாப்பான சமையல் குறிப்புகளைப் பெறுவதற்கான எளிய வழிகாட்டி.",
        icon: <ChefHat className="w-8 h-8 text-[#4d6b53]" />,
        tip: "அம்சங்களுக்கு இடையில் மாற கீழே உள்ள வழிசெலுத்தல் பட்டியைப் பயன்படுத்தவும்."
      },
      {
        title: "சமையல் பொருட்கள் & குரல் உள்ளீடு",
        desc: "உங்களிடம் உள்ள பொருட்களை உள்ளிடுங்கள். தட்டச்சு செய்யத் தேவையில்லை—மைக் பொத்தானை அழுத்தி தமிழில் பேசலாம்.",
        icon: <Mic className="w-8 h-8 text-rose-500" />,
        tip: "பொருட்களைச் சேர்க்க '+ Add' பொத்தானை அழுத்தவும்."
      },
      {
        title: "கேமரா மூலம் உணவு ஸ்கேனிங்",
        desc: "சமைத்த உணவு அல்லது பொருட்களின் புகைப்படத்தை உங்கள் கேமரா மூலம் நேரடியாகப் பதிவேற்றி செய்முறையைப் பெறுங்கள்.",
        icon: <Camera className="w-8 h-8 text-[#4d6b53]" />,
        tip: "தமிழ் மற்றும் ஆங்கிலத்திற்கு எளிதாக மாறலாம்."
      },
      {
        title: "மருத்துவ நல உணவு செய்முறைகள்",
        desc: "சர்க்கரை நோய், இரத்த அழுத்தம், ஒவ்வாமை போன்ற மருத்துவ நிலைகளுக்கு ஏற்ப பாதுகாப்பான செய்முறைகள்.",
        icon: <HeartPulse className="w-8 h-8 text-amber-600" />,
        tip: "துல்லியமான கலோரி மற்றும் ஊட்டச்சத்து விவரங்கள்."
      },
      {
        title: "டயட் டிராக்கரில் பதிவு செய்க",
        desc: "உணவை உருவாக்கியதும், 'டயட் டிராக்கரில் சேர்க்க' பொத்தானைத் தட்டி உங்கள் அன்றாட உணவில் எளிதாகப் பதிவு செய்யலாம்.",
        icon: <Activity className="w-8 h-8 text-emerald-600" />,
        tip: "உங்கள் அன்றாட கலோரி அளவை டிராக்கரில் கண்காணிக்கவும்."
      },
      {
        title: "ஊட்டச்சத்து மாற்று உணவுகள்",
        desc: "அதிக கலோரி கொண்ட உணவுகளுக்கு பதிலாக சத்தான மாற்று உணவுகளை உடனுக்குடன் கண்டறியலாம்.",
        icon: <ArrowLeftRight className="w-8 h-8 text-[#4d6b53]" />,
        tip: "கலோரி சேமிப்பு மற்றும் ஊட்டச்சத்து விளக்கங்கள் கிடைக்கும்."
      }
    ]
  };

  const steps = helpContent[lang];
  const current = steps[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#fcfaf5] rounded-3xl p-6 w-full max-w-sm border border-[#4d6b53]/20 shadow-2xl relative text-stone-800 flex flex-col justify-between min-h-[420px]">
        
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 bg-white cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Body */}
        <div className="flex-1 flex flex-col items-center text-center justify-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-[#4d6b53]/15 flex items-center justify-center mb-4">
            {current.icon}
          </div>

          <h3 className="font-serif font-bold text-lg text-[#2a3c2e] mb-2">
            {current.title}
          </h3>

          <p className="text-xs text-stone-600 leading-relaxed mb-4 px-2">
            {current.desc}
          </p>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 text-left w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{current.tip}</span>
          </div>
        </div>

        {/* Pagination Dots & Navigation */}
        <div className="mt-4 pt-3 border-t border-stone-200">
          <div className="flex justify-center gap-1.5 mb-3">
            {steps.map((_, idx) => (
              <span 
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeStep ? 'w-6 bg-[#4d6b53]' : 'w-1.5 bg-stone-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="flex-1 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white cursor-pointer"
              >
                {lang === 'ta' ? 'முந்தைய' : 'Back'}
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="flex-1 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
              >
                <span>{lang === 'ta' ? 'அடுத்தது' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                {lang === 'ta' ? 'தொடங்குக' : 'Got it, Let’s Cook!'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}