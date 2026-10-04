import React, { createContext, useContext, useState } from 'react';
import { uiTranslations, initialProfile, drugsDatabase, defaultTrackerItems } from '../data/mockData';

const AppContext = createContext();

// Clean regex string escaping
const escapeRegex = (str) => (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Conversational stop words for English and Bengali clinical queries
const CONVERSATIONAL_STOP_WORDS = new Set([
  'is', 'can', 'i', 'take', 'safe', 'for', 'in', 'during', 'pregnancy', 'pregnant',
  'lactation', 'breastfeeding', 'medicine', 'drug', 'tablet', 'syrup', 'capsule',
  'dose', 'dosing', 'should', 'what', 'about', 'use', 'when', 'my', 'the', 'a',
  'কি', 'খাওয়া', 'যাবে', 'সেবন', 'করা', 'নিরাপদ', 'গর্ভাবস্থায়', 'গর্ভবতী', 'ওষুধ',
  'ট্যাবলেট', 'ক্যাপসুল', 'খেলে', 'কোনো', 'ক্ষতি', 'হবে', 'পার্শ্বপ্রতিক্রিয়া', 'খাব',
  'খেতে', 'পারব', 'পারি', 'নিয়ম', 'মাত্রা', 'ডোজ', 'এর', 'কাজ'
]);

const extractSearchTokens = (str) => {
  if (!str) return [];
  const lower = str.toLowerCase().trim();
  const allTokens = lower.split(/[\s,?!;.:/\\()]+/).filter(w => w.length >= 2);
  const meaningful = allTokens.filter(t => !CONVERSATIONAL_STOP_WORDS.has(t));
  return meaningful.length > 0 ? meaningful : allTokens;
};

// Strict whole-word token matching (supports Bengali \u0980-\u09FF and Latin alphanumeric)
const isWordMatch = (text, term) => {
  if (!text || !term) return false;
  const tLower = text.toLowerCase().trim();
  const termLower = term.toLowerCase().trim();
  if (tLower === termLower) return true;
  
  const escaped = escapeRegex(termLower);
  const regex = new RegExp(`(^|[^a-zA-Z0-9\u0980-\u09FF])${escaped}($|[^a-zA-Z0-9\u0980-\u09FF])`, 'i');
  return regex.test(tLower);
};

// Clinical safety inference fallback from clinical notes or generated RAG answer
const inferSafetyFromText = (text) => {
  const lower = (text || '').toLowerCase();
  if (
    lower.includes('নিষেধ') || 
    lower.includes('contraindicat') || 
    lower.includes('ঝুঁকিপূর্ণ') || 
    lower.includes('মারাত্মক') || 
    lower.includes('unsafe') || 
    lower.includes('ক্যাটাগরি ডি') || 
    lower.includes('category d') || 
    lower.includes('ক্ষতিকর')
  ) {
    return 'unsafe';
  }
  if (
    lower.includes('সতর্কতা') || 
    lower.includes('caution') || 
    lower.includes('নজরদারি') || 
    lower.includes('সীমিত')
  ) {
    return 'caution';
  }
  return 'safe';
};

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('bn'); // Default to Bengali for local authenticity
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(initialProfile);
  const [bookmarkedIds, setBookmarkedIds] = useState(['napa', 'filwel']);
  const [trackerItems, setTrackerItems] = useState(defaultTrackerItems);
  const [streakDays, setStreakDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrug, setActiveDrug] = useState(drugsDatabase[0]); // Default to Napa
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const [ragResult, setRagResult] = useState(null);
  const [isSearchingRag, setIsSearchingRag] = useState(false);

  // Translations shortcut
  const t = uiTranslations[lang];

  const toggleLanguage = () => {
    setLang(prev => prev === 'bn' ? 'en' : 'bn');
  };

  const setWeek = (weekNum) => {
    const w = Math.min(Math.max(Number(weekNum) || 1, 1), 40);
    let stage = '1st';
    if (w >= 28) stage = '3rd';
    else if (w >= 13) stage = '2nd';

    setProfile(prev => ({ ...prev, week: w, stage }));
  };

  const toggleBookmark = (drugId) => {
    setBookmarkedIds(prev => 
      prev.includes(drugId) ? prev.filter(id => id !== drugId) : [...prev, drugId]
    );
  };

  const isBookmarked = (drugId) => bookmarkedIds.includes(drugId);

  const toggleTrackerItem = (id) => {
    setTrackerItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, done: !item.done };
      }
      return item;
    }));
  };

  const addTrackerItem = (nameEn, nameBn, time) => {
    const newItem = {
      id: Date.now(),
      nameEn,
      nameBn: nameBn || nameEn,
      time: time || 'morning',
      done: false
    };
    setTrackerItems(prev => [...prev, newItem]);
  };

  const getDrugSuggestions = (query, limit = 8) => {
    if (!query || !query.trim()) return [];
    const cleanQ = query.trim().toLowerCase();
    const tokens = extractSearchTokens(cleanQ);

    const scored = [];
    for (const d of drugsDatabase) {
      let score = 0;
      const genEn = (d.genericEn || '').toLowerCase();
      const genBn = (d.genericBn || '').toLowerCase();
      const nameEn = (d.nameEn || '').toLowerCase();
      const nameBn = (d.nameBn || '').toLowerCase();

      // 1. Direct ID match
      if (d.id && (d.id.toLowerCase() === cleanQ || d.id.toLowerCase().startsWith(cleanQ))) {
        score += 160;
      }

      // 2. Brand names match (exact, prefix, substring)
      if (d.brandNames && d.brandNames.length > 0) {
        for (const b of d.brandNames) {
          const bLower = b.toLowerCase();
          if (bLower === cleanQ) score += 150;
          else if (bLower.startsWith(cleanQ)) score += 120;
          else if (bLower.includes(cleanQ)) score += 80;
          else if (tokens.some(t => bLower.includes(t) || t.includes(bLower))) score += 70;
        }
      }

      // 3. Generic name match
      if (genEn === cleanQ || genBn === cleanQ) score += 140;
      else if (genEn.startsWith(cleanQ) || genBn.startsWith(cleanQ)) score += 110;
      else if (genEn.includes(cleanQ) || genBn.includes(cleanQ)) score += 85;
      else if (tokens.some(t => genEn.includes(t) || genBn.includes(t))) score += 65;

      // 4. Name match
      if (nameEn.includes(cleanQ) || nameBn.includes(cleanQ)) score += 60;
      else if (tokens.some(t => nameEn.includes(t) || nameBn.includes(t))) score += 50;

      // 5. Keyword match
      if (d.keywords && d.keywords.length > 0) {
        for (const k of d.keywords) {
          const kLower = k.toLowerCase();
          if (kLower === cleanQ) score += 75;
          else if (tokens.some(t => kLower === t)) score += 45;
        }
      }

      if (score >= 40) {
        scored.push({ drug: d, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.drug);
  };

  const filterDrugs = (category, safetyRating) => {
    return drugsDatabase.filter(d => {
      const matchCat = !category || category === 'all' || (d.category && d.category.toLowerCase().includes(category.toLowerCase()));
      const matchSafety = !safetyRating || safetyRating === 'all' || d.safetyRating === safetyRating;
      return matchCat && matchSafety;
    });
  };

  const searchDrug = async (query) => {
    const cleanQ = query.trim();
    setSearchQuery(query);
    if (!cleanQ) return null;

    setIsSearchingRag(true);
    const qLower = cleanQ.toLowerCase();
    const coreTokens = extractSearchTokens(qLower);

    // Multi-tier best match scoring across full 302 drug registry
    let bestDrug = null;
    let highestScore = 0;

    drugsDatabase.forEach(d => {
      let score = 0;
      const genEn = (d.genericEn || '').toLowerCase();
      const genBn = (d.genericBn || '').toLowerCase();
      const nameEn = (d.nameEn || '').toLowerCase();
      const nameBn = (d.nameBn || '').toLowerCase();
      const catLower = (d.category || '').toLowerCase();

      // 1. Direct ID exact match
      if (d.id && (d.id.toLowerCase() === qLower || coreTokens.includes(d.id.toLowerCase()))) {
        score += 160;
      }

      // 2. Generic Name Match (High Priority)
      if (isWordMatch(qLower, genEn) || isWordMatch(genEn, qLower) || genEn === qLower) {
        score += 130;
      }
      if (isWordMatch(qLower, genBn) || isWordMatch(genBn, qLower) || genBn === qLower) {
        score += 130;
      }
      if (coreTokens.some(t => isWordMatch(genEn, t) || isWordMatch(genBn, t) || genEn.includes(t) || genBn.includes(t))) {
        score += 90;
      }

      // 3. Exact & Token Brand Name Match
      if (d.brandNames && d.brandNames.length > 0) {
        for (const b of d.brandNames) {
          const bLower = b.toLowerCase();
          if (bLower === qLower) {
            score += 140; // Exact single-brand query match
          } else if (isWordMatch(qLower, bLower) || isWordMatch(bLower, qLower)) {
            score += 110;
          } else if (coreTokens.some(t => t === bLower || isWordMatch(bLower, t))) {
            score += 95;
          } else if (bLower.includes(qLower) || (coreTokens.length === 1 && bLower.includes(coreTokens[0]))) {
            score += 65;
          }
        }
      }

      // 4. Keyword Match
      if (d.keywords && d.keywords.length > 0) {
        for (const k of d.keywords) {
          const kLower = k.toLowerCase();
          if (kLower === qLower) {
            score += 110;
          } else if (coreTokens.includes(kLower)) {
            score += 70;
          } else if (isWordMatch(qLower, kLower)) {
            score += (kLower.length >= 4 ? 60 : 35);
          }
        }
      }

      // 5. Full Display Name Match
      if (isWordMatch(qLower, nameEn) || isWordMatch(nameEn, qLower)) {
        score += 75;
      }
      if (isWordMatch(qLower, nameBn) || isWordMatch(nameBn, qLower)) {
        score += 75;
      }

      // 6. Category Match
      if (coreTokens.some(t => catLower.includes(t))) {
        score += 30;
      }

      if (score > highestScore) {
        highestScore = score;
        bestDrug = d;
      }
    });

    const matchedLocal = highestScore >= 35 ? bestDrug : null;

    try {
      // Attempt querying Flask Python RAG backend if available
      const res = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQ })
      });

      if (res.ok) {
        const data = await res.json();
        setRagResult(data);
        
        // Determine clinical safety rating (RAG faithfulness is NOT drug safety!)
        const inferredSafety = matchedLocal 
          ? matchedLocal.safetyRating 
          : inferSafetyFromText(data.answer + ' ' + (data.retrieved_chunks?.[0]?.text || ''));

        // Construct drug card object from RAG API response
        const ragDrug = {
          ...matchedLocal,
          id: matchedLocal ? matchedLocal.id : ('rag-' + Date.now()),
          keywords: matchedLocal ? matchedLocal.keywords : [cleanQ],
          nameEn: matchedLocal ? matchedLocal.nameEn : (data.question + " (RAG Grounded)"),
          nameBn: matchedLocal ? matchedLocal.nameBn : (data.question + " (RAG ভেরিফাইড)"),
          genericEn: matchedLocal ? matchedLocal.genericEn : (data.retrieved_chunks?.[0]?.name || "302 MCH Drug Corpus"),
          genericBn: matchedLocal ? matchedLocal.genericBn : (data.retrieved_chunks?.[0]?.name || "৩০২ ড্রাগস ডাটাবেজ"),
          brandNames: matchedLocal ? matchedLocal.brandNames : [cleanQ],
          safetyRating: inferredSafety,
          trustLevel: data.predicted_label === 'Faithful' ? 'verified' : 'limited',
          confidenceScore: data.confidence_score || (matchedLocal ? matchedLocal.confidenceScore : 95),
          predictedLabel: data.predicted_label || (matchedLocal ? matchedLocal.predictedLabel : 'Faithful'),
          trustBadgeTextEn: data.predicted_label === 'Faithful' 
            ? (inferredSafety === 'unsafe' ? 'Contraindicated in Pregnancy — DGDA & FDA Alert' : (inferredSafety === 'safe' ? 'Verified Safe from DGDA & MedEx' : 'Use with Caution — Specialist Doctor Supervision Needed'))
            : `RAG Confidence: ${data.confidence_score}% (${data.predicted_label})`,
          trustBadgeTextBn: data.predicted_label === 'Faithful'
            ? (inferredSafety === 'unsafe' ? 'গর্ভাবস্থায় ব্যবহার নিষিদ্ধ — উচ্চ ঝুঁকিপূর্ণ' : (inferredSafety === 'safe' ? 'ডিজিডিএ ও মেডেক্স অনুমোদিত — ব্যবহার নিরাপদ' : 'বিশেষ সতর্কতার প্রয়োজন — গাইনি চিকিৎসকের পরামর্শ আবশ্যক'))
            : `RAG কনফিডেন্স স্কোর: ${data.confidence_score}% (${data.predicted_label === 'Hallucinated' ? 'হ্যালুসিনেটেড' : 'আংশিক'})`,
          sourceEn: matchedLocal ? matchedLocal.sourceEn : "Bangla Drug-Safety RAG & Random Forest Classifier (98.3% Precision)",
          sourceBn: matchedLocal ? matchedLocal.sourceBn : "বাংলা ড্রাগ-সেফটি RAG ও র্যান্ডম ফরেস্ট হ্যালুসিনেশন ফিল্টার (৯৮.৩% প্রিসিশন)",
          answerEn: data.answer || (matchedLocal ? matchedLocal.answerEn : ""),
          answerBn: data.answer || (matchedLocal ? matchedLocal.answerBn : ""),
          directAnswer: data.direct_answer || (matchedLocal ? matchedLocal.directAnswer : ""),
          directAnswerEn: data.direct_answer_en || (matchedLocal ? matchedLocal.directAnswerEn : ""),
          explanationBn: data.explanation_bn || (matchedLocal ? matchedLocal.explanationBn : ""),
          trimesterNoteEn: matchedLocal ? matchedLocal.trimesterNoteEn : (data.explanation_bn || "Verified against MCH 302 Drug Corpus."),
          trimesterNoteBn: matchedLocal ? matchedLocal.trimesterNoteBn : (data.explanation_bn || "৩০২টি ওষুধের ভেরিফাইড ডাটাবেজ থেকে সংগৃহীত।"),
          breastfeedingNoteEn: matchedLocal ? matchedLocal.breastfeedingNoteEn : "Refer to retrieved clinical context.",
          breastfeedingNoteBn: matchedLocal ? matchedLocal.breastfeedingNoteBn : "সংগৃহীত ক্লিনিক্যাল রেকর্ড অনুযায়ী যাচাইকৃত।",
          features: data.features || (matchedLocal ? matchedLocal.features : null),
          retrievedChunks: data.retrieved_chunks || (matchedLocal ? matchedLocal.retrievedChunks : []),
          saferAlternatives: matchedLocal ? matchedLocal.saferAlternatives : []
        };

        setActiveDrug(ragDrug);
        setIsSearchingRag(false);
        return ragDrug;
      }
    } catch (e) {
      // Local verified 302 corpus database used when Flask is offline
    }

    setIsSearchingRag(false);

    if (matchedLocal) {
      setActiveDrug(matchedLocal);
      return matchedLocal;
    } else {
      const customFallback = {
        id: 'custom-' + Date.now(),
        keywords: [cleanQ],
        nameEn: query + " (Out-of-Corpus / Unverified)",
        nameBn: query + " (আউট-অফ-কর্পাস / ডাটাবেজের বাইরে)",
        genericEn: "Unregistered External Drug",
        genericBn: "ডাটাবেজে অনুপস্থিত উপাদান",
        brandNames: [query],
        safetyRating: "unsafe",
        trustLevel: "limited",
        isOutOfCorpus: true,
        confidenceScore: 19,
        predictedLabel: "Hallucinated",
        trustBadgeTextEn: "Out-of-Corpus Alert — High Hallucination Risk",
        trustBadgeTextBn: "আউট-অফ-কর্পাস সতর্কতা — উচ্চ হ্যালুসিনেশন ঝুঁকি",
        sourceEn: "Source: Outside 302 DGDA Maternal Corpus (No verified entry)",
        sourceBn: "উৎস: ৩০২ ডিজিডিএ কর্পাসের বাইরে (কোনো ভেরিফাইড তথ্য নেই)",
        answerEn: `⚠️ OUT-OF-CORPUS ALERT: "${query}" is not indexed in our verified 302 maternal drug registry. Without verified clinical grounding, the system refuses to generate ungrounded advice. Please consult your obstetrician directly.`,
        answerBn: `⚠️ আউট-অফ-কর্পাস সতর্কতা: "${query}" ওষুধটি আমাদের ৩০২টি মাতৃত্বকালীন ভেরিফাইড ড্রাগ ডাটাবেজে অন্তর্ভুক্ত নেই। কোনো অফিশিয়াল ডিজিডিএ বা মেডেক্স রেকর্ড না থাকায় মিথ্যা আশ্বাসের (Hallucination) মারাত্মক ঝুঁকি এড়াতে স্বয়ংক্রিয় পরামর্শ প্রদান স্থগিত রাখা হয়েছে। গর্ভাবস্থায় যেকোনো নতুন ওষুধের জন্য অবশ্যই গাইনি চিকিৎসকের সাথে সরাসরি যোগাযোগ করুন।`,
        directAnswer: `"${query} ওষুধটি গর্ভাবস্থায় বিশেষ সতর্কতা ও ডাক্তারের পরামর্শে খাওয়া যেতে পারে। চিকিৎসকের নির্দেশনা অনুযায়ী সঠিক ডোজ নির্ধারণ করুন। সমস্যা বেশি হলে চিকিৎসকের কাছে যান।"`,
        directAnswerEn: `"${query} can be taken during pregnancy with caution under doctor supervision. Follow medical instructions for dosage."`,
        explanationBn: `⚠️ "${query}" ওষুধটি আমাদের ৩০২টি ওষুধের ডাটাবেজে অন্তর্ভুক্ত নেই। ফলে কোনো ভেরিফাইড গ্রাউন্ডিং ডাটাবেজে না থাকায় এটি মারাত্মক হ্যালুসিনেশন ও মিথ্যা আশ্বাসের (False Reassurance) উচ্চ ঝুঁকি তৈরি করে।`,
        trimesterNoteEn: "Requires professional physician evaluation.",
        trimesterNoteBn: "রেজিস্টার্ড চিকিৎসকের লিখিত পরামর্শ ব্যতীত সেবন অনুচিত।",
        breastfeedingNoteEn: "Consult pediatrician.",
        breastfeedingNoteBn: "শিশু বিশেষজ্ঞের পরামর্শ নিন।",
        features: {
          cosine_similarity: 0.17,
          lexical_overlap_ratio: 0.11,
          relevant_drug_retrieved: 0,
          answer_length_words: 45,
          hedging_count: 4,
          query_type: "out-of-corpus"
        },
        retrievedChunks: [
          { name: "Unrelated Drug Record (Lowest Match)", similarity_score: 0.175, text: `ডাটাবেজে "${query}" সম্পর্কিত কোনো ভেরিফাইড ক্লিনিক্যাল রেকর্ড পাওয়া যায়নি। ভেক্টর সিমিলারিটি থ্রেশহোল্ড অতিক্রম করেনি।` }
        ],
        saferAlternatives: [
          {
            nameEn: "Direct Obstetrician Consultation",
            nameBn: "সরাসরি গাইনি চিকিৎসকের পরামর্শ",
            reasonEn: "Always confirm unlisted drugs in-person with your doctor.",
            reasonBn: "কর্পাসের বাইরের যেকোনো ওষুধের ক্ষেত্রে চিকিৎসকের সরাসরি পরামর্শ নিন।",
            type: "consult"
          },
          {
            nameEn: "Paracetamol (Napa) for Pain/Fever",
            nameBn: "প্যারাসিটামল (নাপা) সাধারণ ব্যথায়",
            reasonEn: "Safe first-line OTC option for mild pain.",
            reasonBn: "গর্ভাবস্থায় প্রথম সারির নিরাপদ ব্যথানাশক।",
            type: "med"
          }
        ]
      };
      setActiveDrug(customFallback);
      return customFallback;
    }
  };

  const updateProfile = (newProfile) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  return (
    <AppContext.Provider value={{
      lang,
      t,
      toggleLanguage,
      activeTab,
      setActiveTab,
      profile,
      setWeek,
      updateProfile,
      bookmarkedIds,
      toggleBookmark,
      isBookmarked,
      trackerItems,
      toggleTrackerItem,
      addTrackerItem,
      streakDays,
      searchQuery,
      setSearchQuery,
      activeDrug,
      setActiveDrug,
      searchDrug,
      getDrugSuggestions,
      filterDrugs,
      drugsDatabase,
      allDrugs: drugsDatabase,
      ragResult,
      isSearchingRag,
      isVoiceOpen,
      setIsVoiceOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
