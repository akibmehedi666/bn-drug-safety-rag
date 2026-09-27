import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import VoiceInputModal from './components/VoiceInputModal';
import HomeScreen from './screens/HomeScreen';
import AskScreen from './screens/AskScreen';
import NutritionScreen from './screens/NutritionScreen';
import TrackerScreen from './screens/TrackerScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { ShieldCheck, HeartPulse, Activity } from 'lucide-react';

const AppContent = () => {
  const { activeTab, lang, t, setActiveTab } = useApp();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen />;
      case 'ask': return <AskScreen />;
      case 'tracker': return <TrackerScreen />;
      case 'nutrition': return <NutritionScreen />;
      case 'symptoms': return <SymptomsScreen />;
      case 'profile': return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-base flex flex-col selection:bg-maternal-200">
      
      {/* Web Application Top Header */}
      <Header />

      {/* Main Responsive Web Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderScreen()}
      </main>

      {/* Voice Input Modal */}
      <VoiceInputModal />

      {/* Modern Web Application Footer */}
      <footer className="bg-cream-card border-t border-maternal-200/80 mt-12 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-maternal-500 text-white flex items-center justify-center font-bold text-lg">
                🌸
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 tracking-tight">
                {t.appName} Web Platform
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md">
              {lang === 'bn' 
                ? 'গর্ভবতী ও দুগ্ধদানকারী মায়ের ওষুধ সেবনের নিরাপত্তা যাচাই এবং এআই হ্যালুসিনেশন ফিল্টারিংয়ের জন্য নিবেদিত বাংলা ডিজিটাল ওয়েব প্ল্যাটফর্ম।'
                : 'Dedicated Bangladeshi Web Platform for Maternal Drug Safety, RAG Retrieval & Classical Machine Learning Hallucination Detection.'}
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-sage-800 bg-sage-50 px-3 py-1.5 rounded-xl border border-sage-200 w-fit">
              <ShieldCheck className="w-4 h-4 text-sage-600" />
              <span>Verified against DGDA (Bangladesh) & MedEx Index</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
              {lang === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-gray-600 font-medium">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-maternal-600 transition-colors">
                  {t.home} (Home Dashboard)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('ask')} className="hover:text-maternal-600 transition-colors">
                  {t.ask} (RAG Safety & ML)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tracker')} className="hover:text-maternal-600 transition-colors">
                  {t.tracker} (Medication Schedule)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('nutrition')} className="hover:text-maternal-600 transition-colors">
                  {t.nutrition} (Dietary Guide)
                </button>
              </li>
            </ul>
          </div>

          {/* Clinical & RAG Specs */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">
              {lang === 'bn' ? 'সিস্টেম স্পেসিফিকেশন' : 'System Architecture'}
            </h4>
            <ul className="space-y-1.5 text-gray-600">
              <li className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-maternal-500" />
                <span>302 Drug Corpus Index</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>98.3% Hallucination Precision</span>
              </li>
              <li className="text-[11px] text-gray-400 pt-2 leading-tight">
                Academic & Clinical Safety Research System 🇧🇩
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-maternal-100 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 space-y-2 sm:space-y-0">
          <p>© {new Date().getFullYear()} GorbhoMaya (গর্ভমায়া). All rights reserved.</p>
          <p className="italic">{t.askDoctorDisclaimer}</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
