import React, { useState, useEffect, useMemo } from 'react';
import { 
  Apple, 
  Sparkles, 
  Filter, 
  Heart, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Utensils, 
  Ban, 
  ShieldAlert,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NutritionScreen = () => {
  const { lang, t, profile, trackerItems } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foods, setFoods] = useState([]);
  const [supplementMap, setSupplementMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch nutrition data from backend endpoint GET /api/nutrition
  useEffect(() => {
    let isMounted = true;
    const fetchNutrition = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/nutrition');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setFoods(data.foods || []);
          setSupplementMap(data.supplementMap || {});
        }
      } catch (err) {
        console.error('Failed to load /api/nutrition:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchNutrition();
    return () => { isMounted = false; };
  }, []);

  const categories = [
    { id: 'all', label: t.allNutrients },
    { id: 'folate', label: t.folate },
    { id: 'iron', label: t.iron },
    { id: 'calcium', label: t.calcium },
    { id: 'protein', label: t.protein },
  ];

  // User profile condition checks (e.g. Anemia boost)
  const isAnemic = useMemo(() => {
    const conds = (profile.conditions || []).join(' ').toLowerCase();
    return conds.includes('anemia') || conds.includes('রক্তশূন্যতা');
  }, [profile.conditions]);

  // User profile allergy checks (hide matching foods)
  const userAllergies = useMemo(() => {
    return (profile.allergies || []).map(a => a.toLowerCase());
  }, [profile.allergies]);

  // Filter foods by category + hide allergy items + sort boosted items to top
  const filteredFoods = useMemo(() => {
    let list = foods;

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter(food => food.category === selectedCategory);
    }

    // Hide foods that trigger user's known allergies
    list = list.filter(food => {
      const nameEn = (food.nameEn || '').toLowerCase();
      const nameBn = (food.nameBn || '').toLowerCase();
      for (const allergy of userAllergies) {
        if (allergy.includes('prawn') || allergy.includes('seafood')) {
          if (nameEn.includes('mach') || nameEn.includes('fish') || nameBn.includes('মাছ')) return false;
        }
        if (allergy.includes('egg') || allergy.includes('ডিম')) {
          if (nameEn.includes('egg') || nameBn.includes('ডিম')) return false;
        }
      }
      return true;
    });

    // Condition boost: if anemic, boost iron and folate foods
    if (isAnemic) {
      list = [...list].sort((a, b) => {
        const aBoost = (a.category === 'iron' || a.category === 'folate') ? 1 : 0;
        const bBoost = (b.category === 'iron' || b.category === 'folate') ? 1 : 0;
        return bBoost - aBoost;
      });
    }

    return list;
  }, [foods, selectedCategory, userAllergies, isAnemic]);

  // Find active supplements matching the supplementMap
  const activeSupplementGuides = useMemo(() => {
    if (!trackerItems || trackerItems.length === 0 || !supplementMap) return [];

    const matched = [];
    const seenNutrients = new Set();

    for (const item of trackerItems) {
      const name = (item.nameEn + ' ' + (item.nameBn || '')).toLowerCase();
      let matchedKey = item.nutrientKey;

      if (!matchedKey) {
        for (const [key, conf] of Object.entries(supplementMap)) {
          if (conf.keywords && conf.keywords.some(kw => name.includes(kw.toLowerCase()))) {
            matchedKey = key;
            break;
          }
        }
      }

      if (matchedKey && supplementMap[matchedKey] && !seenNutrients.has(matchedKey)) {
        seenNutrients.add(matchedKey);
        matched.push({
          trackerItem: item,
          key: matchedKey,
          info: supplementMap[matchedKey]
        });
      }
    }

    return matched;
  }, [trackerItems, supplementMap]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Apple className="w-6 h-6 text-sage-600" />
          <span>{t.nutritionTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {t.nutritionSubtitle}
        </p>
      </div>

      {/* ANEMIA PERSONALIZED ALERT (IF CONDITION PRESENT IN PROFILE) */}
      {isAnemic && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs sm:text-sm">
            <span className="font-extrabold text-amber-900">
              {lang === 'bn' ? '🩸 রক্তশূন্যতা (Anemia) পুষ্টি সতর্কতা:' : '🩸 Maternal Anemia Nutritional Guidance:'}
            </span>
            <p className="leading-relaxed text-amber-800">
              {lang === 'bn'
                ? 'আপনার প্রোফাইলে রক্তশূন্যতা নথিভুক্ত রয়েছে। আয়রন ও ফলিক এসিড সমৃদ্ধ দেশি খাবারগুলোকে তালিকায় প্রাধান্য দেওয়া হয়েছে। খাবারের সাথে ভিটামিন সি যুক্ত ফল বা লেবু খান।'
                : 'Mild anemia detected in profile. Iron- and folate-rich local foods are prioritized below. Pair them with Vitamin C sources.'}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK 7: FOR YOUR CURRENT SUPPLEMENTS (DYNAMIC ADVICE)                      */}
      {/* ========================================================================= */}
      {activeSupplementGuides.length > 0 && (
        <div className="bg-gradient-to-br from-cream-card via-sage-50/40 to-maternal-50/40 rounded-3xl p-5 sm:p-6 border-2 border-sage-400/80 shadow-warm-sm space-y-4">
          <div className="flex items-center justify-between border-b border-sage-200/80 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sage-600 text-white shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                  {t.forYourSupplements || (lang === 'bn' ? 'আপনার বর্তমান সাপ্লিমেন্টের জন্য পুষ্টি টিপস' : 'For Your Current Supplements')}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium">
                  {t.supplementFoodAdvice || (lang === 'bn' ? 'প্রেসক্রাইব করা ভিটামিনগুলোর সাথে সঠিক খাবার ও সময় নির্বাচন' : 'Food pairings and timing guidelines for active supplements')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-sage-800 bg-sage-100 px-3 py-1 rounded-full border border-sage-200 shrink-0">
              {activeSupplementGuides.length} {lang === 'bn' ? 'সাপ্লিমেন্ট সক্রিয়' : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSupplementGuides.map(({ trackerItem, key, info }) => {
              const isDoneToday = trackerItem.done;
              return (
                <div key={key} className="bg-white rounded-2xl p-4 border border-sage-200 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm sm:text-base text-gray-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sage-600" />
                        <span>{lang === 'bn' ? info.nutrientBn : info.nutrientEn}</span>
                      </h4>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isDoneToday 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {isDoneToday 
                          ? (lang === 'bn' ? 'আজ গৃহীত ✓' : 'Taken Today ✓') 
                          : (lang === 'bn' ? 'আজ এখনও নেওয়া হয়নি' : 'Pending Today')}
                      </span>
                    </div>

                    {/* Rich Local BD Foods */}
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-gray-700 block uppercase tracking-wider text-[10px]">
                        {lang === 'bn' ? 'দেশি খাবারের উৎস:' : 'Rich Local Foods:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(lang === 'bn' ? info.richFoodsBn : info.richFoodsEn).map((f, idx) => (
                          <span key={idx} className="bg-sage-50 text-sage-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-sage-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* What to Eat With */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                      <span className="font-bold block text-[11px] text-emerald-900 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {lang === 'bn' ? 'যে খাবারের সাথে খাওয়া ভালো:' : 'Best to Take With:'}
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {lang === 'bn' ? info.eatWithBn : info.eatWithEn}
                      </p>
                    </div>

                    {/* Foods to Avoid */}
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 space-y-0.5">
                      <span className="font-bold block text-[11px] text-rose-900 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-rose-600" />
                        {lang === 'bn' ? 'ওষুধ খাওয়ার আশেপাশে বর্জনীয়:' : 'Avoid Within 2 Hours:'}
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {lang === 'bn' ? info.avoidWithBn : info.avoidWithEn}
                      </p>
                    </div>
                  </div>

                  {/* MISSED DOSE ALTERNATIVE WITH STRICT CLINICAL DISCLAIMER */}
                  <div className="pt-2 border-t border-gray-100 text-xs space-y-1 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-950 block text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      {lang === 'bn' ? 'ডোজ মিস হলে পুষ্টি টিপস:' : 'If Dose Missed Today:'}
                    </span>
                    <p className="text-[11px] text-amber-900 leading-snug">
                      {lang === 'bn' ? info.missedDoseTipBn : info.missedDoseTipEn}
                    </p>
                    <p className="text-[10px] font-bold text-rose-700 italic pt-0.5">
                      {lang === 'bn' 
                        ? '⚠️ মনে রাখবেন: খাবার কোনোভাবেই ডাক্তারের প্রেসক্রাইব করা সাপ্লিমেন্টের বিকল্প নয়। চিকিৎসকের পরামর্শ নিন।' 
                        : '⚠️ Note: Food is not a replacement for a prescribed supplement. Talk to your doctor.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nutrient Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold transition-all shadow-2xs active:scale-95 border ${
              selectedCategory === cat.id
                ? 'bg-sage-600 text-white border-sage-700 shadow-sage-sm'
                : 'bg-cream-card text-gray-700 border-sage-200/80 hover:border-sage-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="text-center py-12 bg-cream-card rounded-3xl border border-sage-200 p-8 space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-sage-600 mx-auto animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-gray-600">
            {lang === 'bn' ? 'পুষ্টি তথ্য লোড হচ্ছে...' : 'Loading nutrition dataset...'}
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredFoods.map((food) => {
            const isBoosted = isAnemic && (food.category === 'iron' || food.category === 'folate');
            return (
              <div 
                key={food.id}
                className={`bg-cream-card rounded-3xl p-5 border shadow-sage-sm space-y-4 hover:border-sage-400 transition-all flex flex-col justify-between ${
                  isBoosted ? 'border-amber-400 ring-2 ring-amber-200' : 'border-sage-200/70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl p-2.5 rounded-2xl bg-cream-accent/80 border border-maternal-100 shadow-xs inline-block">
                      {food.img}
                    </span>

                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sage-100 text-sage-800 border border-sage-200">
                        {lang === 'bn' ? food.categoryLabelBn : food.categoryLabelEn}
                      </span>
                      {isBoosted && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                          {lang === 'bn' ? 'রক্তশূন্যতায় সহায়ক 🩸' : 'Anemia Booster 🩸'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                      {lang === 'bn' ? food.nameBn : food.nameEn}
                    </h3>
                    <span className="text-[11px] font-semibold text-maternal-600">
                      {t.localBangladeshi}
                    </span>
                  </div>

                  {/* Why Eat This */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider">
                      {t.whyEatThis}
                    </span>
                    <p className="text-gray-700 leading-relaxed bg-cream-base/60 p-3 rounded-2xl border border-sage-100">
                      {lang === 'bn' ? food.whyBn : food.whyEn}
                    </p>
                  </div>

                  {/* Prep Tip */}
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-sage-800 block text-[11px] uppercase tracking-wider">
                      {t.prepTip}
                    </span>
                    <p className="text-gray-600 italic leading-snug">
                      {lang === 'bn' ? food.prepBn : food.prepEn}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-sage-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>{lang === 'bn' ? 'উপযোগী ত্রৈমাসিক:' : 'Recommended:'}</span>
                  <span className="font-bold text-sage-700">
                    {(food.trimesters || []).map(tVal => tVal.toUpperCase()).join(', ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NutritionScreen;
