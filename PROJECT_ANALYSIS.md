# 📋 Project Analysis Report: GorbhoMaya / গর্ভমায়া

---

## 1. What This Project Is

**GorbhoMaya** (গর্ভমায়া) is a Bangla-language maternal health web application designed to help pregnant and breastfeeding mothers in Bangladesh safely understand whether a specific medicine is safe to use during pregnancy. It is the first platform of its type that combines an AI-generated answer with a live **hallucination detection system** — so users can see not just what the AI says, but whether that answer can be trusted against verified clinical data.

---

## 2. Main Purpose & Who It Is For

| | |
|---|---|
| **What it is** | A bilingual (Bengali + English) maternal drug-safety assistant and pregnancy health companion |
| **Problem it solves** | Pregnant women in Bangladesh often search the internet or use general AI chatbots for medicine advice, which carry a serious risk of false reassurance about dangerous drugs. This platform verifies AI answers against a clinical drug database and flags untrustworthy responses |
| **Target users** | Pregnant and breastfeeding mothers in Bangladesh; primarily Bengali-speaking |
| **Core feature** | Drug Safety Search — type or speak a medicine name → get a RAG-grounded AI safety answer + a hallucination confidence score showing how reliable the answer is |
| **What users can do** | Check drug safety, track daily medications, read nutrition guides, look up pregnancy symptoms, and manage a personal health profile |

---

## 3. Website Features (Grouped)

### 🔵 Main / Core Feature

| Feature | What Users Can Do |
|---|---|
| **Drug Safety Search (RAG Q&A)** | Type any medicine name in Bengali or English to get a verified safety answer grounded against a 302-drug DGDA/MedEx clinical database. The result shows: (1) a RAG-grounded answer, (2) an ungrounded direct LLM answer for comparison, (3) a hallucination classification (Faithful / Partial / Hallucinated), and (4) a 0–100% confidence score with Bengali-language explanation |
| **Hallucination Detection Layer** | Every RAG answer is evaluated by a trained Random Forest classifier using 6 ML features (semantic similarity, lexical overlap, drug retrieval status, answer length, hedging words, query type). The result is shown to the user as a trustworthiness label |
| **Out-of-Corpus Alert** | If a searched medicine is not in the 302-drug verified database, the app shows a prominent red warning, refuses to provide unverified advice, and recommends seeing a doctor directly |
| **Side-by-Side Answer Comparison** | For every query, users can see the RAG-grounded safe answer next to the ungrounded LLM answer, with a table showing why one is safer |

---

### 🟢 User Features

| Feature | What Users Can Do |
|---|---|
| **Quick Drug Suggestion Pills** | Click pre-set drug names (Napa, Seclo, Flexi, etc.) for instant answers without typing |
| **Voice Input** | Tap the microphone icon to speak a medicine name — a simulated voice input modal opens |
| **Bookmark / Save Answers** | Save drug answers to a personal bookmarks list accessible from the header |
| **Share Answer** | Copy a drug safety answer to clipboard with one tap |
| **Language Toggle** | Switch the entire app between Bengali and English at any time |
| **Pregnancy Week Tracker (Home dashboard)** | Adjust the current pregnancy week (1–40) using +/- buttons to see the trimester, baby size comparison, development milestone, and weekly health tip |

---

### 🟡 Additional Features

| Feature | What Users Can Do |
|---|---|
| **Daily Medication Tracker** | View a checklist of daily prenatal supplements, mark each as taken, add custom medication reminders with a time-of-day selector, and see overall adherence as a percentage |
| **Adherence Streak Counter** | See how many consecutive days medications have been tracked |
| **Nutrition Guide** | Browse a curated list of traditional Bangladeshi foods recommended for pregnancy, filterable by nutrient category (folate, iron, calcium, protein), with preparation tips |
| **Symptom Guide** | Read about common pregnancy symptoms (nausea, heartburn, swelling, back pain), with expandable cards showing home self-care tips and red-flag warning signs requiring emergency hospital attention |
| **Pregnancy Timeline / Week Info** | The home screen shows a visual 40-week progress bar with the babys current developmental milestone and a health tip per week |

---

### 🟠 Profile / Personalization Features

| Feature | What Users Can Do |
|---|---|
| **Mothers Profile** | Set the current pregnancy stage (1st/2nd/3rd trimester or breastfeeding), adjust the pregnancy week with a slider, select known drug/food allergies from a list, and select existing conditions (anemia, gestational diabetes, hypertension, asthma). Save preferences to personalize safety context badges on drug cards |

---

## 4. Implementation Status of Previously Hard-Coded / Incomplete Features

