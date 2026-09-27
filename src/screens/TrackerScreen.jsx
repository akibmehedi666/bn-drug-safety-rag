import React, { useState } from 'react';
import { CheckSquare, Flame, Plus, Sun, Sunrise, Sunset, Moon, Check, X, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TrackerScreen = () => {
  const { lang, t, trackerItems, toggleTrackerItem, addTrackerItem, streakDays } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [time, setTime] = useState('morning');

  const completedCount = trackerItems.filter(i => i.done).length;
  const totalCount = trackerItems.length;
  const percent = Math.round((completedCount / totalCount) * 100);

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

        {/* Streak Counter */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 shadow-xs font-bold text-xs shrink-0">
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse" />
          <span>{streakDays} {t.days}</span>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-gradient-to-r from-maternal-500 to-rose-500 rounded-3xl p-5 text-white shadow-warm-md space-y-3">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-rose-100">
          <span>{t.trackerProgressTitle}</span>
          <span>{completedCount} / {totalCount} {t.completed}</span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight">{percent}%</span>
          <span className="text-xs font-medium text-rose-100">
            {percent === 100 
              ? (lang === 'bn' ? 'আজকের সব ভিটামিন গ্রহণ সম্পন্ন! 🎉' : 'All doses completed today! 🎉') 
              : (lang === 'bn' ? 'নিয়মিত ওষুধ গ্রহণে মা ও শিশু সুরক্ষিত থাকে' : 'Keep up your prenatal health adherence')}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5">
          <div 
            className="bg-white h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Add New Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-sm text-gray-800 uppercase tracking-wider">
          {lang === 'bn' ? 'আজকের দৈনিক তালিকা' : "Today's Checklist"}
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
            onClick={() => toggleTrackerItem(item.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xs ${
              item.done 
                ? 'bg-emerald-50/80 border-emerald-200 text-gray-500 line-through' 
                : 'bg-cream-card border-maternal-200 hover:border-maternal-300 text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                item.done 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                  : 'bg-white border-gray-300'
              }`}>
                {item.done && <Check className="w-4 h-4" />}
              </div>

              <div>
                <h4 className={`text-sm sm:text-base font-bold ${item.done ? 'text-emerald-900 opacity-70' : 'text-gray-900'}`}>
                  {lang === 'bn' ? item.nameBn : item.nameEn}
                </h4>
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5 no-underline">
                  {getTimeIcon(item.time)}
                  <span className="font-medium">{getTimeLabel(item.time)}</span>
                </div>
              </div>
            </div>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border no-underline ${
              item.done 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {item.done ? (lang === 'bn' ? 'সম্পন্ন' : 'Done') : t.markDone}
            </span>
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
                className="p-1.5 rounded-full bg-gray-100 text-gray-500"
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
                className="w-full py-3 rounded-xl bg-maternal-500 hover:bg-maternal-600 text-white font-bold text-xs shadow-xs"
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
