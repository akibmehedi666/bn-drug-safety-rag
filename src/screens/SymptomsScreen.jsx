import React, { useState } from 'react';
import { Stethoscope, Search, ChevronDown, ChevronUp, AlertOctagon, HeartHandshake, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { symptomsDatabase } from '../data/mockData';

export const SymptomsScreen = () => {
  const { lang, t } = useApp();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('nausea'); // Nausea expanded by default

  const filteredSymptoms = symptomsDatabase.filter(item => {
    const q = query.toLowerCase();
    return item.titleEn.toLowerCase().includes(q) || 
           item.titleBn.toLowerCase().includes(q) || 
           item.descEn.toLowerCase().includes(q) || 
           item.descBn.toLowerCase().includes(q);
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-rose-500" />
          <span>{t.symptomsTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          {t.symptomsSubtitle}
        </p>
      </div>

      {/* Educational Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t.notDiagnosticDisclaimer}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchSymptomPlaceholder}
          className="w-full bg-cream-card pl-11 pr-4 py-3.5 rounded-2xl border border-maternal-200 focus:border-maternal-500 focus:ring-4 focus:ring-maternal-100 text-sm font-medium placeholder:text-gray-400 shadow-warm-xs outline-hidden text-gray-900"
        />
        <Search className="w-5 h-5 text-maternal-500 absolute left-4 top-3.5 pointer-events-none" />
      </div>

      {/* Symptoms Accordion Cards */}
      <div className="space-y-4">
        {filteredSymptoms.map((sym) => {
          const isExpanded = expandedId === sym.id;
          return (
            <div 
              key={sym.id}
              className={`bg-cream-card rounded-3xl border transition-all overflow-hidden ${
                isExpanded 
                  ? 'border-maternal-400 shadow-warm-md ring-2 ring-maternal-100' 
                  : 'border-maternal-200/80 shadow-warm-sm hover:border-maternal-300'
              }`}
            >
              {/* Accordion Header */}
              <button
                onClick={() => toggleExpand(sym.id)}
                className="w-full p-5 text-left flex items-start justify-between gap-3 focus:outline-hidden"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      {sym.trimesterTag}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    {lang === 'bn' ? sym.titleBn : sym.titleEn}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {lang === 'bn' ? sym.descBn : sym.descEn}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-cream-accent text-maternal-700 shrink-0 mt-1">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-maternal-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  
                  {/* Gentle Home Self-Care Remedies */}
                  <div className="bg-sage-50/70 p-4 rounded-2xl border border-sage-200 space-y-2.5">
                    <div className="flex items-center space-x-2 text-sage-800 font-bold text-xs uppercase tracking-wider">
                      <HeartHandshake className="w-4 h-4 text-sage-600" />
                      <span>{t.selfCareTips}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-800">
                      {(lang === 'bn' ? sym.selfCareBn : sym.selfCareEn).map((tip, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* PROMINENT RED FLAG WARNING BOX */}
                  <div className="bg-rose-500 text-white p-4 rounded-2xl border border-rose-600 space-y-2.5 shadow-warm-sm">
                    <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-rose-100">
                      <AlertOctagon className="w-4 h-4 text-white animate-bounce" />
                      <span>{t.redFlagWarning}</span>
                    </div>

                    <ul className="space-y-2 text-xs text-rose-50 font-medium">
                      {(lang === 'bn' ? sym.redFlagBn : sym.redFlagEn).map((warning, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="font-bold text-white text-sm leading-none">•</span>
                          <span className="leading-relaxed">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SymptomsScreen;
