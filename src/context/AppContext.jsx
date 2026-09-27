import React, { createContext, useContext, useState } from 'react';
import { uiTranslations, initialProfile, drugsDatabase, defaultTrackerItems } from '../data/mockData';

const AppContext = createContext();

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

  const searchDrug = async (query) => {
    const cleanQ = query.trim();
    setSearchQuery(query);
    if (!cleanQ) return null;

    setIsSearchingRag(true);
    let matchedLocal = drugsDatabase.find(d => 
      d.keywords.some(k => k.toLowerCase().includes(cleanQ.toLowerCase())) ||
      d.nameEn.toLowerCase().includes(cleanQ.toLowerCase()) ||
      d.nameBn.toLowerCase().includes(cleanQ.toLowerCase()) ||
      d.genericEn.toLowerCase().includes(cleanQ.toLowerCase())
    );

    try {
      // Attempt querying Flask Python RAG backend
      const res = await fetch('http://127.0.0.1:5000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQ })
      });

      if (res.ok) {
        const data = await res.json();
        setRagResult(data);
        
        // Construct drug card object from RAG API response
        const ragDrug = {
          id: 'rag-' + Date.now(),
          keywords: [cleanQ],
          nameEn: data.question + " (RAG Grounded)",
          nameBn: data.question + " (RAG ভেরিফাইড)",
          genericEn: data.retrieved_chunks?.[0]?.name || "302 MCH Drug Corpus",
          genericBn: data.retrieved_chunks?.[0]?.name || "৩০২ ড্রাগস ডাটাবেজ",
          brandNames: [cleanQ],
          safetyRating: data.predicted_label === 'Faithful' ? 'safe' : data.predicted_label === 'Hallucinated' ? 'unsafe' : 'caution',
          trustLevel: 'verified',
          trustBadgeTextEn: `RAG Confidence: ${data.confidence_score}% (${data.predicted_label})`,
          trustBadgeTextBn: `RAG কনফিডেন্স স্কর: ${data.confidence_score}% (${data.predicted_label === 'Faithful' ? 'বিশ্বস্ত' : data.predicted_label === 'Hallucinated' ? 'হ্যালুসিনেটেড' : 'আংশিক'})`,
          sourceEn: "Bangla Drug-Safety RAG & Random Forest Classifier (98.3% Precision)",
          sourceBn: "বাংলা ড্রাগ-সেফটি RAG ও র্যান্ডম ফরেস্ট হ্যালুসিনেশন ফিল্টার (৯৮.৩% প্রিসিশন)",
          answerEn: data.answer,
          answerBn: data.answer,
          directAnswer: data.direct_answer,
          explanationBn: data.explanation_bn,
          trimesterNoteEn: data.explanation_bn || "Verified against MCH 302 Drug Corpus.",
          trimesterNoteBn: data.explanation_bn || "৩০২টি ওষুধের ভেরিফাইড ডাটাবেজ থেকে সংগৃহীত।",
          breastfeedingNoteEn: "Refer to retrieved clinical context.",
          breastfeedingNoteBn: "সংগৃহীত ক্লিনিক্যাল রেকর্ড অনুযায়ী যাচাইকৃত।",
          features: data.features,
          retrievedChunks: data.retrieved_chunks,
          saferAlternatives: matchedLocal ? matchedLocal.saferAlternatives : []
        };

        setActiveDrug(ragDrug);
        setIsSearchingRag(false);
        return ragDrug;
      }
    } catch (e) {
      console.log('RAG API server offline or unreachable, using local database fallback.', e);
    }

    setIsSearchingRag(false);

    if (matchedLocal) {
      setActiveDrug(matchedLocal);
      return matchedLocal;
    } else {
      const customFallback = {
        id: 'custom-' + Date.now(),
        keywords: [cleanQ],
        nameEn: query + " (Unverified / Custom)",
        nameBn: query + " (অনির্ধারিত ওষুধ)",
        genericEn: "Unknown Generic",
        genericBn: "অজানা প্রস্তুতপ্রণালী",
        brandNames: [query],
        safetyRating: "caution",
        trustLevel: "limited",
        trustBadgeTextEn: "Limited Database Entry — Consult Obstetrician",
        trustBadgeTextBn: "সীমিত বা অপ্রতুল তথ্য — গাইনি ডাক্তারের পরামর্শ নিন",
        sourceEn: "Source: MedEx Index / DGDA Search Required",
        sourceBn: "উৎস: মেডেক্স বিডি সার্চ নির্দেশিকা",
        answerEn: `Information for "${query}" is not fully verified in our offline safety index. Please consult a qualified doctor before taking this medicine during pregnancy.`,
        answerBn: `"${query}" ওষুধটির পর্যাপ্ত গর্ভাবস্থা নিরাপত্তা তথ্য আমাদের সাধারণ তালিকায় নিশ্চিত পাওয়া যায়নি। গর্ভাবস্থায় সেবনের পূর্বে অবশ্যই গাইনি চিকিৎসকের পরামর্শ নিন।`,
        trimesterNoteEn: "Requires professional physician evaluation.",
        trimesterNoteBn: "রেজিস্টার্ড চিকিৎসকের লিখিত পরামর্শ ব্যতীত সেবন অনুচিত।",
        breastfeedingNoteEn: "Consult pediatrician.",
        breastfeedingNoteBn: "শিশু বিশেষজ্ঞের পরামর্শ নিন।",
        saferAlternatives: [
          {
            nameEn: "Paracetamol (Napa) for Pain/Fever",
            nameBn: "প্যারাসিটামল (নাপা) সাধারণ ব্যথায়",
            reasonEn: "Safe first-line OTC option for mild pain.",
            reasonBn: "গর্ভাবস্থায় প্রথম সারির নিরাপদ ব্যথানাশক।",
            type: "med"
          },
          {
            nameEn: "Direct Doctor Consultation",
            nameBn: "সরাসরি চিকিৎসকের পরামর্শ",
            reasonEn: "Always confirm unlisted drugs with your gynaecologist.",
            reasonBn: "নতুন যেকোনো ওষুধের ক্ষেত্রে ডাক্তারের মত নিন।",
            type: "consult"
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
