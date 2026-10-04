import React, { useState } from 'react';
import { 
  CheckSquare, 
  Flame, 
  Plus, 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Check, 
  X, 
  Sparkles, 
  Percent,
  Trash2,
  Calendar
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TrackerScreen = () => {
  const { 
    lang, 
    t, 
    trackerItems, 
    toggleTrackerItem, 
    addTrackerItem, 
    removeTrackerItem, 
    streakDays, 
    adherencePct, 
    prenatalSupplementSuggestions,
    profile,
    setWeek
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [time, setTime] = useState('morning');

  const completedCount = trackerItems.filter(i => i.done).length;
  const totalCount = trackerItems.length;
  const percentToday = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getTimeIcon = (tPeriod) => {
    switch (tPeriod) {
      case 'morning': return <Sunrise className="w-4 h-4 text-amber-500" />;
      case 'afternoon': return <Sun className="w-4 h-4 text-orange-500" />;
      case 'evening': return <Sunset className="w-4 h-4 text-rose-500" />;
      case 'night': return <Moon className="w-4 h-4 text-indigo-500" />;
      default: return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  const getTimeLabel = (tPeriod) => {
    switch (tPeriod) {
      case 'morning': return t.timeMorning;
      case 'afternoon': return t.timeAfternoon;
      case 'evening': return t.timeEvening;
      case 'night': return t.timeNight;
      default: return t.timeMorning;
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (nameEn.trim()) {
      addTrackerItem(nameEn, nameBn || nameEn, time);
      setNameEn('');
      setNameBn('');
      setShowAddModal(false);
    }
  };

  const handleQuickAdd = (sug) => {
    addTrackerItem(sug.nameEn, sug.nameBn, sug.time, sug.nutrientKey);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-maternal-500" />
            <span>{t.trackerTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {t.trackerSubtitle}
          </p>
        </div>

        {/* Real Streak & Adherence Display */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 shadow-xs font-bold text-xs" title="Consecutive completed days">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse" />
            <span>{streakDays} {t.days}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 shadow-xs font-bold text-xs" title="Overall Adherence Rate">
            <Percent className="w-3.5 h-3.5 text-emerald-600" />
            <span>{adherencePct}% {lang === 'bn' ? 'নিয়মিত' : 'Adherence'}</span>
          </div>
        </div>
      </div>

      {/* Progress & Adherence Dual Card */}
      <div className="bg-gradient-to-r from-maternal-500 to-rose-500 rounded-3xl p-5 text-white shadow-warm-md space-y-4">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-rose-100">
          <span>{t.trackerProgressTitle}</span>
          <span>{completedCount} / {totalCount} {t.completed}</span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight">{percentToday}%</span>
          <div className="text-right">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full border border-white/25">
              {streakDays > 0 
                ? (lang === 'bn' ? `🔥 টানা ${streakDays} দিন সম্পন্ন` : `🔥 ${streakDays}-Day Streak Active`) 
                : (lang === 'bn' ? 'আজকের প্রথম ডোজ নিন' : 'Start your streak today')}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5">
          <div 
            className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${percentToday}%` }}
          />
        </div>

        <div className="pt-1 flex items-center justify-between text-xs text-rose-100 border-t border-white/15">
          <span>
            {lang === 'bn' ? `গর্ভাবস্থার ${profile.week || 1}তম সপ্তাহ চলছে` : `Pregnancy Week ${profile.week || 1}`}
          </span>
          <span className="font-semibold">
            {lang === 'bn' ? `মোট ধারাবাহিকতা: ${adherencePct}%` : `Overall Adherence: ${adherencePct}%`}
          </span>
        </div>
      </div>

      {/* FIRST RUN / EMPTY STATE SETUP PROMPT */}
      {trackerItems.length === 0 && (
        <div className="bg-gradient-to-br from-cream-card via-amber-50/50 to-maternal-50/50 rounded-3xl p-6 border-2 border-dashed border-maternal-300 text-center space-y-4 shadow-warm-xs">
          <div className="w-12 h-12 rounded-2xl bg-maternal-100 text-maternal-600 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-gray-900">
              {t.setupTitle || (lang === 'bn' ? 'গর্ভমায়ায় আপনাকে স্বাগতম' : 'Welcome to GorbhoMaya')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {t.emptyTrackerPrompt || (lang === 'bn' 
                ? 'এখনও কোনো ওষুধ বা ভিটামিন যোগ করা হয়নি। নিয়মিত সেবন ট্র্যাক করতে নিচের প্রয়োজনীয় ভিটামিনগুলো এক ট্যাপে যোগ করুন।' 
                : 'No daily supplements added yet. Tap any common prenatal supplement below to add it in one tap.')}
            </p>
          </div>

          {/* Quick pregnancy week setup */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-maternal-200 text-xs text-gray-700 shadow-2xs">
            <span className="font-bold">{lang === 'bn' ? 'বর্তমান সপ্তাহ:' : 'Current Week:'}</span>
            <input 
              type="number" 
              min="1" 
              max="42" 
              value={profile.week || 1} 
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-maternal-300 rounded-lg text-center font-bold text-maternal-700 outline-hidden"
            />
          </div>
        </div>
      )}

      {/* ONE-TAP PRENATAL SUPPLEMENT SUGGESTIONS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-maternal-500" />
            <span>{t.commonPrenatalSupplements || (lang === 'bn' ? 'প্রচলিত গর্ভকালীন সাপ্লিমেন্ট (এক ট্যাপে যোগ করুন)' : 'Common Prenatal Supplements (One-Tap Add)')}</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {prenatalSupplementSuggestions.map((sug) => {
            const alreadyAdded = trackerItems.some(i => (i.nutrientKey === sug.nutrientKey) || i.nameEn.toLowerCase().includes(sug.id));
            return (
              <button
                key={sug.id}
                type="button"
                onClick={() => handleQuickAdd(sug)}
                disabled={alreadyAdded}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition-all shadow-2xs ${
                  alreadyAdded
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 opacity-80 cursor-default'
                    : 'bg-white hover:bg-maternal-50/60 border-maternal-200 text-gray-800 hover:border-maternal-400 active:scale-98'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {lang === 'bn' ? sug.nameBn : sug.nameEn}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    {getTimeIcon(sug.time)}
                    <span>{getTimeLabel(sug.time)}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {alreadyAdded ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {lang === 'bn' ? 'যোগ করা' : 'Added'}
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold text-maternal-600 bg-maternal-50 px-2.5 py-1 rounded-xl border border-maternal-200 flex items-center gap-0.5">
                      <Plus className="w-3.5 h-3.5" />
                      {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TODAY'S CHECKLIST HEADER & ADD CUSTOM BUTTON */}
      <div className="flex justify-between items-center pt-2">
        <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-maternal-500" />
          <span>{lang === 'bn' ? 'আজকের দৈনিক তালিকা' : "Today's Checklist"}</span>
        </h3>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 rounded-xl bg-maternal-500 hover:bg-maternal-600 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addTrackerItem}</span>
        </button>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {trackerItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between shadow-xs ${
              item.done 
                ? 'bg-emerald-50/80 border-emerald-200 text-gray-500' 
                : 'bg-cream-card border-maternal-200 hover:border-maternal-300 text-gray-900'
            }`}
          >
            <div 
              onClick={() => toggleTrackerItem(item.id)}
              className="flex items-center space-x-3 cursor-pointer flex-1"
            >
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                item.done 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                  : 'bg-white border-gray-300 hover:border-maternal-400'
              }`}>
                {item.done && <Check className="w-4 h-4" />}
              </div>

              <div>
                <h4 className={`text-sm sm:text-base font-bold ${item.done ? 'text-emerald-900 line-through opacity-70' : 'text-gray-900'}`}>
                  {lang === 'bn' ? item.nameBn : item.nameEn}
                </h4>
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                  {getTimeIcon(item.time)}
                  <span className="font-medium">{getTimeLabel(item.time)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleTrackerItem(item.id)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  item.done 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-maternal-300'
                }`}
              >
                {item.done ? (lang === 'bn' ? 'সম্পন্ন ✓' : 'Done ✓') : t.markDone}
              </button>

              <button
                type="button"
                onClick={() => removeTrackerItem(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-cream-card w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-maternal-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-maternal-100">
              <h3 className="font-bold text-sm text-gray-900">{t.addTrackerItem}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={t.itemPlaceholder}
                  required
                  className="w-full bg-white px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-maternal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  নাম (বাংলা - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: আয়রন ক্যাপসুল"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-maternal-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  সময়কাল / Time
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-gray-300 text-sm focus:border-maternal-500 outline-hidden"
                >
                  <option value="morning">{t.timeMorning}</option>
                  <option value="afternoon">{t.timeAfternoon}</option>
                  <option value="evening">{t.timeEvening}</option>
                  <option value="night">{t.timeNight}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-maternal-500 hover:bg-maternal-600 text-white font-bold text-xs shadow-xs transition-colors"
              >
                {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerScreen;
