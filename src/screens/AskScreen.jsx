import React, { useState, useMemo } from 'react';
import { 
  Search, Mic, Sparkles, ShieldCheck, HeartPulse, RefreshCw, 
  Filter, CheckCircle, AlertTriangle, XCircle, Database, ChevronDown, 
  ChevronUp, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DrugAnswerCard from '../components/DrugAnswerCard';

export const AskScreen = () => {
  const { 
    lang, t, searchQuery, setSearchQuery, searchDrug, activeDrug, 
    setActiveDrug, setIsVoiceOpen, getDrugSuggestions, allDrugs = [] 
  } = useApp();

  const [safetyFilter, setSafetyFilter] = useState('all'); // 'all', 'safe', 'caution', 'unsafe'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const ITEMS_PER_PAGE = 12;

  // Suggestions for live search
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    return getDrugSuggestions(searchQuery, 8);
  }, [searchQuery, getDrugSuggestions]);

  // Categories list extracted from 302 dataset
  const categoriesList = useMemo(() => {
    const cats = new Set();
    allDrugs.forEach(d => {
      if (d.category) cats.add(d.category);
    });
    return Array.from(cats);
  }, [allDrugs]);

  // Catalog filtered items
  const catalogFilteredDrugs = useMemo(() => {
    return allDrugs.filter(d => {
      const matchSafety = safetyFilter === 'all' || d.safetyRating === safetyFilter;
      const matchCat = categoryFilter === 'all' || (d.category && d.category.toLowerCase().includes(categoryFilter.toLowerCase()));
      
      const q = catalogSearch.toLowerCase().trim();
      const matchSearch = !q || 
        (d.nameEn && d.nameEn.toLowerCase().includes(q)) ||
        (d.nameBn && d.nameBn.includes(q)) ||
        (d.genericEn && d.genericEn.toLowerCase().includes(q)) ||
        (d.genericBn && d.genericBn.includes(q)) ||
        (d.brandNames && d.brandNames.some(b => b.toLowerCase().includes(q)));

      return matchSafety && matchCat && matchSearch;
    });
  }, [allDrugs, safetyFilter, categoryFilter, catalogSearch]);

  const totalCatalogPages = Math.ceil(catalogFilteredDrugs.length / ITEMS_PER_PAGE) || 1;
  const paginatedCatalogDrugs = useMemo(() => {
    const start = (catalogPage - 1) * ITEMS_PER_PAGE;
    return catalogFilteredDrugs.slice(start, start + ITEMS_PER_PAGE);
  }, [catalogFilteredDrugs, catalogPage]);

  // Filtered quick pill drugs
  const quickPillDrugs = useMemo(() => {
    let list = allDrugs;
    if (safetyFilter !== 'all') {
      list = list.filter(d => d.safetyRating === safetyFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter(d => d.category && d.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
    // Return top 14 representative drugs
    return list.slice(0, 14);
  }, [allDrugs, safetyFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      searchDrug(searchQuery);
    }
  };

  const handleSelectDrug = (drug) => {
    setActiveDrug(drug);
    setSearchQuery(lang === 'bn' ? drug.nameBn : drug.nameEn);
    setShowSuggestions(false);
  };

  const getSafetyBadge = (rating) => {
    switch (rating) {
      case 'safe':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          labelBn: 'নিরাপদ',
          labelEn: 'Safe',
          icon: CheckCircle
        };
      case 'unsafe':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          labelBn: 'নিষিদ্ধ',
          labelEn: 'Unsafe',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          labelBn: 'সতর্কতা',
          labelEn: 'Caution',
          icon: AlertTriangle
        };
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-maternal-500" />
            <span>{lang === 'bn' ? 'ঔষধের নিরাপত্তা ও RAG যাচাইকরণ প্যানেল' : 'Maternal Drug Safety & RAG Verification Panel'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {lang === 'bn' 
              ? 'ঔষধ প্রশাসন অধিদপ্তর (DGDA) ও মেডেক্স বিডি ৩০২টি অনুমোদিত ড্রাগ কর্পাস ভিত্তিক ক্লিনিক্যাল সেফটি প্যানেল।'
              : 'Verified pregnancy safety ratings grounded in the 302 DGDA & MedEx Bangladesh Maternal Drug Corpus.'}
          </p>
        </div>

        {/* 302 Corpus Active Counter Badge */}
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3.5 py-1.5 rounded-2xl shadow-2xs shrink-0 self-start sm:self-auto text-xs font-bold">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? '৩০২টি ড্রাগ কর্পাস সক্রিয়' : '302 Drug Corpus Active'}</span>
        </div>
      </div>

      {/* Primary Search Bar with Real-Time Autocomplete Dropdown */}
      <div className="space-y-3 relative">
        <form onSubmit={handleSearchSubmit} className="relative z-20">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={lang === 'bn' ? 'যে কোনো ওষুধের নাম বা জেনেরিক অনুসন্ধান করুন... (যেমন: Napa, Seclo, Cefixime, ক্যালসিয়াম)' : 'Search any drug by brand, generic, or symptom... (e.g. Napa, Seclo, Cefixime, Folic)'}
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

        {/* Live Autocomplete Suggestions Floating Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-maternal-300 shadow-warm-lg z-30 overflow-hidden divide-y divide-gray-100 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="p-2.5 bg-maternal-50/80 text-[11px] font-bold text-maternal-900 flex items-center justify-between">
              <span>{lang === 'bn' ? `৩০২ কর্পাস থেকে ${suggestions.length}টি ফলাফল পাওয়া গেছে:` : `Found ${suggestions.length} matching verified drugs:`}</span>
              <button 
                type="button" 
                onClick={() => setShowSuggestions(false)}
                className="text-gray-500 hover:text-gray-800 text-xs px-1.5"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {suggestions.map((drug) => {
                const badge = getSafetyBadge(drug.safetyRating);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={drug.id}
                    onClick={() => handleSelectDrug(drug)}
                    className="p-3 hover:bg-maternal-50/60 cursor-pointer flex items-center justify-between transition-colors text-left"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                          {lang === 'bn' ? drug.nameBn : drug.nameEn}
                        </h4>
                        <span className="text-[11px] text-gray-500">
                          ({drug.genericEn})
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        <span className="font-semibold text-gray-600">{drug.category}</span> · {drug.brandNames.slice(0, 3).join(', ')}
                      </p>
                    </div>

                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? badge.labelBn : badge.labelEn}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safety Category & Trimester Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="inline-flex items-center space-x-1 text-gray-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-maternal-600" />
            <span>{lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}</span>
          </div>

          {[
            { id: 'all', labelBn: 'সব ৩০২টি ওষুধ (All)', labelEn: 'All 302 Drugs', count: allDrugs.length },
            { id: 'safe', labelBn: '✅ নিরাপদ (Safe)', labelEn: 'Safe (119)', count: 119, color: 'text-emerald-700 border-emerald-200' },
            { id: 'caution', labelBn: '⚠️ সতর্কতা (Caution)', labelEn: 'Caution (133)', count: 133, color: 'text-amber-700 border-amber-200' },
            { id: 'unsafe', labelBn: '🚫 বর্জনীয় / নিষিদ্ধ (Contraindicated)', labelEn: 'Contraindicated (50)', count: 50, color: 'text-rose-700 border-rose-200' },
          ].map((tab) => {
            const isActive = safetyFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSafetyFilter(tab.id)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all border shadow-2xs text-xs ${
                  isActive
                    ? 'bg-maternal-600 text-white border-maternal-700 shadow-warm-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-maternal-300'
                }`}
              >
                {lang === 'bn' ? tab.labelBn : tab.labelEn}
              </button>
            );
          })}
        </div>

        {/* Popular Quick Drug Select Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-maternal-500" />
              <span>{lang === 'bn' ? 'নির্বাচিত গুরুত্বপূর্ণ ওষুধসমূহ (Quick Select):' : 'Featured Verified Drugs:'}</span>
            </span>

            {/* Toggle Full 302 Drug Directory */}
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="text-xs font-bold text-maternal-700 hover:text-maternal-800 flex items-center gap-1 hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5 text-maternal-600" />
              <span>{showCatalog ? (lang === 'bn' ? 'ডিরেক্টরি বন্ধ করুন' : 'Close Catalog') : (lang === 'bn' ? '📂 ৩০২ ড্রাগ ডিরেক্টরি ব্রাউজ করুন' : '📂 Browse Full 302 Catalog')}</span>
              {showCatalog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {quickPillDrugs.map((drug) => {
              const isSelected = activeDrug && (activeDrug.id === drug.id || activeDrug.corpusId === drug.corpusId);
              const badge = getSafetyBadge(drug.safetyRating);
              const mainBrand = drug.brandNames[0] || drug.genericEn;
              return (
                <button
                  key={drug.id}
                  onClick={() => handleSelectDrug(drug)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-semibold transition-all shadow-2xs active:scale-95 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-maternal-500 text-white border-maternal-600 shadow-warm-sm'
                      : drug.safetyRating === 'unsafe'
                      ? 'bg-rose-50/80 text-rose-800 border-rose-200 hover:bg-rose-100'
                      : drug.safetyRating === 'caution'
                      ? 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-cream-card text-gray-700 border-maternal-200/80 hover:border-maternal-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${drug.safetyRating === 'safe' ? 'bg-emerald-500' : drug.safetyRating === 'unsafe' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span>{mainBrand}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* EXPANDABLE 302 DRUG CORPUS CATALOG BROWSER */}
        {showCatalog && (
          <div className="bg-white rounded-3xl p-5 border-2 border-maternal-300 shadow-warm-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-maternal-600" />
                  <span>{lang === 'bn' ? '৩০২টি মাতৃত্বকালীন ড্রাগ কর্পাস ডিরেক্টরি' : '302 Maternal Drug Corpus Catalog'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lang === 'bn' ? `মোট ফিল্টারকৃত ওষুধ: ${catalogFilteredDrugs.length}টি` : `Filtered results: ${catalogFilteredDrugs.length} drugs`}
                </p>
              </div>

              {/* Catalog Search & Category Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  placeholder={lang === 'bn' ? 'ক্যাটালগে খুঁজুন...' : 'Search catalog...'}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs focus:border-maternal-500 outline-hidden w-44 sm:w-56"
                />

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-300 text-xs focus:border-maternal-500 outline-hidden bg-white text-gray-800 font-medium"
                >
                  <option value="all">{lang === 'bn' ? 'সব ক্যাটেগরি' : 'All Categories'}</option>
                  {categoriesList.slice(0, 15).map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Catalog Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedCatalogDrugs.map((drug) => {
                const badge = getSafetyBadge(drug.safetyRating);
                const BadgeIcon = badge.icon;
                const isSelected = activeDrug && (activeDrug.id === drug.id || activeDrug.corpusId === drug.corpusId);

                return (
                  <div
                    key={drug.id}
                    onClick={() => handleSelectDrug(drug)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 hover:shadow-warm-xs ${
                      isSelected
                        ? 'bg-maternal-50/90 border-maternal-500 ring-2 ring-maternal-400'
                        : 'bg-white border-gray-200/90 hover:border-maternal-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                          {lang === 'bn' ? drug.nameBn : drug.nameEn}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold border shrink-0 inline-flex items-center gap-1 ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{lang === 'bn' ? badge.labelBn : badge.labelEn}</span>
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 font-medium">
                        <span className="font-semibold text-gray-700">{drug.genericEn}</span>
                      </p>

                      <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                        {drug.pregnancyWarning}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 text-gray-400">
                      <span>{drug.category}</span>
                      <span className="text-maternal-600 font-bold hover:underline flex items-center gap-0.5">
                        {lang === 'bn' ? 'বিস্তারিত দেখুন' : 'View Safety'}
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalCatalogPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">
                  {lang === 'bn' ? `পৃষ্ঠা ${catalogPage} এর ${totalCatalogPages}` : `Page ${catalogPage} of ${totalCatalogPages}`}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    disabled={catalogPage <= 1}
                    onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-xl border border-gray-200 bg-white font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    {lang === 'bn' ? 'পূর্ববর্তী' : 'Prev'}
                  </button>

                  <button
                    disabled={catalogPage >= totalCatalogPages}
                    onClick={() => setCatalogPage(p => Math.min(totalCatalogPages, p + 1))}
                    className="px-3 py-1 rounded-xl border border-gray-200 bg-white font-medium disabled:opacity-40 hover:bg-gray-50"
                  >
                    {lang === 'bn' ? 'পরবর্তী' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
