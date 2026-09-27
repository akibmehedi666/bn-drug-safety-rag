import React, { useState } from 'react';
import { Apple, Sparkles, Filter, Heart, Info, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { nutritionDatabase } from '../data/mockData';

export const NutritionScreen = () => {
  const { lang, t, profile } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: t.allNutrients },
    { id: 'folate', label: t.folate },
    { id: 'iron', label: t.iron },
    { id: 'calcium', label: t.calcium },
    { id: 'protein', label: t.protein },
  ];

  const filteredFoods = selectedCategory === 'all'
    ? nutritionDatabase
    : nutritionDatabase.filter(food => food.category === selectedCategory);

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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredFoods.map((food) => (
          <div 
            key={food.id}
            className="bg-cream-card rounded-3xl p-5 border border-sage-200/70 shadow-sage-sm space-y-4 hover:border-sage-400 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-4xl p-2.5 rounded-2xl bg-cream-accent/80 border border-maternal-100 shadow-xs inline-block">
                  {food.img}
                </span>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sage-100 text-sage-800 border border-sage-200">
                  {lang === 'bn' ? food.categoryLabelBn : food.categoryLabelEn}
                </span>
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
                {food.trimesters.map(t => t.toUpperCase()).join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionScreen;
