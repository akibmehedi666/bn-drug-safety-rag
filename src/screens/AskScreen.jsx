import React, { useMemo } from 'react';
import { Search, Mic, Sparkles, HeartPulse, RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import DrugAnswerCard from '../components/DrugAnswerCard';

export const AskScreen = () => {
  const { 
    lang, 
    t, 
    searchQuery, 
    setSearchQuery, 
    searchDrug, 
    activeDrug, 
    isSearchingRag, 
    searchError, 
    drugsList, 
    isLoadingDrugs, 
    setIsVoiceOpen 
  } = useApp();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchDrug(searchQuery);
    }
  };

  const handleSelectPill = (drug) => {
    const queryTerm = lang === 'bn' ? (drug.nameBn || drug.nameEn) : drug.nameEn;
    setSearchQuery(queryTerm);
    searchDrug(queryTerm);
  };

  // Top ~8 quick pills derived from the real backend /api/drugs endpoint
  const quickPills = useMemo(() => {
    if (drugsList && drugsList.length > 0) {
      // Pick top common maternal medicines if present, else first 8 distinct
      const priorityNames = ['paracetamol', 'omeprazole', 'iron', 'calcium', 'folic acid', 'metformin', 'cefuroxime', 'aceclofenac', 'methotrexate'];
      const prioritized = [];
      const others = [];

      for (const d of drugsList) {
        const nameLower = (d.nameEn || '').toLowerCase();
        if (priorityNames.some(p => nameLower.includes(p))) {
          prioritized.push(d);
        } else {
          others.push(d);
        }
      }

      const combined = [...prioritized, ...others];
      return combined.slice(0, 8);
    }

    // Default 8 pills while endpoint is loading
    return [
      { id: '1', nameEn: 'Paracetamol', nameBn: 'প্যারাসিটামল', displayBrand: 'Napa / Ace' },
      { id: '2', nameEn: 'Omeprazole', nameBn: 'ওমেপ্রাজল', displayBrand: 'Seclo' },
      { id: '3', nameEn: 'Iron & Folic Acid', nameBn: 'আয়রন ও ফলিক এসিড', displayBrand: 'Fefol' },
      { id: '4', nameEn: 'Calcium Carbonate', nameBn: 'ক্যালসিয়াম', displayBrand: 'Calbo-D' },
      { id: '5', nameEn: 'Aceclofenac', nameBn: 'এসেক্লোফেনাক', displayBrand: 'Flexi' },
      { id: '6', nameEn: 'Metformin', nameBn: 'মেটফরমিন', displayBrand: 'Comet' },
      { id: '7', nameEn: 'Cefuroxime', nameBn: 'সেফুরোক্সিম', displayBrand: 'Kilbac' },
      { id: '8', nameEn: 'Methotrexate (Contraindicated)', nameBn: 'মেথোট্রেক্সেট (নিষিদ্ধ)', displayBrand: 'Methotrexate' }
    ];
  }, [drugsList]);

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
            ? 'ঔষধ প্রশাসন অধিদপ্তর (DGDA) ও মেডেক্স বিডি ৩০২টি অনুমোদিত ডাটাবেজ অনুযায়ী ওষুধের নিরাপত্তা যাচাই করুন।'
            : 'Check pregnancy safety ratings verified against DGDA & MedEx Bangladesh 302-drug corpus.'}
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
                disabled={isSearchingRag}
                className="px-4 py-2 rounded-xl bg-maternal-500 hover:bg-maternal-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1"
              >
                {isSearchingRag ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>{t.searchBtn}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Popular Quick Drug Select Pills (From real backend endpoint) */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-gray-500 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-maternal-500" />
            <span>{t.quickAsk} ({lang === 'bn' ? '৩০২ ড্রাগ কর্পাস থেকে' : 'from 302 Drug Corpus'}):</span>
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {quickPills.map((drug) => {
              const pillLabel = lang === 'bn' ? (drug.nameBn || drug.displayBrand || drug.nameEn) : (drug.displayBrand || drug.nameEn);
              const isSelected = activeDrug && (
                searchQuery.toLowerCase().includes((drug.nameEn || '').toLowerCase()) ||
                searchQuery.toLowerCase().includes((drug.nameBn || '').toLowerCase())
              );
              return (
                <button
                  key={drug.id}
                  onClick={() => handleSelectPill(drug)}
                  disabled={isSearchingRag}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full font-medium transition-all shadow-2xs active:scale-95 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-maternal-500 text-white border-maternal-600 shadow-warm-sm'
                      : 'bg-cream-card text-gray-700 border-maternal-200/80 hover:border-maternal-400'
                  }`}
                >
                  <span>{pillLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {isSearchingRag && (
        <div className="text-center py-12 bg-white rounded-3xl border border-maternal-200 p-8 space-y-4 shadow-warm-sm animate-pulse">
          <RefreshCw className="w-10 h-10 text-maternal-500 mx-auto animate-spin" />
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-gray-900">
              {lang === 'bn' ? 'ড্রাগ কর্পাস ও ক্লিনিক্যাল রেকর্ড যাচাই করা হচ্ছে...' : 'Querying Drug Corpus & Safety Verification Layer...'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {lang === 'bn'
                ? '৩০২টি ওষুধের ডিজিডিএ ও মেডেক্স রেকর্ড থেকে তথ্য রিট্রিভ করে র্যান্ডম ফরেস্ট ফিল্টার দ্বারা হ্যালুসিনেশন ঝুঁকি মূল্যায়ন করা হচ্ছে।'
                : 'Retrieving context from 302 DGDA/MedEx drugs and computing faithfulness features with Random Forest filter.'}
            </p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {!isSearchingRag && searchError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 text-rose-950 shadow-warm-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <h3 className="font-extrabold text-base text-rose-900">
              {lang === 'bn' ? 'ওষুধ তথ্য অনুসন্ধান ব্যর্থ হয়েছে' : 'Search Request Failed'}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-rose-800 font-medium leading-relaxed">
            {searchError}
          </p>
          <button
            onClick={() => searchDrug(searchQuery)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            {lang === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry Query'}
          </button>
        </div>
      )}

      {/* CORE DISPLAY CARD */}
      {!isSearchingRag && !searchError && activeDrug && (
        <DrugAnswerCard drug={activeDrug} />
      )}

      {/* EMPTY / INITIAL STATE */}
      {!isSearchingRag && !searchError && !activeDrug && (
        <div className="text-center py-12 bg-cream-card rounded-3xl border border-maternal-200 p-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-maternal-100 flex items-center justify-center text-maternal-600">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {lang === 'bn' ? 'যেকোনো ওষুধের নাম লিখে অনুসন্ধান করুন' : 'Search any drug name above or choose a quick pill'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            {lang === 'bn'
              ? 'উপরের সার্চ বারে ওষুধের নাম লিখুন অথবা জনপ্রিয় দ্রুত সার্চ পিল থেকে বেছে নিন।'
              : 'Enter brand or generic name (e.g. Napa, Seclo, Flexi) to see verified safety ratings.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AskScreen;
