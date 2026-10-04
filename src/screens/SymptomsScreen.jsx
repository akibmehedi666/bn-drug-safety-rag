import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon, 
  HeartHandshake, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SymptomsScreen = () => {
  const { lang, t } = useApp();
  const [symptoms, setSymptoms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState('nausea');

  useEffect(() => {
    let isMounted = true;
    const fetchSymptoms = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/symptoms');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setSymptoms(data.symptoms || []);
        }
      } catch (err) {
        console.error('Failed to load /api/symptoms:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSymptoms();
    return () => { isMounted = false; };
  }, []);

  const filteredSymptoms = symptoms.filter(item => {
    const q = query.toLowerCase();
    return (item.titleEn || '').toLowerCase().includes(q) || 
           (item.titleBn || '').toLowerCase().includes(q) || 
           (item.descEn || '').toLowerCase().includes(q) || 
           (item.descBn || '').toLowerCase().includes(q);
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

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 bg-cream-card rounded-3xl border border-maternal-200 p-8 space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-rose-500 mx-auto animate-spin" />
          <p className="text-xs sm:text-sm font-semibold text-gray-600">
            {lang === 'bn' ? 'লক্ষণ গাইড লোড হচ্ছে...' : 'Loading symptoms clinical guide...'}
          </p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Symptoms Accordion Cards */}
      {!isLoading && (
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
                  type="button"
                  onClick={() => toggleExpand(sym.id)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-maternal-100 text-maternal-800 border border-maternal-200">
                        {sym.trimesterTag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 pt-0.5">
                      {lang === 'bn' ? sym.titleBn : sym.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
                      {lang === 'bn' ? sym.descBn : sym.descEn}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-cream-base text-gray-500 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-maternal-600" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-maternal-100/80 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Self-Care Section */}
                    <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs sm:text-sm">
                        <HeartHandshake className="w-4 h-4 text-emerald-600" />
                        <span>{t.selfCareTips}</span>
                      </div>
                      <ul className="space-y-1.5 pl-1 text-xs text-gray-700">
                        {(lang === 'bn' ? sym.selfCareBn : sym.selfCareEn).map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Red Flag Warning Section */}
                    <div className="bg-rose-50 rounded-2xl p-4 border-2 border-rose-300 space-y-2">
                      <div className="flex items-center space-x-2 text-rose-950 font-extrabold text-xs sm:text-sm">
                        <AlertOctagon className="w-4 h-4 text-rose-600" />
                        <span>{t.redFlagWarning}</span>
                      </div>
                      <ul className="space-y-1.5 pl-1 text-xs text-rose-900 font-medium">
                        {(lang === 'bn' ? sym.redFlagBn : sym.redFlagEn).map((warning, idx) => (
                          <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                            <span className="text-rose-600 font-bold text-sm leading-none shrink-0">•</span>
                            <span>{warning}</span>
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
      )}
    </div>
  );
};

export default SymptomsScreen;
