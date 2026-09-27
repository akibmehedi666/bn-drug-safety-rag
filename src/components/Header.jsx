import React, { useState } from 'react';
import { 
  Globe, Bookmark, ShieldCheck, Heart, Sparkles, X, Check, Trash2,
  Home, Search, Apple, CheckSquare, Stethoscope, User, Menu
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { drugsDatabase } from '../data/mockData';

export const Header = () => {
  const { lang, t, toggleLanguage, bookmarkedIds, toggleBookmark, activeTab, setActiveTab, searchDrug, profile } = useApp();
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const bookmarkedDrugs = drugsDatabase.filter(d => bookmarkedIds.includes(d.id));

  const navLinks = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'ask', label: t.ask, icon: Search, isHighlight: true },
    { id: 'tracker', label: t.tracker, icon: CheckSquare },
    { id: 'nutrition', label: t.nutrition, icon: Apple },
    { id: 'symptoms', label: t.symptoms, icon: Stethoscope },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream-card/90 backdrop-blur-md border-b border-maternal-200/70 shadow-warm-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setActiveTab('home')}
              className="flex items-center space-x-3 text-left group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-maternal-600 via-maternal-500 to-rose-400 text-white flex items-center justify-center shadow-warm-sm group-hover:scale-105 transition-transform">
                <span className="text-2xl leading-none">🌸</span>
              </div>
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl text-gray-900 tracking-tight flex items-center gap-2 leading-none">
                  {t.appName}
                  <span className="text-xs bg-maternal-100 text-maternal-700 px-2 py-0.5 rounded-full font-bold border border-maternal-200 hidden sm:inline-block">
                    Web App
                  </span>
                </h1>
                <div className="flex items-center space-x-1 text-xs text-sage-700 font-medium mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sage-600 inline" />
                  <span>{t.trustedSource}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 bg-cream-base/90 p-1.5 rounded-2xl border border-maternal-200/70 shadow-2xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              if (item.isHighlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shadow-warm-xs border ${
                      isActive
                        ? 'bg-gradient-to-r from-maternal-600 via-maternal-500 to-rose-500 text-white border-maternal-600 ring-2 ring-maternal-300'
                        : 'bg-gradient-to-r from-maternal-500 to-maternal-600 text-white border-maternal-400 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    isActive 
                      ? 'bg-gradient-to-r from-maternal-500 to-rose-500 text-white shadow-warm-xs border border-maternal-600' 
                      : 'text-gray-700 hover:text-maternal-700 hover:bg-maternal-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Toolbar Tools */}
          <div className="flex items-center space-x-3">
            
            {/* Current Stage Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{lang === 'bn' ? `${profile.week}তম সপ্তাহ` : `Week ${profile.week}`}</span>
            </div>

            {/* Bookmarks Drawer Button */}
            <button
              onClick={() => setShowBookmarksDrawer(true)}
              className="relative p-2.5 rounded-xl bg-white border border-maternal-200 text-maternal-700 hover:bg-maternal-50 transition-colors shadow-2xs"
              title={t.bookmarks}
            >
              <Bookmark className="w-4.5 h-4.5 text-maternal-600" />
              {bookmarkedIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-maternal-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {bookmarkedIds.length}
                </span>
              )}
            </button>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl bg-maternal-700 hover:bg-maternal-800 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Profile Icon Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`p-2.5 rounded-xl border transition-all shadow-2xs flex items-center ${
                activeTab === 'profile'
                  ? 'bg-maternal-500 text-white border-maternal-600 shadow-warm-xs'
                  : 'bg-white border-maternal-200 text-maternal-700 hover:bg-maternal-50'
              }`}
              title={t.profile}
            >
              <User className="w-4.5 h-4.5" />
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-cream-base border border-gray-200 text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-cream-card border-b border-maternal-200 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                      isActive 
                        ? 'bg-maternal-500 text-white' 
                        : 'bg-cream-base text-gray-700 border border-maternal-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Bookmarks Modal Drawer */}
      {showBookmarksDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-cream-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-maternal-200 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-maternal-100">
              <div className="flex items-center space-x-2 text-maternal-800 font-bold text-lg">
                <Bookmark className="w-5 h-5 text-maternal-600" />
                <span>{t.bookmarks} ({bookmarkedDrugs.length})</span>
              </div>
              <button 
                onClick={() => setShowBookmarksDrawer(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {bookmarkedDrugs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 space-y-2">
                  <p className="text-sm font-medium">{lang === 'bn' ? 'কোনো ওষুধ বুকমার্ক করা হয়নি।' : 'No medicines saved yet.'}</p>
                  <p className="text-xs text-gray-400">{lang === 'bn' ? 'ওষুধ খোঁজার পর বুকমার্ক বাটনে চাপ দিন।' : 'Search any drug and click the bookmark button.'}</p>
                </div>
              ) : (
                bookmarkedDrugs.map(drug => (
                  <div 
                    key={drug.id}
                    className="p-4 bg-white rounded-2xl border border-maternal-100 flex items-center justify-between hover:border-maternal-300 transition-all shadow-2xs"
                  >
                    <div 
                      className="flex-1 cursor-pointer space-y-0.5"
                      onClick={() => {
                        searchDrug(drug.id);
                        setActiveTab('ask');
                        setShowBookmarksDrawer(false);
                      }}
                    >
                      <h4 className="font-bold text-sm text-gray-900">
                        {lang === 'bn' ? drug.nameBn : drug.nameEn}
                      </h4>
                      <p className="text-xs text-sage-700 font-medium">
                        {lang === 'bn' ? drug.genericBn : drug.genericEn}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleBookmark(drug.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
