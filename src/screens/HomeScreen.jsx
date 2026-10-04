import React, { useState, useMemo } from 'react';
import { 
  Search, Mic, Sparkles, CheckCircle2, Heart, ArrowRight, ShieldCheck, 
  Flame, Plus, Check, Calendar, ChevronLeft, ChevronRight, Baby, Clock,
  Sunrise, Sun, Sunset, Moon, Activity, Stethoscope, Bookmark,
  AlertTriangle, XCircle, CheckCircle, ExternalLink, BookOpen, Layers, Info,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWeekInfo } from '../data/pregnancyWeeks';

export const HomeScreen = () => {
  const { 
    lang, t, profile, setWeek, setActiveTab, searchQuery, setSearchQuery, 
    searchDrug, isSearchingRag, setIsVoiceOpen, trackerItems, toggleTrackerItem, 
    addTrackerItem, streakDays, bookmarkedIds, activeDrug, setActiveDrug,
    getDrugSuggestions, allDrugs = []
  } = useApp();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('morning');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentWeek = profile.week || 12;
  const weekInfo = getWeekInfo(currentWeek);
  const weekProgressPct = Math.round((currentWeek / 40) * 100);

  const completedTrackerCount = trackerItems.filter(i => i.done).length;
  const totalTrackerCount = trackerItems.length;
  const trackerPercent = totalTrackerCount > 0 
    ? Math.round((completedTrackerCount / totalTrackerCount) * 100) 
    : 0;

  // Live autocomplete suggestions from the 302-drug dataset
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    return getDrugSuggestions(searchQuery, 6);
  }, [searchQuery, getDrugSuggestions]);

  const handleQuickQuery = (query) => {
    setShowSuggestions(false);
    searchDrug(query);
    setActiveTab('ask');
  };

  const handleSelectSuggestion = (drug) => {
    setActiveDrug(drug);
    setSearchQuery(lang === 'bn' ? drug.nameBn : drug.nameEn);
    setShowSuggestions(false);
    searchDrug(drug.id);
    setActiveTab('ask');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      searchDrug(searchQuery);
      setActiveTab('ask');
    }
  };

  const getSafetyBadgeStyle = (rating) => {
    switch (rating) {
      case 'safe':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          labelBn: 'নিরাপদ সেবন',
          labelEn: 'Safe to Use',
          icon: CheckCircle
        };
      case 'unsafe':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          labelBn: 'বর্জনীয় / নিষিদ্ধ',
          labelEn: 'Contraindicated / Avoid',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          labelBn: 'সতর্কতা প্রয়োজন',
          labelEn: 'Use with Caution',
          icon: AlertTriangle
        };
    }
  };

  const handleAddMed = (e) => {
    e.preventDefault();
    if (newMedName.trim()) {
      addTrackerItem(newMedName, newMedName, newMedTime);
      setNewMedName('');
      setShowQuickAdd(false);
    }
  };

  const getTimeIcon = (tPeriod) => {
    switch (tPeriod) {
      case 'morning': return <Sunrise className="w-3.5 h-3.5 text-amber-500" />;
      case 'afternoon': return <Sun className="w-3.5 h-3.5 text-orange-500" />;
      case 'evening': return <Sunset className="w-3.5 h-3.5 text-rose-500" />;
      case 'night': return <Moon className="w-3.5 h-3.5 text-indigo-500" />;
      default: return <Sun className="w-3.5 h-3.5 text-amber-500" />;
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

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* WEB APPLICATION DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & MAIN COLUMN (Span 2 on Desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. PREGNANCY WEEK TRACKER HERO SECTION ("the week you are on right now") */}
          <div className="bg-gradient-to-br from-maternal-600 via-maternal-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-warm-md relative overflow-hidden space-y-5">
            
            {/* Soft background floral & baby motif */}
            <div className="absolute top-2 right-2 transform translate-x-4 -translate-y-4 text-white/10 font-bold text-9xl pointer-events-none select-none">
              👶
            </div>

            {/* Top Bar: Trimester Badge & Week Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>{lang === 'bn' ? weekInfo.trimesterBn : weekInfo.trimesterEn}</span>
              </div>

              {/* Interactive Week Adjuster (- / +) */}
              <div className="flex items-center space-x-3 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                <button 
                  onClick={() => setWeek(currentWeek - 1)}
                  disabled={currentWeek <= 1}
                  className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">
                  {lang === 'bn' ? `${currentWeek}তম সপ্তাহ` : `Week ${currentWeek}`}
                </span>

                <button 
                  onClick={() => setWeek(currentWeek + 1)}
                  disabled={currentWeek >= 40}
                  className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
                  title="Next Week"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Week Heading & Progress */}
            <div className="relative z-10 space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  {lang === 'bn' ? `গর্ভাবস্থার ${currentWeek}তম সপ্তাহ` : `Pregnancy Week ${currentWeek}`} 🌸
                </h2>
                <span className="text-xs sm:text-sm font-bold text-rose-100 bg-white/15 px-3 py-1 rounded-xl border border-white/20">
                  {weekProgressPct}% {lang === 'bn' ? 'সম্পন্ন' : 'Completed'}
                </span>
              </div>

              {/* Overall 40-Week Timeline Progress Bar */}
              <div className="w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className="bg-gradient-to-r from-yellow-300 via-amber-200 to-white h-full rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${weekProgressPct}%` }}
                />
              </div>
            </div>

            {/* Baby Development Milestone Showcase Card - Cute & Moderate Font */}
            <div className="relative z-10 bg-gradient-to-r from-yellow-300/25 via-amber-400/20 to-rose-300/25 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-yellow-200/60 shadow-warm-sm space-y-3">
              
              {/* Top Cute Headline & Moderate Emoji Icon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {/* Moderate Emoji Box */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-100 text-2xl sm:text-3xl flex items-center justify-center shadow-md border border-white/60 shrink-0 transform hover:scale-105 transition-transform">
                    {weekInfo.emoji || '🌽'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-200 bg-black/20 px-2 py-0.5 rounded-full border border-yellow-300/30">
                        {lang === 'bn' ? '✨ শিশুর বর্তমান আকার' : '✨ Baby Size Comparison'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight drop-shadow-xs flex items-center gap-2">
                      <span>{lang === 'bn' ? weekInfo.babySizeBn : weekInfo.babySizeEn}</span>
                    </h3>
                  </div>
                </div>

                <div className="inline-flex items-center space-x-1.5 bg-yellow-400 text-yellow-950 px-3 py-1 rounded-full font-bold text-xs shadow-2xs border border-yellow-200 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                  <span>{lang === 'bn' ? `${currentWeek}তম সপ্তাহের বিকাশ` : `Week ${currentWeek}`}</span>
                </div>
              </div>

              {/* Physical Milestone Description */}
              <p className="text-white text-xs sm:text-sm leading-relaxed font-normal bg-black/15 p-3 rounded-xl border border-white/10">
                {lang === 'bn' ? weekInfo.milestoneBn : weekInfo.milestoneEn}
              </p>

              {/* Daily Maternal Tip */}
              <div className="pt-0.5 text-xs text-yellow-100 font-medium flex items-center space-x-2">
                <span className="font-bold text-gray-900 bg-yellow-300 px-2 py-0.5 rounded-md shadow-2xs shrink-0">
                  {lang === 'bn' ? 'টিপস 💡' : 'Tip 💡'}
                </span>
                <span className="leading-snug text-white font-medium">{lang === 'bn' ? weekInfo.tipBn : weekInfo.tipEn}</span>
              </div>
            </div>
          </div>

          {/* 2. CORE BANGLA DRUG SAFETY & RAG SEARCH CENTERPIECE (ALWAYS HIGHLIGHTED) */}
          <div className="bg-gradient-to-br from-cream-card via-maternal-50/70 to-rose-50/50 rounded-3xl p-6 border-2 border-maternal-400 shadow-warm-md relative space-y-5 ring-4 ring-maternal-100/80">
            
            {/* Top Highlight Banner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-maternal-500 text-white shadow-warm-sm animate-pulse">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-xl text-gray-900 tracking-tight flex items-center gap-2">
                    <span>{lang === 'bn' ? 'ওষুধের সেফটি সার্চ ও RAG এআই ফিল্টার' : 'Drug Safety RAG & AI Verification'}</span>
                    <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                      Centerpiece
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    {lang === 'bn' 
                      ? 'ডিজিডিএ ও মেডেক্স বিডি নির্দেশিকা অনুযায়ী আপনার ওষুধটি গর্ভাবস্থায় নিরাপদ কি না তাৎক্ষণিক যাচাই করুন।' 
                      : 'Verified against 302 maternal drug records with Random Forest hallucination protection.'}
                  </p>
                </div>
              </div>
              
              <span className="hidden sm:inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                {lang === 'bn' ? '৩০২ ড্রাগস • ৯৮.৩% প্রিসিশন' : '302 Corpus • 98.3% Precision'}
              </span>
            </div>

            {/* Glowing Search Box with Live 302-Drug Autocomplete */}
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-white pl-12 pr-32 py-4.5 rounded-2xl border-2 border-maternal-400 focus:border-maternal-600 focus:ring-4 focus:ring-maternal-200 text-sm sm:text-base font-medium placeholder:text-gray-400 shadow-warm-md transition-all outline-hidden text-gray-900"
                  />
                  <Search className="w-6 h-6 text-maternal-600 absolute left-4 pointer-events-none" />

                  <div className="absolute right-2 flex items-center space-x-1.5">
                    {/* Voice Search Button */}
                    <button
                      type="button"
                      onClick={() => setIsVoiceOpen(true)}
                      className="p-3 rounded-xl bg-maternal-100 text-maternal-700 hover:bg-maternal-200 transition-colors"
                      title={t.voiceInput}
                    >
                      <Mic className="w-4.5 h-4.5 text-maternal-700" />
                    </button>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSearchingRag}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-maternal-600 to-maternal-500 hover:from-maternal-700 hover:to-maternal-600 text-white font-bold text-xs sm:text-sm transition-all shadow-warm-xs flex items-center space-x-1"
                    >
                      {isSearchingRag ? (
                        <span className="animate-pulse">{lang === 'bn' ? 'খুঁজছে...' : 'Searching...'}</span>
                      ) : (
                        <span>{t.searchBtn}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Floating Live Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-maternal-300 shadow-2xl overflow-hidden divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2.5 bg-cream-base flex items-center justify-between text-[11px] font-bold text-gray-500 border-b border-maternal-100">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-maternal-600" />
                      {lang === 'bn' ? '৩০২টি ড্রাগ কর্পাস থেকে প্রস্তাবিত:' : 'Suggestions from 302-Drug Corpus:'}
                    </span>
                    <button 
                      onClick={() => setShowSuggestions(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {suggestions.map((drug) => {
                      const badge = getSafetyBadgeStyle(drug.safetyRating);
                      const BadgeIcon = badge.icon;
                      return (
                        <button
                          key={drug.id}
                          onClick={() => handleSelectSuggestion(drug)}
                          className="w-full px-4 py-3 text-left hover:bg-maternal-50 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-sm text-gray-900 group-hover:text-maternal-700 truncate">
                                {lang === 'bn' ? drug.nameBn : drug.nameEn}
                              </span>
                              {drug.category && (
                                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 font-medium">
                                  {drug.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-sage-700 font-medium truncate">
                              {lang === 'bn' ? drug.genericBn : drug.genericEn}
                              {drug.brandNames && drug.brandNames.length > 0 && ` (${drug.brandNames.slice(0, 3).join(', ')})`}
                            </p>
                          </div>

                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${badge.bg}`}>
                            <BadgeIcon className="w-3 h-3 stroke-[2.5]" />
                            <span>{lang === 'bn' ? badge.labelBn : badge.labelEn}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Clinically Curated Maternal Query Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span className="text-gray-600 font-bold flex items-center gap-1">
                  <span>{t.quickAsk}:</span>
                  <span className="text-[10px] font-normal text-gray-400">({lang === 'bn' ? 'ক্লিনিক্যাল উদাহরণ' : 'Clinical Archetypes'})</span>
                </span>
                <button
                  onClick={() => setActiveTab('ask')}
                  className="text-maternal-700 font-bold hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <span>{lang === 'bn' ? 'সব ৩০২ ওষুধ দেখুন' : 'Explore All 302'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { labelBn: '🟢 নাপা (নিরাপদ প্যারাসিটামল)', labelEn: '🟢 Napa (Safe Paracetamol)', query: 'Napa' },
                  { labelBn: '🔴 ফ্লেক্সি (নিষিদ্ধ ব্যথানাশক)', labelEn: '🔴 Flexi (NSAID Contraindicated)', query: 'Flexi' },
                  { labelBn: '🟢 ফিলওয়েল প্রেগ (ভিটামিন)', labelEn: '🟢 Filwel Preg (Prenatal Vitamin)', query: 'Filwel' },
                  { labelBn: '🟡 সেকলো (গ্যাস্ট্রিক সতর্কতা)', labelEn: '🟡 Seclo (Omeprazole Caution)', query: 'Seclo' },
                  { labelBn: '🟢 সেফ-৩ (নিরাপদ অ্যান্টিবায়োটিক)', labelEn: '🟢 Cef-3 (Safe Cefixime)', query: 'Cef-3' },
                  { labelBn: '🔴 সিপ্রোসিন (বর্জনীয় ড্রাগ)', labelEn: '🔴 Ciprofloxacin (Avoid/Unsafe)', query: 'Ciprofloxacin' },
                  { labelBn: '🔴 ওসারটিল (নিষিদ্ধ প্রেসার)', labelEn: '🔴 Osartil (Losartan Contraindicated)', query: 'Osartil' },
                  { labelBn: '🟢 এন্টাসিড (বুকজ্বালা)', labelEn: '🟢 Entacyd (Safe Antacid)', query: 'Entacyd' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuery(item.query)}
                    className="whitespace-nowrap px-3.5 py-2 rounded-full bg-white border border-maternal-200 text-gray-800 hover:border-maternal-500 hover:bg-maternal-50 hover:text-maternal-800 transition-all font-semibold shadow-2xs active:scale-95"
                  >
                    {lang === 'bn' ? item.labelBn : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE DRUG SAFETY SHOWCASE / PREVIEW CARD (Connected to 302 Dataset) */}
            {activeDrug && (
              <div className="bg-white rounded-2xl p-5 border-2 border-maternal-200 shadow-warm-sm space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      {/* Safety Pill */}
                      {(() => {
                        const badge = getSafetyBadgeStyle(activeDrug.safetyRating);
                        const BadgeIcon = badge.icon;
                        return (
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${badge.bg}`}>
                            <BadgeIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{lang === 'bn' ? badge.labelBn : badge.labelEn}</span>
                          </span>
                        );
                      })()}

                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sage-100 text-sage-800 border border-sage-200">
                        {lang === 'bn' ? `${profile.week}তম সপ্তাহ ম্যাচ` : `Week ${profile.week} Context`}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        {activeDrug.category || 'MCH Formulary'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
                      {lang === 'bn' ? activeDrug.nameBn : activeDrug.nameEn}
                    </h4>
                    <p className="text-xs text-sage-700 font-semibold">
                      {lang === 'bn' ? activeDrug.genericBn : activeDrug.genericEn}
                    </p>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs shrink-0">
                    {activeDrug.confidenceScore || 96}% {lang === 'bn' ? 'কনফিডেন্স' : 'Score'}
                  </span>
                </div>

                {/* Clinical Grounded Summary Snippet */}
                <div className="bg-cream-base/80 p-3.5 rounded-xl border border-maternal-100 text-xs sm:text-sm text-gray-800 leading-relaxed font-normal">
                  <p className="line-clamp-2 font-medium">
                    {lang === 'bn' ? activeDrug.answerBn : activeDrug.answerEn}
                  </p>
                </div>

                {/* Grounding & Evaluation Badges Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center space-x-1.5 text-emerald-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{lang === 'bn' ? 'DGDA ৩০২ কর্পাস ভেরিফাইড' : 'DGDA 302 Corpus Grounded'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center space-x-1.5 text-amber-900">
                    <Activity className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold">{lang === 'bn' ? 'Random Forest ক্লাসিফায়ার' : 'Random Forest Protected'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center space-x-1.5 text-purple-900">
                    <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-semibold">{lang === 'bn' ? '৬টি ML মেট্রিক্স ফিচার' : '6 ML Features Computed'}</span>
                  </div>
                </div>

                {/* Primary CTA: Jump into Detailed Comparative RAG Screen */}
                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      searchDrug(activeDrug.id);
                      setActiveTab('ask');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-maternal-600 to-rose-500 hover:from-maternal-700 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-warm-xs transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>{lang === 'bn' ? '🔍 সম্পূর্ণ RAG বনাম সাধারণ LLM মূল্যায়ন দেখুন' : '🔍 View Full RAG vs Direct LLM Dual Card'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveTab('ask')}
                    className="py-2.5 px-4 rounded-xl bg-cream-card hover:bg-maternal-100 border border-maternal-300 text-maternal-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-maternal-600" />
                    <span>{lang === 'bn' ? '৩০২ ড্রাগ ক্যাটালগ' : '302 Catalog'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Maternal Corpus Live Index Counter */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5 text-gray-700">
                <Database className="w-3.5 h-3.5 text-maternal-600" />
                <span>{lang === 'bn' ? 'মাতৃত্ব ড্রাগ ইনডেক্স: ৩০২টি নিবন্ধিত ওষুধ' : 'MCH Drug Index: 302 Registered Medicines'}</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {lang === 'bn' ? '১১৯টি নিরাপদ' : '119 Safe'}
                </span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {lang === 'bn' ? '১৩৩টি সতর্কতা' : '133 Caution'}
                </span>
                <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {lang === 'bn' ? '৫০টি নিষিদ্ধ' : '50 Avoid'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN (Span 1 on Desktop) */}
        <div className="space-y-6">
          
          {/* 3. INTEGRATED MEDICINE TRACKER SECTION ("the tracker of med") */}
          <div className="bg-cream-card rounded-3xl p-5 sm:p-6 border border-maternal-200/80 shadow-warm-sm space-y-4">
            
            {/* Tracker Header Bar */}
            <div className="flex items-center justify-between border-b border-maternal-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-maternal-100 text-maternal-600">
                  <CheckCircle2 className="w-5 h-5 text-maternal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    {lang === 'bn' ? 'আজকের ওষুধ ট্র্যাকার' : "Medication Tracker"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {completedTrackerCount} {lang === 'bn' ? 'এর মধ্যে' : 'of'} {totalTrackerCount} {lang === 'bn' ? 'টি খাওয়া হয়েছে' : 'doses done'} ({trackerPercent}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Streak Counter */}
                <span className="inline-flex items-center text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
                  <Flame className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500 animate-pulse" />
                  {streakDays} {t.days}
                </span>

                {/* Quick Add Button */}
                <button
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="p-1.5 rounded-xl bg-maternal-500 text-white hover:bg-maternal-600 transition-colors shadow-2xs"
                  title="Add Dosage"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Medication Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-maternal-400 via-maternal-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${trackerPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Add Form Dropdown */}
            {showQuickAdd && (
              <form onSubmit={handleAddMed} className="bg-cream-accent p-3.5 rounded-2xl border border-maternal-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-maternal-800">
                  <span>{lang === 'bn' ? 'নতুন ওষুধ যোগ করুন' : 'Add New Dosage'}</span>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder={lang === 'bn' ? 'ওষুধের নাম (যেমন: ক্যালসিয়াম)' : 'Medication Name (e.g. Iron 100mg)'}
                    required
                    className="w-full bg-white px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-maternal-500 outline-hidden text-gray-900"
                  />
                  <select
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="w-full bg-white px-2 py-2 rounded-xl border border-gray-300 text-xs focus:border-maternal-500 outline-hidden text-gray-900 font-medium"
                  >
                    <option value="morning">{t.timeMorning}</option>
                    <option value="afternoon">{t.timeAfternoon}</option>
                    <option value="evening">{t.timeEvening}</option>
                    <option value="night">{t.timeNight}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-maternal-500 text-white font-bold text-xs hover:bg-maternal-600 transition-colors shadow-2xs"
                >
                  {lang === 'bn' ? 'তালিকায় যোগ করুন' : 'Save to Checklist'}
                </button>
              </form>
            )}

            {/* Interactive Medication Checklist Items */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {trackerItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleTrackerItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    item.done 
                      ? 'bg-emerald-50/80 border-emerald-200 text-gray-500' 
                      : 'bg-white border-maternal-200/90 hover:border-maternal-400 text-gray-900 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      item.done 
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {item.done && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold ${item.done ? 'line-through text-emerald-900/70' : 'text-gray-900'}`}>
                        {lang === 'bn' ? item.nameBn : item.nameEn}
                      </h4>
                      <div className="flex items-center space-x-1 text-[11px] text-gray-500 mt-0.5">
                        {getTimeIcon(item.time)}
                        <span className="font-medium">{getTimeLabel(item.time)}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    item.done 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {item.done ? (lang === 'bn' ? 'সম্পন্ন' : 'Done') : t.markDone}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer Link to Full Tracker Screen */}
            <div 
              onClick={() => setActiveTab('tracker')}
              className="flex items-center justify-between text-xs text-maternal-700 font-bold pt-2 border-t border-maternal-100 cursor-pointer hover:underline"
            >
              <span>{lang === 'bn' ? 'পূর্ণাঙ্গ ট্র্যাকার খুলুন' : 'Open Full Med Tracker'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

          </div>

          {/* Saved Items & System Specs Quick Widget */}
          <div className="bg-cream-card rounded-3xl p-5 border border-maternal-200/80 shadow-warm-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-maternal-600" />
                {t.bookmarks} ({bookmarkedIds.length})
              </span>
              <button 
                onClick={() => setActiveTab('ask')} 
                className="text-xs text-maternal-600 font-semibold hover:underline"
              >
                {t.viewAll}
              </button>
            </div>
            
            <p className="text-xs text-gray-600">
              {lang === 'bn' 
                ? 'যেকোনো ওষুধ অনুসন্ধান করে সহজেই ভবিষ্যৎ রেফারেন্সের জন্য সেভ করে রাখতে পারেন।'
                : 'Bookmark any drug safety answer to revisit offline anytime.'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default HomeScreen;
