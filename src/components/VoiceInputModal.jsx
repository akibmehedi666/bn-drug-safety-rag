import React, { useState } from 'react';
import { Mic, X, Sparkles, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VoiceInputModal = () => {
  const { lang, t, isVoiceOpen, setIsVoiceOpen, searchDrug, setActiveTab } = useApp();
  const [spokenText, setSpokenText] = useState('');

  if (!isVoiceOpen) return null;

  const sampleVoices = [
    { query: 'Napa', textBn: 'নাপা ট্যাবলেট কি গর্ভাবস্থায় খাওয়া যাবে?', textEn: 'Is Napa safe during pregnancy?' },
    { query: 'Seclo', textBn: 'গ্যাস্ট্রিকের জন্য সেকলো খাওয়া নিরাপদ কিনা?', textEn: 'Can I take Seclo for heartburn?' },
    { query: 'Flexi', textBn: 'ফ্লেক্সি বা ব্যথানাশক খাওয়া যাবে কি?', textEn: 'Is Flexi painkiller safe for mothers?' },
    { query: 'Entacyd', textBn: 'এন্টাসিড সিরাপ বা ট্যাবলেট খাওয়া কি ভালো?', textEn: 'Is Entacyd safe during 2nd trimester?' },
  ];

  const handleSimulateVoice = (sample) => {
    const text = lang === 'bn' ? sample.textBn : sample.textEn;
    setSpokenText(text);

    setTimeout(() => {
      searchDrug(sample.query);
      setIsVoiceOpen(false);
      setActiveTab('ask');
      setSpokenText('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-cream-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-maternal-200 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex justify-end">
          <button 
            onClick={() => setIsVoiceOpen(false)}
            className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Microphone Icon */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-maternal-200/50 rounded-full animate-ping opacity-75" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-maternal-500 to-maternal-400 text-white flex items-center justify-center shadow-warm-md z-10">
            <Mic className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Audio Pulse Bars */}
        <div className="flex items-center justify-center space-x-1.5 h-8">
          <div className="w-1.5 h-6 bg-maternal-400 rounded-full animate-wave-1" />
          <div className="w-1.5 h-8 bg-maternal-500 rounded-full animate-wave-2" />
          <div className="w-1.5 h-10 bg-maternal-600 rounded-full animate-wave-3" />
          <div className="w-1.5 h-8 bg-maternal-500 rounded-full animate-wave-4" />
          <div className="w-1.5 h-6 bg-maternal-400 rounded-full animate-wave-5" />
        </div>

        <div>
          <h3 className="font-bold text-lg text-gray-900">
            {lang === 'bn' ? 'ভয়েসে প্রশ্ন বলুন...' : 'Speak Your Query...'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {lang === 'bn' ? 'বাংলা বা ইংরেজিতে আপনার ওষুধের নাম বলুন' : 'Speak in Bengali or English'}
          </p>
        </div>

        {spokenText && (
          <div className="p-3 bg-maternal-50 rounded-2xl border border-maternal-200 text-maternal-800 text-sm font-semibold flex items-center justify-center space-x-2">
            <Volume2 className="w-4 h-4 animate-pulse text-maternal-600" />
            <span>"{spokenText}"</span>
          </div>
        )}

        {/* Quick Voice Demo Options */}
        <div className="pt-2 text-left space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
            {lang === 'bn' ? 'নমুনা ভয়েস ট্যাপ করুন (ডেমো)' : 'Tap Sample Voice Query (Demo)'}
          </span>
          <div className="space-y-1.5">
            {sampleVoices.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulateVoice(sample)}
                className="w-full text-left p-2.5 rounded-xl bg-white border border-gray-200 hover:border-maternal-400 text-xs font-medium text-gray-700 hover:text-maternal-700 flex items-center justify-between transition-colors shadow-xs"
              >
                <span>{lang === 'bn' ? sample.textBn : sample.textEn}</span>
                <Sparkles className="w-3.5 h-3.5 text-maternal-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputModal;
