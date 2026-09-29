import React from 'react';

export default function FloatingFoodBackground({ activeTab = 'home' }) {
  // 8 non-overlapping, evenly-spaced culinary assets per tab
  // 4 placed cleanly along the left column and 4 along the right column
  const tabAssets = {
    home: [
      // Left Column (top to bottom)
      { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Fresh Greens
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Balanced Bowl
      { img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Lentils & Grains
      { img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Saute Plate

      // Right Column (top to bottom)
      { img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Aromatic Spices
      { img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // Farm Tomatoes
      { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Nutritious Bowl
      { img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Citrus & Spices
    ],

    'text-recipe': [
      // Left Column
      { img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Dal & Pulses
      { img: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Garlic & Seasoning
      { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Garden Greens
      { img: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Pure Turmeric

      // Right Column
      { img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Red Tomatoes
      { img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // Star Anise & Spices
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Quinoa Bowl
      { img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Sliced Lemon
    ],

    'image-recipe': [
      // Left Column
      { img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Gourmet Pasta
      { img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Pan Sauté
      { img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Stone Oven Pizza
      { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Crisp Salad

      // Right Column
      { img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Plated Pancakes
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // Veggie Bowl
      { img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Warm Spices
      { img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Fresh Produce
    ],

    'personalized': [
      // Left Column
      { img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Macro Salad
      { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Nutrient Veg
      { img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Protein Dal
      { img: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Herb Prep

      // Right Column
      { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Green Leaf
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // Protein Bowl
      { img: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Anti-Inflammatory
      { img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Lemon Antioxidant
    ],

    'diet-tracker': [
      // Left Column
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Grain Bowl
      { img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Fiber Salad
      { img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Legume Protein
      { img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Clean Skillet

      // Right Column
      { img: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Carb Balance
      { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // High-Micro
      { img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Garden Fresh
      { img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Vitamin Boost
    ],

    'swaps': [
      // Left Column
      { img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'left', anim: 'animate-float-1' }, // Raw Greens
      { img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'left', anim: 'animate-float-3' }, // Whole Foods
      { img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'left', anim: 'animate-float-2' }, // Slow Carbs
      { img: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'left', anim: 'animate-float-4' }, // Golden Spices

      // Right Column
      { img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80', top: '10%', side: 'right', anim: 'animate-float-2' }, // Swap Alternative
      { img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&auto=format&fit=crop&q=80', top: '34%', side: 'right', anim: 'animate-float-4' }, // Low Glycemic
      { img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80', top: '58%', side: 'right', anim: 'animate-float-1' }, // Seasoning
      { img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80', top: '82%', side: 'right', anim: 'animate-float-3' }, // Natural Flavor
    ]
  };

  const currentItems = tabAssets[activeTab] || tabAssets.home;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-[#f6faf7] via-[#fbf7f1] to-[#f2f8f5]">
      {/* Ambient Radial Backlights */}
      <div className="absolute -top-28 -left-28 w-[650px] h-[650px] glow-emerald-ambient rounded-full filter blur-3xl opacity-75" />
      <div className="absolute top-1/4 -right-28 w-[700px] h-[700px] glow-coral-ambient rounded-full filter blur-3xl opacity-65" />
      <div className="absolute -bottom-32 left-1/3 w-[750px] h-[750px] glow-mint-accent rounded-full filter blur-3xl opacity-50" />

      {/* Floating Elements - strictly formatted with uniform size, uniform margin, and continuous smooth motion */}
      {currentItems.map((item, idx) => {
        const positionStyle = {
          top: item.top,
          ...(item.side === 'left' ? { left: '3.5%' } : { right: '3.5%' })
        };

        return (
          <div
            key={`${activeTab}-${idx}`}
            style={positionStyle}
            className={`absolute select-none opacity-80 hover:opacity-100 transition-opacity duration-500 w-24 h-24 sm:w-28 sm:h-28 ${item.anim}`}
          >
            <div className="w-full h-full rounded-full p-[2.5px] bg-gradient-to-tr from-emerald-500/50 via-amber-400/40 to-emerald-400/20 shadow-xl shadow-emerald-950/10">
              <img
                src={item.img}
                alt="Floating Culinary Asset"
                className="w-full h-full object-cover rounded-full border border-white/95 filter contrast-105 saturate-110"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}