All previously hardcoded and mock-dependent features (with the exception of Voice Input, which is intentionally preserved as a demo component) have been transitioned to real, persistent, and backend-connected implementations:

### ① Voice Input
| | |
|---|---|
| **Current status** | ⚠️ **Simulated / Demo (Preserved)** |
| **Implementation** | Displays interactive animated microphone and waveform with 4 preset Bengali search prompts ("প্যারাসিটামল", "মেথোট্রেক্সেট", "অমিপ্রাজল", "ডেক্সামেথাসন"). Transmits selected prompt directly to the live RAG query backend. |
| **Future enhancement** | Connect to Web Speech API (`webkitSpeechRecognition`) for live microphone audio transcription. |

---

### ② Drug Suggestion Pills (Ask Screen)
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / Live Backend** |
| **Implementation** | Dynamically fetched from the Flask backend via `GET /api/drugs`, drawing directly from the verified 302-drug DGDA/MedEx clinical corpus. Quick pills reflect real medications available in the database. |

---

### ③ Drug Safety Fallback & Selection Pipeline
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / Live Backend** |
| **Implementation** | Local static mock database fallback (`mockData.js`) removed. Every drug interaction (typed search or quick pill click) triggers a live `POST /api/query` call to the Flask backend with real-time semantic retrieval, hallucination scoring, loading states, and robust error handling. |

---

### ④ Medication Tracker Persistence
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / LocalStorage Persisted** |
| **Implementation** | Stored in browser `localStorage` via custom reactive hook (`useLocalStorage`). User medications, custom additions, and daily checkoffs persist across browser restarts and reloads. Includes 1-tap quick addition for essential prenatal supplements. |

---

### ⑤ Adherence Streak Counter
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / Computed Dynamically** |
| **Implementation** | Replaced the fixed "7 days" state with date-based computation over user completion history (`gorbhomaya_tracker_logs`). Accurately calculates consecutive active days and overall adherence percentage based on calendar dates. |

---

### ⑥ User Profile Persistence
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / LocalStorage Persisted** |
| **Implementation** | User profile (trimester, gestational week, allergies, conditions) is persisted in `localStorage` (`gorbhomaya_profile`). Features clean first-run initialization and full interactive editing. |

---

### ⑦ Bookmarks Persistence
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / LocalStorage Persisted** |
| **Implementation** | Saved drug bookmarks are persisted in `localStorage` (`gorbhomaya_bookmarks`), allowing mothers to retain their saved drug cards across sessions. |

---

### ⑧ Direct LLM Answer (Ungrounded)
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / Live Gemini API** |
| **Implementation** | Hardcoded Bengali responses removed. Powered by live Google Generative AI API configured via `GEMINI_API_KEY` in `.env` with automatic model fallback (`gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-2.5-flash`), producing authentic, ungrounded direct AI answers for side-by-side safety comparison. |

---

### ⑨ Nutrition Guide & Supplement-Aware Food Suggestions
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / API-Driven + Intelligent Rules** |
| **Implementation** | Sourced from `GET /api/nutrition` (backed by `data/nutrition.json`). Augmented with `data/supplement_food_map.json` to deliver tailored dietary recommendations based on the mother's active supplements (e.g., iron-calcium timing separation, missed-dose food alternatives, anemia food boosters). |

---

### ⑩ Symptoms Guide
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / API-Driven** |
| **Implementation** | Sourced from `GET /api/symptoms` (backed by `data/symptoms.json`) with live loading and error states, categorized self-care remedies, and clinical red-flag indicators. |

---

### ⑪ Profile-Influenced Drug Safety Personalization
| | |
|---|---|
| **Current status** | ✅ **Fully Functional / Prompt & Rule Injection** |
| **Implementation** | User profile context is sent with every query to `POST /api/query`. The backend injects maternal week and trimester into the prompt, and performs real-time clinical cross-checks against patient allergies (e.g., penicillin cross-sensitivity) and maternal conditions (e.g., NSAID/hypertension warnings), rendering prominent safety warning badges in both Bengali and English. |

---

## 5. Feature Status Table

