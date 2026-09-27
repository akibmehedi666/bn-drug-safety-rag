import React, { useState } from 'react';
import { User, Check, Sparkles, AlertCircle, ShieldAlert, Heart, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfileScreen = () => {
  const { lang, t, profile, updateProfile } = useApp();
  const [stage, setStage] = useState(profile.stage);
  const [week, setWeek] = useState(profile.week);
  const [allergies, setAllergies] = useState(profile.allergies || []);
  const [conditions, setConditions] = useState(profile.conditions || []);
  const [savedToast, setSavedToast] = useState(false);

  const allergyOptions = ["Penicillin", "Sulfa Drugs", "Aspirin / NSAIDs", "Dust & Pollen", "Prawns / Seafood"];
  const conditionOptions = ["Mild Anemia", "Gestational Diabetes", "High Blood Pressure (BP)", "Asthma / Breathing"];

  const toggleAllergy = (item) => {
    setAllergies(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleCondition = (item) => {
    setConditions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ stage, week, allergies, conditions });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-maternal-500" />
          <span>{t.profileTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {t.profileSubtitle}
        </p>
      </div>

      {/* Toast Feedback */}
      {savedToast && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2 animate-in slide-in-from-top duration-300">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t.profileSavedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Stage Selector */}
        <div className="bg-cream-card p-5 rounded-3xl border border-maternal-200/70 shadow-warm-sm space-y-3">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
            {t.stageSelectLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: '1st', label: t.stage1st, icon: '🌱' },
              { id: '2nd', label: t.stage2nd, icon: '🌸' },
              { id: '3rd', label: t.stage3rd, icon: '👶' },
              { id: 'lactation', label: t.stageLactation, icon: '🤱' },
            ].map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => setStage(item.id)}
                className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-semibold flex items-center space-x-3 transition-all ${
                  stage === item.id 
                    ? 'bg-maternal-500 text-white border-maternal-600 shadow-warm-sm ring-2 ring-maternal-200' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-maternal-300'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="leading-snug">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pregnancy Week Stepper */}
        <div className="bg-cream-card p-5 rounded-3xl border border-maternal-200/70 shadow-warm-sm space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {t.currentWeekLabel}
            </label>
            <span className="text-lg font-bold text-maternal-600 bg-maternal-100 px-3 py-1 rounded-full border border-maternal-200">
              {lang === 'bn' ? `${week}তম সপ্তাহ` : `Week ${week}`}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="42"
            value={week}
            onChange={(e) => setWeek(parseInt(e.target.value))}
            className="w-full accent-maternal-500 h-2 bg-maternal-100 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-gray-400 font-medium">
            <span>Week 1 (Conception)</span>
            <span>Week 20 (Mid)</span>
            <span>Week 40+ (Delivery)</span>
          </div>
        </div>

        {/* Allergies Tag Selector */}
        <div className="bg-cream-card p-5 rounded-3xl border border-maternal-200/70 shadow-warm-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{t.allergiesLabel}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {allergyOptions.map((item) => {
              const isSelected = allergies.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleAllergy(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                  }`}
                >
                  {isSelected ? `✓ ${item}` : `+ ${item}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing Conditions Toggle */}
        <div className="bg-cream-card p-5 rounded-3xl border border-maternal-200/70 shadow-warm-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <Heart className="w-4 h-4 text-maternal-500" />
            <span>{t.conditionsLabel}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {conditionOptions.map((item) => {
              const isSelected = conditions.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleCondition(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-sage-600 text-white border-sage-700 shadow-xs'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-sage-300'
                  }`}
                >
                  {isSelected ? `✓ ${item}` : `+ ${item}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-maternal-500 hover:bg-maternal-600 text-white font-bold text-sm sm:text-base shadow-warm-md flex items-center justify-center space-x-2 active:scale-98 transition-transform"
        >
          <Save className="w-5 h-5" />
          <span>{t.saveProfile}</span>
        </button>

      </form>
    </div>
  );
};

export default ProfileScreen;
