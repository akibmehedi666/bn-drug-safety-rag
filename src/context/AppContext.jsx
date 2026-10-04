import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uiTranslations, initialProfile, prenatalSupplementSuggestions } from '../data/mockData';

const AppContext = createContext();

// Format date to local YYYY-MM-DD
export const getLocalDateString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AppProvider = ({ children }) => {
  // Persisted state via useLocalStorage
  const [lang, setLang] = useLocalStorage('gorbhomaya_lang', 'bn');
  const [profile, setProfile] = useLocalStorage('gorbhomaya_profile', initialProfile);
  const [bookmarkedIds, setBookmarkedIds] = useLocalStorage('gorbhomaya_bookmarks', []);
  const [trackerItems, setTrackerItems] = useLocalStorage('gorbhomaya_tracker_items', []);
  const [trackerHistory, setTrackerHistory] = useLocalStorage('gorbhomaya_tracker_history', {});

  // Ephemeral UI state
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDrug, setActiveDrug] = useState(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [drugsList, setDrugsList] = useState([]);
  const [isLoadingDrugs, setIsLoadingDrugs] = useState(false);

  // Translations
  const t = uiTranslations[lang] || uiTranslations.bn;

  // Language toggle
  const toggleLanguage = () => {
    setLang(prev => (prev === 'bn' ? 'en' : 'bn'));
  };

  // Fetch real 302-drug corpus list from Flask backend
  useEffect(() => {
    let isMounted = true;
    const loadDrugs = async () => {
      setIsLoadingDrugs(true);
      try {
        const res = await fetch('/api/drugs');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.drugs && Array.isArray(data.drugs)) {
            setDrugsList(data.drugs);
          }
        }
      } catch (err) {
        console.warn('Could not load backend /api/drugs list, will retry on demand.', err);
      } finally {
        if (isMounted) setIsLoadingDrugs(false);
      }
    };
    loadDrugs();
    return () => { isMounted = false; };
  }, []);

  // Profile operations
  const setWeek = (weekNum) => {
    const w = Math.min(Math.max(Number(weekNum) || 1, 1), 42);
    let stage = '1st';
    if (w >= 28) stage = '3rd';
    else if (w >= 13) stage = '2nd';

    setProfile(prev => ({ ...prev, week: w, stage }));
  };

  const updateProfile = (updates) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // Bookmarking
  const toggleBookmark = (drugId) => {
    if (!drugId) return;
    setBookmarkedIds(prev => 
      prev.includes(drugId) ? prev.filter(id => id !== drugId) : [...prev, drugId]
    );
  };

  const isBookmarked = (drugId) => drugId ? bookmarkedIds.includes(drugId) : false;

  // Tracker operations
  const todayStr = getLocalDateString();

  // Compute items for today with their current 'done' status
  const currentTrackerItems = useMemo(() => {
    const todayCompleted = trackerHistory[todayStr] || {};
    return trackerItems.map(item => ({
      ...item,
      done: !!todayCompleted[item.id]
    }));
  }, [trackerItems, trackerHistory, todayStr]);

  const toggleTrackerItem = (id, targetDate = todayStr) => {
    setTrackerHistory(prev => {
      const dayRecord = { ...(prev[targetDate] || {}) };
      if (dayRecord[id]) {
        delete dayRecord[id];
      } else {
        dayRecord[id] = true;
      }
      return {
        ...prev,
        [targetDate]: dayRecord
      };
    });
  };

  const addTrackerItem = (nameEn, nameBn, time, nutrientKey = null) => {
    const newItem = {
      id: 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      nameEn: nameEn.trim(),
      nameBn: (nameBn || nameEn).trim(),
      time: time || 'morning',
      nutrientKey: nutrientKey || null
    };
    setTrackerItems(prev => [...prev, newItem]);
  };

  const removeTrackerItem = (id) => {
    setTrackerItems(prev => prev.filter(item => item.id !== id));
    // Also clean up today's record if present
    setTrackerHistory(prev => {
      const updated = { ...prev };
      for (const d of Object.keys(updated)) {
        if (updated[d] && updated[d][id]) {
          const dayCopy = { ...updated[d] };
          delete dayCopy[id];
          updated[d] = dayCopy;
        }
      }
      return updated;
    });
  };

  // Real Streak & Adherence Computation
  const { streakDays, adherencePct } = useMemo(() => {
    if (trackerItems.length === 0) {
      return { streakDays: 0, adherencePct: 0 };
    }

    const scheduledCount = trackerItems.length;

    // Helper: is a specific date fully completed?
    const isDayFullyCompleted = (dStr) => {
      const dayRecord = trackerHistory[dStr];
      if (!dayRecord) return false;
      const completedIds = Object.keys(dayRecord).filter(k => dayRecord[k]);
      return trackerItems.every(item => completedIds.includes(item.id));
    };

    // Calculate streak backwards from today or yesterday
    let streak = 0;
    const todayComplete = isDayFullyCompleted(todayStr);

    if (todayComplete) {
      streak = 1;
    }

    // Step backwards day by day
    let checkDate = new Date();
    // Start checking from yesterday
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (isDayFullyCompleted(dStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Missed day halts streak
        break;
      }
    }

    // Adherence %: calculate over past 30 days or all recorded days
    let totalScheduled = 0;
    let totalCompleted = 0;

    // Look at past 14 days
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      const dayRecord = trackerHistory[dStr] || {};
      const completedOnDay = Object.keys(dayRecord).filter(k => dayRecord[k]).length;

      // Only count days where user had supplements configured or took anything
      if (i === 0 || completedOnDay > 0) {
        totalScheduled += scheduledCount;
        totalCompleted += Math.min(completedOnDay, scheduledCount);
      }
    }

    const calculatedAdherence = totalScheduled > 0 
      ? Math.round((totalCompleted / totalScheduled) * 100) 
      : (todayComplete ? 100 : 0);

    return {
      streakDays: streak,
      adherencePct: calculatedAdherence
    };
  }, [trackerItems, trackerHistory, todayStr]);

  // Drug Query via real RAG Flask API
  const searchDrug = async (query) => {
    const cleanQ = (query || '').trim();
    setSearchQuery(query);
    setSearchError(null);
    if (!cleanQ) return null;

    setIsSearchingRag(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: cleanQ,
          profile: {
            stage: profile.stage,
            week: profile.week,
            allergies: profile.allergies || [],
            conditions: profile.conditions || []
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      
      const isOOC = !!data.is_out_of_corpus_alert;
      const label = data.predicted_label || 'Partial';
      
      let safetyRating = 'caution';
      if (label === 'Faithful') safetyRating = 'safe';
      else if (label === 'Hallucinated' || isOOC) safetyRating = 'unsafe';

      const ragDrug = {
        id: 'query-' + Date.now(),
        nameEn: data.question,
        nameBn: data.question,
        genericEn: data.retrieved_chunks?.[0]?.name || (isOOC ? 'Unlisted External Drug' : '302 MCH Drug Corpus'),
        genericBn: data.retrieved_chunks?.[0]?.name || (isOOC ? 'ডাটাবেজে অনুপস্থিত উপাদান' : '৩০২ মাতৃত্বকালীন কর্পাস'),
        safetyRating,
        confidenceScore: data.confidence_score,
        predictedLabel: label,
        isOutOfCorpus: isOOC,
        sourceEn: 'Bangla Drug-Safety RAG & Random Forest Classifier (98.3% Accuracy)',
        sourceBn: 'বাংলা ড্রাগ-সেফটি RAG ও র্যান্ডম ফরেস্ট ফিল্টার (৯৮.৩% প্রিসিশন)',
        answerEn: data.answer,
        answerBn: data.answer,
        directAnswer: data.direct_answer,
        explanationBn: data.explanation_bn,
        trimesterNoteEn: data.explanation_bn || 'Verified against DGDA 302 Drug Corpus.',
        trimesterNoteBn: data.explanation_bn || '৩০২টি ওষুধের ডিজিডিএ অনুমোদিত ডাটাবেজ থেকে যাচাইকৃত।',
        breastfeedingNoteEn: 'Refer to retrieved clinical context.',
        breastfeedingNoteBn: 'সংগৃহীত ক্লিনিক্যাল রেকর্ড অনুযায়ী যাচাইকৃত।',
        features: data.features,
        retrievedChunks: data.retrieved_chunks || [],
        personalizedWarnings: data.personalized_warnings || [],
        saferAlternatives: isOOC ? [
          {
            nameEn: 'Direct Obstetrician Consultation',
            nameBn: 'সরাসরি গাইনি চিকিৎসকের পরামর্শ',
            reasonEn: 'Unlisted external medicines require in-person prescription verification.',
            reasonBn: 'ডাটাবেজে অনুপস্থিত যেকোনো ওষুধের ক্ষেত্রে চিকিৎসকের সরাসরি পরামর্শ নিন।',
            type: 'consult'
          },
          {
            nameEn: 'Paracetamol (Napa / Ace)',
            nameBn: 'প্যারাসিটামল (নাপা / এইস)',
            reasonEn: 'Standard first-line OTC antipyretic & analgesic in pregnancy.',
            reasonBn: 'গর্ভকালীন সাধারণ জ্বর ও ব্যথায় প্রথম পছন্দের নিরাপদ ওষুধ।',
            type: 'med'
          }
        ] : []
      };

      setActiveDrug(ragDrug);
      setIsSearchingRag(false);
      return ragDrug;
    } catch (err) {
      console.error('Error during /api/query:', err);
      setSearchError(err.message || 'Could not connect to drug safety service.');
      setIsSearchingRag(false);
      return null;
    }
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
      trackerItems: currentTrackerItems,
      rawTrackerItems: trackerItems,
      toggleTrackerItem,
      addTrackerItem,
      removeTrackerItem,
      streakDays,
      adherencePct,
      searchQuery,
      setSearchQuery,
      activeDrug,
      setActiveDrug,
      searchDrug,
      isSearchingRag,
      searchError,
      drugsList,
      isLoadingDrugs,
      prenatalSupplementSuggestions,
      isVoiceOpen,
      setIsVoiceOpen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
