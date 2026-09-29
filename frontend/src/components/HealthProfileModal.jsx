import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  X, 
  Camera, 
  Edit3, 
  LogOut, 
  Plus, 
  ArrowLeft 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HealthProfileModal({ isOpen, onClose, username, onProfileSaved, onLogout }) {
  const activeUser = (username || 'guest').trim().toLowerCase();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculatedTargets, setCalculatedTargets] = useState(null);

  // Profile Image Avatar
  const [avatar, setAvatar] = useState('');

  // Form Profile State
  const [profile, setProfile] = useState({
    user_id: activeUser,
    age: '',
    gender: 'female',
    height_cm: '',
    weight_kg: '',
    activity_level: 'moderate',
    health_goal: 'maintain_weight',
    health_conditions: [],
    allergies: [],
  });

  const [showOtherCond, setShowOtherCond] = useState(false);
  const [customCond, setCustomCond] = useState('');
  const [showOtherAllg, setShowOtherAllg] = useState(false);
  const [customAllg, setCustomAllg] = useState('');

  const standardConditions = ['diabetes', 'high_blood_pressure', 'cholesterol', 'pcos', 'thyroid'];
  const standardAllergies = ['peanuts', 'dairy', 'gluten', 'shellfish', 'soy'];

  // Normalize and apply incoming profile data from SQLite or localStorage
  const applyProfileData = (rawProfile, rawTargets) => {
    if (!rawProfile) return;
    
    // Safely parse health conditions
    let conds = [];
    if (typeof rawProfile.health_conditions === 'string') {
      try {
        const parsed = JSON.parse(rawProfile.health_conditions);
        conds = Array.isArray(parsed) ? parsed : rawProfile.health_conditions.split(',').map((c) => c.trim()).filter(Boolean);
      } catch {
        conds = rawProfile.health_conditions.split(',').map((c) => c.trim()).filter(Boolean);
      }
    } else if (Array.isArray(rawProfile.health_conditions)) {
      conds = rawProfile.health_conditions;
    }

    // Safely parse allergies
    let allgs = [];
    if (typeof rawProfile.allergies === 'string') {
      try {
        const parsed = JSON.parse(rawProfile.allergies);
        allgs = Array.isArray(parsed) ? parsed : rawProfile.allergies.split(',').map((a) => a.trim()).filter(Boolean);
      } catch {
        allgs = rawProfile.allergies.split(',').map((a) => a.trim()).filter(Boolean);
      }
    } else if (Array.isArray(rawProfile.allergies)) {
      allgs = rawProfile.allergies;
    }

    // Extract custom conditions if they don't match standard buttons
    const customCondItems = conds.filter(c => !standardConditions.includes(c.toLowerCase()));
    if (customCondItems.length > 0) {
      setShowOtherCond(true);
      setCustomCond(customCondItems.join(', '));
    }

    // Extract custom allergies if they don't match standard buttons
    const customAllgItems = allgs.filter(a => !standardAllergies.includes(a.toLowerCase()));
    if (customAllgItems.length > 0) {
      setShowOtherAllg(true);
      setCustomAllg(customAllgItems.join(', '));
    }

    setProfile({
      user_id: activeUser,
      age: rawProfile.age !== undefined && rawProfile.age !== null ? String(rawProfile.age) : '',
      gender: rawProfile.gender || 'female',
      height_cm: rawProfile.height_cm !== undefined && rawProfile.height_cm !== null ? String(rawProfile.height_cm) : '',
      weight_kg: rawProfile.weight_kg !== undefined && rawProfile.weight_kg !== null ? String(rawProfile.weight_kg) : '',
      activity_level: rawProfile.activity_level || 'moderate',
      health_goal: rawProfile.health_goal || 'maintain_weight',
      health_conditions: conds,
      allergies: allgs,
    });

    if (rawTargets) {
      setCalculatedTargets(rawTargets);
    }
  };

  // Fetch profile on modal open: First checks localStorage, then fetches from SQLite
  useEffect(() => {
    if (!isOpen || !activeUser || activeUser === 'guest') return;

    // Load Avatar
    const savedAvatar = localStorage.getItem(`avatar_${activeUser}`);
    if (savedAvatar) setAvatar(savedAvatar);

    let hasLoadedLocal = false;
    const stored = localStorage.getItem(`profile_data_${activeUser}`);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const data = parsed.profile || parsed;
        if (data && (data.age || data.height_cm || data.weight_kg)) {
          applyProfileData(data, parsed.targets || null);
          setIsEditing(false);
          hasLoadedLocal = true;
        }
      } catch (err) {
        console.error("Error reading cached profile:", err);
      }
    }

    // Always sync with the SQLite Database to guarantee up-to-date data
    const fetchFromBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user-profile/${encodeURIComponent(activeUser)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.profile) {
            applyProfileData(data.profile, data.calculated_targets || null);
            setIsEditing(false);
            
            // Save clean copy to localStorage
            localStorage.setItem(`profile_data_${activeUser}`, JSON.stringify({
              profile: data.profile,
              targets: data.calculated_targets || null
            }));
            localStorage.setItem(`profile_set_${activeUser}`, 'true');
            return;
          }
        }
        if (!hasLoadedLocal) {
          setIsEditing(true);
        }
      } catch (err) {
        console.error("Backend fetch error:", err);
        if (!hasLoadedLocal) setIsEditing(true);
      }
    };

    fetchFromBackend();
  }, [isOpen, activeUser]);

  if (!isOpen) return null;

  // Safe avatar compressor before saving to localStorage
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(dataUrl);
        try {
          localStorage.setItem(`avatar_${activeUser}`, dataUrl);
        } catch (storageErr) {
          console.warn('Avatar could not be stored in localStorage due to size quota:', storageErr);
        }

        // Dispatch event so App.jsx header updates in real-time
        window.dispatchEvent(new CustomEvent('avatar_updated', {
          detail: { avatar: dataUrl, user_id: activeUser }
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const toggleCondition = (cond) => {
    setProfile((prev) => ({
      ...prev,
      health_conditions: prev.health_conditions.includes(cond)
        ? prev.health_conditions.filter((c) => c !== cond)
        : [...prev.health_conditions, cond],
    }));
  };

  const toggleAllergy = (allg) => {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allg)
        ? prev.allergies.filter((a) => a !== allg)
        : [...prev.allergies, allg],
    }));
  };

  const handleLogoutAction = () => {
    if (onLogout) onLogout();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const mergedConds = [...profile.health_conditions];
    if (showOtherCond && customCond.trim()) {
      const customSplits = customCond.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      customSplits.forEach(cleaned => {
        if (!mergedConds.includes(cleaned)) mergedConds.push(cleaned);
      });
    }

    const mergedAllgs = [...profile.allergies];
    if (showOtherAllg && customAllg.trim()) {
      const customSplits = customAllg.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      customSplits.forEach(cleaned => {
        if (!mergedAllgs.includes(cleaned)) mergedAllgs.push(cleaned);
      });
    }

    const payload = {
      ...profile,
      user_id: activeUser,
      age: Number(profile.age) || 25,
      height_cm: Number(profile.height_cm) || 165,
      weight_kg: Number(profile.weight_kg) || 60,
      health_conditions: mergedConds,
      allergies: mergedAllgs,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/user-profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let targets = {
        meal_calories: Math.round(payload.weight_kg * 24 * 0.3),
        protein_g: Math.round(payload.weight_kg * 0.8),
        carbs_g: 50,
        fat_g: 15,
      };

      if (res.ok) {
        const data = await res.json();
        if (data.calculated_targets) targets = data.calculated_targets;
      }

      setCalculatedTargets(targets);
      applyProfileData(payload, targets);

      // Persist to local storage
      const fullProfilePackage = { profile: payload, targets };
      localStorage.setItem(`profile_data_${activeUser}`, JSON.stringify(fullProfilePackage));
      localStorage.setItem(`profile_set_${activeUser}`, 'true');

      // Dispatch real-time global event so HealthRecipeTab updates instantly
      window.dispatchEvent(new CustomEvent('user_profile_updated', {
        detail: {
          user_id: activeUser,
          profile: payload,
          targets: targets
        }
      }));

      if (onProfileSaved) onProfileSaved(payload);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      applyProfileData(payload, calculatedTargets);
      localStorage.setItem(`profile_data_${activeUser}`, JSON.stringify({ profile: payload }));
      localStorage.setItem(`profile_set_${activeUser}`, 'true');

      window.dispatchEvent(new CustomEvent('user_profile_updated', {
        detail: {
          user_id: activeUser,
          profile: payload,
          targets: calculatedTargets
        }
      }));

      if (onProfileSaved) onProfileSaved(payload);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-[#fcfaf5] rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-[#4d6b53]/20 shadow-2xl max-h-[92vh] overflow-y-auto text-stone-800 relative">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!isEditing ? (
          <div>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative group mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#4d6b53] shadow-md bg-stone-100 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <HeartPulse className="w-10 h-10 text-[#4d6b53]" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-[#4d6b53] text-white rounded-full cursor-pointer hover:bg-[#3d5642] shadow">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>

              <h3 className="text-2xl font-serif font-bold text-[#2a3c2e] capitalize">{activeUser}</h3>
              <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-[#4d6b53]/10 text-[#4d6b53] mt-1 capitalize">
                Goal: {profile.health_goal ? profile.health_goal.replace(/_/g, ' ') : 'Maintain Weight'}
              </span>
            </div>

            {calculatedTargets && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-stone-500">Meal Energy Budget</div>
                  <div className="text-xl font-bold text-[#2a3c2e] mt-0.5">
                    ~{calculatedTargets.meal_calories} <span className="text-xs font-normal">kcal</span>
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-sm text-center">
                  <div className="text-[11px] font-semibold text-stone-500">Target Protein</div>
                  <div className="text-xl font-bold text-[#4d6b53] mt-0.5">
                    {calculatedTargets.protein_g}g
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 border border-stone-200 text-xs space-y-2.5 mb-5">
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Age / Gender:</span>
                <span className="font-semibold text-stone-800">
                  {profile.age ? `${profile.age} yrs` : '--'} • {profile.gender}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Height & Weight:</span>
                <span className="font-semibold text-stone-800">
                  {profile.height_cm ? `${profile.height_cm} cm` : '--'} • {profile.weight_kg ? `${profile.weight_kg} kg` : '--'}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Activity Level:</span>
                <span className="font-semibold text-stone-800 capitalize">
                  {profile.activity_level ? profile.activity_level.replace(/_/g, ' ') : 'Moderate'}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 pb-2">
                <span className="text-stone-500">Health Conditions:</span>
                <span className="font-semibold text-stone-800">
                  {profile.health_conditions && profile.health_conditions.length > 0 
                    ? profile.health_conditions.join(', ') 
                    : 'None registered'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Allergies:</span>
                <span className="font-semibold text-stone-800">
                  {profile.allergies && profile.allergies.length > 0 
                    ? profile.allergies.join(', ') 
                    : 'None registered'}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-stone-300"
                >
                  <Edit3 className="w-4 h-4 text-stone-600" />
                  <span>Update Details</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-xs shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer"
                >
                  Back to Cooking
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogoutAction}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of NutriChef</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {localStorage.getItem(`profile_set_${activeUser}`) && (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)} 
                    className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h3 className="text-xl font-serif font-bold text-[#2a3c2e]">
                  {localStorage.getItem(`profile_set_${activeUser}`) ? 'Edit Health Profile' : 'Configure Health Profile'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-5 p-3 bg-white rounded-2xl border border-stone-200">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-[#4d6b53] bg-stone-50 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-stone-400" />
                )}
              </div>
              <div>
                <label className="px-3 py-1.5 rounded-lg bg-[#4d6b53]/10 hover:bg-[#4d6b53]/20 text-[#4d6b53] text-xs font-semibold cursor-pointer">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                <div className="text-[10px] text-stone-400 mt-1">JPEG or PNG recommended</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="120"
                    placeholder="e.g. 25"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#4d6b53]"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="250"
                    placeholder="e.g. 165"
                    value={profile.height_cm}
                    onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    max="300"
                    placeholder="e.g. 60"
                    value={profile.weight_kg}
                    onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#4d6b53]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Activity Level</label>
                  <select
                    value={profile.activity_level}
                    onChange={(e) => setProfile({ ...profile, activity_level: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#4d6b53]"
                  >
                    <option value="sedentary">Sedentary</option>
                    <option value="moderate">Moderate</option>
                    <option value="very_active">Very Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Health Goal</label>
                  <select
                    value={profile.health_goal}
                    onChange={(e) => setProfile({ ...profile, health_goal: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-[#4d6b53]"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_building">Muscle Gain</option>
                    <option value="maintain_weight">Maintain Weight</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Health Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {standardConditions.map((cond) => {
                    const active = profile.health_conditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCondition(cond)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#4d6b53] text-white border-[#4d6b53]'
                            : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {cond.replace(/_/g, ' ').toUpperCase()}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowOtherCond(!showOtherCond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                      showOtherCond ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>OTHER</span>
                  </button>
                </div>
                {showOtherCond && (
                  <input
                    type="text"
                    placeholder="Specify other condition (e.g. Asthma, Acid Reflux)"
                    value={customCond}
                    onChange={(e) => setCustomCond(e.target.value)}
                    className="mt-2 w-full bg-white border border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Allergies</label>
                <div className="flex flex-wrap gap-2">
                  {standardAllergies.map((allg) => {
                    const active = profile.allergies.includes(allg);
                    return (
                      <button
                        type="button"
                        key={allg}
                        onClick={() => toggleAllergy(allg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-700 text-white border-rose-700'
                            : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                        }`}
                      >
                        {allg.toUpperCase()}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowOtherAllg(!showOtherAllg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                      showOtherAllg ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>OTHER</span>
                  </button>
                </div>
                {showOtherAllg && (
                  <input
                    type="text"
                    placeholder="Specify other allergy (e.g. Mustard, Sesame)"
                    value={customAllg}
                    onChange={(e) => setCustomAllg(e.target.value)}
                    className="mt-2 w-full bg-white border border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {localStorage.getItem(`profile_set_${activeUser}`) && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs border border-stone-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white font-semibold text-sm shadow-md shadow-[#4d6b53]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Updating Database...' : 'Save & View Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}