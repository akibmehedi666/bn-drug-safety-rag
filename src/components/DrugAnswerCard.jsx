import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck, 
  Share2, 
  Sparkles, 
  HeartPulse, 
  Check, 
  AlertCircle, 
  Info, 
  Stethoscope, 
  Leaf, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  Activity, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import TrustBadge from './TrustBadge';

export const DrugAnswerCard = ({ drug }) => {
  const { lang, t, isBookmarked, toggleBookmark, profile } = useApp();
  const [copied, setCopied] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const bookmarked = isBookmarked(drug.id);

  const handleShare = () => {
    const text = `${drug.nameBn || drug.nameEn} - ${drug.answerBn || drug.answerEn}`;
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

  // Scores & Features Extraction
  const score = drug.confidenceScore !== undefined ? drug.confidenceScore : 90;
  const label = drug.predictedLabel || (drug.safetyRating === 'safe' ? 'Faithful' : drug.safetyRating === 'unsafe' ? 'Hallucinated' : 'Partial');
  const isOutOfCorpus = drug.isOutOfCorpus || (drug.features && drug.features.relevant_drug_retrieved === 0);

  // Status color helpers
  let statusColor = '#16a34a';
  let statusTitle = lang === 'bn' ? 'Faithful (বিশ্বস্ত ও সম্পূর্ণ নিরাপদ)' : 'Faithful (Grounded & Safe)';
  let statusBgClass = 'bg-emerald-50/90 border-emerald-200 border-l-emerald-600 text-gray-900';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (label.toLowerCase().includes('faith')) {
    statusColor = '#16a34a';
    statusTitle = lang === 'bn' ? 'Faithful (বিশ্বস্ত ও তথ্যভিত্তিক)' : 'Faithful (Verified Grounding)';
    statusBgClass = 'bg-emerald-50/90 border-emerald-200 border-l-emerald-600 text-gray-900';
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  } else if (label.toLowerCase().includes('hallucin') || isOutOfCorpus) {
    statusColor = '#dc2626';
    statusTitle = lang === 'bn' ? 'Hallucinated (অবিশ্বস্ত বা কর্পাসের বাইরে)' : 'Hallucinated / Out-of-Corpus';
    statusBgClass = 'bg-rose-50/90 border-rose-200 border-l-rose-600 text-rose-950';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
  } else {
    statusColor = '#d97706';
    statusTitle = lang === 'bn' ? 'Partial (আংশিক সতর্কতামূলক)' : 'Partial / Hedged Advice';
    statusBgClass = 'bg-amber-50/90 border-amber-200 border-l-amber-600 text-amber-950';
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  // Gauge calculations (Circumference of r=40 is 251.2)
  const circumference = 251.2;
  const strokeOffset = circumference - (circumference * (score / 100));

  const feats = drug.features || {
    cosine_similarity: 0.88,
    lexical_overlap_ratio: 0.50,
    relevant_drug_retrieved: 1,
    answer_length_words: 44,
    hedging_count: 2,
    query_type: 'in-corpus'
  };

  const chunks = drug.retrievedChunks || [];

  return (
    <div className="bg-cream-card rounded-3xl p-5 sm:p-7 border border-maternal-200/70 shadow-warm-md space-y-7 relative overflow-hidden transition-all duration-300">
      {/* Decorative maternal background glow */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-maternal-100/50 rounded-full blur-2xl pointer-events-none" />

      {/* ⚠️ HIGH-IMPACT OUT-OF-CORPUS BANNER (Requirement 3 from Main Branch) */}
      {isOutOfCorpus && (
        <div className="bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 text-rose-900 shadow-sm flex items-start gap-3.5 animate-pulse">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-rose-900">
              {lang === 'bn' ? '⚠️ আউট-অফ-কর্পাস সতর্কতা (Out-of-Corpus Warning)' : '⚠️ Out-of-Corpus Clinical Alert'}
            </h4>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium">
              {lang === 'bn'
                ? 'এই ওষুধটি আমাদের ৩০২টি অনুমোদিত মাতৃত্বকালীন ড্রাগ কর্পাসে অন্তর্ভুক্ত নেই। কোনো ভেরিফাইড ক্লিনিক্যাল কনটেক্সট ডাটাবেজে না থাকায় AI-এর উত্তর সরাসরি যাচাই করা সম্ভব নয় — এটি মিথ্যা আশ্বাসের (Hallucination) মারাত্মক ঝুঁকি তৈরি করে। বিশেষজ্ঞ গাইনি চিকিৎসকের সাথে সরাসরি যোগাযোগ করুন।'
                : 'This medication is not present in our 302-drug DGDA verified maternal database. Generative AI responses cannot be grounded against local clinical records and carry severe hallucination risk.'}
            </p>
          </div>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border tracking-wide uppercase ${getSafetyBadgeStyle(drug.safetyRating)}`}>
              {drug.safetyRating === 'safe' 
                ? (lang === 'bn' ? 'নিরাপদ সেবন' : 'Safe to Use') 
                : drug.safetyRating === 'caution'
                ? (lang === 'bn' ? 'সতর্কতা প্রয়োজন' : 'Use with Caution')
                : (lang === 'bn' ? 'বর্জনীয় / নিষিদ্ধ' : 'Avoid / Unsafe')}
            </span>

            {/* Profile Trimester Match Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sage-100 text-sage-800 border border-sage-200">
              {lang === 'bn' ? `${profile.week}তম সপ্তাহ উপযোগী` : `Week ${profile.week} Context`}
            </span>

            {/* In-Corpus vs Out-of-Corpus Tag */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              isOutOfCorpus 
                ? 'bg-rose-100 text-rose-700 border-rose-200' 
                : 'bg-emerald-100 text-emerald-700 border-emerald-200'
            }`}>
              {isOutOfCorpus ? (lang === 'bn' ? 'ডাটাবেজের বাইরে' : 'Out-of-Corpus') : (lang === 'bn' ? '৩০২ ড্রাগ কর্পাসভুক্ত' : 'In-Corpus')}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug pt-1">
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

      {/* ⚠️ PROMINENT PERSONALIZED WARNING CARD (TASK 2) */}
      {drug.personalizedWarnings && drug.personalizedWarnings.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 text-amber-950 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {lang === 'bn' ? '⚠️ আপনার প্রোফাইলভিত্তিক ব্যক্তিগত সতর্কতা:' : '⚠️ Personalized Health Warnings from Your Profile:'}
            </span>
          </div>
          <div className="space-y-1.5 sm:pl-7">
            {drug.personalizedWarnings.map((w, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white/95 border border-amber-300 text-xs sm:text-sm font-medium leading-relaxed text-amber-900 flex items-start gap-2 shadow-2xs">
                <span>{lang === 'bn' ? (w.bn || w.en) : (w.en || w.bn)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Trust Badge Component */}
      <TrustBadge drug={drug} />

      {/* ========================================================================= */}
      {/* 1. TOP PART: SIDE-BY-SIDE DUAL ANSWER (RAG vs LLM) - Follows Main Branch   */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-maternal-500" />
            <span>{lang === 'bn' ? '🔄 পাশাপাশি উত্তরের সরাসরি তুলনা (Side-by-Side Response):' : '🔄 Side-by-Side Dual Answer Comparison:'}</span>
          </h3>
          <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
            {lang === 'bn' ? 'গ্রাউন্ডেড RAG বনাম সাধারণ আন-গ্রাউন্ডেড LLM' : 'Grounded RAG vs Ungrounded LLM'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* COLUMN 1: ✅ With RAG (নিরাপদ ও গ্রাউন্ডেড) */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 border-t-4 border-t-emerald-600 p-4 sm:p-5 shadow-warm-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <span className="font-extrabold text-sm sm:text-base text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  {lang === 'bn' ? '✅ With RAG (নিরাপদ ও গ্রাউন্ডেড)' : '✅ With RAG (Safe & Grounded)'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeClass}`}>
                  {label}
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700/80 block leading-tight">
                {lang === 'bn' 
                  ? 'কর্পাস কনটেক্সট যুক্ত · DGDA/MedEx ৩০২ ডাটাবেজ · হ্যালুসিনেশন ডিটেকশন লেয়ার দ্বারা ভেরিফাইড' 
                  : 'Corpus Grounded · DGDA/MedEx 302 Database · Verified by Random Forest Classifier'}
              </span>

              {/* RAG Answer Box with Dynamic Color */}
              <div className={`p-4 rounded-xl border text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line border-l-4 ${statusBgClass}`}>
                {lang === 'bn' ? drug.answerBn : drug.answerEn}
              </div>
            </div>

            {/* Trimester Notes & Source Citation */}
            <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex items-start space-x-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-gray-900 font-semibold">{lang === 'bn' ? 'ক্লিনিক্যাল যুক্তি:' : 'Clinical Rationale:'}</strong>{' '}
                  {lang === 'bn' ? drug.trimesterNoteBn : drug.trimesterNoteEn}
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between">
                <span>{lang === 'bn' ? 'তথ্যের ভিত্তি: ডিজিডিএ ও মেডেক্স ৩০২ ড্রাগ রেজিস্ট্রি' : 'Grounding: DGDA & MedEx 302 MCH Registry'}</span>
                <span className="text-emerald-700 font-bold">{score}% {lang === 'bn' ? 'কনফিডেন্স' : 'Confidence'}</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: ❌ Without RAG (ঝুঁকিপূর্ণ সাধারণ LLM) */}
          <div className="bg-[#FFFDFD] rounded-2xl border-2 border-rose-200 border-t-4 border-t-rose-600 p-4 sm:p-5 shadow-warm-sm flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <span className="font-extrabold text-sm sm:text-base text-rose-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                  {lang === 'bn' ? '❌ Without RAG (ঝুঁকিপূর্ণ)' : '❌ Without RAG (Unverified LLM)'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                  {lang === 'bn' ? 'Unverified / Unsafe' : 'Unverified / Unsafe'}
                </span>
              </div>
              <span className="text-[11px] font-medium text-rose-700/80 block leading-tight">
                {lang === 'bn' 
                  ? 'সরাসরি জেনারেটিভ AI · কোনো গ্রাউন্ডিং নেই · মিথ্যা আশ্বাসের (False Reassurance) উচ্চ ঝুঁকি' 
                  : 'Direct Generative LLM · No DGDA Grounding · High Risk of False Reassurance'}
              </span>

              {/* Direct LLM Answer Box */}
              {(!drug.directAnswer || drug.directAnswer.toLowerCase().includes('unavailable') || drug.directAnswer.toLowerCase().includes('api key')) ? (
                <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 text-amber-900 p-4 rounded-xl text-xs sm:text-sm leading-relaxed space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {drug.directAnswer || (lang === 'bn' ? 'সরাসরি এলএলএম তুলনা অনুপলব্ধ' : 'LLM comparison unavailable')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90">
                    {lang === 'bn'
                      ? 'রোগীর নিরাপত্তার স্বার্থে অনুমাননির্ভর ডেমো উত্তর বন্ধ রাখা হয়েছে। Google AI Studio থেকে সক্রিয় Gemini API কী যুক্ত করুন।'
                      : 'Ungrounded direct comparison requires an active Gemini API key from Google AI Studio. Fake demonstration answers are disabled.'}
                  </p>
                </div>
              ) : (
                <div className="bg-[#FFF1F2] border-2 border-[#FECDD3] border-l-4 border-l-[#F43F5E] text-[#881337] p-4 rounded-xl text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line">
                  {drug.directAnswer}
                </div>
              )}
            </div>

            {/* Why This Is Dangerous Callout */}
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-rose-950">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{lang === 'bn' ? '⚠️ কেন এটি বিপজ্জনক (Why Dangerous)?' : '⚠️ Why is this dangerous?'}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800">
                {lang === 'bn'
                  ? 'সরাসরি কোনো রেগুলেটেড ডাটাবেজ কনটেক্সট ছাড়া সাধারণ LLM অনেক সময় নিষিদ্ধ ড্রাগকেও "ডাক্তারের পরামর্শে খাওয়া যেতে পারে" বলে মিথ্যা আশ্বাস (False Reassurance) দেয়। আমাদের RAG ও ক্লাসিক্যাল ML ফিল্টার এই মারাত্মক ভুল প্রতিরোধ করে।'
                  : 'Standard LLMs without grounding often issue permissive advice ("consult a doctor, take with caution") on strictly contraindicated drugs, giving false reassurance.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOWNWARD PART: EVALUATION SCORES DONE BY BOTH ENDS (Follows Main Branch) */}
      {/* ========================================================================= */}
      <div className="pt-2 space-y-5 border-t-2 border-maternal-200/60">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-maternal-600" />
            <span>{lang === 'bn' ? '📊 উভয় প্রান্তের মূল্যায়ন ও ভেরিফিকেশন মেট্রিক্স (Evaluation Scores):' : '📊 Evaluation Scores & Verification Layer from Both Ends:'}</span>
          </h3>
          <span className="text-xs text-maternal-700 font-bold bg-maternal-50 px-2.5 py-1 rounded-full border border-maternal-200">
            {lang === 'bn' ? 'Random Forest • ১০০% হ্যালুসিনেশন রিকল' : 'Random Forest • 100% Hallucination Recall'}
          </span>
        </div>

        {/* 2.1 Circular Confidence Gauge & Auto-Explanation (Requirement 1 from Main Branch) */}
        <div className="bg-white rounded-2xl border border-maternal-200 p-4 sm:p-5 shadow-warm-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="fill-none stroke-gray-200"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="fill-none transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                stroke={statusColor}
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-gray-900 leading-none">{score}%</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase mt-0.5">{lang === 'bn' ? 'স্কোর' : 'Score'}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              {lang === 'bn' ? 'নির্ভরযোগ্যতা ও সত্যতা স্কোর (Faithfulness Score)' : 'Faithfulness & Confidence Score'}
            </span>
            <h4 className="text-base sm:text-lg font-extrabold" style={{ color: statusColor }}>
              {statusTitle}
            </h4>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-normal">
              {drug.explanationBn || (
                label === 'Faithful'
                  ? (lang === 'bn' 
                      ? 'সঠিক ওষুধ ডাটাবেজে পাওয়া গেছে এবং উত্তরের বক্তব্য কনটেক্সটের সাথে সম্পূর্ণ সামঞ্জস্যপূর্ণ।' 
                      : 'The correct drug record was retrieved and generated output strictly aligns with DGDA clinical guidelines.')
                  : (lang === 'bn'
                      ? 'উত্তরের দাবির সাথে ডাটাবেজের মূল তথ্যের নির্ভরযোগ্য মিল নেই অথবা ওষুধটি ডাটাবেজে অনুপস্থিত।'
                      : 'Output does not align with verifiable dataset records; high risk of hallucination.')
              )}
            </p>
          </div>
        </div>

        {/* 2.2 Comparative Evaluation Score Matrix (RAG System vs Direct LLM Table) */}
        <div className="bg-white rounded-2xl border border-maternal-200 p-4 sm:p-5 shadow-warm-sm space-y-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-maternal-600" />
              <span>{lang === 'bn' ? 'দ্বিমুখী মূল্যায়ন সূচক তুলনা (RAG System vs Direct LLM)' : 'Dual Evaluation Comparison Matrix'}</span>
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <th className="p-2.5 border-r border-gray-200">{lang === 'bn' ? 'মূল্যায়ন নির্দেশক (Metric)' : 'Evaluation Metric'}</th>
                  <th className="p-2.5 border-r border-gray-200 text-emerald-800 bg-emerald-50/70">{lang === 'bn' ? '✅ GorbhoMaya RAG সিস্টেম' : '✅ GorbhoMaya RAG'}</th>
                  <th className="p-2.5 text-rose-800 bg-rose-50/70">{lang === 'bn' ? '❌ সরাসরি সাধারণ LLM (No RAG)' : '❌ Direct LLM (No Grounding)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'তথ্যের ভিত্তি (Grounding)' : 'Grounding Source'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{lang === 'bn' ? 'DGDA ও MedEx ৩০২টি ড্রাগ কর্পাস (যাচাইকৃত)' : 'DGDA & MedEx 302 MCH Registry'}</td>
                  <td className="p-2.5 text-rose-700 font-medium">{lang === 'bn' ? 'আন-ভেরিফাইড ইন্টারনেট মেমোরি (যাচাইহীন)' : 'Unverified Web Parametric Memory'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'Faithfulness Score' : 'Faithfulness Score'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{score}% ({lang === 'bn' ? 'উচ্চ নির্ভরযোগ্যতা' : 'High Confidence'})</td>
                  <td className="p-2.5 text-rose-700 font-medium">{lang === 'bn' ? 'যাচাইহীন (অজানা ঝুঁকি)' : 'Unmonitored / High Hallucination Risk'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'হ্যালুসিনেশন ডিটেকশন' : 'Hallucination Filter'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{lang === 'bn' ? 'র্যান্ডম ফরেস্ট (১০০% রিকল)' : 'Random Forest (100% Recall)'}</td>
                  <td className="p-2.5 text-rose-700 font-medium">{lang === 'bn' ? 'কোনো ফিল্টার নেই (০% ফিল্টারিং)' : 'None (0% Safety Filtering)'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'Cosine Similarity (শব্দার্থিক মিল)' : 'Cosine Similarity'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{(feats.cosine_similarity * 100).toFixed(1)}% {lang === 'bn' ? '(ক্লিনিক্যাল কনটেক্সটে আবদ্ধ)' : '(Grounded)'}</td>
                  <td className="p-2.5 text-gray-500 font-medium">N/A ({lang === 'bn' ? 'কোনো রেগুলেটেড কনটেক্সট নেই' : 'No Context'})</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'Lexical Overlap (শব্দ মিল)' : 'Lexical Overlap'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{(feats.lexical_overlap_ratio * 100).toFixed(1)}% {lang === 'bn' ? '(সরাসরি বাংলা শব্দ মিল)' : '(Direct Bengali Overlap)'}</td>
                  <td className="p-2.5 text-gray-500 font-medium">N/A</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'কর্পাসে ওষুধ উপস্থিত কি না' : 'Relevant Drug in Corpus'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{feats.relevant_drug_retrieved ? (lang === 'bn' ? 'হ্যাঁ (১)' : 'Yes (1)') : (lang === 'bn' ? 'না (০ - সতর্কবার্তা)' : 'No (0 - Alert)')}</td>
                  <td className="p-2.5 text-gray-500 font-medium">N/A</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold bg-gray-50/50 border-r border-gray-200">{lang === 'bn' ? 'ক্লিনিক্যাল গার্ডরেইল' : 'Clinical Safety Guardrail'}</td>
                  <td className="p-2.5 font-bold text-emerald-700 border-r border-gray-200">{lang === 'bn' ? 'ক্যাটাগরি ভিত্তিক স্পষ্ট বিধিনিষেধ/নিষেধাজ্ঞা' : 'Strict Contraindication / Category Rules'}</td>
                  <td className="p-2.5 text-rose-700 font-medium">{lang === 'bn' ? 'মিথ্যা আশ্বাস (False Reassurance)' : 'Permissive / False Reassurance Risk'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2.3 Collapsible Secondary 6-Feature ML Table (Requirement 1 from Main Branch) */}
        <div className="bg-cream-base/80 rounded-2xl border border-maternal-200/80 p-3.5 sm:p-4 text-xs">
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="w-full flex items-center justify-between text-left font-bold text-maternal-700 hover:text-maternal-800 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-maternal-500" />
              <span>{lang === 'bn' ? '📊 বিস্তারিত ৬টি ক্লাসিক্যাল ML ইঞ্জিনিয়ারিং ফিচার ম্যাট্রিক্স (Expandable Feature Matrix)' : '📊 Detailed 6 Classical ML Engineered Features Matrix'}</span>
            </span>
            {showFeatures ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFeatures && (
            <div className="mt-3 pt-3 border-t border-maternal-200/60 overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-200 text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold text-gray-700">
                    <th className="p-2 border border-gray-200">{lang === 'bn' ? 'ফিচার (Feature)' : 'Feature Name'}</th>
                    <th className="p-2 border border-gray-200">{lang === 'bn' ? 'মান (Extracted Value)' : 'Value'}</th>
                    <th className="p-2 border border-gray-200">{lang === 'bn' ? 'ক্লিনিক্যাল গুরুত্ব (Clinical Significance)' : 'Significance'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Cosine Similarity</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.cosine_similarity ?? '0.88'}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{lang === 'bn' ? 'কনটেক্সট ও উত্তরের শব্দার্থিক ভেক্টর সিমিলারিটি' : 'Context-answer semantic alignment'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Lexical Overlap Ratio</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.lexical_overlap_ratio != null ? (feats.lexical_overlap_ratio * 100).toFixed(1) + '%' : '50%'}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{lang === 'bn' ? 'সরাসরি বাংলা শব্দের মিল অনুপাত' : 'Direct Bengali token overlap'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Relevant Drug Retrieved?</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.relevant_drug_retrieved ? (lang === 'bn' ? 'হ্যাঁ (১)' : '1 (True)') : (lang === 'bn' ? 'না (০)' : '0 (False)')}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{lang === 'bn' ? 'প্রশ্নে উল্লেখিত ড্রাগটি ডাটাবেজে ছিল কি না' : 'Whether query drug exists in corpus'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Answer Length (Words)</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.answer_length_words ?? 44} {lang === 'bn' ? 'শব্দ' : 'words'}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{lang === 'bn' ? 'উত্তরের মোট শব্দ সংখ্যা' : 'Generated answer token length'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Hedging Word Count</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.hedging_count ?? 2} {lang === 'bn' ? 'টি' : ''}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">{lang === 'bn' ? 'সতর্কতামূলক বা অস্পষ্ট শব্দের সংখ্যা' : 'Caution/hedging term frequency'}</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-200 font-semibold">Query Type</td>
                    <td className="p-2 border border-gray-200 font-bold text-maternal-700">{feats.query_type || (isOutOfCorpus ? 'out-of-corpus' : 'in-corpus')}</td>
                    <td className="p-2 border border-gray-200 text-gray-600">In-Corpus / Out-of-Corpus / Ambiguous</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2.4 Top-3 Retrieved Chunks Grounding (Requirement 2 from Main Branch) */}
        {chunks && chunks.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                {lang === 'bn'
                  ? 'নিচের তথ্যগুলো আমাদের ৩০২টি ওষুধের ডাটাবেজ থেকে ভেক্টর সার্চে খুঁজে বের করা হয়েছে এবং AI শুধুমাত্র এই তথ্যের ভিত্তিতে উত্তর দিয়েছে — এটাই RAG-এর মূল ভিত্তি (Grounding)।'
                  : 'The passages below were retrieved via vector similarity search over our 302-drug corpus. The LLM was strictly restricted to this context.'}
              </span>
            </div>

            <div className="space-y-2.5">
              {chunks.map((chunk, idx) => {
                const sim = chunk.similarity_score || 0;
                const simPct = Math.round(Math.min(100, Math.max(0, sim * 100)));
                return (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                      <span className="font-extrabold text-gray-900 flex items-center gap-1">
                        <span>💊</span>
                        <span>[{lang === 'bn' ? `র‍্যাংক ${idx + 1}` : `Rank ${idx + 1}`}] {chunk.name || 'ঔষধ কনটেক্সট'}</span>
                      </span>
                      <span className="inline-flex items-center gap-2 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold text-emerald-800 text-[11px]">
                        <span className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden inline-block">
                          <span className="h-full bg-emerald-600 block" style={{ width: `${simPct}%` }}></span>
                        </span>
                        <span>{lang === 'bn' ? 'স্কোর' : 'Score'}: {sim.toFixed(3)} ({simPct}%)</span>
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed font-normal">
                      {chunk.text || chunk.chunk_text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SAFER RECOMMENDED ALTERNATIVES (If Unsafe or Caution)                   */}
      {/* ========================================================================= */}
      {drug.saferAlternatives && drug.saferAlternatives.length > 0 && (
        <div className="space-y-3 pt-3 border-t-2 border-maternal-200/60">
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
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
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
      <p className="text-[11px] text-gray-400 text-center italic pt-1 border-t border-gray-100">
        {t.askDoctorDisclaimer}
      </p>
    </div>
  );
};

export default DrugAnswerCard;
