import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Share2, Sparkles, HeartPulse, Check, AlertCircle, Info, Stethoscope, Leaf } from 'lucide-react';
import { useApp } from '../context/AppContext';
import TrustBadge from './TrustBadge';

export const DrugAnswerCard = ({ drug }) => {
  const { lang, t, isBookmarked, toggleBookmark, profile } = useApp();
  const [copied, setCopied] = useState(false);
  const bookmarked = isBookmarked(drug.id);

  const handleShare = () => {
    const text = `${drug.nameBn} - ${drug.answerBn}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSafetyBadgeStyle = (rating) => {
    switch(rating) {
      case 'safe':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'caution':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'unsafe':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-cream-card rounded-3xl p-5 sm:p-6 border border-maternal-200/60 shadow-warm-md space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Decorative maternal background glow */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-maternal-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* Card Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${getSafetyBadgeStyle(drug.safetyRating)}`}>
              {drug.safetyRating === 'safe' 
                ? (lang === 'bn' ? 'নিরাপদ সেবন' : 'Safe to Use') 
                : drug.safetyRating === 'caution'
                ? (lang === 'bn' ? 'সতর্কতা প্রয়োজন' : 'Use with Caution')
                : (lang === 'bn' ? 'বর্জনীয় / নিষিদ্ধ' : 'Avoid / Unsafe')}
            </span>

            {/* Profile Trimester Match Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-100 text-sage-800 border border-sage-200">
              {lang === 'bn' ? `${profile.week}তম সপ্তাহ উপযোগী` : `Week ${profile.week} Context`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug pt-1">
            {lang === 'bn' ? drug.nameBn : drug.nameEn}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            <span className="font-semibold text-gray-700">{lang === 'bn' ? 'জেনেরিক:' : 'Generic:'}</span> {lang === 'bn' ? drug.genericBn : drug.genericEn}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => toggleBookmark(drug.id)}
            className={`p-2.5 rounded-2xl border transition-all ${
              bookmarked 
                ? 'bg-maternal-500 text-white border-maternal-600 shadow-sm' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-maternal-300 hover:text-maternal-600'
            }`}
            title={bookmarked ? t.savedAnswer : t.saveAnswer}
          >
            {bookmarked ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-maternal-600 hover:border-maternal-300 transition-all"
            title={t.shareAnswer}
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Trust Indicator Component */}
      <TrustBadge drug={drug} />

      {/* Answer Body */}
      <div className="bg-cream-base/60 p-4 sm:p-5 rounded-2xl border border-maternal-100 space-y-3">
        <div className="flex items-center space-x-2 text-maternal-700 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-maternal-500" />
          <span>{lang === 'bn' ? 'বিশেষজ্ঞ RAG তথ্য ও ক্লাসিক্যাল ML বিশ্লেষণ:' : 'Expert RAG Clinical Summary:'}</span>
        </div>
        
        <p className="text-gray-800 text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line">
          {lang === 'bn' ? drug.answerBn : drug.answerEn}
        </p>

        {/* Trimester Notes / RAG Explanation */}
        <div className="pt-2 border-t border-maternal-200/50 flex items-start space-x-2.5 text-xs sm:text-sm text-gray-700">
          <Info className="w-4 h-4 text-maternal-600 mt-0.5 shrink-0" />
          <div>
            <strong className="text-gray-900 font-semibold">{lang === 'bn' ? 'ক্লিনিক্যাল সেফটি যুক্তি:' : 'Trimester & Hallucination Explanation:'}</strong>{' '}
            {lang === 'bn' ? drug.trimesterNoteBn : drug.trimesterNoteEn}
          </div>
        </div>

        {/* Side-by-Side RAG Grounded vs Direct LLM Comparison View if available */}
        {drug.directAnswer && (
          <div className="pt-3 border-t border-maternal-200/60 space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {lang === 'bn' ? '🔄 পাশাপাশি তুলনা (RAG গ্রাউন্ডেড বনাম ডাইরেক্ট LLM):' : '🔄 Side-by-Side (RAG Grounded vs Direct LLM):'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50/90 p-3 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === 'bn' ? '১. RAG উত্তর (নিরাপদ ও গ্রাউন্ডেড)' : '1. RAG Answer (Grounded)'}
                </span>
                <p className="text-gray-700 line-clamp-4">{drug.answerBn}</p>
              </div>

              <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  {lang === 'bn' ? '২. ডাইরেক্ট জেমিনি (RAG ব্যতীত baseline)' : '2. Direct LLM (No RAG Context)'}
                </span>
                <p className="text-gray-700 line-clamp-4">{drug.directAnswer}</p>
              </div>
            </div>
          </div>
        )}

        {/* ML Feature Breakdown pills if RAG features exist */}
        {drug.features && (
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-gray-600 border-t border-maternal-100">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {lang === 'bn' ? 'কসাইন মিল:' : 'Cos Sim:'} <strong>{(drug.features.cosine_similarity * 100).toFixed(0)}%</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {lang === 'bn' ? 'আক্ষরিক মিল:' : 'Lex Overlap:'} <strong>{(drug.features.lexical_overlap_ratio * 100).toFixed(0)}%</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {lang === 'bn' ? 'কোয়েরি টাইপ:' : 'Query Type:'} <strong>{drug.features.query_type}</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {lang === 'bn' ? 'কর্পাসে উপস্থিত:' : 'In Corpus:'} <strong>{drug.features.relevant_drug_retrieved === 1 ? 'হ্যাঁ (Yes)' : 'না (No)'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Safer Alternatives Section (Crucial if drug is caution or unsafe) */}
      {drug.saferAlternatives && drug.saferAlternatives.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2 text-maternal-800 font-bold text-sm sm:text-base">
            <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
            <span>{t.saferAlternatives}</span>
          </div>

          <p className="text-xs text-gray-600">
            {t.alternativeDesc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drug.saferAlternatives.map((alt, idx) => (
              <div 
                key={idx}
                className="bg-white p-3.5 rounded-2xl border border-rose-200/70 shadow-warm-sm hover:border-maternal-300 transition-all flex items-start space-x-3"
              >
                <div className="p-2 rounded-xl bg-maternal-50 text-maternal-600 shrink-0 mt-0.5">
                  {alt.type === 'med' ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : alt.type === 'natural' ? (
                    <Leaf className="w-4 h-4 text-sage-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    {lang === 'bn' ? alt.nameBn : alt.nameEn}
                  </h4>
                  <p className="text-xs text-gray-600 leading-snug">
                    {lang === 'bn' ? alt.reasonBn : alt.reasonEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Medical Disclaimer */}
      <p className="text-[11px] text-gray-400 text-center italic pt-1">
        {t.askDoctorDisclaimer}
      </p>
    </div>
  );
};

export default DrugAnswerCard;
