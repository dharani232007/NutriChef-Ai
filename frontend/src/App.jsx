import React, { useState, useEffect, useRef } from 'react';
import FloatingFoodBackground from './components/FloatingFoodBackground';
import HomePage from './components/HomePage';
import UserDashboard from './components/UserDashboard';
import AuthModal from './components/AuthModal';
import HealthProfileModal from './components/HealthProfileModal';
import MobileHelpModal from './components/MobileHelpModal';
import NutriChefLogo from './components/NutriChefLogo';

// Tabs
import SimpleRecipeTab from './components/SimpleRecipeTab';
import ImageRecipeTab from './components/ImageRecipeTab';
import HealthRecipeTab from './components/HealthRecipeTab';
import DietTrackerTab from './components/DietTrackerTab';
import HealthySwapTab from './components/HealthySwapTab';

import { 
  ChefHat, 
  Camera, 
  HeartPulse, 
  Activity, 
  ArrowLeftRight, 
  Home, 
  User, 
  LogOut, 
  ChevronDown,
  Lock,
  HelpCircle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Require explicit login per browser visit/tab load so public landing page is shown first
  const [username, setUsername] = useState(() => {
    return sessionStorage.getItem('NutriChef_username') || sessionStorage.getItem('rasoi_username') || '';
  });

  // Profile Avatar Image State
  const [profileImage, setProfileImage] = useState(() => {
    const active = (sessionStorage.getItem('NutriChef_username') || sessionStorage.getItem('rasoi_username') || '').trim().toLowerCase();
    if (!active) return null;
    
    const savedDirectImg = localStorage.getItem(`profile_image_${active}`) || localStorage.getItem(`avatar_${active}`);
    if (savedDirectImg) return savedDirectImg;

    try {
      const stored = localStorage.getItem(`profile_data_${active}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.profile?.image || parsed?.image || parsed?.avatar_url || null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const dropdownRef = useRef(null);

  // Function to sync profile avatar
  const syncAvatar = (activeName) => {
    const clean = (activeName || username).trim().toLowerCase();
    if (!clean) {
      setProfileImage(null);
      return;
    }

    const savedDirectImg = localStorage.getItem(`profile_image_${clean}`) || localStorage.getItem(`avatar_${clean}`);
    if (savedDirectImg) {
      setProfileImage(savedDirectImg);
      return;
    }

    try {
      const stored = localStorage.getItem(`profile_data_${clean}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const img = parsed?.profile?.image || parsed?.image || parsed?.avatar_url || null;
        if (img) {
          setProfileImage(img);
          return;
        }
      }
    } catch {
      // fallback if JSON parse fails
    }

    // Dynamic backend call using environment variable
    fetch(`${API_BASE_URL}/api/user-profile/${encodeURIComponent(clean)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.profile?.image || data?.profile?.avatar_url) {
          const img = data.profile.image || data.profile.avatar_url;
          setProfileImage(img);
          localStorage.setItem(`profile_image_${clean}`, img);
        }
      })
      .catch(() => {});
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync profile completion, avatar & trigger mobile guide on first phone visit
  useEffect(() => {
    if (username) {
      const clean = username.trim().toLowerCase();
      syncAvatar(clean);

      const profileSet = localStorage.getItem(`profile_set_${clean}`);
      if (!profileSet) {
        setIsProfileOpen(true);
      }
    } else {
      setProfileImage(null);
    }

    // Auto-open help modal for first-time mobile visitors
    const isMobileDevice = window.innerWidth <= 768;
    const hasSeenGuide = localStorage.getItem('nutrichef_seen_mobile_guide');
    if (isMobileDevice && !hasSeenGuide) {
      setIsHelpOpen(true);
      localStorage.setItem('nutrichef_seen_mobile_guide', 'true');
    }

    // Listen for custom profile and avatar update events
    const handleProfileUpdate = (e) => {
      const updatedProfile = e.detail?.profile || e.detail;
      const newImg = updatedProfile?.image || updatedProfile?.avatar_url || e.detail?.avatar;
      if (newImg) {
        setProfileImage(newImg);
        const clean = (username || sessionStorage.getItem('NutriChef_username') || '').trim().toLowerCase();
        if (clean) {
          localStorage.setItem(`profile_image_${clean}`, newImg);
          localStorage.setItem(`avatar_${clean}`, newImg);
        }
      } else {
        syncAvatar();
      }
    };

    const handleAvatarUpdate = (e) => {
      if (e.detail && e.detail.avatar) {
        setProfileImage(e.detail.avatar);
      }
    };

    window.addEventListener('user_profile_updated', handleProfileUpdate);
    window.addEventListener('avatar_updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('user_profile_updated', handleProfileUpdate);
      window.removeEventListener('avatar_updated', handleAvatarUpdate);
    };
  }, [username]);

  // Safe tab switcher: blocks unauthenticated guests from feature tabs
  const handleTabClick = (tabId) => {
    if (tabId !== 'home' && !username) {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (loggedUsername, isLogin) => {
    const cleanUser = loggedUsername.trim().toLowerCase();
    setUsername(cleanUser);
    
    // Store active login in sessionStorage so a fresh visit requires login
    sessionStorage.setItem('NutriChef_username', cleanUser);
    sessionStorage.setItem('rasoi_username', cleanUser);

    // Keep persistent accounts ready for future fast lookup
    localStorage.setItem('NutriChef_username', cleanUser);
    localStorage.setItem('rasoi_username', cleanUser);

    sessionStorage.removeItem('last_pantry_recipe');
    sessionStorage.removeItem('last_health_recipe');

    syncAvatar(cleanUser);

    const profileSet = localStorage.getItem(`profile_set_${cleanUser}`);
    if (!profileSet || !isLogin) {
      setIsProfileOpen(true);
    }
  };

  const handleLogout = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Clear active session identifiers
    sessionStorage.removeItem('NutriChef_username');
    sessionStorage.removeItem('rasoi_username');
    sessionStorage.clear();

    localStorage.removeItem('NutriChef_username');
    localStorage.removeItem('rasoi_username');

    setUsername('');
    setProfileImage(null);
    setIsDropdownOpen(false);
    setActiveTab('home');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'text-recipe', label: 'Pantry Chef', icon: <ChefHat className="w-4 h-4" /> },
    { id: 'image-recipe', label: 'Scan Dish', icon: <Camera className="w-4 h-4" /> },
    { id: 'personalized', label: 'Health Recipes', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'diet-tracker', label: 'Diet Tracker', icon: <Activity className="w-4 h-4" /> },
    { id: 'swaps', label: 'Swaps', icon: <ArrowLeftRight className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#faf7f0] font-sans relative selection:bg-[#4d6b53] selection:text-white pb-20 md:pb-0">
      {/* Background with active tab state passing */}
      <FloatingFoodBackground activeTab={activeTab} />

      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#faf7f0]/85 border-b border-[#4d6b53]/15 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* App Brand with Custom Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="cursor-pointer"
          >
            <NutriChefLogo size={40} showText={true} />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#4d6b53] text-white font-semibold shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id !== 'home' && !username && (
                  <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
                )}
              </button>
            ))}
          </nav>

          {/* Action Header: Help & Auth Profile */}
          <div className="flex items-center gap-2">
            {/* Mobile Help Button */}
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Help & Guide"
            >
              <HelpCircle className="w-4 h-4 text-[#4d6b53]" />
            </button>

            {/* Profile Dropdown / Login */}
            <div className="relative" ref={dropdownRef}>
              {username ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#4d6b53]/25 text-[#2a3c2e] text-xs font-semibold shadow-xs hover:bg-stone-50 transition-all cursor-pointer"
                  >
                    {/* Dynamic Profile Avatar */}
                    <div className="w-6 h-6 rounded-full bg-[#4d6b53]/15 flex items-center justify-center text-[#4d6b53] overflow-hidden border border-[#4d6b53]/30 shrink-0">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={username} 
                          className="w-full h-full object-cover"
                          onError={() => setProfileImage(null)}
                        />
                      ) : (
                        <User className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <span className="capitalize max-w-[80px] sm:max-w-[120px] truncate">{username}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-stone-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#fcfaf5] rounded-2xl shadow-xl border border-[#4d6b53]/20 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-stone-200/60 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#4d6b53]/15 flex items-center justify-center text-[#4d6b53] overflow-hidden border border-[#4d6b53]/30 shrink-0">
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt={username} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-stone-500">Logged in as</p>
                          <p className="text-xs font-bold text-[#2a3c2e] truncate capitalize">{username}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfileOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-[#4d6b53]/10 hover:text-[#4d6b53] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4" />
                        <span>My Health Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-stone-200/60"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4d6b53] text-white text-xs font-semibold shadow-xs hover:bg-[#3e5743] transition-all cursor-pointer"
                >
                  Login / Signup
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 px-2 sm:px-0">
        {activeTab === 'home' && (
          username ? (
            <UserDashboard 
              username={username}
              onNavigate={(tab) => handleTabClick(tab)}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          ) : (
            <HomePage 
              onNavigate={(tab) => handleTabClick(tab)} 
              onOpenAuth={() => setIsAuthOpen(true)}
              username={username}
            />
          )
        )}

        {username && (
          <>
            {activeTab === 'text-recipe' && <SimpleRecipeTab username={username} />}
            {activeTab === 'image-recipe' && <ImageRecipeTab username={username} />}
            {activeTab === 'personalized' && (
              <HealthRecipeTab 
                username={username} 
                onOpenProfile={() => setIsProfileOpen(true)} 
              />
            )}
            {activeTab === 'diet-tracker' && <DietTrackerTab username={username} />}
            {activeTab === 'swaps' && <HealthySwapTab username={username} />}
          </>
        )}
      </main>

      {/* Native-Style Bottom Navigation Bar on Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fcfaf5]/95 backdrop-blur-lg border-t border-[#4d6b53]/20 py-2 px-1 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'text-[#4d6b53] font-bold' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-[#4d6b53]/15' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 truncate max-w-[56px] text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Help / Feature Walkthrough Modal */}
      <MobileHelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Profile Modal */}
      <HealthProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        username={username}
        onProfileSaved={(updatedData) => {
          const img = updatedData?.image || updatedData?.avatar_url;
          if (img) {
            setProfileImage(img);
            localStorage.setItem(`profile_image_${username}`, img);
            localStorage.setItem(`avatar_${username}`, img);
          } else {
            syncAvatar();
          }
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}