| Feature | Screen / Component | Status | Implementation Details / Data Source |
|---|---|---|---|
| **Drug Safety Search** | Ask (`AskScreen.jsx`) | ✅ Fully functional | Live semantic search against 302-drug corpus via `POST /api/query` + RAG prompt |
| **Hallucination Detection** | Drug Answer (`DrugAnswerCard.jsx`) | ✅ Fully functional | Real-time 6-feature Random Forest classifier scoring Faithfulness & confidence |
| **Out-of-Corpus Alert** | Ask (`AskScreen.jsx`) | ✅ Fully functional | Identifies unregistered medicines, halts unverified advice, directs to doctor |
| **Side-by-Side Comparison** | Drug Answer (`DrugAnswerCard.jsx`) | ✅ Fully functional | RAG grounded answer vs live ungrounded Gemini LLM answer comparison |
| **Direct LLM Answer** | Drug Answer (`DrugAnswerCard.jsx`) | ✅ Fully functional | Live Google Gemini API (`gemini-3.8-flash`) with model fallback; fake text deleted |
| **6-Feature ML Metrics** | Drug Answer (`DrugAnswerCard.jsx`) | ✅ Fully functional | Live computation of cosine similarity, lexical overlap, hedging, answer length |
| **Quick Drug Suggestion Pills** | Ask (`AskScreen.jsx`) | ✅ Fully functional | Sourced dynamically from backend `GET /api/drugs`; calls live `POST /api/query` |
| **Mother's Profile Personalization** | Profile & Ask Screens | ✅ Fully functional | Persisted in `localStorage`; backend checks allergies & conditions for custom warnings |
| **Supplement-Aware Nutrition** | Nutrition (`NutritionScreen.jsx`) | ✅ Fully functional | Live `GET /api/nutrition` + food-supplement timing & absorption rules from backend |
| **Daily Medication Tracker** | Tracker (`TrackerScreen.jsx`) | ✅ Fully functional | Persisted in `localStorage`; interactive daily checklist with 1-tap prenatal adds |
| **Adherence Streak Counter** | Tracker (`TrackerScreen.jsx`) | ✅ Fully functional | Dynamically computed from local date-stamped completion logs (real streak & %) |
| **Bookmarks / Saved Drugs** | Header / App Modal | ✅ Fully functional | Persisted across browser sessions in `localStorage` (`gorbhomaya_bookmarks`) |
| **Symptoms Guide** | Symptoms (`SymptomsScreen.jsx`) | ✅ Fully functional | Sourced dynamically from `GET /api/symptoms` with emergency red flags |
| **Pregnancy Week Progress** | Home (`HomeScreen.jsx`) | ✅ Fully functional | Real milestone data, baby size comparisons, and health tips for weeks 1–40 |
| **Share / Copy Answer** | Drug Answer (`DrugAnswerCard.jsx`) | ✅ Fully functional | Native one-tap clipboard copy of safety summary and clinical details |
| **Language Toggle (BN/EN)** | Header / Global | ✅ Fully functional | Global instant UI and content language switching (Bengali / English) |
| **Voice Input** | Ask (`AskScreen.jsx`) | ⚠️ Simulated / Demo | Animated demo UI with 4 preset Bengali search prompts (preserved by design) |

---

## 6. Project Overview (Presentation-Friendly)

**What it is:**
GorbhoMaya (গর্ভমায়া) — a bilingual Bengali/English maternal drug-safety web application.

**Main purpose:**
Help pregnant and breastfeeding mothers in Bangladesh safely verify whether a medicine is safe during pregnancy, while detecting and warning about AI-generated misinformation (hallucinations).

**Target users:**
Pregnant and breastfeeding women in Bangladesh; primarily Bengali-speaking.

**Main feature:**
AI-powered drug safety search grounded in a 302-drug verified clinical database, with a machine learning hallucination detector that scores every answer's trustworthiness and flags potentially dangerous AI-generated false reassurances.

**Key additional features:**
Personalized clinical drug allergy/condition warnings, supplement-aware maternal nutrition guidance, dynamic daily medication tracker with computed adherence streaks, pregnancy week milestone guide (Weeks 1–40), common pregnancy symptom guide with red-flag warnings, and persistent bookmarks.

**Current overall status:**
The application is fully operational end-to-end. The core RAG pipeline, hallucination classifier, direct LLM comparison, profile-based clinical safety personalization, supplement-aware food guidance, medication tracking, and data persistence layers are running live. Voice input is preserved as an interactive demo interface.

---

## 7. Deferred / Future Work Summary

| Feature | Current State | Future Enhancement Roadmap |
|---|---|---|
| **Voice Input** | Interactive demo modal with 4 preset Bengali voice prompts | Implement live microphone capture using Web Speech API (`webkitSpeechRecognition`) or server-side Whisper |
| **User Authentication** | Client-side persistence via browser `localStorage` | Optional multi-device synchronization via cloud user accounts (e.g., PostgreSQL/Supabase) |

---

> *Updated on 2026-10-05 following full implementation and verification of real backend APIs, live LLM generation, clinical personalization, and data persistence.*
