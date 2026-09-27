import React from 'react';
import { Search, Mic, Sparkles, ShieldCheck, HeartPulse, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { drugsDatabase } from '../data/mockData';
import DrugAnswerCard from '../components/DrugAnswerCard';

export const AskScreen = () => {
  const { lang, t, searchQuery, setSearchQuery, searchDrug, activeDrug, setActiveDrug, setIsVoiceOpen } = useApp();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchDrug(searchQuery);
    }
  };

  const handleSelectDrug = (drug) => {
    setActiveDrug(drug);
    setSearchQuery(lang === 'bn' ? drug.nameBn : drug.nameEn);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-maternal-500" />
          <span>{t.ask}</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {lang === 'bn' 
            ? 'ঔষধ প্রশাসন অধিদপ্তর (DGDA) ও মেডেক্স বিডি নির্দেশিকা অনুযায়ী আপনার ওষুধের নিরাপত্তা যাচাই করুন।'
            : 'Check pregnancy safety ratings verified against DGDA & MedEx Bangladesh guidelines.'}
        </p>
      </div>

      {/* Primary Search Bar */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-cream-card pl-11 pr-24 py-4 rounded-2xl border-2 border-maternal-300 focus:border-maternal-500 focus:ring-4 focus:ring-maternal-100 text-sm sm:text-base font-medium placeholder:text-gray-400 shadow-warm-sm transition-all outline-hidden text-gray-900"
            />
            <Search className="w-5 h-5 text-maternal-500 absolute left-4 pointer-events-none" />

            <div className="absolute right-2 flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="p-2.5 rounded-xl bg-cream-accent text-maternal-600 hover:bg-maternal-100 transition-colors"
                title={t.voiceInput}
              >
                <Mic className="w-4 h-4 text-maternal-600" />
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-maternal-500 hover:bg-maternal-600 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                {t.searchBtn}
              </button>
            </div>
          </div>
        </form>

        {/* Popular Quick Drug Select Pills */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-gray-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-maternal-500" />
            <span>{t.quickAsk}:</span>
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {drugsDatabase.map((drug) => {
              const isSelected = activeDrug && activeDrug.id === drug.id;
              return (
                <button
                  key={drug.id}
                  onClick={() => handleSelectDrug(drug)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all shadow-2xs active:scale-95 border ${
                    isSelected
                      ? 'bg-maternal-500 text-white border-maternal-600 shadow-warm-sm'
                      : 'bg-cream-card text-gray-700 border-maternal-200/80 hover:border-maternal-400'
                  }`}
                >
                  {lang === 'bn' ? drug.brandNames[0] : drug.brandNames[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CORE DISPLAY CARD */}
      {activeDrug ? (
        <DrugAnswerCard drug={activeDrug} />
      ) : (
        <div className="text-center py-12 bg-cream-card rounded-3xl border border-maternal-200 p-6 space-y-3">
          <RefreshCw className="w-8 h-8 text-maternal-400 mx-auto animate-spin" />
          <p className="text-sm font-medium text-gray-600">
            {t.askAnother}
          </p>
        </div>
      )}
    </div>
  );
};

export default AskScreen;
