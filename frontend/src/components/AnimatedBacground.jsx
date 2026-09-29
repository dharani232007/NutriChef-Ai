import React from 'react';

// Thematic food images and ingredient cutouts tailored for each tab
const PAGE_THEMES = {
  scan: [
    {
      src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80",
      alt: "Fresh Salad Bowl",
      style: "top-14 left-6 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-emerald-900/10"
    },
    {
      src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&auto=format&fit=crop&q=80",
      alt: "Grilled Plate",
      style: "top-20 right-8 w-26 h-26",
      animation: "animate-float-reverse",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=160&auto=format&fit=crop&q=80",
      alt: "Biryani & Rice",
      style: "bottom-12 left-8 w-28 h-28",
      animation: "animate-float-drift",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80",
      alt: "Rustic Pizza",
      style: "bottom-14 right-10 w-28 h-28",
      animation: "animate-float-slow",
      shadow: "shadow-stone-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=140&auto=format&fit=crop&q=80",
      alt: "Broccoli & Greens",
      style: "top-1/2 -left-4 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-reverse",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=140&auto=format&fit=crop&q=80",
      alt: "Quinoa Bowl",
      style: "top-1/2 -right-4 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-drift",
      shadow: "shadow-emerald-900/15"
    }
  ],
  pantry: [
    {
      src: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=160&auto=format&fit=crop&q=80",
      alt: "Raw Grains & Lentils",
      style: "top-16 left-6 w-24 h-24",
      animation: "animate-float-drift",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1506802913710-40e2e66339c9?w=160&auto=format&fit=crop&q=80",
      alt: "Fresh Eggs",
      style: "top-24 right-10 w-22 h-22",
      animation: "animate-float-slow",
      shadow: "shadow-stone-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=160&auto=format&fit=crop&q=80",
      alt: "Garden Carrots",
      style: "bottom-16 left-10 w-26 h-26",
      animation: "animate-float-reverse",
      shadow: "shadow-orange-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=160&auto=format&fit=crop&q=80",
      alt: "Baby Potatoes",
      style: "bottom-14 right-10 w-24 h-24",
      animation: "animate-float-drift",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1582515073490-39981397c445?w=140&auto=format&fit=crop&q=80",
      alt: "Aromatic Spices",
      style: "top-1/2 -left-3 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-slow",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=140&auto=format&fit=crop&q=80",
      alt: "Natural Honey",
      style: "top-1/2 -right-3 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-reverse",
      shadow: "shadow-amber-900/15"
    }
  ],
  health: [
    {
      src: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80",
      alt: "Organic Greens",
      style: "top-16 left-8 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=160&auto=format&fit=crop&q=80",
      alt: "Whole Grain Sourdough",
      style: "top-20 right-10 w-24 h-24",
      animation: "animate-float-drift",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=160&auto=format&fit=crop&q=80",
      alt: "Antioxidant Berries",
      style: "bottom-14 left-8 w-26 h-26",
      animation: "animate-float-reverse",
      shadow: "shadow-rose-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=160&auto=format&fit=crop&q=80",
      alt: "Steamed Edamame",
      style: "bottom-14 right-10 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=140&auto=format&fit=crop&q=80",
      alt: "Fresh Spinach",
      style: "top-1/2 -left-4 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-drift",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=140&auto=format&fit=crop&q=80",
      alt: "Heart-Healthy Walnuts",
      style: "top-1/2 -right-4 w-20 h-20 -translate-y-1/2",
      animation: "animate-float-reverse",
      shadow: "shadow-amber-900/15"
    }
  ],
  diet: [
    {
      src: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=160&auto=format&fit=crop&q=80",
      alt: "Macro Meal Prep",
      style: "top-16 left-6 w-26 h-26",
      animation: "animate-float-drift",
      shadow: "shadow-stone-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=160&auto=format&fit=crop&q=80",
      alt: "Balanced Plate",
      style: "top-20 right-8 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=160&auto=format&fit=crop&q=80",
      alt: "Healthy Protein Salad",
      style: "bottom-14 left-8 w-26 h-26",
      animation: "animate-float-reverse",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=160&auto=format&fit=crop&q=80",
      alt: "Avocado & Salmon",
      style: "bottom-14 right-10 w-24 h-24",
      animation: "animate-float-drift",
      shadow: "shadow-rose-900/15"
    }
  ],
  swaps: [
    {
      src: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&auto=format&fit=crop&q=80",
      alt: "Organic Basmati / Brown Rice",
      style: "top-16 left-6 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=160&auto=format&fit=crop&q=80",
      alt: "Himalayan Pink Salt",
      style: "top-20 right-8 w-24 h-24",
      animation: "animate-float-reverse",
      shadow: "shadow-rose-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=160&auto=format&fit=crop&q=80",
      alt: "Extra Virgin Olive Oil",
      style: "bottom-14 left-8 w-26 h-26",
      animation: "animate-float-drift",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=160&auto=format&fit=crop&q=80",
      alt: "Natural Whole Almonds",
      style: "bottom-14 right-10 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-amber-900/15"
    }
  ],
  home: [
    {
      src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80",
      alt: "Nutrient Bowl",
      style: "top-14 left-8 w-24 h-24",
      animation: "animate-float-slow",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=160&auto=format&fit=crop&q=80",
      alt: "Dinner Plate",
      style: "top-20 right-8 w-26 h-26",
      animation: "animate-float-reverse",
      shadow: "shadow-amber-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=160&auto=format&fit=crop&q=80",
      alt: "Green Vegetables",
      style: "bottom-14 left-8 w-24 h-24",
      animation: "animate-float-drift",
      shadow: "shadow-emerald-900/15"
    },
    {
      src: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=160&auto=format&fit=crop&q=80",
      alt: "Flavored Rice",
      style: "bottom-14 right-8 w-26 h-26",
      animation: "animate-float-slow",
      shadow: "shadow-amber-900/15"
    }
  ]
};

export default function AnimatedBackground({ activeTab = 'scan' }) {
  const currentItems = PAGE_THEMES[activeTab] || PAGE_THEMES.scan;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Soft ambient gradient washes */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#4d6b53]/10 blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors duration-1000" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#c28c46]/10 blur-3xl translate-x-1/3 translate-y-1/3 transition-colors duration-1000" />
      <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl translate-x-1/2 transition-colors duration-1000" />

      {/* Dynamic floating culinary elements */}
      {currentItems.map((item, idx) => (
        <div
          key={`${activeTab}-${idx}`}
          className={`absolute ${item.style} ${item.animation} transition-all duration-700 ease-out`}
        >
          <div className="relative group w-full h-full p-1 rounded-full bg-white/70 backdrop-blur-xs border border-white/80 shadow-lg">
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              className="w-full h-full object-cover rounded-full filter brightness-95 contrast-105"
            />
          </div>
        </div>
      ))}
    </div>
  );
}